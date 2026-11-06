import type { Sample } from "./lib.mjs";

type Loose = Record<string, unknown>;
export const AUDIO_SAMPLE_INTERVAL_MS: number;
export function assertSources(result: { errors: string[] }, config: Record<string, unknown>, observed: Record<string, unknown>, expectedCount: number): void;
export function computeCheckFromDump(dump: Loose): {
  wholeMilliseconds: boolean;
  metricName: string;
  jobs: { seq: number; jobKind: string; firstPostStartMs: number; lastHandlerStartMs: number | null; lastHandlerEndMs: number | null; metricMs: number | null; entries: { worker: number; reportedMs: number; recvEpochMs: number | null; postEndMs: number | null; handlerStartMs: number }[] }[];
};
export function deriveAppSamples(
  dump: Loose,
  context: { runId: string; variant: string; caseId: string; mode: string; pass: string; workers: number | string; audio: string; audioSamples?: Loose[]; updateHz?: number | null; submitted?: number; timeouts?: number },
): {
  samples: Sample[];
  denominators: Record<string, number | string>;
  observed: { workerSources: string[]; workerCounts: string[]; jobs: number; commits: number; workersCreated: number; support: unknown; contexts: unknown; chain: Loose; measuredWindow: unknown; longTasks: Loose; longAnimationFrames: Loose };
};
