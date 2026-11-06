import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { createSceneDocumentV2 } from "@/domain/scene-document/serialize";
import { createDefaultClassicProject, createDefaultHybridProject } from "@/domain/workspace/defaults";
import { CLASSIC_PROJECT_KEY, HYBRID_PROJECT_KEY } from "@/domain/workspace/persistence";
import { projectReducer } from "@/domain/workspace/project-reducer";
import { serializeWorkspaceProject } from "@/domain/workspace/transfer";

import type { MigrationInput } from "../ts-serial-adapter";
import type { CorpusCaseDefinition } from "../types";

const PERSISTENCE_TEST = "tests/unit/workspace-persistence.test.ts";
const TRANSFER_TEST = "tests/unit/workspace-transfer.test.ts";
const SERIALIZATION_TEST = "tests/unit/scene-serialization.test.ts";
const DOCUMENT_TEST = "tests/unit/scene-document.test.ts";

function migrationCase(
  id: string,
  tags: string[],
  refs: string[],
  notes: string,
  mode: CorpusCaseDefinition["mode"],
  input: MigrationInput,
  expectedOutcome: CorpusCaseDefinition["expectedOutcome"] = "ok",
): CorpusCaseDefinition {
  return {
    id,
    mode,
    kind: "workspace-migration",
    expectedOutcome,
    tags: ["migration", ...tags],
    scenario: null,
    source: { type: "test-fixture", refs, notes },
    seed: null,
    counts: null,
    input,
  };
}

/** The v2 document of "migrates a v2 Hybrid scene document into the authoring store". */
function spatialDocument() {
  const initial = createDefaultHybridProject();
  return createSceneDocumentV2(initial.scene, {
    spatial3d: {
      coordinateSystem: "x-right-y-up-z-forward",
      floorElevationM: 0,
      listenerHeightM: 1.7,
      sourceHeightsM: Object.fromEntries(initial.scene.sources.map(({ id }) => [id, 1.2])),
    },
  });
}

/** The legacy "2.0" snapshot cache of "migrates legacy snapshot history into compact patches". */
function legacySnapshotCache(): string {
  const before = createDefaultClassicProject();
  const after = projectReducer(before, {
    type: "UPDATE_LISTENER",
    id: before.activeListenerId,
    changes: { position: { x: 4, y: 1.5, z: 2 } },
  });
  return JSON.stringify({ cacheVersion: "2.0", mode: "classic-2d5d", present: after, past: [before], future: [] });
}

function cachedBeforePanning(): string {
  const legacyProject = structuredClone(createDefaultHybridProject()) as unknown as {
    view: { camera: Record<string, number> };
  };
  delete legacyProject.view.camera.panX;
  delete legacyProject.view.camera.panY;
  return JSON.stringify({ cacheVersion: "3.0", mode: "hybrid-3d", present: legacyProject, past: [], future: [] });
}

function cachedBeforePrimitives(): string {
  const legacyProject = structuredClone(createDefaultHybridProject()) as unknown as { primitives?: unknown[] };
  delete legacyProject.primitives;
  return JSON.stringify({ cacheVersion: "3.0", mode: "hybrid-3d", present: legacyProject, past: [], future: [] });
}

function envelopeBeforeRoomMaterials(): unknown {
  const legacy = structuredClone(createDefaultHybridProject()) as unknown as { room3d: Record<string, unknown> };
  delete legacy.room3d.floorMaterialId;
  delete legacy.room3d.ceilingMaterialId;
  delete legacy.room3d.ceilingEnabled;
  return legacy;
}

/** The transfer text of "retains a source transform and marks an unavailable imported local asset for relinking". */
function missingLocalAudioTransfer(): string {
  const initial = createDefaultHybridProject();
  const source = { ...initial.scene.sources[0]!, clipId: "local_missing", position: { x: 7.25, y: 4.5 } };
  const project = {
    ...initial,
    scene: { ...initial.scene, sources: [source] },
    sourceHeightsM: { [source.id]: initial.sourceHeightsM[source.id]! },
  };
  return serializeWorkspaceProject(project, [{
    id: "local_missing",
    name: "missing.ogg",
    mimeType: "audio/ogg",
    size: 512,
    createdAt: 2,
  }]);
}

/** The exported Hybrid project of the spatial-invariants suite, with the issue-reproduction wall mutation. */
function invalidSpatialTransfer(): string {
  const box = {
    id: "box_1",
    name: "Box",
    kind: "box",
    position: { x: 4, y: 0.5, z: 3 },
    dimensions: { x: 1, y: 1, z: 1 },
    rotationYDeg: 30,
    materialId: "wood_medium",
  } as const;
  const project = projectReducer(createDefaultHybridProject(), { type: "ADD_PRIMITIVE", primitive: box });
  const envelope = JSON.parse(serializeWorkspaceProject(project, [])) as {
    project: { wall3dById: Record<string, unknown> };
  };
  const firstWallId = createDefaultHybridProject().scene.walls[0]!.id;
  envelope.project.wall3dById[firstWallId] = { bottomM: 5, topM: -1, thicknessM: -1 };
  return JSON.stringify(envelope);
}

function tamperedHashDocument(): string {
  const document = createSceneDocumentV2(structuredClone(CONCRETE_PARTITION_PRESET));
  const tampered = structuredClone(document);
  tampered.baseScene.name = "Tampered Classic Scene";
  return JSON.stringify(tampered);
}

export function migrationCaseDefinitions(): CorpusCaseDefinition[] {
  const classicScene = structuredClone(createDefaultClassicProject().scene);
  classicScene.name = "Migrated Classic";
  const noSpatial = createSceneDocumentV2(createDefaultHybridProject().scene);

  return [
    migrationCase(
      "M001_SCENESPEC_V1_TO_CLASSIC",
      ["scenespec-v1", "classic"],
      [PERSISTENCE_TEST, "src/domain/workspace/persistence.ts"],
      "Bare Classic SceneSpec named Migrated Classic, as in 'migrates a bare Classic SceneSpec'.",
      "classic-2d5d",
      { route: "migrateWorkspaceProject", mode: "classic-2d5d", payload: classicScene },
    ),
    migrationCase(
      "M002_DOC_V2_SPATIAL_TO_HYBRID",
      ["document-v2", "spatial3d", "hybrid"],
      [PERSISTENCE_TEST, "src/domain/workspace/persistence.ts"],
      "v2 document with listener height 1.7 m and source heights 1.2 m.",
      "hybrid-3d",
      { route: "migrateWorkspaceProject", mode: "hybrid-3d", payload: spatialDocument() },
    ),
    migrationCase(
      "M003_DOC_V2_NO_SPATIAL_TO_HYBRID",
      ["document-v2", "no-spatial3d", "hybrid"],
      [PERSISTENCE_TEST, "src/domain/workspace/persistence.ts"],
      "v2 document without a spatial3d extension.",
      "hybrid-3d",
      { route: "migrateWorkspaceProject", mode: "hybrid-3d", payload: noSpatial },
    ),
    migrationCase(
      "M004_LEGACY_CACHE_2_0",
      ["cache", "legacy-history", "classic"],
      [PERSISTENCE_TEST, "src/domain/workspace/persistence.ts"],
      "cacheVersion 2.0 snapshot history with one past state, loaded under the Classic key.",
      "classic-2d5d",
      { route: "loadWorkspaceCache", mode: "classic-2d5d", json: legacySnapshotCache(), storageKey: CLASSIC_PROJECT_KEY },
    ),
    migrationCase(
      "M005_CACHE_BEFORE_PANNING",
      ["cache", "view-state", "hybrid"],
      [PERSISTENCE_TEST, "src/domain/workspace/persistence.ts"],
      "Current-version cache whose camera has no panX or panY.",
      "hybrid-3d",
      { route: "loadWorkspaceCache", mode: "hybrid-3d", json: cachedBeforePanning(), storageKey: HYBRID_PROJECT_KEY },
    ),
    migrationCase(
      "M006_CACHE_BEFORE_PRIMITIVES",
      ["cache", "primitives", "hybrid"],
      [PERSISTENCE_TEST, "src/domain/workspace/persistence.ts"],
      "Current-version cache whose project has no primitives field.",
      "hybrid-3d",
      { route: "loadWorkspaceCache", mode: "hybrid-3d", json: cachedBeforePrimitives(), storageKey: HYBRID_PROJECT_KEY },
    ),
    migrationCase(
      "M007_ENVELOPE_BEFORE_ROOM_MATERIALS",
      ["envelope", "room-materials", "hybrid"],
      ["src/domain/workspace/persistence.ts"],
      "Authoring envelope with no room3d floorMaterialId, ceilingMaterialId or ceilingEnabled.",
      "hybrid-3d",
      { route: "migrateWorkspaceProject", mode: "hybrid-3d", payload: envelopeBeforeRoomMaterials() },
    ),
    migrationCase(
      "M008_TRANSFER_MISSING_LOCAL_AUDIO",
      ["transfer", "local-audio", "relink", "hybrid"],
      [TRANSFER_TEST, "src/domain/workspace/transfer.ts"],
      "Transfer file whose only source uses local_missing; no local audio is available.",
      "hybrid-3d",
      { route: "parseWorkspaceProject", mode: "hybrid-3d", json: missingLocalAudioTransfer(), availableAudioIds: [] },
    ),
    migrationCase(
      "M009_HYBRID_INTO_CLASSIC_REJECTED",
      ["transfer", "wrong-mode", "rejected"],
      [TRANSFER_TEST, "src/domain/workspace/transfer.ts"],
      "Default Hybrid transfer imported into Classic.",
      "classic-2d5d",
      {
        route: "parseWorkspaceProject",
        mode: "classic-2d5d",
        json: serializeWorkspaceProject(createDefaultHybridProject(), []),
        availableAudioIds: [],
      },
      "error",
    ),
    migrationCase(
      "M010_DOC_V2_INTO_CLASSIC_REJECTED",
      ["document-v2", "wrong-mode", "rejected"],
      [PERSISTENCE_TEST, "src/domain/workspace/persistence.ts"],
      "The M002 v2 document migrated into Classic; the migration returns a failure result.",
      "classic-2d5d",
      { route: "migrateWorkspaceProject", mode: "classic-2d5d", payload: spatialDocument() },
    ),
    migrationCase(
      "M011_SCHEMA_0_9_REJECTED",
      ["schema-version", "rejected"],
      [SERIALIZATION_TEST, "src/domain/scene/serialize.ts"],
      "Concrete Partition with schemaVersion 0.9.",
      "classic-2d5d",
      {
        route: "parseScene",
        mode: "classic-2d5d",
        json: JSON.stringify({ ...structuredClone(CONCRETE_PARTITION_PRESET), schemaVersion: "0.9" }),
      },
      "error",
    ),
    migrationCase(
      "M012_INVALID_SPATIAL_REJECTED",
      ["spatial-validation", "rejected", "hybrid"],
      [TRANSFER_TEST, "src/domain/workspace/spatial-validation.ts"],
      "Issue reproduction: first wall bottom 5, top -1, thickness -1.",
      "hybrid-3d",
      { route: "parseWorkspaceProject", mode: "hybrid-3d", json: invalidSpatialTransfer(), availableAudioIds: [] },
      "error",
    ),
    migrationCase(
      "M013_HASH_MISMATCH_REJECTED",
      ["classic-projection-hash", "rejected", "hybrid"],
      [DOCUMENT_TEST, "src/domain/scene-document/validate.ts"],
      "v2 document whose base scene name changed after the compatibility hash was computed.",
      "hybrid-3d",
      { route: "parseSceneDocument", mode: "hybrid-3d", json: tamperedHashDocument() },
      "error",
    ),
  ];
}
