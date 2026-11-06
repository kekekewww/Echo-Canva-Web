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
      { c: cls({ compare: "tolerance", atol: 1, status: "proposed" }) },
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
