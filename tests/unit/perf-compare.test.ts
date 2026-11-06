import { describe, expect, it } from "vitest";

import { overheadComparisons, pairedDifferences, parityRows, renderComparisons } from "../../scripts/perf/compare.mjs";
import {
  buildGroups,
  createSample,
  makeDenominators,
  summarizeSamples,
  validateSample,
  type RunIndexLine,
  type Sample,
} from "../../scripts/perf/lib.mjs";

function entry(overrides: Partial<RunIndexLine>): RunIndexLine {
  return {
    runId: "r",
    variant: "TS-W",
    case: "TC01_LISTENER_TAPE_SEEDED",
    pass: "clean",
    boundary: "browser-pool",
    workers: 2,
    audio: "not-applicable",
    build: "not-applicable",
    parity: false,
    status: "passed",
    start: "2026-01-01T00:00:00.000Z",
    end: "2026-01-01T00:00:10.000Z",
    orderIndex: 0,
    sampleCount: 0,
    ...overrides,
  };
}

function samples(runId: string, variant: string, phase: string, values: number[], extra: Record<string, unknown> = {}): Sample[] {
  return values.map((duration, index) =>
    createSample({
      runId,
      variant,
      caseId: "TC01_LISTENER_TAPE_SEEDED",
      phase,
      duration,
      boundary: "browser-pool",
      pass: "clean",
      workers: variant === "TS-W" ? 2 : "not-applicable",
      warm: true,
      clock: "main-perf-now",
      requestSeq: index + 1,
      ...extra,
    }),
  );
}

describe("job kind", () => {
  const base = { runId: "r", variant: "TS-S", caseId: "c", phase: "solve", duration: 1, boundary: "node-core", pass: "clean", warm: true, clock: "main-perf-now" };

  it("defaults to not-applicable and accepts the three values only", () => {
    expect(createSample(base).jobKind).toBe("not-applicable");
    expect(createSample({ ...base, jobKind: "static-install" }).jobKind).toBe("static-install");
    expect(createSample({ ...base, jobKind: "pose-only" }).jobKind).toBe("pose-only");
    expect(validateSample({ ...createSample(base), jobKind: "mixed" })).not.toEqual([]);
    const withoutKind: Record<string, unknown> = { ...createSample(base) };
    delete withoutKind.jobKind;
    expect(validateSample(withoutKind)).not.toEqual([]);
  });

  it("splits statistics per phase by job kind next to the combined figures", () => {
    const rows = [
      ...[1, 2, 3, 4].map((value) => createSample({ ...base, duration: value, jobKind: "pose-only" })),
      ...[100, 200].map((value) => createSample({ ...base, duration: value, jobKind: "static-install" })),
    ];
    const phase = summarizeSamples(rows).phases.solve!;
    expect(phase.warm.N).toBe(6);
    expect(phase.warm.max).toBe(200);
    expect(phase.byJobKind!["pose-only"]!.warm).toMatchObject({ N: 4, max: 4 });
    expect(phase.byJobKind!["static-install"]!.warm).toMatchObject({ N: 2, p50: 100, max: 200 });
  });

  it("leaves byJobKind out when no sample carries a kind, and carries it into pooled groups", () => {
    expect(summarizeSamples([createSample(base)]).phases.solve!.byJobKind).toBeUndefined();
    const rows = [createSample({ ...base, jobKind: "pose-only" }), createSample({ ...base, duration: 50, jobKind: "static-install" })];
    const [group] = buildGroups([{ entry: entry({ variant: "TS-S", boundary: "node-core", workers: "not-applicable" }), samples: rows, denominators: makeDenominators({ submitted: 2 }) }]);
    expect(Object.keys(group!.pooled.solve!.byJobKind!).sort()).toEqual(["pose-only", "static-install"]);
  });
});

describe("pairedDifferences", () => {
  it("pairs TS-S and TS-W runs by case, pass, boundary and order index and subtracts p50, p95 and p99", () => {
    const serial = { entry: entry({ runId: "s", variant: "TS-S", workers: "not-applicable", orderIndex: 3 }), samples: samples("s", "TS-S", "job.total", [1, 2, 3, 4]) };
    const pooled = { entry: entry({ runId: "w", variant: "TS-W", orderIndex: 3 }), samples: samples("w", "TS-W", "pool.compute-metric", [11, 12, 13, 14]) };
    const other = { entry: entry({ runId: "w2", variant: "TS-W", orderIndex: 4 }), samples: samples("w2", "TS-W", "pool.compute-metric", [1]) };
    const pairs = pairedDifferences([serial, pooled, other]);
    expect(pairs).toHaveLength(1);
    const phase = pairs[0]!.phases["job.total (TS-S) against pool.compute-metric (TS-W)"] as { warm: { tsWMinusTsS: { p50: number; p95: number } } };
    expect(phase.warm.tsWMinusTsS).toMatchObject({ p50: 10, p95: 10, p99: 10 });
  });

  it("makes no pair when only one variant has the order index", () => {
    expect(pairedDifferences([{ entry: entry({ variant: "TS-W" }), samples: samples("w", "TS-W", "pool.compute-metric", [1]) }])).toEqual([]);
  });
});

describe("overheadComparisons", () => {
  it("compares traced with clean and clean with bare on the same group", () => {
    const run = (runId: string, pass: string, values: number[]) => ({
      entry: entry({ runId, pass }),
      samples: samples(runId, "TS-W", "pool.compute-metric", values).map((value) => ({ ...value, pass })),
      denominators: makeDenominators({ submitted: values.length }),
    });
    const groups = buildGroups([run("t", "traced", [5, 6, 7]), run("c", "clean", [2, 3, 4]), run("b", "bare", [1, 1, 1])]);
    const rows = overheadComparisons(groups);
    expect(rows.map((row) => row.comparison).sort()).toEqual(["clean minus bare", "traced minus clean"]);
    const traced = rows.find((row) => row.comparison === "traced minus clean")!.phases["pool.compute-metric"] as { warm: { difference: { p50: number; p99: number } } };
    expect(traced.warm.difference).toMatchObject({ p50: 3, p99: 3 });
    const clean = rows.find((row) => row.comparison === "clean minus bare")!.phases["pool.compute-metric"] as { warm: { difference: { p50: number } } };
    expect(clean.warm.difference.p50).toBe(2);
  });
});

describe("parity per path", () => {
  const verdict = { stepCount: 24, expectedStepCount: 24, bitExact: false, rulesOk: true, leafCount: 2357, differingLeafCount: 19, violationCount: 0 };

  it("keeps bit-exact and rule violations as separate columns", () => {
    const rows = parityRows([
      { runId: "a", case: "TC02", path: "browser-pool serial", status: "passed", parity: verdict },
      { runId: "b", case: "TC02", path: "node-core serial", status: "passed", parity: { ...verdict, bitExact: true, differingLeafCount: 0 } },
    ]);
    const browser = rows.find((row) => row.runId === "a")!;
    expect(browser).toMatchObject({ bitExact: false, differingLeaves: 19, ruleViolations: 0, rulesOk: true, steps: "24 of 24" });
    const node = rows.find((row) => row.runId === "b")!;
    expect(node).toMatchObject({ bitExact: true, differingLeaves: 0, ruleViolations: 0 });
  });

  it("prints bit-exact false with zero violations as exactly that", () => {
    const parity = parityRows([{ runId: "a", case: "TC02", path: "browser-pool serial", status: "passed", parity: verdict }]);
    const text = renderComparisons({ paired: [], overhead: [], parity });
    expect(text).toContain("| TC02 | browser-pool serial | passed | 24 of 24 | false | 19 | 2357 | 0 |");
    expect(text).toContain("Bit-exact false with zero rule violations");
  });
});
