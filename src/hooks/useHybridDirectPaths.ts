"use client";

import { useEffect, useRef, useState } from "react";

import type { HybridGeometry } from "@/acoustics/hybrid3d/compile";
import { computeHybridDirectFrame, type HybridDirectFrame } from "@/acoustics/hybrid3d/direct";
import type { SceneDocumentV2 } from "@/domain/scene-document/types";
import {
  createHybridDirectPool,
  type HybridDirectPoolLike,
} from "@/workers/hybrid-direct-pool";

export type HybridDirectPathsState = Readonly<{
  frame: HybridDirectFrame;
  /** Static geometry hash the frame was computed against (ADR 0007). */
  staticFingerprint: string;
  source: "worker" | "fallback";
  computeMs: number;
  completedAtMs: number;
  requestSequence: number;
  workerCount: number;
  sourceComputeMsMax: number;
  sourceComputeMsTotal: number;
  notice: string | null;
}>;

export function useHybridDirectPaths(
  document: SceneDocumentV2,
  geometry: HybridGeometry,
): HybridDirectPathsState {
  const pool = useRef<HybridDirectPoolLike | null>(null);
  const [state, setState] = useState<HybridDirectPathsState>(() => ({
    frame: computeHybridDirectFrame(geometry),
    staticFingerprint: geometry.staticGeometryHash,
    source: "fallback",
    computeMs: 0,
    completedAtMs: 0,
    requestSequence: 0,
    workerCount: 0,
    sourceComputeMsMax: 0,
    sourceComputeMsTotal: 0,
    notice: null,
  }));

  useEffect(() => {
    const instance = createHybridDirectPool({
      hardwareConcurrency: typeof navigator === "undefined" ? undefined : navigator.hardwareConcurrency,
    });
    instance.onresult = ({ frame, staticFingerprint, source, metrics, notice }) => setState({
      frame,
      staticFingerprint,
      source,
      computeMs: metrics.computeMs,
      completedAtMs: metrics.completedAtMs,
      requestSequence: metrics.requestSequence,
      workerCount: metrics.workerCount,
      sourceComputeMsMax: metrics.sourceComputeMsMax,
      sourceComputeMsTotal: metrics.sourceComputeMsTotal,
      notice,
    });
    pool.current = instance;
    return () => {
      pool.current = null;
      instance.dispose();
    };
  }, []);

  useEffect(() => {
    pool.current?.update(document, geometry);
  }, [document, geometry]);

  return state;
}
