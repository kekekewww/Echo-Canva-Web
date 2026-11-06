import type { Vec3 } from "@/acoustics/hybrid3d/geometry";
import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import type { SceneSpec } from "@/domain/scene/types";
import { createSceneDocumentV2 } from "@/domain/scene-document/serialize";
import type { SceneDocumentV2 } from "@/domain/scene-document/types";

import type { PatchSpec, VisibilityQuery } from "../ts-serial-adapter";
import type { CorpusCaseDefinition } from "../types";
import { cloneScene, sceneCounts } from "./classic";

const HANDWRITTEN_REF = "src/domain/presets/concrete-partition.ts";
const DEGENERATE = "degenerate";

function handwritten(notes: string, refs: string[] = [HANDWRITTEN_REF]): CorpusCaseDefinition["source"] {
  return { type: "handwritten", refs, notes };
}

function classicCase(id: string, tags: string[], notes: string, scene: SceneSpec): CorpusCaseDefinition {
  return {
    id,
    mode: "classic-2d5d",
    kind: "classic-frame",
    expectedOutcome: "ok",
    tags: [DEGENERATE, ...tags],
    scenario: null,
    source: handwritten(notes),
    seed: null,
    counts: sceneCounts(scene),
    input: { scene },
  };
}

/** Concrete Partition with a distinct revision. Listener (3, 4); radio (9, 4); rain (10, 1.5); door at (6, 4). */
function partitionScene(revision: number): SceneSpec {
  return cloneScene(CONCRETE_PARTITION_PRESET, revision);
}

function classicCases(): CorpusCaseDefinition[] {
  const onListener = partitionScene(200);
  onListener.sources[0]!.position = { ...onListener.listener.position };

  const collinear = partitionScene(201);
  collinear.walls.push({
    id: "collinear_wall",
    a: { x: 4, y: 4 },
    b: { x: 5, y: 4 },
    thicknessM: 0.2,
    materialId: "concrete_hard",
    kind: "partition",
  });

  const onEndpoint = partitionScene(202);
  onEndpoint.walls.push({
    id: "stub_wall",
    a: { ...onEndpoint.listener.position },
    b: { x: 3, y: 6 },
    thicknessM: 0.2,
    materialId: "concrete_hard",
    kind: "partition",
  });

  // The door is 1 m wide, so its edges sit at y = 3.5 and 4.5. The route from (3, 3) to (9, 4) crosses x = 6 at y = 3.5.
  const grazing = partitionScene(203);
  grazing.portals[0]!.widthM = 1;
  grazing.listener.position = { x: 3, y: 3 };

  // MIN_WALL_LENGTH_M is 0.1. The pair (5, 0) to (5, 0.1) has a hypot of exactly 0.1.
  const minWall = partitionScene(204);
  minWall.walls.push({
    id: "min_wall",
    a: { x: 5, y: 0 },
    b: { x: 5, y: 0.1 },
    thicknessM: 0.2,
    materialId: "concrete_hard",
    kind: "partition",
  });

  const noReflections = partitionScene(205);
  noReflections.settings.maxEarlyReflections = 0;

  return [
    classicCase("DC01_SOURCE_ON_LISTENER", ["coincident"], "Radio placed exactly on the listener at (3, 4).", onListener),
    classicCase(
      "DC02_ROUTE_COLLINEAR_WITH_WALL",
      ["collinear"],
      "A wall from (4, 4) to (5, 4) lies on the direct line from the listener (3, 4) to the radio (9, 4).",
      collinear,
    ),
    classicCase(
      "DC03_LISTENER_ON_WALL_ENDPOINT",
      ["endpoint"],
      "A stub wall starts exactly at the listener position (3, 4).",
      onEndpoint,
    ),
    classicCase(
      "DC04_ROUTE_GRAZES_PORTAL_EDGE",
      ["portal-edge", "grazing"],
      "Door narrowed to 1 m; the route from (3, 3) to the radio at (9, 4) crosses the partition at y = 3.5, the door edge.",
      grazing,
    ),
    classicCase(
      "DC05_WALL_EXACTLY_MIN_LENGTH",
      ["min-length"],
      "A wall of length exactly 0.1 m, the validator minimum.",
      minWall,
    ),
    classicCase("DC06_REFLECTIONS_LIMIT_ZERO", ["reflection-cap"], "maxEarlyReflections is 0.", noReflections),
  ];
}

function hybridDocument(
  scene: SceneSpec,
  listenerHeightM: number,
  sourceHeightsM: Record<string, number>,
): SceneDocumentV2 {
  return createSceneDocumentV2(scene, {
    spatial3d: {
      coordinateSystem: "x-right-y-up-z-forward",
      floorElevationM: 0,
      listenerHeightM,
      sourceHeightsM,
    },
  });
}

function hybridCase(
  id: string,
  tags: string[],
  notes: string,
  document: SceneDocumentV2,
  expectedOutcome: CorpusCaseDefinition["expectedOutcome"] = "ok",
): CorpusCaseDefinition {
  return {
    id,
    mode: "hybrid-3d",
    kind: "hybrid-frame",
    expectedOutcome,
    tags: [DEGENERATE, ...tags],
    scenario: null,
    source: handwritten(notes),
    seed: null,
    counts: sceneCounts(document.baseScene, 0),
    input: { document },
  };
}

function hybridCases(): CorpusCaseDefinition[] {
  const coincident = partitionScene(210);
  coincident.sources[0]!.position = { ...coincident.listener.position };

  const above = partitionScene(211);
  above.sources[0]!.position = { ...above.listener.position };

  // Radio exactly behind the listener (direction x = +0, z < 0, azimuth +180); rain a nanometre to the left (azimuth near -180).
  const behind = partitionScene(212);
  behind.sources[0]!.position = { x: 3, y: 2 };
  behind.sources[1]!.position = { x: 2.999999999, y: 2 };

  // The back face of the partition is the plane x = 6.1; the radio sits on it.
  const onPlane = partitionScene(213);
  onPlane.sources[0]!.position = { x: 6.1, y: 6.5 };

  // Listener at 1.5 m, radio at 2.7 m: the route crosses the partition at x = 6, y = 4, z = 2.1, the top edge of the 2.1 m door.
  const grazing = partitionScene(214);

  return [
    hybridCase(
      "DH01_SOURCE_ON_LISTENER",
      ["coincident", "expected-error"],
      "Radio at the listener plan position and the same 1.5 m height.",
      hybridDocument(coincident, 1.5, { radio: 1.5, rain: 1.5 }),
      "error",
    ),
    hybridCase(
      "DH02_SOURCE_DIRECTLY_ABOVE",
      ["elevation", "asin"],
      "Radio directly above the listener (same plan position, 1.5 m higher), so the direction is exactly vertical.",
      hybridDocument(above, 1, { radio: 2.5, rain: 1.5 }),
    ),
    hybridCase(
      "DH03_AZIMUTH_WRAP_180",
      ["azimuth", "branch-cut"],
      "Radio exactly behind the listener and rain 1e-9 m to its left, on either side of the atan2 branch cut.",
      hybridDocument(behind, 1.5, { radio: 1.5, rain: 1.5 }),
    ),
    hybridCase(
      "DH04_SOURCE_ON_PATCH_PLANE",
      ["patch-plane", "coplanar"],
      "Radio on the plane of the partition back face at x = 6.1.",
      hybridDocument(onPlane, 1.5, { radio: 1.5, rain: 1.5 }),
    ),
    hybridCase(
      "DH05_ROUTE_GRAZES_PORTAL_EDGE",
      ["portal-edge", "grazing"],
      "The route to the radio crosses the door plane at exactly the 2.1 m door top.",
      hybridDocument(grazing, 1.5, { radio: 2.7, rain: 1.5 }),
    ),
  ];
}

function validationCase(id: string, notes: string, json: string): CorpusCaseDefinition {
  return {
    id,
    mode: "classic-2d5d",
    kind: "scene-validation",
    expectedOutcome: "ok",
    tags: [DEGENERATE, "validation"],
    scenario: null,
    source: handwritten(notes, [HANDWRITTEN_REF, "src/domain/scene/validate.ts"]),
    seed: null,
    counts: null,
    input: { target: "scene", json },
  };
}

function sceneJson(scene: SceneSpec): string {
  return JSON.stringify(scene);
}

function validationCases(): CorpusCaseDefinition[] {
  const wall = (id: string, a: { x: number; y: number }, b: { x: number; y: number }) => ({
    id,
    a,
    b,
    thicknessM: 0.2,
    materialId: "concrete_hard",
    kind: "partition" as const,
  });

  const zeroLength = partitionScene(220);
  zeroLength.walls.push(wall("zero_wall", { x: 2, y: 2 }, { x: 2, y: 2 }));

  const belowMin = partitionScene(221);
  belowMin.walls.push(wall("short_wall", { x: 2, y: 2 }, { x: 2, y: 2.05 }));

  // JSON cannot write a non-finite number, so the coordinate is a placeholder replaced by raw 1e999 text.
  const nonFinite = partitionScene(222);
  nonFinite.walls.push(wall("far_wall", { x: 2, y: 2 }, { x: 424242.5, y: 2 }));

  const duplicate = partitionScene(223);
  duplicate.walls.push(wall("partition_center", { x: 2, y: 6 }, { x: 4, y: 6 }));
  duplicate.sources[1]!.id = "radio";

  const outside = partitionScene(224);
  outside.sources[0]!.position = { x: 20, y: 4 };

  const huge = partitionScene(225);
  huge.room.outerPolygon = [
    { x: 0, y: 0 },
    { x: 60, y: 0 },
    { x: 60, y: 8 },
    { x: 0, y: 8 },
  ];

  const unknownMaterial = partitionScene(226);
  unknownMaterial.walls[4]!.materialId = "unobtainium";

  const wideDoor = partitionScene(227);
  wideDoor.walls.push(wall("short_partition", { x: 2, y: 6 }, { x: 4, y: 6 }));
  wideDoor.portals.push({
    id: "wide_door",
    wallId: "short_partition",
    center: { x: 3, y: 6 },
    widthM: 3,
    heightM: 2.1,
    open: true,
    lossDb: 3,
  });

  return [
    validationCase("DV01_ZERO_LENGTH_WALL", "A wall whose endpoints coincide.", sceneJson(zeroLength)),
    validationCase("DV02_WALL_BELOW_MIN", "A 0.05 m wall, half the 0.1 m minimum.", sceneJson(belowMin)),
    validationCase(
      "DV03_NON_FINITE_COORDINATE",
      "A wall endpoint written as 1e999 in the raw text, which JSON.parse reads as Infinity.",
      sceneJson(nonFinite).replace("424242.5", "1e999"),
    ),
    validationCase("DV04_DUPLICATE_IDS", "A second wall named partition_center and a second source named radio.", sceneJson(duplicate)),
    validationCase("DV05_SOURCE_OUTSIDE_ROOM", "Radio at (20, 4), outside the 12 by 8 m room.", sceneJson(outside)),
    validationCase("DV06_ROOM_ABOVE_50M", "A 60 by 8 m room, above the 50 m dimension limit.", sceneJson(huge)),
    validationCase("DV07_UNKNOWN_MATERIAL", "The partition uses the material id unobtainium.", sceneJson(unknownMaterial)),
    validationCase("DV08_PORTAL_WIDER_THAN_WALL", "A 3 m portal on a 2 m wall.", sceneJson(wideDoor)),
  ];
}

function patchCase(
  id: string,
  tags: string[],
  notes: string,
  input: PatchSpec,
  expectedOutcome: CorpusCaseDefinition["expectedOutcome"] = "ok",
): CorpusCaseDefinition {
  return {
    id,
    mode: "hybrid-3d",
    kind: "hybrid-patch",
    expectedOutcome,
    tags: [DEGENERATE, "patch", ...tags],
    scenario: null,
    source: handwritten(notes, ["src/acoustics/hybrid3d/geometry.ts"]),
    seed: null,
    counts: null,
    input,
  };
}

function patchSpec(vertices: Vec3[]): PatchSpec {
  return { id: "degenerate-patch", kind: "wall", materialId: "concrete_hard", vertices };
}

function patchCases(): CorpusCaseDefinition[] {
  return [
    patchCase("DK01_PATCH_TOO_FEW_VERTICES", ["vertex-count"], "Two vertices.", patchSpec([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ]), "error"),
    patchCase("DK02_PATCH_COLLINEAR", ["collinear"], "Three vertices on one line.", patchSpec([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
    ]), "error"),
    patchCase("DK03_PATCH_NON_PLANAR", ["non-planar"], "A quad whose fourth vertex lies 0.5 m off the plane of the first three.", patchSpec([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 1, z: 0.5 },
    ])),
    patchCase("DK04_PATCH_DUPLICATE_VERTICES", ["duplicate-vertices"], "A quad whose fourth vertex repeats the second.", patchSpec([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 0, z: 0 },
    ])),
  ];
}

function segmentsOnPatchCase(): CorpusCaseDefinition {
  // One wall patch in the plane x = 1, spanning y 0..3 and z -2..2.
  const wall: PatchSpec = {
    id: "plane-wall:front",
    kind: "wall",
    materialId: "concrete_hard",
    vertices: [
      { x: 1, y: 0, z: -2 }, { x: 1, y: 3, z: -2 }, { x: 1, y: 3, z: 2 }, { x: 1, y: 0, z: 2 },
    ],
    options: { wallId: "plane-wall", openings: [] },
  };
  const queries: VisibilityQuery[] = [
    // Coplanar: lies inside the patch plane.
    { start: { x: 1, y: 1, z: -1 }, end: { x: 1, y: 2, z: 1 } },
    // Along an edge: runs along the bottom edge of the patch.
    { start: { x: 1, y: 0, z: -3 }, end: { x: 1, y: 0, z: 3 } },
    // Ends at a vertex.
    { start: { x: 0, y: 0, z: -2 }, end: { x: 1, y: 0, z: -2 } },
    { start: { x: 0, y: 3, z: 2 }, end: { x: 2, y: 3, z: 2 } },
    // Zero-length: one on the patch, one clear of it.
    { start: { x: 1, y: 1, z: 0 }, end: { x: 1, y: 1, z: 0 } },
    { start: { x: 0, y: 1, z: 0 }, end: { x: 0, y: 1, z: 0 } },
    // Parallel to the patch plane, off it.
    { start: { x: 0, y: 1, z: -1 }, end: { x: 0, y: 2, z: 1 } },
    // Crosses the plane at an interior point, for contrast.
    { start: { x: 0, y: 1, z: 0 }, end: { x: 2, y: 1, z: 0 } },
  ];
  return {
    id: "DK05_SEGMENTS_ON_PATCH",
    mode: "hybrid-3d",
    kind: "hybrid-visibility",
    expectedOutcome: "ok",
    tags: [DEGENERATE, "coplanar", "along-edge", "vertex-end", "zero-length", "parallel"],
    scenario: null,
    source: handwritten(
      "One wall patch in the plane x = 1; coplanar, along-edge, vertex-ending, zero-length and parallel segments, plus one crossing segment.",
      ["src/acoustics/hybrid3d/geometry.ts", "src/acoustics/hybrid3d/bvh.ts"],
    ),
    seed: null,
    counts: null,
    input: { patches: [wall], queries },
  };
}

export function degenerateCaseDefinitions(): CorpusCaseDefinition[] {
  return [
    ...classicCases(),
    ...hybridCases(),
    ...validationCases(),
    ...patchCases(),
    segmentsOnPatchCase(),
  ];
}
