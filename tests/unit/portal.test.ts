import { describe, expect, it } from "vitest";

import { edgeCost, findBestPortalRoute, portalLowpassHz } from "@/acoustics/portal";
import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import type { SceneSpec } from "@/domain/scene/types";
import { validateScene } from "@/domain/scene/validate";

const source = { x: 9, y: 1.5 };
const listener = { x: 3, y: 1.5 };

const openPortalScene = {
  ...CONCRETE_PARTITION_PRESET,
  sources: [{ ...CONCRETE_PARTITION_PRESET.sources[0]!, position: source }],
  listener: { ...CONCRETE_PARTITION_PRESET.listener, position: listener },
};

const serialPortalScene = {
  ...openPortalScene,
  walls: [
    {
      ...CONCRETE_PARTITION_PRESET.walls[4]!,
      id: "first_partition",
      a: { x: 7, y: 0 },
      b: { x: 7, y: 8 },
    },
    {
      ...CONCRETE_PARTITION_PRESET.walls[4]!,
      id: "second_partition",
      a: { x: 5, y: 0 },
      b: { x: 5, y: 8 },
    },
  ],
  portals: [
    {
      ...CONCRETE_PARTITION_PRESET.portals[0]!,
      id: "first_door",
      wallId: "first_partition",
      center: { x: 7, y: 4 },
      lossDb: 3,
    },
    {
      ...CONCRETE_PARTITION_PRESET.portals[0]!,
      id: "second_door",
      wallId: "second_partition",
      center: { x: 5, y: 4 },
      lossDb: 4,
    },
  ],
  sources: [{ ...CONCRETE_PARTITION_PRESET.sources[0]!, position: { x: 9, y: 4 } }],
  listener: { ...CONCRETE_PARTITION_PRESET.listener, position: { x: 1, y: 4 } },
};

/*
 * Mirror-symmetric two-partition fixture for second-portal tie-breaking.
 * Plan coordinates are metres (x, y) in the 12 m x 8 m preset room; turns are radians.
 *
 *   y=0  +---------------- boundary_north -----------------+
 *        |               |               |                |
 *   y=2  |   west_door_b o               |                |
 *        |               |               |                |
 *   y=4  |  L(2,4)       |   east_door   o     S(10,4)    |
 *        |               |               |                |
 *   y=6  |   west_door_a o               |                |
 *        |               |               |                |
 *   y=8  +---------------- boundary_south -----------------+
 *            x=4 west_partition   x=8 east_partition
 *
 * The only east-to-west gap is east_door (8, 4); the west partition has two doors
 * mirrored about y = 4. Routes S -> east_door -> west_door_{a,b} -> L have identical
 * lengths, losses and turns, so the cost tie is exact and is broken at the SECOND
 * portal ID (west_door_a < west_door_b), unlike the single-portal tie below.
 * Leg lengths: 2 m, sqrt(20) m, sqrt(8) m. Turns: atan(0.5) at east_door and
 * pi/4 + atan(0.5) at the west door. Portal losses: 3 dB (east), 2 dB (each west door).
 */
const tieSource = { x: 10, y: 4 };
const tieListener = { x: 2, y: 4 };
const partitionTemplate = CONCRETE_PARTITION_PRESET.walls[4]!;
const portalTemplate = CONCRETE_PARTITION_PRESET.portals[0]!;
const secondPortalTieScene: SceneSpec = {
  ...CONCRETE_PARTITION_PRESET,
  walls: [
    ...CONCRETE_PARTITION_PRESET.walls.slice(0, 4),
    { ...partitionTemplate, id: "east_partition", a: { x: 8, y: 0 }, b: { x: 8, y: 8 } },
    { ...partitionTemplate, id: "west_partition", a: { x: 4, y: 0 }, b: { x: 4, y: 8 } },
  ],
  portals: [
    // Deliberately listed against lexical order: the tie loser comes first.
    { ...portalTemplate, id: "west_door_b", wallId: "west_partition", center: { x: 4, y: 2 }, lossDb: 2 },
    { ...portalTemplate, id: "east_door", wallId: "east_partition", center: { x: 8, y: 4 }, lossDb: 3 },
    { ...portalTemplate, id: "west_door_a", wallId: "west_partition", center: { x: 4, y: 6 }, lossDb: 2 },
  ],
  sources: [{ ...CONCRETE_PARTITION_PRESET.sources[0]!, position: tieSource }],
  listener: { ...CONCRETE_PARTITION_PRESET.listener, position: tieListener },
};
// Same IDs and geometry; wall and portal input order reversed.
const reorderedSecondPortalTieScene: SceneSpec = {
  ...secondPortalTieScene,
  walls: [...secondPortalTieScene.walls].reverse(),
  portals: [...secondPortalTieScene.portals].reverse(),
};
// Expected cost from metric legs, next-node portal loss (dB) and turn at the current node.
const expectedTieCost =
  edgeCost(2, 3, 0) +
  edgeCost(Math.sqrt(20), 2, Math.atan(0.5)) +
  edgeCost(Math.sqrt(8), 0, Math.PI / 4 + Math.atan(0.5));
// Absolute tolerance for summed floating-point cost (cost units) and path length (m).
const TIE_TOLERANCE = 1e-9;

function closePortal(scene: SceneSpec, portalId: string): SceneSpec {
  return {
    ...scene,
    portals: scene.portals.map((portal) => (portal.id === portalId ? { ...portal, open: false } : portal)),
  };
}

describe("portal routing", () => {
  it("routes a blocked source through the one visible open portal", () => {
    const route = findBestPortalRoute(source, listener, openPortalScene);

    expect(route?.portalIds).toEqual(["partition_door"]);
    expect(route?.polyline).toEqual([source, { x: 6, y: 4 }, listener]);
    expect(route?.virtualPosition).toEqual({ x: 6, y: 4 });
  });

  it("returns null when that portal is closed", () => {
    const closedPortalScene = {
      ...openPortalScene,
      portals: openPortalScene.portals.map((portal) => ({ ...portal, open: false })),
    };

    expect(findBestPortalRoute(source, listener, closedPortalScene)).toBeNull();
  });

  it("chooses the lowest-cost visible route deterministically when two portals are available", () => {
    const twoPortalScene = {
      ...openPortalScene,
      portals: [
        {
          ...openPortalScene.portals[0]!,
          id: "near_door",
          center: { x: 6, y: 2 },
        },
        {
          ...openPortalScene.portals[0]!,
          id: "far_door",
          center: { x: 6, y: 6 },
        },
      ],
    };

    expect(findBestPortalRoute(source, listener, twoPortalScene)?.portalIds).toEqual([
      "near_door",
    ]);
  });

  it("breaks exact equal-cost route ties by lexical portal-ID sequence", () => {
    const tiedPortalScene = {
      ...openPortalScene,
      sources: [{ ...openPortalScene.sources[0]!, position: { x: 9, y: 4 } }],
      listener: { ...openPortalScene.listener, position: { x: 3, y: 4 } },
      portals: [
        { ...openPortalScene.portals[0]!, id: "beta_door", center: { x: 6, y: 3 } },
        { ...openPortalScene.portals[0]!, id: "alpha_door", center: { x: 6, y: 5 } },
      ],
    };

    expect(findBestPortalRoute({ x: 9, y: 4 }, { x: 3, y: 4 }, tiedPortalScene)?.portalIds).toEqual([
      "alpha_door",
    ]);
  });

  it("breaks an exact second-portal tie identically for reordered walls and portals", () => {
    for (const scene of [secondPortalTieScene, reorderedSecondPortalTieScene]) {
      expect(validateScene(scene).ok).toBe(true);

      const route = findBestPortalRoute(tieSource, tieListener, scene);

      expect(route).not.toBeNull();
      expect(route!.portalIds).toEqual(["east_door", "west_door_a"]);
      expect(route!.polyline).toEqual([tieSource, { x: 8, y: 4 }, { x: 4, y: 6 }, tieListener]);
      expect(route!.virtualPosition).toEqual({ x: 4, y: 6 });
      expect(route!.dryGainDb).toBe(-5);
      expect(route!.lowpassHz).toBe(portalLowpassHz(2));
      expect(
        Math.abs(route!.effectiveDistanceM - (2 + Math.sqrt(20) + Math.sqrt(8))),
      ).toBeLessThanOrEqual(TIE_TOLERANCE);
      expect(Math.abs(route!.cost - expectedTieCost)).toBeLessThanOrEqual(TIE_TOLERANCE);
    }
  });

  it("falls back to the mirrored tied route, then null, as the chosen portals close", () => {
    for (const scene of [secondPortalTieScene, reorderedSecondPortalTieScene]) {
      const withoutWinner = closePortal(scene, "west_door_a");

      expect(validateScene(withoutWinner).ok).toBe(true);

      const fallback = findBestPortalRoute(tieSource, tieListener, withoutWinner);

      expect(fallback).not.toBeNull();
      expect(fallback!.portalIds).toEqual(["east_door", "west_door_b"]);
      expect(fallback!.polyline).toEqual([tieSource, { x: 8, y: 4 }, { x: 4, y: 2 }, tieListener]);
      expect(fallback!.virtualPosition).toEqual({ x: 4, y: 2 });
      expect(Math.abs(fallback!.cost - expectedTieCost)).toBeLessThanOrEqual(TIE_TOLERANCE);
      // The mirrored routes tie bit-for-bit, so only the portal-ID tie-breaker separated them.
      expect(fallback!.cost).toBe(findBestPortalRoute(tieSource, tieListener, scene)!.cost);

      // east_door is the only gap in east_partition, so closing it leaves no portal route.
      expect(findBestPortalRoute(tieSource, tieListener, closePortal(withoutWinner, "east_door"))).toBeNull();
    }
  });

  it("represents an intermediate open portal as a route node instead of waiving it", () => {
    const route = findBestPortalRoute(
      serialPortalScene.sources[0]!.position,
      serialPortalScene.listener.position,
      serialPortalScene,
    );

    expect(route?.portalIds).toEqual(["first_door", "second_door"]);
  });

  it("waives only the selected portal host wall when another closed wall shares the endpoint", () => {
    const sceneWithCoincidentClosedWall = {
      ...openPortalScene,
      walls: [
        ...openPortalScene.walls,
        { ...openPortalScene.walls[4]!, id: "closed_coincident_partition" },
      ],
    };

    expect(findBestPortalRoute(source, listener, sceneWithCoincidentClosedWall)).toBeNull();
  });

  it("blocks a listener-only wall endpoint instead of treating it as a portal gap", () => {
    const listenerOnBoundaryScene = {
      ...openPortalScene,
      listener: { ...openPortalScene.listener, position: { x: 0, y: 4 } },
    };

    expect(findBestPortalRoute(source, { x: 0, y: 4 }, listenerOnBoundaryScene)).toBeNull();
  });

  it("rejects a Portal leg that overlaps a collinear obstacle segment", () => {
    const sceneWithCollinearObstacle = {
      ...openPortalScene,
      walls: [
        ...openPortalScene.walls,
        {
          ...openPortalScene.walls[4]!,
          id: "collinear_obstacle",
          a: { x: 7, y: 19 / 6 },
          b: { x: 8, y: 7 / 3 },
        },
      ],
    };

    expect(findBestPortalRoute(source, listener, sceneWithCollinearObstacle)).toBeNull();
  });

  it("rejects a Portal leg that crosses a closed basic-shape footprint edge", () => {
    const sceneWithFootprintEdge = {
      ...openPortalScene,
      walls: [
        ...openPortalScene.walls,
        {
          ...openPortalScene.walls[4]!,
          id: "primitive:box:edge:0",
          a: { x: 4.5, y: 2.5 },
          b: { x: 4.5, y: 3 },
        },
      ],
    };

    expect(findBestPortalRoute(source, listener, sceneWithFootprintEdge)).toBeNull();
  });

  it("uses the listener-facing final portal rather than the Euclidean-nearest portal", () => {
    const listenerFacingRouteScene = {
      ...serialPortalScene,
      listener: { ...serialPortalScene.listener, position: { x: 1, y: 1 } },
      portals: [
        serialPortalScene.portals[0]!,
        { ...serialPortalScene.portals[1]!, center: { x: 5, y: 7 } },
      ],
    };
    const route = findBestPortalRoute(
      listenerFacingRouteScene.sources[0]!.position,
      listenerFacingRouteScene.listener.position,
      listenerFacingRouteScene,
    );

    expect(route).toMatchObject({
      portalIds: ["first_door", "second_door"],
      dryGainDb: -7,
      lowpassHz: 17_000,
      virtualPosition: { x: 5, y: 7 },
    });
    expect(portalLowpassHz(20)).toBe(1_200);
  });
});
