import { hybridStaticGeometryHash } from "@/acoustics/hybrid3d/compile";
import { projectHybridDocument } from "@/domain/workspace/projections";
import type { WorkspaceProject } from "@/domain/workspace/types";

import { replayTapeSerial, type SerialReplayOptions, type SerialReplayResult } from "./replay-serial";

export type { ParityStep, SerialRecord, SerialReplayResult } from "./replay-serial";

export type NodeReplayOptions = Omit<SerialReplayOptions, "now" | "sleep">;

/** TS-S at the node-core boundary: the production solver in a plain Node process, no workers. */
export function runNodeReplay(options: NodeReplayOptions): Promise<SerialReplayResult> {
  return replayTapeSerial({
    ...options,
    now: () => performance.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });
}

/** The two hashes the workload manifest records for the 100-wall fixture, computed from a project the app held. */
export function fixtureHashes(project: WorkspaceProject): { staticGeometryHash: string; classicProjectionHash: string } {
  const document = projectHybridDocument(project);
  return {
    staticGeometryHash: hybridStaticGeometryHash(document),
    classicProjectionHash: document.compatibility.classicProjectionHash,
  };
}

export function clockResolutionMs(reads = 10_000): number {
  let smallest = Number.POSITIVE_INFINITY;
  let last = performance.now();
  for (let index = 0; index < reads; index += 1) {
    const current = performance.now();
    const delta = current - last;
    if (delta > 0 && delta < smallest) smallest = delta;
    last = current;
  }
  return smallest;
}
