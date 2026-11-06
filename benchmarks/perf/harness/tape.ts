import type { SceneSpec } from "@/domain/scene/types";
import { validateScene } from "@/domain/scene/validate";
import { SceneDocumentSerializationError, createSceneDocumentV2 } from "@/domain/scene-document/serialize";
import type { SceneDocumentExtensions, SceneDocumentV2 } from "@/domain/scene-document/types";
import type { AcousticPrimitive } from "@/domain/workspace/types";

type Plan = { x: number; y: number };

export type TapeEvent =
  | { type: "listener-pose"; position: Plan; headingDeg?: number }
  | { type: "source-pose"; id: string; position: Plan }
  | { type: "wall-endpoint"; id: string; a: Plan; b: Plan }
  | { type: "wall-material"; id: string; materialId: string }
  | { type: "portal-toggle"; id: string; open: boolean }
  | { type: "primitive-pose"; id: string; position: { x: number; y: number; z: number }; rotationYDeg: number };

export type ClassicTapeInput = { scene: SceneSpec; events: readonly TapeEvent[] };
export type HybridTapeInput = { document: SceneDocumentV2; events: readonly TapeEvent[] };

export class TapeStepError extends Error {
  readonly step: number;
  readonly eventType: string;
  readonly issues: unknown;

  constructor(step: number, eventType: string, message: string, issues?: unknown) {
    super(`Tape step ${step} (${eventType}): ${message}`);
    this.name = "TapeStepError";
    this.step = step;
    this.eventType = eventType;
    this.issues = issues;
  }
}

type MutablePrimitive = { -readonly [K in keyof AcousticPrimitive]: AcousticPrimitive[K] };

type State = { scene: SceneSpec; extensions: SceneDocumentExtensions };

function findById<T extends { id: string }>(items: readonly T[], id: string, what: string): T {
  const found = items.find((item) => item.id === id);
  if (!found) throw new Error(`Tape event refers to unknown ${what}: ${id}`);
  return found;
}

/**
 * Applies one event the way `applyTapeEvent` in the corpus adapter does, but returns a new state.
 * Pose events share every untouched branch with the previous state, as a reducer commit would;
 * static events deep-clone first, so a snapshot handed to a consumer is never mutated afterwards.
 */
function advance(state: State, event: TapeEvent): State {
  const revision = state.scene.revision + 1;
  if (event.type === "listener-pose") {
    return {
      extensions: state.extensions,
      scene: {
        ...state.scene,
        revision,
        listener: {
          position: { ...event.position },
          headingDeg: event.headingDeg ?? state.scene.listener.headingDeg,
        },
      },
    };
  }
  if (event.type === "source-pose") {
    findById(state.scene.sources, event.id, "source");
    return {
      extensions: state.extensions,
      scene: {
        ...state.scene,
        revision,
        sources: state.scene.sources.map((source) =>
          source.id === event.id ? { ...source, position: { ...event.position } } : source,
        ),
      },
    };
  }
  const next = structuredClone(state);
  next.scene.revision = revision;
  switch (event.type) {
    case "wall-endpoint": {
      const wall = findById(next.scene.walls, event.id, "wall");
      wall.a = { ...event.a };
      wall.b = { ...event.b };
      break;
    }
    case "wall-material":
      findById(next.scene.walls, event.id, "wall").materialId = event.materialId;
      break;
    case "portal-toggle":
      findById(next.scene.portals, event.id, "portal").open = event.open;
      break;
    case "primitive-pose": {
      const primitive = findById((next.extensions.spatial3d?.primitives ?? []) as MutablePrimitive[], event.id, "primitive");
      primitive.position = { ...event.position };
      primitive.rotationYDeg = event.rotationYDeg;
      break;
    }
  }
  return next;
}

export function isStaticEvent(event: TapeEvent): boolean {
  return event.type !== "listener-pose" && event.type !== "source-pose";
}

function checked(state: State, step: number, event: TapeEvent): void {
  const validation = validateScene(state.scene);
  if (!validation.ok) {
    throw new TapeStepError(step, event.type, "Scene validation failed", validation.errors);
  }
}

export type ClassicStep = { step: number; event: TapeEvent; scene: SceneSpec };
export type HybridStep = { step: number; event: TapeEvent; document: SceneDocumentV2; documentMs: number };

/**
 * `revisionOffset` lets a repeated replay start from the input's state while revisions keep
 * increasing across replays.
 */
export function createClassicStepBuilder(
  input: ClassicTapeInput,
  revisionOffset: number,
): (event: TapeEvent) => ClassicStep {
  let state: State = { scene: structuredClone(input.scene), extensions: {} };
  state.scene.revision += revisionOffset;
  let step = 0;
  return (event) => {
    state = advance(state, event);
    checked(state, step, event);
    return { step: step++, event, scene: state.scene };
  };
}

export type HybridState = { step: number; event: TapeEvent; scene: SceneSpec; extensions: SceneDocumentExtensions };

/** Applies and validates events but leaves document creation to the caller, so it can be timed. */
export function createHybridStateBuilder(
  input: HybridTapeInput,
  revisionOffset: number,
): (event: TapeEvent) => HybridState {
  let state: State = {
    scene: structuredClone(input.document.baseScene),
    extensions: structuredClone(input.document.extensions),
  };
  state.scene.revision += revisionOffset;
  let step = 0;
  return (event) => {
    state = advance(state, event);
    checked(state, step, event);
    return { step: step++, event, scene: state.scene, extensions: state.extensions };
  };
}

export function documentFromState(state: HybridState): SceneDocumentV2 {
  try {
    return createSceneDocumentV2(state.scene, state.extensions);
  } catch (error) {
    if (!(error instanceof SceneDocumentSerializationError)) throw error;
    throw new TapeStepError(state.step, state.event.type, error.message, error.issues);
  }
}

export function createHybridStepBuilder(
  input: HybridTapeInput,
  revisionOffset: number,
  now: () => number = () => performance.now(),
): (event: TapeEvent) => HybridStep {
  const buildState = createHybridStateBuilder(input, revisionOffset);
  return (event) => {
    const state = buildState(event);
    const startedMs = now();
    const document = documentFromState(state);
    return { step: state.step, event, document, documentMs: now() - startedMs };
  };
}
