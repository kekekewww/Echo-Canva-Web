#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { collectGitInfo, verifyCorpus } from "../corpus/lib.mjs";
import { buildBundle } from "./bundle.mjs";
import { overheadComparisons, pairedDifferences, parityRows, renderComparisons } from "./compare.mjs";
import { computeCheckFromDump } from "./derive-app.mjs";
import { poolComputeCheck } from "./derive-pool.mjs";
import { rederiveRun } from "./rederive.mjs";
import { collectEnvironment, sampleOtherActivity } from "./env.mjs";
import { analyzeTrace, rankJobs } from "./trace-analyze.mjs";
import {
  BOUNDARIES,
  NOT_APPLICABLE,
  PASSES,
  RUN_ID_PATTERN,
  UNAVAILABLE,
  artifactsSha256,
  assertInsideRepo,
  buildGroups,
  executeRun,
  parseJsonl,
  readJson,
  latestRunIndex,
  readRunIndex,
  renderTables,
  sanitizeText,
  scanPaths,
  serializeJsonl,
  sha256File,
  sha256Text,
  summarizeSamples,
  tempEnvironment,
  verifyWorkloads,
  writeJson,
} from "./lib.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const DEFAULT_CORPUS_MANIFEST = "benchmarks/corpus/v1/manifest.json";
const WORKLOAD_DIR = "benchmarks/perf/workloads/v1";
const DEFAULT_OUT = ".perf-runs/runs";
const TAPE_KINDS = { "classic-tape": "classic", "hybrid-tape": "hybrid" };
const PHASES_BY_MODE = {
  classic: ["static.build", "pose.snapshot", "room.estimate", "solve", "assemble", "job.total"],
  hybrid: ["static.compile", "pose.snapshot", "solve", "assemble", "job.total"],
};

class UsageError extends Error {}

const RUN_FLAGS = new Set([
  "variant", "case", "corpus-manifest", "run-id", "repeat", "out", "boundary", "pass", "audio",
  "samples", "driver", "browser-channel", "hardware-concurrency", "build", "order-index", "plan", "ts-s-path", "max-duration-ms", "step-timeout-ms",
]);
const BOOLEAN_FLAGS = new Set(["parity", "check", "with-slices"]);
const COMMAND_FLAGS = {
  "verify-corpus": new Set(["corpus-manifest"]),
  "generate-workloads": new Set(["check"]),
  run: new Set([...RUN_FLAGS, ...BOOLEAN_FLAGS]),
  summarize: new Set(["out", "to", "with-slices"]),
  analyze: new Set(["out", "top"]),
  rederive: new Set(),
  scan: new Set(),
};

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const allowed = COMMAND_FLAGS[command];
  if (!allowed) throw new UsageError(`Unknown command ${command ?? "(none)"}. Use verify-corpus, generate-workloads, run, summarize, analyze, rederive or scan.`);
  const positional = [];
  const flags = new Map();
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (!allowed.has(name)) throw new UsageError(`Unknown option --${name} for ${command}`);
    if (BOOLEAN_FLAGS.has(name)) {
      flags.set(name, true);
    } else {
      const value = rest[index + 1];
      if (value === undefined || value.startsWith("--")) throw new UsageError(`--${name} needs a value`);
      flags.set(name, value);
      index += 1;
    }
  }
  return { command, positional, flags };
}

/** A path argument that must stay inside the repository; anything else is a usage error. */
function insideRepo(value, label) {
  try {
    return assertInsideRepo(path.resolve(REPO, value), label, REPO);
  } catch (error) {
    throw new UsageError(error.message);
  }
}

function safeTemp() {
  try {
    return tempEnvironment(REPO);
  } catch (error) {
    throw new UsageError(error.message);
  }
}

function repoRelative(file) {
  return path.relative(REPO, file).replaceAll("\\", "/");
}

function corpusPaths(manifestFlag) {
  const manifestFile = path.resolve(REPO, manifestFlag ?? DEFAULT_CORPUS_MANIFEST);
  const corpusDir = path.dirname(manifestFile);
  const inCorpus = (manifestPath) => path.join(corpusDir, manifestPath.replace(/^benchmarks\/corpus\/v1\//, ""));
  return { manifestFile, corpusDir, inCorpus };
}

// ---------------------------------------------------------------------------
// verify-corpus
// ---------------------------------------------------------------------------

function verifyAll(manifestFlag) {
  const { corpusDir } = corpusPaths(manifestFlag);
  const corpus = verifyCorpus(corpusDir, { requireFrozen: true });
  const workloads = verifyWorkloads(path.join(REPO, WORKLOAD_DIR));
  return { corpus, workloads };
}

function commandVerifyCorpus(flags) {
  const { corpus, workloads } = verifyAll(flags.get("corpus-manifest"));
  let failed = false;
  if (corpus.ok) {
    console.log(`corpus ok: ${corpus.caseCount} cases, manifest sha256 ${corpus.corpusSha256}`);
  } else {
    failed = true;
    for (const problem of corpus.problems) console.error(`corpus problem: ${problem}`);
  }
  if (workloads.ok) {
    console.log(`workloads ok: ${workloads.fileCount} files, manifest sha256 ${workloads.manifestSha256}`);
  } else {
    failed = true;
    for (const problem of workloads.problems) console.error(`workloads problem: ${problem}`);
  }
  return failed ? 1 : 0;
}

// ---------------------------------------------------------------------------
// generate-workloads
// ---------------------------------------------------------------------------

/** Regenerates into a scratch directory and compares bytes with workloads/v1. Writes nothing there. */
function checkWorkloads(bundle) {
  const committedDir = path.join(REPO, WORKLOAD_DIR);
  const scratch = path.join(REPO, ".perf-runs", "workloads-check");
  rmSync(scratch, { recursive: true, force: true });
  try {
    const committedManifest = readJson(path.join(committedDir, "manifest.json"));
    const result = spawnSync(process.execPath, [path.join(bundle.dir, "generate-workloads.mjs")], {
      cwd: REPO,
      stdio: ["ignore", "ignore", "inherit"],
      env: {
        ...process.env,
        ...safeTemp(),
        ECHO_PERF_GENERATE: "1",
        ECHO_PERF_OUT_DIR: repoRelative(scratch),
        ECHO_PERF_SOURCE_COMMIT: committedManifest.sourceCommit,
      },
    });
    if (result.status !== 0) return result.status ?? 1;
    const names = new Set([...readdirSync(committedDir), ...readdirSync(scratch)]);
    const differing = [...names].filter((name) => {
      const left = existsSync(path.join(committedDir, name)) ? readFileSync(path.join(committedDir, name)) : null;
      const right = existsSync(path.join(scratch, name)) ? readFileSync(path.join(scratch, name)) : null;
      return left === null || right === null || !left.equals(right);
    });
    if (differing.length > 0) {
      console.error(`workloads differ from a fresh generation: ${differing.sort().join(", ")}`);
      return 1;
    }
    console.log(`workloads match a fresh generation: ${names.size} files byte for byte`);
    return 0;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

async function commandGenerateWorkloads(flags) {
  const check = flags.has("check");
  if (!check && process.env.ECHO_PERF_UPDATE !== "1") {
    throw new UsageError("Refusing to write workloads: set ECHO_PERF_UPDATE=1.");
  }
  const bundle = await buildBundle(REPO, "generate-workloads");
  if (check) return checkWorkloads(bundle);
  const head = collectGitInfo(REPO, null).gitHead;
  if (head === UNAVAILABLE) throw new Error("git HEAD is unavailable; the workload manifest records the source commit.");
  const result = spawnSync(process.execPath, [path.join(bundle.dir, "generate-workloads.mjs")], {
    cwd: REPO,
    stdio: "inherit",
    env: { ...process.env, ...safeTemp(), ECHO_PERF_GENERATE: "1", ECHO_PERF_SOURCE_COMMIT: head },
  });
  return result.status ?? 1;
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

function positiveInteger(value, name) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new UsageError(`${name} must be an integer >= 1`);
  return number;
}

const POOL_PHASES = {
  "TS-W-clean": ["pool.compute-metric", "job.submit-to-accepted", "queue.wait", "dispatch.prepare", "shard.compute", "shard.roundtrip", "merge.assemble", "job.phase-residual"],
  "TS-W-bare": ["pool.compute-metric", "job.submit-to-accepted"],
  "TS-S-fallback": ["pool.compute-metric", "job.submit-to-accepted", "queue.wait"],
};

function normalizeEntry(raw, globals) {
  const get = (name) => raw[name] ?? globals.get(name);
  const optionalNumber = (name, minimum) => {
    const value = get(name);
    if (value === undefined) return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number < minimum) throw new UsageError(`--${name} must be a number >= ${minimum}`);
    return number;
  };
  const entry = {
    variant: get("variant"),
    case: get("case"),
    runId: get("run-id"),
    repeat: positiveInteger(get("repeat") ?? 1, "--repeat"),
    boundary: get("boundary") ?? "node-core",
    pass: get("pass") ?? "clean",
    audio: get("audio") ?? NOT_APPLICABLE,
    driver: get("driver") ?? NOT_APPLICABLE,
    browserChannel: get("browser-channel") ?? NOT_APPLICABLE,
    parity: raw.parity === true || (globals.get("parity") === true && raw.parity !== false),
    corpusManifest: get("corpus-manifest"),
    orderIndex: get("order-index") === undefined ? undefined : Number(get("order-index")),
    build: get("build") ?? NOT_APPLICABLE,
    hardwareConcurrency: optionalNumber("hardware-concurrency", 1),
    tsSPath: get("ts-s-path") ?? "decomposed",
    maxDurationMs: optionalNumber("max-duration-ms", 1),
    stepTimeoutMs: optionalNumber("step-timeout-ms", 3000) ?? 10_000,
    samples: positiveInteger(get("samples") ?? 24, "--samples"),
  };
  if (!entry.variant || !entry.case || !entry.runId) throw new UsageError("run needs --variant, --case and --run-id");
  if (!RUN_ID_PATTERN.test(entry.runId)) throw new UsageError("--run-id may contain letters, digits, '.', '_' and '-' only");
  if (!BOUNDARIES.includes(entry.boundary)) throw new UsageError(`--boundary must be one of ${BOUNDARIES.join(", ")}`);
  if (!PASSES.includes(entry.pass)) throw new UsageError(`--pass must be one of ${PASSES.join(", ")}`);
  if (!["TS-S", "TS-W"].includes(entry.variant)) throw new UsageError("--variant must be TS-S or TS-W");
  if (!["decomposed", "fallback"].includes(entry.tsSPath)) throw new UsageError("--ts-s-path must be decomposed or fallback");
  if (entry.parity && entry.repeat !== 1) throw new UsageError("--parity is one replay with no timing; leave --repeat at 1");
  const workload = /^W0\d_/.test(entry.case);
  const appCase = /^APP_/.test(entry.case);
  const controls = entry.case === "CONTROLS";
  if (entry.browserChannel !== NOT_APPLICABLE) {
    if (entry.boundary !== "browser-app" && entry.boundary !== "browser-pool") throw new UsageError("--browser-channel applies at browser-app and browser-pool only");
    if (entry.pass === "stock") throw new UsageError("--browser-channel does not apply to pass stock: the stock spec launches its own browser");
    if (!["default", "chromium"].includes(entry.browserChannel)) throw new UsageError("--browser-channel must be default or chromium");
  } else if ((entry.boundary === "browser-app" || entry.boundary === "browser-pool") && entry.pass !== "stock") {
    entry.browserChannel = "default";
  }
  if (entry.boundary !== "browser-app" && entry.driver !== NOT_APPLICABLE) throw new UsageError("--driver applies at browser-app only");
  if (entry.boundary !== "browser-app" && entry.audio !== NOT_APPLICABLE) throw new UsageError("--audio applies at browser-app only");
  if (entry.boundary === "node-core") {
    if (entry.variant !== "TS-S") throw new UsageError("TS-W needs workers; use --boundary browser-pool");
    if (!["clean", "traced", "alloc"].includes(entry.pass)) throw new UsageError(`pass ${entry.pass} does not exist at node-core; use clean, traced or alloc`);
    if (workload || appCase || controls) throw new UsageError("this case does not run at node-core");
  } else if (entry.boundary === "browser-pool") {
    if (appCase) throw new UsageError("APP_ cases run at browser-app");
    if (entry.pass === "stock") throw new UsageError("pass stock is the existing Playwright spec; it runs at browser-app");
    if (entry.variant === "TS-S" && entry.pass === "bare") throw new UsageError("pass bare is TS-W only");
    if (entry.variant === "TS-S" && workload) entry.tsSPath = "fallback";
    if (entry.parity && (workload || controls)) throw new UsageError("--parity needs a frozen corpus tape");
    if (entry.variant === "TS-W" && entry.tsSPath === "fallback") throw new UsageError("--ts-s-path applies to TS-S only");
    if (controls && entry.pass !== "traced") throw new UsageError("CONTROLS needs --pass traced: the controls are read from the trace");
  } else {
    if (!appCase && !controls) throw new UsageError("browser-app runs APP_H100_SWITCH, APP_C_DRAG or CONTROLS");
    if (entry.audio === NOT_APPLICABLE) entry.audio = "on";
    if (!["on", "off"].includes(entry.audio)) throw new UsageError("--audio must be on or off");
    if (entry.driver === NOT_APPLICABLE) entry.driver = "poll";
    if (!["poll", "immediate"].includes(entry.driver)) throw new UsageError("--driver must be poll or immediate");
    if (entry.driver === "immediate" && entry.pass === "stock") throw new UsageError("--driver does not apply to pass stock: the stock spec has its own driver");
    if (entry.pass === "bare") throw new UsageError("pass bare is a browser-pool pass");
    if (entry.pass === "stock") {
      if (entry.variant !== "TS-W" || controls) throw new UsageError("pass stock is the existing spec: TS-W, APP_ cases only");
      entry.audio = "on";
    }
    if (controls && entry.pass !== "traced") throw new UsageError("CONTROLS needs --pass traced: the controls are read from the trace");
    if (entry.parity) throw new UsageError("--parity does not apply in-app");
  }
  return entry;
}

function resolveCase(entry) {
  if (/^APP_/.test(entry.case) || entry.case === "CONTROLS") {
    const mode = entry.case === "APP_H100_SWITCH" ? "hybrid" : "classic";
    return { app: true, controls: entry.case === "CONTROLS", mode, replay: entry.case === "APP_C_DRAG" ? "open" : "closed" };
  }
  if (/^W0\d_/.test(entry.case)) {
    const dir = path.join(REPO, WORKLOAD_DIR);
    const manifest = readJson(path.join(dir, "manifest.json"));
    const found = manifest.cases.find((item) => item.id === entry.case);
    if (!found) throw new UsageError(`Case ${entry.case} is not in the workloads manifest`);
    return { workload: true, found, manifest, mode: found.mode, replay: "open", dir };
  }
  const paths = corpusPaths(entry.corpusManifest);
  const manifest = readJson(paths.manifestFile);
  const found = manifest.cases.find((item) => item.id === entry.case);
  if (!found) throw new UsageError(`Case ${entry.case} is not in the corpus manifest`);
  const mode = TAPE_KINDS[found.kind];
  if (!mode) {
    throw new UsageError(`Case ${entry.case} is a ${found.kind} case; runs use the four frozen tapes (TC01, TC02, TH01, TH02) and the W cases`);
  }
  return { workload: false, paths, manifest, found, mode, replay: "closed" };
}

function caseSpecFor(context, entry) {
  if (context.app) return { caseId: entry.case, kind: context.controls ? "controls" : "app", mode: context.mode };
  if (context.workload) {
    return {
      caseId: entry.case,
      kind: "workload",
      mode: context.mode,
      inputPath: repoRelative(path.join(context.dir, context.found.tape)),
      scenePath: repoRelative(path.join(context.dir, context.found.scene)),
    };
  }
  return {
    caseId: entry.case,
    kind: context.found.kind,
    mode: context.mode,
    inputPath: repoRelative(context.paths.inCorpus(context.found.input.path)),
    expectedPath: repoRelative(context.paths.inCorpus(context.found.expected.path)),
    rulesPath: repoRelative(path.join(context.paths.corpusDir, context.manifest.rules.path)),
  };
}

function writeInputManifest(runDir, context, entry, bundle, workloads) {
  let caseBlock;
  let corpus;
  let manifestForGit = null;
  if (context.app) {
    caseBlock = { id: entry.case, kind: context.controls ? "controls" : "app", mode: context.mode, audio: entry.audio, samples: entry.samples, maxDurationMs: entry.maxDurationMs ?? NOT_APPLICABLE };
    corpus = { note: "not used by this case" };
  } else if (context.workload) {
    const sceneFile = path.join(context.dir, context.found.scene);
    const tapeFile = path.join(context.dir, context.found.tape);
    caseBlock = {
      id: context.found.id,
      kind: "workload",
      mode: context.mode,
      replay: "open",
      scenePath: repoRelative(sceneFile),
      sceneSha256: sha256File(sceneFile),
      tapePath: repoRelative(tapeFile),
      tapeSha256: sha256File(tapeFile),
      maxDurationMs: entry.maxDurationMs ?? NOT_APPLICABLE,
    };
    corpus = { note: "not used by this case" };
  } else {
    const { paths, manifest, found } = context;
    const inputFile = paths.inCorpus(found.input.path);
    const expectedFile = paths.inCorpus(found.expected.path);
    manifestForGit = manifest.baseline;
    corpus = {
      manifestPath: repoRelative(paths.manifestFile),
      manifestSha256: sha256File(paths.manifestFile),
      rulesSha256: sha256File(path.join(paths.corpusDir, manifest.rules.path)),
    };
    caseBlock = {
      id: found.id,
      kind: found.kind,
      mode: context.mode,
      replay: "closed",
      inputPath: repoRelative(inputFile),
      inputSha256: sha256File(inputFile),
      expectedPath: repoRelative(expectedFile),
      expectedSha256: sha256File(expectedFile),
    };
  }
  writeJson(path.join(runDir, "input-manifest.json"), {
    schema: "ec102.input-manifest.v1",
    corpus,
    case: caseBlock,
    workloads: { manifestSha256: workloads.manifestSha256, files: workloads.fileCount },
    git: collectGitInfo(REPO, manifestForGit),
    bundle: bundle.build
      ? { kind: bundle.kind, buildId: bundle.build.buildId, staticSha256: bundle.build.staticSha256, note: "the production Next build in .next; its worker code is the production bundle, unlike the Vite bundle used at browser-pool" }
      : { kind: bundle.kind, sha256: bundle.sha256, viteVersion: bundle.viteVersion, workerChecks: bundle.workerChecks },
    options: {
      hardwareConcurrency: entry.hardwareConcurrency ?? NOT_APPLICABLE,
      stepTimeoutMs: entry.stepTimeoutMs,
      tsSPath: entry.variant === "TS-S" ? entry.tsSPath : NOT_APPLICABLE,
    },
  });
}

function spawnRunner(script, runDir, extraNodeArgs) {
  const out = openSync(path.join(runDir, "stdout.log"), "w");
  const err = openSync(path.join(runDir, "stderr.log"), "w");
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [...extraNodeArgs, path.join(REPO, "scripts/perf", script), "--config", path.join(runDir, "runner-config.json")],
      { cwd: REPO, stdio: ["ignore", out, err], env: { ...process.env, ...safeTemp() }, windowsHide: true },
    );
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code, signal }));
  }).finally(() => {
    closeSync(out);
    closeSync(err);
  });
}

/** Aggregate SHA-256 of .next/static, recorded with every in-app run. */
function nextStaticHash() {
  const lines = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), relative);
      else lines.push(`${relative}\u0000${sha256File(path.join(dir, entry.name))}`);
    }
  };
  walk(path.join(REPO, ".next", "static"), "");
  return sha256Text(lines.join("\n"));
}

function expectedPhases(entry, context) {
  if (context.app) {
    if (context.controls) return [];
    if (entry.pass === "stock") return ["app.worker-compute-metric"];
    return entry.case === "APP_H100_SWITCH" ? ["app.worker-compute-metric", "app.input-to-commit"] : ["app.worker-compute-metric"];
  }
  if (entry.boundary === "node-core" || (entry.variant === "TS-S" && entry.tsSPath === "decomposed")) return PHASES_BY_MODE[context.mode];
  if (entry.variant === "TS-S") return POOL_PHASES["TS-S-fallback"];
  return POOL_PHASES[entry.pass === "bare" ? "TS-W-bare" : "TS-W-clean"];
}

async function runEntry(entry, index, outDir, prep) {
  const context = resolveCase(entry);
  const pool = entry.boundary === "browser-pool";
  const app = entry.boundary === "browser-app";
  const meta = {
    runId: entry.runId,
    variant: entry.variant,
    case: entry.case,
    pass: entry.pass,
    boundary: entry.boundary,
    workers: NOT_APPLICABLE,
    audio: app ? entry.audio : NOT_APPLICABLE,
    driver: app ? (entry.pass === "stock" ? "stock-poll" : entry.driver) : NOT_APPLICABLE,
    browserChannel: entry.browserChannel,
    build: app ? "prod" : entry.build,
    parity: entry.parity,
  };
  const bundleKind = app ? "next-build" : pool ? (entry.pass === "bare" ? "pool-bare" : "pool") : "node";
  return executeRun({
    outDir,
    meta,
    orderIndex: entry.orderIndex ?? index,
    execute: async ({ runDir }) => {
      const bundle = await prep.bundleFor(bundleKind);
      writeInputManifest(runDir, context, entry, bundle, prep.workloads);
      const environment = await collectEnvironment(REPO);
      const before = entry.parity ? NOT_APPLICABLE : await sampleOtherActivity(3);

      const caseSpec = caseSpecFor(context, entry);
      const config = {
        runId: entry.runId,
        pass: entry.pass,
        variant: entry.variant,
        repeat: entry.repeat,
        parity: entry.parity,
        runDir: runDirFor(runDir),
        replay: context.replay,
        caseSpec,
        audio: app ? entry.audio : NOT_APPLICABLE,
        driver: app ? entry.driver : NOT_APPLICABLE,
        browserChannel: entry.browserChannel,
        samples: entry.samples,
        maxDurationMs: entry.maxDurationMs,
        hardwareConcurrency: entry.hardwareConcurrency,
        ...(app
          ? { nodeBundlePath: repoRelative(path.join((await prep.bundleFor("node")).dir, "node-entry.mjs")) }
          : pool
          ? {
              bundleDir: repoRelative(bundle.dir),
              pageFile: bundle.page,
              hardwareConcurrency: entry.hardwareConcurrency,
              tsSPath: entry.variant === "TS-S" ? entry.tsSPath : NOT_APPLICABLE,
              maxDurationMs: entry.maxDurationMs,
              stepTimeoutMs: entry.stepTimeoutMs,
            }
          : { bundlePath: repoRelative(path.join(bundle.dir, "node-entry.mjs")) }),
      };
      writeJson(path.join(runDir, "runner-config.json"), config);
      const nodeArgs = [];
      // Node profiler flags describe the measured process, which is the Node process only at node-core.
      if (entry.pass === "traced" && !pool && !app) nodeArgs.push("--cpu-prof", `--cpu-prof-dir=${runDirFor(runDir)}`);
      if (entry.pass === "alloc" && !pool && !app) nodeArgs.push("--heap-prof", `--heap-prof-dir=${runDirFor(runDir)}`);
      const script = app ? (entry.pass === "stock" ? "runner-stock.mjs" : "runner-app.mjs") : pool ? "runner-pool.mjs" : "runner-node.mjs";
      const exit = await spawnRunner(script, runDir, nodeArgs);
      const after = entry.parity ? NOT_APPLICABLE : await sampleOtherActivity(3);
      const factsFile = path.join(runDir, "browser-facts.json");
      writeJson(path.join(runDir, "environment.json"), {
        ...environment,
        browser: existsSync(factsFile) ? readJson(factsFile) : NOT_APPLICABLE,
        otherActivity: { before, after },
      });

      const resultFile = path.join(runDir, "runner-result.json");
      if (!existsSync(resultFile)) {
        throw new Error(`runner produced no result (exit code ${exit.code}, signal ${exit.signal ?? "none"}); see stderr.log`);
      }
      const result = readJson(resultFile);
      const samples = parseJsonl(readFileSync(path.join(runDir, "samples.jsonl"), "utf8"));
      const summary = summarizeSamples(samples);
      const observedWorkers = result.workers?.reportedByPool?.length === 1 ? result.workers.reportedByPool[0] : NOT_APPLICABLE;
      if (app && entry.variant === "TS-W") {
        const observedCount = Number(result.observed?.workerCountAttribute?.[0]);
        meta.workers = Number.isInteger(observedCount) && observedCount > 0 ? observedCount : NOT_APPLICABLE;
      }
      if (entry.variant === "TS-W" && pool) {
        meta.workers = observedWorkers === NOT_APPLICABLE ? (result.workers?.created || result.workers?.expected || NOT_APPLICABLE) : observedWorkers;
      }
      writeJson(path.join(runDir, "summary.json"), {
        ...summary,
        runId: entry.runId,
        variant: entry.variant,
        case: entry.case,
        pass: entry.pass,
        boundary: entry.boundary,
        workers: meta.workers,
        audio: app ? entry.audio : NOT_APPLICABLE,
        driver: meta.driver,
        browserChannel: entry.browserChannel,
        denominators: result.denominators,
        jobs: result.jobs ?? UNAVAILABLE,
        intervalMs: result.intervalMs ?? UNAVAILABLE,
        clockResolutionMs: result.clockResolutionMs ?? UNAVAILABLE,
        wallMs: result.wallMs ?? UNAVAILABLE,
        parity: result.parity ?? NOT_APPLICABLE,
        repeat: entry.repeat,
        workerCounts: result.workers ?? NOT_APPLICABLE,
        integrity: result.integrity ?? NOT_APPLICABLE,
        shardCompute: result.shardCompute ?? NOT_APPLICABLE,
        phaseSumConsistency: pool && entry.variant === "TS-W" && entry.pass !== "bare"
          ? {
              definition: "job.phase-residual = pool.compute-metric - (prepare + slowest worker path + merge tail); a signed value in ms, reported as measured and never forced to zero",
              jobsWithResidual: result.phaseResidualCount ?? 0,
              residual: summary.phases["job.phase-residual"] ?? NOT_APPLICABLE,
            }
          : NOT_APPLICABLE,
        maxDurationMs: entry.maxDurationMs ?? NOT_APPLICABLE,
        observed: result.observed ?? NOT_APPLICABLE,
        trace: result.trace ?? NOT_APPLICABLE,
        alloc: result.alloc ?? NOT_APPLICABLE,
        controls: result.controls ?? NOT_APPLICABLE,
        stock: result.exit ? { exit: result.exit, command: result.command, build: result.build, metrics: result.metrics ?? NOT_APPLICABLE } : NOT_APPLICABLE,
        build: result.buildId ?? result.build ?? NOT_APPLICABLE,
      });
      const seen = new Set(samples.map((sample) => sample.phase));
      return {
        status: result.status,
        error: result.error,
        sampleCount: samples.length,
        phasesNotReached: entry.parity ? [] : expectedPhases(entry, context).filter((phase) => !seen.has(phase)),
      };
    },
  });
}

function runDirFor(runDir) {
  return path.isAbsolute(runDir) && runDir.startsWith(REPO) ? repoRelative(runDir) : runDir;
}

async function commandRun(flags) {
  const outDir = insideRepo(flags.get("out") ?? DEFAULT_OUT, "--out");
  safeTemp();
  let entries;
  if (flags.has("plan")) {
    const plan = readJson(path.resolve(REPO, flags.get("plan")));
    if (!Array.isArray(plan) || plan.length === 0) throw new UsageError("--plan must be a JSON array with at least one entry");
    entries = plan.map((raw) => normalizeEntry(raw, flags));
  } else {
    entries = [normalizeEntry({}, flags)];
  }
  const ids = new Set();
  for (const entry of entries) {
    if (ids.has(entry.runId)) throw new UsageError(`run id ${entry.runId} appears twice in the plan`);
    ids.add(entry.runId);
    if (existsSync(path.join(outDir, entry.runId))) throw new UsageError(`run directory ${entry.runId} already exists; runs are never overwritten`);
  }

  const { corpus, workloads } = verifyAll(flags.get("corpus-manifest"));
  if (!corpus.ok || !workloads.ok) {
    for (const problem of [...corpus.problems, ...workloads.problems]) console.error(`verification problem: ${problem}`);
    console.error("Refusing to run: the corpus or the workloads do not verify.");
    return 1;
  }
  const bundles = new Map();
  const prep = {
    workloads,
    bundleFor: async (kind) => {
      if (kind === "next-build") {
        const idFile = path.join(REPO, ".next", "BUILD_ID");
        if (!existsSync(idFile)) throw new Error(".next/BUILD_ID is missing; run corepack pnpm build before in-app runs");
        bundles.set(kind, { kind, dir: path.join(REPO, ".next"), build: { buildId: readFileSync(idFile, "utf8").trim(), staticSha256: nextStaticHash() } });
      }
      if (!bundles.has(kind)) bundles.set(kind, await buildBundle(REPO, kind));
      return bundles.get(kind);
    },
  };
  let failures = 0;
  for (const [index, entry] of entries.entries()) {
    const line = await runEntry(entry, index, outDir, prep);
    console.log(`run ${line.runId}: ${line.status}, ${line.sampleCount} samples`);
    if (line.status !== "passed") failures += 1;
  }
  return failures === 0 ? 0 : 3;
}

// ---------------------------------------------------------------------------
// summarize
// ---------------------------------------------------------------------------

function copySanitised(source, target) {
  mkdirSync(path.dirname(target), { recursive: true });
  const text = readFileSync(source, "utf8");
  writeFileSync(target, sanitizeText(text), "utf8");
}

/** Per-run files copied into the evidence directory. Everything else stays in .perf-runs with only a checksum. */
const EVIDENCE_FILES = [
  "run-status.json", "environment.json", "input-manifest.json", "summary.json", "parity-diffs.jsonl", "process-cpu.json",
  "page-metrics.json", "browser-facts.json", "clock-calibration.json", "clock-alignment.json", "job-decomposition-summary.json", "job-decomposition-jobs-summary.json", "busy.json", "cpu-top.json",
  "thread-map.json", "exemplars.json", "controls.json", "fixture-crosscheck.json", "stdout.log", "stderr.log", "worker-stress-metrics.json",
  "audio-render-capacity.json",
];

function listRunFiles(runDir) {
  const out = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), relative);
      else out.push(relative);
    }
  };
  walk(runDir, "");
  return out;
}

function parityPathOf(entry) {
  if (entry.boundary === "node-core") return "node-core serial";
  if (entry.variant === "TS-W") return "browser-pool TS-W (real pools)";
  return entry.tsSPath === "fallback" ? "browser-pool production fallback" : "browser-pool serial";
}

function commandSummarize(flags) {
  const outDir = insideRepo(flags.get("out") ?? DEFAULT_OUT, "--out");
  if (!flags.has("to")) throw new UsageError("summarize needs --to <evidenceDir>");
  const evidenceDir = insideRepo(flags.get("to"), "--to");
  const history = readRunIndex(outDir);
  // The last line per run id wins; a re-derivation appends a line and the earlier ones stay in the file.
  const index = latestRunIndex(history);
  if (index.length === 0) throw new UsageError(`${repoRelative(outDir)} has no runs-index.jsonl entries`);
  mkdirSync(evidenceDir, { recursive: true });
  const withSlices = flags.has("with-slices");

  const timingRuns = [];
  const parityRuns = [];
  const largeLines = [];
  const perRunBytes = {};
  for (const entry of index) {
    const runDir = path.join(outDir, entry.runId);
    if (!existsSync(runDir)) throw new Error(`${entry.runId} is in the index but its directory is missing`);
    const summaryFile = path.join(runDir, "summary.json");
    const summary = existsSync(summaryFile) ? readJson(summaryFile) : null;
    const samplesFile = path.join(runDir, "samples.jsonl");
    const samples = existsSync(samplesFile) ? parseJsonl(readFileSync(samplesFile, "utf8")) : [];
    const inputManifest = existsSync(path.join(runDir, "input-manifest.json")) ? readJson(path.join(runDir, "input-manifest.json")) : null;
    const enriched = { ...entry, tsSPath: inputManifest?.options?.tsSPath };
    if (entry.parity === true) {
      parityRuns.push({ runId: entry.runId, status: entry.status, case: entry.case, path: parityPathOf(enriched), parity: summary?.parity ?? UNAVAILABLE });
    } else {
      timingRuns.push({ entry, samples, denominators: summary?.denominators });
    }

    perRunBytes[entry.runId] = 0;
    const files = listRunFiles(runDir);
    for (const name of files) {
      const source = path.join(runDir, name);
      const base = name.split("/").at(-1);
      const sliceName = /^exemplar-\d+\.trace\.json$/.test(base);
      const copy = EVIDENCE_FILES.includes(name) || (withSlices && sliceName && name === files.filter((f) => /^exemplar-\d+\.trace\.json$/.test(f)).sort()[0]);
      if (copy) {
        const target = path.join(evidenceDir, "runs", entry.runId, name);
        copySanitised(source, target);
        perRunBytes[entry.runId] += statSync(target).size;
      } else if (name !== "artifacts.sha256" && name !== "runner-config.json") {
        largeLines.push(`${sha256File(source)}  ${statSync(source).size}  ${entry.runId}/${name}`);
      }
    }
  }
  const groups = buildGroups(timingRuns.filter((run) => run.entry.status === "passed"));
  const paired = pairedDifferences(timingRuns.filter((run) => run.entry.status === "passed"));
  const overhead = overheadComparisons(groups);
  const parity = parityRows(parityRuns);
  writeJson(path.join(evidenceDir, "groups.json"), { schema: "ec102.groups.v1", groups, parityRuns });
  writeJson(path.join(evidenceDir, "comparisons.json"), { schema: "ec102.comparisons.v1", paired, overhead, parity });
  const rederived = index.filter((entry) => entry.rederivedFrom !== undefined);
  let rederivedSection = "";
  if (rederived.length > 0) {
    const rows = rederived.map((entry) => "- " + entry.runId + ": " + entry.status + ", " + entry.sampleCount + " samples (rederived " + entry.rederivedAt + ")");
    rederivedSection = "\n## Rederived runs\n\nThese runs were rebuilt from their kept raw files with rederive; nothing was re-measured. The original status and error are in each run-status.json.\n\n" + rows.join("\n") + "\n";
  }
  writeFileSync(path.join(evidenceDir, "tables.md"), renderTables(groups) + renderComparisons({ paired, overhead, parity }) + rederivedSection, "utf8");
  writeFileSync(path.join(evidenceDir, "runs-index.jsonl"), serializeJsonl(history), "utf8");
  writeFileSync(path.join(evidenceDir, "large-artifacts.sha256"), `${largeLines.sort().join("\n")}\n`, "utf8");
  writeFileSync(path.join(evidenceDir, "artifacts.sha256"), artifactsSha256(evidenceDir), "utf8");
  const total = Object.values(perRunBytes).reduce((sum, value) => sum + value, 0);
  const largest = Math.max(0, ...Object.values(perRunBytes));
  console.log(`summarized ${index.length} run(s) into ${repoRelative(evidenceDir)}: ${groups.length} group(s), ${parityRuns.length} parity run(s), ${paired.length} pair(s)`);
  if (rederived.length > 0) console.log("rederived runs: " + rederived.map((entry) => entry.runId + " (" + entry.status + ")").join(", "));
  console.log(`evidence per run: largest ${largest} bytes, total ${total} bytes (run files only)`);
  return 0;
}

// ---------------------------------------------------------------------------
// scan
// ---------------------------------------------------------------------------

/**
 * Re-derives the trace analysis of a finished traced run from its raw files (chromium-trace.json and
 * probe-dump.json or raw-log.json). The run's own files are not touched: the result goes to
 * <runDir>/reanalysis, or to --out.
 */
async function commandAnalyze(positional, flags) {
  if (positional.length !== 1) throw new UsageError("analyze needs one run directory");
  const runDir = assertInsideRepo(path.resolve(positional[0]), "run directory");
  const traceFile = path.join(runDir, "chromium-trace.json");
  if (!existsSync(traceFile)) throw new UsageError(`${runDir} has no chromium-trace.json: only traced runs can be analysed`);
  const outDir = assertInsideRepo(path.resolve(flags.get("out") ?? path.join(runDir, "reanalysis")), "--out");
  mkdirSync(outDir, { recursive: true });
  const samplesFile = path.join(runDir, "samples.jsonl");
  const config = existsSync(path.join(runDir, "runner-config.json")) ? readJson(path.join(runDir, "runner-config.json")) : {};
  let computeCheck;
  let phase;
  if (existsSync(path.join(runDir, "probe-dump.json"))) {
    computeCheck = computeCheckFromDump(readJson(path.join(runDir, "probe-dump.json")));
    phase = "app.worker-compute-metric";
  } else if (existsSync(path.join(runDir, "raw-log.json"))) {
    phase = "pool.compute-metric";
    const metrics = new Map(
      parseJsonl(readFileSync(samplesFile, "utf8"))
        .filter((sample) => sample.phase === phase && sample.outcome === "ok" && Number.isInteger(sample.requestSeq))
        .map((sample) => [sample.requestSeq, sample.duration]),
    );
    computeCheck = poolComputeCheck(readJson(path.join(runDir, "raw-log.json")), config.pass === "bare", metrics);
  } else {
    throw new UsageError(`${runDir} has neither probe-dump.json nor raw-log.json`);
  }
  const top = Number(flags.get("top") ?? 3);
  const jobs = rankJobs(samplesFile, phase, top);
  const calibrationFile = path.join(runDir, "clock-calibration.json");
  const result = await analyzeTrace({ file: traceFile, outDir, calibrationFile, exemplars: { phase, jobs }, computeCheck });
  console.log(JSON.stringify({ outDir: path.relative(REPO, outDir), rankedBy: phase, jobs, jobDecomposition: result.jobDecomposition === UNAVAILABLE ? UNAVAILABLE : { lines: result.jobDecomposition.lines, jobs: result.jobDecomposition.jobs }, jobLevelDecomposition: result.jobLevelDecomposition }));
  return 0;
}

async function commandRederive(positional) {
  if (positional.length !== 1) throw new UsageError("rederive needs one run directory");
  const runDir = assertInsideRepo(path.resolve(positional[0]), "run directory");
  const outcome = await rederiveRun({ runDir });
  console.log(JSON.stringify({ runId: outcome.runId, originalStatus: outcome.originalStatus, status: outcome.status, sampleCount: outcome.sampleCount, errors: outcome.errors, audio: outcome.audio }));
  return outcome.status === "passed" ? 0 : 2;
}

async function commandScan(positional) {
  if (positional.length === 0) throw new UsageError("scan needs at least one path");
  const hits = await scanPaths(positional);
  for (const hit of hits) console.log(hit);
  if (hits.length > 0) {
    console.error(`privacy scan: ${hits.length} hit(s)`);
    return 1;
  }
  console.log("privacy scan: no hits");
  return 0;
}

async function main() {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));
  switch (command) {
    case "verify-corpus":
      return commandVerifyCorpus(flags);
    case "generate-workloads":
      return commandGenerateWorkloads(flags);
    case "run":
      return commandRun(flags);
    case "summarize":
      return commandSummarize(flags);
    case "rederive":
      return commandRederive(positional);
    case "analyze":
      return commandAnalyze(positional, flags);
    default:
      return commandScan(positional);
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error instanceof UsageError ? `error: ${error.message}` : (error instanceof Error ? (error.stack ?? error.message) : String(error)));
    process.exitCode = error instanceof UsageError ? 2 : 1;
  },
);
