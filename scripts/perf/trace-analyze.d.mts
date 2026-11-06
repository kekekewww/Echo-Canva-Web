type Loose = Record<string, unknown>;
export const EXEMPLAR_BYTES: number;
export function streamTraceEvents(file: string, onEvent: (event: Loose) => void): Promise<void>;
export function topLevel(tasks: { ts: number; dur: number; tdur?: number }[]): { ts: number; dur: number; tdur?: number }[];
export function exclusiveBreakdown(task: { ts: number; dur: number }, events: { name: string; ts: number; dur: number }[]): { name: string; us: number }[];
export function rankJobs(samplesFile: string, phase: string, top?: number): { seq: number; value: number }[];
export function analyzeTrace(options: {
  file: string;
  outDir: string;
  calibrationFile?: string;
  exemplars?: { phase: string; jobs: { seq: number; value: number }[] };
  computeCheck?: {
    wholeMilliseconds: boolean;
    metricName?: string;
    jobs: { seq: number; jobKind?: string; firstPostStartMs?: number; lastHandlerStartMs?: number | null; lastHandlerEndMs?: number | null; metricMs?: number | null; entries: { worker: number; reportedMs: number; recvEpochMs: number | null; postEndMs?: number | null; handlerStartMs?: number | null }[] }[];
  };
}): Promise<{
  computeVsTrace: Loose | string;
  jobDecomposition: Loose | string;
  jobLevelDecomposition: Loose | string;
  threads: number;
  marks: number;
  gcEvents: number;
  cpuThreads: number;
  alignment: Loose;
  exemplars: { file: string; bytes: number; events: number; droppedForSize: boolean }[];
}>;
