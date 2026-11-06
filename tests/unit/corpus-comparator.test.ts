import { describe, expect, it } from "vitest";

import {
  aggregateSha256,
  canonicalize,
  compareOutputs,
  sha256Hex,
  summarizeReports,
  validateRules,
} from "../../scripts/corpus/lib.mjs";
import type { CorpusRules, FieldClass } from "../../scripts/corpus/lib.mjs";

const context = { caseId: "case-a", kind: "demo" };

function cls(overrides: Partial<FieldClass>): FieldClass {
  return { compare: "exact", status: "discrete", source: "test", ...overrides };
}

function makeRules(
  classes: Record<string, FieldClass>,
  rules: { path: string; class: string }[],
): CorpusRules {
  return {
    rulesVersion: "test",
    status: "draft",
    frozenOn: null,
    classes,
    rules: rules.map((rule) => ({ kinds: ["demo"], ...rule })),
  };
}

function tolRules(compare: FieldClass): CorpusRules {
  return makeRules({ c: compare }, [{ path: "/v", class: "c" }]);
}

const tolerance = (atol: number, rtol = 0): FieldClass =>
  cls({ compare: "tolerance", unit: "u", atol, rtol, status: "proposed" });

describe("canonicalize", () => {
  it("sorts keys at every depth and uses a 2-space indent with trailing newline", () => {
    expect(canonicalize({ b: 1, a: [2, { d: 1, c: 2 }] }).text).toBe(
      '{\n  "a": [\n    2,\n    {\n      "c": 2,\n      "d": 1\n    }\n  ],\n  "b": 1\n}\n',
    );
  });

  it("drops undefined keys", () => {
    expect(canonicalize({ a: 1, b: undefined }).text).toBe('{\n  "a": 1\n}\n');
  });

  it("throws with the JSON Pointer path on NaN and Infinity", () => {
    expect(() => canonicalize({ a: [Number.NaN] })).toThrow(/\/a\/0/);
    expect(() => canonicalize({ a: [Infinity] })).toThrow(/\/a\/0/);
    expect(() => canonicalize({ a: -Infinity })).toThrow(/\/a/);
  });

  it("writes -0 as 0 and reports its path", () => {
    const result = canonicalize({ x: -0 });
    expect(result.text).toContain('"x": 0');
    expect(result.negativeZeroPaths).toEqual(["/x"]);
  });
});

describe("hashing", () => {
  it("aggregates sorted id/sha lines", () => {
    expect(aggregateSha256({ b: "2", a: "1" })).toBe(sha256Hex("a 1\nb 2\n"));
  });

  it("hashes strings as UTF-8 and accepts bytes", () => {
    expect(sha256Hex("é")).toBe(sha256Hex(new Uint8Array([0xc3, 0xa9])));
  });
});

describe("validateRules", () => {
  it("throws when a non-exact class has no unit", () => {
    const rules = makeRules(
      { c: cls({ compare: "tolerance", atol: 1, rtol: 0, status: "proposed" }) },
      [{ path: "/v", class: "c" }],
    );
    expect(() => validateRules(rules)).toThrow(/unit/);
  });

  it("throws when a rule names an unknown class", () => {
    const rules = makeRules({}, [{ path: "/v", class: "missing" }]);
    expect(() => validateRules(rules)).toThrow(/missing/);
  });

  it("accepts a valid rule set", () => {
    expect(() => validateRules(tolRules(tolerance(1e-5)))).not.toThrow();
  });
});

describe("compareOutputs structure and classification", () => {
  const exactRules = makeRules({ d: cls({}) }, [{ path: "/*", class: "d" }]);

  it("reports a discrete change with path, expected and actual", () => {
    const report = compareOutputs({ route: "direct" }, { route: "portal" }, exactRules, context);
    expect(report.ok).toBe(false);
    expect(report.violations).toEqual([
      { type: "discrete", path: "/route", expected: "direct", actual: "portal", class: "d" },
    ]);
  });

  it("treats array order as a contract", () => {
    const rules = makeRules({ d: cls({}) }, [{ path: "/list/*", class: "d" }]);
    const report = compareOutputs({ list: ["a", "b"] }, { list: ["b", "a"] }, rules, context);
    expect(report.violations.map((v) => v.type)).toEqual(["discrete", "discrete"]);
  });

  it("passes identical output as bit-exact", () => {
    const report = compareOutputs({ a: 1, b: "x" }, { b: "x", a: 1 }, exactRules, context);
    expect(report.ok).toBe(true);
    expect(report.bitExact).toBe(true);
    expect(report.leafCount).toBe(2);
  });

  it("flags structure changes", () => {
    const wild = makeRules({ d: cls({}) }, [
      { path: "/*", class: "d" },
      { path: "/*/*", class: "d" },
    ]);
    const length = compareOutputs({ a: [1, 2] }, { a: [1] }, wild, context);
    expect(length.violations.map((v) => v.type)).toEqual(["structure"]);
    const missing = compareOutputs({ a: 1, b: 2 }, { a: 1 }, wild, context);
    expect(missing.violations).toMatchObject([{ type: "structure", path: "/b" }]);
    const extra = compareOutputs({ a: 1 }, { a: 1, b: 2 }, wild, context);
    expect(extra.violations).toMatchObject([{ type: "structure", path: "/b" }]);
    const emptyShape = compareOutputs({ a: [] }, { a: {} }, wild, context);
    expect(emptyShape.violations).toMatchObject([{ type: "structure", path: "/a" }]);
  });

  it("flags a leaf type change as structure", () => {
    const report = compareOutputs({ a: 1 }, { a: "1" }, exactRules, context);
    expect(report.violations).toMatchObject([{ type: "structure", path: "/a" }]);
  });

  it("flags an unclassified leaf even when values are equal", () => {
    const report = compareOutputs({ a: 1, extra: 2 }, { a: 1, extra: 2 }, makeRules({ d: cls({}) }, [{ path: "/a", class: "d" }]), context);
    expect(report.ok).toBe(false);
    expect(report.violations).toMatchObject([{ type: "unclassified", path: "/extra" }]);
  });

  it("flags a leaf matched by two rules as ambiguous", () => {
    const rules = makeRules({ d: cls({}) }, [
      { path: "/a", class: "d" },
      { path: "/*", class: "d" },
    ]);
    const report = compareOutputs({ a: 1 }, { a: 1 }, rules, context);
    expect(report.violations).toMatchObject([{ type: "ambiguous", path: "/a" }]);
  });

  it("only applies rules whose kinds include the case kind", () => {
    const rules: CorpusRules = {
      ...exactRules,
      rules: [{ kinds: ["other"], path: "/*", class: "d" }],
    };
    const report = compareOutputs({ a: 1 }, { a: 1 }, rules, context);
    expect(report.violations).toMatchObject([{ type: "unclassified" }]);
  });
});

describe("compareOutputs continuous classes", () => {
  it("applies an absolute tolerance boundary", () => {
    const rules = tolRules(tolerance(1e-5));
    expect(compareOutputs({ v: 0 }, { v: 1e-5 }, rules, context).ok).toBe(true);
    const failed = compareOutputs({ v: 0 }, { v: 1.1e-5 }, rules, context);
    expect(failed.violations).toMatchObject([{ type: "continuous", path: "/v", class: "c" }]);
  });

  it("applies a relative tolerance", () => {
    const rules = tolRules(tolerance(1e-5, 1e-6));
    expect(compareOutputs({ v: 1e6 }, { v: 1e6 + 0.5 }, rules, context).ok).toBe(true);
  });

  it("rounds to the configured decimals", () => {
    const rules = tolRules(
      cls({ compare: "decimal", decimals: 6, unit: "u", status: "existing-test" }),
    );
    expect(compareOutputs({ v: 1.0000004 }, { v: 1.0000001 }, rules, context).ok).toBe(true);
    expect(compareOutputs({ v: 1.0000004 }, { v: 1.0000006 }, rules, context).ok).toBe(false);
  });

  it("wraps circular differences", () => {
    const rules = tolRules(
      cls({ compare: "circular", atol: 1e-5, period: 360, unit: "deg", status: "proposed" }),
    );
    expect(compareOutputs({ v: 179.999999 }, { v: -179.999999 }, rules, context).ok).toBe(true);
    expect(compareOutputs({ v: 170 }, { v: -170 }, rules, context).ok).toBe(false);
  });

  it("reports a string where a continuous class expects a number as structure", () => {
    const report = compareOutputs({ v: "a" }, { v: "a" }, tolRules(tolerance(1e-5)), context);
    expect(report.violations).toMatchObject([{ type: "structure", path: "/v" }]);
  });

  it("records per-class error stats", () => {
    const rules = makeRules({ c: tolerance(1) }, [{ path: "/v/*", class: "c" }]);
    const report = compareOutputs({ v: [0, 10] }, { v: [0.5, 10] }, rules, context);
    expect(report.stats.c).toMatchObject({ count: 2, maxAbsError: 0.5 });
    expect(report.stats.c?.worst).toEqual({ caseId: "case-a", path: "/v/0", expected: 0, actual: 0.5 });
    expect(report.bitExact).toBe(false);
  });
});

describe("summarizeReports", () => {
  it("combines counts, maxima and the worst leaf across cases", () => {
    const rules = makeRules({ c: tolerance(10) }, [{ path: "/v", class: "c" }]);
    const first = compareOutputs({ v: 0 }, { v: 1 }, rules, { caseId: "one", kind: "demo" });
    const second = compareOutputs({ v: 0 }, { v: 3 }, rules, { caseId: "two", kind: "demo" });
    const summary = summarizeReports([first, second]);
    expect(summary).toMatchObject({ ok: true, caseCount: 2, bitExactCases: 0, violationCount: 0 });
    expect(summary.stats.c).toMatchObject({ count: 2, maxAbsError: 3 });
    expect(summary.stats.c?.worst).toEqual({ caseId: "two", path: "/v", expected: 0, actual: 3 });
  });

  it("recomputes percentiles over all samples and caps first violations at 20", () => {
    const rules = makeRules({ c: tolerance(0) }, [{ path: "/v/*", class: "c" }]);
    const big = compareOutputs(
      { v: Array.from({ length: 30 }, () => 0) },
      { v: Array.from({ length: 30 }, (_, i) => i + 1) },
      rules,
      { caseId: "big", kind: "demo" },
    );
    const small = compareOutputs({ v: [0] }, { v: [1] }, rules, { caseId: "small", kind: "demo" });
    const summary = summarizeReports([big, small]);
    expect(summary.ok).toBe(false);
    expect(summary.violationCount).toBe(31);
    expect(summary.firstViolations).toHaveLength(20);
    expect(summary.firstViolations[0]?.caseId).toBe("big");
    // Samples are 1..30 plus a 1: nearest-rank p50 of 31 values is the 16th.
    expect(summary.stats.c?.p50AbsError).toBe(15);
    expect(summary.stats.c?.p95AbsError).toBe(29);
  });
});

describe("validateRules numeric parameters", () => {
  const check = (compare: FieldClass, pattern: RegExp) => {
    expect(() => validateRules(makeRules({ bad: compare }, []))).toThrow(pattern);
  };
  const base = { unit: "u", status: "proposed" as const };

  it("requires an integer decimals in 0..100 for decimal", () => {
    check(cls({ ...base, compare: "decimal" }), /bad.*decimals/);
    check(cls({ ...base, compare: "decimal", decimals: 1.5 }), /bad.*decimals/);
    check(cls({ ...base, compare: "decimal", decimals: -1 }), /bad.*decimals/);
    check(cls({ ...base, compare: "decimal", decimals: 101 }), /bad.*decimals/);
  });

  it("requires a finite non-negative atol for tolerance and circular", () => {
    check(cls({ ...base, compare: "tolerance", rtol: 0 }), /bad.*atol/);
    check(cls({ ...base, compare: "tolerance", atol: -1, rtol: 0 }), /bad.*atol/);
    check(cls({ ...base, compare: "circular", atol: Number.NaN, period: 360 }), /bad.*atol/);
  });

  it("requires a finite non-negative rtol for tolerance", () => {
    check(cls({ ...base, compare: "tolerance", atol: 0 }), /bad.*rtol/);
    check(cls({ ...base, compare: "tolerance", atol: 0, rtol: Infinity }), /bad.*rtol/);
    check(cls({ ...base, compare: "tolerance", atol: 0, rtol: -1 }), /bad.*rtol/);
  });

  it("requires a finite positive period for circular", () => {
    check(cls({ ...base, compare: "circular", atol: 0 }), /bad.*period/);
    check(cls({ ...base, compare: "circular", atol: 0, period: 0 }), /bad.*period/);
  });
});

describe("negative zero", () => {
  const exactRules = makeRules({ d: cls({}) }, [{ path: "/v", class: "d" }]);

  it("keeps -0 versus 0 a discrete violation for exact classes", () => {
    const report = compareOutputs({ v: 0 }, { v: -0 }, exactRules, context);
    expect(report.violations).toMatchObject([{ type: "discrete", path: "/v" }]);
    expect(report.negativeZeroPaths).toEqual({ expected: [], actual: ["/v"] });
  });

  it("lets a continuous class pass -0 but reports it and denies bit-exactness", () => {
    const report = compareOutputs({ v: 0 }, { v: -0 }, tolRules(tolerance(1e-5)), context);
    expect(report.ok).toBe(true);
    expect(report.bitExact).toBe(false);
    expect(report.negativeZeroPaths).toEqual({ expected: [], actual: ["/v"] });
  });

  it("stays bit-exact when both sides carry -0 at the same path", () => {
    const report = compareOutputs({ v: -0 }, { v: -0 }, tolRules(tolerance(1e-5)), context);
    expect(report.bitExact).toBe(true);
  });

  it("counts expected plus actual negative zeros in the summary", () => {
    const rules = tolRules(tolerance(1e-5));
    const a = compareOutputs({ v: -0 }, { v: 0 }, rules, context);
    const b = compareOutputs({ v: -0 }, { v: -0 }, rules, context);
    expect(summarizeReports([a, b]).negativeZeroLeafCount).toBe(3);
  });
});

describe("large corpora and plain-data reports", () => {
  const rules = makeRules({ c: tolerance(10) }, [{ path: "/v/*", class: "c" }]);
  const length = 300_000;
  const expected = { v: Array.from({ length }, () => 1) };
  const actual = { v: Array.from({ length }, (_, i) => 1 + (i % 7) / 10) };

  it("compares and summarizes 300k continuous leaves without overflowing", () => {
    const report = compareOutputs(expected, actual, rules, context);
    expect(report.stats.c?.count).toBe(length);
    const summary = summarizeReports([report, report]);
    expect(summary.stats.c?.count).toBe(length * 2);
    expect(summary.stats.c?.maxAbsError).toBeCloseTo(0.6, 12);
  });

  it("summarizes identically after a JSON round trip", () => {
    const small = makeRules({ c: tolerance(10) }, [{ path: "/v", class: "c" }]);
    const reports = [
      compareOutputs({ v: 1 }, { v: 2 }, small, { caseId: "one", kind: "demo" }),
      compareOutputs({ v: 0 }, { v: 5 }, small, { caseId: "two", kind: "demo" }),
    ];
    const revived = JSON.parse(JSON.stringify(reports)) as typeof reports;
    expect(summarizeReports(revived)).toEqual(summarizeReports(reports));
  });
});
