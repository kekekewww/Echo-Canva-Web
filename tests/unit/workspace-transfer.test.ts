import { describe, expect, it } from "vitest";

import { createDefaultClassicProject, createDefaultHybridProject } from "@/domain/workspace/defaults";
import { constrainWall3D, resizeRoomAndClamp } from "@/domain/workspace/geometry-constraints";
import { createHistory, reduceWithHistory } from "@/domain/workspace/history";
import { projectReducer } from "@/domain/workspace/project-reducer";
import {
  parseWorkspaceProject,
  serializeWorkspaceProject,
} from "@/domain/workspace/transfer";

type Vec3Json = { x: number; y: number; z: number };
type VerticalJson = { bottomM: number; topM: number; thicknessM: number };
/** Mutable view of the exported project JSON used to build malformed imports. */
type ProjectJson = {
  room3d: { widthM: number; heightM: number; floorMaterialId: string };
  scene: { room: { heightM: number } };
  sourceHeightsM: Record<string, number>;
  wall3dById: Record<string, VerticalJson>;
  portal3dById: Record<string, VerticalJson>;
  primitives: { position: Vec3Json; dimensions: Vec3Json; materialId: string }[];
};

describe("workspace authoring transfer", () => {
  it("round-trips listeners, disabled entities, view state and local metadata", () => {
    const initial = createDefaultHybridProject();
    const project = {
      ...initial,
      disabledEntityIds: [initial.scene.walls[0]!.id, "ceiling"],
      view: {
        ...initial.view,
        camera: { yawDeg: 90, pitchDeg: 35, zoom: 1.25, panX: 40, panY: -20 },
      },
    };
    const json = serializeWorkspaceProject(project, [{
      id: "local_voice",
      name: "voice.wav",
      mimeType: "audio/wav",
      size: 128,
      createdAt: 1,
    }]);
    const parsed = parseWorkspaceProject(json, "hybrid-3d", new Set(["local_voice"]));

    expect(parsed.project).toEqual({
      ...project,
      localAudioMetadata: {
        local_voice: expect.objectContaining({ id: "local_voice", name: "voice.wav" }),
      },
    });
    expect(parsed.localAssets).toEqual([expect.objectContaining({ id: "local_voice", name: "voice.wav" })]);
  });

  it("retains a source transform and marks an unavailable imported local asset for relinking", () => {
    const initial = createDefaultHybridProject();
    const source = { ...initial.scene.sources[0]!, clipId: "local_missing", position: { x: 7.25, y: 4.5 } };
    const project = {
      ...initial,
      scene: { ...initial.scene, sources: [source] },
      sourceHeightsM: { [source.id]: initial.sourceHeightsM[source.id]! },
    };
    const json = serializeWorkspaceProject(project, [{
      id: "local_missing",
      name: "missing.ogg",
      mimeType: "audio/ogg",
      size: 512,
      createdAt: 2,
    }]);

    const parsed = parseWorkspaceProject(json, "hybrid-3d", new Set());

    expect(parsed.project.scene.sources[0]?.position).toEqual({ x: 7.25, y: 4.5 });
    expect(parsed.project.missingAudioAssetIds).toEqual(["local_missing"]);
  });

  it("rejects importing one mode into the other without conversion", () => {
    const json = serializeWorkspaceProject(createDefaultHybridProject(), []);
    expect(() => parseWorkspaceProject(json, "classic-2d5d", new Set())).toThrow(/3D project/i);
  });

  describe("spatial geometry invariants", () => {
    const box = {
      id: "box_1",
      name: "Box",
      kind: "box",
      position: { x: 4, y: 0.5, z: 3 },
      dimensions: { x: 1, y: 1, z: 1 },
      rotationYDeg: 30,
      materialId: "wood_medium",
    } as const;

    /** Valid exported Hybrid project with a basic shape, mutated through `mutate` after export. */
    function exportedJson(mutate: (project: ProjectJson) => void): string {
      const project = projectReducer(createDefaultHybridProject(), { type: "ADD_PRIMITIVE", primitive: box });
      const envelope = JSON.parse(serializeWorkspaceProject(project, [])) as { project: ProjectJson };
      mutate(envelope.project);
      return JSON.stringify(envelope);
    }

    const firstWallId = createDefaultHybridProject().scene.walls[0]!.id;
    const firstPortalId = createDefaultHybridProject().scene.portals[0]!.id;
    const firstSourceId = createDefaultHybridProject().scene.sources[0]!.id;

    it("accepts the unmutated export", () => {
      expect(() => parseWorkspaceProject(exportedJson(() => {}), "hybrid-3d", new Set())).not.toThrow();
    });

    it.each([
      ["inverted Wall vertical bounds", (p: ProjectJson) => { p.wall3dById[firstWallId] = { ...p.wall3dById[firstWallId], bottomM: 5, topM: -1 }; }, /Wall vertical bounds/],
      ["negative Wall thickness", (p: ProjectJson) => { p.wall3dById[firstWallId].thicknessM = -1; }, /Wall thickness/],
      ["issue reproduction (bottom 5, top -1, thickness -1)", (p: ProjectJson) => { p.wall3dById[firstWallId] = { bottomM: 5, topM: -1, thicknessM: -1 }; }, /Wall thickness/],
      ["Wall above the room ceiling", (p: ProjectJson) => { p.wall3dById[firstWallId].topM = p.room3d.heightM + 0.5; }, /Wall vertical bounds/],
      ["Wall shorter than 0.10 m", (p: ProjectJson) => { p.wall3dById[firstWallId] = { ...p.wall3dById[firstWallId], bottomM: 1, topM: 1.05 }; }, /Wall vertical bounds/],
      ["Wall settings for an unknown Wall", (p: ProjectJson) => { p.wall3dById.ghost_wall = { bottomM: 0, topM: 2, thicknessM: 0.2 }; }, /unknown Wall: ghost_wall/],
      ["missing Wall settings", (p: ProjectJson) => { delete p.wall3dById[firstWallId]; }, /missing its 3D settings/],
      ["Portal shorter than 0.40 m", (p: ProjectJson) => { p.portal3dById[firstPortalId] = { ...p.portal3dById[firstPortalId], bottomM: 1, topM: 1.2 }; }, /Portal vertical bounds/],
      ["negative Portal thickness", (p: ProjectJson) => { p.portal3dById[firstPortalId].thicknessM = -1; }, /Portal thickness/],
      ["Portal settings for an unknown Portal", (p: ProjectJson) => { p.portal3dById.ghost_portal = { bottomM: 0, topM: 2, thicknessM: 0.12 }; }, /unknown Portal/],
      ["source height for an unknown source", (p: ProjectJson) => { p.sourceHeightsM.ghost_source = 1; }, /unknown Source/],
      ["missing source height", (p: ProjectJson) => { delete p.sourceHeightsM[firstSourceId]; }, /missing its 3D settings/],
      ["negative primitive dimension", (p: ProjectJson) => { p.primitives[0].dimensions.x = -1; }, /dimensions must be at least 0.10 m/],
      ["primitive larger than the room", (p: ProjectJson) => { p.primitives[0].dimensions.y = p.room3d.heightM + 1; }, /fit the room/],
      ["primitive outside the room", (p: ProjectJson) => { p.primitives[0].position.x = -5; }, /inside the room/],
      ["unknown primitive material", (p: ProjectJson) => { p.primitives[0].materialId = "unobtainium"; }, /Unknown material ID: unobtainium/],
      ["duplicate primitive ID", (p: ProjectJson) => { p.primitives.push(structuredClone(p.primitives[0])); }, /unique/],
      ["unknown floor material", (p: ProjectJson) => { p.room3d.floorMaterialId = "unobtainium"; }, /Unknown material ID/],
      ["room height diverging from the base scene", (p: ProjectJson) => { p.room3d.heightM = p.scene.room.heightM + 1; }, /Room height must match/],
      ["room plan below 1 m", (p: ProjectJson) => { p.room3d.widthM = 0.5; }, /Room width\/depth/],
    ])("rejects %s with a useful error", (_label, mutate, message) => {
      const json = exportedJson(mutate);
      expect(() => parseWorkspaceProject(json, "hybrid-3d", new Set())).toThrow(/invalid 3D geometry/);
      expect(() => parseWorkspaceProject(json, "hybrid-3d", new Set())).toThrow(message);
    });

    it("leaves active project state and history unchanged when an import is rejected", () => {
      const initial = createDefaultHybridProject();
      const history = reduceWithHistory(createHistory(initial), { type: "ADD_PRIMITIVE", primitive: box } as const, projectReducer);
      const snapshot = structuredClone(history);
      const json = exportedJson((p) => { p.wall3dById[firstWallId] = { bottomM: 5, topM: -1, thicknessM: -1 }; });

      let next = history;
      try {
        const imported = parseWorkspaceProject(json, "hybrid-3d", new Set());
        next = reduceWithHistory(history, { type: "REPLACE_PROJECT", project: imported.project } as const, projectReducer);
      } catch {
        // The import UI reports the error and does not dispatch REPLACE_PROJECT.
      }

      expect(next).toBe(history);
      expect(history).toEqual(snapshot);
    });

    it("accepts projects produced by the editor's own constraint helpers", () => {
      const initial = projectReducer(createDefaultHybridProject(), { type: "ADD_PRIMITIVE", primitive: { ...box, rotationYDeg: 45, dimensions: { x: 3, y: 2, z: 1 } } });
      const wall = initial.scene.walls.find(({ id }) => id === initial.scene.portals[0]!.wallId)!;
      const raised = constrainWall3D(initial, wall.id, { a: wall.a, b: wall.b, bottomM: 0.2, topM: 2.8, thicknessM: 0.3 });
      expect(raised.ok).toBe(true);
      if (!raised.ok) return;
      const resized = resizeRoomAndClamp(raised.project, { ...raised.project.room3d, widthM: 9, depthM: 6, heightM: 2.5 });
      expect(resized.ok).toBe(true);
      if (!resized.ok) return;

      const parsed = parseWorkspaceProject(serializeWorkspaceProject(resized.project, []), "hybrid-3d", new Set());
      expect(parsed.project.wall3dById).toEqual(resized.project.wall3dById);
      expect(parsed.project.primitives).toEqual(resized.project.primitives);
    });

    it("validates Classic authoring exports with the same invariants", () => {
      const project = createDefaultClassicProject();
      expect(() => parseWorkspaceProject(serializeWorkspaceProject(project, []), "classic-2d5d", new Set())).not.toThrow();
      const envelope = JSON.parse(serializeWorkspaceProject(project, [])) as { project: ProjectJson };
      envelope.project.wall3dById[firstWallId].thicknessM = -1;
      expect(() => parseWorkspaceProject(JSON.stringify(envelope), "classic-2d5d", new Set())).toThrow(/Wall thickness/);
    });
  });
});
