import { MAX_PRIMITIVES } from "@/domain/workspace/primitives";
import type { EntityRef, PrimitiveKind, ProjectAction, WorkspaceProject } from "@/domain/workspace/types";

/** Documented per-project limits, as the UI reports and enforces them before dispatching an add. */
export const WORKSPACE_LIMITS = Object.freeze({
  listeners: 8,
  sources: 4,
  walls: 100,
  portals: 8,
  primitives: MAX_PRIMITIVES,
});

export type AddableKind = "listener" | "source" | "wall" | "portal" | PrimitiveKind;
export type AddAvailability = Partial<Record<AddableKind, Readonly<{ enabled: boolean; reason?: string }>>>;

/**
 * Whether each kind can be added now, with the reason when it cannot. Shared by the toolbar Add menu, the
 * Outliner group buttons and the Inspector so they never disagree. Counts include disabled entities, because
 * the limits do.
 */
export function addAvailabilityFor(project: WorkspaceProject): AddAvailability {
  const limit = (count: number, max: number, reason: string) => count < max
    ? { enabled: true }
    : { enabled: false, reason };
  const shape = limit(project.primitives.length, WORKSPACE_LIMITS.primitives, `Limit: ${WORKSPACE_LIMITS.primitives} shapes`);
  const hostSelected = project.selection?.type === "wall" && !project.disabledEntityIds.includes(project.selection.id);
  return {
    listener: limit(project.listeners.length, WORKSPACE_LIMITS.listeners, `Limit: ${WORKSPACE_LIMITS.listeners} listeners`),
    source: limit(project.scene.sources.length, WORKSPACE_LIMITS.sources, `Limit: ${WORKSPACE_LIMITS.sources} sources`),
    wall: limit(project.scene.walls.length, WORKSPACE_LIMITS.walls, `Limit: ${WORKSPACE_LIMITS.walls} walls`),
    portal: project.scene.portals.length >= WORKSPACE_LIMITS.portals
      ? { enabled: false, reason: `Limit: ${WORKSPACE_LIMITS.portals} Portals` }
      : hostSelected ? { enabled: true } : { enabled: false, reason: "Select an enabled Wall first" },
    box: shape,
    cylinder: shape,
    sphere: shape,
  };
}

/** Human-readable name of a project entity, as shown in the Outliner and Inspector header. */
export function describeEntity(project: WorkspaceProject, entity: EntityRef): string {
  switch (entity.type) {
    case "listener": return project.listeners.find(({ id }) => id === entity.id)?.name ?? "Listener";
    case "source": return project.scene.sources.find(({ id }) => id === entity.id)?.name ?? "Source";
    case "primitive": return project.primitives.find(({ id }) => id === entity.id)?.name ?? "Shape";
    case "wall":
    case "portal": return entity.id.replaceAll("_", " ");
    case "surface": return entity.id === "room" ? "Room" : entity.id === "floor" ? "Floor" : "Ceiling";
  }
}

/** Display name of an entity's type ("Wall", "Box", …). */
export function describeEntityType(project: WorkspaceProject, entity: EntityRef): string {
  if (entity.type === "primitive") {
    const kind = project.primitives.find(({ id }) => id === entity.id)?.kind ?? "shape";
    return kind[0]!.toUpperCase() + kind.slice(1);
  }
  if (entity.type === "surface") return entity.id === "room" ? "Room" : "Surface";
  return entity.type[0]!.toUpperCase() + entity.type.slice(1);
}

export function entityExists(project: WorkspaceProject, entity: EntityRef): boolean {
  switch (entity.type) {
    case "listener": return project.listeners.some(({ id }) => id === entity.id);
    case "source": return project.scene.sources.some(({ id }) => id === entity.id);
    case "wall": return project.scene.walls.some(({ id }) => id === entity.id);
    case "portal": return project.scene.portals.some(({ id }) => id === entity.id);
    case "primitive": return project.primitives.some(({ id }) => id === entity.id);
    case "surface": return true;
  }
}

/** The delete action for an entity; surfaces (room, floor, ceiling) cannot be deleted. */
export function deleteActionFor(entity: EntityRef): ProjectAction | null {
  switch (entity.type) {
    case "listener": return { type: "DELETE_LISTENER", id: entity.id };
    case "source": return { type: "DELETE_SOURCE", id: entity.id };
    case "wall": return { type: "DELETE_WALL", id: entity.id };
    case "portal": return { type: "DELETE_PORTAL", id: entity.id };
    case "primitive": return { type: "DELETE_PRIMITIVE", id: entity.id };
    case "surface": return null;
  }
}

/** Portals removed together with a wall (DELETE_WALL cascades to hosted Portals). */
export function cascadedPortalCount(project: WorkspaceProject, entity: EntityRef): number {
  return entity.type === "wall" ? project.scene.portals.filter(({ wallId }) => wallId === entity.id).length : 0;
}
