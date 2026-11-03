import { describe, expect, it } from "vitest";

import {
  CLASSIC_PROJECT_KEY,
  HYBRID_PROJECT_KEY,
  loadWorkspaceCache,
  saveWorkspaceCache,
} from "@/domain/workspace/persistence";
import { createHistory, reduceWithHistory } from "@/domain/workspace/history";
import { createSceneDocumentV2 } from "@/domain/scene-document/serialize";
import { projectReducer } from "@/domain/workspace/project-reducer";
import {
  createDefaultClassicProject,
  createDefaultHybridProject,
} from "@/domain/workspace/defaults";

class MemoryStorage implements Storage {
  private readonly records = new Map<string, string>();
  get length() { return this.records.size; }
  clear() { this.records.clear(); }
  getItem(key: string) { return this.records.get(key) ?? null; }
  key(index: number) { return [...this.records.keys()][index] ?? null; }
  removeItem(key: string) { this.records.delete(key); }
  setItem(key: string, value: string) { this.records.set(key, value); }
}

describe("workspace persistence", () => {
  it("loads independent defaults from empty storage", () => {
    const storage = new MemoryStorage();
    const classic = loadWorkspaceCache(storage, "classic-2d5d");
    const hybrid = loadWorkspaceCache(storage, "hybrid-3d");

    expect(classic.project).toEqual(createDefaultClassicProject());
    expect(hybrid.project).toEqual(createDefaultHybridProject());
    expect(classic.persistenceAvailable).toBe(true);
    expect(hybrid.persistenceAvailable).toBe(true);
  });

  it("round-trips each project under a separate versioned key", () => {
    const storage = new MemoryStorage();
    const hybrid = createDefaultHybridProject();
    const result = saveWorkspaceCache(storage, "hybrid-3d", hybrid);

    expect(result.ok).toBe(true);
    expect(storage.getItem(HYBRID_PROJECT_KEY)).not.toBeNull();
    expect(storage.getItem(CLASSIC_PROJECT_KEY)).toBeNull();
    expect(loadWorkspaceCache(storage, "hybrid-3d").project).toEqual(hybrid);
  });

  it("round-trips bounded undo history and per-mode viewport state", () => {
    const storage = new MemoryStorage();
    const initial = createDefaultHybridProject();
    const project = {
      ...initial,
      view: {
        ...initial.view,
        camera: { yawDeg: 123, pitchDeg: 41, zoom: 1.4, panX: 86, panY: -44 },
        overlays: { pathsVisible: false, showAllPaths: true, ceilingVisible: false },
      },
    };
    const history = reduceWithHistory(createHistory(project), {
      type: "UPDATE_LISTENER",
      id: project.activeListenerId,
      changes: { headingDeg: 45 },
    }, projectReducer);

    expect(saveWorkspaceCache(storage, "hybrid-3d", history).ok).toBe(true);
    const restored = loadWorkspaceCache(storage, "hybrid-3d");

    expect(restored.history.present.view).toEqual(project.view);
    expect(restored.history.past.length).toBeLessThanOrEqual(50);
    expect(JSON.parse(storage.getItem(HYBRID_PROJECT_KEY)!).cacheVersion).toBe("3.0");
    expect(JSON.parse(storage.getItem(HYBRID_PROJECT_KEY)!).past[0]).toMatchObject({ operations: expect.any(Array) });
  });

  it("adds a neutral pan to projects cached before viewport panning existed", () => {
    const storage = new MemoryStorage();
    const legacyProject = structuredClone(createDefaultHybridProject()) as unknown as {
      view: { camera: Record<string, number> };
    };
    delete legacyProject.view.camera.panX;
    delete legacyProject.view.camera.panY;
    storage.setItem(HYBRID_PROJECT_KEY, JSON.stringify({
      cacheVersion: "3.0",
      mode: "hybrid-3d",
      present: legacyProject,
      past: [],
      future: [],
    }));

    const restored = loadWorkspaceCache(storage, "hybrid-3d");

    expect(restored.project.view.camera).toMatchObject({ panX: 0, panY: 0 });
    expect(restored.warning).toBeNull();
  });

  it("migrates projects cached before acoustic primitives existed", () => {
    const storage = new MemoryStorage();
    const legacyProject = structuredClone(createDefaultHybridProject()) as unknown as { primitives?: unknown[] };
    delete legacyProject.primitives;
    storage.setItem(HYBRID_PROJECT_KEY, JSON.stringify({
      cacheVersion: "3.0",
      mode: "hybrid-3d",
      present: legacyProject,
      past: [],
      future: [],
    }));

    expect(loadWorkspaceCache(storage, "hybrid-3d").project.primitives).toEqual([]);
  });

  it("migrates legacy snapshot history into compact patches", () => {
    const storage = new MemoryStorage();
    const before = createDefaultClassicProject();
    const after = projectReducer(before, {
      type: "UPDATE_LISTENER",
      id: before.activeListenerId,
      changes: { position: { x: 4, y: 1.5, z: 2 } },
    });
    storage.setItem(CLASSIC_PROJECT_KEY, JSON.stringify({
      cacheVersion: "2.0",
      mode: "classic-2d5d",
      present: after,
      past: [before],
      future: [],
    }));

    const restored = loadWorkspaceCache(storage, "classic-2d5d");

    expect(restored.history.past).toHaveLength(1);
    expect(restored.history.past[0]).toMatchObject({ operations: expect.any(Array) });
    expect(restored.warning).toContain("migrated");
  });

  it("migrates a bare Classic SceneSpec into the authoring store", () => {
    const storage = new MemoryStorage();
    const scene = structuredClone(createDefaultClassicProject().scene);
    scene.name = "Migrated Classic";
    storage.setItem(CLASSIC_PROJECT_KEY, JSON.stringify(scene));

    const restored = loadWorkspaceCache(storage, "classic-2d5d");

    expect(restored.project.scene.name).toBe("Migrated Classic");
    expect(restored.project.schemaVersion).toBe("2.0");
    expect(restored.warning).toContain("migrated");
  });

  it("migrates a v2 Hybrid scene document into the authoring store", () => {
    const storage = new MemoryStorage();
    const initial = createDefaultHybridProject();
    const document = createSceneDocumentV2(initial.scene, {
      spatial3d: {
        coordinateSystem: "x-right-y-up-z-forward",
        floorElevationM: 0,
        listenerHeightM: 1.7,
        sourceHeightsM: Object.fromEntries(initial.scene.sources.map(({ id }) => [id, 1.2])),
      },
    });
    storage.setItem(HYBRID_PROJECT_KEY, JSON.stringify(document));

    const restored = loadWorkspaceCache(storage, "hybrid-3d");

    expect(restored.project.listeners[0]?.position.y).toBe(1.7);
    expect(Object.values(restored.project.sourceHeightsM)).toEqual(expect.arrayContaining([1.2]));
    expect(restored.warning).toContain("migrated");
  });

  it("falls back without overwriting an unreadable cached record", () => {
    const storage = new MemoryStorage();
    storage.setItem(CLASSIC_PROJECT_KEY, "{broken");

    const result = loadWorkspaceCache(storage, "classic-2d5d");

    expect(result.project).toEqual(createDefaultClassicProject());
    expect(result.warning).toContain("could not be restored");
    expect(result.recoveryRaw).toBe("{broken");
    expect(storage.getItem(CLASSIC_PROJECT_KEY)).toBe("{broken");
  });

  it("rejects a cached project with invalid spatial geometry and keeps the raw record for recovery", () => {
    const storage = new MemoryStorage();
    const project = structuredClone(createDefaultHybridProject()) as unknown as { wall3dById: Record<string, unknown>; scene: { walls: { id: string }[] } };
    project.wall3dById[project.scene.walls[0]!.id] = { bottomM: 5, topM: -1, thicknessM: -1 };
    const raw = JSON.stringify({ cacheVersion: "3.0", mode: "hybrid-3d", present: project, past: [], future: [] });
    storage.setItem(HYBRID_PROJECT_KEY, raw);

    const restored = loadWorkspaceCache(storage, "hybrid-3d");

    expect(restored.project).toEqual(createDefaultHybridProject());
    expect(restored.recoveryRaw).toBe(raw);
    expect(restored.warning).toContain("could not be restored");
  });

  it("rejects cached history whose patches reach an invalid spatial state", () => {
    const storage = new MemoryStorage();
    const present = createDefaultHybridProject();
    const wallId = present.scene.walls[0]!.id;
    storage.setItem(HYBRID_PROJECT_KEY, JSON.stringify({
      cacheVersion: "3.0",
      mode: "hybrid-3d",
      present,
      past: [{ operations: [{
        kind: "value",
        path: ["wall3dById", wallId, "thicknessM"],
        beforeExists: true,
        before: -1,
        afterExists: true,
        after: present.wall3dById[wallId]!.thicknessM,
      }] }],
      future: [],
    }));

    const restored = loadWorkspaceCache(storage, "hybrid-3d");

    expect(restored.history.past).toHaveLength(0);
    expect(restored.warning).toContain("could not be restored");
  });
});

