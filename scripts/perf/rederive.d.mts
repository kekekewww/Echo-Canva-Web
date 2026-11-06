export function rederiveRun(options: { runDir: string; commit?: string; now?: () => Date }): Promise<{
  runId: string;
  status: string;
  sampleCount: number;
  errors: string[];
  originalStatus: string;
  audio: string;
  line: Record<string, unknown>;
}>;
