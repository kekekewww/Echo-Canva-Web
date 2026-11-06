type Loose = Record<string, unknown>;
export const EXEMPLAR_BYTES: number;
export function streamTraceEvents(file: string, onEvent: (event: Loose) => void): Promise<void>;
export function rankJobs(samplesFile: string, phase: string, top?: number): { seq: number; value: number }[];
export function analyzeTrace(options: {
  file: string;
  outDir: string;
  calibrationFile?: string;
  exemplars?: { phase: string; jobs: { seq: number; value: number }[] };
  computeCheck?: { wholeMilliseconds: boolean; jobs: { seq: number; entries: { worker: number; reportedMs: number; recvEpochMs: number | null }[] }[] };
}): Promise<{
  computeVsTrace: Loose | string;
  threads: number;
  marks: number;
  gcEvents: number;
  cpuThreads: number;
  alignment: Loose;
  exemplars: { file: string; bytes: number; events: number; droppedForSize: boolean }[];
}>;
