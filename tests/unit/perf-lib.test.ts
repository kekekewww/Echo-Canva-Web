import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { userInfo } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  buildGroups,
  computeStats,
  createSample,
  executeRun,
  makeDenominators,
  nearestRank,
  parseJsonl,
  privacyTerms,
  readRunIndex,
  sanitizeText,
  sanitizeTrace,
  scanLine,
  scanPaths,
  summarizeSamples,
  validateSample,
  verifyWorkloads,
  type RunIndexLine,
  type Sample,
} from "../../scripts/perf/lib.mjs";

const SCRATCH = resolve(process.cwd(), ".perf-runs", `unit-${process.pid}`);

afterAll(() => {
  rmSync(SCRATCH, { recursive: true, force: true });
});

const base = {
  runId: "r1",
  variant: "TS-S",
  caseId: "TC01_LISTENER_TAPE_SEEDED",
  phase: "solve",
  duration: 1.25,
  boundary: "node-core",
  pass: "clean",
  warm: false,
  clock: "main-perf-now",
};

function sample(overrides: Record<string, unknown> = {}): Sample {
  return createSample({ ...base, ...overrides });
}

describe("nearest rank", () => {
  const ascending = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

  it("returns the only value for N=1 at every percentile", () => {
    for (const p of [0.01, 0.5, 0.95, 0.99, 1]) expect(nearestRank([7.5], p)).toBe(7.5);
  });

  it("uses rank ceil(p * N) for N=24", () => {
    expect(nearestRank(ascending(24), 0.5)).toBe(12);
    expect(nearestRank(ascending(24), 0.95)).toBe(23);
    expect(nearestRank(ascending(24), 0.99)).toBe(24);
  });

  it("uses rank ceil(p * N) for N=1000", () => {
    expect(nearestRank(ascending(1000), 0.5)).toBe(500);
    expect(nearestRank(ascending(1000), 0.95)).toBe(950);
    expect(nearestRank(ascending(1000), 0.99)).toBe(990);
    expect(nearestRank(ascending(1000), 1)).toBe(1000);
  });

  it("does not round a rank up through floating point error", () => {
    expect(nearestRank(ascending(100), 0.07)).toBe(7);
  });

  it("sorts without mutating the input and reports missing data as a string", () => {
    const values = [5, 1, 4, 2, 3];
    expect(nearestRank(values, 0.5)).toBe(3);
    expect(values).toEqual([5, 1, 4, 2, 3]);
    expect(nearestRank([], 0.5)).toBe("unavailable");
    expect(() => nearestRank([1], 0)).toThrow(RangeError);
  });

  it("computes the six statistics without rounding", () => {
    expect(computeStats([0.1, 0.2, 0.30000000000000004])).toEqual({
      N: 3,
      p50: 0.2,
      p95: 0.30000000000000004,
      p99: 0.30000000000000004,
      max: 0.30000000000000004,
      mean: (0.1 + 0.2 + 0.30000000000000004) / 3,
    });
    expect(computeStats([]).N).toBe(0);
    expect(computeStats([]).p50).toBe("unavailable");
  });
});

describe("sample schema", () => {
  it("fills absent optional fields with the missing-value strings", () => {
    const value = sample();
    expect(value.requestSeq).toBe("not-applicable");
    expect(value.sceneRevision).toBe("not-applicable");
    expect(value.workers).toBe("not-applicable");
    expect(value.workerIndex).toBe("not-applicable");
    expect(value.tapeStep).toBe("not-applicable");
    expect(validateSample(value)).toEqual([]);
  });

  it("accepts real values, including step 0 and worker index 0", () => {
    const value = sample({ variant: "TS-W", workers: 2, workerIndex: 0, tapeStep: 0, requestSeq: 12, sceneRevision: 40, staticFingerprint: "ab12" });
    expect(validateSample(value)).toEqual([]);
  });

  it("rejects 0, null, NaN and empty strings standing in for missing values", () => {
    const valid = sample();
    const bad = (patch: Record<string, unknown>) => validateSample({ ...valid, ...patch });
    expect(bad({ requestSeq: 0 })).not.toEqual([]);
    expect(bad({ sceneRevision: 0 })).not.toEqual([]);
    expect(bad({ requestSeq: null })).not.toEqual([]);
    expect(bad({ staticFingerprint: "" })).not.toEqual([]);
    expect(bad({ workerIndex: -1 })).not.toEqual([]);
    expect(bad({ duration: Number.NaN })).not.toEqual([]);
    expect(bad({ duration: "unavailable" })).not.toEqual([]);
    expect(bad({ duration: -0.001 })).not.toEqual([]);
  });

  it("allows a negative duration only on the signed computed phases", () => {
    expect(validateSample({ ...sample({ phase: "job.phase-residual", duration: 0.1 }), duration: -0.25 })).toEqual([]);
    expect(validateSample({ ...sample({ phase: "shard.transport", duration: 0.1 }), duration: -0.01 })).toEqual([]);
    expect(validateSample({ ...sample({ phase: "shard.compute", duration: 0.1 }), duration: -0.01 })).not.toEqual([]);
  });

  it("ties the worker count to the variant", () => {
    expect(validateSample({ ...sample(), workers: 0 })).not.toEqual([]);
    expect(validateSample({ ...sample(), workers: 4 })).not.toEqual([]);
    expect(validateSample({ ...sample({ variant: "TS-W", workers: 4 }), workers: "not-applicable" })).not.toEqual([]);
    expect(validateSample({ ...sample({ variant: "TS-W", workers: 4 }), workers: 0 })).not.toEqual([]);
  });

  it("rejects unknown fields, unknown enum values and absent fields", () => {
    const valid = sample();
    expect(validateSample({ ...valid, extra: 1 })).not.toEqual([]);
    expect(validateSample({ ...valid, outcome: "slow" })).not.toEqual([]);
    expect(validateSample({ ...valid, clock: "wall" })).not.toEqual([]);
    expect(validateSample({ ...valid, boundary: "elsewhere" })).not.toEqual([]);
    expect(validateSample({ ...valid, warm: "yes" })).not.toEqual([]);
    const withoutPhase: Record<string, unknown> = { ...valid };
    delete withoutPhase.phase;
    expect(validateSample(withoutPhase)).not.toEqual([]);
    expect(() => createSample({ ...base, duration: undefined })).toThrow(/invalid sample/);
  });

  it("round-trips through JSON lines", () => {
    const values = [sample({ requestSeq: 1 }), sample({ requestSeq: 2, warm: true })];
    const text = `${values.map((value) => JSON.stringify(value)).join("\n")}\n`;
    expect(parseJsonl(text)).toEqual(values);
  });
});

describe("summaries", () => {
  it("splits warm from cold and counts every outcome while computing statistics on ok samples", () => {
    const samples = [
      sample({ duration: 1, warm: false }),
      sample({ duration: 2, warm: false }),
      sample({ duration: 10, warm: true }),
      sample({ duration: 20, warm: true }),
      sample({ duration: 30, warm: true }),
      sample({ duration: 99, warm: true, outcome: "timeout" }),
      sample({ duration: 5, phase: "assemble" }),
    ];
    const summary = summarizeSamples(samples);
    expect(summary.sampleCount).toBe(7);
    const solve = summary.phases.solve!;
    expect(solve.count).toBe(6);
    expect(solve.outcomes).toEqual({ ok: 5, timeout: 1 });
    expect(solve.cold.N).toBe(2);
    expect(solve.warm.N).toBe(3);
    expect(solve.warm.p50).toBe(20);
    expect(solve.warm.max).toBe(30);
    expect(solve.exploratory).toBe(true);
    expect(summary.phases.assemble!.cold.N).toBe(1);
    expect(summary.phases.assemble!.warm.N).toBe(0);
    expect(summary.phases.assemble!.warm.p50).toBe("unavailable");
  });

  it("marks a phase exploratory below 1,000 samples and not at 1,000", () => {
    const few = Array.from({ length: 999 }, (_, index) => sample({ duration: index }));
    const enough = Array.from({ length: 1000 }, (_, index) => sample({ duration: index }));
    expect(summarizeSamples(few).phases.solve!.exploratory).toBe(true);
    expect(summarizeSamples(enough).phases.solve!.exploratory).toBe(false);
  });

  it("never turns a denominator that does not apply into 0", () => {
    const denominators = makeDenominators({ submitted: 24, completed: 24, accepted: 24, error: 0 });
    expect(denominators).toEqual({
      submitted: 24,
      coalesced: "not-applicable",
      dispatched: "not-applicable",
      completed: 24,
      accepted: 24,
      stale: "not-applicable",
      fallback: "not-applicable",
      error: 0,
      timeout: "not-applicable",
    });
  });

  it("groups runs, sums denominators, and leaves failed runs out of the statistics", () => {
    const entry = (runId: string, status: string, orderIndex: number): RunIndexLine => ({
      runId,
      variant: "TS-S",
      case: "TC01_LISTENER_TAPE_SEEDED",
      pass: "clean",
      boundary: "node-core",
      workers: "not-applicable",
      audio: "not-applicable",
      build: "not-applicable",
      parity: false,
      status,
      start: "2026-01-01T00:00:00.000Z",
      end: "2026-01-01T00:00:01.000Z",
      orderIndex,
      sampleCount: 2,
    });
    const run = (runId: string, status: string, durations: number[]) => ({
      entry: entry(runId, status, 0),
      samples: durations.map((duration) => sample({ runId, duration, warm: true })),
      denominators: makeDenominators({ submitted: durations.length, completed: durations.length, accepted: durations.length, error: 0 }),
    });
    const groups = buildGroups([run("a", "passed", [1, 2]), run("b", "passed", [3, 4]), run("c", "failed", [1000])]);
    expect(groups).toHaveLength(1);
    const group = groups[0]!;
    expect(group.runCount).toBe(2);
    expect(group.excludedRuns).toEqual([{ runId: "c", status: "failed" }]);
    expect(group.denominators.submitted).toBe(4);
    expect(group.denominators.fallback).toBe("not-applicable");
    expect(group.pooled.solve!.warm.N).toBe(4);
    expect(group.pooled.solve!.warm.max).toBe(4);
    expect(group.dispersion.solve).toBeDefined();
  });
});

describe("run records", () => {
  it("keeps a crashed run on disk and in the index, and never overwrites it", async () => {
    mkdirSync(SCRATCH, { recursive: true });
    const out = join(SCRATCH, "runs");
    let statusInsideRun = "";
    const meta = { runId: "crash-1", variant: "TS-S", case: "TC01_LISTENER_TAPE_SEEDED", pass: "clean", boundary: "node-core" };
    const line = await executeRun({
      outDir: out,
      meta,
      orderIndex: 3,
      execute: async ({ runDir }) => {
        statusInsideRun = (JSON.parse(readFileSync(join(runDir, "run-status.json"), "utf8")) as { status: string }).status;
        writeFileSync(join(runDir, "partial.txt"), "kept");
        throw new Error(`failed near ${["C", ":\\", "work", "\\", "file.txt"].join("")}`);
      },
    });
    expect(statusInsideRun).toBe("started");
    expect(line.status).toBe("crashed");
    expect(line.orderIndex).toBe(3);
    expect(existsSync(join(out, "crash-1", "partial.txt"))).toBe(true);
    const status = JSON.parse(readFileSync(join(out, "crash-1", "run-status.json"), "utf8")) as { status: string; error: string };
    expect(status.status).toBe("crashed");
    expect(status.error).toContain("failed near");
    expect(status.error).not.toContain("work");
    expect(existsSync(join(out, "crash-1", "artifacts.sha256"))).toBe(true);

    const failed = await executeRun({
      outDir: out,
      meta: { ...meta, runId: "fail-1" },
      execute: async () => ({ status: "failed", error: "parity differed", sampleCount: 0, phasesNotReached: ["solve"] }),
    });
    expect(failed.status).toBe("failed");
    expect(failed.orderIndex).toBe("not-applicable");

    const ok = await executeRun({ outDir: out, meta: { ...meta, runId: "ok-1" }, execute: async () => ({ sampleCount: 5 }) });
    expect(ok.status).toBe("passed");

    expect(readRunIndex(out).map(({ runId, status }) => [runId, status])).toEqual([
      ["crash-1", "crashed"],
      ["fail-1", "failed"],
      ["ok-1", "passed"],
    ]);
    await expect(executeRun({ outDir: out, meta, execute: async () => ({}) })).rejects.toThrow(/already exists/);
    expect(readRunIndex(out)).toHaveLength(3);
  });
});

describe("sanitiser and scanner", () => {
  const drive = "D";
  const windowsPath = `${drive}:\\${["Projects", "tool", "output.json"].join("\\")}`;
  const escapedWindowsPath = windowsPath.replaceAll("\\", "\\\\");
  const posixPath = `/${"home"}/${["dev", "work", "trace.json"].join("/")}`;
  const fileUrl = `${"file"}:///${["srv", "app", "worker.js"].join("/")}`;
  const email = ["person", "example.test"].join("@");

  it("replaces Windows and POSIX absolute paths, file URLs and escaped paths", () => {
    const text = `a ${windowsPath} b "${escapedWindowsPath}" c ${posixPath} d ${fileUrl}`;
    const clean = sanitizeText(text, []);
    expect(clean).not.toContain("Projects");
    expect(clean).not.toContain("work");
    expect(clean).not.toContain("srv");
    expect(clean).toContain("<path>");
    expect(clean).toContain("<file-url>");
  });

  it("leaves web URLs and relative paths alone", () => {
    const text = "https://example.test/a/b and benchmarks/perf/harness/tape.ts and /_next/static/x.js";
    expect(sanitizeText(text, [])).toBe(text);
  });

  it("removes the runtime user name and host name", () => {
    const terms = privacyTerms();
    const username = userInfo().username;
    const text = `owner ${username} wrote this`;
    if (username.length >= 3) {
      expect(terms.some(({ rule }) => rule === "username")).toBe(true);
      expect(sanitizeText(text, terms)).not.toContain(username);
      expect(scanLine(text, terms)).toContain("username");
    } else {
      expect(terms.some(({ rule }) => rule === "username")).toBe(false);
    }
  });

  it("removes command_line metadata and sanitises trace strings", () => {
    const trace = {
      metadata: { command_line: "tool --flag", other: "kept" },
      traceEvents: [{ name: "x", args: { url: `${fileUrl}`, nested: [{ command_line: "again", path: windowsPath }] } }],
    };
    const clean = sanitizeTrace(trace, []) as typeof trace;
    const text = JSON.stringify(clean);
    expect(text).not.toContain("command_line");
    expect(text).not.toContain("tool --flag");
    expect(text).not.toContain("Projects");
    expect(text).toContain("kept");
  });

  it("reports rule names and never the match", () => {
    expect(scanLine(`x ${windowsPath}`, [])).toEqual(["windows-path"]);
    expect(scanLine(`x ${escapedWindowsPath}`, [])).toEqual(["windows-path"]);
    expect(scanLine(`x ${posixPath}`, [])).toEqual(["posix-path"]);
    expect(scanLine(`x ${fileUrl}`, [])).toEqual(["file-url"]);
    expect(scanLine(`contact ${email}`, [])).toEqual(["email"]);
    expect(scanLine("nothing to see: https://example.test/a", [])).toEqual([]);
  });

  it("scans files and directories as file:line:rule", async () => {
    const dir = join(SCRATCH, "scan");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "clean.txt"), "fine\nstill fine\n");
    writeFileSync(join(dir, "dirty.txt"), `fine\nline two ${windowsPath}\n${email}\n`);
    writeFileSync(join(dir, "binary.bin"), Buffer.from([0, 1, 2, 3]));
    const hits = await scanPaths([dir], []);
    expect(hits.map((hit) => hit.split(":").slice(-2).join(":")).sort()).toEqual(["2:windows-path", "3:email"]);
    for (const hit of hits) {
      expect(hit).not.toContain("Projects");
      expect(hit).not.toContain(email);
    }
    expect(await scanPaths([join(dir, "clean.txt")], [])).toEqual([]);
  });
});

describe("workloads v1", () => {
  const dir = resolve(process.cwd(), "benchmarks/perf/workloads/v1");

  it("verifies against its manifest", () => {
    const result = verifyWorkloads(dir);
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.fileCount).toBe(4);
  });

  it("detects a changed byte, a missing file and an unlisted file", () => {
    const copy = join(SCRATCH, "workloads");
    cpSync(dir, copy, { recursive: true });
    const sceneFile = join(copy, "h100-scene.json");
    writeFileSync(sceneFile, `${readFileSync(sceneFile, "utf8")} `);
    rmSync(join(copy, "c100-scene.json"));
    writeFileSync(join(copy, "extra.json"), "{}\n");
    const problems = verifyWorkloads(copy).problems.join("\n");
    expect(problems).toContain("h100-scene.json: sha256 does not match");
    expect(problems).toContain("c100-scene.json: file is missing");
    expect(problems).toContain("extra.json: file is not listed");
  });

  type TimedEvent = { plannedMs: number; event: { type: string } };
  const readTape = (name: string) =>
    JSON.parse(readFileSync(join(dir, name), "utf8")) as { id: string; rateHz: number; durationMs: number; events: TimedEvent[] };

  it("keeps the manifest counts, rates and scene facts in step with the files", () => {
    const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as {
      scene: Record<string, unknown>;
      tapes: Record<string, { eventCount: number; eventsByType: Record<string, number> }>;
      cases: { id: string; mode: string; rateHz: number; durationMs: number; eventCount: number; tape: string; scene: string; replay: string }[];
    };
    expect(manifest.scene).toMatchObject({ walls: 100, portals: 8, sources: 4, listeners: 8, primitives: 0 });
    for (const [name, listed] of Object.entries(manifest.tapes)) {
      const tape = readTape(name);
      expect(tape.events).toHaveLength(listed.eventCount);
      const counts: Record<string, number> = {};
      for (const { event } of tape.events) counts[event.type] = (counts[event.type] ?? 0) + 1;
      expect(counts).toEqual(listed.eventsByType);
    }
    expect(manifest.cases.map(({ id }) => id)).toEqual([
      "W01_H100_POSE_60HZ_60S",
      "W02_H100_STATIC_5HZ_30S",
      "W03_C100_POSE_60HZ_60S",
      "W04_C100_STATIC_5HZ_30S",
    ]);
    for (const item of manifest.cases) {
      const tape = readTape(item.tape);
      expect(item.replay).toBe("open");
      expect(item.rateHz).toBe(tape.rateHz);
      expect(item.durationMs).toBe(tape.durationMs);
      expect(item.eventCount).toBe(tape.events.length);
    }
  });

  it("plans the 60 Hz pose tape at i * 1000 / 60 ms for 3,600 events", () => {
    const tape = readTape("pose-60hz-60s.json");
    expect(tape.rateHz).toBe(60);
    expect(tape.durationMs).toBe(60_000);
    expect(tape.events).toHaveLength(3600);
    tape.events.forEach(({ plannedMs, event }, index) => {
      expect(plannedMs).toBe((index * 1000) / 60);
      expect(event.type).toBe("listener-pose");
    });
  });

  it("plans the static tape with 1,800 poses and 150 static events at 5 Hz, in time order", () => {
    const tape = readTape("static-5hz-30s.json");
    expect(tape.rateHz).toBe(5);
    expect(tape.durationMs).toBe(30_000);
    const poses = tape.events.filter(({ event }) => event.type === "listener-pose");
    const statics = tape.events.filter(({ event }) => event.type !== "listener-pose");
    expect(poses).toHaveLength(1800);
    expect(statics).toHaveLength(150);
    statics.forEach(({ plannedMs }, index) => expect(plannedMs).toBeCloseTo(index * 200 + 1000 / 120, 9));
    for (let index = 1; index < tape.events.length; index += 1) {
      expect(tape.events[index]!.plannedMs).toBeGreaterThan(tape.events[index - 1]!.plannedMs);
    }
    expect(new Set(statics.map(({ event }) => event.type))).toEqual(new Set(["wall-endpoint", "wall-material", "portal-toggle"]));
  });

  it("writes tape files with one event per line", () => {
    for (const name of ["pose-60hz-60s.json", "static-5hz-30s.json"]) {
      const lines = readFileSync(join(dir, name), "utf8").split("\n");
      const eventLines = lines.filter((line) => line.startsWith('    {"plannedMs":'));
      expect(eventLines).toHaveLength(readTape(name).events.length);
      expect(lines.length).toBeLessThan(readTape(name).events.length + 20);
    }
  });
});

describe("censored latest-wait", () => {
  const waits = (outcomes: [number, string, boolean][]) =>
    outcomes.map(([duration, outcome, warm]) => sample({ phase: "pose.latest-wait", duration, outcome, warm }));

  it("reports the censored count and a block over ok plus censored samples", () => {
    const summary = summarizeSamples(waits([[10, "ok", true], [20, "ok", true], [500, "censored", true], [700, "censored", true], [5, "ok", false]]));
    const phase = summary.phases["pose.latest-wait"]!;
    expect(phase.warm.N).toBe(2);
    expect(phase.warm.max).toBe(20);
    expect(phase.censoredCount).toBe(2);
    expect(phase.includingCensored!.censoredAreLowerBounds).toBe(true);
    expect(phase.includingCensored!.warm.N).toBe(4);
    expect(phase.includingCensored!.warm.max).toBe(700);
    expect(phase.includingCensored!.cold.N).toBe(1);
    expect(phase.outcomes).toEqual({ ok: 3, censored: 2 });
  });

  it("is present with a zero count when nothing was censored, and absent on other phases", () => {
    const summary = summarizeSamples([...waits([[10, "ok", false]]), sample({ phase: "solve" })]);
    expect(summary.phases["pose.latest-wait"]!.censoredCount).toBe(0);
    expect(summary.phases.solve!.includingCensored).toBeUndefined();
  });

  it("carries the block into pooled group output", () => {
    const entry: RunIndexLine = {
      runId: "a", variant: "TS-W", case: "W01_H100_POSE_60HZ_60S", pass: "clean", boundary: "browser-pool", workers: 2,
      audio: "not-applicable", build: "not-applicable", parity: false, status: "passed",
      start: "2026-01-01T00:00:00.000Z", end: "2026-01-01T00:01:00.000Z", orderIndex: 0, sampleCount: 3,
    };
    const samples = waits([[10, "ok", true], [900, "censored", true]]).map((value) => ({ ...value, variant: "TS-W", workers: 2 }));
    const [group] = buildGroups([{ entry, samples, denominators: makeDenominators({ submitted: 2 }) }]);
    const pooled = group!.pooled["pose.latest-wait"] as unknown as { warm: { N: number }; censoredCount: number; includingCensored: { warm: { N: number; max: number } } };
    expect(pooled.warm.N).toBe(1);
    expect(pooled.censoredCount).toBe(1);
    expect(pooled.includingCensored.warm.N).toBe(2);
    expect(pooled.includingCensored.warm.max).toBe(900);
  });
});
