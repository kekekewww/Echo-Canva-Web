import { describe, expect, it } from "vitest";

import { createDefaultClassicProject } from "@/domain/workspace/defaults";
import {
  addAvailabilityFor,
  cascadedPortalCount,
  deleteActionFor,
  describeEntity,
  describeEntityType,
  entityExists,
  WORKSPACE_LIMITS,
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

describe("add availability", () => {
  const project = createDefaultClassicProject();
  const wall = project.scene.walls[0]!;

  it("allows each kind below its limit and needs an enabled selected Wall for a Portal", () => {
    const none = addAvailabilityFor({ ...project, selection: null });
    expect(none.listener).toEqual({ enabled: true });
    expect(none.box).toEqual({ enabled: true });
    expect(none.portal).toEqual({ enabled: false, reason: "Select an enabled Wall first" });
    const hosted = addAvailabilityFor({ ...project, selection: { type: "wall", id: wall.id } });
    expect(hosted.portal).toEqual({ enabled: true });
    const disabledHost = addAvailabilityFor({ ...project, selection: { type: "wall", id: wall.id }, disabledEntityIds: [wall.id] });
    expect(disabledHost.portal?.enabled).toBe(false);
  });

  it("counts disabled entities toward the limits and names the limit", () => {
    const sources = Array.from({ length: WORKSPACE_LIMITS.sources }, (_, index) => ({ ...project.scene.sources[0]!, id: `s${index}` }));
    const full = addAvailabilityFor({
      ...project,
      scene: { ...project.scene, sources },
      disabledEntityIds: sources.map(({ id }) => id),
    });
    expect(full.source).toEqual({ enabled: false, reason: `Limit: ${WORKSPACE_LIMITS.sources} sources` });
    expect(WORKSPACE_LIMITS).toEqual({ listeners: 8, sources: 4, walls: 100, portals: 8, primitives: 8 });
  });
});
