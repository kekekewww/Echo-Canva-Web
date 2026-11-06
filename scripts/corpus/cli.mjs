#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  aggregateSha256,
  canonicalize,
  compareOutputs,
  sha256Hex,
  summarizeReports,
  verifyCorpus,
} from "./lib.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const DEFAULT_CORPUS = path.join(REPO, "benchmarks/corpus/v1");
const VALUE_FLAGS = new Set(["run-id", "order", "out", "json", "evidence", "frozen-on", "corpus"]);
const BOOLEAN_FLAGS = new Set(["require-frozen"]);

class UsageError extends Error {}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positional = [];
  const flags = new Map();
  for (let index = 0; index < rest.length; index++) {
    const arg = rest[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (BOOLEAN_FLAGS.has(name)) {
      flags.set(name, true);
    } else if (VALUE_FLAGS.has(name)) {
      const value = rest[index + 1];
      if (value === undefined || value.startsWith("--")) throw new UsageError(`--${name} needs a value`);
      flags.set(name, value);
      index += 1;
    } else {
      throw new UsageError(`Unknown option --${name}`);
    }
  }
  return { command, positional, flags };
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function corpusPaths(flags) {
  const corpusDir = flags.has("corpus") ? path.resolve(flags.get("corpus")) : DEFAULT_CORPUS;
  return {
    corpusDir,
    manifestFile: path.join(corpusDir, "manifest.json"),
    manifest: () => readJson(path.join(corpusDir, "manifest.json")),
    rules: (manifest) => readJson(path.join(corpusDir, manifest.rules.path)),
  };
}

function inCorpus(corpusDir, manifestPath) {
  return path.join(corpusDir, manifestPath.replace(/^benchmarks\/corpus\/v1\//, ""));
}

function without(object, key) {
  return Object.fromEntries(Object.entries(object).filter(([name]) => name !== key));
}

// ---------------------------------------------------------------------------
// verify
// ---------------------------------------------------------------------------

function commandVerify(flags) {
  const { corpusDir } = corpusPaths(flags);
  const result = verifyCorpus(corpusDir, { requireFrozen: flags.has("require-frozen") });
  if (!result.ok) {
    for (const problem of result.problems) console.error(`problem: ${problem}`);
    console.error(`corpus verification failed: ${result.problems.length} problem(s)`);
    return 1;
  }
  console.log(`corpus ok: ${result.caseCount} cases, manifest sha256 ${result.corpusSha256}`);
  return 0;
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

function runOnce({ runId, order, out, corpusDir }) {
  if (!/^[A-Za-z0-9._-]+$/.test(runId)) throw new UsageError("--run-id may contain letters, digits, '.', '_' and '-' only");
  if (order !== "manifest" && order !== "reverse") throw new UsageError("--order must be manifest or reverse");
  const runDir = path.join(out, runId);
  const vitest = path.join(REPO, "node_modules/vitest/vitest.mjs");
  const result = spawnSync(
    process.execPath,
    [vitest, "run", "--config", "vitest.corpus.config.ts", "tests/corpus/run.corpus.ts"],
    {
      cwd: REPO,
      stdio: "inherit",
      env: {
        ...process.env,
        ECHO_CORPUS_RUN_DIR: runDir,
        ECHO_CORPUS_ORDER: order,
        ECHO_CORPUS_DIR: corpusDir,
      },
    },
  );
  if (result.status !== 0 || !existsSync(path.join(runDir, "run.json"))) {
    throw new Error(`run ${runId} failed (exit ${result.status ?? "signal"})`);
  }
  return { runDir, runJson: readJson(path.join(runDir, "run.json")) };
}

function commandRun(flags) {
  const runId = flags.get("run-id");
  if (runId === undefined) throw new UsageError("run needs --run-id <id>");
  const { corpusDir } = corpusPaths(flags);
  const out = path.resolve(flags.get("out") ?? path.join(REPO, ".corpus-runs"));
  const { runJson } = runOnce({ runId, order: flags.get("order") ?? "manifest", out, corpusDir });
  console.log(`run ${runId}: aggregateSha256 ${runJson.aggregateSha256}`);
  return 0;
}

// ---------------------------------------------------------------------------
// compare
// ---------------------------------------------------------------------------

function loadOutputs(spec, paths, manifest) {
  const outputs = new Map();
  if (spec === "expected") {
    for (const entry of manifest.cases) {
      outputs.set(entry.id, readFileSync(inCorpus(paths.corpusDir, entry.expected.path)));
    }
    return { label: "expected", outputs };
  }
  const dir = path.join(path.resolve(spec), "outputs");
  if (!existsSync(dir)) throw new UsageError(`${path.basename(path.resolve(spec))} has no outputs directory`);
  for (const name of readdirSync(dir)) {
    if (name.endsWith(".json")) outputs.set(name.slice(0, -".json".length), readFileSync(path.join(dir, name)));
  }
  return { label: path.basename(path.resolve(spec)), outputs };
}

function hashesOf(outputs) {
  return Object.fromEntries([...outputs].map(([id, bytes]) => [id, sha256Hex(bytes)]));
}

/** `actual` is the run under test; `reference` is what it is held against. */
function compareSets(actual, reference, manifest, rules) {
  const reports = [];
  const missing = [];
  for (const entry of manifest.cases) {
    const actualBytes = actual.outputs.get(entry.id);
    const referenceBytes = reference.outputs.get(entry.id);
    if (actualBytes === undefined || referenceBytes === undefined) {
      missing.push({ caseId: entry.id, missingFrom: actualBytes === undefined ? actual.label : reference.label });
      continue;
    }
    reports.push(
      compareOutputs(
        JSON.parse(referenceBytes.toString("utf8")),
        JSON.parse(actualBytes.toString("utf8")),
        rules,
        { caseId: entry.id, kind: entry.kind },
      ),
    );
  }
  const known = new Set(manifest.cases.map(({ id }) => id));
  // A stale output on either side is a problem, not only in the run under test.
  const extra = [...new Set([...actual.outputs.keys(), ...reference.outputs.keys()])]
    .filter((id) => !known.has(id))
    .sort();
  const summary = summarizeReports(reports);
  return {
    actual: actual.label,
    reference: reference.label,
    ok: summary.ok && missing.length === 0 && extra.length === 0,
    caseCount: summary.caseCount,
    aggregateSha256: {
      actual: aggregateSha256(hashesOf(actual.outputs)),
      reference: aggregateSha256(hashesOf(reference.outputs)),
    },
    bitExactCases: summary.bitExactCases,
    negativeZeroLeafCount: summary.negativeZeroLeafCount,
    violationCount: summary.violationCount,
    firstViolations: summary.firstViolations,
    stats: summary.stats,
    failingCases: reports.filter((report) => !report.ok).map((report) => ({
      caseId: report.caseId,
      violationCount: report.violations.length,
    })),
    missing,
    extra,
    reports: reports.filter((report) => !report.ok).map((report) => without(report, "samples")),
  };
}

function printComparison(result) {
  const verdict = result.ok ? "ok" : "FAILED";
  console.log(
    `${result.actual} vs ${result.reference}: ${verdict} cases=${result.caseCount} bitExact=${result.bitExactCases}/${result.caseCount}` +
      ` violations=${result.violationCount} missing=${result.missing.length} extra=${result.extra.length}` +
      ` aggregate=${result.aggregateSha256.actual === result.aggregateSha256.reference ? "identical" : "different"}`,
  );
  for (const violation of result.firstViolations.slice(0, 5)) {
    console.log(`  ${violation.caseId} ${violation.type} ${violation.path} ${violation.detail ?? ""}`);
  }
}

function commandCompare(flags, positional) {
  if (positional.length !== 2) throw new UsageError("compare needs <dirA> <dirB|expected>");
  const paths = corpusPaths(flags);
  const manifest = paths.manifest();
  const rules = paths.rules(manifest);
  const result = compareSets(
    loadOutputs(positional[0], paths, manifest),
    loadOutputs(positional[1], paths, manifest),
    manifest,
    rules,
  );
  printComparison(result);
  if (flags.has("json")) {
    writeFileSync(path.resolve(flags.get("json")), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result.ok ? 0 : 1;
}

// ---------------------------------------------------------------------------
// rerun
// ---------------------------------------------------------------------------

function commandRerun(flags) {
  const paths = corpusPaths(flags);
  const verification = verifyCorpus(paths.corpusDir);
  if (!verification.ok) {
    for (const problem of verification.problems) console.error(`problem: ${problem}`);
    console.error("corpus verification failed; not rerunning");
    return 1;
  }
  const manifest = paths.manifest();
  const rules = paths.rules(manifest);
  const out = path.resolve(flags.get("out") ?? path.join(REPO, ".corpus-runs/rerun"));
  mkdirSync(out, { recursive: true });

  const runs = {};
  for (const [runId, order] of [["A", "manifest"], ["B", "manifest"], ["C", "reverse"]]) {
    runs[runId] = runOnce({ runId, order, out, corpusDir: paths.corpusDir });
  }
  const sets = Object.fromEntries(
    Object.entries(runs).map(([runId, { runDir }]) => [runId, loadOutputs(runDir, paths, manifest)]),
  );
  const expected = loadOutputs("expected", paths, manifest);
  const pairs = [["A", "B"], ["A", "expected"], ["B", "expected"], ["C", "expected"]];
  const comparisons = pairs.map(([left, right]) => {
    const result = compareSets(sets[left], right === "expected" ? expected : sets[right], manifest, rules);
    return { pair: `${left}-${right}`, ...result };
  });
  for (const comparison of comparisons) printComparison(comparison);

  const aggregates = Object.fromEntries(Object.entries(runs).map(([runId, { runJson }]) => [runId, runJson.aggregateSha256]));
  const aggregatesIdentical = new Set(Object.values(aggregates)).size === 1;
  console.log(`aggregateSha256 A=${aggregates.A} B=${aggregates.B} C=${aggregates.C} identical=${aggregatesIdentical}`);
  const ok = comparisons.every((comparison) => comparison.ok) && aggregatesIdentical;

  if (flags.has("evidence")) {
    const evidence = {
      corpusSha256: verification.corpusSha256,
      aggregatesIdentical,
      ok,
      runs: Object.fromEntries(
        Object.entries(runs).map(([runId, { runJson }]) => [runId, without(runJson, "caseHashes")]),
      ),
      comparisons: comparisons.map((comparison) => without(comparison, "reports")),
    };
    writeFileSync(path.resolve(flags.get("evidence")), `${JSON.stringify(evidence, null, 2)}\n`);
  }
  return ok ? 0 : 1;
}

// ---------------------------------------------------------------------------
// freeze and refresh-rules-hash
// ---------------------------------------------------------------------------

function writeRulesHash(paths, manifest) {
  const rulesText = readFileSync(path.join(paths.corpusDir, manifest.rules.path));
  const next = { ...manifest, rules: { ...manifest.rules, sha256: sha256Hex(rulesText) } };
  writeFileSync(paths.manifestFile, canonicalize(next).text);
  return next.rules.sha256;
}

function readCanonicalManifest(paths) {
  const text = readFileSync(paths.manifestFile, "utf8");
  const manifest = JSON.parse(text);
  if (canonicalize(manifest).text !== text) {
    throw new Error("manifest.json is not in canonical form; refusing to rewrite it");
  }
  return manifest;
}

function commandRefreshRulesHash(flags) {
  const paths = corpusPaths(flags);
  const manifest = readCanonicalManifest(paths);
  const rules = readJson(path.join(paths.corpusDir, manifest.rules.path));
  if (rules.status === "frozen") {
    console.error(
      "rules are frozen; refusing to rehash them. A changed tolerance or a new case needs a new corpus version.",
    );
    return 1;
  }
  const hash = writeRulesHash(paths, manifest);
  console.log(`rules.sha256 ${hash}`);
  return 0;
}

function commandFreeze(flags) {
  const date = flags.get("frozen-on");
  if (date === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new UsageError("freeze needs --frozen-on <YYYY-MM-DD>");
  }
  const paths = corpusPaths(flags);
  const verification = verifyCorpus(paths.corpusDir);
  if (!verification.ok) {
    for (const problem of verification.problems) console.error(`problem: ${problem}`);
    console.error("corpus verification failed; not freezing");
    return 1;
  }
  const manifest = readCanonicalManifest(paths);
  const rulesFile = path.join(paths.corpusDir, manifest.rules.path);
  const rulesText = readFileSync(rulesFile, "utf8");
  const rules = JSON.parse(rulesText);
  if (rules.status === "frozen") {
    console.error("rules are already frozen");
    return 1;
  }
  const undecided = Object.entries(rules.classes)
    .filter(([, fieldClass]) => !["discrete", "existing-test", "approved"].includes(fieldClass.status))
    .map(([name, fieldClass]) => `${name} (${fieldClass.status})`);
  if (undecided.length > 0) {
    console.error(`cannot freeze: ${undecided.length} class(es) not decided: ${undecided.join(", ")}`);
    return 1;
  }
  const frozen = rulesText
    .replace(/^ {2}"status": "draft",$/m, '  "status": "frozen",')
    .replace(/^ {2}"frozenOn": null,$/m, `  "frozenOn": "${date}",`);
  const reparsed = JSON.parse(frozen);
  if (reparsed.status !== "frozen" || reparsed.frozenOn !== date) {
    console.error("cannot freeze: could not rewrite the status lines of the rules file");
    return 1;
  }
  writeFileSync(rulesFile, frozen);
  const hash = writeRulesHash(paths, manifest);
  console.log(`frozen on ${date}; rules.sha256 ${hash}`);
  return 0;
}

// ---------------------------------------------------------------------------

function main() {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));
  switch (command) {
    case "verify":
      return commandVerify(flags);
    case "run":
      return commandRun(flags);
    case "compare":
      return commandCompare(flags, positional);
    case "rerun":
      return commandRerun(flags);
    case "freeze":
      return commandFreeze(flags);
    case "refresh-rules-hash":
      return commandRefreshRulesHash(flags);
    default:
      throw new UsageError(
        "usage: cli.mjs verify [--require-frozen] | run --run-id <id> [--order manifest|reverse] [--out <dir>] | " +
          "compare <dirA> <dirB|expected> [--json <path>] | rerun [--out <dir>] [--evidence <path>] | " +
          "freeze --frozen-on <YYYY-MM-DD> | refresh-rules-hash   (all accept --corpus <dir>)",
      );
  }
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = error instanceof UsageError ? 2 : 1;
}
