import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { deriveAppSamples } from "../../scripts/perf/derive-app.mjs";
import { scanPaths, validateSample } from "../../scripts/perf/lib.mjs";
import { analyzeTrace, rankJobs, streamTraceEvents } from "../../scripts/perf/trace-analyze.mjs";

const SCRATCH = resolve(process.cwd(), ".perf-runs", `unit-trace-${process.pid}`);

afterAll(() => {
  rmSync(SCRATCH, { recursive: true, force: true });
});

type Loose = Record<string, unknown>;

const MAIN = { pid: 1, tid: 10 };
const WORKER = { pid: 1, tid: 20 };
const SAMPLER = { pid: 1, tid: 99 };
const ORIGIN_MS = 1_700_000_000_000;

function syntheticTrace(): Loose[] {
  const events: Loose[] = [
    { ph: "M", name: "process_name", pid: 1, tid: 0, args: { name: "Renderer" } },
    { ph: "M", name: "thread_name", ...MAIN, args: { name: "CrRendererMain" } },
    { ph: "M", name: "thread_name", ...WORKER, args: { name: "DedicatedWorker thread" } },
    { ph: "M", name: "thread_name", pid: 1, tid: 30, args: { name: "Compositor" } },
    { ph: "M", name: "thread_name", pid: 1, tid: 31, args: { name: "AudioOutputDevice" } },
    { ph: "M", name: "thread_name", pid: 1, tid: 40, args: { name: "ThreadPoolForegroundWorker" } },
  ];
  // Main: trace ts = 1000 + now * 1000, no drift. Worker: offset 2000, 200 ppm slow.
  for (let index = 0; index < 10; index += 1) {
    const now = 100 + index * 20;
    events.push({ ph: "R", name: `ec102:clk:main:${index}:${now}:${ORIGIN_MS + now}`, ...MAIN, ts: 1000 + now * 1000 });
    events.push({ ph: "R", name: `ec102:clk:w0:${index}:${now}:${ORIGIN_MS + now}`, ...WORKER, ts: 2000 + now * 1000 * 1.0002 });
  }
  events.push({ ph: "R", name: "ec102:window:start", ...MAIN, ts: 0 }, { ph: "R", name: "ec102:window:end", ...MAIN, ts: 400_000 });
  events.push({ ph: "R", name: "ec102:job:7:dispatch", ...MAIN, ts: 5000 }, { ph: "R", name: "ec102:job:7:complete", ...MAIN, ts: 9000 });
  // Tasks: a 60 ms task with a nested 5 ms one, and a short one.
  events.push(
    { ph: "X", name: "RunTask", ...MAIN, ts: 4000, dur: 60_000 },
    { ph: "X", name: "RunTask", ...MAIN, ts: 10_000, dur: 5000 },
    { ph: "X", name: "RunTask", ...MAIN, ts: 100_000, dur: 1000 },
    { ph: "X", name: "RunTask", ...WORKER, ts: 5500, dur: 2500 },
  );
  events.push(
    // One real collection with nested phases: only the parent is a collection.
    { ph: "X", name: "MinorGC", ...MAIN, ts: 6000, dur: 500, args: { usedHeapSizeBefore: 9000, usedHeapSizeAfter: 4000 } },
    { ph: "X", name: "V8.GCScavenger", ...MAIN, ts: 6000, dur: 480 },
    { ph: "X", name: "V8.GC_SCAVENGER", ...MAIN, ts: 6010, dur: 400 },
    { ph: "X", name: "V8.GC_SCAVENGER_SCAVENGE", ...MAIN, ts: 6020, dur: 300 },
    { ph: "X", name: "V8.GC_SCAVENGER_SCAVENGE_ROOTS", ...MAIN, ts: 6030, dur: 100 },
    { ph: "X", name: "MajorGC", ...WORKER, ts: 6200, dur: 900, args: { usedHeapSizeBefore: 20000, usedHeapSizeAfter: 8000 } },
    { ph: "X", name: "V8.GC_MARK_COMPACTOR", ...WORKER, ts: 6210, dur: 880 },
    { ph: "X", name: "V8.GC_MC_MARK", ...WORKER, ts: 6220, dur: 400 },
    { ph: "X", name: "V8.GCIncrementalMarking", ...WORKER, ts: 7000, dur: 100 },
    { ph: "X", name: "V8.GC_SCAVENGER_BACKGROUND_SCAVENGE_PARALLEL", pid: 1, tid: 40, ts: 6005, dur: 700 },
    { ph: "X", name: "V8.GC_SCAVENGER_BACKGROUND_SCAVENGE_PARALLEL", pid: 1, tid: 40, ts: 6100, dur: 600 },
    { ph: "X", name: "FunctionCall", ...MAIN, ts: 6000, dur: 10, args: { url: `${"file"}:///srv/app/main.js` } },
  );
  events.push(
    { ph: "P", name: "Profile", ...WORKER, id: "0x1", ts: 5000, args: { data: { startTime: 5000 } } },
    {
      ph: "P",
      name: "ProfileChunk",
      ...SAMPLER,
      id: "0x1",
      ts: 5100,
      args: {
        data: {
          cpuProfile: {
            nodes: [
              { id: 1, callFrame: { functionName: "(root)", url: "", lineNumber: -1 } },
              { id: 2, callFrame: { functionName: "ec102ControlBusy", url: "worker.js", lineNumber: 10 } },
            ],
            samples: [2, 2, 2, 1],
          },
          timeDeltas: [1000, 1000, 1000, 1000],
        },
      },
    },
  );
  return events;
}

describe("streamTraceEvents", () => {
  it("reads an object form and a bare array, and ignores braces inside strings", async () => {
    mkdirSync(SCRATCH, { recursive: true });
    const events = [{ name: "a", args: { text: "has } and { and \"quote\\" } }, { name: "b" }];
    const objectForm = join(SCRATCH, "object.json");
    const arrayForm = join(SCRATCH, "array.json");
    writeFileSync(objectForm, `{"traceEvents":${JSON.stringify(events)},"metadata":{"command_line":"x"}}`);
    writeFileSync(arrayForm, `\n ${JSON.stringify(events)}`);
    for (const file of [objectForm, arrayForm]) {
      const seen: unknown[] = [];
      await streamTraceEvents(file, (event: unknown) => seen.push(event));
      expect(seen).toEqual(events);
    }
  });
});

describe("analyzeTrace", () => {
  it("writes the thread map, clock fit, GC list, busy time, self time and exemplars", async () => {
    mkdirSync(SCRATCH, { recursive: true });
    const dir = join(SCRATCH, "analysis");
    mkdirSync(dir, { recursive: true });
    const file = join(SCRATCH, "trace.json");
    writeFileSync(file, JSON.stringify({ traceEvents: syntheticTrace(), metadata: { command_line: "tool --secret" } }));
    // The worker's receive time, expressed on its own epoch clock, falls inside its task at trace time 6000.
    const recvEpochMs = ORIGIN_MS + 3.9992;
    const computeCheck = {
      wholeMilliseconds: false,
      jobs: [
        { seq: 7, entries: [{ worker: 0, reportedMs: 2, recvEpochMs }] },
        { seq: 8, entries: [{ worker: 0, reportedMs: 1, recvEpochMs: null }] },
      ],
    };
    const result = await analyzeTrace({ file, outDir: dir, exemplars: { phase: "pool.compute-metric", jobs: [{ seq: 7, value: 12.5 }, { seq: 8, value: 3 }] }, computeCheck });
    const read = (name: string) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Loose;

    const threadMap = JSON.parse(readFileSync(join(dir, "thread-map.json"), "utf8")) as { threadName: string; role: string; workerLabel: string | null }[];
    expect(threadMap.map(({ role }) => role).sort()).toEqual(["audio", "compositor", "other", "renderer-main", "worker"]);
    expect(threadMap.find(({ role }) => role === "worker")?.workerLabel).toBe("w0");

    const alignment = read("clock-alignment.json") as { threads: Record<string, { marks: number; perfNowFit: { n: number; offsetUs: number; driftPpm: number; maxResidualUs: number } }>; crossThread: Record<string, { traceTimeDisagreementUs: number }> };
    expect(alignment.threads.main!.perfNowFit.n).toBe(10);
    expect((alignment.threads.main as unknown as { baselineMs: number }).baselineMs).toBeCloseTo(180, 9);
    expect(alignment.threads.main!.perfNowFit.offsetUs).toBeCloseTo(1000, 3);
    expect(alignment.threads.main!.perfNowFit.driftPpm).toBeCloseTo(0, 3);
    expect(alignment.threads.main!.perfNowFit.maxResidualUs).toBeLessThan(1e-3);
    expect(alignment.threads.w0!.perfNowFit.driftPpm).toBeCloseTo(200, 1);
    expect(alignment.threads.w0!.perfNowFit.offsetUs).toBeCloseTo(2000, 3);
    expect(typeof alignment.crossThread.w0!.traceTimeDisagreementUs).toBe("number");

    const gc = readFileSync(join(dir, "gc.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line) as Loose);
    // Nested V8.GC_* phases are not listed; the parent counts once and its time is not added twice.
    expect(gc.map(({ thread, kind }) => `${thread}:${kind}`).sort()).toEqual(["main:minor", "w0:incremental-marking-step", "w0:major"]);
    expect(gc.find(({ kind }) => kind === "minor")).toMatchObject({ heapBefore: 9000, heapAfter: 4000, dur: 500, name: "MinorGC" });
    expect(gc.every(({ name }) => !String(name).startsWith("V8.GC_"))).toBe(true);
    const gcSummary = read("gc-summary.json") as { perThread: Record<string, Record<string, { count: number; durUs: number }>> };
    expect(gcSummary.perThread.main).toEqual({ minor: { count: 1, durUs: 500 } });
    expect(gcSummary.perThread.w0).toEqual({ major: { count: 1, durUs: 900 }, "incremental-marking-step": { count: 1, durUs: 100 } });
    const concurrent = read("gc-concurrent.json") as { concurrent: boolean; pause: boolean; totalThreadUs: number; byName: Record<string, { count: number; durUs: number }> };
    expect(concurrent).toMatchObject({ concurrent: true, pause: false, totalThreadUs: 1300 });
    expect(concurrent.byName["V8.GC_SCAVENGER_BACKGROUND_SCAVENGE_PARALLEL"]).toEqual({ count: 2, durUs: 1300 });

    const busy = read("busy.json") as Record<string, { busyUs: number; tasks: number; maxTaskUs: number; longTasks: { durUs: number }[] }>;
    expect(busy.main!.tasks).toBe(2);
    expect(busy.main!.busyUs).toBe(61_000);
    expect(busy.main!.maxTaskUs).toBe(60_000);
    expect(busy.main!.longTasks.map(({ durUs }) => durUs)).toEqual([60_000]);

    const cpuTop = read("cpu-top.json") as Record<string, { functions: { functionName: string; selfMs: number; url: string; lineNumber: number }[] }>;
    expect(cpuTop.w0!.functions[0]).toMatchObject({ functionName: "ec102ControlBusy", url: "worker.js", lineNumber: 10 });
    expect(cpuTop.w0!.functions[0]!.selfMs).toBeCloseTo(3, 9);

    const compute = read("compute-vs-trace.json") as { summary: Loose; entries: Loose[]; reportedValues: string };
    expect(compute.summary).toMatchObject({ jobs: 2, jobsWithoutMarks: 1, entries: 2, matched: 1, unmatched: 1 });
    expect(compute.entries[0]).toMatchObject({ seq: 7, worker: 0, reportedMs: 2, traceTaskMs: 2.5, matchedBy: "worker thread, task containing the receive time" });
    expect(compute.entries[0]!.differenceMs).toBeCloseTo(0.5, 9);
    expect(compute.entries[1]).toMatchObject({ seq: 8, traceTaskMs: "unmatched", reason: "job marks not found in the trace" });
    expect(compute.reportedValues).toContain("fractional");

    const exemplars = read("exemplars.json") as { exemplars: Loose[] };
    expect(exemplars.exemplars).toHaveLength(2);
    const found = exemplars.exemplars[0] as { seq: number; windowUs: number; threads: Record<string, { tasks: { overlapUs: number }[]; gc: { kind: string }[] }> };
    expect(found.seq).toBe(7);
    expect(found.windowUs).toBe(4000);
    expect(found.threads.main!.tasks[0]!.overlapUs).toBe(4000);
    expect(found.threads.main!.gc.map(({ kind }) => kind)).toEqual(["minor"]);
    expect(found.threads.w0!.gc.map(({ kind }) => kind).sort()).toEqual(["incremental-marking-step", "major"]);
    expect(exemplars.exemplars[1]).toMatchObject({ seq: 8, missing: "job marks not found in the trace" });

    expect(result.exemplars).toHaveLength(1);
    const slicePath = join(dir, "exemplar-7.trace.json");
    expect(statSync(slicePath).size).toBeLessThan(300_000);
    const slice = JSON.parse(readFileSync(slicePath, "utf8")) as { traceEvents: Loose[] };
    expect(slice.traceEvents.some((event) => event.name === "ProfileChunk")).toBe(false);
    expect(JSON.stringify(slice)).not.toContain("srv");
    expect(await scanPaths([slicePath], [])).toEqual([]);
  });

  it("ranks the slowest jobs of a phase by request sequence", () => {
    mkdirSync(SCRATCH, { recursive: true });
    const file = join(SCRATCH, "rank.jsonl");
    const row = (requestSeq: number, duration: number, phase = "pool.compute-metric", outcome = "ok") => JSON.stringify({ requestSeq, duration, phase, outcome });
    writeFileSync(file, [row(1, 5), row(2, 9), row(3, 7), row(2, 8), row(4, 100, "other"), row(5, 50, "pool.compute-metric", "timeout")].join("\n"));
    expect(rankJobs(file, "pool.compute-metric", 2)).toEqual([{ seq: 2, value: 9 }, { seq: 3, value: 7 }]);
  });
});

describe("deriveAppSamples", () => {
  it("maps probe records to the in-app phases and tags the job kind", () => {
    const dump = {
      posts: [
        { worker: 0, type: "INSTALL_STATIC", requestId: 3, revision: null, t0: 100, t1: 100.5 },
        { worker: 0, type: "COMPUTE_SHARD", requestId: 3, revision: 9, t0: 101, t1: 101.2 },
        { worker: 0, type: "COMPUTE_SHARD", requestId: 4, revision: 10, t0: 200, t1: 200.1 },
      ],
      handlers: [
        { worker: 0, type: "STATIC_INSTALLED", requestId: 3, computeMs: null, h0: 103, h1: 103, h2: 103 },
        { worker: 0, type: "SHARD_RESULT", requestId: 3, computeMs: 4, h0: 106, h1: 106.4, h2: 107 },
        { worker: 0, type: "SHARD_RESULT", requestId: 4, computeMs: 2, h0: 203, h1: 203.2, h2: 203.5 },
      ],
      params: [
        { name: "setTargetAtTime", t0: 108.5, ms: 0.01 },
        { name: "setTargetAtTime", t0: 109, ms: 0.02 },
      ],
      inputs: [{ type: "click", ts: 95 }, { type: "click", ts: 195 }],
      commits: [
        { t: 108, sequence: "3", revision: "9", computeMs: "6", source: "Worker", workerCount: "1", raf: 112, frameEnd: 113 },
        { t: 205, sequence: "4", revision: "10", computeMs: "3", source: "Worker", workerCount: "1", raf: 210, frameEnd: null },
      ],
      longTasks: [{ start: 50, duration: 61 }],
      loafs: [],
      support: { longtask: true, longAnimationFrame: true },
      workersCreated: 1,
      contexts: [],
    };
    const derived = deriveAppSamples(dump, { runId: "r", variant: "TS-W", caseId: "APP_H100_SWITCH", mode: "hybrid", pass: "clean", workers: 1, audio: "on" });
    for (const sample of derived.samples) expect(validateSample(sample)).toEqual([]);
    const one = (phase: string, requestSeq: number) => derived.samples.find((sample) => sample.phase === phase && sample.requestSeq === requestSeq);
    expect(one("app.input-to-dispatch", 3)?.duration).toBeCloseTo(5, 9);
    expect(one("app.input-to-commit", 3)?.duration).toBeCloseTo(13, 9);
    expect(one("install.post", 3)?.duration).toBeCloseTo(0.5, 9);
    expect(one("install.ack-roundtrip", 3)?.duration).toBeCloseTo(3, 9);
    expect(one("shard.roundtrip", 3)?.duration).toBeCloseTo(5, 9);
    expect(one("shard.compute-reported", 3)).toMatchObject({ duration: 4, clock: "worker-date-now" });
    expect(one("merge.handler", 3)?.duration).toBeCloseTo(0.6, 9);
    expect(one("accept.to-commit", 3)?.duration).toBeCloseTo(1, 9);
    expect(one("display.commit-to-raf", 3)?.duration).toBeCloseTo(4, 9);
    expect(one("display.commit-to-frame-end", 4)).toBeUndefined();
    expect(one("audio.param-ops", 3)).toMatchObject({ duration: 2, units: "count" });
    expect(one("audio.commit-to-first-param", 3)?.duration).toBeCloseTo(0.5, 9);
    expect(one("app.worker-compute-metric", 4)).toMatchObject({ duration: 3, clock: "main-date-now" });
    expect(derived.samples.filter((sample) => sample.requestSeq === 3).every((sample) => sample.jobKind === "static-install")).toBe(true);
    expect(derived.samples.filter((sample) => sample.requestSeq === 4).every((sample) => sample.jobKind === "pose-only")).toBe(true);
    expect(derived.samples.find((sample) => sample.phase === "app.long-task")?.duration).toBe(61);
    expect(derived.observed).toMatchObject({ workerSources: ["Worker"], workerCounts: ["1"], jobs: 2, commits: 2 });
    expect(derived.denominators).toMatchObject({ submitted: 2, dispatched: 2, completed: 2, fallback: 0 });
  });
});

describe("compute against trace without worker labels", () => {
  it("pairs a job's largest worker tasks with its reported values by rank and says whole milliseconds", async () => {
    mkdirSync(SCRATCH, { recursive: true });
    const dir = join(SCRATCH, "rank-analysis");
    mkdirSync(dir, { recursive: true });
    const file = join(SCRATCH, "rank-trace.json");
    const events: Loose[] = [
      { ph: "M", name: "thread_name", ...MAIN, args: { name: "CrRendererMain" } },
      { ph: "M", name: "thread_name", ...WORKER, args: { name: "DedicatedWorker thread" } },
      { ph: "M", name: "thread_name", pid: 1, tid: 21, args: { name: "DedicatedWorker thread" } },
      { ph: "R", name: "ec102:job:3:dispatch", ...MAIN, ts: 1000 },
      { ph: "R", name: "ec102:job:3:complete", ...MAIN, ts: 20_000 },
      { ph: "X", name: "RunTask", ...WORKER, ts: 2000, dur: 7300 },
      { ph: "X", name: "RunTask", pid: 1, tid: 21, ts: 2100, dur: 3600 },
    ];
    writeFileSync(file, JSON.stringify({ traceEvents: events }));
    await analyzeTrace({
      file,
      outDir: dir,
      computeCheck: { wholeMilliseconds: true, jobs: [{ seq: 3, entries: [{ worker: 0, reportedMs: 3, recvEpochMs: null }, { worker: 1, reportedMs: 7, recvEpochMs: null }, { worker: 2, reportedMs: 1, recvEpochMs: null }] }] },
    });
    const compute = JSON.parse(readFileSync(join(dir, "compute-vs-trace.json"), "utf8")) as { reportedValues: string; summary: Loose; entries: Loose[] };
    expect(compute.reportedValues).toContain("whole milliseconds");
    expect(compute.entries.find((entry) => entry.worker === 1)).toMatchObject({ reportedMs: 7, traceTaskMs: 7.3 });
    expect(compute.entries.find((entry) => entry.worker === 0)).toMatchObject({ reportedMs: 3, traceTaskMs: 3.6 });
    expect(compute.entries.find((entry) => entry.worker === 2)).toMatchObject({ traceTaskMs: "unmatched", reason: "fewer worker tasks than reported values in the job window" });
    expect(compute.summary).toMatchObject({ matched: 2, unmatched: 1 });
  });
});

describe("compute against trace with adjacent tasks", () => {
  it("picks the task that contains the receive time, not a neighbour inside the tolerance", async () => {
    mkdirSync(SCRATCH, { recursive: true });
    const dir = join(SCRATCH, "adjacent");
    mkdirSync(dir, { recursive: true });
    const file = join(SCRATCH, "adjacent.json");
    const events: Loose[] = [
      { ph: "M", name: "thread_name", ...MAIN, args: { name: "CrRendererMain" } },
      { ph: "M", name: "thread_name", ...WORKER, args: { name: "DedicatedWorker thread" } },
      { ph: "R", name: "ec102:job:1:dispatch", ...MAIN, ts: 1000 },
      { ph: "R", name: "ec102:job:1:complete", ...MAIN, ts: 20_000 },
      // The first task ends 300 us before the receive time; the second contains it.
      { ph: "X", name: "RunTask", ...WORKER, ts: 2000, dur: 3000 },
      { ph: "X", name: "RunTask", ...WORKER, ts: 5100, dur: 4000 },
    ];
    for (let index = 0; index < 10; index += 1) {
      const now = 100 + index * 20;
      events.push({ ph: "R", name: `ec102:clk:main:${index}:${now}:${ORIGIN_MS + now}`, ...MAIN, ts: 1000 + now * 1000 });
      events.push({ ph: "R", name: `ec102:clk:w0:${index}:${now}:${ORIGIN_MS + now}`, ...WORKER, ts: 2000 + now * 1000 });
    }
    writeFileSync(file, JSON.stringify({ traceEvents: events }));
    await analyzeTrace({ file, outDir: dir, computeCheck: { wholeMilliseconds: false, jobs: [{ seq: 1, entries: [{ worker: 0, reportedMs: 3.9, recvEpochMs: ORIGIN_MS + 3.3 }] }] } });
    const compute = JSON.parse(readFileSync(join(dir, "compute-vs-trace.json"), "utf8")) as { entries: Loose[] };
    expect(compute.entries[0]).toMatchObject({ traceTaskMs: 4, matchedBy: "worker thread, task containing the receive time" });
  });
});
