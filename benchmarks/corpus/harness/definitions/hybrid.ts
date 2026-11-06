import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { HARD_ROOM_PRESET } from "@/domain/presets/hard-room";
import { TREATED_ROOM_PRESET } from "@/domain/presets/treated-room";
import type { SceneSpec } from "@/domain/scene/types";
import type { SceneDocumentV2, Spatial3DExtension } from "@/domain/scene-document/types";
import { createSceneDocumentV2 } from "@/domain/scene-document/serialize";
import { createDefaultHybridProject } from "@/domain/workspace/defaults";
import { projectHybridDocument } from "@/domain/workspace/projections";
import type { AcousticPrimitive } from "@/domain/workspace/types";

import type { CorpusCaseDefinition } from "../types";
import { cloneScene, sceneCounts, stressScene, stressSource } from "./classic";

const DIRECT_TEST = "tests/unit/hybrid3d-direct.test.ts";

function spatial3d(
  listenerHeightM: number,
  sourceHeightsM: Record<string, number>,
  primitives?: AcousticPrimitive[],
): Spatial3DExtension {
  return {
    coordinateSystem: "x-right-y-up-z-forward",
    floorElevationM: 0,
    listenerHeightM,
    sourceHeightsM,
    ...(primitives ? { primitives } : {}),
  };
}

/** Copy of `hybridDocument` in the direct-propagation test. */
function partitionDocument(portalOpen: boolean): SceneDocumentV2 {
  const scene: SceneSpec = structuredClone(CONCRETE_PARTITION_PRESET);
  scene.portals[0]!.open = portalOpen;
  return createSceneDocumentV2(scene, {
    spatial3d: spatial3d(1.5, { radio: 1.3, rain: 1.5 }),
  });
}

/** Copy of the `direct_blocker` document in the direct-propagation test. */
function blockedSecondOrderDocument(): SceneDocumentV2 {
  const scene: SceneSpec = structuredClone(CONCRETE_PARTITION_PRESET);
  scene.listener.position = { x: 1, y: 4 };
  scene.sources = [{ ...scene.sources[0]!, position: { x: 4, y: 4 } }];
  scene.portals = [];
  scene.walls = scene.walls.filter(({ id }) => id !== "partition_center");
  return createSceneDocumentV2(scene, {
    spatial3d: spatial3d(1, { radio: 1 }, [{
      id: "direct_blocker",
      name: "Direct blocker",
      kind: "box",
      position: { x: 2.5, y: 1, z: 4 },
      dimensions: { x: 0.4, y: 0.4, z: 0.4 },
      rotationYDeg: 0,
      materialId: "wood_medium",
    }]),
  });
}

function roomDocument(preset: SceneSpec): SceneDocumentV2 {
  const scene = structuredClone(preset);
  return createSceneDocumentV2(scene, {
    spatial3d: spatial3d(1.5, Object.fromEntries(scene.sources.map(({ id }) => [id, 1.5]))),
  });
}

function stressPrimitives(): AcousticPrimitive[] {
  const shapes: [AcousticPrimitive["kind"], number, number, number, number, number, number, number][] = [
    // kind, x, z, width, height, depth, rotationYDeg, material index
    ["box", 3, 2, 1.2, 1.6, 0.8, 25, 0],
    ["cylinder", 5, 5.5, 0.9, 2, 0.9, 0, 1],
    ["sphere", 7, 2.5, 1, 1, 1, 0, 0],
    ["box", 9, 5, 1.4, 1, 1, 60, 1],
    ["cylinder", 2.5, 6.5, 0.7, 1.2, 0.7, 15, 0],
    ["sphere", 6, 6.8, 1.2, 1.2, 1.2, 0, 1],
    ["box", 10, 2.4, 0.6, 2.2, 1.6, 110, 0],
    ["cylinder", 4, 4, 1.1, 1.4, 1.1, 40, 1],
  ];
  const materials = ["wood_medium", "concrete_hard"];
  return shapes.map(([kind, x, z, width, height, depth, rotationYDeg, material], index) => ({
    id: `stress_${kind}_${index + 1}`,
    name: `Stress ${kind} ${index + 1}`,
    kind,
    position: { x, y: height / 2, z },
    dimensions: { x: width, y: height, z: depth },
    rotationYDeg,
    materialId: materials[material]!,
  }));
}

function stressDocument(sourceCount: 1 | 2 | 4, revision: number, primitives?: AcousticPrimitive[]): SceneDocumentV2 {
  const scene = stressScene(sourceCount, revision);
  return createSceneDocumentV2(scene, {
    spatial3d: spatial3d(1.5, Object.fromEntries(scene.sources.map(({ id }) => [id, 1.5])), primitives),
  });
}

function hybridFrameCase(
  id: string,
  scenario: NonNullable<CorpusCaseDefinition["scenario"]>,
  tags: string[],
  source: CorpusCaseDefinition["source"],
  document: SceneDocumentV2,
): CorpusCaseDefinition {
  const primitives = document.extensions.spatial3d?.primitives?.length ?? 0;
  return {
    id,
    mode: "hybrid-3d",
    kind: "hybrid-frame",
    expectedOutcome: "ok",
    tags,
    scenario,
    source,
    seed: null,
    counts: sceneCounts(document.baseScene, primitives),
    input: { document },
  };
}

export function hybridCaseDefinitions(): CorpusCaseDefinition[] {
  return [
    hybridFrameCase(
      "H001_PARTITION_PORTAL_OPEN",
      "S2",
      ["portal-open", "partition"],
      { type: "test-fixture", refs: [DIRECT_TEST, "src/domain/presets/concrete-partition.ts"], notes: "hybridDocument(true)" },
      partitionDocument(true),
    ),
    hybridFrameCase(
      "H002_PARTITION_PORTAL_CLOSED",
      "S2",
      ["portal-closed", "partition", "blocked"],
      { type: "test-fixture", refs: [DIRECT_TEST, "src/domain/presets/concrete-partition.ts"], notes: "hybridDocument(false)" },
      partitionDocument(false),
    ),
    hybridFrameCase(
      "H003_SECOND_ORDER_BLOCKED",
      "S7",
      ["second-order", "primitive-blocker", "blocked"],
      { type: "test-fixture", refs: [DIRECT_TEST, "src/domain/presets/concrete-partition.ts"], notes: "The direct_blocker document." },
      blockedSecondOrderDocument(),
    ),
    hybridFrameCase(
      "H004_DEFAULT_PROJECT",
      "S2",
      ["default-project"],
      { type: "derived", refs: ["src/domain/workspace/defaults.ts", "src/domain/workspace/projections.ts"] },
      projectHybridDocument(createDefaultHybridProject()),
    ),
    hybridFrameCase(
      "H005_HARD_ROOM",
      "S1",
      ["hard-room", "preset"],
      { type: "preset", refs: ["src/domain/presets/hard-room.ts"], notes: "Listener 1.5 m, source 1.5 m." },
      roomDocument(cloneScene(HARD_ROOM_PRESET, 0)),
    ),
    hybridFrameCase(
      "H006_TREATED_ROOM",
      "S1",
      ["treated-room", "preset"],
      { type: "preset", refs: ["src/domain/presets/treated-room.ts"], notes: "Listener 1.5 m, source 1.5 m." },
      roomDocument(cloneScene(TREATED_ROOM_PRESET, 0)),
    ),
    hybridFrameCase(
      "H007_STRESS_8_PRIMITIVES",
      "S3",
      ["stress", "primitives", "rotated"],
      {
        type: "derived",
        refs: ["src/domain/presets/stress-100-walls.ts"],
        notes: "Stress preset plus 8 rotated Box, Cylinder and Sphere primitives inside the room.",
      },
      stressDocument(1, 0, stressPrimitives()),
    ),
    hybridFrameCase("H008_STRESS_1_SOURCE", "S4", ["stress", "source-count"], stressSource(1), stressDocument(1, 110)),
    hybridFrameCase("H009_STRESS_2_SOURCES", "S4", ["stress", "source-count"], stressSource(2), stressDocument(2, 111)),
    hybridFrameCase("H010_STRESS_4_SOURCES", "S4", ["stress", "source-count"], stressSource(4), stressDocument(4, 112)),
  ];
}
