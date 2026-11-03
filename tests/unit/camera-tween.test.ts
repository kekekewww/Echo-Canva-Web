import { describe, expect, it } from "vitest";

import { easeInOutCubic, interpolateCamera } from "@/hooks/useCameraTween";

const from = { yawDeg: 350, pitchDeg: 30, zoom: 1, panX: 0, panY: 0 };
const to = { yawDeg: 10, pitchDeg: 78, zoom: 2, panX: 40, panY: -20 };

describe("camera tween math", () => {
  it("eases in and out symmetrically and clamps to [0, 1]", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 12);
    expect(easeInOutCubic(0.25) + easeInOutCubic(0.75)).toBeCloseTo(1, 12);
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });

  it("starts at the source and ends exactly at the target", () => {
    expect(interpolateCamera(from, to, 0)).toEqual(from);
    const end = interpolateCamera(from, to, 1);
    expect(end.pitchDeg).toBe(78);
    expect(end.zoom).toBe(2);
    expect(end.panX).toBe(40);
    expect(end.panY).toBe(-20);
    expect(((end.yawDeg % 360) + 360) % 360).toBeCloseTo(10, 9);
  });

  it("turns yaw the short way round (350° → 10° passes through 0°, not 180°)", () => {
    const mid = interpolateCamera(from, to, 0.5);
    expect(((mid.yawDeg % 360) + 360) % 360).toBeCloseTo(0, 9);
    expect(mid.pitchDeg).toBe(54);
  });
});
