import { describe, expect, it } from "vitest";

import { createDefaultClassicProject } from "@/domain/workspace/defaults";
import {
  cascadedPortalCount,
  deleteActionFor,
  describeEntity,
  describeEntityType,
  entityExists,
} from "@/domain/workspace/entities";
import { projectReducer } from "@/domain/workspace/project-reducer";

describe("workspace entity helpers", () => {
  const project = createDefaultClassicProject();
  const wall = project.scene.walls.find(({ id }) => project.scene.portals.some(({ wallId }) => wallId === id))!;

  it("names entities the way the Outliner does", () => {
    expect(describeEntity(project, { type: "source", id: project.scene.sources[0]!.id })).toBe(project.scene.sources[0]!.name);
    expect(describeEntity(project, { type: "wall", id: wall.id })).toBe(wall.id.replaceAll("_", " "));
    expect(describeEntity(project, { type: "surface", id: "room" })).toBe("Room");
    expect(describeEntityType(project, { type: "wall", id: wall.id })).toBe("Wall");
  });

  it("maps deletable entities to their delete action and refuses surfaces", () => {
    expect(deleteActionFor({ type: "wall", id: wall.id })).toEqual({ type: "DELETE_WALL", id: wall.id });
    expect(deleteActionFor({ type: "surface", id: "floor" })).toBeNull();
  });

  it("counts Portals that a wall delete cascades to, and the reducer removes them with one revision step", () => {
    const portals = cascadedPortalCount(project, { type: "wall", id: wall.id });
    expect(portals).toBeGreaterThan(0);
    const next = projectReducer(project, deleteActionFor({ type: "wall", id: wall.id })!);
    expect(entityExists(next, { type: "wall", id: wall.id })).toBe(false);
    expect(next.scene.portals.filter(({ wallId }) => wallId === wall.id)).toHaveLength(0);
    // The Undo toast relies on a successful delete advancing the revision by exactly one.
    expect(next.revision).toBe(project.revision + 1);
  });
});
