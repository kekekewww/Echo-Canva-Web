import { describe, expect, it } from "vitest";

import { compileHybridGeometry } from "@/acoustics/hybrid3d/compile";
import { computeHybridDirectFrame } from "@/acoustics/hybrid3d/direct";
import { resolveHybridAcousticPresentation } from "@/components/workspace/HybridViewportAdapter";
import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { createSceneDocumentV2 } from "@/domain/scene-document/serialize";

describe("Hybrid viewport acoustic presentation", () => {
  it("accepts a matching complete fallback frame for audio and overlays", () => {
    const document = createSceneDocumentV2(CONCRETE_PARTITION_PRESET, {
      spatial3d: {
        coordinateSystem: "x-right-y-up-z-forward",
        floorElevationM: 0,
        listenerHeightM: 1.5,
        sourceHeightsM: { radio: 1.3, rain: 1.5 },
      },
    });
    const geometry = compileHybridGeometry(document);
    const frame = computeHybridDirectFrame(geometry);
    const notice = "Hybrid Worker pool unavailable; using deterministic serial fallback.";

    expect(resolveHybridAcousticPresentation({
      frame,
      staticFingerprint: geometry.staticGeometryHash,
      source: "fallback",
      computeMs: 3,
      completedAtMs: 5,
      requestSequence: 1,
      workerCount: 0,
      sourceComputeMsMax: 0,
      sourceComputeMsTotal: 0,
      notice,
    }, document, geometry.staticGeometryHash)).toEqual({
      accepted: true,
      lagging: false,
      worker: "Fallback",
      headerStatus: `Fallback · ${notice}`,
    });
  });

  it("rejects stale fallback revisions and projection hashes", () => {
    const document = createSceneDocumentV2(CONCRETE_PARTITION_PRESET, {
      spatial3d: {
        coordinateSystem: "x-right-y-up-z-forward",
        floorElevationM: 0,
        listenerHeightM: 1.5,
        sourceHeightsM: { radio: 1.3, rain: 1.5 },
      },
    });
    const geometry = compileHybridGeometry(document);
    const frame = computeHybridDirectFrame(geometry);
    const state = {
      frame,
      staticFingerprint: geometry.staticGeometryHash,
      source: "fallback" as const,
      computeMs: 3,
      completedAtMs: 5,
      requestSequence: 1,
      workerCount: 0,
      sourceComputeMsMax: 0,
      sourceComputeMsTotal: 0,
      notice: "fallback",
    };

    const staleRevision = structuredClone(document);
    staleRevision.baseScene.revision += 1;
    const staleProjection = structuredClone(document);
    (staleProjection.compatibility as { classicProjectionHash: string }).classicProjectionHash = "wrong";

    // A newer revision with the same static geometry and sources is pose-lagging (ADR 0007);
    // a frame for different static geometry is never accepted.
    expect(resolveHybridAcousticPresentation(state, staleRevision, geometry.staticGeometryHash))
      .toMatchObject({ accepted: true, lagging: true, worker: "Fallback" });
    expect(resolveHybridAcousticPresentation(state, staleRevision, "different-geometry").accepted).toBe(false);
    expect(resolveHybridAcousticPresentation(state, staleProjection, geometry.staticGeometryHash).accepted).toBe(false);
  });

  it("adopts a pose-lagging frame only for the same static geometry and ordered sources", () => {
    const document = createSceneDocumentV2(CONCRETE_PARTITION_PRESET, {
      spatial3d: {
        coordinateSystem: "x-right-y-up-z-forward",
        floorElevationM: 0,
        listenerHeightM: 1.5,
        sourceHeightsM: { radio: 1.3, rain: 1.5 },
      },
    });
    const geometry = compileHybridGeometry(document);
    const state = {
      frame: computeHybridDirectFrame(geometry),
      staticFingerprint: geometry.staticGeometryHash,
      source: "worker" as const,
      computeMs: 3,
      completedAtMs: 5,
      requestSequence: 1,
      workerCount: 2,
      sourceComputeMsMax: 2,
      sourceComputeMsTotal: 3,
      notice: null,
    };

    const moved = structuredClone(document);
    moved.baseScene.revision += 1;
    moved.baseScene.sources[0]!.position = { x: 9.5, y: 4 };
    const movedGeometry = compileHybridGeometry(moved);
    expect(movedGeometry.staticGeometryHash).toBe(geometry.staticGeometryHash);
    expect(resolveHybridAcousticPresentation(state, moved, movedGeometry.staticGeometryHash))
      .toEqual({ accepted: true, lagging: true, worker: "Worker", headerStatus: "Worker" });

    const reordered = structuredClone(moved);
    reordered.baseScene.sources.reverse();
    expect(resolveHybridAcousticPresentation(state, reordered, movedGeometry.staticGeometryHash).accepted).toBe(false);

    const removed = structuredClone(moved);
    removed.baseScene.sources.splice(1, 1);
    expect(resolveHybridAcousticPresentation(state, removed, movedGeometry.staticGeometryHash).accepted).toBe(false);

    const rebuilt = structuredClone(moved);
    rebuilt.baseScene.portals = rebuilt.baseScene.portals.map((portal) => ({ ...portal, open: false }));
    const rebuiltGeometry = compileHybridGeometry(rebuilt);
    expect(rebuiltGeometry.staticGeometryHash).not.toBe(geometry.staticGeometryHash);
    expect(resolveHybridAcousticPresentation(state, rebuilt, rebuiltGeometry.staticGeometryHash).accepted).toBe(false);
  });
});
