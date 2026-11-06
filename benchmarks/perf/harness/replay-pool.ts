import { assembleAcousticFrame as assembleClassic, createClassicStaticContext, type AcousticFrame } from "@/acoustics/compute-frame";
import { sameIdOrder } from "@/acoustics/frame-acceptance";
import { resolveHybridAudibleDirectState } from "@/acoustics/hybrid3d/audible-direct";
import { createHybridGeometryCompiler, hybridStaticGeometryHash, type HybridGeometry } from "@/acoustics/hybrid3d/compile";
import { assembleHybridDirectFrame as assembleHybrid, type HybridDirectFrame } from "@/acoustics/hybrid3d/direct";
import { renderHybridEarlyReflections } from "@/acoustics/hybrid3d/reflection-rendering";
import type { SceneSpec } from "@/domain/scene/types";
import type { SceneDocumentV2 } from "@/domain/scene-document/types";
import {
  AcousticFrameClient,
  acceptsClassicWorkerFrame,
  type AcousticFrameMetrics,
} from "@/hooks/useAcousticFrame";
import { createClassicSourcePool, type ClassicSourcePoolWorkerLike } from "@/workers/classic-source-pool";
import {
  createHybridDirectPool,
  type HybridDirectPoolResult,
  type HybridDirectPoolWorkerLike,
} from "@/workers/hybrid-direct-pool";
import { classicSourcePoolCapacity } from "@/workers/worker-pool-policy";

import { createClassicStepBuilder, createHybridStateBuilder, documentFromState, type HybridState, type TapeEvent } from "./tape";
import type { ParityStep } from "./replay-serial";

export type PoolRunConfig = {
  /** `bare`: production pool with `now` injected only. `probe`: injected schedule, assemble and workers. */
  kind: "probe" | "bare";
  mode: "classic" | "hybrid";
  /** TS-W runs the real pool. TS-S here is the production fallback (a pool whose workers cannot start). */
  variant: "TS-S" | "TS-W";
  replay: "closed" | "open";
  parity: boolean;
  /** Traced pass: the probes also emit performance.mark("ec102:...") so jobs can be found in a trace. */
  traced: boolean;
  repeat: number;
  hardwareConcurrency: number | null;
  stepTimeoutMs: number;
  maxDurationMs: number | null;
  scene: SceneSpec | null;
  document: SceneDocumentV2 | null;
  events: { plannedMs: number | null; event: TapeEvent }[];
};

export type StepLog = {
  index: number;
  replay: number;
  tapeStep: number;
  revision: number;
  plannedMs: number | null;
  tickAt: number;
  submitAt: number;
  poolSubmitAt: number;
  projectMs: number | "not-applicable";
  outcome: "ok" | "timeout" | "pending";
};

export type PostLog = {
  worker: number;
  type: string;
  requestId: number;
  revision: number | null;
  t0: number;
  t1: number;
  timerIdx: number;
};

export type HandlerLog = {
  worker: number;
  type: string;
  requestId: number;
  h0: number;
  h1: number;
  h2: number;
  computeMs: number | null;
};

export type TimerLog = { idx: number; scheduledAt: number; delayMs: number; firedAt: number | null };
export type AssembleLog = { t0: number; t1: number; completedAt: number };
export type ResultLog = {
  t0: number;
  t1: number;
  /** End of the pool's result callback (the "publish" the merge.validate phase subtracts). */
  tEnd: number;
  staticFingerprint: string | "not-applicable";
  requestSeq: number;
  revision: number;
  source: "worker" | "fallback";
  computeMs: number;
  shardMax: number;
  shardTotal: number;
  workerCount: number;
  accepted: boolean;
  acceptedAt: number | null;
  decideMs: number | "not-applicable";
  deriveMs: number | "not-applicable";
};

export type WorkerFlush = {
  worker: number;
  records: {
    requestId: number | "not-applicable";
    type: string;
    recvEpochMs: number;
    deserializeMs: number;
    handleMs: number;
    replyPostMs: number;
  }[];
  timeOrigin: number;
  error: string | null;
};

export type Calibration = {
  worker: number;
  rttMs: number[];
  offsetMs: number[];
  clockResolutionMs: number | "unavailable";
};

export type RawLog = {
  config: Omit<PoolRunConfig, "events" | "scene" | "document"> & { eventCount: number };
  timeOrigin: number;
  startAt: number;
  /** Open loop: the time the planned clock started; planned times are offsets from it. */
  originAt: number | "not-applicable";
  endAt: number;
  steps: StepLog[];
  timers: TimerLog[];
  posts: PostLog[];
  handlers: HandlerLog[];
  assembles: AssembleLog[];
  results: ResultLog[];
  clientPosts: { t: number; revision: number }[];
  workersCreated: number;
  expectedWorkers: number;
  flushes: WorkerFlush[];
  endCalibration: Calibration[];
  errors: string[];
  parity: ParityStep[];
};

export type PoolEnv = {
  makeClassicWorker: (() => Worker) | null;
  makeHybridWorker: (() => Worker) | null;
};

const FORCED_FALLBACK_MESSAGE = "ec102 forced fallback: Worker creation refused";

type ProbeWorkerShape = {
  postMessage: (request: { type: string; requestId?: number; snapshot?: { revision: number } }) => void;
  terminate: () => void;
  onerror: ((event: ErrorEvent) => unknown) | null;
  onmessage: ((event: MessageEvent) => unknown) | null;
  onmessageerror: ((event: MessageEvent) => unknown) | null;
};

type PongWaiter = (data: { type: string; id: number; workerEpochMs?: number; smallestStepMs?: number; records?: WorkerFlush["records"]; timeOrigin?: number }) => void;

/** Main-side wrapper that implements the pools' worker interfaces and logs every call. */
export class ProbedWorker implements ProbeWorkerShape {
  onerror: ProbeWorkerShape["onerror"] = null;
  onmessageerror: ProbeWorkerShape["onmessageerror"] = null;
  private handler: ProbeWorkerShape["onmessage"] = null;
  readonly waiters = new Map<string, PongWaiter>();

  constructor(
    readonly real: Worker,
    readonly index: number,
    private readonly run: RunContext,
  ) {
    real.onmessage = (event: MessageEvent) => this.receive(event);
    real.onerror = (event: ErrorEvent) => this.onerror?.(event);
    real.onmessageerror = (event: MessageEvent) => this.onmessageerror?.(event);
  }

  get onmessage(): ProbeWorkerShape["onmessage"] {
    return this.handler;
  }

  set onmessage(handler: ProbeWorkerShape["onmessage"]) {
    this.handler = handler;
  }

  postMessage(request: { type: string; requestId?: number; snapshot?: { revision: number } }): void {
    const t0 = performance.now();
    this.real.postMessage(request);
    const t1 = performance.now();
    if (this.run.traced && typeof request.requestId === "number" && !this.run.markedJobs.has(request.requestId)) {
      this.run.markedJobs.add(request.requestId);
      performance.mark(`ec102:job:${request.requestId}:dispatch`);
    }
    this.run.log.posts.push({
      worker: this.index,
      type: request.type,
      requestId: request.requestId ?? -1,
      revision: request.snapshot?.revision ?? null,
      t0,
      t1,
      timerIdx: this.run.currentTimer,
    });
  }

  terminate(): void {
    this.real.terminate();
  }

  private receive(event: MessageEvent): void {
    const h0 = performance.now();
    const data = event.data as { type?: unknown; requestId?: unknown; computeMs?: unknown; id?: unknown };
    const h1 = performance.now();
    if (typeof data.type === "string" && data.type.startsWith("__perf_")) {
      const waiter = this.waiters.get(`${data.type}:${String(data.id ?? "")}`) ?? this.waiters.get(data.type);
      if (waiter) waiter(data as Parameters<PongWaiter>[0]);
      return;
    }
    this.handler?.(event);
    const h2 = performance.now();
    this.run.log.handlers.push({
      worker: this.index,
      type: typeof data.type === "string" ? data.type : "unknown",
      requestId: typeof data.requestId === "number" ? data.requestId : -1,
      h0,
      h1,
      h2,
      computeMs: typeof data.computeMs === "number" ? data.computeMs : null,
    });
  }

  control<T>(message: Record<string, unknown>, replyType: string, id: number, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const key = `${replyType}:${id}`;
      const timer = setTimeout(() => {
        this.waiters.delete(key);
        reject(new Error(`worker ${this.index} did not answer ${message.type as string} within ${timeoutMs} ms`));
      }, timeoutMs);
      this.waiters.set(key, (data) => {
        clearTimeout(timer);
        this.waiters.delete(key);
        resolve(data as unknown as T);
      });
      this.real.postMessage({ ...message, id });
    });
  }
}

export type RunContext = {
  log: RawLog;
  currentTimer: number;
  workers: ProbedWorker[];
  lastNow: number;
  traced: boolean;
  markedJobs: Set<number>;
};

export function emptyLog(config: PoolRunConfig, expectedWorkers: number): RawLog {
  const { events, scene: _scene, document: _document, ...rest } = config;
  void _scene;
  void _document;
  return {
    config: { ...rest, eventCount: events.length },
    timeOrigin: performance.timeOrigin,
    startAt: 0,
    originAt: "not-applicable",
    endAt: 0,
    steps: [],
    timers: [],
    posts: [],
    handlers: [],
    assembles: [],
    results: [],
    clientPosts: [],
    workersCreated: 0,
    expectedWorkers,
    flushes: [],
    endCalibration: [],
    errors: [],
    parity: [],
  };
}

export async function calibrateWorker(worker: ProbedWorker, pings: number): Promise<Calibration> {
  const rttMs: number[] = [];
  const offsetMs: number[] = [];
  for (let id = 1; id <= pings; id += 1) {
    const sentAt = performance.now();
    const pong = await worker.control<{ workerEpochMs: number }>({ type: "__perf_ping" }, "__perf_pong", id, 5000);
    const receivedAt = performance.now();
    rttMs.push(receivedAt - sentAt);
    // Epoch clocks on both sides: main epoch at the midpoint of the round trip against the worker's reading.
    offsetMs.push(performance.timeOrigin + (sentAt + receivedAt) / 2 - pong.workerEpochMs);
  }
  let clockResolutionMs: number | "unavailable" = "unavailable";
  try {
    const result = await worker.control<{ smallestStepMs: number }>({ type: "__perf_clockres" }, "__perf_clockres_result", 1, 10000);
    clockResolutionMs = result.smallestStepMs;
  } catch {
    clockResolutionMs = "unavailable";
  }
  return { worker: worker.index, rttMs, offsetMs, clockResolutionMs };
}

/** Pings short-lived workers built from the same entry, before the measured window starts. */
export async function calibrateProbeWorkers(
  env: PoolEnv,
  mode: "classic" | "hybrid",
  workerCount: number,
  pings: number,
): Promise<{ calibrations: Calibration[]; mainClockResolutionMs: number }> {
  const make = mode === "classic" ? env.makeClassicWorker : env.makeHybridWorker;
  if (!make) throw new Error("calibration needs the probe worker entry");
  const dummy: RunContext = { log: emptyLog({ events: [] } as unknown as PoolRunConfig, workerCount), currentTimer: -1, workers: [], lastNow: 0, traced: false, markedJobs: new Set() };
  const probes = Array.from({ length: workerCount }, (_, index) => new ProbedWorker(make(), index, dummy));
  try {
    const calibrations: Calibration[] = [];
    for (const probe of probes) calibrations.push(await calibrateWorker(probe, pings));
    return { calibrations, mainClockResolutionMs: clockStep() };
  } finally {
    for (const probe of probes) probe.terminate();
  }
}

export function clockStep(reads = 10_000): number {
  let smallest = Number.POSITIVE_INFINITY;
  let last = performance.now();
  for (let index = 0; index < reads; index += 1) {
    const value = performance.now();
    const delta = value - last;
    if (delta > 0 && delta < smallest) smallest = delta;
    last = value;
  }
  return smallest;
}

let mainMarkIndex = 0;

function mainClockMark(): void {
  const now = performance.now();
  performance.mark(`ec102:clk:main:${mainMarkIndex}:${now}:${performance.timeOrigin + now}`);
  mainMarkIndex += 1;
}

async function spacedMainMarks(count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    mainClockMark();
    await new Promise((resolve) => setTimeout(resolve, 3));
  }
}

/** Marks carrying each thread's own readings, interleaved, for the trace analyser's clock fit. */
export async function clockMarks(workers: ProbedWorker[], count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    mainClockMark();
    for (const worker of workers) worker.real.postMessage({ type: "__perf_mark", name: `ec102:clk:w${worker.index}:${index}` });
    await new Promise((resolve) => setTimeout(resolve, 3));
  }
  // Marks are fire and forget; a round trip to each worker proves they were handled before tracing stops.
  for (const worker of workers) await worker.control({ type: "__perf_ping" }, "__perf_pong", 1_000_000, 5000).catch(() => undefined);
}

function sleepUntil(targetMs: number): Promise<void> {
  const delay = targetMs - performance.now();
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)));
}

type Waiter = { revision: number; resolve: () => void };

export async function runPoolReplay(config: PoolRunConfig, env: PoolEnv): Promise<RawLog> {
  const sourceCount = config.mode === "classic"
    ? config.scene!.sources.length
    : config.document!.baseScene.sources.length;
  const hardwareConcurrency = config.hardwareConcurrency ?? (typeof navigator === "undefined" ? undefined : navigator.hardwareConcurrency);
  const expectedWorkers = config.variant === "TS-W"
    ? Math.min(sourceCount, classicSourcePoolCapacity(hardwareConcurrency))
    : 0;
  const log = emptyLog(config, expectedWorkers);
  const run: RunContext = { log, currentTimer: -1, workers: [], lastNow: 0, traced: config.traced, markedJobs: new Set() };
  const probe = config.kind === "probe";

  const now = (): number => {
    run.lastNow = performance.now();
    return run.lastNow;
  };
  const schedule = (callback: () => void, delayMs: number): unknown => {
    const idx = log.timers.length;
    const entry: TimerLog = { idx, scheduledAt: performance.now(), delayMs, firedAt: null };
    log.timers.push(entry);
    return setTimeout(() => {
      entry.firedAt = performance.now();
      run.currentTimer = idx;
      try {
        callback();
      } finally {
        run.currentTimer = -1;
      }
    }, delayMs);
  };
  const forcedFallback = config.variant === "TS-S";
  const makeWorker = (kind: "classic" | "hybrid") => (): ProbeWorkerShape => {
    if (forcedFallback) throw new Error(FORCED_FALLBACK_MESSAGE);
    const factory = kind === "classic" ? env.makeClassicWorker : env.makeHybridWorker;
    if (!factory) throw new Error("probe run without a worker entry");
    const worker = new ProbedWorker(factory(), run.workers.length, run);
    // Messages to one worker are handled in order, so this arrives before its first job.
    if (config.traced) worker.real.postMessage({ type: "__perf_trace_on", label: `w${worker.index}` });
    run.workers.push(worker);
    log.workersCreated = run.workers.length;
    return worker;
  };

  const waiters: Waiter[] = [];
  const settle = (revision: number): void => {
    for (let index = waiters.length - 1; index >= 0; index -= 1) {
      if (revision >= waiters[index]!.revision) {
        waiters[index]!.resolve();
        waiters.splice(index, 1);
      }
    }
  };
  const awaitAccepted = (revision: number, timeoutMs: number): Promise<"ok" | "timeout"> =>
    new Promise((resolve) => {
      const timer = setTimeout(() => {
        const at = waiters.findIndex((waiter) => waiter.revision === revision);
        if (at >= 0) waiters.splice(at, 1);
        resolve("timeout");
      }, timeoutMs);
      waiters.push({ revision, resolve: () => { clearTimeout(timer); resolve("ok"); } });
    });

  // The scene the UI would hold now; acceptance is decided against it.
  let latestScene: SceneSpec | null = null;
  let latestHybrid: { document: SceneDocumentV2; geometry: HybridGeometry } | null = null;
  const recordResult = (entry: Omit<ResultLog, "tEnd">, parityFrame: () => ParityStep | null): void => {
    const stored: ResultLog = { ...entry, tEnd: 0 };
    log.results.push(stored);
    if (entry.accepted) {
      if (config.parity && config.replay === "closed") {
        const step = parityFrame();
        if (step) log.parity.push(step);
      }
      settle(entry.revision);
    }
    stored.tEnd = performance.now();
    if (config.traced && entry.requestSeq > 0) performance.mark(`ec102:job:${entry.requestSeq}:complete`);
  };

  const stepLogs = log.steps;
  const pendingParityContext: { event: TapeEvent | null; hybridDocument: SceneDocumentV2 | null; tapeStep: number } = {
    event: null,
    hybridDocument: null,
    tapeStep: 0,
  };

  let submit: (state: PreparedStep, step: StepLog) => void;
  let finish: () => Promise<void> = async () => undefined;

  type PreparedStep = { tapeStep: number; revision: number; event: TapeEvent; scene?: SceneSpec; hybrid?: HybridState };

  if (config.mode === "classic") {
    const classicOptions: NonNullable<Parameters<typeof createClassicSourcePool>[0]> = probe
      ? {
          createWorker: makeWorker("classic") as unknown as () => ClassicSourcePoolWorkerLike,
          now,
          schedule,
          assembleFrame: (...args: Parameters<typeof assembleClassic>) => {
            const t0 = performance.now();
            const completedAt = run.lastNow;
            const frame = assembleClassic(...args);
            log.assembles.push({ t0, t1: performance.now(), completedAt });
            return frame;
          },
          hardwareConcurrency,
        }
      : { now, hardwareConcurrency };
    const client = new AcousticFrameClient({
      cancel: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
      cancelFrame: (frame) => cancelAnimationFrame(frame as number),
      createWorker: () => {
        const pool = createClassicSourcePool(classicOptions);
        const post = pool.postMessage.bind(pool);
        pool.postMessage = (request) => {
          if (request.type === "UPDATE_SCENE") log.clientPosts.push({ t: performance.now(), revision: request.scene.revision });
          post(request);
        };
        let handler: typeof pool.onmessage = null;
        Object.defineProperty(pool, "onmessage", {
          configurable: true,
          get: () => handler,
          set: (next: typeof pool.onmessage) => {
            handler = next === null ? null : (event) => {
              if (event.data.type === "ERROR" && !forcedFallback) log.errors.push(`pool error: ${event.data.code}: ${event.data.message}`);
              next(event);
            };
          },
        });
        return pool;
      },
      now,
      onFallback: (frame, metrics) => onClassicFrame(frame, metrics, undefined, "fallback"),
      onFrame: (frame, metrics, fingerprint) => onClassicFrame(frame, metrics, fingerprint, "worker"),
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      scheduleFrame: (callback) => requestAnimationFrame(callback),
    });

    const onClassicFrame = (
      frame: AcousticFrame,
      metrics: AcousticFrameMetrics,
      fingerprint: string | undefined,
      source: "worker" | "fallback",
    ): void => {
      const t0 = performance.now();
      const latest = latestScene!;
      const accepted = source === "fallback" || acceptsClassicWorkerFrame(frame, fingerprint, latest);
      const t1 = performance.now();
      recordResult(
        {
          t0,
          t1,
          staticFingerprint: fingerprint ?? "not-applicable",
          requestSeq: metrics.requestSequence ?? -1,
          revision: frame.revision,
          source,
          computeMs: metrics.computeMs,
          shardMax: metrics.sourceComputeMsMax ?? 0,
          shardTotal: metrics.sourceComputeMsTotal ?? 0,
          workerCount: metrics.workerCount ?? 0,
          accepted,
          acceptedAt: accepted ? t1 : null,
          decideMs: source === "fallback" ? "not-applicable" : t1 - t0,
          deriveMs: "not-applicable",
        },
        () => {
          const stamped = { ...frame, generatedAtMs: 0 } as AcousticFrame;
          return {
            step: pendingParityContext.tapeStep,
            event: pendingParityContext.event!.type,
            staticFingerprint: fingerprint ?? createClassicStaticContext(latest).fingerprint,
            frame: stamped,
          };
        },
      );
    };

    submit = (prepared, step) => {
      step.submitAt = performance.now();
      step.poolSubmitAt = step.submitAt;
      latestScene = prepared.scene!;
      client.updateScene(prepared.scene!);
    };
    finish = async () => {
      client.dispose();
    };
    client.start(config.scene!);
    latestScene = config.scene!;
  } else {
    const compiler = createHybridGeometryCompiler();
    const hybridOptions: NonNullable<Parameters<typeof createHybridDirectPool>[0]> = probe
      ? {
          createWorker: makeWorker("hybrid") as unknown as () => HybridDirectPoolWorkerLike,
          now,
          schedule,
          assembleFrame: (...args: Parameters<typeof assembleHybrid>) => {
            const t0 = performance.now();
            const frame = assembleHybrid(...args);
            log.assembles.push({ t0, t1: performance.now(), completedAt: args[2] });
            return frame;
          },
          hardwareConcurrency,
        }
      : { now, hardwareConcurrency };
    const pool = createHybridDirectPool(hybridOptions);
    pool.onresult = (result: HybridDirectPoolResult) => {
      const t0 = performance.now();
      const latest = latestHybrid!;
      // Same decision as resolveHybridAcousticPresentation in HybridViewportAdapter.tsx, which is not
      // importable here without the UI tree.
      const frame = result.frame;
      const current = frame.revision === latest.document.baseScene.revision
        && frame.classicProjectionHash === latest.document.compatibility.classicProjectionHash;
      const lagging = !current
        && frame.revision !== latest.document.baseScene.revision
        && result.staticFingerprint === latest.geometry.staticGeometryHash
        && sameIdOrder(frame.paths.map(({ sourceId }) => sourceId ?? ""), latest.document.baseScene.sources);
      const accepted = current || lagging;
      const t1 = performance.now();
      let deriveMs: number | "not-applicable" = "not-applicable";
      if (accepted) {
        resolveHybridAudibleDirectState(latest.geometry, frame);
        for (const { id } of latest.document.baseScene.sources) {
          renderHybridEarlyReflections(frame.firstOrderReflectionsBySource[id] ?? [], frame.secondOrderReflectionsBySource[id] ?? []);
        }
        deriveMs = performance.now() - t1;
      }
      recordResult(
        {
          t0,
          t1,
          staticFingerprint: result.staticFingerprint,
          requestSeq: result.metrics.requestSequence,
          revision: frame.revision,
          source: result.source,
          computeMs: result.metrics.computeMs,
          shardMax: result.metrics.sourceComputeMsMax,
          shardTotal: result.metrics.sourceComputeMsTotal,
          workerCount: result.metrics.workerCount,
          accepted,
          acceptedAt: accepted ? t1 : null,
          decideMs: "not-applicable",
          deriveMs,
        },
        () => {
          const document = pendingParityContext.hybridDocument!;
          const stamped = { ...frame, computedAtMs: 0 } as HybridDirectFrame;
          return {
            step: pendingParityContext.tapeStep,
            event: pendingParityContext.event!.type,
            staticGeometryHash: hybridStaticGeometryHash(document),
            classicProjectionHash: document.compatibility.classicProjectionHash,
            frame: stamped,
          };
        },
      );
    };
    submit = (prepared, step) => {
      step.submitAt = performance.now();
      const document = documentFromState(prepared.hybrid!);
      const geometry = compiler.compile(document);
      step.projectMs = performance.now() - step.submitAt;
      latestHybrid = { document, geometry };
      pendingParityContext.hybridDocument = document;
      step.poolSubmitAt = performance.now();
      pool.update(document, geometry);
    };
    finish = async () => {
      pool.dispose();
    };
  }

  const buildStates = (replay: number): PreparedStep[] => {
    const states: PreparedStep[] = [];
    const offset = replay * config.events.length;
    if (config.mode === "classic") {
      const build = createClassicStepBuilder({ scene: config.scene!, events: [] }, offset);
      for (const { event } of config.events) {
        const built = build(event);
        states.push({ tapeStep: built.step, revision: built.scene.revision, event, scene: built.scene });
      }
    } else {
      const build = createHybridStateBuilder({ document: config.document!, events: [] }, offset);
      for (const { event } of config.events) {
        const built = build(event);
        states.push({ tapeStep: built.step, revision: built.scene.revision, event, hybrid: built });
      }
    }
    return states;
  };

  let aborted = false;
  const runStep = async (state: PreparedStep, replay: number, plannedMs: number | null, tickAt: number): Promise<StepLog> => {
    const step: StepLog = {
      index: stepLogs.length,
      replay,
      tapeStep: state.tapeStep,
      revision: state.revision,
      plannedMs,
      tickAt,
      submitAt: 0,
      poolSubmitAt: 0,
      projectMs: "not-applicable",
      outcome: "pending",
    };
    stepLogs.push(step);
    if (config.traced) mainClockMark();
    pendingParityContext.event = state.event;
    pendingParityContext.tapeStep = state.tapeStep;
    return step;
  };

  // Main-thread clock marks before the window, at every submit inside it, and after it: the fit then spans the run.
  if (config.traced) await spacedMainMarks(20);
  log.startAt = performance.now();
  if (config.traced) performance.mark("ec102:window:start");
  try {
    if (config.replay === "closed") {
      const replays = config.parity ? 1 : config.repeat;
      for (let replay = 0; replay < replays && !aborted; replay += 1) {
        const states = buildStates(replay);
        for (const state of states) {
          const step = await runStep(state, replay, null, performance.now());
          const accepted = awaitAccepted(state.revision, config.stepTimeoutMs);
          submit(state, step);
          const outcome = await accepted;
          step.outcome = outcome;
          if (outcome === "timeout") {
            log.errors.push(`step ${step.index} (revision ${step.revision}) timed out after ${config.stepTimeoutMs} ms`);
            aborted = true;
            break;
          }
        }
      }
    } else {
      const states = buildStates(0);
      const timed = config.events;
      const origin = performance.now() + 50;
      log.originAt = origin;
      for (let index = 0; index < states.length && !aborted; index += 1) {
        const plannedMs = timed[index]!.plannedMs ?? 0;
        if (config.maxDurationMs !== null && plannedMs > config.maxDurationMs) break;
        await sleepUntil(origin + plannedMs);
        const step = await runStep(states[index]!, 0, plannedMs, performance.now());
        submit(states[index]!, step);
        step.outcome = "ok";
      }
      // Let in-flight work drain before the window closes; whatever is unaccepted stays censored.
      await new Promise((resolve) => setTimeout(resolve, Math.min(2500, config.stepTimeoutMs)));
    }
  } catch (error) {
    log.errors.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  }
  log.endAt = performance.now();
  if (config.traced) performance.mark("ec102:window:end");

  if (probe && run.workers.length > 0) {
    for (const worker of run.workers) {
      try {
        const flushed = await worker.control<{ records: WorkerFlush["records"]; timeOrigin: number }>({ type: "__perf_flush" }, "__perf_flushed", 0, 5000);
        log.flushes.push({ worker: worker.index, records: flushed.records, timeOrigin: flushed.timeOrigin, error: null });
      } catch (error) {
        log.flushes.push({ worker: worker.index, records: [], timeOrigin: 0, error: error instanceof Error ? error.message : String(error) });
      }
    }
    for (const worker of run.workers) {
      try {
        log.endCalibration.push(await calibrateWorker(worker, 64));
      } catch (error) {
        log.errors.push(`end calibration failed on worker ${worker.index}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  if (config.traced) await clockMarks(run.workers, 30);
  // Lets the runner read worker heap profiles before the pool terminates its workers.
  const beforeDispose = (globalThis as { __ec102BeforeDispose?: () => Promise<void> }).__ec102BeforeDispose;
  if (beforeDispose) await beforeDispose();
  await finish();
  return log;
}
