import type { Sample } from "./lib.mjs";

type Loose = Record<string, unknown>;

export function warmAt(ordinal: number, elapsedMs: number): boolean;
export function buildJobs(log: Loose): Loose[];
export function checkIntegrity(
  log: Loose,
  jobs: Loose[],
): { ok: boolean; installPosts: number; installAcks: number; shardPosts: number; shardResults: number; workerRecords: number; anomalies: string[] };
export function deriveSamples(
  log: Loose,
  context: { runId: string; variant: string; caseId: string; mode: string; pass: string; workers: number | string },
): {
  samples: Sample[];
  denominators: Record<string, number | string>;
  jobs: number;
  workerCounts: number[];
  integrity: unknown;
  shardCompute: { count: number; nonInteger: number };
  phaseResidualCount: number;
  revisionsSeen: number;
};
export function poolComputeCheck(
  log: Loose,
  wholeMilliseconds: boolean,
  metricByJob?: Map<number, number>,
): {
  wholeMilliseconds: boolean;
  metricName: string;
  jobs: { seq: number; jobKind: string; firstPostStartMs: number; lastHandlerStartMs: number | null; lastHandlerEndMs: number | null; metricMs: number | null; entries: { worker: number; reportedMs: number; recvEpochMs: number | null; postEndMs: number | null; handlerStartMs: number | null }[] }[];
};
export const WARM_JOBS: number;
export const WARM_MS: number;
