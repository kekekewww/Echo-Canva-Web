import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { checkWorkerBundles } from "../../scripts/perf/bundle.mjs";
import { checkIntegrity, buildJobs, deriveSamples, warmAt } from "../../scripts/perf/derive-pool.mjs";
import { validateSample } from "../../scripts/perf/lib.mjs";

const SCRATCH = resolve(process.cwd(), ".perf-runs", `unit-derive-${process.pid}`);

afterAll(() => {
  rmSync(SCRATCH, { recursive: true, force: true });
});

type Loose = Record<string, unknown>;

function record(requestId: number, type: string, deserializeMs: number, replyPostMs: number): Loose {
  return { requestId, type, recvEpochMs: 1, deserializeMs, handleMs: 1, replyPostMs };
}

/** One TS-W job on two workers, every number chosen so the expected phases can be written down. */
function syntheticLog(): Loose {
  return {
    config: { kind: "probe", variant: "TS-W", replay: "closed", mode: "classic", parity: false },
    timeOrigin: 0,
    startAt: 90,
    originAt: "not-applicable",
    endAt: 200,
    steps: [{ index: 0, replay: 0, tapeStep: 0, revision: 301, plannedMs: null, tickAt: 100, submitAt: 100, poolSubmitAt: 100.5, projectMs: "not-applicable", outcome: "ok" }],
    timers: [{ idx: 0, scheduledAt: 100.6, delayMs: 80, firedAt: 180.9 }],
    posts: [
      { worker: 0, type: "INSTALL_STATIC", requestId: 1, revision: null, t0: 181, t1: 181.4, timerIdx: 0 },
      { worker: 0, type: "COMPUTE_SHARD", requestId: 1, revision: 301, t0: 181.5, t1: 181.7, timerIdx: 0 },
      { worker: 1, type: "INSTALL_STATIC", requestId: 1, revision: null, t0: 181.8, t1: 182.1, timerIdx: 0 },
      { worker: 1, type: "COMPUTE_SHARD", requestId: 1, revision: 301, t0: 182.2, t1: 182.4, timerIdx: 0 },
    ],
    handlers: [
      { worker: 0, type: "STATIC_INSTALLED", requestId: 1, h0: 183, h1: 183.01, h2: 183.02, computeMs: null },
      { worker: 0, type: "SHARD_RESULT", requestId: 1, h0: 185, h1: 185.3, h2: 185.5, computeMs: 2.5 },
      { worker: 1, type: "STATIC_INSTALLED", requestId: 1, h0: 183.5, h1: 183.51, h2: 183.52, computeMs: null },
      { worker: 1, type: "SHARD_RESULT", requestId: 1, h0: 186, h1: 186.4, h2: 187.9, computeMs: 3.25 },
    ],
    assembles: [{ t0: 187.2, t1: 187.5, completedAt: 187.1 }],
    results: [{
      t0: 187.6, t1: 187.7, tEnd: 187.8, staticFingerprint: "abcd1234", requestSeq: 1, revision: 301, source: "worker",
      computeMs: 6.2, shardMax: 3.25, shardTotal: 5.75, workerCount: 2, accepted: true, acceptedAt: 187.7, decideMs: 0.1, deriveMs: "not-applicable",
    }],
    clientPosts: [{ t: 100.4, revision: 301 }],
    workersCreated: 2,
    expectedWorkers: 2,
    flushes: [0, 1].map((worker) => ({
      worker,
      timeOrigin: 0,
      error: null,
      records: [record(1, "INSTALL_STATIC", 0.2, 0.05), record(1, "COMPUTE_SHARD", 0.3, 0.2)],
    })),
    endCalibration: [],
    errors: [],
    parity: [],
  };
}

const context = { runId: "r", variant: "TS-W", caseId: "TC01_LISTENER_TAPE_SEEDED", mode: "classic", pass: "clean", workers: 2 };

function phaseValues(samples: { phase: string; duration: number; workerIndex: unknown }[], phase: string): number[] {
  return samples.filter((sample) => sample.phase === phase).map((sample) => sample.duration);
}

describe("deriveSamples", () => {
  it("builds one valid sample per measured value with the spec's definitions", () => {
    const derived = deriveSamples(syntheticLog(), context);
    for (const sample of derived.samples) expect(validateSample(sample)).toEqual([]);
    const get = (phase: string) => phaseValues(derived.samples, phase);
    expect(get("pool.compute-metric")).toEqual([6.2]);
    expect(get("job.submit-to-accepted")[0]).toBeCloseTo(87.7, 9);
    expect(get("queue.wait")[0]).toBeCloseTo(80.4, 9);
    expect(get("queue.rate-limit")).toEqual([80]);
    expect(get("queue.timer-lateness")[0]).toBeCloseTo(0.3, 9);
    expect(get("queue.client")[0]).toBeCloseTo(0.4, 9);
    expect(get("dispatch.prepare")[0]).toBeCloseTo(0.1, 9);
    expect(get("install.post")).toHaveLength(2);
    expect(get("install.ack-roundtrip")[0]).toBeCloseTo(2, 9);
    expect(get("shard.compute")).toEqual([2.5, 3.25]);
    expect(get("shard.roundtrip")[0]).toBeCloseTo(3.5, 9);
    expect(get("shard.transport")[0]).toBeCloseTo(0.5, 9);
    expect(get("merge.assemble")[0]).toBeCloseTo(0.3, 9);
    expect(get("accept.decide")).toEqual([0.1]);
    expect(get("merge.reply-deserialize")[1]).toBeCloseTo(0.4, 9);
    const validate = get("merge.validate");
    expect(validate[0]).toBeCloseTo(0.2, 9);
    expect(validate[1]).toBeCloseTo(1.0, 9);
  });

  it("reports the phase-sum residual as its own signed value", () => {
    const derived = deriveSamples(syntheticLog(), context);
    expect(phaseValues(derived.samples, "job.phase-residual")[0]).toBeCloseTo(0.3, 9);
    expect(derived.phaseResidualCount).toBe(1);
    const log = syntheticLog();
    (log.results as Loose[])[0]!.computeMs = 5.0;
    const negative = deriveSamples(log, context);
    const residual = phaseValues(negative.samples, "job.phase-residual")[0]!;
    expect(residual).toBeLessThan(0);
    expect(negative.samples.every((sample) => validateSample(sample).length === 0)).toBe(true);
  });

  it("counts the denominators and the observed worker count", () => {
    const derived = deriveSamples(syntheticLog(), context);
    expect(derived.denominators).toEqual({
      submitted: 1, coalesced: 0, dispatched: 1, completed: 1, accepted: 1, stale: 0, fallback: 0, error: 0, timeout: 0,
    });
    expect(derived.workerCounts).toEqual([2]);
    expect(derived.shardCompute).toEqual({ count: 2, nonInteger: 2 });
  });

  it("keeps a timeout as an outcome-tagged sample and counts it", () => {
    const log = syntheticLog();
    (log.steps as Loose[])[0]!.outcome = "timeout";
    (log.results as Loose[]).length = 0;
    const derived = deriveSamples(log, context);
    const timeout = derived.samples.find((sample) => sample.phase === "job.submit-to-accepted");
    expect(timeout?.outcome).toBe("timeout");
    expect(derived.denominators.timeout).toBe(1);
  });

  it("produces censored latest-wait samples in an open-loop log", () => {
    const log = syntheticLog();
    (log.config as Loose).replay = "open";
    log.originAt = 99;
    const steps = log.steps as Loose[];
    steps[0]!.plannedMs = 1;
    steps.push({ index: 1, replay: 0, tapeStep: 1, revision: 302, plannedMs: 17, tickAt: 116.5, submitAt: 116.5, poolSubmitAt: 116.5, projectMs: "not-applicable", outcome: "ok" });
    const derived = deriveSamples(log, context);
    const waits = derived.samples.filter((sample) => sample.phase === "pose.latest-wait");
    expect(waits.map((sample) => sample.outcome)).toEqual(["ok", "censored"]);
    expect(waits[1]!.duration).toBeCloseTo(200 - 116.5, 9);
    expect(derived.denominators.coalesced).toBe(1);
    const lateness = phaseValues(derived.samples, "input.lateness");
    expect(lateness[0]).toBeCloseTo(0, 9);
    expect(lateness[1]).toBeCloseTo(0.5, 9);
  });

  it("emits only the two bare phases for a bare run", () => {
    const log = syntheticLog();
    (log.config as Loose).kind = "bare";
    const derived = deriveSamples(log, { ...context, pass: "bare" });
    expect([...new Set(derived.samples.map((sample) => sample.phase))].sort()).toEqual(["job.submit-to-accepted", "pool.compute-metric"]);
  });

  it("marks samples warm only after 100 units and 5 s", () => {
    expect(warmAt(99, 9000)).toBe(false);
    expect(warmAt(100, 4999)).toBe(false);
    expect(warmAt(100, 5000)).toBe(true);
  });
});

describe("message integrity", () => {
  it("passes when each request is handled and answered once", () => {
    const log = syntheticLog();
    const check = checkIntegrity(log, buildJobs(log));
    expect(check.anomalies).toEqual([]);
    expect(check).toMatchObject({ ok: true, installPosts: 2, installAcks: 2, shardPosts: 2, shardResults: 2, workerRecords: 4 });
  });

  it("reports a request handled twice in a worker", () => {
    const log = syntheticLog();
    ((log.flushes as Loose[])[0]!.records as Loose[]).push(record(1, "COMPUTE_SHARD", 0.1, 0.1));
    const check = checkIntegrity(log, buildJobs(log));
    expect(check.ok).toBe(false);
    expect(check.anomalies.join("\n")).toContain("COMPUTE_SHARD handled 2 times");
  });

  it("reports a reply that reached the pool twice", () => {
    const log = syntheticLog();
    (log.handlers as Loose[]).push({ worker: 0, type: "SHARD_RESULT", requestId: 1, h0: 190, h1: 190, h2: 190, computeMs: 2.5 });
    const check = checkIntegrity(log, buildJobs(log));
    expect(check.ok).toBe(false);
    expect(check.anomalies.join("\n")).toContain("2 SHARD_RESULT replies");
  });
});

describe("worker bundle check", () => {
  const write = (name: string): string => {
    const dir = join(SCRATCH, name);
    mkdirSync(join(dir, "assets"), { recursive: true });
    return dir;
  };

  it("accepts a preamble that runs before the production listener", () => {
    const dir = write("ok");
    writeFileSync(join(dir, "assets", "classic-worker-entry-abc.js"), "self.__EC102_PREAMBLE__ = true;\nscope.addEventListener(\"message\", (event) => controller.handle(event.data));\n");
    expect(checkWorkerBundles(dir, true)).toHaveLength(1);
  });

  it("rejects a preamble that comes after the production listener", () => {
    const dir = write("late");
    writeFileSync(join(dir, "assets", "classic-worker-entry-abc.js"), "scope.addEventListener(\"message\", (event) => controller.handle(event.data));\nself.__EC102_PREAMBLE__ = true;\n");
    expect(() => checkWorkerBundles(dir, true)).toThrow(/worker bundle check failed/);
  });

  it("rejects any preamble in a bare worker script", () => {
    const dir = write("bare");
    writeFileSync(join(dir, "assets", "classic-source.worker-abc.js"), "self.__EC102_PREAMBLE__ = true;\ncontroller.handle(event.data);\n");
    expect(() => checkWorkerBundles(dir, false)).toThrow(/worker bundle check failed/);
    const clean = write("bare-clean");
    writeFileSync(join(clean, "assets", "classic-source.worker-abc.js"), "controller.handle(event.data);\n");
    expect(checkWorkerBundles(clean, false)[0]!.preamblePresent).toBe(false);
  });
});

describe("job kind in pool derivations", () => {
  it("tags a job with an install post as static-install and one without as pose-only", () => {
    const log = syntheticLog();
    const first = deriveSamples(log, context);
    for (const sample of first.samples.filter((value) => typeof value.requestSeq === "number")) expect(sample.jobKind).toBe("static-install");

    const poseOnly = syntheticLog();
    poseOnly.posts = (poseOnly.posts as Loose[]).filter((post) => post.type !== "INSTALL_STATIC");
    poseOnly.handlers = (poseOnly.handlers as Loose[]).filter((handler) => handler.type !== "STATIC_INSTALLED");
    for (const flush of poseOnly.flushes as Loose[]) flush.records = (flush.records as Loose[]).filter((entry) => entry.type !== "INSTALL_STATIC");
    const second = deriveSamples(poseOnly, context);
    const kinds = new Set(second.samples.filter((value) => typeof value.requestSeq === "number").map((value) => value.jobKind));
    expect([...kinds]).toEqual(["pose-only"]);
    expect(second.samples.find((value) => value.phase === "input.project")).toBeUndefined();
  });

  it("derives the kind from a changing static fingerprint when there are no posts", () => {
    const log = syntheticLog();
    (log.config as Loose).kind = "bare";
    const result = (log.results as Loose[])[0]!;
    const next = { ...result, t0: 300, t1: 300.1, tEnd: 300.2, requestSeq: 2, revision: 302, staticFingerprint: "abcd1234", acceptedAt: 300.1 };
    const other = { ...result, t0: 400, t1: 400.1, tEnd: 400.2, requestSeq: 3, revision: 303, staticFingerprint: "ffff0000", acceptedAt: 400.1 };
    (log.results as Loose[]).push(next, other);
    (log.steps as Loose[]).push(
      { index: 1, replay: 0, tapeStep: 1, revision: 302, plannedMs: null, tickAt: 290, submitAt: 290, poolSubmitAt: 290, projectMs: "not-applicable", outcome: "ok" },
      { index: 2, replay: 0, tapeStep: 2, revision: 303, plannedMs: null, tickAt: 390, submitAt: 390, poolSubmitAt: 390, projectMs: "not-applicable", outcome: "ok" },
    );
    const derived = deriveSamples(log, { ...context, pass: "bare" });
    const kindOf = (seq: number) => derived.samples.find((sample) => sample.phase === "pool.compute-metric" && sample.requestSeq === seq)?.jobKind;
    expect([kindOf(1), kindOf(2), kindOf(3)]).toEqual(["static-install", "pose-only", "static-install"]);
  });
});

/** An open-loop TS-W log: `steps` input events 25 ms apart, `jobs` one-worker jobs `spacing` ms apart. */
function openLoopLog(steps: number, jobs: number, spacing: number): Loose {
  const log = syntheticLog();
  const first = 100;
  log.config = { kind: "probe", variant: "TS-W", replay: "open", mode: "classic", parity: false };
  log.originAt = first;
  log.endAt = first + 25 * steps + spacing * jobs + 1000;
  log.steps = Array.from({ length: steps }, (_, i) => ({
    index: i, replay: 0, tapeStep: i, revision: i + 1, plannedMs: 25 * i, tickAt: first + 25 * i, submitAt: first + 25 * i, poolSubmitAt: first + 25 * i + 0.1, projectMs: 0.1, outcome: "ok",
  }));
  const fire = (k: number): number => first + spacing * k;
  log.timers = Array.from({ length: jobs }, (_, k) => ({ idx: k, scheduledAt: fire(k) - 80, delayMs: 80, firedAt: fire(k) }));
  log.posts = Array.from({ length: jobs }, (_, k) => ({ worker: 0, type: "COMPUTE_SHARD", requestId: k + 1, revision: k + 1, t0: fire(k) + 0.5, t1: fire(k) + 0.6, timerIdx: k }));
  log.handlers = Array.from({ length: jobs }, (_, k) => ({ worker: 0, type: "SHARD_RESULT", requestId: k + 1, h0: fire(k) + 3, h1: fire(k) + 3.2, h2: fire(k) + 3.4, computeMs: 2 }));
  log.assembles = Array.from({ length: jobs }, (_, k) => ({ t0: fire(k) + 3.25, t1: fire(k) + 3.3, completedAt: fire(k) + 3.3 }));
  log.results = Array.from({ length: jobs }, (_, k) => ({
    t0: fire(k) + 3.5, t1: fire(k) + 3.6, tEnd: fire(k) + 3.7, staticFingerprint: "abcd1234", requestSeq: k + 1, revision: k + 1, source: "worker",
    computeMs: 4, shardMax: 2, shardTotal: 2, workerCount: 1, accepted: true, acceptedAt: fire(k) + 4, decideMs: 0.1, deriveMs: "not-applicable",
  }));
  log.clientPosts = [];
  log.flushes = [];
  return log;
}

type Warmable = { phase: string; warm: boolean; requestSeq?: number; tapeStep?: number };

describe("open-loop warm labels count dispatched jobs", () => {
  it("keeps everything cold when the 100th input arrives long before the 100th job", () => {
    const derived = deriveSamples(openLoopLog(300, 30, 300), context);
    const samples = derived.samples as unknown as Warmable[];
    // Inputs 200..299 are past 100 events and 5 s, but only 30 jobs were ever dispatched.
    const waits = samples.filter((sample) => sample.phase === "pose.latest-wait");
    expect(waits.length).toBe(300);
    expect(waits.some((sample) => sample.warm)).toBe(false);
    expect(samples.filter((sample) => sample.phase === "input.lateness").some((sample) => sample.warm)).toBe(false);
    expect(samples.filter((sample) => sample.phase === "pool.compute-metric").some((sample) => sample.warm)).toBe(false);
  });

  it("turns warm with the 100th job ordinal for job and result samples, and by dispatch count for inputs", () => {
    const derived = deriveSamples(openLoopLog(300, 120, 60), context);
    const samples = derived.samples as unknown as Warmable[];
    const metric = (seq: number) => samples.find((sample) => sample.phase === "pool.compute-metric" && sample.requestSeq === seq)!.warm;
    const queue = (seq: number) => samples.find((sample) => sample.phase === "queue.rate-limit" && sample.requestSeq === seq)!.warm;
    expect(metric(100)).toBe(false); // ordinal 99
    expect(metric(101)).toBe(true); // ordinal 100, fired 6 s into the process
    expect(queue(100)).toBe(false);
    expect(queue(101)).toBe(true);
    const wait = (step: number) => samples.find((sample) => sample.phase === "pose.latest-wait" && sample.tapeStep === step)!.warm;
    // Step 200 is at 5.1 s, old rule: warm. Only 84 jobs are dispatched by then.
    expect(wait(200)).toBe(false);
    // Step 250 is at 6.35 s, by when 105 jobs were dispatched.
    expect(wait(250)).toBe(true);
  });
});

describe("last handler of a job", () => {
  it("takes the later logged handler when two handlers share one h0, so merge.assemble is kept", () => {
    const log = syntheticLog();
    const handlers = log.handlers as Loose[];
    // Both replies stamped 186 by a coarse clock. The assembly sits inside the second handler's window.
    handlers[1] = { worker: 0, type: "SHARD_RESULT", requestId: 1, h0: 186, h1: 186.0, h2: 186.0, computeMs: 2.5 };
    handlers[3] = { worker: 1, type: "SHARD_RESULT", requestId: 1, h0: 186, h1: 186.0, h2: 187.9, computeMs: 3.25 };
    (log.assembles as Loose[])[0] = { t0: 187.2, t1: 187.5, completedAt: 187.1 };
    const jobs = buildJobs(log as never);
    expect(jobs[0]!.lastHandler).toBe(handlers[3]);
    expect(jobs[0]!.assemble).not.toBeNull();
    const derived = deriveSamples(log, context);
    expect(phaseValues(derived.samples, "merge.assemble")).toHaveLength(1);
  });
});
