import { MATERIALS } from "@/domain/materials/registry";
import { constrainPrimitiveToRoom, MIN_PRIMITIVE_DIMENSION_M } from "@/domain/workspace/primitives";
import type { WorkspaceProject } from "@/domain/workspace/types";

/**
 * Boundary validation for the authoring spatial state of an imported or cached
 * {@link WorkspaceProject}. All lengths are metres in the authoring frame
 * (x right, y up, z forward; plan y maps to authoring z).
 *
 * The limits mirror the invariants the editor already enforces when it creates
 * this state (`constrainWall3D`, `constrainPortal3D`, `resizeRoomAndClamp`,
 * `constrainPrimitiveToRoom`) so every editor-produced project passes. It is
 * intended for import/cache boundaries only, not pose-update hot paths.
 */

/** Absolute tolerance (m) for comparisons against values the editor computed. */
export const SPATIAL_TOLERANCE_M = 1e-6;
/** Minimum Wall vertical extent (m), as enforced by `constrainWall3D`. */
export const MIN_WALL_VERTICAL_EXTENT_M = 0.1;
/** Minimum Portal vertical extent (m), as enforced by `constrainPortal3D`. */
export const MIN_PORTAL_VERTICAL_EXTENT_M = 0.4;
/** Wall/Portal thickness range (m), matching the SceneSpec and editor ranges. */
export const MIN_THICKNESS_M = 0.02;
export const MAX_THICKNESS_M = 2;
/** Room plan dimension range (m), as enforced by `resizeRoomAndClamp`. */
export const MIN_ROOM_PLAN_M = 1;
export const MAX_ROOM_PLAN_M = 50;

const MATERIAL_IDS = new Set(MATERIALS.map(({ id }) => id));

export type SpatialValidationIssue = Readonly<{ path: string; message: string }>;

function sameIdSet(
  path: string,
  label: string,
  record: Readonly<Record<string, unknown>>,
  ids: readonly string[],
  issues: SpatialValidationIssue[],
): void {
  const expected = new Set(ids);
  for (const id of Object.keys(record)) {
    if (!expected.has(id)) issues.push({ path: `${path}.${id}`, message: `${label} settings refer to unknown ${label}: ${id}.` });
  }
  for (const id of ids) {
    if (!Object.hasOwn(record, id)) issues.push({ path: `${path}.${id}`, message: `${label} ${id} is missing its 3D settings.` });
  }
}

function checkVertical(
  path: string,
  label: string,
  vertical: Readonly<{ bottomM: number; topM: number; thicknessM: number }>,
  roomHeightM: number,
  minimumExtentM: number,
  issues: SpatialValidationIssue[],
): void {
  if (vertical.thicknessM < MIN_THICKNESS_M || vertical.thicknessM > MAX_THICKNESS_M) {
    issues.push({ path: `${path}.thicknessM`, message: `${label} thickness must be ${MIN_THICKNESS_M}–${MAX_THICKNESS_M} m.` });
  }
  if (
    vertical.bottomM < -SPATIAL_TOLERANCE_M ||
    vertical.topM > roomHeightM + SPATIAL_TOLERANCE_M ||
    vertical.topM - vertical.bottomM < minimumExtentM - SPATIAL_TOLERANCE_M
  ) {
    issues.push({
      path,
      message: `${label} vertical bounds must fit the ${roomHeightM} m room with bottom below top by at least ${minimumExtentM.toFixed(2)} m.`,
    });
  }
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) <= SPATIAL_TOLERANCE_M;
}

/**
 * Returns every spatial invariant violation in `project`. The base scene must
 * already have passed `validateScene` (wall/Portal/source IDs, scene materials
 * and limits are checked there).
 */
export function validateWorkspaceSpatialState(project: WorkspaceProject): readonly SpatialValidationIssue[] {
  const issues: SpatialValidationIssue[] = [];
  const { room3d, scene } = project;

  if (room3d.widthM < MIN_ROOM_PLAN_M || room3d.widthM > MAX_ROOM_PLAN_M ||
      room3d.depthM < MIN_ROOM_PLAN_M || room3d.depthM > MAX_ROOM_PLAN_M) {
    issues.push({ path: "room3d", message: `Room width/depth must be ${MIN_ROOM_PLAN_M}–${MAX_ROOM_PLAN_M} m.` });
  }
  if (!near(room3d.heightM, scene.room.heightM)) {
    issues.push({ path: "room3d.heightM", message: "Room height must match the base scene room height." });
  }
  for (const field of ["floorMaterialId", "ceilingMaterialId"] as const) {
    if (!MATERIAL_IDS.has(room3d[field])) {
      issues.push({ path: `room3d.${field}`, message: `Unknown material ID: ${room3d[field]}.` });
    }
  }

  const listenerIds = new Set<string>();
  for (const [index, listener] of project.listeners.entries()) {
    if (listenerIds.has(listener.id)) issues.push({ path: `listeners.${index}.id`, message: `Listener ID must be unique: ${listener.id}.` });
    listenerIds.add(listener.id);
  }

  sameIdSet("sourceHeightsM", "Source", project.sourceHeightsM, scene.sources.map(({ id }) => id), issues);

  sameIdSet("wall3dById", "Wall", project.wall3dById, scene.walls.map(({ id }) => id), issues);
  for (const wall of scene.walls) {
    const vertical = project.wall3dById[wall.id];
    if (vertical) checkVertical(`wall3dById.${wall.id}`, "Wall", vertical, room3d.heightM, MIN_WALL_VERTICAL_EXTENT_M, issues);
  }

  sameIdSet("portal3dById", "Portal", project.portal3dById, scene.portals.map(({ id }) => id), issues);
  for (const portal of scene.portals) {
    const vertical = project.portal3dById[portal.id];
    if (vertical) checkVertical(`portal3dById.${portal.id}`, "Portal", vertical, room3d.heightM, MIN_PORTAL_VERTICAL_EXTENT_M, issues);
  }

  const primitiveIds = new Set<string>();
  for (const [index, primitive] of project.primitives.entries()) {
    const path = `primitives.${index}`;
    if (primitiveIds.has(primitive.id)) issues.push({ path: `${path}.id`, message: `Basic shape ID must be unique: ${primitive.id}.` });
    primitiveIds.add(primitive.id);
    if (!MATERIAL_IDS.has(primitive.materialId)) {
      issues.push({ path: `${path}.materialId`, message: `Unknown material ID: ${primitive.materialId}.` });
    }
    const { x, y, z } = primitive.dimensions;
    if (x < MIN_PRIMITIVE_DIMENSION_M || y < MIN_PRIMITIVE_DIMENSION_M || z < MIN_PRIMITIVE_DIMENSION_M ||
        x > room3d.widthM || y > room3d.heightM || z > room3d.depthM) {
      issues.push({
        path: `${path}.dimensions`,
        message: `Basic shape dimensions must be at least ${MIN_PRIMITIVE_DIMENSION_M.toFixed(2)} m and fit the room.`,
      });
      continue;
    }
    // A valid shape is a fixed point of the editor's own room constraint.
    const constrained = constrainPrimitiveToRoom(primitive, room3d);
    const fits = (["x", "y", "z"] as const).every((axis) =>
      near(constrained.position[axis], primitive.position[axis]) &&
      near(constrained.dimensions[axis], primitive.dimensions[axis]));
    if (!fits) issues.push({ path, message: "Basic shape extents must remain inside the room." });
  }

  return issues;
}
