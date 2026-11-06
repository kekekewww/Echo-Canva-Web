import type { Sample } from "./lib.mjs";

type Loose = Record<string, unknown>;
export function computeCheckFromDump(dump: Loose): {
  wholeMilliseconds: boolean;
  jobs: { seq: number; entries: { worker: number; reportedMs: number; recvEpochMs: number | null }[] }[];
};
export function deriveAppSamples(
  dump: Loose,
  context: { runId: string; variant: string; caseId: string; mode: string; pass: string; workers: number | string; audio: string; audioSamples?: Loose[]; submitted?: number; timeouts?: number },
): {
  samples: Sample[];
  denominators: Record<string, number | string>;
  observed: { workerSources: string[]; workerCounts: string[]; jobs: number; commits: number; workersCreated: number; support: unknown; contexts: unknown };
};
