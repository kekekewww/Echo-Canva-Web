#!/usr/bin/env node
// Reads a Chromium trace (a {traceEvents} object or a bare array) as a stream and writes the
// analysis files named in the EC-102 design: thread-map, clock-alignment, gc, busy, cpu-top,
// exemplars and sanitised exemplar slices.
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { UNAVAILABLE, nearestRank, parseJsonl, privacyTerms, sanitizeTrace, serializeJsonl, writeJson } from "./lib.mjs";

export const EXEMPLAR_BYTES = 300_000;
const EXEMPLAR_MARGIN_US = 50_000;
const LONG_TASK_US = 50_000;

/**
 * Calls onEvent for each element of the trace event array without holding the file in memory.
 * Tracks string and escape state so braces inside strings do not end an object early.
 */
export async function streamTraceEvents(file, onEvent) {
  let started = false;
  let head = "";
  let inString = false;
  let escaped = false;
  let depth = 0;
  let current = "";
  let finished = false;

  const consume = (text) => {
    let segmentStart = 0;
    for (let index = 0; index < text.length && !finished; index += 1) {
      const code = text.charCodeAt(index);
      if (inString) {
        if (escaped) escaped = false;
        else if (code === 92) escaped = true;
        else if (code === 34) inString = false;
        continue;
      }
      if (code === 34) inString = true;
      else if (code === 123) {
        if (depth === 0) segmentStart = index;
        depth += 1;
      } else if (code === 125) {
        depth -= 1;
        if (depth === 0) {
          onEvent(JSON.parse(current + text.slice(segmentStart, index + 1)));
          current = "";
          segmentStart = index + 1;
        }
      } else if (code === 93 && depth === 0) finished = true;
    }
    if (depth > 0 && !finished) current += text.slice(segmentStart);
  };

  for await (const chunk of createReadStream(file, { encoding: "utf8", highWaterMark: 1 << 20 })) {
    if (finished) break;
    if (started) {
      consume(chunk);
      continue;
    }
    head += chunk;
    const trimmed = head.trimStart();
    let open = -1;
    if (trimmed.startsWith("[")) open = head.indexOf("[");
    else {
      const key = head.indexOf('"traceEvents"');
      if (key >= 0) open = head.indexOf("[", key);
    }
    if (open < 0) continue;
    started = true;
    const rest = head.slice(open + 1);
    head = "";
    consume(rest);
  }
}

function fitLine(points) {
  // Least squares y = a + b x.
  const n = points.length;
  if (n < 2) return { n, a: UNAVAILABLE, b: UNAVAILABLE, maxResidualUs: UNAVAILABLE };
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (const p of points) {
    sxx += (p.x - meanX) ** 2;
    sxy += (p.x - meanX) * (p.y - meanY);
  }
  const b = sxx === 0 ? 1 : sxy / sxx;
  const a = meanY - b * meanX;
  return { n, a, b, meanX, meanY, maxResidualUs: Math.max(...points.map((p) => Math.abs(p.y - (a + b * p.x)))) };
}

// Only these events are real collections or incremental-marking steps. Every nested V8.GC_* event
// lies inside one of them and stays in the raw trace; counting it would count its parent again.
const PRIMARY_GC = new Map([
  ["MinorGC", "minor"],
  ["MajorGC", "major"],
  ["V8.GCIncrementalMarking", "incremental-marking-step"],
  ["V8.GCIncrementalMarkingStep", "incremental-marking-step"],
  ["IncrementalMarking", "incremental-marking-step"],
]);

function isJsThread(name) {
  return /CrRendererMain|DedicatedWorker/.test(name ?? "");
}

function isConcurrentGcName(name) {
  return name.startsWith("V8.GC_") && (name.includes("BACKGROUND") || name.includes("PARALLEL"));
}

function roleOf(name) {
  if (/CrRendererMain/.test(name)) return "renderer-main";
  if (/DedicatedWorker/.test(name)) return "worker";
  if (/Compositor/.test(name)) return "compositor";
  if (/audio/i.test(name)) return "audio";
  return "other";
}

const markPattern = /^ec102:clk:(main|w\d+):(\d+):([0-9.eE+-]+):([0-9.eE+-]+)$/;

/** First pass: everything that does not need the file again. */
async function collect(file) {
  const names = new Map();
  const processNames = new Map();
  const marks = [];
  const tasks = new Map();
  const events = new Map();
  const rasters = [];
  const gc = [];
  const concurrent = [];
  const profiles = new Map();
  const nodeNames = new Map();
  const threadKey = (e) => `${e.pid}:${e.tid}`;
  await streamTraceEvents(file, (event) => {
    const key = threadKey(event);
    if (event.ph === "M") {
      if (event.name === "thread_name") names.set(key, event.args?.name ?? "");
      else if (event.name === "process_name") processNames.set(event.pid, event.args?.name ?? "");
      return;
    }
    if (typeof event.name === "string" && event.name.startsWith("ec102:")) {
      marks.push({ name: event.name, ts: event.ts, pid: event.pid, tid: event.tid, key });
      return;
    }
    if (event.ph === "X" && (event.name === "RunTask" || event.name === "ThreadControllerImpl::RunTask")) {
      if (!tasks.has(key)) tasks.set(key, []);
      tasks.get(key).push({ ts: event.ts, dur: event.dur ?? 0, tdur: typeof event.tdur === "number" ? event.tdur : undefined });
      return;
    }
    if (event.ph === "X" && typeof event.name === "string") {
      if ((event.dur ?? 0) > 0) {
        if (!events.has(key)) events.set(key, []);
        events.get(key).push({ name: event.name, ts: event.ts, dur: event.dur });
        if (event.name === "RasterTask") rasters.push({ key, pid: event.pid, ts: event.ts, dur: event.dur });
      }
      const kind = PRIMARY_GC.get(event.name);
      if (kind) {
        gc.push({
          key,
          ts: event.ts,
          dur: event.dur ?? 0,
          kind,
          name: event.name,
          heapBefore: event.args?.usedHeapSizeBefore ?? UNAVAILABLE,
          heapAfter: event.args?.usedHeapSizeAfter ?? UNAVAILABLE,
        });
      } else if (isConcurrentGcName(event.name)) {
        concurrent.push({ key, name: event.name, dur: event.dur ?? 0 });
      }
      return;
    }
    // A Profile event sits on the profiled thread; its ProfileChunk events come from the sampler
    // thread and share the profile id, so the id, not the chunk's own thread, names the thread.
    const profileId = `${event.pid}:${event.id ?? event.id2?.local}`;
    if (event.ph === "P" && event.name === "Profile") {
      const start = event.args?.data?.startTime ?? event.ts;
      const existing = profiles.get(profileId);
      if (existing) existing.key = key;
      else profiles.set(profileId, { key, start, last: start });
      return;
    }
    if (event.ph === "P" && event.name === "ProfileChunk") {
      const profile = profiles.get(profileId) ?? { key, start: event.ts, last: event.ts };
      profiles.set(profileId, profile);
      const data = event.args?.data;
      const cpu = data?.cpuProfile;
      if (!cpu) return;
      const nodeId = profileId;
      if (!nodeNames.has(nodeId)) nodeNames.set(nodeId, new Map());
      const nodes = nodeNames.get(nodeId);
      for (const node of cpu.nodes ?? []) nodes.set(node.id, node.callFrame);
      profile.samples ??= [];
      const samples = cpu.samples ?? [];
      const deltas = data.timeDeltas ?? [];
      for (let index = 0; index < samples.length; index += 1) {
        profile.last += deltas[index] ?? 0;
        profile.samples.push([profile.last, samples[index]]);
      }
    }
  });
  return { names, processNames, marks, tasks, events, rasters, gc, concurrent, profiles, nodeNames };
}

function buildClockAlignment(marks, names, calibration) {
  const groups = new Map();
  for (const mark of marks) {
    const match = markPattern.exec(mark.name);
    if (!match) continue;
    const label = match[1];
    if (!groups.has(label)) groups.set(label, { key: mark.key, points: [] });
    groups.get(label).points.push({ now: Number(match[3]), epoch: Number(match[4]), ts: mark.ts });
  }
  const threads = {};
  for (const [label, group] of groups) {
    const perfFit = fitLine(group.points.map((p) => ({ x: p.now * 1000, y: p.ts })));
    const epochFit = fitLine(group.points.map((p) => ({ x: p.epoch * 1000, y: p.ts })));
    threads[label] = {
      thread: names.get(group.key) ?? group.key,
      marks: group.points.length,
      baselineMs: Math.max(...group.points.map((p) => p.now)) - Math.min(...group.points.map((p) => p.now)),
      perfNowFit: {
        n: perfFit.n,
        offsetUs: perfFit.a,
        driftPpm: typeof perfFit.b === "number" ? (perfFit.b - 1) * 1e6 : UNAVAILABLE,
        maxResidualUs: perfFit.maxResidualUs,
        model: { a: perfFit.a, b: perfFit.b, meanX: perfFit.meanX, meanY: perfFit.meanY },
      },
      epochFit: { n: epochFit.n, offsetUs: epochFit.a, driftPpm: typeof epochFit.b === "number" ? (epochFit.b - 1) * 1e6 : UNAVAILABLE, maxResidualUs: epochFit.maxResidualUs, model: { a: epochFit.a, b: epochFit.b, meanX: epochFit.meanX, meanY: epochFit.meanY } },
    };
  }
  const main = threads.main;
  const crossThread = {};
  const allEpochs = [...groups.values()].flatMap((group) => group.points.map((point) => point.epoch * 1000));
  const midEpochUs = allEpochs.length > 0 ? allEpochs.reduce((sum, value) => sum + value, 0) / allEpochs.length : 0;
  // Predicted around the fit's own mean: epoch microseconds are about 1.7e15, where a + b * x would lose precision.
  const atMid = (fit) => (fit.epochFit.n >= 2 ? fit.epochFit.model.meanY + fit.epochFit.model.b * (midEpochUs - fit.epochFit.model.meanX) : null);
  for (const [label, fit] of Object.entries(threads)) {
    if (label === "main") continue;
    const here = atMid(fit);
    const there = main ? atMid(main) : null;
    crossThread[label] = {
      traceTimeDisagreementUs: here !== null && there !== null ? here - there : UNAVAILABLE,
      note: "the two threads' fits of timeOrigin + performance.now() onto trace time, evaluated at the same epoch (the mean of all marks); 0 means the epoch clocks agree in trace time at that moment",
    };
  }
  return {
    schema: "ec102.clock-alignment.v1",
    model: "traceTsUs = offsetUs + (1 + driftPpm / 1e6) * (clockMs * 1000)",
    threads,
    crossThread,
    pingUncertainty: calibration ?? UNAVAILABLE,
  };
}

function selfTimeByFunction(profiles, nodeNames) {
  const perThread = new Map();
  for (const [id, profile] of profiles) {
    const nodes = nodeNames.get(id);
    if (!nodes || !profile.samples || profile.samples.length === 0) continue;
    if (!perThread.has(profile.key)) perThread.set(profile.key, new Map());
    const table = perThread.get(profile.key);
    const { samples } = profile;
    for (let index = 0; index < samples.length; index += 1) {
      const duration = index + 1 < samples.length ? samples[index + 1][0] - samples[index][0] : 0;
      const frame = nodes.get(samples[index][1]);
      if (!frame) continue;
      const name = frame.functionName === "" ? "(anonymous)" : frame.functionName;
      const row = `${name}\u0001${frame.url}\u0001${frame.lineNumber}`;
      table.set(row, (table.get(row) ?? 0) + duration);
    }
  }
  return perThread;
}

function overlap(aStart, aEnd, bStart, bEnd) {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

/**
 * Outermost tasks only, each counted once. Chromium emits RunTask and ThreadControllerImpl::RunTask
 * for the same task, nested; a task that starts inside an earlier one is absorbed by it, and if it
 * ends later (rounding) the outer task's extent grows to cover it, so the wall time of the result is
 * the union of the task intervals. The outer task's own thread CPU time (tdur) is kept.
 */
export function topLevel(tasks) {
  const sorted = [...tasks].sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const result = [];
  let current = null;
  for (const task of sorted) {
    if (current && task.ts < current.ts + current.dur) {
      const end = Math.max(current.ts + current.dur, task.ts + task.dur);
      current.dur = end - current.ts;
      continue;
    }
    current = { ts: task.ts, dur: task.dur, tdur: task.tdur };
    result.push(current);
  }
  return result;
}

const NO_CHILD_EVENT = "(no child event)";

function lowerBound(list, ts) {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid].ts < ts) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Events of one thread ordered so that a parent precedes its children. */
function sortEvents(list) {
  return [...(list ?? [])].sort((a, b) => a.ts - b.ts || b.dur - a.dur);
}

/**
 * Exclusive time per event name inside one task: a parent's time minus its direct children's. The
 * time inside the task that no nested event covers is reported as "(no child event)". The parts sum to
 * the task's duration. `events` must come from sortEvents. Events are clamped to their parent, so
 * overlap that is not strictly nested cannot make the parts exceed the whole.
 */
export function exclusiveBreakdown(task, events) {
  const end = task.ts + task.dur;
  const root = { name: NO_CHILD_EVENT, start: task.ts, end, child: 0 };
  const stack = [root];
  const totals = new Map();
  const close = (node) => {
    const exclusive = Math.max(0, node.end - node.start - node.child);
    totals.set(node.name, (totals.get(node.name) ?? 0) + exclusive);
  };
  for (let index = lowerBound(events, task.ts); index < events.length && events[index].ts < end; index += 1) {
    const event = events[index];
    while (stack.length > 1 && event.ts >= stack[stack.length - 1].end) close(stack.pop());
    const parent = stack[stack.length - 1];
    const start = Math.max(event.ts, parent.start);
    const stop = Math.min(event.ts + event.dur, parent.end);
    if (stop <= start) continue;
    parent.child += stop - start;
    stack.push({ name: event.name, start, end: stop, child: 0 });
  }
  while (stack.length > 1) close(stack.pop());
  close(root);
  return [...totals].filter(([, us]) => us > 0).sort((a, b) => b[1] - a[1]).map(([name, us]) => ({ name, us }));
}

/** wall, cpu and off-cpu time of a task record: tdur is the thread's CPU time over the same task. */
function timing(task) {
  const cpuUs = typeof task.tdur === "number" ? task.tdur : UNAVAILABLE;
  return { wallUs: task.dur, cpuUs, offCpuUs: typeof cpuUs === "number" ? task.dur - cpuUs : UNAVAILABLE };
}

function describeTask(task, events) {
  return { ts: task.ts, ...timing(task), breakdown: exclusiveBreakdown(task, events) };
}

function medianOf(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/**
 * Compares each worker's reported compute time with the duration of the matching top-level task on
 * the worker's thread. Tasks are searched between the job's dispatch and complete marks. With
 * labelled workers (browser-pool) the worker thread is known and, when the worker's receive time is
 * given, the task that contains it is chosen. In-app the worker threads are not individually
 * identifiable, so the job's largest worker tasks are paired with its reported values by rank.
 */
function computeVsTrace({ computeCheck, marks, tasks, names, workerLabels, alignment }) {
  const byName = new Map(marks.map((mark) => [mark.name, mark]));
  const keyOfLabel = new Map([...workerLabels].map(([key, name]) => [name, key]));
  const unlabelled = [...names].filter(([, name]) => /DedicatedWorker/.test(name)).map(([key]) => key);
  const entries = [];
  const matches = [];
  let jobsWithoutMarks = 0;
  const pending = (job, entry, reason) =>
    entries.push({ seq: job.seq, worker: entry.worker, reportedMs: entry.reportedMs, traceTaskMs: "unmatched", differenceMs: "unmatched", matchedBy: "none", reason });
  for (const job of computeCheck.jobs) {
    const start = byName.get(`ec102:job:${job.seq}:dispatch`);
    const end = byName.get(`ec102:job:${job.seq}:complete`);
    if (!start || !end) {
      jobsWithoutMarks += 1;
      for (const entry of job.entries) pending(job, entry, "job marks not found in the trace");
      continue;
    }
    const inWindow = (key) =>
      topLevel(tasks.get(key) ?? [])
        .filter((task) => overlap(task.ts, task.ts + task.dur, start.ts, end.ts) > 0)
        .map((task) => ({ ...task, key }));
    const record = (entry, task, matchedBy) => {
      matches.push({ job, entry, task, matchedBy });
      entries.push({
        seq: job.seq,
        worker: entry.worker,
        reportedMs: entry.reportedMs,
        traceTaskMs: task.dur / 1000,
        differenceMs: task.dur / 1000 - entry.reportedMs,
        matchedBy,
        reason: "",
      });
    };
    if (keyOfLabel.size > 0) {
      for (const entry of job.entries) {
        const key = keyOfLabel.get(`w${entry.worker}`);
        const candidates = key ? inWindow(key) : [];
        if (candidates.length === 0) {
          pending(job, entry, "no task on the worker thread in the job window");
          continue;
        }
        const model = alignment.threads[`w${entry.worker}`]?.epochFit?.model;
        let chosen = null;
        if (entry.recvEpochMs && model && typeof model.meanY === "number") {
          const at = model.meanY + model.b * (entry.recvEpochMs * 1000 - model.meanX);
          // A task that strictly contains the receive time wins; otherwise the nearest one within the fit's residual.
          chosen = candidates.find((task) => at >= task.ts && at <= task.ts + task.dur) ?? null;
          if (!chosen) {
            const distance = (task) => (at < task.ts ? task.ts - at : at - (task.ts + task.dur));
            const nearest = [...candidates].sort((a, b) => distance(a) - distance(b))[0];
            if (distance(nearest) <= 500) chosen = nearest;
          }
        }
        if (chosen) record(entry, chosen, "worker thread, task containing the receive time");
        else record(entry, [...candidates].sort((a, b) => b.dur - a.dur)[0], "worker thread, largest task in the window");
      }
    } else {
      const largest = unlabelled
        .map((key) => [...inWindow(key)].sort((a, b) => b.dur - a.dur)[0])
        .filter(Boolean)
        .sort((a, b) => b.dur - a.dur);
      [...job.entries]
        .sort((a, b) => b.reportedMs - a.reportedMs)
        .forEach((entry, index) => {
          if (largest[index]) record(entry, largest[index], "rank within the job (worker threads are not individually identifiable)");
          else pending(job, entry, "fewer worker tasks than reported values in the job window");
        });
    }
  }
  const matched = entries.filter((entry) => typeof entry.differenceMs === "number");
  const differences = matched.map((entry) => entry.differenceMs);
  const result = {
    schema: "ec102.compute-vs-trace.v1",
    reportedValues: computeCheck.wholeMilliseconds
      ? "whole milliseconds: the production workers read Date.now(), so reported values are integers"
      : "fractional milliseconds from the preamble's high-resolution Date.now replacement",
    traceTask: "duration of the top-level task on the worker thread; it also contains the message deserialize and the reply post, so it is expected to be at least the reported value",
    summary: {
      jobs: computeCheck.jobs.length,
      jobsWithoutMarks,
      entries: entries.length,
      matched: matched.length,
      unmatched: entries.length - matched.length,
      differenceMs: matched.length === 0
        ? UNAVAILABLE
        : { min: Math.min(...differences), median: medianOf(differences), max: Math.max(...differences), mean: differences.reduce((s, v) => s + v, 0) / differences.length },
    },
    entries,
  };
  return { result, matches };
}

const JOB_FIELDS = [
  "reportedMetric",
  "firstPostToFirstWorkerStartUs",
  "firstPostToLastWorkerEndUs",
  "slowestWorkerWallUs",
  "slowestWorkerCpuUs",
  "slowestWorkerOffCpuUs",
  "lastWorkerEndToLastHandlerStartUs",
  "mainBusyWallUs",
  "mainBusyCpuUs",
  "lastHandlerUs",
  "gcOnMainInWindowUs",
  "gcOnWorkersInWindowUs",
  "lateStartWorkers",
  "mainOffCpuDuringWaitUs",
  "rasterWallDuringWaitUs",
  "rasterThreadsDuringWait",
];

// Report levels: rows of the count table, in milliseconds of the job's reported metric. They are not budgets.
export const REPORT_LEVELS_MS = [8, 12, 25, 50];
const FRAME_CHILD_NAMES = ["Commit", "PrePaint", "Layerize", "Paint"];

/**
 * One line per job, needing no worker pairing. The window runs from the job's first post to the start
 * of its last reply handler on main; worker tasks are the top-level tasks on DedicatedWorker threads
 * that start inside it. A worker task that straddles the first post is not counted but is reported as
 * lateStartWorkers. Main busy time is main's top-level task time overlapping the wait from the latest
 * worker task end to the last handler start; mainBusyCpuUs adds the thread CPU time of those whole tasks.
 */
function jobLevelDecomposition({ computeCheck, marks, tasks, eventsOf, mainKey, alignment, gc, names, rasters, boundary, reportLevelsMs = REPORT_LEVELS_MS }) {
  const mainPid = mainKey ? Number(mainKey.split(":")[0]) : null;
  const rasterEvents = rasters.filter((event) => event.pid === mainPid && /ThreadPoolForegroundWorker/.test(names.get(event.key) ?? ""));
  const model = alignment.threads.main?.perfNowFit?.model;
  const fitted = model && typeof model.b === "number" && typeof model.meanX === "number";
  const toTrace = (ms) => (fitted && typeof ms === "number" && Number.isFinite(ms) ? model.meanY + model.b * (ms * 1000 - model.meanX) : null);
  const byName = new Map(marks.map((mark) => [mark.name, mark]));
  const workerKeys = [...names].filter(([, name]) => /DedicatedWorker/.test(name)).map(([key]) => key);
  const workerTasks = new Map(workerKeys.map((key) => [key, topLevel(tasks.get(key) ?? [])]));
  const mainTasks = mainKey ? topLevel(tasks.get(mainKey) ?? []) : [];
  const mainEvents = mainKey ? eventsOf(mainKey) : [];
  const lines = [];
  for (const job of computeCheck.jobs) {
    const firstPost = toTrace(job.firstPostStartMs);
    const lastHandlerStart = toTrace(job.lastHandlerStartMs);
    const line = {
      requestSeq: job.seq,
      jobKind: job.jobKind ?? UNAVAILABLE,
      boundary,
      clock: "trace-ts-us",
      reportedMetric: typeof job.metricMs === "number" ? job.metricMs : UNAVAILABLE,
      reportedMetricName: computeCheck.metricName ?? UNAVAILABLE,
    };
    if (firstPost === null || lastHandlerStart === null) {
      for (const name of JOB_FIELDS) if (!(name in line)) line[name] = UNAVAILABLE;
      line.mainTaskHasFrameChildren = UNAVAILABLE;
      line.note = "job stamps or the main clock fit are missing";
      lines.push(line);
      continue;
    }
    const dispatch = byName.get(`ec102:job:${job.seq}:dispatch`);
    const windowStart = dispatch ? Math.min(dispatch.ts, firstPost) : firstPost;
    const inJob = [];
    let late = 0;
    for (const key of workerKeys) {
      for (const task of workerTasks.get(key)) {
        if (task.ts > lastHandlerStart || task.ts + task.dur < windowStart) continue;
        if (task.ts >= firstPost) inJob.push(task);
        else if (task.ts + task.dur > firstPost) late += 1;
      }
    }
    line.firstPostTs = firstPost;
    line.lastHandlerStartTs = lastHandlerStart;
    line.lateStartWorkers = late;
    line.workerTasksInWindow = inJob.length;
    line.lastHandlerUs = typeof job.lastHandlerEndMs === "number" ? (job.lastHandlerEndMs - job.lastHandlerStartMs) * 1000 : UNAVAILABLE;
    const gcIn = (predicate) => gc.filter((event) => predicate(event.key)).reduce((sum, event) => sum + overlap(event.ts, event.ts + event.dur, firstPost, lastHandlerStart), 0);
    line.gcOnMainInWindowUs = gcIn((key) => key === mainKey);
    line.gcOnWorkersInWindowUs = gcIn((key) => workerKeys.includes(key));
    if (inJob.length === 0) {
      for (const name of JOB_FIELDS) if (!(name in line)) line[name] = UNAVAILABLE;
      line.mainTaskHasFrameChildren = UNAVAILABLE;
      line.note = "no worker task started inside the job window";
      lines.push(line);
      continue;
    }
    const slowest = inJob.reduce((best, task) => (task.dur > best.dur ? task : best));
    const firstStart = Math.min(...inJob.map((task) => task.ts));
    const lastEnd = Math.max(...inJob.map((task) => task.ts + task.dur));
    line.firstPostToFirstWorkerStartUs = firstStart - firstPost;
    line.firstPostToLastWorkerEndUs = lastEnd - firstPost;
    line.slowestWorkerWallUs = slowest.dur;
    line.slowestWorkerCpuUs = typeof slowest.tdur === "number" ? slowest.tdur : UNAVAILABLE;
    line.slowestWorkerOffCpuUs = typeof slowest.tdur === "number" ? slowest.dur - slowest.tdur : UNAVAILABLE;
    line.lastWorkerEndToLastHandlerStartUs = lastHandlerStart - lastEnd;
    const waiting = lastHandlerStart > lastEnd
      ? mainTasks.map((task) => ({ task, shared: overlap(task.ts, task.ts + task.dur, lastEnd, lastHandlerStart) })).filter(({ shared }) => shared > 0)
      : [];
    line.mainBusyWallUs = waiting.reduce((sum, { shared }) => sum + shared, 0);
    line.mainBusyCpuUs = waiting.length === 0 ? 0 : (waiting.every(({ task }) => typeof task.tdur === "number") ? waiting.reduce((sum, { task }) => sum + task.tdur, 0) : UNAVAILABLE);
    // Estimate: CPU inside a task is not uniform, so the CPU of the overlap is the task's tdur scaled by overlap / wall.
    line.mainOffCpuDuringWaitUs = waiting.length === 0
      ? 0
      : (waiting.every(({ task }) => typeof task.tdur === "number" && task.dur > 0)
        ? waiting.reduce((sum, { task, shared }) => sum + (shared - task.tdur * (shared / task.dur)), 0)
        : UNAVAILABLE);
    const waitStart = lastEnd;
    const waitEnd = lastHandlerStart;
    const rasterThreads = new Set();
    let rasterWall = 0;
    if (waitEnd > waitStart) {
      for (const event of rasterEvents) {
        const shared = overlap(event.ts, event.ts + event.dur, waitStart, waitEnd);
        if (shared > 0) {
          rasterWall += shared;
          rasterThreads.add(event.key);
        }
      }
    }
    line.rasterWallDuringWaitUs = rasterWall;
    line.rasterThreadsDuringWait = rasterThreads.size;
    const frameChildren = new Set();
    for (const { task } of waiting) {
      for (let index = lowerBound(mainEvents, task.ts); index < mainEvents.length && mainEvents[index].ts < task.ts + task.dur; index += 1) {
        if (FRAME_CHILD_NAMES.includes(mainEvents[index].name)) frameChildren.add(mainEvents[index].name);
      }
    }
    line.mainTaskHasFrameChildren = frameChildren.size > 0;
    line.mainTaskFrameChildren = [...frameChildren].sort();
    line.mainTasksDuringWait = [...waiting]
      .sort((a, b) => b.shared - a.shared)
      .slice(0, 3)
      .map(({ task, shared }) => ({ ts: task.ts, ...timing(task), overlapUs: shared, exclusive: exclusiveBreakdown(task, mainEvents).slice(0, 5) }));
    lines.push(line);
  }
  const rankedJobs = lines.filter((line) => typeof line.reportedMetric === "number").sort((a, b) => b.reportedMetric - a.reportedMetric);
  const slowCount = rankedJobs.length === 0 ? 0 : Math.max(1, Math.ceil(rankedJobs.length * 0.1));
  const slow = new Set(rankedJobs.slice(0, slowCount).map((line) => line.requestSeq));
  const summarise = (subset) => ({ jobs: subset.length, fields: Object.fromEntries(JOB_FIELDS.map((name) => [name, fieldStats(subset.map((line) => line[name]))])) });
  const kinds = [...new Set(lines.map((line) => line.jobKind))];
  const waitExceeds = (subset) => ({
    jobs: subset.length,
    replyWaitExceedsSlowestWorker: subset.filter((line) => typeof line.lastWorkerEndToLastHandlerStartUs === "number" && typeof line.slowestWorkerWallUs === "number" && line.lastWorkerEndToLastHandlerStartUs > line.slowestWorkerWallUs).length,
    withFrameChildrenInWait: subset.filter((line) => line.mainTaskHasFrameChildren === true).length,
  });
  const summary = {
    schema: "ec102.job-decomposition-jobs-summary.v1",
    counts: {
      note: "counts only; the levels are rows of a report table (reported metric at or above the level, in ms), not budgets or thresholds",
      all: waitExceeds(lines),
      atOrAboveReportedMetricMs: Object.fromEntries(reportLevelsMs.map((level) => [String(level), waitExceeds(lines.filter((line) => typeof line.reportedMetric === "number" && line.reportedMetric >= level))])),
    },
    boundary,
    clock: "trace-ts-us",
    units: "microseconds, except reportedMetric (milliseconds) and the count lateStartWorkers",
    window: "first post to the start of the last reply handler on main; worker tasks are top-level tasks on DedicatedWorker threads that start at or after the first post",
    jobs: lines.length,
    all: summarise(lines),
    slowest10PercentByReportedMetric: { ...summarise(lines.filter((line) => slow.has(line.requestSeq))), seqs: [...slow].sort((a, b) => a - b) },
    byJobKind: Object.fromEntries(kinds.map((kind) => [kind, summarise(lines.filter((line) => line.jobKind === kind))])),
  };
  return { lines, summary };
}

const DECOMPOSITION_FIELDS = [
  "dispatchToWorkerStartUs",
  "workerTaskWallUs",
  "workerTaskCpuUs",
  "workerEndToMainHandlerUs",
  "mainBusyDuringReplyWaitUs",
  "reportedMetric",
];

function fieldStats(values) {
  const numbers = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  if (numbers.length === 0) return { n: 0, p50: UNAVAILABLE, p95: UNAVAILABLE, p99: UNAVAILABLE, max: UNAVAILABLE };
  return { n: numbers.length, p50: nearestRank(numbers, 0.5), p95: nearestRank(numbers, 0.95), p99: nearestRank(numbers, 0.99), max: Math.max(...numbers) };
}

/**
 * One line per job and worker, on the trace clock, for the path post -> worker task -> reply -> main
 * handler. The main thread's performance.now() stamps are mapped onto trace time with the main clock
 * fit. The worker task is the one compute-vs-trace matched; in-app that match is by rank, which is
 * approximate (the worker threads cannot be told apart), and the lines say so.
 */
function jobDecomposition({ computeCheck, matches, tasks, events, mainKey, alignment, boundary }) {
  const model = alignment.threads.main?.perfNowFit?.model;
  const fitted = model && typeof model.b === "number" && typeof model.meanX === "number";
  const toTrace = (ms) => (fitted && typeof ms === "number" ? model.meanY + model.b * (ms * 1000 - model.meanX) : null);
  const mainTasks = mainKey ? topLevel(tasks.get(mainKey) ?? []) : [];
  const mainEvents = mainKey ? sortEvents(events.get(mainKey)) : [];
  const metricByJob = new Map(computeCheck.jobs.map((job) => [job.seq, typeof job.metricMs === "number" ? job.metricMs : UNAVAILABLE]));
  const lines = [];
  for (const { job, entry, task, matchedBy } of matches) {
    const postEnd = toTrace(entry.postEndMs);
    const handlerStart = toTrace(entry.handlerStartMs);
    const workerEnd = task.ts + task.dur;
    let busy = UNAVAILABLE;
    let busyTasks = UNAVAILABLE;
    if (handlerStart !== null) {
      busy = 0;
      busyTasks = [];
      for (const main of mainTasks) {
        const shared = overlap(main.ts, main.ts + main.dur, workerEnd, handlerStart);
        const holdsHandler = main.ts <= handlerStart && handlerStart <= main.ts + main.dur;
        if (shared <= 0 && !(holdsHandler && handlerStart >= workerEnd)) continue;
        busy += shared;
        busyTasks.push({
          ts: main.ts,
          ...timing(main),
          overlapUs: shared,
          containsHandlerStart: holdsHandler,
          topExclusive: exclusiveBreakdown(main, mainEvents).slice(0, 3),
        });
      }
    }
    lines.push({
      seq: job.seq,
      worker: entry.worker,
      boundary,
      clock: "trace-ts-us",
      workerMatch: matchedBy,
      workerMatchApproximate: matchedBy.startsWith("rank"),
      postEndTs: postEnd ?? UNAVAILABLE,
      workerTaskStartTs: task.ts,
      workerTaskEndTs: workerEnd,
      handlerStartTs: handlerStart ?? UNAVAILABLE,
      dispatchToWorkerStartUs: postEnd === null ? UNAVAILABLE : task.ts - postEnd,
      workerTaskWallUs: task.dur,
      workerTaskCpuUs: typeof task.tdur === "number" ? task.tdur : UNAVAILABLE,
      workerEndToMainHandlerUs: handlerStart === null ? UNAVAILABLE : handlerStart - workerEnd,
      mainBusyDuringReplyWaitUs: busy,
      mainTasksDuringReplyWait: busyTasks,
      reportedMetric: metricByJob.get(job.seq) ?? UNAVAILABLE,
      reportedMetricName: computeCheck.metricName ?? UNAVAILABLE,
      reportedWorkerComputeMs: entry.reportedMs,
    });
  }
  const byJob = new Map();
  for (const line of lines) {
    if (typeof line.reportedMetric === "number" && !byJob.has(line.seq)) byJob.set(line.seq, line.reportedMetric);
  }
  const ranked = [...byJob].sort((a, b) => b[1] - a[1]);
  const slowCount = ranked.length === 0 ? 0 : Math.max(1, Math.ceil(ranked.length * 0.1));
  const slowSeqs = new Set(ranked.slice(0, slowCount).map(([seq]) => seq));
  const summarise = (subset) => Object.fromEntries(DECOMPOSITION_FIELDS.map((name) => [name, fieldStats(subset.map((line) => line[name]))]));
  const methods = [...new Set(lines.map((line) => line.workerMatch))];
  const summary = {
    schema: "ec102.job-decomposition-summary.v1",
    boundary,
    clock: "trace-ts-us",
    units: "microseconds, except reportedMetric which is in the job's own unit (milliseconds)",
    lines: lines.length,
    jobs: byJob.size,
    workerMatching: {
      methods,
      approximate: lines.some((line) => line.workerMatchApproximate),
      note: boundary === "browser-app"
        ? "approximate: in-app the worker threads cannot be told apart, so each job's reported shard values are paired with its largest worker tasks by rank; the task paired with a line may belong to another worker"
        : "worker thread known from its clock marks; the task is the one containing the worker's receive time, else the largest task in the job window",
    },
    mainClockFit: fitted ? { baselineMs: alignment.threads.main.baselineMs, driftPpm: alignment.threads.main.perfNowFit.driftPpm, maxResidualUs: alignment.threads.main.perfNowFit.maxResidualUs } : UNAVAILABLE,
    all: summarise(lines),
    slowest10PercentByReportedMetric: {
      jobs: slowSeqs.size,
      seqs: [...slowSeqs].sort((a, b) => a - b),
      fields: summarise(lines.filter((line) => slowSeqs.has(line.seq))),
    },
  };
  return { lines, summary };
}

export async function analyzeTrace({ file, outDir, calibrationFile, exemplars, computeCheck }) {
  const data = await collect(file);
  const { names, processNames, marks, tasks, events, rasters, gc: gcAll, concurrent, profiles, nodeNames } = data;
  const sortedCache = new Map();
  const eventsOf = (key) => {
    if (!sortedCache.has(key)) sortedCache.set(key, sortEvents(events.get(key)));
    return sortedCache.get(key);
  };
  const gc = gcAll.filter((event) => isJsThread(names.get(event.key)));

  const workerLabels = new Map();
  for (const mark of marks) {
    const match = markPattern.exec(mark.name);
    if (match && match[1] !== "main") workerLabels.set(mark.key, match[1]);
  }
  const mainKey = marks.find((mark) => /^ec102:clk:main:/.test(mark.name))?.key
    ?? [...names].find(([, name]) => /CrRendererMain/.test(name))?.[0];

  const threadMap = [...names].map(([key, name]) => {
    const [pid, tid] = key.split(":").map(Number);
    return { pid, tid, processName: processNames.get(pid) ?? "", threadName: name, role: roleOf(name), workerLabel: workerLabels.get(key) ?? null, isMarkedMain: key === mainKey };
  });
  writeJson(join(outDir, "thread-map.json"), threadMap);

  let calibration = null;
  if (calibrationFile && existsSync(calibrationFile)) {
    const raw = JSON.parse(readFileSync(calibrationFile, "utf8"));
    const end = raw.end?.workers ?? [];
    calibration = { source: "clock-calibration.json", halfRttMs: end.map((entry) => ({ worker: entry.worker, halfRttMs: entry.halfRttMs })) };
  }
  const alignment = buildClockAlignment(marks, names, calibration);
  writeJson(join(outDir, "clock-alignment.json"), alignment);

  const label = (key) => workerLabels.get(key) ?? (key === mainKey ? "main" : names.get(key) ?? key);
  writeFileSync(
    join(outDir, "gc.jsonl"),
    serializeJsonl([...gc].sort((a, b) => a.ts - b.ts).map(({ key, ...rest }) => ({ thread: label(key), ...rest }))),
    "utf8",
  );
  const gcSummary = {};
  for (const event of gc) {
    const thread = (gcSummary[label(event.key)] ??= {});
    const row = (thread[event.kind] ??= { count: 0, durUs: 0 });
    row.count += 1;
    row.durUs += event.dur;
  }
  writeJson(join(outDir, "gc-summary.json"), {
    note: "Real collections only. minor and major durUs are pause time on that thread; incremental-marking-step durUs is time spent in steps, not a pause of the whole collection.",
    perThread: gcSummary,
  });
  const concurrentByName = {};
  let concurrentTotalUs = 0;
  for (const event of concurrent) {
    if (!/ThreadPool/.test(names.get(event.key) ?? "")) continue;
    const row = (concurrentByName[event.name] ??= { count: 0, durUs: 0 });
    row.count += 1;
    row.durUs += event.dur;
    concurrentTotalUs += event.dur;
  }
  writeJson(join(outDir, "gc-concurrent.json"), {
    concurrent: true,
    pause: false,
    note: "Background and parallel scavenge work on thread-pool threads. It runs beside JavaScript and is not a pause; the durations overlap each other across threads and are summed here as thread time only.",
    totalThreadUs: concurrentTotalUs,
    byName: concurrentByName,
  });

  const windowStart = marks.find((mark) => mark.name === "ec102:window:start")?.ts ?? -Infinity;
  const windowEnd = marks.find((mark) => mark.name === "ec102:window:end")?.ts ?? Infinity;
  const busy = {};
  for (const [key, list] of tasks) {
    // Outermost tasks are found first and then selected by start time, so a nested task whose parent
    // starts before the window is never promoted to a task of its own.
    const inside = topLevel(list).filter((task) => task.ts >= windowStart && task.ts <= windowEnd);
    const withCpu = inside.filter((task) => typeof task.tdur === "number");
    const cpuTotal = withCpu.reduce((sum, task) => sum + task.tdur, 0);
    const wallTotal = inside.reduce((sum, task) => sum + task.dur, 0);
    busy[label(key)] = {
      thread: names.get(key) ?? key,
      windowUs: Number.isFinite(windowEnd - windowStart) ? windowEnd - windowStart : UNAVAILABLE,
      busyUs: wallTotal,
      wallUs: wallTotal,
      cpuUs: withCpu.length === 0 && inside.length > 0 ? UNAVAILABLE : cpuTotal,
      offCpuUs: withCpu.length === inside.length && inside.length > 0 ? wallTotal - cpuTotal : (inside.length === 0 ? 0 : UNAVAILABLE),
      tasksWithoutCpuTime: inside.length - withCpu.length,
      tasks: inside.length,
      maxTaskUs: inside.reduce((max, task) => Math.max(max, task.dur), 0),
      topTasksUs: inside.map((task) => task.dur).sort((a, b) => b - a).slice(0, 5),
      topTasks: [...inside].sort((a, b) => b.dur - a.dur).slice(0, 5).map((task) => describeTask(task, eventsOf(key))),
      longTasks: inside.filter((task) => task.dur >= LONG_TASK_US).map((task) => ({ ts: task.ts, durUs: task.dur })),
    };
  }
  writeJson(join(outDir, "busy.json"), busy);

  // RasterTask work per renderer process over the measured window (tasks starting inside it), so a reader can
  // see whether a control changed raster work at all.
  const raster = { measuredWindow: Number.isFinite(windowEnd - windowStart), renderers: {} };
  for (const pid of new Set([...names].filter(([, name]) => /CrRendererMain/.test(name)).map(([key]) => Number(key.split(":")[0])))) {
    const inside = rasters.filter((event) => event.pid === pid && event.ts >= windowStart && event.ts <= windowEnd);
    raster.renderers[String(pid)] = {
      rasterTasks: inside.length,
      rasterTotalWallUs: inside.reduce((sum, event) => sum + event.dur, 0),
      rasterTaskWallUs: fieldStats(inside.map((event) => event.dur)),
    };
  }

  const selfTimes = selfTimeByFunction(profiles, nodeNames);
  const cpuTop = {};
  for (const [key, table] of selfTimes) {
    const total = [...table.values()].reduce((sum, value) => sum + value, 0);
    cpuTop[label(key)] = {
      thread: names.get(key) ?? key,
      totalSelfUs: total,
      functions: [...table]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 40)
        .map(([row, us]) => {
          const [functionName, url, line] = row.split("\u0001");
          return { functionName, url, lineNumber: Number(line), selfMs: us / 1000, fraction: total === 0 ? 0 : us / total };
        }),
    };
  }
  writeJson(join(outDir, "cpu-top.json"), cpuTop);

  let computeSummary = UNAVAILABLE;
  let decompositionSummary = UNAVAILABLE;
  let jobLevelSummary = UNAVAILABLE;
  if (computeCheck) {
    const { result: check, matches } = computeVsTrace({ computeCheck, marks, tasks, names, workerLabels, alignment });
    writeJson(join(outDir, "compute-vs-trace.json"), check);
    computeSummary = check.summary;
    const decomposition = jobDecomposition({
      computeCheck,
      matches,
      tasks,
      events: new Map([...events.keys()].map((key) => [key, eventsOf(key)])),
      mainKey,
      alignment,
      boundary: workerLabels.size > 0 ? "browser-pool" : "browser-app",
    });
    writeFileSync(join(outDir, "job-decomposition.jsonl"), serializeJsonl(decomposition.lines), "utf8");
    writeJson(join(outDir, "job-decomposition-summary.json"), decomposition.summary);
    decompositionSummary = decomposition.summary;
    const jobLevel = jobLevelDecomposition({ computeCheck, marks, tasks, eventsOf, mainKey, alignment, gc, names, rasters, boundary: decomposition.summary.boundary });
    writeFileSync(join(outDir, "job-decomposition-jobs.jsonl"), serializeJsonl(jobLevel.lines), "utf8");
    writeJson(join(outDir, "job-decomposition-jobs-summary.json"), jobLevel.summary);
    jobLevelSummary = jobLevel.summary;
  }
  const exemplarOutput = await buildExemplars({ file, outDir, exemplars, marks, tasks, eventsOf, gc, profiles, nodeNames, label, names });
  return {
    threads: threadMap.length,
    marks: marks.length,
    gcEvents: gc.length,
    computeVsTrace: computeSummary,
    jobDecomposition: decompositionSummary,
    jobLevelDecomposition: jobLevelSummary,
    raster,
    cpuThreads: Object.keys(cpuTop).length,
    alignment,
    exemplars: exemplarOutput,
  };
}

async function buildExemplars({ file, outDir, exemplars, marks, tasks, eventsOf, gc, profiles, label, nodeNames }) {
  if (!exemplars || exemplars.jobs.length === 0) {
    writeJson(join(outDir, "exemplars.json"), { phase: exemplars?.phase ?? UNAVAILABLE, exemplars: [], note: "no ranked jobs were supplied" });
    return [];
  }
  const found = [];
  for (const job of exemplars.jobs) {
    const start = marks.find((mark) => mark.name === `ec102:job:${job.seq}:dispatch`);
    const end = marks.find((mark) => mark.name === `ec102:job:${job.seq}:complete`);
    if (!start || !end) {
      found.push({ ...job, missing: "job marks not found in the trace" });
      continue;
    }
    const windowStart = start.ts;
    const windowEnd = Math.max(end.ts, start.ts + 1);
    const windowUs = windowEnd - windowStart;
    const threads = {};
    for (const [key, list] of tasks) {
      // Only the page's main thread and its workers: the browser's other threads are not part of a job.
      const name = label(key);
      if (!(name === "main" || /^w\d+$/.test(name) || /DedicatedWorker/.test(name))) continue;
      const inWindow = topLevel(list)
        .filter((task) => overlap(task.ts, task.ts + task.dur, windowStart, windowEnd) > 0)
        .sort((a, b) => overlap(b.ts, b.ts + b.dur, windowStart, windowEnd) - overlap(a.ts, a.ts + a.dur, windowStart, windowEnd))
        .slice(0, 10);
      if (inWindow.length === 0) continue;
      threads[name] = {
        tasks: inWindow.map((task) => ({ ...describeTask(task, eventsOf(key)), durUs: task.dur, overlapUs: overlap(task.ts, task.ts + task.dur, windowStart, windowEnd), fractionOfWindow: overlap(task.ts, task.ts + task.dur, windowStart, windowEnd) / windowUs })),
        gc: gc.filter((event) => event.key === key && overlap(event.ts, event.ts + event.dur, windowStart, windowEnd) > 0).map((event) => ({ kind: event.kind, durUs: event.dur, heapBefore: event.heapBefore, heapAfter: event.heapAfter })),
        topFunctions: topSampled(profiles, nodeNames, key, windowStart, windowEnd),
      };
    }
    found.push({ ...job, windowStartTs: windowStart, windowEndTs: windowEnd, windowUs, threads });
  }
  writeJson(join(outDir, "exemplars.json"), { phase: exemplars.phase, exemplars: found });

  // Second pass: sanitised slices, loadable in DevTools, without ProfileChunk events.
  const wanted = found.filter((entry) => entry.windowStartTs !== undefined);
  const slices = new Map(wanted.map((entry) => [entry.seq, { entry, metadata: [], events: [] }]));
  await streamTraceEvents(file, (event) => {
    for (const slice of slices.values()) {
      if (event.ph === "M") {
        if (slice.metadata.length < 400 && slice.metadata.every((m) => !(m.pid === event.pid && m.tid === event.tid && m.name === event.name))) slice.metadata.push(event);
      } else if (event.name !== "ProfileChunk" && event.name !== "Profile" && typeof event.ts === "number"
        && event.ts + (event.dur ?? 0) >= slice.entry.windowStartTs - EXEMPLAR_MARGIN_US && event.ts <= slice.entry.windowEndTs + EXEMPLAR_MARGIN_US) {
        slice.events.push(event);
      }
    }
  });
  const terms = privacyTerms();
  const written = [];
  for (const { entry, metadata, events } of slices.values()) {
    let kept = events;
    const render = () => JSON.stringify(sanitizeTrace({ traceEvents: [...metadata, ...kept], metadata: { ec102Exemplar: { seq: entry.seq, phase: exemplars.phase, value: entry.value } } }, terms));
    let text = render();
    while (Buffer.byteLength(text) > EXEMPLAR_BYTES && kept.length > 0) {
      // Drop the shortest events first until the slice fits; marks and long events survive longest.
      kept = [...kept].sort((a, b) => (b.dur ?? 0) - (a.dur ?? 0)).slice(0, Math.floor(kept.length * 0.8));
      text = render();
    }
    const name = `exemplar-${entry.seq}.trace.json`;
    writeFileSync(join(outDir, name), text, "utf8");
    written.push({ file: name, bytes: Buffer.byteLength(text), events: kept.length, droppedForSize: kept.length < events.length });
  }
  return written;
}

function topSampled(profiles, nodeNames, key, windowStart, windowEnd) {
  const table = new Map();
  for (const [id, profile] of profiles) {
    if (profile.key !== key || !profile.samples) continue;
    const nodes = nodeNames.get(id);
    if (!nodes) continue;
    const { samples } = profile;
    for (let index = 0; index + 1 < samples.length; index += 1) {
      if (samples[index][0] < windowStart || samples[index][0] > windowEnd) continue;
      const frame = nodes.get(samples[index][1]);
      if (!frame || frame.functionName === "(idle)") continue;
      const row = `${frame.functionName === "" ? "(anonymous)" : frame.functionName}\u0001${frame.url}\u0001${frame.lineNumber}`;
      table.set(row, (table.get(row) ?? 0) + (samples[index + 1][0] - samples[index][0]));
    }
  }
  const total = [...table.values()].reduce((sum, value) => sum + value, 0);
  return [...table].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([row, us]) => {
    const [functionName, url, line] = row.split("\u0001");
    return { functionName, url, lineNumber: Number(line), selfMs: us / 1000, fractionOfSampled: total === 0 ? 0 : us / total };
  });
}

/** The K slowest jobs of a phase, by request sequence, from a samples.jsonl. */
export function rankJobs(samplesFile, phase, top = 3) {
  const samples = parseJsonl(readFileSync(samplesFile, "utf8")).filter((sample) => sample.phase === phase && sample.outcome === "ok" && typeof sample.requestSeq === "number");
  const best = new Map();
  for (const sample of samples) if (!best.has(sample.requestSeq) || sample.duration > best.get(sample.requestSeq)) best.set(sample.requestSeq, sample.duration);
  return [...best].sort((a, b) => b[1] - a[1]).slice(0, top).map(([seq, value]) => ({ seq, value }));
}

if (process.argv[1] && process.argv[1].endsWith("trace-analyze.mjs")) {
  const arg = (name) => {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : undefined;
  };
  const file = arg("trace");
  const outDir = arg("out");
  if (!file || !outDir) {
    console.error("usage: trace-analyze.mjs --trace <file> --out <dir> [--rank <samples.jsonl> --phase <name> --top <k>] [--calibration <file>]");
    process.exit(2);
  }
  const phase = arg("phase") ?? "pool.compute-metric";
  const exemplars = arg("rank") ? { phase, jobs: rankJobs(arg("rank"), phase, Number(arg("top") ?? 3)) } : undefined;
  const result = await analyzeTrace({ file, outDir, calibrationFile: arg("calibration"), exemplars });
  console.log(JSON.stringify({ threads: result.threads, marks: result.marks, gcEvents: result.gcEvents, cpuThreads: result.cpuThreads, exemplars: result.exemplars }));
}
