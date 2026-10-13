import { describe, expect, it } from "vitest";

import { projectWall, type HybridViewportWall } from "@/components/lab/HybridSpatialViewport";
import {
  DEFAULT_VIEWPORT_CAMERA,
  projectViewportPoint,
  VIEWPORT_METERS_TO_PIXELS,
  type ScreenPoint,
} from "@/components/lab/viewport-math";

const wall: HybridViewportWall = {
  id: "test_wall",
  label: "Test wall",
  a: { x: 1, z: 1 },
  b: { x: 9, z: 1 },
  thicknessM: 0.2,
  bottomM: 0,
  topM: 3,
  portals: [],
};

function area(points: readonly ScreenPoint[]): number {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]!;
    return sum + point.x * next.y - next.x * point.y;
  }, 0)) / 2;
}

function contains(points: readonly ScreenPoint[], point: ScreenPoint): boolean {
  const crossProducts = points.map((start, index) => {
    const end = points[(index + 1) % points.length]!;
    return (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
  });
  return crossProducts.every((value) => value >= 0) || crossProducts.every((value) => value <= 0);
}

function expectedProjectedArea(apertureAreaM2: number): number {
  const yaw = DEFAULT_VIEWPORT_CAMERA.yawDeg * Math.PI / 180;
  const pitch = DEFAULT_VIEWPORT_CAMERA.pitchDeg * Math.PI / 180;
  const pixelsPerM2 = (VIEWPORT_METERS_TO_PIXELS * DEFAULT_VIEWPORT_CAMERA.zoom) ** 2;
  // Two side faces and the two existing end caps, projected orthographically.
  return pixelsPerM2 * (
    2 * (8 * 3 - apertureAreaM2) * Math.abs(Math.cos(yaw) * Math.cos(pitch))
    + 2 * wall.thicknessM * 3 * Math.abs(Math.sin(yaw) * Math.cos(pitch))
  );
}

describe("Hybrid wall viewport surfaces", () => {
  it("projects each solid wall face once without coincident polygon overdraw", () => {
    const { panels } = projectWall(wall, DEFAULT_VIEWPORT_CAMERA);

    expect(panels).toHaveLength(4);
    expect(new Set(panels.map(({ points }) => JSON.stringify(points))).size).toBe(4);
    expect(panels.reduce((sum, panel) => sum + area(panel.points), 0)).toBeCloseTo(expectedProjectedArea(0), 7);
  });

  it("keeps a closed Portal outlined over the same solid wall coverage", () => {
    const portal = {
      id: "test_portal",
      center: { x: 5, z: 1 },
      widthM: 2,
      bottomM: 0.5,
      topM: 2.5,
      open: false,
    };
    const solid = projectWall(wall, DEFAULT_VIEWPORT_CAMERA);
    const closed = projectWall({ ...wall, portals: [portal] }, DEFAULT_VIEWPORT_CAMERA);

    expect(closed.panels).toHaveLength(4);
    expect(closed.panels).toEqual(solid.panels);
    expect(closed.portalOutlines).toHaveLength(1);
    expect(closed.portalOutlines[0]).toMatchObject({
      portal,
      center: projectViewportPoint({ x: 5, y: 1.5, z: 1 }, DEFAULT_VIEWPORT_CAMERA),
    });
  });

  it("leaves an open Portal aperture uncovered while preserving its jambs and lintels", () => {
    const { panels, portalOutlines } = projectWall({
      ...wall,
      portals: [{
        id: "test_portal",
        center: { x: 5, z: 1 },
        widthM: 2,
        bottomM: 0.5,
        topM: 2.5,
        open: true,
      }],
    }, DEFAULT_VIEWPORT_CAMERA);
    const apertureCenter = projectViewportPoint({ x: 5, y: 1.5, z: 1 }, DEFAULT_VIEWPORT_CAMERA);
    const jamb = projectViewportPoint({ x: 2, y: 1.5, z: 1 }, DEFAULT_VIEWPORT_CAMERA);
    const lintel = projectViewportPoint({ x: 5, y: 2.8, z: 1 }, DEFAULT_VIEWPORT_CAMERA);

    expect(panels).toHaveLength(10);
    expect(new Set(panels.map(({ points }) => JSON.stringify(points))).size).toBe(10);
    expect(panels.some(({ points }) => contains(points, apertureCenter))).toBe(false);
    expect(panels.some(({ points }) => contains(points, jamb))).toBe(true);
    expect(panels.some(({ points }) => contains(points, lintel))).toBe(true);
    expect(panels.reduce((sum, panel) => sum + area(panel.points), 0)).toBeCloseTo(expectedProjectedArea(2 * 2), 7);
    expect(portalOutlines).toHaveLength(1);
    expect(portalOutlines[0]!.center).toEqual(apertureCenter);
  });
});
