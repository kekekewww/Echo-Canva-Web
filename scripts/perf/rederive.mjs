// Rebuilds the derived files of a finished in-app run from the raw files it kept. Nothing is measured.
// samples.jsonl and summary.json are rebuilt from probe-dump.json and runner-result.json; for a traced
// run the trace analysis is redone from chromium-trace.json with the job-window inputs of the new samples.
// History is kept: run-status.json records the original status and error, and the index gets one more line.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { NOT_APPLICABLE, REPO_ROOT, appendRunIndex, artifactsSha256, latestRunIndex, parseJsonl, readJson, readRunIndex, sanitizeText, serializeJsonl, summarizeSamples, writeJson } from "./lib.mjs";
import { assertSources, computeCheckFromDump, deriveAppSamples } from "./derive-app.mjs";
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

export async function rederiveRun({ runDir, commit = gitCommit(), now = () => new Date() }) {
  const dumpFile = join(runDir, "probe-dump.json");
  if (!existsSync(dumpFile)) throw new Error(`${runDir} has no probe-dump.json: only in-app runs can be re-derived`);
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
    rederivedAudio: audioNote,
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
