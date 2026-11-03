import { describe, expect, it } from "vitest";

import { computeAcousticFrame, createClassicStaticContext } from "@/acoustics/compute-frame";
import {
  isPoseLaggingClassicFrame,
  jsonEqual,
  sameClassicStaticStructure,
  sameIdOrder,
} from "@/acoustics/frame-acceptance";
import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { STRESS_100_WALLS_PRESET } from "@/domain/presets/stress-100-walls";
import type { SceneSpec } from "@/domain/scene/types";

function scene(revision: number): SceneSpec {
  const value = structuredClone(CONCRETE_PARTITION_PRESET) as SceneSpec;
  value.revision = revision;
  return value;
}

describe("jsonEqual", () => {
  it("compares JSON-like values structurally and treats a missing key like undefined", () => {
    expect(jsonEqual({ a: [1, { b: "x" }] }, { a: [1, { b: "x" }] })).toBe(true);
    expect(jsonEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(jsonEqual({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(jsonEqual([1], { 0: 1 })).toBe(false);
    expect(jsonEqual(null, {})).toBe(false);
  });
});

describe("sameIdOrder", () => {
  it("accepts strings or records and requires the same order", () => {
    expect(sameIdOrder(["a", "b"], [{ id: "a" }, { id: "b" }])).toBe(true);
    expect(sameIdOrder(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameIdOrder(["a"], ["a", "b"])).toBe(false);
  });
});

describe("sameClassicStaticStructure", () => {
  it.each([CONCRETE_PARTITION_PRESET, STRESS_100_WALLS_PRESET])(
    "agrees with the Worker static fingerprint for pose and structure edits (%#)",
    (preset) => {
      const base = structuredClone(preset) as SceneSpec;
      const posed = structuredClone(base);
      posed.revision += 7;
      posed.listener = { ...posed.listener, position: { x: posed.listener.position.x + 0.3, y: posed.listener.position.y } };
      posed.sources = posed.sources.map((source) => ({ ...source, position: { x: source.position.x - 0.2, y: source.position.y } }));
      const structural = structuredClone(base);
      structural.walls[0] = { ...structural.walls[0]!, thicknessM: structural.walls[0]!.thicknessM + 0.05 };
      const fingerprint = (value: SceneSpec) => createClassicStaticContext(value).fingerprint;

      expect(sameClassicStaticStructure(base, posed)).toBe(true);
      expect(fingerprint(posed)).toBe(fingerprint(base));
      expect(sameClassicStaticStructure(base, structural)).toBe(false);
      expect(fingerprint(structural)).not.toBe(fingerprint(base));
    },
  );
});

describe("isPoseLaggingClassicFrame", () => {
  const frame = computeAcousticFrame(scene(10));
  const fingerprint = createClassicStaticContext(scene(10)).fingerprint;

  it("accepts an older-revision frame when only poses changed", () => {
    const moved = scene(12);
    moved.sources[0]!.position = { x: 9.5, y: 4 };
    expect(isPoseLaggingClassicFrame(frame, fingerprint, moved)).toBe(true);
  });

  it("is false for the same revision, a missing fingerprint, structure or source-set changes", () => {
    expect(isPoseLaggingClassicFrame(frame, fingerprint, scene(10))).toBe(false);
    expect(isPoseLaggingClassicFrame(frame, undefined, scene(12))).toBe(false);
    const closed = scene(12);
    closed.portals[0]!.open = false;
    expect(isPoseLaggingClassicFrame(frame, fingerprint, closed)).toBe(false);
    const fewer = scene(12);
    fewer.sources.splice(1, 1);
    expect(isPoseLaggingClassicFrame(frame, fingerprint, fewer)).toBe(false);
  });
});
