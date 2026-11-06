export function rederiveRun(options: { runDir: string; commit?: string; now?: () => Date }): Promise<{
  runId: string;
  status: string;
  sampleCount: number;
  errors: string[];
  originalStatus: string;
  audio: string;
  line: Record<string, unknown>;
}>;

export function rawKindOf(runDir: string): "app" | "pool" | "serial" | null;

export function rederiveAll(options: { outDir: string; commit?: string; now?: () => Date; dryRun?: boolean }): Promise<{
  rederived: { runId: string; kind: string; dryRun?: boolean; originalStatus?: string; status?: string; sampleCount?: number; errors?: string[] }[];
  skipped: { runId: string; reason: string }[];
  failed: { runId: string; kind: string; reason: string }[];
}>;
