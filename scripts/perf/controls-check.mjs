// Reads the trace analysis files of a CONTROLS run and lists what each positive control showed.
// Values are reported as observed; nothing here compares a number with a limit.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { UNAVAILABLE, parseJsonl } from "./lib.mjs";

function readIfPresent(runDir, name) {
  const file = join(runDir, name);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

function hasFunction(cpuTop, label, functionName) {
  const thread = cpuTop?.[`aggregate:${label}`];
  const row = thread?.functions.find((entry) => entry.functionName === functionName);
  return row ? { listed: true, selfMs: row.selfMs, fraction: row.fraction } : { listed: false };
}

export function evaluateControls(runDir, observations) {
  const busy = readIfPresent(runDir, "busy.json") ?? {};
  const cpuTop = readIfPresent(runDir, "cpu-top.json") ?? {};
  const alignment = readIfPresent(runDir, "clock-alignment.json");
  const gcFile = join(runDir, "gc.jsonl");
  const gc = existsSync(gcFile) ? parseJsonl(readFileSync(gcFile, "utf8")) : [];
  const gcByThread = {};
  for (const event of gc) gcByThread[event.thread] = (gcByThread[event.thread] ?? 0) + 1;

  const result = {
    mainBlock: {
      requestedMs: 60,
      pageMeasuredMs: observations.mainBlockMs,
      longTaskObserverSupported: observations.longTaskSupport,
      longTasksSeen: observations.longTasksSeen,
      traceMainMaxTaskUs: busy["aggregate:main"]?.maxTaskUs ?? UNAVAILABLE,
      traceMainTopTasksUs: busy["aggregate:main"]?.topTasksUs ?? UNAVAILABLE,
      cpuTop: hasFunction(cpuTop, "main", "ec102MainBusy"),
    },
    workerBlock: observations.workerBlock === "not-applicable"
      ? "not-applicable"
      : {
          requestedMs: 40,
          workerMeasuredMs: observations.workerBlock.endedMs - observations.workerBlock.startedMs,
          traceWorkerMaxTaskUs: busy["aggregate:w0"]?.maxTaskUs ?? UNAVAILABLE,
          traceWorkerTopTasksUs: busy["aggregate:w0"]?.topTasksUs ?? UNAVAILABLE,
          cpuTop: hasFunction(cpuTop, "w0", "ec102ControlBusy"),
        },
    clock: alignment
      ? {
          marksRequestedPerThread: 200,
          threads: Object.fromEntries(Object.entries(alignment.threads).map(([label, fit]) => [label, { marksInTrace: fit.marks, perfNowFit: fit.perfNowFit, epochFit: fit.epochFit }])),
          crossThread: alignment.crossThread,
        }
      : UNAVAILABLE,
    gc: { eventsByThread: gcByThread, allocation: observations.gcAllocation },
    clockResolutionMs: observations.clockResolutionMs,
    audio: "not-applicable",
  };
  return result;
}
