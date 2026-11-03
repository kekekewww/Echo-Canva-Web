import type { EntityRef, ProjectAction, WorkspaceProject } from "@/domain/workspace/types";

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
