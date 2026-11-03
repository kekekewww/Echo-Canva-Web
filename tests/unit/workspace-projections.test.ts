import { describe, expect, it } from "vitest";

import { createDefaultHybridProject } from "@/domain/workspace/defaults";
import { projectReducer } from "@/domain/workspace/project-reducer";
import {
  createProjectProjectionCache,
  projectClassicScene,
  projectHybridDocument,
} from "@/domain/workspace/projections";

describe("workspace engine projections", () => {
  it("projects exactly one active listener into the legacy scene contract", () => {
    const added = projectReducer(createDefaultHybridProject(), {
      type: "ADD_LISTENER",
      listener: {
        id: "listener_b",
        name: "Listener B",
        position: { x: 7, y: 1.8, z: 2.5 },
        headingDeg: 30,
        enabled: true,
      },
    });

    const scene = projectClassicScene(added);

    expect(scene.listener).toEqual({ position: { x: 7, y: 2.5 }, headingDeg: 30 });
    expect(scene).not.toBe(added.scene);
  });

  it("omits disabled walls and their hosted portals without deleting authoring data", () => {
    const project = createDefaultHybridProject();
    const wallId = project.scene.walls.find(({ kind }) => kind === "partition")!.id;
    const disabled = projectReducer(project, {
      type: "SET_ENTITY_ENABLED",
      entity: { type: "wall", id: wallId },
      enabled: false,
    });

    const scene = projectClassicScene(disabled);

    expect(disabled.scene.walls.some(({ id }) => id === wallId)).toBe(true);
    expect(scene.walls.some(({ id }) => id === wallId)).toBe(false);
    expect(scene.portals.some(({ wallId: hostId }) => hostId === wallId)).toBe(false);
  });

  it("projects room dimensions and vertical poses into a valid Hybrid document", () => {
    const project = createDefaultHybridProject();
    const document = projectHybridDocument(project);

    expect(document.documentVersion).toBe("2.0");
    expect(document.baseScene.room.outerPolygon).toEqual([
      { x: 0, y: 0 },
      { x: 12, y: 0 },
      { x: 12, y: 8 },
      { x: 0, y: 8 },
    ]);
    expect(document.baseScene.room.heightM).toBe(3);
    expect(document.extensions.spatial3d?.listenerHeightM).toBe(1.5);
  });
});

describe("workspace projection cache (#24)", () => {
  it("returns the same scene object for presentation-only changes", () => {
    const project = createDefaultHybridProject();
    const projectScene = createProjectProjectionCache(projectClassicScene);
    const scene = projectScene(project);

    const panned = projectReducer(project, {
      type: "SET_VIEW_STATE",
      changes: { camera: { ...project.view.camera, zoom: project.view.camera.zoom * 2 } },
    });
    const wall = project.scene.walls[0]!;
    const selected = projectReducer(panned, { type: "SELECT_ENTITY", selection: { type: "wall", id: wall.id } });

    expect(panned).not.toBe(project);
    expect(selected.revision).toBe(project.revision);
    expect(projectScene(panned)).toBe(scene);
    expect(projectScene(selected)).toBe(scene);
    expect(scene).toEqual(projectClassicScene(selected));
  });

  it("recomputes after an acoustic edit", () => {
    const project = createDefaultHybridProject();
    const projectScene = createProjectProjectionCache(projectClassicScene);
    const scene = projectScene(project);
    const source = project.scene.sources[0]!;

    const moved = projectReducer(project, {
      type: "MOVE_SOURCE",
      id: source.id,
      position: { x: source.position.x + 0.5, y: 1.5, z: source.position.y },
    });

    const next = projectScene(moved);
    expect(next).not.toBe(scene);
    expect(next).toEqual(projectClassicScene(moved));
  });

  it("recomputes when content changes under a reused revision number (undo/redo, imports)", () => {
    const project = createDefaultHybridProject();
    const projectScene = createProjectProjectionCache(projectClassicScene);
    const scene = projectScene(project);
    const replacedScene = structuredClone(project.scene);
    replacedScene.sources[0]!.gainDb -= 6;
    const sameRevision = { ...project, scene: replacedScene };

    expect(sameRevision.revision).toBe(project.revision);
    expect(projectScene(sameRevision)).not.toBe(scene);
    expect(projectScene(sameRevision).sources[0]!.gainDb).toBe(replacedScene.sources[0]!.gainDb);
  });

  it("keeps the Hybrid document stable across camera changes and rebuilds it for 3D room edits", () => {
    const project = createDefaultHybridProject();
    const projectDocument = createProjectProjectionCache(projectHybridDocument);
    const document = projectDocument(project);

    const panned = projectReducer(project, {
      type: "SET_VIEW_STATE",
      changes: { camera: { ...project.view.camera, zoom: project.view.camera.zoom * 2 } },
    });
    expect(projectDocument(panned)).toBe(document);

    const taller = projectReducer(panned, { type: "SET_ROOM_3D", changes: { heightM: project.room3d.heightM + 0.5 } });
    const rebuilt = projectDocument(taller);
    expect(rebuilt).not.toBe(document);
    expect(rebuilt).toEqual(projectHybridDocument(taller));
  });
});
