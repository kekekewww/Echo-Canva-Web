import { computeAcousticFrame, createClassicStaticContext } from "@/acoustics/compute-frame";
import { buildPatchBvh, hasSegmentBvhHit, intersectSegmentBvh } from "@/acoustics/hybrid3d/bvh";
import { resolveHybridAudibleDirectState } from "@/acoustics/hybrid3d/audible-direct";
import { compileHybridGeometry, hybridStaticGeometryHash } from "@/acoustics/hybrid3d/compile";
import { computeHybridDirectFrame } from "@/acoustics/hybrid3d/direct";
import { makePatch3, type AcousticPatch3, type Vec3 } from "@/acoustics/hybrid3d/geometry";
import { reflectionLegIsVisible } from "@/acoustics/hybrid3d/reflections";
import { renderHybridEarlyReflections } from "@/acoustics/hybrid3d/reflection-rendering";
import {
  findExhaustiveSecondOrderReflections3D,
  findPrunedSecondOrderReflections3D,
  type PrunedSecondOrderOptions,
} from "@/acoustics/hybrid3d/second-order";
import { evaluateSecondOrderCandidate } from "@/acoustics/hybrid3d/second-order-evaluation";
import type { SceneSpec } from "@/domain/scene/types";
import type { SceneDocumentV2 } from "@/domain/scene-document/types";

import type { CorpusCaseKind, CorpusOutput } from "./types";

type PatchOptions = NonNullable<Parameters<typeof makePatch3>[4]>;

export type PatchSpec = {
  id: string;
  kind: AcousticPatch3["kind"];
  materialId: string;
  vertices: Vec3[];
  options?: PatchOptions;
};

export type VisibilityQuery = { start: Vec3; end: Vec3; allowedWallIds?: string[] };

function buildPatches(specs: readonly PatchSpec[]): AcousticPatch3[] {
  return specs.map(({ id, kind, materialId, vertices, options }) =>
    makePatch3(id, kind, materialId, vertices, options),
  );
}

function runClassicFrame(input: { scene: SceneSpec }): unknown {
  return {
    staticFingerprint: createClassicStaticContext(input.scene).fingerprint,
    frame: computeAcousticFrame(input.scene, 0),
  };
}

function runHybridFrame(input: { document: SceneDocumentV2 }): unknown {
  const geometry = compileHybridGeometry(input.document);
  const frame = computeHybridDirectFrame(geometry, 0);
  const earlyTapsBySource = Object.fromEntries(
    geometry.document.baseScene.sources.map(({ id }) => [
      id,
      renderHybridEarlyReflections(
        frame.firstOrderReflectionsBySource[id] ?? [],
        frame.secondOrderReflectionsBySource[id] ?? [],
      ),
    ]),
  );
  return {
    staticGeometryHash: hybridStaticGeometryHash(input.document),
    frame,
    audible: resolveHybridAudibleDirectState(geometry, frame),
    earlyTapsBySource,
  };
}

function runHybridVisibility(input: { patches: PatchSpec[]; queries: VisibilityQuery[] }): unknown {
  const bvh = buildPatchBvh(buildPatches(input.patches));
  return input.queries.map(({ start, end, allowedWallIds }) => {
    const result: Record<string, unknown> = {
      hits: intersectSegmentBvh(start, end, bvh),
      reverseHits: intersectSegmentBvh(end, start, bvh),
      hasHit: hasSegmentBvhHit(start, end, bvh),
      reverseHasHit: hasSegmentBvhHit(end, start, bvh),
    };
    if (allowedWallIds) {
      result.hasHitAccepted = hasSegmentBvhHit(
        start,
        end,
        bvh,
        (hit) => !allowedWallIds.includes(hit.wallId ?? ""),
      );
      result.legVisible = reflectionLegIsVisible(start, end, bvh, allowedWallIds);
    }
    return result;
  });
}

function runHybridSecondOrder(input: {
  patches: PatchSpec[];
  source: Vec3;
  listener: Vec3;
  options?: PrunedSecondOrderOptions;
}): unknown {
  const bvh = buildPatchBvh(buildPatches(input.patches));
  const exhaustive = findExhaustiveSecondOrderReflections3D(input.source, input.listener, bvh);
  if (!input.options) return { exhaustive, pruned: null, evaluation: null };
  const pruned = findPrunedSecondOrderReflections3D(input.source, input.listener, bvh, input.options);
  return {
    exhaustive,
    pruned: { paths: pruned.paths, stats: pruned.stats },
    evaluation: evaluateSecondOrderCandidate(exhaustive, pruned.paths),
  };
}

function dispatch(kind: CorpusCaseKind, input: unknown): unknown {
  switch (kind) {
    case "classic-frame":
      return runClassicFrame(input as { scene: SceneSpec });
    case "hybrid-frame":
      return runHybridFrame(input as { document: SceneDocumentV2 });
    case "hybrid-visibility":
      return runHybridVisibility(input as { patches: PatchSpec[]; queries: VisibilityQuery[] });
    case "hybrid-second-order":
      return runHybridSecondOrder(input as Parameters<typeof runHybridSecondOrder>[0]);
    default:
      throw new Error(`Unsupported corpus case kind: ${kind}`);
  }
}

/** Runs one frozen input through the in-process TypeScript implementation. */
export function runCorpusCase(caseId: string, kind: CorpusCaseKind, input: unknown): CorpusOutput {
  try {
    return { caseId, kind, outcome: "ok", value: dispatch(kind, structuredClone(input)) };
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    return { caseId, kind, outcome: "error", error: { name: failure.name, message: failure.message } };
  }
}
