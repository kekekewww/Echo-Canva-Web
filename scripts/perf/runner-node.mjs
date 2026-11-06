#!/usr/bin/env node
// One TS-S measurement at the node-core boundary, in its own Node process.
// Usage: node runner-node.mjs --config <file>. The parent (cli.mjs) owns the run directory,
// the status file and the index; this process writes samples, parity output and its own facts.
import { PerformanceObserver, constants } from "node:perf_hooks";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { serialSamples } from "./derive-serial.mjs";
import { makeDenominators, serializeJsonl, writeJson } from "./lib.mjs";
import { compareTapeParity } from "./parity.mjs";

const GC_KINDS = new Map([
  [constants.NODE_PERFORMANCE_GC_MAJOR, "major"],
  [constants.NODE_PERFORMANCE_GC_MINOR, "minor"],
  [constants.NODE_PERFORMANCE_GC_INCREMENTAL, "incremental"],
  [constants.NODE_PERFORMANCE_GC_WEAKCB, "weakcb"],
]);

function readConfig() {
  const index = process.argv.indexOf("--config");
  if (index < 0 || !process.argv[index + 1]) throw new Error("runner-node needs --config <file>");
  return JSON.parse(readFileSync(resolve(process.argv[index + 1]), "utf8"));
}

async function main() {
  const config = readConfig();
  const runDir = resolve(config.runDir);
  const result = { status: "failed", startedAt: new Date().toISOString() };
  const gcEvents = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      gcEvents.push({ startTimeMs: entry.startTime, durationMs: entry.duration, kind: GC_KINDS.get(entry.detail?.kind) ?? "unknown" });
    }
  });
  observer.observe({ entryTypes: ["gc"] });

  let records = [];
  let replay = null;
  const cpuStart = process.cpuUsage();
  try {
    const bundle = await import(pathToFileURL(resolve(config.bundlePath)).href);
    const input = JSON.parse(readFileSync(resolve(config.caseSpec.inputPath), "utf8"));
    const mode = config.caseSpec.mode;
    result.clockResolutionMs = bundle.clockResolutionMs();
    replay = await bundle.runNodeReplay({
      input: mode === "classic" ? { mode, tape: { scene: input.scene, events: input.events } } : { mode, tape: { document: input.document, events: input.events } },
      repeat: config.parity ? 1 : config.repeat,
      paced: !config.parity,
      collectFrames: config.parity,
    });
    records = replay.records;
    result.jobs = replay.jobs;
    result.intervalMs = replay.intervalMs;
    result.checksum = replay.checksum;
    result.wallMs = replay.endedAtMs - replay.startedAtMs;
    if (config.parity) {
      const { lines, verdict } = compareTapeParity(config.caseSpec, replay.steps);
      writeFileSync(join(runDir, "parity-diffs.jsonl"), serializeJsonl(lines), "utf8");
      result.parity = verdict;
      result.status = verdict.rulesOk && verdict.stepCount === verdict.expectedStepCount ? "passed" : "failed";
      if (result.status === "failed") result.error = `parity: ${verdict.violationCount} rule violation(s), ${verdict.stepCount} of ${verdict.expectedStepCount} steps`;
    } else {
      writeFileSync(join(runDir, "parity-diffs.jsonl"), "not-applicable", "utf8");
      result.status = "passed";
    }
  } catch (error) {
    result.error = error instanceof Error ? (error.stack ?? error.message) : String(error);
    records = error?.partial?.records ?? [];
    result.jobs = error?.partial?.jobs ?? 0;
    writeFileSync(join(runDir, "parity-diffs.jsonl"), "not-applicable", "utf8");
  }

  const cpu = process.cpuUsage(cpuStart);
  observer.takeRecords?.();
  observer.disconnect();

  const { caseId, mode } = config.caseSpec;
  const samples = serialSamples(records, { runId: config.runId, caseId, mode, boundary: "node-core", pass: config.pass });
  writeFileSync(join(runDir, "samples.jsonl"), serializeJsonl(samples), "utf8");
  writeFileSync(join(runDir, "gc.jsonl"), serializeJsonl(gcEvents), "utf8");
  writeJson(join(runDir, "process-cpu.json"), {
    unit: "core-seconds",
    note: "Node process.cpuUsage over the replay window, user plus system.",
    userSeconds: cpu.user / 1e6,
    systemSeconds: cpu.system / 1e6,
  });
  result.sampleCount = samples.length;
  result.denominators = makeDenominators(
    config.parity ? {} : { submitted: result.jobs ?? 0, completed: result.jobs ?? 0, accepted: result.status === "passed" ? (result.jobs ?? 0) : 0, error: result.status === "passed" ? 0 : 1 },
  );
  result.endedAt = new Date().toISOString();
  writeJson(join(runDir, "runner-result.json"), result);
  process.exitCode = result.status === "passed" ? 0 : 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});
