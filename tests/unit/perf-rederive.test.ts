import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { deriveAppSamples } from "../../scripts/perf/derive-app.mjs";
import { SIGNED_PHASES, latestRunIndex, validateSample } from "../../scripts/perf/lib.mjs";
import { rederiveRun } from "../../scripts/perf/rederive.mjs";

const SCRATCH = resolve(process.cwd(), ".perf-runs", `unit-rederive-${process.pid}`);

afterAll(() => {
  rmSync(SCRATCH, { recursive: true, force: true });
});

type Loose = Record<string, unknown>;

/** Jobs 100 ms apart. Each is posted 10 ms after its input and its handler ends 95 ms after the input, which puts the next job's dispatch before the estimated rate-limit end. */
function syntheticDump(jobs: number): Loose {
  const posts: Loose[] = [];
  const handlers: Loose[] = [];
  const inputs: Loose[] = [];
  const commits: Loose[] = [];
  for (let index = 0; index < jobs; index += 1) {
    const base = index * 100;
    const requestId = index + 1;
    inputs.push({ type: "click", ts: base });
    posts.push({ worker: 0, type: "COMPUTE_SHARD", requestId, revision: requestId, t0: base + 10, t1: base + 10.2 });
    handlers.push({ worker: 0, type: "SHARD_RESULT", requestId, computeMs: 2, h0: base + 94, h1: base + 94.2, h2: base + 95 });
    commits.push({ t: base + 99, sequence: String(requestId), revision: String(requestId), computeMs: "2", source: "Worker", workerCount: "1", raf: null, frameEnd: base + 105 });
  }
  return {
    posts,
    handlers,
    params: [],
    inputs,
    commits,
    overlay: { found: true, hasCanvas: false, mutations: [] },
    window: { start: 0, end: 13_000 },
    longTasks: [{ start: 500, duration: 60 }, { start: 11_500, duration: 70 }, { start: 14_000, duration: 80 }],
    loafs: [],
    support: { longtask: true, longAnimationFrame: true },
    workersCreated: 1,
    contexts: [],
  };
}

const CONTEXT = { runId: "r", variant: "TS-W", caseId: "APP_H100_SWITCH", mode: "hybrid", pass: "clean", workers: 1, audio: "on", updateHz: 12 };

describe("in-app derivation", () => {
  it("keeps a dispatch before the estimated rate-limit end as a negative difference, unclamped", () => {
    const derived = deriveAppSamples(syntheticDump(6), CONTEXT);
    for (const sample of derived.samples) expect(validateSample(sample)).toEqual([]);
    expect(SIGNED_PHASES).toContain("app.input-to-dispatch-minus-rate-limit");
    const minus = derived.samples.filter((sample) => sample.phase === "app.input-to-dispatch-minus-rate-limit");
    expect(minus).toHaveLength(5);
    // Previous handler end (base - 5) + 1000 / 12 - input (base) = 78.33; dispatched at 10.
    expect(minus[0]!.duration).toBeCloseTo(10 - (1000 / 12 - 5), 6);
    expect(minus[0]!.duration).toBeLessThan(0);
    expect(derived.samples.find((sample) => sample.phase === "queue.rate-limit-estimate")?.duration).toBeCloseTo(1000 / 12 - 5, 6);
  });

  it("counts in-window long tasks and audio samples after the warm threshold as warm", () => {
    const audioSamples = Array.from({ length: 60 }, (_, index) => ({ renderCapacity: 0.1, callbackIntervalMean: 0.01, elapsedMs: index * 250 }));
    const derived = deriveAppSamples(syntheticDump(130), { ...CONTEXT, audioSamples });
    const warmOf = (phase: string) => derived.samples.filter((sample) => sample.phase === phase).map((sample) => sample.warm);
    expect(warmOf("app.long-task")).toEqual([false, true]);
    expect(warmOf("app.long-task.out-of-window")).toEqual([false]);
    // Warm from 10 000 ms after the first commit (the 101st commit), the first commit being 99 ms after the window start.
    const capacity = warmOf("audio.render-capacity");
    expect(capacity).toHaveLength(60);
    expect(capacity.filter(Boolean)).toHaveLength(19);
    expect(capacity.indexOf(true)).toBe(41);
    // A run with no more than 100 commits has nothing past the threshold.
    expect(deriveAppSamples(syntheticDump(50), { ...CONTEXT, audioSamples }).samples.filter((sample) => sample.phase === "audio.render-capacity" && sample.warm)).toHaveLength(0);
  });
});

describe("rederive", () => {
  function writeRun(name: string, errors: string[], status = "failed") {
    const outDir = SCRATCH;
    const runDir = join(outDir, name);
    mkdirSync(runDir, { recursive: true });
    const json = (file: string, value: unknown) => writeFileSync(join(runDir, file), JSON.stringify(value), "utf8");
    json("probe-dump.json", syntheticDump(130));
    json("runner-config.json", { runId: name, pass: "clean", variant: "TS-W", caseSpec: { caseId: "APP_H100_SWITCH", kind: "app", mode: "hybrid" }, audio: "off", driver: "poll", samples: 130 });
    json("runner-result.json", { status, errors, updateHz: 12, driver: "poll", statusBeforeWindow: { expectedWorkerCount: 1, hardwareConcurrency: 8 }, sampleCount: 0 });
    json("run-status.json", { status, runId: name, start: "s", end: "e", sampleCount: 0, error: errors.join(" | "), phasesNotReached: ["x"] });
    json("summary.json", { schema: "ec102.summary.v1", sampleCount: 0, phases: {}, runId: name, driver: "poll" });
    writeFileSync(join(runDir, "samples.jsonl"), "", "utf8");
    writeFileSync(join(outDir, "runs-index.jsonl"), `${JSON.stringify({ runId: name, status, sampleCount: 0, start: "s", end: "e" })}\n`, { flag: "a" });
    return runDir;
  }

  it("rebuilds the samples, keeps the history and appends an index line", async () => {
    const runDir = writeRun("r-bad-derivation", ["Error: invalid sample (app.input-to-dispatch-minus-rate-limit): duration must be a finite number >= 0"]);
    const outcome = await rederiveRun({ runDir, commit: "abc123", now: () => new Date("2026-01-02T03:04:05.000Z") });
    expect(outcome).toMatchObject({ status: "passed", originalStatus: "failed" });
    expect(outcome.sampleCount).toBeGreaterThan(0);
    const status = JSON.parse(readFileSync(join(runDir, "run-status.json"), "utf8")) as Loose;
    expect(status).toMatchObject({ status: "passed", originalStatus: "failed", rederivedAt: "2026-01-02T03:04:05.000Z", rederivedByCommit: "abc123" });
    expect(String(status.originalError)).toContain("invalid sample");
    expect(status.error).toBeUndefined();
    const result = JSON.parse(readFileSync(join(runDir, "runner-result.json"), "utf8")) as Loose;
    expect(result.originalErrors).toHaveLength(1);
    expect(result.errors).toEqual([]);
    const summary = JSON.parse(readFileSync(join(runDir, "summary.json"), "utf8")) as { sampleCount: number; phases: Record<string, unknown> };
    expect(summary.sampleCount).toBe(outcome.sampleCount);
    expect(Object.keys(summary.phases)).toContain("app.input-to-dispatch-minus-rate-limit");
    const lines = readFileSync(join(SCRATCH, "runs-index.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line) as { runId: string; status: string; rederivedFrom?: string });
    const mine = lines.filter((line) => line.runId === "r-bad-derivation");
    expect(mine).toHaveLength(2);
    expect(mine[1]).toMatchObject({ status: "passed", rederivedFrom: "r-bad-derivation" });
    expect(latestRunIndex(lines).find((line) => line.runId === "r-bad-derivation")?.status).toBe("passed");
  });

  it("leaves a run whose measurement really failed as failed", async () => {
    const runDir = writeRun("r-real-failure", ["switch 3 timed out after 10000 ms", "Error: invalid sample (x): duration must be a finite number >= 0"]);
    const outcome = await rederiveRun({ runDir, commit: "abc123" });
    expect(outcome.status).toBe("failed");
    expect(outcome.errors).toEqual(["switch 3 timed out after 10000 ms"]);
    expect((JSON.parse(readFileSync(join(runDir, "run-status.json"), "utf8")) as Loose).originalStatus).toBe("failed");
  });
});
