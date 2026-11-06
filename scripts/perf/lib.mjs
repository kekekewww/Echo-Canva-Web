import { createHash } from "node:crypto";
import {
  appendFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  closeSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { hostname, userInfo } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

export const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// ---------------------------------------------------------------------------
// path guards
// ---------------------------------------------------------------------------

/** True when `target` is `root` or lies inside it. Compares resolved paths. */
export function isInside(root, target) {
  const difference = relative(resolve(root), resolve(target));
  return difference === "" || (!difference.startsWith("..") && !isAbsolute(difference));
}

/** Throws unless `target` resolves inside the repository root. */
export function assertInsideRepo(target, label, repoRoot = REPO_ROOT) {
  if (!isInside(repoRoot, target)) {
    throw new Error(`${label} must resolve inside the repository root; ${resolve(target)} does not`);
  }
  return resolve(target);
}

/**
 * TEMP, TMP and TMPDIR for processes the harness starts. On Windows all three must be set and lie
 * inside the repository: an unset or outside value would send temp files and browser profiles to
 * the system drive, so the harness refuses to start instead.
 */
export function tempEnvironment(repoRoot = REPO_ROOT, env = process.env, platform = process.platform) {
  const result = {};
  for (const name of ["TEMP", "TMP", "TMPDIR"]) {
    const value = env[name];
    if (!value) {
      if (platform === "win32") throw new Error(`${name} is not set; set TEMP, TMP and TMPDIR to a folder inside the worktree before running`);
      continue;
    }
    if (!isInside(repoRoot, value)) {
      if (platform === "win32") throw new Error(`${name} points outside the worktree; set TEMP, TMP and TMPDIR to a folder inside it`);
      continue;
    }
    result[name] = resolve(value);
  }
  return result;
}

export const SAMPLE_SCHEMA = "ec102.sample.v1";
export const SUMMARY_SCHEMA = "ec102.summary.v1";
export const NOT_APPLICABLE = "not-applicable";
export const UNAVAILABLE = "unavailable";
export const MISSING_VALUES = [NOT_APPLICABLE, UNAVAILABLE];

export const VARIANTS = ["TS-S", "TS-W"];
export const BOUNDARIES = ["node-core", "browser-pool", "browser-app"];
export const PASSES = ["stock", "bare", "clean", "traced", "alloc"];
export const OUTCOMES = ["ok", "error", "timeout", "stale", "coalesced", "fallback", "censored"];
export const CLOCKS = [
  "main-perf-now",
  "worker-perf-now",
  "main-date-now",
  "worker-date-now",
  "trace",
  "computed",
  "cdp",
];
export const JOB_KINDS = ["pose-only", "static-install", NOT_APPLICABLE];
export const MODES = ["classic", "hybrid", NOT_APPLICABLE];
export const AUDIO_STATES = ["on", "off", NOT_APPLICABLE];
export const DENOMINATORS = [
  "submitted",
  "coalesced",
  "dispatched",
  "completed",
  "accepted",
  "stale",
  "fallback",
  "error",
  "timeout",
];
export const EXPLORATORY_BELOW = 1000;
// Differences of two coarsened clock readings, or remainders: a small negative value is real data.
export const SIGNED_PHASES = ["job.phase-residual", "shard.transport", "merge.validate", "queue.timer-lateness", "input.lateness", "queue.wait", "app.input-to-dispatch-minus-rate-limit"];

const SAMPLE_KEYS = [
  "schema",
  "runId",
  "variant",
  "caseId",
  "requestSeq",
  "mode",
  "sceneRevision",
  "staticFingerprint",
  "phase",
  "duration",
  "units",
  "outcome",
  "boundary",
  "pass",
  "workers",
  "workerIndex",
  "warm",
  "clock",
  "audio",
  "tapeStep",
  "jobKind",
];

export function isMissingValue(value) {
  return typeof value === "string" && MISSING_VALUES.includes(value);
}

// ---------------------------------------------------------------------------
// statistics
// ---------------------------------------------------------------------------

/** Nearest rank: the value at 1-based rank ceil(p * N) of the sorted values. */
export function nearestRank(values, p) {
  if (!Array.isArray(values) || values.length === 0) return UNAVAILABLE;
  if (!(p > 0 && p <= 1)) throw new RangeError(`p must be in (0, 1], got ${p}`);
  const sorted = Float64Array.from(values).sort();
  // The epsilon keeps products such as 0.07 * 100 = 7.000000000000001 from rounding up a rank.
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil(p * sorted.length - 1e-9)));
  return sorted[rank - 1];
}

export function computeStats(values) {
  if (values.length === 0) {
    return { N: 0, p50: UNAVAILABLE, p95: UNAVAILABLE, p99: UNAVAILABLE, max: UNAVAILABLE, mean: UNAVAILABLE };
  }
  const sorted = Float64Array.from(values).sort();
  const rankOf = (p) => sorted[Math.min(sorted.length, Math.max(1, Math.ceil(p * sorted.length - 1e-9))) - 1];
  let total = 0;
  for (const value of sorted) total += value;
  return {
    N: sorted.length,
    p50: rankOf(0.5),
    p95: rankOf(0.95),
    p99: rankOf(0.99),
    max: sorted[sorted.length - 1],
    mean: total / sorted.length,
  };
}

// ---------------------------------------------------------------------------
// samples
// ---------------------------------------------------------------------------

function isCount(value, minimum) {
  return Number.isInteger(value) && value >= minimum;
}

function missingOr(value, check) {
  return isMissingValue(value) || check(value);
}

/** Returns a list of problems; an empty list means the sample is valid. */
export function validateSample(sample) {
  const problems = [];
  if (sample === null || typeof sample !== "object" || Array.isArray(sample)) return ["sample is not an object"];
  for (const key of Object.keys(sample)) {
    if (!SAMPLE_KEYS.includes(key)) problems.push(`unknown field ${key}`);
  }
  for (const key of SAMPLE_KEYS) {
    if (!(key in sample)) problems.push(`missing field ${key}`);
  }
  if (problems.length > 0) return problems;

  const nonEmpty = (value) => typeof value === "string" && value.length > 0 && !isMissingValue(value);
  if (sample.schema !== SAMPLE_SCHEMA) problems.push("schema is not ec102.sample.v1");
  if (!nonEmpty(sample.runId)) problems.push("runId must be a non-empty string");
  if (!VARIANTS.includes(sample.variant)) problems.push("variant must be TS-S or TS-W");
  if (!nonEmpty(sample.caseId)) problems.push("caseId must be a non-empty string");
  if (!missingOr(sample.requestSeq, (v) => isCount(v, 1))) problems.push("requestSeq must be an integer >= 1 or a missing-value string");
  if (!MODES.includes(sample.mode)) problems.push("mode must be classic, hybrid or not-applicable");
  if (!missingOr(sample.sceneRevision, (v) => isCount(v, 1))) problems.push("sceneRevision must be an integer >= 1 or a missing-value string");
  if (!missingOr(sample.staticFingerprint, nonEmpty)) problems.push("staticFingerprint must be a non-empty string");
  if (!nonEmpty(sample.phase)) problems.push("phase must be a non-empty string");
  if (typeof sample.duration !== "number" || !Number.isFinite(sample.duration) || (sample.duration < 0 && !SIGNED_PHASES.includes(sample.phase))) {
    problems.push("duration must be a finite number >= 0 (a missing duration is not a sample); only the computed or timer-difference phases in SIGNED_PHASES may be negative");
  }
  if (!nonEmpty(sample.units)) problems.push("units must be a non-empty string");
  if (!OUTCOMES.includes(sample.outcome)) problems.push(`outcome must be one of ${OUTCOMES.join(", ")}`);
  if (!BOUNDARIES.includes(sample.boundary)) problems.push(`boundary must be one of ${BOUNDARIES.join(", ")}`);
  if (!PASSES.includes(sample.pass)) problems.push(`pass must be one of ${PASSES.join(", ")}`);
  if (!missingOr(sample.workers, (v) => isCount(v, 1))) {
    problems.push("workers must be an integer >= 1 or a missing-value string (0 is not a worker count)");
  } else if (sample.variant === "TS-S" && sample.workers !== NOT_APPLICABLE) {
    problems.push("workers must be not-applicable for TS-S");
  } else if (sample.variant === "TS-W" && isMissingValue(sample.workers)) {
    problems.push("workers must be the actual worker count for TS-W");
  }
  if (!missingOr(sample.workerIndex, (v) => isCount(v, 0))) problems.push("workerIndex must be an integer >= 0 or a missing-value string");
  if (typeof sample.warm !== "boolean") problems.push("warm must be a boolean");
  if (!CLOCKS.includes(sample.clock)) problems.push(`clock must be one of ${CLOCKS.join(", ")}`);
  if (!AUDIO_STATES.includes(sample.audio)) problems.push("audio must be on, off or not-applicable");
  if (!missingOr(sample.tapeStep, (v) => isCount(v, 0))) problems.push("tapeStep must be an integer >= 0 or a missing-value string");
  if (!JOB_KINDS.includes(sample.jobKind)) problems.push("jobKind must be pose-only, static-install or not-applicable");
  return problems;
}

/** Fills absent optional fields with the missing-value strings and validates; throws on a bad sample. */
export function createSample(fields) {
  const sample = {
    schema: SAMPLE_SCHEMA,
    runId: fields.runId,
    variant: fields.variant,
    caseId: fields.caseId,
    requestSeq: fields.requestSeq ?? NOT_APPLICABLE,
    mode: fields.mode ?? NOT_APPLICABLE,
    sceneRevision: fields.sceneRevision ?? NOT_APPLICABLE,
    staticFingerprint: fields.staticFingerprint ?? NOT_APPLICABLE,
    phase: fields.phase,
    duration: fields.duration,
    units: fields.units ?? "ms",
    outcome: fields.outcome ?? "ok",
    boundary: fields.boundary,
    pass: fields.pass,
    workers: fields.workers ?? NOT_APPLICABLE,
    workerIndex: fields.workerIndex ?? NOT_APPLICABLE,
    warm: fields.warm,
    clock: fields.clock,
    audio: fields.audio ?? NOT_APPLICABLE,
    tapeStep: fields.tapeStep ?? NOT_APPLICABLE,
    jobKind: fields.jobKind ?? NOT_APPLICABLE,
  };
  const problems = validateSample(sample);
  if (problems.length > 0) throw new Error(`invalid sample (${fields.phase}): ${problems.join("; ")}`);
  return sample;
}

export function serializeJsonl(objects) {
  return objects.length === 0 ? "" : `${objects.map((object) => JSON.stringify(object)).join("\n")}\n`;
}

export function parseJsonl(text) {
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`line ${index + 1} is not valid JSON: ${error instanceof Error ? error.message : error}`);
      }
    });
}

export function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

export function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function sha256Text(data) {
  return createHash("sha256").update(data).digest("hex");
}

export function sha256File(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

/** `<sha256>  <relative path>` lines, sorted by path, over every file under `dir` except the listing itself. */
export function artifactsSha256(dir, skip = ["artifacts.sha256"]) {
  const lines = [];
  const walk = (current, prefix) => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(join(current, entry.name), relative);
      else if (!skip.includes(relative)) lines.push(`${sha256File(join(current, entry.name))}  ${relative}`);
    }
  };
  walk(dir, "");
  return lines.length === 0 ? "" : `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// summaries
// ---------------------------------------------------------------------------

/**
 * Per-phase statistics for one process. Statistics use `ok` samples only; every outcome is
 * counted. Warm and cold are reported apart. `exploratory` marks a phase with fewer than
 * 1,000 samples in this process.
 */
export function summarizeSamples(samples) {
  const buckets = new Map();
  for (const sample of samples) {
    let bucket = buckets.get(sample.phase);
    if (!bucket) {
      bucket = { units: sample.units, count: 0, outcomes: {}, warm: [], cold: [], warmAll: [], coldAll: [], kinds: new Map() };
      buckets.set(sample.phase, bucket);
    } else if (bucket.units !== sample.units) {
      throw new Error(`phase ${sample.phase} mixes units ${bucket.units} and ${sample.units}`);
    }
    bucket.count += 1;
    bucket.outcomes[sample.outcome] = (bucket.outcomes[sample.outcome] ?? 0) + 1;
    if (sample.outcome === "ok") {
      (sample.warm ? bucket.warm : bucket.cold).push(sample.duration);
      if (!bucket.kinds.has(sample.jobKind)) bucket.kinds.set(sample.jobKind, { warm: [], cold: [] });
      bucket.kinds.get(sample.jobKind)[sample.warm ? "warm" : "cold"].push(sample.duration);
    }
    if (sample.outcome === "ok" || sample.outcome === "censored") (sample.warm ? bucket.warmAll : bucket.coldAll).push(sample.duration);
  }
  const phases = {};
  for (const [phase, bucket] of [...buckets].sort(([a], [b]) => (a < b ? -1 : 1))) {
    phases[phase] = {
      units: bucket.units,
      count: bucket.count,
      outcomes: bucket.outcomes,
      warm: computeStats(bucket.warm),
      cold: computeStats(bucket.cold),
      exploratory: bucket.count < EXPLORATORY_BELOW,
    };
    const split = kindSplit(bucket.kinds);
    if (split) phases[phase].byJobKind = split;
    if (phase === CENSORED_PHASE) Object.assign(phases[phase], censoredBlock(bucket.outcomes.censored ?? 0, bucket.warmAll, bucket.coldAll));
  }
  return { schema: SUMMARY_SCHEMA, sampleCount: samples.length, phases };
}

export const CENSORED_PHASE = "pose.latest-wait";

/**
 * Statistics split by job kind. A static-install job queues its shard behind the install on the
 * same worker, so its figures must not be mixed into pose-only ones. Absent when no sample of
 * the phase carries a job kind.
 */
export function kindSplit(kinds) {
  const named = [...kinds].filter(([kind]) => kind !== NOT_APPLICABLE);
  if (named.length === 0) return null;
  return Object.fromEntries(
    named.sort(([a], [b]) => (a < b ? -1 : 1)).map(([kind, values]) => [kind, { warm: computeStats(values.warm), cold: computeStats(values.cold) }]),
  );
}

/**
 * A censored latest-wait is the time a submit had waited when the run ended, so its true wait
 * is at least that long. The block below treats those samples as lower bounds (plan section 4.5).
 */
export function censoredBlock(censoredCount, warmValues, coldValues) {
  return {
    censoredCount,
    includingCensored: {
      note: "ok samples plus censored samples; each censored value is the elapsed time at the end of the run and is a lower bound on the true wait",
      censoredAreLowerBounds: true,
      warm: computeStats(warmValues),
      cold: computeStats(coldValues),
    },
  };
}

/** Counts that apply to the boundary are numbers; the rest are not-applicable. Never 0 for missing. */
export function makeDenominators(counts) {
  return Object.fromEntries(DENOMINATORS.map((name) => [name, counts[name] ?? NOT_APPLICABLE]));
}

export function groupKeyOf(entry) {
  return JSON.stringify([
    entry.variant,
    entry.case,
    entry.pass,
    entry.boundary,
    entry.workers,
    entry.audio,
    entry.build ?? NOT_APPLICABLE,
    entry.driver ?? NOT_APPLICABLE,
  ]);
}

function spread(values) {
  const finite = values.filter((value) => typeof value === "number");
  if (finite.length === 0) return UNAVAILABLE;
  const mean = finite.reduce((sum, value) => sum + value, 0) / finite.length;
  const variance = finite.length > 1 ? finite.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (finite.length - 1) : 0;
  return { runs: finite.length, min: Math.min(...finite), max: Math.max(...finite), mean, stdev: Math.sqrt(variance) };
}

/**
 * Groups runs by (variant, case, pass, boundary, workers, audio, build, driver). `runs` is a list of
 * `{ entry, samples, denominators }`. Pooled statistics concatenate all runs; per-run statistics
 * and the dispersion of their p50, p95 and p99 are kept beside them.
 */
export function buildGroups(runs) {
  const grouped = new Map();
  for (const run of runs) {
    const key = groupKeyOf(run.entry);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(run);
  }
  const groups = [];
  for (const [key, members] of grouped) {
    const [variant, caseId, pass, boundary, workers, audio, build, driver] = JSON.parse(key);
    const pooledBuckets = new Map();
    const perRun = [];
    const excludedRuns = [];
    const denominators = Object.fromEntries(DENOMINATORS.map((name) => [name, NOT_APPLICABLE]));
    for (const { entry, samples, denominators: runDenominators } of members) {
      if (entry.status !== "passed") {
        excludedRuns.push({ runId: entry.runId, status: entry.status });
        continue;
      }
      const summary = summarizeSamples(samples);
      perRun.push({ runId: entry.runId, orderIndex: entry.orderIndex ?? NOT_APPLICABLE, status: entry.status, phases: summary.phases });
      for (const name of DENOMINATORS) {
        const value = runDenominators?.[name];
        if (typeof value === "number") denominators[name] = (typeof denominators[name] === "number" ? denominators[name] : 0) + value;
      }
      for (const sample of samples) {
        if (sample.outcome === "censored" && sample.phase === CENSORED_PHASE) {
          const id = `${sample.phase}\u0000${sample.units}`;
          if (!pooledBuckets.has(id)) pooledBuckets.set(id, { phase: sample.phase, units: sample.units, warm: [], cold: [], warmAll: [], coldAll: [], censored: 0, kinds: new Map() });
          const bucket = pooledBuckets.get(id);
          bucket.censored += 1;
          bucket[sample.warm ? "warmAll" : "coldAll"].push(sample.duration);
          continue;
        }
        if (sample.outcome !== "ok") continue;
        const id = `${sample.phase}\u0000${sample.units}`;
        if (!pooledBuckets.has(id)) pooledBuckets.set(id, { phase: sample.phase, units: sample.units, warm: [], cold: [], warmAll: [], coldAll: [], censored: 0, kinds: new Map() });
        pooledBuckets.get(id)[sample.warm ? "warm" : "cold"].push(sample.duration);
        const kinds = pooledBuckets.get(id).kinds;
        if (!kinds.has(sample.jobKind)) kinds.set(sample.jobKind, { warm: [], cold: [] });
        kinds.get(sample.jobKind)[sample.warm ? "warm" : "cold"].push(sample.duration);
        pooledBuckets.get(id)[sample.warm ? "warmAll" : "coldAll"].push(sample.duration);
      }
    }
    const pooled = {};
    for (const bucket of [...pooledBuckets.values()].sort((a, b) => (a.phase < b.phase ? -1 : 1))) {
      pooled[bucket.phase] = { units: bucket.units, warm: computeStats(bucket.warm), cold: computeStats(bucket.cold) };
      const split = kindSplit(bucket.kinds);
      if (split) pooled[bucket.phase].byJobKind = split;
      if (bucket.phase === CENSORED_PHASE) Object.assign(pooled[bucket.phase], censoredBlock(bucket.censored, bucket.warmAll, bucket.coldAll));
    }
    const dispersion = {};
    for (const phase of Object.keys(pooled)) {
      dispersion[phase] = {};
      for (const temperature of ["warm", "cold"]) {
        dispersion[phase][temperature] = {};
        for (const stat of ["p50", "p95", "p99"]) {
          dispersion[phase][temperature][stat] = spread(
            perRun.map((run) => run.phases[phase]?.[temperature]?.[stat]),
          );
        }
      }
    }
    const exploratoryRuns = {};
    for (const phase of Object.keys(pooled)) {
      exploratoryRuns[phase] = perRun.filter((run) => run.phases[phase]?.exploratory === true).length;
    }
    groups.push({
      key: { variant, case: caseId, pass, boundary, workers, audio, build, driver },
      runCount: perRun.length,
      runIds: perRun.map((run) => run.runId),
      excludedRuns,
      denominators,
      pooled,
      perRun,
      dispersion,
      exploratoryRuns,
    });
  }
  return groups.sort((a, b) => (JSON.stringify(a.key) < JSON.stringify(b.key) ? -1 : 1));
}

function formatNumber(value) {
  return typeof value === "number" ? value.toFixed(3) : String(value);
}

/** Markdown tables, display-rounded to 3 decimals; the JSON beside them keeps raw numbers. */
export function renderTables(groups) {
  const lines = ["# EC-102 summary tables", "", "Values are display-rounded to 3 decimals. Raw numbers are in groups.json.", ""];
  for (const group of groups) {
    const { variant, case: caseId, pass, boundary, workers, audio, build, driver } = group.key;
    lines.push(`## ${variant} ${caseId} pass=${pass} boundary=${boundary} workers=${workers} audio=${audio} build=${build} driver=${driver}`);
    lines.push("");
    lines.push(`Runs: ${group.runCount}`);
    lines.push(`Denominators: ${DENOMINATORS.map((name) => `${name}=${group.denominators[name]}`).join(" ")}`);
    lines.push("");
    lines.push("| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |");
    lines.push("| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
    for (const [phase, entry] of Object.entries(group.pooled)) {
      for (const temperature of ["warm", "cold"]) {
        const stats = entry[temperature];
        if (stats.N === 0) continue;
        lines.push(
          `| ${phase} | ${entry.units} | ${temperature} | ${stats.N} | ${formatNumber(stats.p50)} | ${formatNumber(stats.p95)} | ${formatNumber(stats.p99)} | ${formatNumber(stats.max)} | ${formatNumber(stats.mean)} | ${group.exploratoryRuns[phase]} of ${group.runCount} |`,
        );
      }
      for (const [kind, stats] of Object.entries(entry.byJobKind ?? {})) {
        for (const temperature of ["warm", "cold"]) {
          const row = stats[temperature];
          if (row.N === 0) continue;
          lines.push(
            `| ${phase} [${kind}] | ${entry.units} | ${temperature} | ${row.N} | ${formatNumber(row.p50)} | ${formatNumber(row.p95)} | ${formatNumber(row.p99)} | ${formatNumber(row.max)} | ${formatNumber(row.mean)} |  |`,
          );
        }
      }
      if (entry.includingCensored) {
        for (const temperature of ["warm", "cold"]) {
          const stats = entry.includingCensored[temperature];
          if (stats.N === 0) continue;
          lines.push(
            `| ${phase} incl. ${entry.censoredCount} censored (lower bounds) | ${entry.units} | ${temperature} | ${stats.N} | ${formatNumber(stats.p50)} | ${formatNumber(stats.p95)} | ${formatNumber(stats.p99)} | ${formatNumber(stats.max)} | ${formatNumber(stats.mean)} |  |`,
          );
        }
      }
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// runs
// ---------------------------------------------------------------------------

export const RUN_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

export function appendRunIndex(outDir, line) {
  mkdirSync(outDir, { recursive: true });
  appendFileSync(join(outDir, "runs-index.jsonl"), `${JSON.stringify(line)}\n`, "utf8");
}

/**
 * The index keeps every line, including the ones a re-derivation appends. This returns one line per run
 * id: the last one, in the position of the first. rederivedFrom marks a line that replaced an earlier one.
 */
export function latestRunIndex(lines) {
  const byId = new Map();
  for (const line of lines) byId.set(line.runId, line);
  return [...byId.values()];
}

export function readRunIndex(outDir) {
  const file = join(outDir, "runs-index.jsonl");
  return existsSync(file) ? parseJsonl(readFileSync(file, "utf8")) : [];
}

/**
 * Runs one measurement and records it whatever happens. The run directory is created first and
 * gets `run-status.json` before anything else. A failure or crash keeps every file and still
 * appends an index line. Nothing is retried and nothing is deleted.
 *
 * `execute({ runDir })` returns `{ status, error, sampleCount, phasesNotReached }`; status is
 * `passed` or `failed`. Throwing counts as `crashed`.
 */
export async function executeRun({ outDir, meta, orderIndex, execute, clock = () => new Date() }) {
  if (!RUN_ID_PATTERN.test(meta.runId)) throw new Error("run id may contain letters, digits, '.', '_' and '-' only");
  const runDir = join(outDir, meta.runId);
  if (existsSync(runDir)) throw new Error(`run directory ${meta.runId} already exists; runs are never overwritten`);
  mkdirSync(runDir, { recursive: true });
  const start = clock().toISOString();
  writeJson(join(runDir, "run-status.json"), { status: "started", runId: meta.runId, start });

  let outcome;
  try {
    outcome = await execute({ runDir });
  } catch (error) {
    outcome = { status: "crashed", error: error instanceof Error ? (error.stack ?? error.message) : String(error) };
  }
  const end = clock().toISOString();
  const status = outcome.status ?? "passed";
  const sampleCount = outcome.sampleCount ?? NOT_APPLICABLE;
  const record = { status, runId: meta.runId, start, end, sampleCount };
  if (outcome.error !== undefined) record.error = sanitizeText(String(outcome.error));
  if (status !== "passed") record.phasesNotReached = outcome.phasesNotReached ?? UNAVAILABLE;
  writeJson(join(runDir, "run-status.json"), record);
  writeFileSync(join(runDir, "artifacts.sha256"), artifactsSha256(runDir), "utf8");

  const line = {
    runId: meta.runId,
    variant: meta.variant,
    case: meta.case,
    pass: meta.pass,
    boundary: meta.boundary,
    workers: meta.workers ?? NOT_APPLICABLE,
    audio: meta.audio ?? NOT_APPLICABLE,
    build: meta.build ?? NOT_APPLICABLE,
    driver: meta.driver ?? NOT_APPLICABLE,
    parity: meta.parity === true,
    status,
    start,
    end,
    orderIndex: orderIndex ?? NOT_APPLICABLE,
    sampleCount,
  };
  appendRunIndex(outDir, line);
  return line;
}

// ---------------------------------------------------------------------------
// parity
// ---------------------------------------------------------------------------

/** Every leaf where `actual` differs from `expected`, by exact comparison (so -0 differs from 0). */
export function diffLeaves(expected, actual) {
  const diffs = [];
  const walk = (left, right, path) => {
    const leftIsContainer = left !== null && typeof left === "object";
    const rightIsContainer = right !== null && typeof right === "object";
    if (leftIsContainer && rightIsContainer && Array.isArray(left) === Array.isArray(right)) {
      const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
      for (const key of [...keys].sort()) {
        const child = `${path}/${key}`;
        if (!(key in right)) diffs.push({ path: child, kind: "missing-in-actual", expected: left[key] });
        else if (!(key in left)) diffs.push({ path: child, kind: "extra-in-actual", actual: right[key] });
        else walk(left[key], right[key], child);
      }
      return;
    }
    if (leftIsContainer || rightIsContainer) {
      diffs.push({ path, kind: "type", expected: left, actual: right });
      return;
    }
    if (!Object.is(left, right)) diffs.push({ path, kind: "value", expected: left, actual: right });
  };
  walk(expected, actual, "");
  return diffs;
}

// ---------------------------------------------------------------------------
// sanitiser and privacy scanner
// ---------------------------------------------------------------------------

export function privacyTerms() {
  const terms = [];
  try {
    terms.push({ rule: "username", value: userInfo().username });
  } catch {
    // No user database entry; nothing to look for.
  }
  try {
    terms.push({ rule: "hostname", value: hostname() });
  } catch {
    // No host name available.
  }
  return terms.filter(({ value }) => typeof value === "string" && value.length >= 3);
}

const WINDOWS_PATH = String.raw`(?<![A-Za-z0-9])[A-Za-z]:(?:\\\\|\\|/(?!/))[^"'<>|\r\n\t,;]*`;
const POSIX_ROOTS = "Users|home|var|tmp|private|opt|mnt|root|usr|Volumes|etc";
const POSIX_PATH = String.raw`(?<![\w.:/-])/(?:${POSIX_ROOTS})/[^\s"'<>|,;]*`;
const FILE_URL = String.raw`file:/{3}[^\s"'<>]*`;
const EMAIL = String.raw`[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}`;
const WINDOWS_PATH_START = String.raw`(?<![A-Za-z0-9])[A-Za-z]:(?:\\|/(?!/))`;

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/** Replaces absolute paths, file URLs, the runtime user name and the host name. */
export function sanitizeText(text, terms = privacyTerms()) {
  let result = text
    .replace(new RegExp(FILE_URL, "g"), "<file-url>")
    .replace(new RegExp(WINDOWS_PATH, "g"), "<path>")
    .replace(new RegExp(POSIX_PATH, "g"), "<path>");
  for (const { rule, value } of terms) {
    result = result.replace(new RegExp(escapeRegExp(value), "gi"), `<${rule}>`);
  }
  return result;
}

/** Removes `command_line` metadata and sanitises every string in a parsed trace. */
export function sanitizeTrace(value, terms = privacyTerms()) {
  if (typeof value === "string") return sanitizeText(value, terms);
  if (Array.isArray(value)) return value.map((item) => sanitizeTrace(item, terms));
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === "command_line") continue;
      result[key] = sanitizeTrace(child, terms);
    }
    return result;
  }
  return value;
}

/** Rule names that match on one line of text. The match itself is never returned. */
export function scanLine(line, terms = privacyTerms()) {
  const rules = [];
  if (line.startsWith("#!")) return rules;
  if (new RegExp(WINDOWS_PATH_START).test(line)) rules.push("windows-path");
  if (/file:\/\/\//.test(line)) rules.push("file-url");
  if (new RegExp(POSIX_PATH).test(line)) rules.push("posix-path");
  if (new RegExp(EMAIL).test(line)) rules.push("email");
  for (const { rule, value } of terms) {
    if (new RegExp(escapeRegExp(value), "i").test(line)) rules.push(rule);
  }
  return rules;
}

function looksBinary(file) {
  const descriptor = openSync(file, "r");
  try {
    const buffer = Buffer.alloc(4096);
    const read = readSync(descriptor, buffer, 0, buffer.length, 0);
    return buffer.subarray(0, read).includes(0);
  } finally {
    closeSync(descriptor);
  }
}

function listFiles(path) {
  const info = statSync(path);
  if (!info.isDirectory()) return [path];
  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    files.push(...listFiles(join(path, entry.name)));
  }
  return files;
}

/** Scans files and directories. Returns `file:line:rule` strings; callers print them and fail on any. */
export async function scanPaths(paths, terms = privacyTerms()) {
  const hits = [];
  for (const root of paths) {
    for (const file of listFiles(resolve(root))) {
      if (looksBinary(file)) continue;
      const label = relative(process.cwd(), file);
      const reader = createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
      let lineNumber = 0;
      for await (const line of reader) {
        lineNumber += 1;
        for (const rule of scanLine(line, terms)) hits.push(`${label.replaceAll("\\", "/")}:${lineNumber}:${rule}`);
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// workloads
// ---------------------------------------------------------------------------

/**
 * Checks benchmarks/perf/workloads/v1: every listed file exists with the recorded hash and
 * size, uses LF only, and no unlisted file sits beside them. Returns problems without throwing.
 */
export function verifyWorkloads(dir) {
  const problems = [];
  const manifestFile = join(dir, "manifest.json");
  if (!existsSync(manifestFile)) {
    return { ok: false, problems: ["workloads manifest.json is missing"], manifestSha256: UNAVAILABLE, fileCount: 0 };
  }
  const manifestBytes = readFileSync(manifestFile);
  const manifestSha256 = sha256Text(manifestBytes);
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString("utf8"));
  } catch (error) {
    return { ok: false, problems: [`workloads manifest.json is not valid JSON (${error.message})`], manifestSha256, fileCount: 0 };
  }
  if (manifest.id !== "ec102-workloads-v1") problems.push(`manifest id is ${manifest.id}, expected ec102-workloads-v1`);
  const listed = manifest.files && typeof manifest.files === "object" ? Object.entries(manifest.files) : [];
  if (listed.length === 0) problems.push("manifest lists no files");
  for (const [name, expected] of listed) {
    const file = join(dir, name);
    if (!existsSync(file)) {
      problems.push(`${name}: file is missing`);
      continue;
    }
    const bytes = readFileSync(file);
    if (sha256Text(bytes) !== expected.sha256) problems.push(`${name}: sha256 does not match the manifest`);
    if (bytes.length !== expected.bytes) problems.push(`${name}: size ${bytes.length} differs from the manifest ${expected.bytes}`);
    const text = bytes.toString("utf8");
    if (text.includes("\r")) problems.push(`${name}: contains a carriage return`);
    if (text.charCodeAt(0) === 0xfeff) problems.push(`${name}: starts with a byte order mark`);
  }
  const known = new Set([...listed.map(([name]) => name), "manifest.json"]);
  for (const entry of readdirSync(dir)) {
    if (!known.has(entry)) problems.push(`${entry}: file is not listed in the manifest`);
  }
  for (const item of manifest.cases ?? []) {
    if (!manifest.files?.[item.scene] || !manifest.files?.[item.tape]) problems.push(`${item.id}: refers to a file the manifest does not list`);
  }
  return { ok: problems.length === 0, problems, manifestSha256, fileCount: listed.length };
}
