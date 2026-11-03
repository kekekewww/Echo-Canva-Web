import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { computeAcousticFrame } from "@/acoustics/compute-frame";
import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { validateScene } from "@/domain/scene/validate";
import { validateSceneDocument } from "@/domain/scene-document/validate";
import { projectClassicScene, projectHybridDocument } from "@/domain/workspace/projections";
import { parseWorkspaceProject } from "@/domain/workspace/transfer";
import type { WorkspaceMode, WorkspaceProject } from "@/domain/workspace/types";

// Fixtures for docs/tutorials/portal-walkthrough.md, exported from the workbench's
// "Export authoring JSON" action after loading the Concrete Partition preset.
const FIXTURES: ReadonlyArray<Readonly<{ file: string; mode: WorkspaceMode; other: WorkspaceMode }>> = [
  { file: "concrete-partition-classic.authoring.json", mode: "classic-2d5d", other: "hybrid-3d" },
  { file: "concrete-partition-hybrid.authoring.json", mode: "hybrid-3d", other: "classic-2d5d" },
];

function readFixture(file: string): string {
  return readFileSync(join(process.cwd(), "docs/tutorials/fixtures", file), "utf8");
}

function radioRoute(project: WorkspaceProject, listener: Readonly<{ x: number; y: number }>) {
  const scene = projectClassicScene(project);
  const frame = computeAcousticFrame({ ...scene, listener: { ...scene.listener, position: listener } });
  return frame.sources.find(({ sourceId }) => sourceId === "radio")!;
}

describe.each(FIXTURES)("portal walkthrough fixture $file", ({ file, mode, other }) => {
  const json = readFixture(file);

  it("imports through parseWorkspaceProject without local audio or relinking", () => {
    const { project, localAssets } = parseWorkspaceProject(json, mode, new Set());

    expect(project.mode).toBe(mode);
    expect(localAssets).toEqual([]);
    expect(project.localAudioMetadata).toEqual({});
    expect(project.missingAudioAssetIds).toEqual([]);
    expect(project.listeners).toHaveLength(1);
    expect(project.activeListenerId).toBe(project.listeners[0]!.id);
  });

  it("is rejected by the other editor mode", () => {
    expect(() => parseWorkspaceProject(json, other, new Set())).toThrow(/cannot be imported into this mode/);
  });

  it("keeps the unchanged Concrete Partition geometry, portal and sources", () => {
    const { project } = parseWorkspaceProject(json, mode, new Set());
    // Loading a preset bumps the scene revision; everything else must equal the preset.
    expect({ ...project.scene, revision: CONCRETE_PARTITION_PRESET.revision }).toEqual(CONCRETE_PARTITION_PRESET);
    expect(validateScene(projectClassicScene(project)).ok).toBe(true);
    if (mode === "hybrid-3d") expect(validateSceneDocument(projectHybridDocument(project)).ok).toBe(true);
  });

  it("matches the Classic route states the walkthrough asks readers to observe", () => {
    const { project } = parseWorkspaceProject(json, mode, new Set());
    const closed = {
      ...project,
      scene: {
        ...project.scene,
        portals: project.scene.portals.map((portal) => ({ ...portal, open: false })),
      },
    };

    // Listener positions in metres, plan coordinates (x, y) = inspector (X, Z).
    expect(radioRoute(project, { x: 3, y: 4 }).routeType).toBe("direct");
    const portal = radioRoute(project, { x: 3, y: 2 });
    expect(portal.routeType).toBe("portal");
    expect(portal.portalIds.at(-1)).toBe("partition_door");
    expect(portal.virtualPosition).toEqual({ x: 6, y: 4 });
    expect(radioRoute(closed, { x: 3, y: 2 }).routeType).toBe("blocked");
  });
});
