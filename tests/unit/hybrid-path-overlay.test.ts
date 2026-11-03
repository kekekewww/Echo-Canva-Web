import { describe, expect, it } from "vitest";

import { compileHybridGeometry } from "@/acoustics/hybrid3d/compile";
import { resolveHybridAudibleDirectState } from "@/acoustics/hybrid3d/audible-direct";
import { computeHybridDirectFrame } from "@/acoustics/hybrid3d/direct";
import { createDefaultHybridProject } from "@/domain/workspace/defaults";
import { projectHybridDocument } from "@/domain/workspace/projections";
import { deriveHybridArrivalLabel, deriveHybridPathDisplay } from "@/components/workspace/HybridPathOverlay";
import { resolveHybridAcousticPresentation } from "@/components/workspace/HybridViewportAdapter";
import type { WorkspaceProject } from "@/domain/workspace/types";
import type { HybridDirectPathsState } from "@/hooks/useHybridDirectPaths";

describe("Hybrid path overlay", () => {
  it("rejects stale frames", () => {
    const project = createDefaultHybridProject();
    const geometry = compileHybridGeometry(projectHybridDocument(project));
    const frame = computeHybridDirectFrame(geometry);
    expect(deriveHybridPathDisplay(frame, geometry, "radio", false, frame.revision + 1, [])).toEqual([]);
  });

  it("emits XYZ direct and first-order surface paths for the selected source", () => {
    const project = createDefaultHybridProject();
    const geometry = compileHybridGeometry(projectHybridDocument(project));
    const frame = computeHybridDirectFrame(geometry);
    const paths = deriveHybridPathDisplay(frame, geometry, "radio", false, frame.revision, []);

    expect(paths.length).toBeGreaterThan(1);
    expect(paths.every(({ sourceId }) => sourceId === "radio")).toBe(true);
    expect(paths[0]!.vertices).toHaveLength(2);
    expect(paths.filter(({ kind }) => kind === "reflection").every(({ vertices }) => vertices.length === 3)).toBe(true);
    expect(paths.some(({ surfaceKind }) => surfaceKind === "floor" || surfaceKind === "ceiling" || surfaceKind === "wall")).toBe(true);
  });

  it("shows every source only when requested", () => {
    const project = createDefaultHybridProject();
    const geometry = compileHybridGeometry(projectHybridDocument(project));
    const frame = computeHybridDirectFrame(geometry);
    const paths = deriveHybridPathDisplay(frame, geometry, "radio", true, frame.revision, []);
    expect(new Set(paths.map(({ sourceId }) => sourceId))).toEqual(new Set(["radio", "rain"]));
  });

  it("draws only the six reflection taps that can reach the fixed audio bank", () => {
    const project = createDefaultHybridProject();
    const geometry = compileHybridGeometry(projectHybridDocument(project));
    const frame = computeHybridDirectFrame(geometry);
    const base = frame.firstOrderReflectionsBySource.radio[0]!;
    const withExtraCandidates = {
      ...frame,
      firstOrderReflectionsBySource: {
        ...frame.firstOrderReflectionsBySource,
        radio: Array.from({ length: 9 }, (_, index) => ({
          ...base,
          id: `first:visual-candidate-${index}`,
          surfaceId: `visual-candidate-${index}`,
          pathLengthM: base.pathLengthM + index * 0.01,
        })),
      },
    };
    const paths = deriveHybridPathDisplay(
      withExtraCandidates,
      geometry,
      "radio",
      false,
      frame.revision,
      [],
    );

    expect(paths.filter(({ kind }) => kind === "reflection")).toHaveLength(6);
  });

  it("draws a second-order path through both finite reflection points", () => {
    const project = createDefaultHybridProject();
    const geometry = compileHybridGeometry(projectHybridDocument(project));
    const frame = computeHybridDirectFrame(geometry);
    const withSecondOrder = {
      ...frame,
      secondOrderReflectionsBySource: {
        ...frame.secondOrderReflectionsBySource,
        radio: [{
          id: "second:floor>partition_center",
          surfaceIds: ["floor", "partition_center"] as const,
          patchIds: ["floor", "partition_center:front"] as const,
          materialIds: ["concrete_hard", "concrete_hard"] as const,
          reflectionPoints: [{ x: 4, y: 0, z: 3 }, { x: 6, y: 1, z: 4 }] as const,
          pathLengthM: 9,
          delayMs: 26,
          excessDelayMs: 8,
          estimatedMidGainDb: -20,
          arrivalDirection: { x: 1, y: 0, z: 0 },
        }],
      },
    };
    const paths = deriveHybridPathDisplay(withSecondOrder, geometry, "radio", false, frame.revision, []);
    const secondOrder = paths.find(({ reflectionOrder }) => reflectionOrder === 2);

    expect(secondOrder).toBeDefined();
    expect(secondOrder?.vertices).toHaveLength(4);
    expect(secondOrder?.surfaceName).toContain("→");
  });
});

describe("Hybrid arrival-direction label", () => {
  function workerState(frame: ReturnType<typeof computeHybridDirectFrame>, staticFingerprint: string): HybridDirectPathsState {
    return {
      frame,
      source: "worker",
      computeMs: 0,
      completedAtMs: 0,
      requestSequence: 1,
      workerCount: 1,
      sourceComputeMsMax: 0,
      sourceComputeMsTotal: 0,
      notice: null,
      staticFingerprint,
    };
  }

  // Default Hybrid fixture: listener (3, 1.5, 4) m, Radio (9, 1.5, 4) m with clear line of
  // sight, Rain (10, 1.5, 1.5) m behind the partition with an audible Portal route.
  function labelFor(project: WorkspaceProject, selectedSourceId: string | null, frameOverride?: (frame: ReturnType<typeof computeHybridDirectFrame>) => ReturnType<typeof computeHybridDirectFrame>) {
    const document = projectHybridDocument(project);
    const geometry = compileHybridGeometry(document);
    const computed = computeHybridDirectFrame(geometry);
    const frame = frameOverride ? frameOverride(computed) : computed;
    const presentation = resolveHybridAcousticPresentation(workerState(frame, geometry.staticGeometryHash), document, geometry.staticGeometryHash);
    return deriveHybridArrivalLabel({
      accepted: presentation.accepted && !presentation.lagging,
      frame,
      expectedRevision: project.revision,
      selectedSourceId,
      sourceName: project.scene.sources.find(({ id }) => id === selectedSourceId)?.name,
      audiblePaths: resolveHybridAudibleDirectState(geometry, frame).paths,
    });
  }

  it("reports the accepted direct path's world-aligned azimuth and elevation in degrees", () => {
    const label = labelFor(createDefaultHybridProject(), "radio");
    expect(label.state).toBe("ready");
    if (label.state !== "ready") return;
    expect(label.routeType).toBe("direct");
    // atan2(x = 6, z = 0) = 90° (+X); asin(0) = 0°. Tolerance 1e-9 degrees.
    expect(label.azimuthDeg).toBeCloseTo(90, 9);
    expect(label.elevationDeg).toBeCloseTo(0, 9);
    expect(label.text).toBe("Arrival · Radio · Direct · az 90.0° · el 0.0°");
    expect(label.accessibleText).toContain("azimuth 90.0 degrees, elevation 0.0 degrees");
    expect(label.accessibleText).toContain("not rotated by listener heading");
    expect(label.accessibleText).toContain("approximation");
  });

  it("labels a blocked line of sight and notes that the audible Portal route differs", () => {
    const label = labelFor(createDefaultHybridProject(), "rain");
    expect(label.state).toBe("ready");
    if (label.state !== "ready") return;
    expect(label.routeType).toBe("blocked");
    expect(label.audibleRouteType).toBe("portal");
    // Listener→Rain = (7, 0, -2.5) m; atan2(7, -2.5) ≈ 109.654°.
    expect(label.azimuthDeg).toBeCloseTo(109.654, 3);
    expect(label.text).toContain("Blocked line of sight · az 109.7° · el 0.0°");
    expect(label.text).toContain("Portal");
  });

  it("copies the frame values rather than recomputing a path", () => {
    const label = labelFor(createDefaultHybridProject(), "radio", (frame) => ({
      ...frame,
      paths: frame.paths.map((path) => path.sourceId === "radio" ? { ...path, azimuthDeg: -45.04, elevationDeg: 12.36 } : path),
    }));
    expect(label.state === "ready" && label.text).toBe("Arrival · Radio · Direct · az -45.0° · el 12.4°");
  });

  it("does not rotate the azimuth by listener heading", () => {
    const base = createDefaultHybridProject();
    const turned: WorkspaceProject = {
      ...base,
      listeners: base.listeners.map((listener) => ({ ...listener, headingDeg: listener.headingDeg + 90 })),
    };
    const a = labelFor(base, "radio");
    const b = labelFor(turned, "radio");
    expect(a.state === "ready" && b.state === "ready" && b.azimuthDeg).toBe(a.state === "ready" ? a.azimuthDeg : null);
  });

  it("shows a pending state for stale revision or projection-hash frames", () => {
    const project = createDefaultHybridProject();
    const staleRevision = labelFor(project, "radio", (frame) => ({ ...frame, revision: frame.revision + 1 }));
    const staleHash = labelFor(project, "radio", (frame) => ({ ...frame, classicProjectionHash: "stale" }));
    for (const label of [staleRevision, staleHash]) {
      expect(label.state).toBe("pending");
      expect(label.text).toMatch(/pending/);
      expect(label.text).not.toMatch(/az |°/);
    }
    // Defence in depth: an otherwise accepted frame from another revision is still pending.
    const geometry = compileHybridGeometry(projectHybridDocument(project));
    const frame = computeHybridDirectFrame(geometry);
    expect(deriveHybridArrivalLabel({
      accepted: true,
      frame,
      expectedRevision: frame.revision + 1,
      selectedSourceId: "radio",
      audiblePaths: [],
    }).state).toBe("pending");
  });

  it("shows pending for a pose-lagging frame from the previous pose", () => {
    // The frame is from the same static geometry but an older revision, which the presentation
    // accepts as lagging; the label must not present its direction as current.
    const project = createDefaultHybridProject();
    const document = projectHybridDocument(project);
    const geometry = compileHybridGeometry(document);
    const computed = computeHybridDirectFrame(geometry);
    const lagging = { ...computed, revision: computed.revision - 1 };
    const presentation = resolveHybridAcousticPresentation(workerState(lagging, geometry.staticGeometryHash), document, geometry.staticGeometryHash);
    expect(presentation).toMatchObject({ accepted: true, lagging: true });
    expect(labelFor(project, "radio", () => lagging).state).toBe("pending");
  });

  it("shows an empty state when no source is in the accepted frame", () => {
    expect(labelFor(createDefaultHybridProject(), null).state).toBe("empty");
    expect(labelFor(createDefaultHybridProject(), "missing").state).toBe("empty");
  });
});
