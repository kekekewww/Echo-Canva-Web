/**
 * Worker-side probes. Imported before the production worker module, so the production module's
 * own `self.addEventListener("message", ...)` registers a listener that this file wraps.
 * It posts nothing during a job: records stay in memory until `__perf_flush`.
 */
// The bundle check in scripts/perf/bundle.mjs looks for this property name to prove the preamble
// is evaluated before the production module registers its listener.
(self as unknown as Record<string, unknown>).__EC102_PREAMBLE__ = true;

export type WorkerRequestRecord = {
  requestId: number | "not-applicable";
  type: string;
  recvEpochMs: number;
  deserializeMs: number;
  handleMs: number;
  replyPostMs: number;
};

type Scope = {
  addEventListener: (type: string, listener: unknown, options?: unknown) => void;
  postMessage: (message: unknown, ...rest: unknown[]) => void;
};

type ControlMessage = { type: string; id?: number; ms?: number; name?: string; label?: string };

const scope = self as unknown as Scope;
const timeOrigin = performance.timeOrigin;
const epochNow = (): number => timeOrigin + performance.now();
const records: WorkerRequestRecord[] = [];
let current: WorkerRequestRecord | null = null;
// Traced passes only: one clock mark per request handled, so the trace analyser can fit this
// thread's clock over the whole run. Clean runs never turn it on and pay nothing.
let traceLabel: string | null = null;
let traceMarks = 0;

// The solver never reads Date (grep over src/acoustics and src/domain finds only the audio
// library), so this only raises the resolution of the controller's `options.now ?? Date.now`.
Date.now = epochNow;

const originalAdd = scope.addEventListener.bind(scope);
const originalPost = scope.postMessage.bind(scope);

scope.postMessage = (message: unknown, ...rest: unknown[]): void => {
  if (current === null) {
    originalPost(message, ...rest);
    return;
  }
  const startedMs = performance.now();
  originalPost(message, ...rest);
  current.replyPostMs += performance.now() - startedMs;
};

function ec102ControlBusy(ms: number): void {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    // Busy wait: a known-length block for the positive controls.
  }
}

function smallestClockStep(reads: number): number {
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

function isControl(data: unknown): data is ControlMessage {
  return typeof data === "object" && data !== null
    && typeof (data as { type?: unknown }).type === "string"
    && (data as { type: string }).type.startsWith("__perf_");
}

function handleControl(message: ControlMessage): void {
  switch (message.type) {
    case "__perf_ping":
      originalPost({ type: "__perf_pong", id: message.id, workerEpochMs: epochNow(), workerNowMs: performance.now() });
      return;
    case "__perf_flush":
      originalPost({
        type: "__perf_flushed",
        id: message.id,
        timeOrigin,
        crossOriginIsolated: (self as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated ?? false,
        records: records.splice(0, records.length),
      });
      return;
    case "__perf_trace_on":
      traceLabel = message.label ?? "w?";
      return;
    case "__perf_mark": {
      // The name carries this thread's own readings so the trace analyser can fit its clock.
      const now = performance.now();
      performance.mark(`${message.name ?? "ec102"}:${now}:${timeOrigin + now}`);
      return;
    }
    case "__perf_alloc": {
      // Garbage for the GC control: short-lived objects, nothing retained.
      let kept = 0;
      for (let round = 0; round < (message.ms ?? 1); round += 1) {
        const chunk = Array.from({ length: 20_000 }, (_, index) => ({ index, text: String(index) }));
        kept += chunk.length;
      }
      originalPost({ type: "__perf_alloc_done", id: message.id, objects: kept });
      return;
    }
    case "__perf_block": {
      const startedMs = performance.now();
      ec102ControlBusy(message.ms ?? 0);
      originalPost({ type: "__perf_blocked", id: message.id, startedMs, endedMs: performance.now(), timeOrigin });
      return;
    }
    case "__perf_clockres":
      originalPost({ type: "__perf_clockres_result", id: message.id, smallestStepMs: smallestClockStep(10_000) });
      return;
    default:
      originalPost({ type: "__perf_unknown", id: message.id, received: message.type });
  }
}

function wrap(listener: unknown): (event: MessageEvent) => void {
  return (event) => {
    const startedMs = performance.now();
    const data: unknown = event.data;
    const readMs = performance.now();
    if (isControl(data)) {
      handleControl(data);
      return;
    }
    if (traceLabel !== null) {
      const now = performance.now();
      performance.mark(`ec102:clk:${traceLabel}:${traceMarks}:${now}:${timeOrigin + now}`);
      traceMarks += 1;
    }
    const request = (typeof data === "object" && data !== null ? data : {}) as { type?: unknown; requestId?: unknown };
    const record: WorkerRequestRecord = {
      requestId: typeof request.requestId === "number" ? request.requestId : "not-applicable",
      type: typeof request.type === "string" ? request.type : "unknown",
      recvEpochMs: timeOrigin + startedMs,
      deserializeMs: readMs - startedMs,
      handleMs: 0,
      replyPostMs: 0,
    };
    current = record;
    try {
      if (typeof listener === "function") listener.call(self, event);
      else (listener as { handleEvent: (event: MessageEvent) => void }).handleEvent(event);
    } finally {
      current = null;
      record.handleMs = performance.now() - readMs;
      records.push(record);
    }
  };
}

scope.addEventListener = (type: string, listener: unknown, options?: unknown): void => {
  originalAdd(type, type === "message" ? wrap(listener) : listener, options);
};
