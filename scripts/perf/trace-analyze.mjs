#!/usr/bin/env node
// Reads a Chromium trace (a {traceEvents} object or a bare array) as a stream and writes the
// analysis files named in the EC-102 design: thread-map, clock-alignment, gc, busy, cpu-top,
// exemplars and sanitised exemplar slices.
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { UNAVAILABLE, parseJsonl, privacyTerms, sanitizeTrace, serializeJsonl, writeJson } from "./lib.mjs";

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
      tasks.get(key).push({ ts: event.ts, dur: event.dur ?? 0 });
      return;
    }
    if (event.ph === "X" && typeof event.name === "string") {
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
  return { names, processNames, marks, tasks, gc, concurrent, profiles, nodeNames };
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

/** Top-level tasks only: drops any task that lies inside an earlier, longer one. */
function topLevel(tasks) {
  const sorted = [...tasks].sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const result = [];
  let end = -Infinity;
  for (const task of sorted) {
    if (task.ts >= end) {
      result.push(task);
      end = task.ts + task.dur;
    }
  }
  return result;
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
      topLevel(tasks.get(key) ?? []).filter((task) => overlap(task.ts, task.ts + task.dur, start.ts, end.ts) > 0);
    const record = (entry, task, matchedBy) =>
      entries.push({
        seq: job.seq,
        worker: entry.worker,
        reportedMs: entry.reportedMs,
        traceTaskMs: task.dur / 1000,
        differenceMs: task.dur / 1000 - entry.reportedMs,
        matchedBy,
        reason: "",
      });
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
  return result;
}

export async function analyzeTrace({ file, outDir, calibrationFile, exemplars, computeCheck }) {
  const data = await collect(file);
  const { names, processNames, marks, tasks, gc: gcAll, concurrent, profiles, nodeNames } = data;
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
    const inside = topLevel(list.filter((task) => task.ts >= windowStart && task.ts <= windowEnd));
    busy[label(key)] = {
      thread: names.get(key) ?? key,
      windowUs: Number.isFinite(windowEnd - windowStart) ? windowEnd - windowStart : UNAVAILABLE,
      busyUs: inside.reduce((sum, task) => sum + task.dur, 0),
      tasks: inside.length,
      maxTaskUs: inside.reduce((max, task) => Math.max(max, task.dur), 0),
      topTasksUs: inside.map((task) => task.dur).sort((a, b) => b - a).slice(0, 5),
      longTasks: inside.filter((task) => task.dur >= LONG_TASK_US).map((task) => ({ ts: task.ts, durUs: task.dur })),
    };
  }
  writeJson(join(outDir, "busy.json"), busy);

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
  if (computeCheck) {
    const check = computeVsTrace({ computeCheck, marks, tasks, names, workerLabels, alignment });
    writeJson(join(outDir, "compute-vs-trace.json"), check);
    computeSummary = check.summary;
  }
  const exemplarOutput = await buildExemplars({ file, outDir, exemplars, marks, tasks, gc, profiles, nodeNames, label, names });
  return {
    threads: threadMap.length,
    marks: marks.length,
    gcEvents: gc.length,
    computeVsTrace: computeSummary,
    cpuThreads: Object.keys(cpuTop).length,
    alignment,
    exemplars: exemplarOutput,
  };
}

async function buildExemplars({ file, outDir, exemplars, marks, tasks, gc, profiles, label, nodeNames }) {
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
        tasks: inWindow.map((task) => ({ ts: task.ts, durUs: task.dur, overlapUs: overlap(task.ts, task.ts + task.dur, windowStart, windowEnd), fractionOfWindow: overlap(task.ts, task.ts + task.dur, windowStart, windowEnd) / windowUs })),
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
