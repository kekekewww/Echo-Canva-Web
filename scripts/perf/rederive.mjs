// Rebuilds the derived files of a finished in-app run from the raw files it kept. Nothing is measured.
// samples.jsonl and summary.json are rebuilt from probe-dump.json and runner-result.json; for a traced
// run the trace analysis is redone from chromium-trace.json with the job-window inputs of the new samples.
// History is kept: run-status.json records the original status and error, and the index gets one more line.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { NOT_APPLICABLE, REPO_ROOT, appendRunIndex, artifactsSha256, latestRunIndex, makeDenominators, parseJsonl, readJson, readRunIndex, sanitizeText, serializeJsonl, summarizeSamples, writeJson } from "./lib.mjs";
import { assertSources, computeCheckFromDump, deriveAppSamples } from "./derive-app.mjs";
import { POOL_DERIVATION_ERRORS, deriveSamples as derivePoolSamples, poolComputeCheck, poolDerivationErrors } from "./derive-pool.mjs";
import { serialSamples } from "./derive-serial.mjs";
import { analyzeTrace, rankJobs } from "./trace-analyze.mjs";

// Errors the derivation itself produced. They are replaced by a fresh derivation; every other error stays.
const DERIVATION_ERRORS = [
  /^Error: invalid sample/,
  /^data-worker-source values/,
  /^data-worker-count values/,
  /^fallback did not activate cleanly/,
  /^a worker was created during a forced-serial run/,
  /^no accepted frame was observed/,
  /^trace analysis failed:/,
];

function gitCommit() {
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
  return head.status === 0 ? head.stdout.trim() : "unavailable";
}

/** The raw file that a run kept, which also says what kind of run it is. */
export function rawKindOf(runDir) {
  if (existsSync(join(runDir, "probe-dump.json"))) return "app";
  if (existsSync(join(runDir, "raw-log.json"))) return "pool";
  if (existsSync(join(runDir, "raw-records.json"))) return "serial";
  return null;
}

export async function rederiveRun({ runDir, commit = gitCommit(), now = () => new Date() }) {
  const kind = rawKindOf(runDir);
  if (kind === null) throw new Error(`${runDir} kept no raw file (probe-dump.json, raw-log.json or raw-records.json): it cannot be re-derived`);
  if (kind === "pool") return rederivePoolRun({ runDir, commit, now });
  if (kind === "serial") return rederiveSerialRun({ runDir, commit, now });
  return rederiveAppRun({ runDir, commit, now });
}

async function rederiveAppRun({ runDir, commit, now }) {
  const dumpFile = join(runDir, "probe-dump.json");
  const config = readJson(join(runDir, "runner-config.json"));
  const caseId = config.caseSpec.caseId;
  if (caseId === "CONTROLS") throw new Error("CONTROLS runs have no timing samples to re-derive");
  const previousResult = readJson(join(runDir, "runner-result.json"));
  const previousStatus = readJson(join(runDir, "run-status.json"));
  const previousSummary = readJson(join(runDir, "summary.json"));
  const dump = readJson(dumpFile);
  const audioFile = join(runDir, "audio-samples.json");
  const audioKept = existsSync(audioFile);
  let audioSamples = audioKept ? readJson(audioFile).samples : [];
  let audioNote = audioKept ? "audio-samples.json" : "not kept by this run";
  if (!audioKept && existsSync(join(runDir, "samples.jsonl"))) {
    // Older runs that passed kept the audio values only inside samples.jsonl, without timestamps.
    const old = parseJsonl(readFileSync(join(runDir, "samples.jsonl"), "utf8"));
    const capacity = old.filter((sample) => sample.phase === "audio.render-capacity");
    const interval = old.filter((sample) => sample.phase === "audio.callback-interval-mean");
    if (capacity.length > 0) {
      audioSamples = capacity.map((sample, index) => ({ renderCapacity: sample.duration, callbackIntervalMean: interval[index]?.duration ?? Number.NaN }));
      audioNote = "values from the previous samples.jsonl, placed by index (no timestamps were kept)";
    }
  }

  const forceSerial = config.variant === "TS-S";
  const expectedCount = previousResult.statusBeforeWindow?.expectedWorkerCount ?? 0;
  const timeouts = (previousResult.errors ?? []).filter((message) => /^switch \d+ timed out/.test(message)).length;
  const derived = deriveAppSamples(dump, {
    runId: config.runId,
    variant: config.variant,
    caseId,
    mode: caseId === "APP_H100_SWITCH" ? "hybrid" : "classic",
    pass: config.pass,
    workers: forceSerial ? NOT_APPLICABLE : (Number(dump.commits.at(-1)?.workerCount) || expectedCount),
    audio: config.audio,
    audioSamples: audioSamples.filter((sample) => Number.isFinite(sample.callbackIntervalMean)),
    updateHz: typeof previousResult.updateHz === "number" ? previousResult.updateHz : null,
    submitted: previousResult.denominators?.submitted ?? (caseId === "APP_H100_SWITCH" ? config.samples : undefined),
    timeouts,
  });
  const samples = derived.samples;
  writeFileSync(join(runDir, "samples.jsonl"), serializeJsonl(samples), "utf8");

  const result = { ...previousResult };
  result.originalErrors = previousResult.originalErrors ?? previousResult.errors ?? [];
  result.errors = (previousResult.errors ?? []).filter((message) => !DERIVATION_ERRORS.some((pattern) => pattern.test(message)));
  result.denominators = derived.denominators;
  result.observed = {
    ...derived.observed,
    expectedWorkerCount: expectedCount,
    hardwareConcurrency: previousResult.statusBeforeWindow?.hardwareConcurrency,
    workerSourceAttribute: derived.observed.workerSources,
    workerCountAttribute: derived.observed.workerCounts,
  };
  assertSources(result, config, derived.observed, expectedCount);
  result.dumpSummary = { commits: dump.commits.length, posts: dump.posts.length, params: dump.params.length, longTasks: dump.longTasks.length, support: dump.support };

  const traceFile = join(runDir, "chromium-trace.json");
  if (existsSync(traceFile)) {
    const phase = "app.worker-compute-metric";
    try {
      const analysis = await analyzeTrace({
        file: traceFile,
        outDir: runDir,
        calibrationFile: join(runDir, "clock-calibration.json"),
        exemplars: { phase, jobs: rankJobs(join(runDir, "samples.jsonl"), phase, 3) },
        computeCheck: computeCheckFromDump(dump),
      });
      result.traced = analysis.raster;
      result.trace = {
        computeVsTrace: analysis.computeVsTrace,
        jobDecomposition: analysis.jobDecomposition,
        jobLevelDecomposition: analysis.jobLevelDecomposition,
        bytes: previousResult.trace?.bytes ?? NOT_APPLICABLE,
        threads: analysis.threads,
        marks: analysis.marks,
        gcEvents: analysis.gcEvents,
        cpuThreads: analysis.cpuThreads,
        exemplars: analysis.exemplars,
      };
    } catch (error) {
      result.errors.push(`trace analysis failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  return finishRederive({ runDir, config, result, samples, previousStatus, previousSummary, commit, now, audioNote });
}

/** Writes summary, status, checksums and the index line; shared by every kind of run. */
function finishRederive({ runDir, config, result, samples, previousStatus, previousSummary, commit, now, audioNote }) {
  result.status = result.errors.length === 0 ? "passed" : "failed";
  if (result.status === "passed") delete result.error;
  else result.error = result.errors.join(" | ");
  result.sampleCount = samples.length;
  result.rederived = true;
  writeJson(join(runDir, "runner-result.json"), result);

  const summary = {
    ...previousSummary,
    ...summarizeSamples(samples),
    denominators: result.denominators,
    observed: result.observed,
    trace: result.trace ?? previousSummary.trace ?? NOT_APPLICABLE,
    traced: result.traced ?? previousSummary.traced ?? NOT_APPLICABLE,
  };
  writeJson(join(runDir, "summary.json"), summary);

  const rederivedAt = now().toISOString();
  const status = {
    ...previousStatus,
    status: result.status,
    sampleCount: samples.length,
    originalStatus: previousStatus.originalStatus ?? previousStatus.status,
    originalError: previousStatus.originalError ?? previousStatus.error ?? NOT_APPLICABLE,
    rederivedAt,
    rederivedByCommit: commit,
    ...(audioNote === undefined ? {} : { rederivedAudio: audioNote }),
  };
  if (result.status === "passed") {
    status.originalPhasesNotReached = previousStatus.originalPhasesNotReached ?? previousStatus.phasesNotReached ?? NOT_APPLICABLE;
    delete status.error;
    delete status.phasesNotReached;
  } else {
    status.error = sanitizeText(result.error);
  }
  writeJson(join(runDir, "run-status.json"), status);
  writeFileSync(join(runDir, "artifacts.sha256"), artifactsSha256(runDir), "utf8");

  const outDir = dirname(runDir);
  const last = latestRunIndex(readRunIndex(outDir)).find((line) => line.runId === config.runId);
  const line = { ...(last ?? { runId: config.runId }), status: result.status, sampleCount: samples.length, rederivedFrom: config.runId, rederivedAt };
  appendRunIndex(outDir, line);
  return { runId: config.runId, status: result.status, sampleCount: samples.length, errors: result.errors, originalStatus: status.originalStatus, audio: audioNote, line };
}

// Keeps every error the derivation did not produce (the run's own errors, a step timeout, parity), drops the ones it did.
function keepRealErrors(errors, patterns) {
  return (errors ?? []).filter((message) => !patterns.some((pattern) => pattern.test(message)));
}

async function rederiveTrace({ runDir, result, previousResult, phase, computeCheck }) {
  const traceFile = join(runDir, "chromium-trace.json");
  if (!existsSync(traceFile)) return;
  try {
    const analysis = await analyzeTrace({
      file: traceFile,
      outDir: runDir,
      calibrationFile: join(runDir, "clock-calibration.json"),
      exemplars: { phase, jobs: rankJobs(join(runDir, "samples.jsonl"), phase, 3) },
      computeCheck,
    });
    result.traced = analysis.raster;
    result.trace = {
      computeVsTrace: analysis.computeVsTrace,
      jobDecomposition: analysis.jobDecomposition,
      jobLevelDecomposition: analysis.jobLevelDecomposition,
      bytes: previousResult.trace?.bytes ?? NOT_APPLICABLE,
      threads: analysis.threads,
      marks: analysis.marks,
      gcEvents: analysis.gcEvents,
      cpuThreads: analysis.cpuThreads,
      exemplars: analysis.exemplars,
    };
  } catch (error) {
    result.errors.push(`trace analysis failed: ${error instanceof Error ? error.message : error}`);
  }
}

function startRederive(runDir) {
  const config = readJson(join(runDir, "runner-config.json"));
  if (config.caseSpec.caseId === "CONTROLS") throw new Error("CONTROLS runs have no timing samples to re-derive");
  const previousResult = readJson(join(runDir, "runner-result.json"));
  const result = { ...previousResult };
  result.originalErrors = previousResult.originalErrors ?? previousResult.errors ?? [];
  return { config, previousResult, result, previousStatus: readJson(join(runDir, "run-status.json")), previousSummary: readJson(join(runDir, "summary.json")) };
}

async function rederivePoolRun({ runDir, commit, now }) {
  const { config, previousResult, result, previousStatus, previousSummary } = startRederive(runDir);
  const log = readJson(join(runDir, "raw-log.json"));
  const tsW = config.variant === "TS-W";
  const workers = log.workersCreated > 0 ? log.workersCreated : (log.expectedWorkers > 0 ? log.expectedWorkers : NOT_APPLICABLE);
  const base = { runId: config.runId, caseId: config.caseSpec.caseId, mode: config.caseSpec.mode, boundary: "browser-pool", pass: config.pass };
  const derived = derivePoolSamples(log, { ...base, variant: config.variant, workers: tsW ? workers : NOT_APPLICABLE });
  // A parity run records no timing.
  const samples = config.parity ? [] : derived.samples;
  writeFileSync(join(runDir, "samples.jsonl"), serializeJsonl(samples), "utf8");
  result.errors = [...keepRealErrors(previousResult.errors, POOL_DERIVATION_ERRORS), ...poolDerivationErrors(log, derived, { pass: config.pass, variant: config.variant })];
  result.denominators = makeDenominators(derived.denominators);
  result.workers = { expected: log.expectedWorkers, created: log.workersCreated, reportedByPool: derived.workerCounts };
  result.integrity = derived.integrity;
  result.shardCompute = derived.shardCompute;
  result.jobs = derived.jobs;
  result.phaseResidualCount = derived.phaseResidualCount;
  const metricByJob = new Map(samples.filter((sample) => sample.phase === "pool.compute-metric" && sample.outcome === "ok" && Number.isInteger(sample.requestSeq)).map((sample) => [sample.requestSeq, sample.duration]));
  await rederiveTrace({ runDir, result, previousResult, phase: "pool.compute-metric", computeCheck: poolComputeCheck(log, config.pass === "bare", metricByJob) });
  return finishRederive({ runDir, config, result, samples, previousStatus, previousSummary, commit, now });
}

async function rederiveSerialRun({ runDir, commit, now }) {
  const { config, previousResult, result, previousStatus, previousSummary } = startRederive(runDir);
  const raw = readJson(join(runDir, "raw-records.json"));
  const boundary = config.pageFile ? "browser-pool" : "node-core";
  const base = { runId: config.runId, caseId: config.caseSpec.caseId, mode: config.caseSpec.mode, boundary, pass: config.pass };
  const samples = config.parity ? [] : serialSamples(raw.records, boundary === "browser-pool" ? { ...base, variant: "TS-S" } : base);
  writeFileSync(join(runDir, "samples.jsonl"), serializeJsonl(samples), "utf8");
  result.errors = keepRealErrors(previousResult.errors, [/^Error: invalid sample/, /^trace analysis failed:/]);
  await rederiveTrace({ runDir, result, previousResult, phase: "pool.compute-metric", computeCheck: null });
  return finishRederive({ runDir, config, result, samples, previousStatus, previousSummary, commit, now });
}

/**
 * Re-derives every run under outDir that kept a raw file. A run without raw files is listed as skipped with
 * the reason, a derivation that threw is listed as failed. Nothing is dropped silently.
 */
export async function rederiveAll({ outDir, commit = gitCommit(), now = () => new Date(), dryRun = false }) {
  const rederived = [];
  const skipped = [];
  const failed = [];
  for (const entry of readdirSync(outDir, { withFileTypes: true }).filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const runDir = join(outDir, entry.name);
    if (!existsSync(join(runDir, "run-status.json"))) continue;
    const kind = rawKindOf(runDir);
    if (kind === null) {
      skipped.push({ runId: entry.name, reason: "no raw file kept" });
      continue;
    }
    if (dryRun) {
      rederived.push({ runId: entry.name, kind, dryRun: true });
      continue;
    }
    try {
      const outcome = await rederiveRun({ runDir, commit, now });
      rederived.push({ runId: entry.name, kind, originalStatus: outcome.originalStatus, status: outcome.status, sampleCount: outcome.sampleCount, errors: outcome.errors });
    } catch (error) {
      failed.push({ runId: entry.name, kind, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return { rederived, skipped, failed };
}
