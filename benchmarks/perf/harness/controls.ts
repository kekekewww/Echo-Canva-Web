import { ProbedWorker, clockMarks, emptyLog, type PoolEnv, type PoolRunConfig, type RunContext } from "./replay-pool";

/** Known-length main-thread block: the trace must show a task at least this long, named by this function. */
function ec102MainBusy(ms: number): void {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    // Busy wait.
  }
}

function mainGarbage(rounds: number): number {
  let kept = 0;
  for (let round = 0; round < rounds; round += 1) {
    const chunk = Array.from({ length: 20_000 }, (_, index) => ({ index, text: String(index) }));
    kept += chunk.length;
  }
  return kept;
}

export type ControlObservations = {
  longTaskSupport: boolean;
  mainBlockMs: number;
  mainBlockWindow: { start: number; end: number };
  longTasksSeen: { start: number; duration: number }[];
  workerBlock: { worker: number; requestedMs: number; startedMs: number; endedMs: number; timeOrigin: number } | "not-applicable";
  clockMarks: { main: number; perWorker: number };
  gcAllocation: { main: number; workerRounds: number | "not-applicable" };
  clockResolutionMs: { main: number; workers: (number | "unavailable")[] };
  marksWindow: { start: number; end: number };
};

/**
 * Positive controls (spec section "Positive controls"): known blocks, clock marks, GC pressure and
 * clock resolution. What the trace shows is checked by the Node side; this returns what the page saw.
 */
export async function runControls(env: PoolEnv, mode: "classic" | "hybrid", workerCount: number): Promise<ControlObservations> {
  const make = mode === "classic" ? env.makeClassicWorker : env.makeHybridWorker;
  const workers: ProbedWorker[] = [];
  if (make) {
    const dummy: RunContext = {
      log: emptyLog({ events: [] } as unknown as PoolRunConfig, workerCount),
      currentTimer: -1,
      workers: [],
      lastNow: 0,
      traced: false,
      markedJobs: new Set(),
    };
    for (let index = 0; index < workerCount; index += 1) workers.push(new ProbedWorker(make(), index, dummy));
  }
  const longTasksSeen: { start: number; duration: number }[] = [];
  let observer: PerformanceObserver | null = null;
  const longTaskSupport = PerformanceObserver.supportedEntryTypes.includes("longtask");
  if (longTaskSupport) {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasksSeen.push({ start: entry.startTime, duration: entry.duration });
    });
    observer.observe({ type: "longtask", buffered: false });
  }
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const marksStart = performance.now();
  performance.mark("ec102:window:start");

  await sleep(100);
  const blockStart = performance.now();
  performance.mark("ec102:control:main-block:start");
  ec102MainBusy(60);
  const blockEnd = performance.now();
  performance.mark("ec102:control:main-block:end");
  await sleep(150);
  if (observer) longTasksSeen.push(...observer.takeRecords().map((entry) => ({ start: entry.startTime, duration: entry.duration })));
  observer?.disconnect();

  let workerBlock: ControlObservations["workerBlock"] = "not-applicable";
  if (workers.length > 0) {
    const reply = await workers[0]!.control<{ startedMs: number; endedMs: number; timeOrigin: number }>(
      { type: "__perf_block", ms: 40 },
      "__perf_blocked",
      1,
      5000,
    );
    workerBlock = { worker: 0, requestedMs: 40, startedMs: reply.startedMs, endedMs: reply.endedMs, timeOrigin: reply.timeOrigin };
  }

  await clockMarks(workers, 200);

  const mainKept = mainGarbage(60);
  let workerRounds: number | "not-applicable" = "not-applicable";
  if (workers.length > 0) {
    await Promise.all(workers.map((worker, index) => worker.control({ type: "__perf_alloc", ms: 60 }, "__perf_alloc_done", 100 + index, 20_000)));
    workerRounds = 60;
  }
  await sleep(200);

  const resolutions: (number | "unavailable")[] = [];
  for (const [index, worker] of workers.entries()) {
    try {
      const reply = await worker.control<{ smallestStepMs: number }>({ type: "__perf_clockres" }, "__perf_clockres_result", 200 + index, 10_000);
      resolutions.push(reply.smallestStepMs);
    } catch {
      resolutions.push("unavailable");
    }
  }
  let smallest = Number.POSITIVE_INFINITY;
  let last = performance.now();
  for (let index = 0; index < 10_000; index += 1) {
    const value = performance.now();
    const delta = value - last;
    if (delta > 0 && delta < smallest) smallest = delta;
    last = value;
  }
  performance.mark("ec102:window:end");
  const marksEnd = performance.now();
  for (const worker of workers) worker.terminate();
  return {
    longTaskSupport,
    mainBlockMs: blockEnd - blockStart,
    mainBlockWindow: { start: blockStart, end: blockEnd },
    longTasksSeen,
    workerBlock,
    clockMarks: { main: 200, perWorker: 200 },
    gcAllocation: { main: mainKept, workerRounds },
    clockResolutionMs: { main: smallest, workers: resolutions },
    marksWindow: { start: marksStart, end: marksEnd },
  };
}
