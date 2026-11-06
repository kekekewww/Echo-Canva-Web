import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { cpus } from "node:os";
import { join } from "node:path";

const MAX_FIRST_VIOLATIONS = 20;

function escapePointerSegment(segment) {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Serializes a value deterministically: keys sorted by UTF-16 code unit,
 * 2-space indent, trailing newline. Non-finite numbers throw with their path.
 */
export function canonicalize(value) {
  const negativeZeroPaths = [];

  function write(node, path, indent) {
    if (node === null) return "null";
    switch (typeof node) {
      case "string":
      case "boolean":
        return JSON.stringify(node);
      case "number":
        if (!Number.isFinite(node)) {
          throw new Error(`Non-finite number ${String(node)} at ${path || "/"}`);
        }
        if (Object.is(node, -0)) negativeZeroPaths.push(path || "/");
        return JSON.stringify(node);
      case "undefined":
        return "null";
      case "object":
        break;
      default:
        throw new Error(`Unsupported value of type ${typeof node} at ${path || "/"}`);
    }
    const inner = `${indent}  `;
    if (Array.isArray(node)) {
      if (node.length === 0) return "[]";
      const items = node.map(
        (item, index) => `${inner}${write(item, `${path}/${index}`, inner)}`,
      );
      return `[\n${items.join(",\n")}\n${indent}]`;
    }
    const keys = Object.keys(node)
      .filter((key) => node[key] !== undefined)
      .sort();
    if (keys.length === 0) return "{}";
    const members = keys.map(
      (key) =>
        `${inner}${JSON.stringify(key)}: ${write(node[key], `${path}/${escapePointerSegment(key)}`, inner)}`,
    );
    return `{\n${members.join(",\n")}\n${indent}}`;
  }

  return { text: `${write(value, "", "")}\n`, negativeZeroPaths };
}

export function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

export function aggregateSha256(caseHashes) {
  const lines = Object.keys(caseHashes)
    .sort()
    .map((id) => `${id} ${caseHashes[id]}\n`);
  return sha256Hex(lines.join(""));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateParameters(name, fieldClass) {
  const { compare } = fieldClass;
  if (compare === "decimal") {
    const d = fieldClass.decimals;
    if (!Number.isInteger(d) || d < 0 || d > 100) {
      throw new Error(`Class "${name}" needs an integer decimals in 0..100`);
    }
  }
  if (compare === "tolerance" || compare === "circular") {
    if (!isFiniteNumber(fieldClass.atol) || fieldClass.atol < 0) {
      throw new Error(`Class "${name}" needs a finite atol >= 0`);
    }
  }
  if (compare === "tolerance" && (!isFiniteNumber(fieldClass.rtol) || fieldClass.rtol < 0)) {
    throw new Error(`Class "${name}" needs a finite rtol >= 0`);
  }
  if (compare === "circular" && (!isFiniteNumber(fieldClass.period) || fieldClass.period <= 0)) {
    throw new Error(`Class "${name}" needs a finite period > 0`);
  }
}

export function validateRules(rules) {
  for (const [name, fieldClass] of Object.entries(rules.classes)) {
    validateParameters(name, fieldClass);
    if (fieldClass.compare !== "exact" && !(typeof fieldClass.unit === "string" && fieldClass.unit.length > 0)) {
      throw new Error(`Class "${name}" compares as ${fieldClass.compare} and needs a non-empty unit`);
    }
  }
  for (const rule of rules.rules) {
    if (!Object.hasOwn(rules.classes, rule.class)) {
      throw new Error(`Rule "${rule.path}" names unknown class "${rule.class}"`);
    }
    const segments = rule.path.split("/");
    segments.forEach((segment, index) => {
      if (segment.includes("**") && !(segment === "**" && index === segments.length - 1)) {
        throw new Error(`Rule "${rule.path}" uses ** outside the final segment`);
      }
    });
  }
}

function leafType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "empty-array";
  if (isPlainObject(value)) return "empty-object";
  return typeof value;
}

// Collects leaves (primitives plus empty containers) and the container kind of
// every non-empty node, so [] vs {} and array vs object are both caught.
function collect(value, path, leaves, containers) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      leaves.set(path, value);
      return;
    }
    containers.set(path, "array");
    value.forEach((item, index) => collect(item, `${path}/${index}`, leaves, containers));
    return;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).filter((key) => value[key] !== undefined);
    if (keys.length === 0) {
      leaves.set(path, value);
      return;
    }
    containers.set(path, "object");
    for (const key of keys) {
      collect(value[key], `${path}/${escapePointerSegment(key)}`, leaves, containers);
    }
    return;
  }
  leaves.set(path, value);
}

function segmentsMatch(prefix, pathSegments) {
  return prefix.every((segment, index) => segment === "*" || segment === pathSegments[index]);
}

// Splits every pattern once and buckets fixed-length patterns by segment count, so
// each leaf is only tested against rules that can match its depth. A trailing "**"
// matches one or more remaining segments.
function indexRules(rules) {
  const fixed = new Map();
  const open = [];
  for (const rule of rules) {
    const segments = rule.path.split("/");
    if (segments[segments.length - 1] === "**") {
      open.push({ rule, prefix: segments.slice(0, -1) });
    } else {
      const bucket = fixed.get(segments.length) ?? [];
      bucket.push({ rule, prefix: segments });
      fixed.set(segments.length, bucket);
    }
  }
  return {
    match(path) {
      const pathSegments = path.split("/");
      const matches = [];
      for (const entry of fixed.get(pathSegments.length) ?? []) {
        if (segmentsMatch(entry.prefix, pathSegments)) matches.push(entry.rule);
      }
      for (const entry of open) {
        if (pathSegments.length > entry.prefix.length && segmentsMatch(entry.prefix, pathSegments)) {
          matches.push(entry.rule);
        }
      }
      return matches;
    },
  };
}

function wrapDifference(difference, period) {
  return difference - period * Math.floor(difference / period + 0.5);
}

function judgeNumber(fieldClass, expected, actual) {
  const absError =
    fieldClass.compare === "circular"
      ? Math.abs(wrapDifference(actual - expected, fieldClass.period))
      : Math.abs(actual - expected);
  let pass;
  switch (fieldClass.compare) {
    case "decimal":
      pass = Number(actual.toFixed(fieldClass.decimals)) === Number(expected.toFixed(fieldClass.decimals));
      break;
    case "tolerance": {
      const scale = Math.max(Math.abs(actual), Math.abs(expected));
      pass = absError <= Math.max(fieldClass.atol ?? 0, (fieldClass.rtol ?? 0) * scale);
      break;
    }
    case "circular":
      pass = absError <= (fieldClass.atol ?? 0);
      break;
    default:
      throw new Error(`Unknown compare mode "${fieldClass.compare}"`);
  }
  return { pass, absError };
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) return 0;
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)];
}

function buildStats(samples, worst) {
  const abs = Float64Array.from(samples.abs).sort();
  let maxRel = null;
  for (const rel of samples.rel) {
    if (maxRel === null || rel > maxRel) maxRel = rel;
  }
  return {
    count: abs.length,
    maxAbsError: abs.length === 0 ? 0 : abs[abs.length - 1],
    p50AbsError: percentile(abs, 0.5),
    p95AbsError: percentile(abs, 0.95),
    maxRelError: maxRel,
    worst,
  };
}

export function compareOutputs(expected, actual, rules, context) {
  validateRules(rules);
  const expectedLeaves = new Map();
  const expectedContainers = new Map();
  const actualLeaves = new Map();
  const actualContainers = new Map();
  collect(expected, "", expectedLeaves, expectedContainers);
  collect(actual, "", actualLeaves, actualContainers);

  const violations = [];
  const errorsByClass = new Map();
  const worstByClass = new Map();
  const ruleIndex = indexRules(rules.rules.filter((rule) => rule.kinds.includes(context.kind)));

  for (const [path, expectedKind] of expectedContainers) {
    const actualKind = actualContainers.get(path);
    if (actualKind !== undefined && actualKind !== expectedKind) {
      violations.push({ type: "structure", path, detail: `container changed from ${expectedKind} to ${actualKind}` });
    }
  }

  const paths = [...new Set([...expectedLeaves.keys(), ...actualLeaves.keys()])].sort();
  for (const path of paths) {
    const hasExpected = expectedLeaves.has(path);
    const hasActual = actualLeaves.has(path);
    const expectedValue = expectedLeaves.get(path);
    const actualValue = actualLeaves.get(path);
    if (!hasExpected || !hasActual) {
      violations.push({
        type: "structure",
        path,
        ...(hasExpected ? { expected: expectedValue } : {}),
        ...(hasActual ? { actual: actualValue } : {}),
        detail: hasExpected ? "missing from actual" : "missing from expected",
      });
      continue;
    }
    if (leafType(expectedValue) !== leafType(actualValue)) {
      violations.push({
        type: "structure",
        path,
        expected: expectedValue,
        actual: actualValue,
        detail: `type changed from ${leafType(expectedValue)} to ${leafType(actualValue)}`,
      });
      continue;
    }

    const matches = ruleIndex.match(path);
    if (matches.length !== 1) {
      violations.push({
        type: matches.length === 0 ? "unclassified" : "ambiguous",
        path,
        detail: matches.length === 0 ? "no rule matches" : `rules match: ${matches.map((rule) => rule.path).join(", ")}`,
      });
      continue;
    }

    const className = matches[0].class;
    const fieldClass = rules.classes[className];
    if (fieldClass.compare === "exact") {
      if (!Object.is(actualValue, expectedValue) && !(typeof actualValue === "object" && actualValue !== null)) {
        violations.push({ type: "discrete", path, expected: expectedValue, actual: actualValue, class: className });
      }
      continue;
    }
    if (typeof expectedValue !== "number" || typeof actualValue !== "number") {
      violations.push({
        type: "structure",
        path,
        expected: expectedValue,
        actual: actualValue,
        class: className,
        detail: `class "${className}" requires numbers`,
      });
      continue;
    }

    const { pass, absError } = judgeNumber(fieldClass, expectedValue, actualValue);
    const scale = Math.max(Math.abs(actualValue), Math.abs(expectedValue));
    if (!errorsByClass.has(className)) errorsByClass.set(className, { abs: [], rel: [] });
    const samples = errorsByClass.get(className);
    samples.abs.push(absError);
    if (scale !== 0) samples.rel.push(absError / scale);
    const worst = worstByClass.get(className);
    if (worst === undefined || absError > worst.abs) {
      worstByClass.set(className, {
        abs: absError,
        point: { caseId: context.caseId, path, expected: expectedValue, actual: actualValue },
      });
    }
    if (!pass) {
      violations.push({
        type: "continuous",
        path,
        expected: expectedValue,
        actual: actualValue,
        class: className,
        detail: `abs error ${absError}`,
      });
    }
  }

  const stats = {};
  const samples = {};
  for (const [className, entry] of errorsByClass) {
    stats[className] = buildStats(entry, worstByClass.get(className).point);
    samples[className] = entry;
  }

  const expectedCanonical = canonicalize(expected);
  const actualCanonical = canonicalize(actual);
  const negativeZeroPaths = {
    expected: expectedCanonical.negativeZeroPaths,
    actual: actualCanonical.negativeZeroPaths,
  };
  return {
    caseId: context.caseId,
    kind: context.kind,
    ok: violations.length === 0,
    bitExact:
      expectedCanonical.text === actualCanonical.text &&
      negativeZeroPaths.expected.join(",") === negativeZeroPaths.actual.join(","),
    negativeZeroPaths,
    leafCount: paths.length,
    violations,
    stats,
    samples,
  };
}

export function summarizeReports(reports) {
  const merged = new Map();
  const worstAbs = new Map();
  const firstViolations = [];
  let violationCount = 0;
  let bitExactCases = 0;
  let negativeZeroLeafCount = 0;

  for (const report of reports) {
    if (report.bitExact) bitExactCases += 1;
    negativeZeroLeafCount +=
      report.negativeZeroPaths.expected.length + report.negativeZeroPaths.actual.length;
    violationCount += report.violations.length;
    for (const violation of report.violations) {
      if (firstViolations.length < MAX_FIRST_VIOLATIONS) {
        firstViolations.push({ ...violation, caseId: report.caseId });
      }
    }
    for (const [className, samples] of Object.entries(report.samples)) {
      if (!merged.has(className)) merged.set(className, { abs: [], rel: [] });
      const target = merged.get(className);
      for (const value of samples.abs) target.abs.push(value);
      for (const value of samples.rel) target.rel.push(value);
      const stats = report.stats[className];
      const current = worstAbs.get(className);
      if (current === undefined || stats.maxAbsError > current.abs) {
        worstAbs.set(className, { abs: stats.maxAbsError, point: stats.worst });
      }
    }
  }

  const stats = {};
  for (const [className, samples] of merged) {
    stats[className] = buildStats(samples, worstAbs.get(className).point);
  }
  return {
    ok: reports.every((report) => report.ok),
    caseCount: reports.length,
    bitExactCases,
    negativeZeroLeafCount,
    violationCount,
    firstViolations,
    stats,
  };
}

// ---------------------------------------------------------------------------
// Corpus integrity
// ---------------------------------------------------------------------------

const CORPUS_PREFIX = "benchmarks/corpus/v1/";
const MAX_PROBLEMS_PER_CASE = 5;

function describeText(text) {
  if (text.startsWith("\uFEFF")) return "a UTF-8 BOM";
  if (text.includes("\r")) return "CRLF line endings";
  return null;
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function localPath(manifestPath) {
  return typeof manifestPath === "string" && manifestPath.startsWith(CORPUS_PREFIX)
    ? manifestPath.slice(CORPUS_PREFIX.length)
    : null;
}

function checkEntryFile(rootDir, entry, key, problems) {
  const info = entry[key];
  if (!isPlainObject(info) || typeof info.path !== "string") {
    problems.push(`${entry.id}: ${key} entry needs a path`);
    return null;
  }
  const relative = localPath(info.path);
  if (relative === null || relative.split("/").includes("..")) {
    problems.push(`${entry.id}: ${key} path ${JSON.stringify(info.path)} is not under ${CORPUS_PREFIX}`);
    return null;
  }
  const file = join(rootDir, relative);
  if (!existsSync(file)) {
    problems.push(`${info.path}: file is missing`);
    return null;
  }
  const bytes = readFileSync(file);
  const text = bytes.toString("utf8");
  const damage = describeText(text);
  if (damage !== null) problems.push(`${info.path}: contains ${damage}`);
  if (sha256Hex(bytes) !== info.sha256) problems.push(`${info.path}: sha256 does not match the manifest`);
  if (bytes.length !== info.bytes) problems.push(`${info.path}: ${bytes.length} bytes, manifest says ${info.bytes}`);
  return { text, relative };
}

/**
 * Checks the committed corpus without throwing: hashes, line endings, orphans,
 * expected outcomes, rule coverage and (optionally) that the rules are frozen.
 */
export function verifyCorpus(rootDir, options = {}) {
  const problems = [];
  const manifestFile = join(rootDir, "manifest.json");
  if (!existsSync(manifestFile)) {
    return { ok: false, problems: ["manifest.json is missing"], corpusSha256: "unavailable", caseCount: 0 };
  }
  const manifestBytes = readFileSync(manifestFile);
  const corpusSha256 = sha256Hex(manifestBytes);
  const manifestText = manifestBytes.toString("utf8");
  const manifestDamage = describeText(manifestText);
  if (manifestDamage !== null) problems.push(`manifest.json: contains ${manifestDamage}`);

  let manifest;
  try {
    manifest = JSON.parse(stripBom(manifestText));
  } catch (error) {
    problems.push(`manifest.json: not valid JSON (${messageOf(error)})`);
    return { ok: false, problems, corpusSha256, caseCount: 0 };
  }
  if (!isPlainObject(manifest) || !Array.isArray(manifest.cases)) {
    problems.push("manifest.json: needs a cases array");
    return { ok: false, problems, corpusSha256, caseCount: 0 };
  }
  if (manifest.cases.length === 0) problems.push("manifest.json: cases is empty, a corpus with no cases verifies nothing");

  let rules = null;
  const rulesInfo = manifest.rules;
  if (!isPlainObject(rulesInfo) || typeof rulesInfo.path !== "string") {
    problems.push("manifest.json: rules.path is missing");
  } else {
    const rulesFile = join(rootDir, rulesInfo.path);
    if (!existsSync(rulesFile)) {
      problems.push(`${rulesInfo.path}: rules file is missing`);
    } else {
      const rulesBytes = readFileSync(rulesFile);
      const rulesText = rulesBytes.toString("utf8");
      const damage = describeText(rulesText);
      if (damage !== null) problems.push(`${rulesInfo.path}: contains ${damage}`);
      if (sha256Hex(rulesBytes) !== rulesInfo.sha256) {
        problems.push(`${rulesInfo.path}: sha256 does not match manifest rules.sha256 (run refresh-rules-hash while draft)`);
      }
      try {
        rules = JSON.parse(stripBom(rulesText));
        validateRules(rules);
      } catch (error) {
        problems.push(`${rulesInfo.path}: invalid rules (${messageOf(error)})`);
        rules = null;
      }
    }
  }

  if (rules !== null && options.requireFrozen) {
    if (rules.status !== "frozen") problems.push(`rules status is "${rules.status}", expected "frozen"`);
    if (typeof rules.frozenOn !== "string" || rules.frozenOn.length === 0) problems.push("rules frozenOn is not set");
    for (const [name, fieldClass] of Object.entries(rules.classes)) {
      if (!["discrete", "existing-test", "approved"].includes(fieldClass.status)) {
        problems.push(`class "${name}" is still ${fieldClass.status}`);
      }
    }
  }

  const listedInputs = new Set();
  const listedExpected = new Set();
  const seenIds = new Set();
  manifest.cases.forEach((entry, index) => {
    if (!isPlainObject(entry) || typeof entry.id !== "string" || entry.id.length === 0) {
      problems.push(`manifest.json: cases[${index}] needs a string id`);
      return;
    }
    if (seenIds.has(entry.id)) problems.push(`manifest.json: duplicate case id ${entry.id}`);
    seenIds.add(entry.id);

    const input = checkEntryFile(rootDir, entry, "input", problems);
    if (input !== null) listedInputs.add(input.relative);
    const expected = checkEntryFile(rootDir, entry, "expected", problems);
    if (expected === null) return;
    listedExpected.add(expected.relative);

    let output;
    try {
      output = JSON.parse(stripBom(expected.text));
    } catch (error) {
      problems.push(`${entry.expected.path}: not valid JSON (${messageOf(error)})`);
      return;
    }
    if (!isPlainObject(output)) {
      problems.push(`${entry.expected.path}: top level must be an object`);
      return;
    }
    if (canonicalize(output).text !== expected.text) {
      problems.push(`${entry.expected.path}: is not in canonical form`);
    }
    if (output.caseId !== entry.id) {
      problems.push(`${entry.expected.path}: caseId is ${JSON.stringify(output.caseId)}, expected ${entry.id}`);
    }
    if (output.kind !== entry.kind) {
      problems.push(`${entry.expected.path}: kind is ${JSON.stringify(output.kind)}, manifest says ${JSON.stringify(entry.kind)}`);
    }
    if (output.outcome !== entry.expectedOutcome) {
      problems.push(
        `${entry.id}: outcome is ${JSON.stringify(output.outcome)} but the manifest expects ${JSON.stringify(entry.expectedOutcome)}`,
      );
    }
    if (rules !== null && typeof entry.kind === "string") {
      const report = compareOutputs(output, output, rules, { caseId: entry.id, kind: entry.kind });
      const bad = report.violations;
      for (const violation of bad.slice(0, MAX_PROBLEMS_PER_CASE)) {
        problems.push(`${entry.id}: ${violation.type} leaf ${violation.path} (${violation.detail ?? "rule problem"})`);
      }
      if (bad.length > MAX_PROBLEMS_PER_CASE) {
        problems.push(`${entry.id}: ${bad.length - MAX_PROBLEMS_PER_CASE} more rule problems`);
      }
    }
  });

  for (const [directory, listed] of [["inputs", listedInputs], ["expected", listedExpected]]) {
    const folder = join(rootDir, directory);
    for (const name of existsSync(folder) ? readdirSync(folder).sort() : []) {
      if (!listed.has(`${directory}/${name}`)) problems.push(`${directory}/${name}: orphan file not listed in the manifest`);
    }
  }

  return { ok: problems.length === 0, problems, corpusSha256, caseCount: manifest.cases.length };
}

// ---------------------------------------------------------------------------
// Run metadata
// ---------------------------------------------------------------------------

function git(repoRoot, args) {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

/** Parses `git status --porcelain -z` output into sorted repo-relative paths (a rename yields its new path). */
export function parseGitStatusZ(status) {
  const paths = [];
  const records = status.split("\u0000").filter((record) => record.length > 0);
  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    paths.push(record.slice(3));
    if (record[0] === "R" || record[0] === "C") index += 1;
  }
  return paths.sort();
}

/** SHA-256 of a package.json text with its scripts field removed, in canonical form. */
export function packageJsonNoScriptsSha256(text) {
  const parsed = JSON.parse(text);
  delete parsed.scripts;
  return sha256Hex(canonicalize(parsed).text);
}

const COMPARED_TREES = ["src", "pnpm-lock.yaml", "pnpm-workspace.yaml", "patches"];

/**
 * Repo-relative git facts for run.json. Anything git cannot answer is the string "unavailable".
 * Product trees are compared as committed at HEAD; package.json is compared without its scripts field.
 */
export function collectGitInfo(repoRoot, baseline) {
  const head = git(repoRoot, ["rev-parse", "HEAD"]);
  const status = git(repoRoot, ["status", "--porcelain", "-z", "--untracked-files=all"]);
  const gitDirty = status === null ? "unavailable" : parseGitStatusZ(status);
  const productTrees = {};
  for (const name of ["src", "package.json", "pnpm-lock.yaml"]) {
    const hash = git(repoRoot, ["rev-parse", `HEAD:${name}`]);
    productTrees[name] = hash === null ? "unavailable" : hash.trim();
  }
  const treeHashes = isPlainObject(baseline) && isPlainObject(baseline.treeHashes) ? baseline.treeHashes : null;
  const headPackage = git(repoRoot, ["show", "HEAD:package.json"]);
  let packageHash = "unavailable";
  if (headPackage !== null) {
    try {
      packageHash = packageJsonNoScriptsSha256(headPackage);
    } catch {
      packageHash = "unavailable";
    }
  }
  let productTreeDiffs = "unavailable";
  let productTreesMatchBaseline = "unavailable";
  if (treeHashes !== null && packageHash !== "unavailable" && head !== null) {
    productTreeDiffs = [];
    for (const name of COMPARED_TREES) {
      const hash = git(repoRoot, ["rev-parse", `HEAD:${name}`]);
      if (hash === null || hash.trim() !== treeHashes[name]) productTreeDiffs.push(name);
    }
    if (packageHash !== baseline.packageJsonNoScriptsSha256) productTreeDiffs.push("package.json");
    productTreesMatchBaseline = productTreeDiffs.length === 0;
  }
  return {
    gitHead: head === null ? "unavailable" : head.trim(),
    gitDirty,
    productTrees,
    productTreesMatchBaseline,
    productTreeDiffs,
    packageJsonNoScriptsSha256: packageHash,
  };
}

export function collectEnvironment() {
  let processors = [];
  try {
    processors = cpus();
  } catch {
    processors = [];
  }
  return {
    node: process.version,
    v8: process.versions.v8,
    platform: process.platform,
    arch: process.arch,
    cpuModel: processors.length > 0 ? processors[0].model.trim() : "unavailable",
    logicalCpus: processors.length > 0 ? processors.length : "unavailable",
  };
}
