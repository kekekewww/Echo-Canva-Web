import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import type { SceneSpec } from "@/domain/scene/types";
import { createSceneDocumentV2 } from "@/domain/scene-document/serialize";
import type { SceneDocumentV2 } from "@/domain/scene-document/types";
import type { AcousticPrimitive } from "@/domain/workspace/types";

import { lcg32 } from "../prng";
import type { TapeEvent } from "../ts-serial-adapter";
import type { CorpusCaseDefinition } from "../types";
import { cloneScene, sceneCounts } from "./classic";

const TAPE_SEED = 20261106;
const SEED = {
  value: TAPE_SEED,
  algorithm: "lcg32-v1" as const,
  consumers: "x then y jitter of each of the 64 listener poses, two draws per step in step order",
};

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/**
 * A 64-step walk through the partition door: from the far corner of the left room to the door, across the
 * door line, and out to the right room. Each pose carries up to 0.1 m of seeded jitter on both axes.
 */
function listenerWalk(): TapeEvent[] {
  const waypoints = [
    { x: 1.5, y: 6.5 },
    { x: 5, y: 4 },
    { x: 7, y: 4 },
    { x: 10.5, y: 6.5 },
  ];
  const lengths = waypoints.slice(1).map((end, index) => {
    const start = waypoints[index]!;
    return Math.hypot(end.x - start.x, end.y - start.y);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const random = lcg32(TAPE_SEED);
  const steps = 64;
  const events: TapeEvent[] = [];
  for (let step = 0; step < steps; step++) {
    let remaining = (step / (steps - 1)) * total;
    let segment = 0;
    while (segment < lengths.length - 1 && remaining > lengths[segment]!) {
      remaining -= lengths[segment]!;
      segment += 1;
    }
    const start = waypoints[segment]!;
    const end = waypoints[segment + 1]!;
    const fraction = remaining / lengths[segment]!;
    const jitterX = (random() - 0.5) * 0.2;
    const jitterY = (random() - 0.5) * 0.2;
    const heading = (Math.atan2(end.x - start.x, end.y - start.y) * 180) / Math.PI;
    events.push({
      type: "listener-pose",
      position: {
        x: round(start.x + (end.x - start.x) * fraction + jitterX, 4),
        y: round(start.y + (end.y - start.y) * fraction + jitterY, 4),
      },
      headingDeg: round((heading + 360) % 360, 1),
    });
  }
  return events;
}

const POSES: [number, number][] = [
  [2, 2], [3, 6], [4.5, 4.2], [5.2, 3.8], [7, 4], [8, 6],
  [10.5, 6.5], [8, 2.5], [7.2, 5], [4, 1.5], [2.5, 7], [3, 4],
];

/** Static edits that each change the static geometry: endpoint, material and portal cycles. */
const ENDPOINTS: TapeEvent[] = [
  { type: "wall-endpoint", id: "partition_center", a: { x: 6, y: 0.5 }, b: { x: 6, y: 8 } },
  { type: "wall-endpoint", id: "boundary_east", a: { x: 12, y: 0.4 }, b: { x: 12, y: 8 } },
  { type: "wall-endpoint", id: "partition_center", a: { x: 6, y: 1 }, b: { x: 6, y: 7.5 } },
  { type: "wall-endpoint", id: "partition_center", a: { x: 6, y: 0 }, b: { x: 6, y: 8 } },
];
const MATERIALS: TapeEvent[] = [
  { type: "wall-material", id: "partition_center", materialId: "wood_medium" },
  { type: "wall-material", id: "boundary_north", materialId: "acoustic_treatment" },
  { type: "wall-material", id: "partition_center", materialId: "concrete_hard" },
  { type: "wall-material", id: "boundary_south", materialId: "soft_foliage" },
];
const TOGGLES: TapeEvent[] = [
  { type: "portal-toggle", id: "partition_door", open: false },
  { type: "portal-toggle", id: "partition_door", open: true },
  { type: "portal-toggle", id: "partition_door", open: false },
  { type: "portal-toggle", id: "partition_door", open: true },
];
const PRIMITIVE_POSES: TapeEvent[] = [
  { type: "primitive-pose", id: "tape_box", position: { x: 9, y: 0.5, z: 6.5 }, rotationYDeg: 30 },
  { type: "primitive-pose", id: "tape_cylinder", position: { x: 2.5, y: 0.6, z: 2.5 }, rotationYDeg: 0 },
  { type: "primitive-pose", id: "tape_box", position: { x: 8, y: 0.5, z: 5.5 }, rotationYDeg: 75 },
];

/** Alternates listener poses and static edits, starting with a pose so step 0 is the baseline. */
function interleave(statics: TapeEvent[]): TapeEvent[] {
  return statics.flatMap((event, index): TapeEvent[] => [
    { type: "listener-pose", position: { x: POSES[index]![0], y: POSES[index]![1] } },
    event,
  ]);
}

function classicStaticEdits(): TapeEvent[] {
  return [0, 1, 2, 3].flatMap((i) => [ENDPOINTS[i]!, MATERIALS[i]!, TOGGLES[i]!]);
}

function hybridStaticEdits(): TapeEvent[] {
  return [0, 1, 2].flatMap((i) => [ENDPOINTS[i]!, MATERIALS[i]!, TOGGLES[i]!, PRIMITIVE_POSES[i]!]);
}

function tapeScene(revision: number): SceneSpec {
  return cloneScene(CONCRETE_PARTITION_PRESET, revision);
}

function tapePrimitives(): AcousticPrimitive[] {
  return [
    {
      id: "tape_box",
      name: "Tape box",
      kind: "box",
      position: { x: 8.5, y: 0.5, z: 6 },
      dimensions: { x: 1, y: 1, z: 1 },
      rotationYDeg: 0,
      materialId: "wood_medium",
    },
    {
      id: "tape_cylinder",
      name: "Tape cylinder",
      kind: "cylinder",
      position: { x: 3, y: 0.6, z: 2 },
      dimensions: { x: 0.8, y: 1.2, z: 0.8 },
      rotationYDeg: 0,
      materialId: "wood_medium",
    },
  ];
}

function tapeDocument(revision: number, primitives: AcousticPrimitive[]): SceneDocumentV2 {
  return createSceneDocumentV2(tapeScene(revision), {
    spatial3d: {
      coordinateSystem: "x-right-y-up-z-forward",
      floorElevationM: 0,
      listenerHeightM: 1.5,
      sourceHeightsM: { radio: 1.3, rain: 1.5 },
      ...(primitives.length > 0 ? { primitives } : {}),
    },
  });
}

const PARTITION_REF = "src/domain/presets/concrete-partition.ts";

export function tapeCaseDefinitions(): CorpusCaseDefinition[] {
  const classicWalk = tapeScene(300);
  const hybridWalk = tapeDocument(310, []);
  const classicEdits = tapeScene(320);
  const hybridEdits = tapeDocument(330, tapePrimitives());
  return [
    {
      id: "TC01_LISTENER_TAPE_SEEDED",
      mode: "classic-2d5d",
      kind: "classic-tape",
      expectedOutcome: "ok",
      tags: ["tape", "listener-walk", "seeded", "partition", "door-edge"],
      scenario: "S5",
      source: {
        type: "handwritten",
        refs: [PARTITION_REF],
        notes: "64 listener poses along a jittered walk from the left room through the door to the right room.",
      },
      seed: SEED,
      counts: sceneCounts(classicWalk),
      input: { scene: classicWalk, events: listenerWalk() },
    },
    {
      id: "TH01_LISTENER_TAPE_SEEDED",
      mode: "hybrid-3d",
      kind: "hybrid-tape",
      expectedOutcome: "ok",
      tags: ["tape", "listener-walk", "seeded", "partition", "door-edge"],
      scenario: "S5",
      source: {
        type: "handwritten",
        refs: [PARTITION_REF],
        notes: "The TC01 walk on the Hybrid partition document with 1.5 m listener height.",
      },
      seed: SEED,
      counts: sceneCounts(hybridWalk.baseScene),
      input: { document: hybridWalk, events: listenerWalk() },
    },
    {
      id: "TC02_STATIC_EDIT_TAPE",
      mode: "classic-2d5d",
      kind: "classic-tape",
      expectedOutcome: "ok",
      tags: ["tape", "static-edits", "partition"],
      scenario: "S6",
      source: {
        type: "handwritten",
        refs: [PARTITION_REF],
        notes: "24 steps alternating a listener pose with one static edit: wall endpoint, wall material or portal toggle.",
      },
      seed: null,
      counts: sceneCounts(classicEdits),
      input: { scene: classicEdits, events: interleave(classicStaticEdits()) },
    },
    {
      id: "TH02_STATIC_EDIT_TAPE",
      mode: "hybrid-3d",
      kind: "hybrid-tape",
      expectedOutcome: "ok",
      tags: ["tape", "static-edits", "partition", "primitives"],
      scenario: "S6",
      source: {
        type: "handwritten",
        refs: [PARTITION_REF],
        notes:
          "24 steps alternating a listener pose with one static edit: wall endpoint, wall material, portal toggle or primitive pose.",
      },
      seed: null,
      counts: sceneCounts(hybridEdits.baseScene, 2),
      input: { document: hybridEdits, events: interleave(hybridStaticEdits()) },
    },
  ];
}
