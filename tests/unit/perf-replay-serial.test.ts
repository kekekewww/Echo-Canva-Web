import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { replayTapeSerial, type SerialReplayOptions } from "../../benchmarks/perf/harness/replay-serial";
import type { ClassicTapeInput, HybridTapeInput } from "../../benchmarks/perf/harness/tape";
import { compileHybridStaticGeometry } from "@/acoustics/hybrid3d/compile";
import { canonicalize } from "../../scripts/corpus/lib.mjs";

const CORPUS = resolve(process.cwd(), "benchmarks/corpus/v1");

const TAPES = [
  { id: "TC01_LISTENER_TAPE_SEEDED", kind: "classic-tape", mode: "classic" },
  { id: "TC02_STATIC_EDIT_TAPE", kind: "classic-tape", mode: "classic" },
  { id: "TH01_LISTENER_TAPE_SEEDED", kind: "hybrid-tape", mode: "hybrid" },
  { id: "TH02_STATIC_EDIT_TAPE", kind: "hybrid-tape", mode: "hybrid" },
] as const;

function loadInput(id: string, mode: "classic" | "hybrid"): SerialReplayOptions["input"] {
  const raw = JSON.parse(readFileSync(resolve(CORPUS, "inputs", `${id}.json`), "utf8")) as Record<string, unknown>;
  return mode === "classic"
    ? { mode, tape: raw as unknown as ClassicTapeInput }
    : { mode, tape: raw as unknown as HybridTapeInput };
}

const options = (input: SerialReplayOptions["input"], extra: Partial<SerialReplayOptions> = {}): SerialReplayOptions => ({
  input,
  repeat: 1,
  paced: false,
  collectFrames: false,
  now: () => performance.now(),
  sleep: async () => undefined,
  ...extra,
});

describe("TS-S replay parity with the frozen corpus", () => {
  it.each(TAPES)("$id reproduces the expected output bit for bit", async ({ id, kind, mode }) => {
    const result = await replayTapeSerial(options(loadInput(id, mode), { collectFrames: true }));
    const actual = canonicalize({ caseId: id, kind, outcome: "ok", value: { steps: result.steps } }).text;
    expect(actual).toBe(readFileSync(resolve(CORPUS, "expected", `${id}.json`), "utf8"));
    expect(result.records).toEqual([]);
  });
});

describe("TS-S replay timing records", () => {
  it("emits the Classic phases per job and keeps no frames", async () => {
    const result = await replayTapeSerial(options(loadInput("TC02_STATIC_EDIT_TAPE", "classic")));
    expect(result.steps).toEqual([]);
    expect(result.jobs).toBe(24);
    const phases = new Set(result.records.map(({ phase }) => phase));
    expect([...phases].sort()).toEqual(["assemble", "job.total", "pose.snapshot", "room.estimate", "solve", "static.build"]);
    expect(result.records).toHaveLength(24 * 6);
    for (const record of result.records) {
      expect(Number.isFinite(record.duration)).toBe(true);
      expect(record.duration).toBeGreaterThanOrEqual(0);
      expect(record.warm).toBe(false);
    }
  });

  it("emits the Hybrid phases and no room estimate", async () => {
    const result = await replayTapeSerial(options(loadInput("TH02_STATIC_EDIT_TAPE", "hybrid")));
    const phases = new Set(result.records.map(({ phase }) => phase));
    expect([...phases].sort()).toEqual(["assemble", "job.total", "pose.snapshot", "solve", "static.compile"]);
  });

  it("restarts from the input state on each repeat while revisions keep increasing", async () => {
    const input = loadInput("TC02_STATIC_EDIT_TAPE", "classic");
    const result = await replayTapeSerial(options(input, { repeat: 2 }));
    const totals = result.records.filter(({ phase }) => phase === "job.total");
    expect(totals).toHaveLength(48);
    const first = totals[0]!;
    const repeated = totals[24]!;
    expect(first.tapeStep).toBe(0);
    expect(repeated.tapeStep).toBe(0);
    expect(repeated.sceneRevision).toBe((first.sceneRevision as number) + 24);
    expect(repeated.staticFingerprint).toBe(first.staticFingerprint);
    expect(totals.map(({ requestSeq }) => requestSeq)).toEqual(Array.from({ length: 48 }, (_, index) => index + 1));
  });

  it("marks samples warm only after both 100 jobs and 5 s", async () => {
    const input = loadInput("TC01_LISTENER_TAPE_SEEDED", "classic");
    let clock = 0;
    const result = await replayTapeSerial(
      options(input, { repeat: 3, now: () => (clock += 100) }),
    );
    const totals = result.records.filter(({ phase }) => phase === "job.total");
    expect(totals).toHaveLength(192);
    const firstWarm = totals.findIndex(({ warm }) => warm);
    expect(firstWarm).toBe(100);
    expect(totals.slice(100).every(({ warm }) => warm)).toBe(true);
  });

  it("paces closed-loop jobs to the scene update interval", async () => {
    const input = loadInput("TC02_STATIC_EDIT_TAPE", "classic");
    let clock = 0;
    const sleeps: number[] = [];
    const result = await replayTapeSerial(
      options(input, {
        paced: true,
        now: () => clock,
        sleep: async (ms) => {
          sleeps.push(ms);
          clock += ms;
        },
      }),
    );
    expect(result.intervalMs).toBeCloseTo(1000 / 12, 10);
    expect(sleeps).toHaveLength(23);
    for (const ms of sleeps) expect(ms).toBeCloseTo(1000 / 12, 10);
  });

  it("stops at an invalid step and hands back the samples already taken", async () => {
    const input = loadInput("TC02_STATIC_EDIT_TAPE", "classic");
    const tape = {
      scene: (input.tape as ClassicTapeInput).scene,
      events: [
        { type: "listener-pose" as const, position: { x: 2, y: 2 } },
        { type: "source-pose" as const, id: "no-such-source", position: { x: 1, y: 1 } },
      ],
    };
    const failure = await replayTapeSerial(options({ mode: "classic", tape })).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain("no-such-source");
    expect((failure as { partial: { jobs: number; records: unknown[] } }).partial.jobs).toBe(1);
    expect((failure as { partial: { records: unknown[] } }).partial.records).toHaveLength(6);
  });
});

describe("one geometry compiler per process", () => {
  it("compiles static geometry once when a pose-only tape is replayed twice", async () => {
    let compiles = 0;
    const result = await replayTapeSerial(
      options(loadInput("TH01_LISTENER_TAPE_SEEDED", "hybrid"), {
        repeat: 2,
        compileStatic: (document) => {
          compiles += 1;
          return compileHybridStaticGeometry(document);
        },
      }),
    );
    expect(result.jobs).toBe(128);
    expect(compiles).toBe(1);
  });

  it("compiles again when static inputs really change", async () => {
    let compiles = 0;
    await replayTapeSerial(
      options(loadInput("TH02_STATIC_EDIT_TAPE", "hybrid"), {
        compileStatic: (document) => {
          compiles += 1;
          return compileHybridStaticGeometry(document);
        },
      }),
    );
    expect(compiles).toBeGreaterThan(1);
  });
});
