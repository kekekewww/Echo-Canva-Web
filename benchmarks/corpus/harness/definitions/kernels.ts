import { buildPatchBvh } from "@/acoustics/hybrid3d/bvh";
import { makePatch3, type Vec3 } from "@/acoustics/hybrid3d/geometry";

import { lcg32 } from "../prng";
import type { PatchSpec, VisibilityQuery } from "../ts-serial-adapter";
import type { CorpusCaseDefinition } from "../types";

const VISIBILITY_TEST = "tests/unit/hybrid3d-visibility.test.ts";
const SECOND_ORDER_TEST = "tests/unit/hybrid3d-second-order.test.ts";

/** Copy of the `partition` fixture builder in the visibility test. */
function partition(id: string, x: number, opening = false): PatchSpec {
  return {
    id: `${id}:front`,
    kind: "wall",
    materialId: "concrete_hard",
    vertices: [
      { x, y: 0, z: -2 }, { x, y: 3, z: -2 }, { x, y: 3, z: 2 }, { x, y: 0, z: 2 },
    ],
    options: {
      wallId: id,
      openings: opening ? [{
        id: "door", wallId: id, center: { x, y: 0, z: 0 }, along: { x: 0, y: 0, z: 1 },
        widthM: 1, floorElevationM: 0, heightM: 2,
      }] : [],
    },
  };
}

function toPatch(spec: PatchSpec) {
  return makePatch3(spec.id, spec.kind, spec.materialId, spec.vertices, spec.options);
}

function visibilityCase(
  id: string,
  tags: string[],
  notes: string,
  input: { patches: PatchSpec[]; queries: VisibilityQuery[] },
  seed: CorpusCaseDefinition["seed"] = null,
): CorpusCaseDefinition {
  return {
    id,
    mode: "hybrid-3d",
    kind: "hybrid-visibility",
    tags,
    scenario: null,
    source: { type: "test-fixture", refs: [VISIBILITY_TEST], notes },
    seed,
    counts: null,
    input,
  };
}

function apertureCase(): CorpusCaseDefinition {
  const segments: readonly (readonly [Vec3, Vec3])[] = [
    [{ x: 0, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }],
    [{ x: 0, y: 2.5, z: 0 }, { x: 2, y: 2.5, z: 0 }],
    [{ x: 0, y: 1, z: 2 }, { x: 2, y: 1, z: 2 }],
    [{ x: 0, y: 1, z: 2.1 }, { x: 2, y: 1, z: 2.1 }],
    [{ x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 }],
    [{ x: 0, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }],
    [{ x: 1, y: 1, z: 1 }, { x: 1, y: 2, z: 1 }],
  ];
  return visibilityCase(
    "V001_PORTAL_APERTURE",
    ["portal-aperture", "finite-edge", "endpoint"],
    "Seven segments through one partition at x=1 with a door opening.",
    { patches: [partition("door-wall", 1, true)], queries: segments.map(([start, end]) => ({ start, end })) },
  );
}

function reflectorAllowanceCase(): CorpusCaseDefinition {
  const patches = Array.from({ length: 12 }, (_, i) => partition(`wall-${i}`, i + 1));
  // The test takes the first 11 wall ids in BVH order, so this does too.
  const bvh = buildPatchBvh(patches.map(toPatch));
  const allowed = bvh.patches.slice(0, 11).map((patch) => patch.wallId!);
  const start = { x: 0, y: 1, z: 1 };
  const end = { x: 14, y: 1, z: 1 };
  return visibilityCase(
    "V002_REFLECTOR_ALLOWANCE",
    ["reflector-allowance", "later-wall-blocks"],
    "Twelve partitions. The first query allows the first 11 wall ids in BVH order; the second appends the patch id wall-11:front, which is not a wall id.",
    {
      patches,
      queries: [
        { start, end, allowedWallIds: allowed },
        { start, end, allowedWallIds: [...allowed, "wall-11:front"] },
      ],
    },
  );
}

function seededCase(): CorpusCaseDefinition {
  const patches = Array.from({ length: 32 }, (_, i) => partition(`wall-${i}`, i / 2, i % 3 === 0));
  const seedValue = 20261013;
  const random = lcg32(seedValue);
  const point = (): Vec3 => ({ x: random() * 20 - 2, y: random() * 5 - 1, z: random() * 6 - 3 });
  const queries: VisibilityQuery[] = [];
  for (let i = 0; i < 2048; i++) {
    const start = point();
    const end = i % 7 === 0 ? start : i % 5 === 0 ? { ...point(), x: start.x } : point();
    queries.push({ start, end, allowedWallIds: ["wall-0", "wall-1", "wall-6"] });
  }
  return visibilityCase(
    "V003_SEEDED_2048",
    ["seeded", "zero-length", "parallel", "oblique"],
    "32 partitions and 2048 materialized queries; every 7th is zero-length and every 5th (not 7th) is parallel to the walls.",
    { patches, queries },
    { value: seedValue, algorithm: "lcg32-v1", consumers: "start and end points of the 2048 visibility queries" },
  );
}

function floorAndCeiling(): PatchSpec[] {
  return [
    {
      id: "floor", kind: "floor", materialId: "concrete_hard",
      vertices: [{ x: -4, y: 0, z: -4 }, { x: 8, y: 0, z: -4 }, { x: 8, y: 0, z: 4 }, { x: -4, y: 0, z: 4 }],
    },
    {
      id: "ceiling", kind: "ceiling", materialId: "concrete_hard",
      vertices: [{ x: -4, y: 3, z: -4 }, { x: -4, y: 3, z: 4 }, { x: 8, y: 3, z: 4 }, { x: 8, y: 3, z: -4 }],
    },
  ];
}

function mediumPruningFixture(): PatchSpec[] {
  const distant: PatchSpec[] = Array.from({ length: 30 }, (_, index) => {
    const x = 60 + index * 4;
    return {
      id: `distant-${index}`, kind: "wall", materialId: "concrete_hard",
      vertices: [{ x, y: 0, z: -1 }, { x, y: 0, z: 1 }, { x, y: 3, z: 1 }, { x, y: 3, z: -1 }],
    };
  });
  return [...floorAndCeiling(), ...distant];
}

function secondOrderCase(
  id: string,
  tags: string[],
  patches: PatchSpec[],
  options: Record<string, number>,
  notes: string,
): CorpusCaseDefinition {
  return {
    id,
    mode: "hybrid-3d",
    kind: "hybrid-second-order",
    tags,
    scenario: "S7",
    source: { type: "test-fixture", refs: [SECOND_ORDER_TEST], notes },
    seed: null,
    counts: null,
    input: {
      patches,
      source: { x: 1, y: 1, z: 0 },
      listener: { x: 4, y: 1, z: 0 },
      options,
    },
  };
}

export function kernelCaseDefinitions(): CorpusCaseDefinition[] {
  return [
    apertureCase(),
    reflectorAllowanceCase(),
    seededCase(),
    secondOrderCase(
      "SO001_FLOOR_CEILING",
      ["floor-ceiling", "analytic"],
      floorAndCeiling(),
      { maxPathLengthM: 20, minEstimatedGainDb: -80, maxCandidates: 8 },
      "Floor and ceiling fixture with retain-all pruning options.",
    ),
    secondOrderCase(
      "SO002_PRUNE_ALL",
      ["prune-all", "path-length"],
      floorAndCeiling(),
      { maxPathLengthM: 5, minEstimatedGainDb: -80 },
      "Floor and ceiling fixture with a 5 m path-length bound that prunes every pair.",
    ),
    secondOrderCase(
      "SO003_32_PATCH",
      ["pruning", "32-patch"],
      mediumPruningFixture(),
      { maxPathLengthM: 20, minEstimatedGainDb: -80, maxCandidates: 8 },
      "Floor, ceiling and 30 distant walls.",
    ),
    secondOrderCase(
      "SO004_REPRESENTATIVE_BUDGET",
      ["representative-budget"],
      mediumPruningFixture(),
      { maxPathLengthM: 200, minEstimatedGainDb: -120, maxCandidates: 6, maxRepresentativePatches: 8 },
      "Medium fixture with a representative-surface budget of 8 patches.",
    ),
  ];
}
