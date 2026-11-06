import { computeAcousticFrame, createClassicStaticContext } from "@/acoustics/compute-frame";
import { buildPatchBvh, hasSegmentBvhHit, intersectSegmentBvh } from "@/acoustics/hybrid3d/bvh";
import { resolveHybridAudibleDirectState } from "@/acoustics/hybrid3d/audible-direct";
import { compileHybridGeometry, hybridStaticGeometryHash } from "@/acoustics/hybrid3d/compile";
import { computeHybridDirectFrame } from "@/acoustics/hybrid3d/direct";
import { makePatch3, type AcousticPatch3, type Vec3 } from "@/acoustics/hybrid3d/geometry";
import { reflectionLegIsVisible } from "@/acoustics/hybrid3d/reflections";
import { renderHybridEarlyReflections } from "@/acoustics/hybrid3d/reflection-rendering";
import {
  findExhaustiveSecondOrderReflections3D,
  findPrunedSecondOrderReflections3D,
  type PrunedSecondOrderOptions,
} from "@/acoustics/hybrid3d/second-order";
import { evaluateSecondOrderCandidate } from "@/acoustics/hybrid3d/second-order-evaluation";
import { parseScene } from "@/domain/scene/serialize";
import type { SceneSpec } from "@/domain/scene/types";
import { validateScene } from "@/domain/scene/validate";
import {
  SceneDocumentSerializationError,
  createSceneDocumentV2,
  parseSceneDocument,
} from "@/domain/scene-document/serialize";
import type { SceneDocument, SceneDocumentV2 } from "@/domain/scene-document/types";
import {
  classicProjectionHash,
  isSceneDocumentV2,
  validateSceneDocument,
} from "@/domain/scene-document/validate";
import {
  loadWorkspaceCache,
  migrateWorkspaceProject,
  projectStorageKey,
} from "@/domain/workspace/persistence";
import { projectClassicScene, projectHybridDocument } from "@/domain/workspace/projections";
import { parseWorkspaceProject } from "@/domain/workspace/transfer";
import type { AcousticPrimitive, WorkspaceMode, WorkspaceProject } from "@/domain/workspace/types";

import type { CorpusCaseKind, CorpusOutput } from "./types";

type PatchOptions = NonNullable<Parameters<typeof makePatch3>[4]>;

export type PatchSpec = {
  id: string;
  kind: AcousticPatch3["kind"];
  materialId: string;
  vertices: Vec3[];
  options?: PatchOptions;
};

export type VisibilityQuery = { start: Vec3; end: Vec3; allowedWallIds?: string[] };

function buildPatches(specs: readonly PatchSpec[]): AcousticPatch3[] {
  return specs.map(({ id, kind, materialId, vertices, options }) =>
    makePatch3(id, kind, materialId, vertices, options),
  );
}

function runClassicFrame(input: { scene: SceneSpec }): unknown {
  return {
    staticFingerprint: createClassicStaticContext(input.scene).fingerprint,
    frame: computeAcousticFrame(input.scene, 0),
  };
}

function runHybridFrame(input: { document: SceneDocumentV2 }): unknown {
  const geometry = compileHybridGeometry(input.document);
  const frame = computeHybridDirectFrame(geometry, 0);
  const earlyTapsBySource = Object.fromEntries(
    geometry.document.baseScene.sources.map(({ id }) => [
      id,
      renderHybridEarlyReflections(
        frame.firstOrderReflectionsBySource[id] ?? [],
        frame.secondOrderReflectionsBySource[id] ?? [],
      ),
    ]),
  );
  return {
    staticGeometryHash: hybridStaticGeometryHash(input.document),
    frame,
    audible: resolveHybridAudibleDirectState(geometry, frame),
    earlyTapsBySource,
  };
}

function runHybridVisibility(input: { patches: PatchSpec[]; queries: VisibilityQuery[] }): unknown {
  const bvh = buildPatchBvh(buildPatches(input.patches));
  return input.queries.map(({ start, end, allowedWallIds }) => {
    const result: Record<string, unknown> = {
      hits: intersectSegmentBvh(start, end, bvh),
      hasHit: hasSegmentBvhHit(start, end, bvh),
      reverseHasHit: hasSegmentBvhHit(end, start, bvh),
    };
    if (allowedWallIds) {
      result.hasHitAccepted = hasSegmentBvhHit(
        start,
        end,
        bvh,
        (hit) => !allowedWallIds.includes(hit.wallId ?? ""),
      );
      result.legVisible = reflectionLegIsVisible(start, end, bvh, allowedWallIds);
    }
    return result;
  });
}

function runHybridSecondOrder(input: {
  patches: PatchSpec[];
  source: Vec3;
  listener: Vec3;
  options?: PrunedSecondOrderOptions;
}): unknown {
  const bvh = buildPatchBvh(buildPatches(input.patches));
  const exhaustive = findExhaustiveSecondOrderReflections3D(input.source, input.listener, bvh);
  if (!input.options) return { exhaustive, pruned: null, evaluation: null };
  const pruned = findPrunedSecondOrderReflections3D(input.source, input.listener, bvh, input.options);
  return {
    exhaustive,
    pruned: { paths: pruned.paths, stats: pruned.stats },
    evaluation: evaluateSecondOrderCandidate(exhaustive, pruned.paths),
  };
}

export type MigrationInput = {
  route:
    | "migrateWorkspaceProject"
    | "parseWorkspaceProject"
    | "parseScene"
    | "parseSceneDocument"
    | "loadWorkspaceCache";
  mode: WorkspaceMode;
  payload?: unknown;
  json?: string;
  availableAudioIds?: string[];
  storageKey?: string;
};

function classicFrameFor(scene: SceneSpec): unknown {
  return computeAcousticFrame(scene, 0);
}

function hybridFrameFor(document: SceneDocumentV2): unknown {
  return computeHybridDirectFrame(compileHybridGeometry(document), 0);
}

/** Projects a migrated project the way the app does and computes the matching frame at t=0. */
function describeProject(project: WorkspaceProject, mode: WorkspaceMode): Record<string, unknown> {
  if (mode === "classic-2d5d") {
    const classicScene = projectClassicScene(project);
    return { classicScene, frame: classicFrameFor(classicScene) };
  }
  const hybridDocument = projectHybridDocument(project);
  return {
    hybridDocument,
    classicProjectionHash: classicProjectionHash(project.scene),
    frame: hybridFrameFor(hybridDocument),
  };
}

function describeDocument(document: SceneDocument): Record<string, unknown> {
  if (isSceneDocumentV2(document)) {
    return {
      hybridDocument: document,
      classicProjectionHash: document.compatibility.classicProjectionHash,
      frame: hybridFrameFor(document),
    };
  }
  return { classicScene: document, frame: classicFrameFor(document) };
}

/** In-memory `Storage` stand-in holding one record, as the persistence test does. */
function memoryStorage(key: string, value: string) {
  const records = new Map([[key, value]]);
  return {
    getItem: (name: string) => records.get(name) ?? null,
    setItem: (name: string, next: string) => void records.set(name, next),
  };
}

function runWorkspaceMigration(input: MigrationInput): unknown {
  const { route, mode } = input;
  switch (route) {
    case "migrateWorkspaceProject": {
      const migrated = migrateWorkspaceProject(input.payload, mode);
      if (!migrated.ok) {
        return "message" in migrated
          ? { result: migrated.reason, message: migrated.message }
          : { result: migrated.reason };
      }
      return { result: "ok", project: migrated.project, ...describeProject(migrated.project, mode) };
    }
    case "parseWorkspaceProject": {
      const parsed = parseWorkspaceProject(input.json ?? "", mode, new Set(input.availableAudioIds ?? []));
      return { result: "ok", project: parsed.project, ...describeProject(parsed.project, mode) };
    }
    case "loadWorkspaceCache": {
      const storage = memoryStorage(input.storageKey ?? projectStorageKey(mode), input.json ?? "");
      const loaded = loadWorkspaceCache(storage, mode);
      return {
        result: "ok",
        project: loaded.project,
        warning: loaded.warning,
        history: loaded.history,
        ...describeProject(loaded.project, mode),
      };
    }
    case "parseScene": {
      const scene = parseScene(input.json ?? "");
      return { result: "ok", classicScene: scene, frame: classicFrameFor(scene) };
    }
    case "parseSceneDocument":
      return { result: "ok", ...describeDocument(parseSceneDocument(input.json ?? "")) };
  }
}

function runSceneValidation(input: { target: "scene" | "document"; json: string }): unknown {
  const parsed: unknown = JSON.parse(input.json);
  return input.target === "scene" ? validateScene(parsed) : validateSceneDocument(parsed);
}

function runHybridPatch(input: PatchSpec): unknown {
  return buildPatches([input])[0];
}

type Plan = { x: number; y: number };

export type TapeEvent =
  | { type: "listener-pose"; position: Plan; headingDeg?: number }
  | { type: "source-pose"; id: string; position: Plan }
  | { type: "wall-endpoint"; id: string; a: Plan; b: Plan }
  | { type: "wall-material"; id: string; materialId: string }
  | { type: "portal-toggle"; id: string; open: boolean }
  | { type: "primitive-pose"; id: string; position: { x: number; y: number; z: number }; rotationYDeg: number };

function findById<T extends { id: string }>(items: readonly T[], id: string, what: string): T {
  const found = items.find((item) => item.id === id);
  if (!found) throw new Error(`Tape event refers to unknown ${what}: ${id}`);
  return found;
}

/** The working copy is a structured clone, so its primitives are safe to mutate. */
type MutablePrimitive = { -readonly [K in keyof AcousticPrimitive]: AcousticPrimitive[K] };

function applyTapeEvent(scene: SceneSpec, primitives: MutablePrimitive[], event: TapeEvent): void {
  switch (event.type) {
    case "listener-pose":
      scene.listener.position = { ...event.position };
      if (event.headingDeg !== undefined) scene.listener.headingDeg = event.headingDeg;
      return;
    case "source-pose":
      findById(scene.sources, event.id, "source").position = { ...event.position };
      return;
    case "wall-endpoint": {
      const wall = findById(scene.walls, event.id, "wall");
      wall.a = { ...event.a };
      wall.b = { ...event.b };
      return;
    }
    case "wall-material":
      findById(scene.walls, event.id, "wall").materialId = event.materialId;
      return;
    case "portal-toggle":
      findById(scene.portals, event.id, "portal").open = event.open;
      return;
    case "primitive-pose": {
      const primitive = findById(primitives, event.id, "primitive");
      primitive.position = { ...event.position };
      primitive.rotationYDeg = event.rotationYDeg;
      return;
    }
  }
}

function failedStep(step: number, event: TapeEvent, error: { message: string; issues?: unknown }) {
  return { step, event: event.type, outcome: "error", error };
}

function runClassicTape(input: { scene: SceneSpec; events: TapeEvent[] }): unknown {
  const scene = input.scene;
  const steps: unknown[] = [];
  for (const [step, event] of input.events.entries()) {
    applyTapeEvent(scene, [], event);
    scene.revision += 1;
    const validation = validateScene(scene);
    if (!validation.ok) {
      steps.push(failedStep(step, event, { message: "Scene validation failed", issues: validation.errors }));
      break;
    }
    steps.push({
      step,
      event: event.type,
      staticFingerprint: createClassicStaticContext(scene).fingerprint,
      frame: computeAcousticFrame(scene, 0),
    });
  }
  return { steps };
}

function runHybridTape(input: { document: SceneDocumentV2; events: TapeEvent[] }): unknown {
  const scene = structuredClone(input.document.baseScene);
  const extensions = structuredClone(input.document.extensions);
  const steps: unknown[] = [];
  for (const [step, event] of input.events.entries()) {
    applyTapeEvent(scene, (extensions.spatial3d?.primitives ?? []) as MutablePrimitive[], event);
    scene.revision += 1;
    const validation = validateScene(scene);
    if (!validation.ok) {
      steps.push(failedStep(step, event, { message: "Scene validation failed", issues: validation.errors }));
      break;
    }
    let document: SceneDocumentV2;
    try {
      document = createSceneDocumentV2(scene, extensions);
    } catch (error) {
      if (!(error instanceof SceneDocumentSerializationError)) throw error;
      steps.push(failedStep(step, event, { message: error.message, issues: error.issues }));
      break;
    }
    steps.push({
      step,
      event: event.type,
      staticGeometryHash: hybridStaticGeometryHash(document),
      classicProjectionHash: document.compatibility.classicProjectionHash,
      frame: hybridFrameFor(document),
    });
  }
  return { steps };
}

function dispatch(kind: CorpusCaseKind, input: unknown): unknown {
  switch (kind) {
    case "classic-frame":
      return runClassicFrame(input as { scene: SceneSpec });
    case "hybrid-frame":
      return runHybridFrame(input as { document: SceneDocumentV2 });
    case "hybrid-visibility":
      return runHybridVisibility(input as { patches: PatchSpec[]; queries: VisibilityQuery[] });
    case "hybrid-second-order":
      return runHybridSecondOrder(input as Parameters<typeof runHybridSecondOrder>[0]);
    case "workspace-migration":
      return runWorkspaceMigration(input as MigrationInput);
    case "scene-validation":
      return runSceneValidation(input as Parameters<typeof runSceneValidation>[0]);
    case "hybrid-patch":
      return runHybridPatch(input as PatchSpec);
    case "classic-tape":
      return runClassicTape(input as Parameters<typeof runClassicTape>[0]);
    case "hybrid-tape":
      return runHybridTape(input as Parameters<typeof runHybridTape>[0]);
    default:
      throw new Error(`Unsupported corpus case kind: ${kind}`);
  }
}

/** Runs one frozen input through the in-process TypeScript implementation. */
export function runCorpusCase(caseId: string, kind: CorpusCaseKind, input: unknown): CorpusOutput {
  try {
    return { caseId, kind, outcome: "ok", value: dispatch(kind, structuredClone(input)) };
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    return { caseId, kind, outcome: "error", error: { name: failure.name, message: failure.message } };
  }
}
