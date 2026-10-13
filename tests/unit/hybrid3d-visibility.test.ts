import { describe, expect, it } from "vitest";

import { buildPatchBvh, hasSegmentBvhHit, intersectSegmentBvh } from "@/acoustics/hybrid3d/bvh";
import { makePatch3, type SegmentPatchHit, type Vec3 } from "@/acoustics/hybrid3d/geometry";
import { reflectionLegIsVisible } from "@/acoustics/hybrid3d/reflections";

function partition(id: string, x: number, opening = false) {
  return makePatch3(`${id}:front`, "wall", "concrete_hard", [
    { x, y: 0, z: -2 }, { x, y: 3, z: -2 }, { x, y: 3, z: 2 }, { x, y: 0, z: 2 },
  ], {
    wallId: id,
    openings: opening ? [{
      id: "door", wallId: id, center: { x, y: 0, z: 0 }, along: { x: 0, y: 0, z: 1 },
      widthM: 1, floorElevationM: 0, heightM: 2,
    }] : [],
  });
}

describe("short-circuit Hybrid visibility queries", () => {
  it("keeps portal apertures, finite edges and segment endpoints identical to full intersections", () => {
    expect(hasSegmentBvhHit).toBeTypeOf("function");
    const bvh = buildPatchBvh([partition("door-wall", 1, true)]);
    for (const [start, end, blocked] of [
      [{ x: 0, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, false],
      [{ x: 0, y: 2.5, z: 0 }, { x: 2, y: 2.5, z: 0 }, true],
      [{ x: 0, y: 1, z: 2 }, { x: 2, y: 1, z: 2 }, true],
      [{ x: 0, y: 1, z: 2.1 }, { x: 2, y: 1, z: 2.1 }, false],
      [{ x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 }, false],
      [{ x: 0, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }, false],
      [{ x: 1, y: 1, z: 1 }, { x: 1, y: 2, z: 1 }, false],
    ] as const) {
      expect(hasSegmentBvhHit(start, end, bvh)).toBe(blocked);
      expect(hasSegmentBvhHit(end, start, bvh)).toBe(blocked);
      expect(intersectSegmentBvh(start, end, bvh).length > 0).toBe(blocked);
    }
  });

  it("does not stop at an allowed reflector when a later wall blocks the leg", () => {
    expect(hasSegmentBvhHit).toBeTypeOf("function");
    const bvh = buildPatchBvh(Array.from({ length: 12 }, (_, i) => partition(`wall-${i}`, i + 1)));
    const start = { x: 0, y: 1, z: 1 };
    const end = { x: 14, y: 1, z: 1 };
    const allowed = bvh.patches.slice(0, 11).map((patch) => patch.wallId!);
    expect(reflectionLegIsVisible(start, end, bvh, allowed)).toBe(false);
    expect(reflectionLegIsVisible(start, end, bvh, [...allowed, "wall-11:front"])).toBe(true);
    expect(hasSegmentBvhHit(start, end, bvh, (hit) => hit.wallId === "wall-11")).toBe(true);
    expect(hasSegmentBvhHit(start, end, bvh, () => false)).toBe(false);
    expect(hasSegmentBvhHit(start, end, buildPatchBvh([]))).toBe(false);
  });

  it("matches the retained full-hit oracle for seeded oblique, parallel and zero-length segments", () => {
    expect(hasSegmentBvhHit).toBeTypeOf("function");
    const bvh = buildPatchBvh(Array.from({ length: 32 }, (_, i) => partition(`wall-${i}`, i / 2, i % 3 === 0)));
    let seed = 20261013;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const point = (): Vec3 => ({ x: random() * 20 - 2, y: random() * 5 - 1, z: random() * 6 - 3 });
    const accept = (hit: SegmentPatchHit) => !["wall-0", "wall-1", "wall-6"].includes(hit.wallId ?? "");
    for (let i = 0; i < 2048; i++) {
      const start = point();
      const end = i % 7 === 0 ? start : i % 5 === 0 ? { ...point(), x: start.x } : point();
      const hits = intersectSegmentBvh(start, end, bvh);
      expect(hasSegmentBvhHit(start, end, bvh)).toBe(hits.length > 0);
      expect(hasSegmentBvhHit(start, end, bvh, accept)).toBe(hits.some(accept));
      expect(reflectionLegIsVisible(start, end, bvh, ["wall-0", "wall-1", "wall-6"])).toBe(!hits.some(accept));
    }
  });
});
