import type { SceneSpec } from "@/domain/scene/types";
import { classicProjectionHash } from "@/domain/scene-document/validate";
import type { SceneDocumentV2 } from "@/domain/scene-document/types";
import type { WorkspaceProject } from "@/domain/workspace/types";
import { primitiveFootprintWalls } from "@/domain/workspace/primitives";

/**
 * Project fields that only affect presentation or local metadata. No acoustic
 * projection reads them, so a change to them must not invalidate one.
 */
const PRESENTATION_ONLY_FIELDS: ReadonlySet<string> = new Set<keyof WorkspaceProject>([
  "selection",
  "view",
  "notice",
  "localAudioMetadata",
]);

function sameProjectionInputs(left: WorkspaceProject, right: WorkspaceProject): boolean {
  if (left === right) return true;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (PRESENTATION_ONLY_FIELDS.has(key)) continue;
    if (!Object.is(left[key as keyof WorkspaceProject], right[key as keyof WorkspaceProject])) return false;
  }
  return true;
}

/**
 * Memoizes one projection of a workspace project (an LRU of one).
 *
 * Workspace updates are immutable (reducer commits and history patches clone
 * what they change), so when every non-presentation field keeps its reference
 * the acoustic content is unchanged. Camera, selection, and notice updates then
 * return the previous projection object, which keeps downstream acoustic jobs
 * and audio reconciles keyed on that object from re-running. The comparison is
 * by reference, never by revision, because undo/redo reuses revision numbers.
 */
export function createProjectProjectionCache<T>(
  project: (value: WorkspaceProject) => T,
): (value: WorkspaceProject) => T {
  let cached: Readonly<{ input: WorkspaceProject; output: T }> | null = null;
  return (value) => {
    if (cached && sameProjectionInputs(cached.input, value)) {
      cached = { input: value, output: cached.output };
      return cached.output;
    }
    cached = { input: value, output: project(value) };
    return cached.output;
  };
}

function activeListener(project: WorkspaceProject) {
  return (
    project.listeners.find(
      ({ id, enabled }) => id === project.activeListenerId && enabled,
    ) ?? project.listeners.find(({ enabled }) => enabled)!
  );
}

export function projectClassicScene(project: WorkspaceProject): SceneSpec {
  const scene = structuredClone(project.scene);
  const disabled = new Set(project.disabledEntityIds);
  const listener = activeListener(project);
  const walls = scene.walls.filter(({ id }) => !disabled.has(id));
  const wallIds = new Set(walls.map(({ id }) => id));
  const primitiveWalls = project.mode === "classic-2d5d"
    ? project.primitives.filter(({ id }) => !disabled.has(id)).flatMap(primitiveFootprintWalls)
    : [];

  return {
    ...scene,
    revision: project.revision,
    walls: [...walls, ...primitiveWalls],
    portals: scene.portals.filter(
      ({ id, wallId }) => !disabled.has(id) && wallIds.has(wallId),
    ),
    sources: scene.sources.filter(({ id }) => !disabled.has(id)),
    listener: {
      position: { x: listener.position.x, y: listener.position.z },
      headingDeg: listener.headingDeg,
    },
  };
}

export function projectHybridDocument(project: WorkspaceProject): SceneDocumentV2 {
  const listener = activeListener(project);
  const baseScene = projectClassicScene(project);
  const { widthM, depthM, heightM } = project.room3d;
  baseScene.room = {
    ...baseScene.room,
    heightM,
    outerPolygon: [
      { x: 0, y: 0 },
      { x: widthM, y: 0 },
      { x: widthM, y: depthM },
      { x: 0, y: depthM },
    ],
  };

  const extensions: SceneDocumentV2["extensions"] = {
    spatial3d: {
      coordinateSystem: "x-right-y-up-z-forward",
      floorElevationM: 0,
      listenerHeightM: listener.position.y,
      sourceHeightsM: Object.fromEntries(
        baseScene.sources.map(({ id }) => [id, project.sourceHeightsM[id] ?? 1.5]),
      ),
      wallVerticalBoundsM: Object.fromEntries(baseScene.walls.map(({ id }) => [id, {
        bottomM: project.wall3dById[id]?.bottomM ?? 0,
        topM: project.wall3dById[id]?.topM ?? heightM,
      }])),
      portalVerticalBoundsM: Object.fromEntries(baseScene.portals.map(({ id }) => [id, {
        bottomM: project.portal3dById[id]?.bottomM ?? 0,
        topM: project.portal3dById[id]?.topM ?? baseScene.portals.find((portal) => portal.id === id)!.heightM,
        thicknessM: project.portal3dById[id]?.thicknessM ?? 0.12,
      }])),
      disabledSurfaceIds: project.room3d.ceilingEnabled ? [] : ["ceiling"],
      primitives: project.primitives.filter(({ id }) => !project.disabledEntityIds.includes(id)),
    },
    propagation3d: {
      maxReflectionOrder: 1,
      receiverConnection: false,
    },
  };

  // Workspace actions preserve schema/domain invariants before state is accepted.
  // This hot projection avoids repeating external-boundary validation on every pose update.
  return {
    documentVersion: "2.0",
    baseScene,
    extensions,
    compatibility: {
      migratedFrom: "1.0",
      classicProjectionHash: classicProjectionHash(baseScene),
    },
  };
}
