import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import type { SceneSpec } from "@/domain/scene/types";
import { createSceneDocumentV2 } from "@/domain/scene-document/serialize";
import type { SceneDocumentV2, Spatial3DExtension } from "@/domain/scene-document/types";
import type { AcousticPrimitive } from "@/domain/workspace/types";

import type { PatchSpec } from "../ts-serial-adapter";
import type { CorpusCaseDefinition } from "../types";
import { cloneScene, sceneCounts } from "./classic";

type Point = { x: number; y: number };
type WallKind = SceneSpec["walls"][number]["kind"];

const LIMIT = "limit";
const LOCALE = "locale";

function handwritten(notes: string, refs: string[]): CorpusCaseDefinition["source"] {
  return { type: "handwritten", refs, notes };
}

function wall(id: string, a: Point, b: Point, kind: WallKind = "boundary", thicknessM = 0.2) {
  return { id, a, b, thicknessM, materialId: "concrete_hard", kind };
}

/** Four boundary walls around the axis-aligned rectangle, in the order west, north, east, south. */
function rectangleWalls(x0: number, y0: number, x1: number, y1: number, ids: [string, string, string, string]) {
  return [
    wall(ids[0], { x: x0, y: y1 }, { x: x0, y: y0 }),
    wall(ids[1], { x: x0, y: y0 }, { x: x1, y: y0 }),
    wall(ids[2], { x: x1, y: y0 }, { x: x1, y: y1 }),
    wall(ids[3], { x: x1, y: y1 }, { x: x0, y: y1 }),
  ];
}

type SceneOptions = {
  revision: number;
  name: string;
  x1: number;
  y1: number;
  heightM: number;
  walls: ReturnType<typeof wall>[];
  source: Point;
  /** Further sources, each with the id and position given; same clip and gain as radio. */
  extraSources?: { id: string; position: Point }[];
  listener: Point;
  maxEarlyReflections?: number;
};

/** A rectangular room from (0, 0) to (x1, y1), one source called radio, no portals. Key order is fixed here, not sorted. */
function scene(options: SceneOptions): SceneSpec {
  return {
    schemaVersion: "1.0",
    revision: options.revision,
    units: "m",
    name: options.name,
    room: {
      outerPolygon: [
        { x: 0, y: 0 },
        { x: options.x1, y: 0 },
        { x: options.x1, y: options.y1 },
        { x: 0, y: options.y1 },
      ],
      heightM: options.heightM,
      floorMaterialId: "concrete_hard",
      ceilingMaterialId: "concrete_hard",
    },
    walls: options.walls,
    portals: [],
    sources: [
      { id: "radio", position: options.source },
      ...(options.extraSources ?? []),
    ].map(({ id, position }) => ({
      id,
      name: id === "radio" ? "Radio" : "Echo",
      clipId: "radio_loop",
      sourceType: "point" as const,
      position,
      gainDb: -3,
      loop: true,
    })),
    listener: { position: options.listener, headingDeg: 0 },
    settings: { acousticUpdateHz: 12, maxEarlyReflections: options.maxEarlyReflections ?? 6, hrtfEnabled: true },
  };
}

function classicLimitCase(
  id: string,
  tags: string[],
  notes: string,
  refs: string[],
  sceneSpec: SceneSpec,
): CorpusCaseDefinition {
  return {
    id,
    mode: "classic-2d5d",
    kind: "classic-frame",
    expectedOutcome: "ok",
    tags,
    scenario: null,
    source: handwritten(notes, refs),
    seed: null,
    counts: sceneCounts(sceneSpec),
    input: { scene: sceneSpec },
  };
}

function hybridDocument(
  sceneSpec: SceneSpec,
  listenerHeightM: number,
  sourceHeightsM: Record<string, number>,
  extra: Pick<Spatial3DExtension, "primitives" | "wallVerticalBoundsM"> = {},
): SceneDocumentV2 {
  return createSceneDocumentV2(sceneSpec, {
    spatial3d: {
      coordinateSystem: "x-right-y-up-z-forward",
      floorElevationM: 0,
      listenerHeightM,
      sourceHeightsM,
      ...extra,
    },
  });
}

function hybridLimitCase(
  id: string,
  tags: string[],
  notes: string,
  refs: string[],
  document: SceneDocumentV2,
): CorpusCaseDefinition {
  return {
    id,
    mode: "hybrid-3d",
    kind: "hybrid-frame",
    expectedOutcome: "ok",
    tags,
    scenario: null,
    source: handwritten(notes, refs),
    seed: null,
    counts: sceneCounts(document.baseScene, document.extensions.spatial3d?.primitives?.length ?? 0),
    input: { document },
  };
}

const ROOM_ACOUSTICS = "src/acoustics/room-acoustics.ts";
const IMAGE_SOURCE = "src/acoustics/image-source.ts";
const COMPUTE_FRAME = "src/acoustics/compute-frame.ts";
const REFLECTIONS = "src/acoustics/hybrid3d/reflections.ts";
const SECOND_ORDER = "src/acoustics/hybrid3d/second-order.ts";
const DIRECT = "src/acoustics/hybrid3d/direct.ts";
const VALIDATE = "src/domain/scene/validate.ts";
const RENDERING = "src/acoustics/hybrid3d/reflection-rendering.ts";

function classicClampCases(): CorpusCaseDefinition[] {
  // Area 1.5 x 1.5 = 2.25 m2; sqrt(2.25) / 343 * 1000 = 4.37 ms, below MIN_PRE_DELAY_MS = 5.
  const floor = scene({
    revision: 300,
    name: "Pre-delay floor",
    x1: 1.5,
    y1: 1.5,
    heightM: 2.5,
    walls: rectangleWalls(0, 0, 1.5, 1.5, ["floor_west", "floor_north", "floor_east", "floor_south"]),
    source: { x: 0.5, y: 0.75 },
    listener: { x: 1, y: 0.75 },
  });

  // Area 30 x 30 = 900 m2; sqrt(900) / 343 * 1000 = 87.5 ms, above MAX_PRE_DELAY_MS = 80.
  const ceiling = scene({
    revision: 301,
    name: "Pre-delay ceiling",
    x1: 30,
    y1: 30,
    heightM: 4,
    walls: rectangleWalls(0, 0, 30, 30, ["ceil_west", "ceil_north", "ceil_east", "ceil_south"]),
    source: { x: 12, y: 15 },
    listener: { x: 18, y: 15 },
  });

  // Listener and radio sit 3 m from the south-west corner of a 50 x 50 m room. The west and south walls give
  // excess delays of a few ms; the north and east walls would add 140 ms or more, past MAX_EARLY_DELAY_MS = 80.
  const delayCap = scene({
    revision: 302,
    name: "Early delay cap",
    x1: 50,
    y1: 50,
    heightM: 4,
    walls: rectangleWalls(0, 0, 50, 50, ["cap_west", "cap_north", "cap_east", "cap_south"]),
    source: { x: 3, y: 47 },
    listener: { x: 5, y: 47 },
  });

  // Walls only at x = 0 and x = 44 and a 0.6 m stop at x = 20, y 9.7 to 10.3, which blocks the direct line from (2, 5) to
  // (38, 15) at y = 10. The west-then-east path is 2 + 44 + 6 = 52 m long (excess 16 m, 46.6 ms, gain about -35.4 dB), so
  // only the 50 m limit in solveSecondOrderReflectionPair2D rejects it. The stop does not touch that path, which crosses
  // x = 20 at y of about 9.2.
  const secondOrderLimit = scene({
    revision: 303,
    name: "Second-order path limit",
    x1: 44,
    y1: 20,
    heightM: 3,
    walls: [
      wall("far_west", { x: 0, y: 20 }, { x: 0, y: 0 }),
      wall("far_east", { x: 44, y: 0 }, { x: 44, y: 20 }),
      wall("stop", { x: 20, y: 9.7 }, { x: 20, y: 10.3 }, "partition"),
    ],
    source: { x: 2, y: 5 },
    listener: { x: 38, y: 15 },
  });

  return [
    classicLimitCase(
      "CL01_PRE_DELAY_FLOOR",
      [LIMIT, "pre-delay"],
      "A 1.5 by 1.5 m room: sqrt(area) / 343 is 4.37 ms, so preDelayMs is raised to MIN_PRE_DELAY_MS (5 ms).",
      [ROOM_ACOUSTICS],
      floor,
    ),
    classicLimitCase(
      "CL02_PRE_DELAY_CEILING",
      [LIMIT, "pre-delay"],
      "A 30 by 30 m room: sqrt(area) / 343 is 87.5 ms, so preDelayMs is cut to MAX_PRE_DELAY_MS (80 ms).",
      [ROOM_ACOUSTICS],
      ceiling,
    ),
    classicLimitCase(
      "CL05_EARLY_DELAY_CAP",
      [LIMIT, "reflection-cap"],
      "Radio and listener 2 m apart in the south-west corner of a 50 by 50 m room. The north and east first-order candidates have an excess delay above MAX_EARLY_DELAY_MS (80 ms) and are rejected; the west and south ones are kept.",
      [IMAGE_SOURCE],
      delayCap,
    ),
    classicLimitCase(
      "CL06_SECOND_ORDER_PATH_LIMIT",
      [LIMIT, "second-order"],
      "Direct path blocked by a 0.6 m stop. The west-then-east second-order path is 52 m long with an excess delay and gain inside their limits, so only MAX_SECOND_ORDER_PATH_M (50 m) in image-source.ts rejects it. Not in the original brief; added because the constant of that name is the Classic one.",
      [IMAGE_SOURCE],
      secondOrderLimit,
    ),
  ];
}

const WOOD_BLOCK = (x: number, y: number, z: number, dy: number): AcousticPrimitive => ({
  id: "block",
  name: "Block",
  kind: "box",
  position: { x, y, z },
  dimensions: { x: 0.4, y: dy, z: 0.4 },
  rotationYDeg: 0,
  materialId: "wood_medium",
});

function hybridLimitCases(): CorpusCaseDefinition[] {
  // Radio (2.5, 12) at 5 m and listener (47.5, 4) at 4.5 m in a 50 by 20 by 6 m room, a 0.4 m block between them. Four
  // second-order paths are 50 m or shorter and are kept; two more valid ones are 50.5 m and are cut by the 50 m limit.
  const pathLimit = hybridDocument(
    scene({
      revision: 320,
      name: "Second-order path limit",
      x1: 50,
      y1: 20,
      heightM: 6,
      walls: rectangleWalls(0, 0, 50, 20, ["limit_west", "limit_north", "limit_east", "limit_south"]),
      source: { x: 2.5, y: 12 },
      listener: { x: 47.5, y: 4 },
    }),
    4.5,
    { radio: 5 },
    { primitives: [WOOD_BLOCK(25, 4.75, 8, 0.4)] },
  );

  // Radio (3, 3.5) and listener (7.5, 4.5) in a 10 by 8 by 3 m room with a block between them. Twelve second-order
  // paths are valid; the frame keeps the six shortest.
  const topK = hybridDocument(
    scene({
      revision: 321,
      name: "Second-order top K",
      x1: 10,
      y1: 8,
      heightM: 3,
      walls: rectangleWalls(0, 0, 10, 8, ["topk_west", "topk_north", "topk_east", "topk_south"]),
      source: { x: 3, y: 3.5 },
      listener: { x: 7.5, y: 4.5 },
    }),
    1.6,
    { radio: 1.2 },
    { primitives: [WOOD_BLOCK(5.25, 1.4, 4, 0.8)] },
  );

  // A 16 by 10 by 3 m room with the four boundary walls, a block, the floor and the ceiling, plus fourteen 0.5 m partition
  // stubs in two rows at y = 3 and y = 7: 26 physical surfaces, two more than the 24 the frame keeps. The cap drops the
  // west and east walls, which lie farthest from the listener by image distance.
  const stubs = [3, 7].flatMap((y, row) =>
    Array.from({ length: 7 }, (_, index) =>
      wall(`stub_${row * 7 + index + 1}`, { x: 2 + 2 * index, y }, { x: 2.5 + 2 * index, y }, "partition", 0.1),
    ),
  );
  const patchCap = hybridDocument(
    scene({
      revision: 322,
      name: "Representative patch cap",
      x1: 16,
      y1: 10,
      heightM: 3,
      walls: [...rectangleWalls(0, 0, 16, 10, ["cap_west", "cap_north", "cap_east", "cap_south"]), ...stubs],
      source: { x: 3, y: 5 },
      listener: { x: 13, y: 5 },
    }),
    1.5,
    { radio: 1.5 },
    { primitives: [WOOD_BLOCK(8, 1.5, 5, 1)] },
  );

  return [
    hybridLimitCase(
      "HL02_SECOND_ORDER_PATH_LIMIT",
      [LIMIT, "second-order"],
      "Direct path blocked. Two valid second-order paths of 50.5 m are cut by the 50 m path limit in findPrunedSecondOrderReflections3D (a literal 50; the constant of that name is in image-source.ts); four shorter ones are kept.",
      [SECOND_ORDER, DIRECT],
      pathLimit,
    ),
    hybridLimitCase(
      "HL03_SECOND_ORDER_TOP_K",
      [LIMIT, "second-order"],
      "Direct path blocked. Twelve valid second-order paths, of which the frame keeps six. The frame path passes maxCandidates 6 explicitly in direct.ts; DEFAULT_SECOND_ORDER_TOP_K applies only when a caller leaves it out.",
      [SECOND_ORDER, DIRECT],
      topK,
    ),
    hybridLimitCase(
      "HL04_REPRESENTATIVE_PATCH_CAP",
      [LIMIT, "second-order"],
      "Direct path blocked, 26 physical surfaces. The frame passes maxRepresentativePatches 24 in direct.ts, so the two farthest surfaces take no part in the second-order search (the 32 in second-order.ts limits only the exhaustive reference).",
      [SECOND_ORDER, DIRECT],
      patchCap,
    ),
  ];
}

function validationLimitCases(): CorpusCaseDefinition[] {
  // Every vertex is inside the +-50 m range zod accepts, so the schema passes and the 55 m width reaches the geometry check.
  const wide = cloneScene(CONCRETE_PARTITION_PRESET, 228);
  wide.name = "Room width above limit";
  wide.room.outerPolygon = [
    { x: -10, y: 0 },
    { x: 45, y: 0 },
    { x: 45, y: 8 },
    { x: -10, y: 8 },
  ];
  return [
    {
      id: "DV09_ROOM_WIDTH_ABOVE_LIMIT",
      mode: "classic-2d5d",
      kind: "scene-validation",
      expectedOutcome: "ok",
      tags: ["degenerate", "validation", LIMIT],
      scenario: null,
      source: handwritten(
        "A room from x = -10 to x = 45, 55 m wide. Every vertex is within the +-50 m schema range, so the scene passes zod and is rejected at the MAX_ROOM_DIMENSION_M check in validateGeometry.",
        [VALIDATE, "src/domain/scene/geometry-validation.ts", "src/domain/scene/schema.ts"],
      ),
      seed: null,
      counts: null,
      input: { target: "scene", json: JSON.stringify(wide) },
    },
  ];
}

const UNICODE_NAME = "Caf\u00E9 \u00DCber \u4E2D\u6587 \u{1D11E}";
/** U+1D11F shares its high surrogate (U+D834) with U+1D11E. */
const UNICODE_SIBLING_NAME = "Caf\u00E9 \u00DCber \u4E2D\u6587 \u{1D11F}";

function unicodeScene(name: string, revision: number): SceneSpec {
  return scene({
    revision,
    name,
    x1: 8,
    y1: 8,
    heightM: 3,
    walls: rectangleWalls(0, 0, 8, 8, ["bay_west", "bay_north", "bay_east", "bay_south"]),
    source: { x: 2.5, y: 3 },
    listener: { x: 5.5, y: 5 },
  });
}

function localeCases(): CorpusCaseDefinition[] {
  // Radio (3, 4) and listener (5, 4): the west and east walls give the same 8 m path and the north and south walls the
  // same longer path, so each pair ties exactly on gain. The ids mix case, hyphen, underscore and digits, and avoid letter
  // sequences that common collations tailor.
  const ids: [string, string, string, string] = ["edge-1", "Edge_b", "edge_1", "edge_a"];
  const classicTie = scene({
    revision: 310,
    name: "Mixed case tie",
    x1: 8,
    y1: 8,
    heightM: 3,
    walls: rectangleWalls(0, 0, 8, 8, ids),
    source: { x: 3, y: 4 },
    listener: { x: 5, y: 4 },
  });

  // The same room in Hybrid. Radio (1.5 m) is behind a block, which gives exact ties between second-order paths. Echo
  // (2.5 m, above the block) sees the listener, which gives an exact tie between the first-order north and south paths.
  const hybridTie = hybridDocument(
    scene({
      revision: 311,
      name: "Mixed case tie hybrid",
      x1: 8,
      y1: 8,
      heightM: 3,
      walls: rectangleWalls(0, 0, 8, 8, ids),
      source: { x: 3, y: 4 },
      extraSources: [{ id: "echo", position: { x: 3, y: 4 } }],
      listener: { x: 5, y: 4 },
    }),
    1.5,
    { radio: 1.5, echo: 2.5 },
    { primitives: [WOOD_BLOCK(4, 1.5, 4, 0.6)] },
  );

  const unicodeNote = "The scene name holds \u00E9, \u00DC, two CJK characters and U+1D11E (outside the BMP).";
  return [
    classicLimitCase(
      "LC01_MIXED_CASE_TIE_CLASSIC",
      [LOCALE, "tie-break"],
      "Two exact gain ties between walls whose ids differ in case, hyphen and underscore, so localeCompare and code-unit order disagree.",
      [COMPUTE_FRAME, IMAGE_SOURCE],
      classicTie,
    ),
    hybridLimitCase(
      "LC02_MIXED_CASE_TIE_HYBRID",
      [LOCALE, "tie-break"],
      "Exact ties between first-order paths (echo) and between second-order paths (radio) whose ids differ in case, hyphen and underscore. Sorted by localeCompare in reflections.ts, second-order.ts and reflection-rendering.ts.",
      [REFLECTIONS, SECOND_ORDER, RENDERING],
      hybridTie,
    ),
    classicLimitCase(
      "LC03_UNICODE_NAME_CLASSIC",
      [LOCALE, "unicode"],
      `${unicodeNote} Pins staticFingerprint, an FNV hash over for...of code points.`,
      [COMPUTE_FRAME],
      unicodeScene(UNICODE_NAME, 312),
    ),
    hybridLimitCase(
      "LC04_UNICODE_NAME_HYBRID",
      [LOCALE, "unicode"],
      `${unicodeNote} Pins staticGeometryHash and classicProjectionHash.`,
      ["src/acoustics/hybrid3d/compile.ts", "src/domain/scene-document/validate.ts"],
      hybridDocument(unicodeScene(UNICODE_NAME, 313), 1.5, { radio: 1.5 }),
    ),
    classicLimitCase(
      "LC05_NONBMP_SIBLING_CLASSIC",
      [LOCALE, "unicode", "collision"],
      "LC03 with U+1D11E replaced by U+1D11F, which has the same high surrogate. fnv1a hashes charCodeAt(0) of each code point, so both characters add the same value.",
      [COMPUTE_FRAME],
      unicodeScene(UNICODE_SIBLING_NAME, 312),
    ),
  ];
}

function boxPatch(id: string, vertices: PatchSpec["vertices"]): PatchSpec {
  return { id, kind: id === "floor" ? "floor" : id === "ceiling" ? "ceiling" : "wall", materialId: "concrete_hard", vertices };
}

/**
 * The frame path always passes maxCandidates 6 to the second-order search, so DEFAULT_SECOND_ORDER_TOP_K is reached only by a
 * caller that leaves it out, as the Hybrid second-order kernel input can. Six surfaces of a 6 by 3 by 4 m box, no blocker.
 */
function defaultTopKCase(): CorpusCaseDefinition {
  const patches = [
    boxPatch("floor", [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }, { x: 6, y: 0, z: 4 }, { x: 6, y: 0, z: 0 }]),
    boxPatch("ceiling", [{ x: 0, y: 3, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 6, y: 3, z: 4 }, { x: 0, y: 3, z: 4 }]),
    boxPatch("box-west", [{ x: 0, y: 0, z: 0 }, { x: 0, y: 3, z: 0 }, { x: 0, y: 3, z: 4 }, { x: 0, y: 0, z: 4 }]),
    boxPatch("box-east", [{ x: 6, y: 0, z: 0 }, { x: 6, y: 0, z: 4 }, { x: 6, y: 3, z: 4 }, { x: 6, y: 3, z: 0 }]),
    boxPatch("box-north", [{ x: 0, y: 0, z: 0 }, { x: 6, y: 0, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 0, y: 3, z: 0 }]),
    boxPatch("box-south", [{ x: 0, y: 0, z: 4 }, { x: 0, y: 3, z: 4 }, { x: 6, y: 3, z: 4 }, { x: 6, y: 0, z: 4 }]),
  ];
  return {
    id: "SO005_DEFAULT_TOP_K",
    mode: "hybrid-3d",
    kind: "hybrid-second-order",
    expectedOutcome: "ok",
    tags: [LIMIT, "second-order"],
    scenario: null,
    source: handwritten(
      "Six box surfaces with more than six valid second-order paths and no maxCandidates option, so the search keeps DEFAULT_SECOND_ORDER_TOP_K of them. Not in the original brief; added because the frame path never reaches that constant.",
      [SECOND_ORDER],
    ),
    seed: null,
    counts: null,
    input: {
      patches,
      source: { x: 1.5, y: 1, z: 1 },
      listener: { x: 4.5, y: 1.2, z: 2.5 },
      options: { maxPathLengthM: 200, minEstimatedGainDb: -80 },
    },
  };
}

export function limitCaseDefinitions(): CorpusCaseDefinition[] {
  return [
    ...classicClampCases(),
    ...hybridLimitCases(),
    defaultTopKCase(),
    ...validationLimitCases(),
    ...localeCases(),
  ];
}
