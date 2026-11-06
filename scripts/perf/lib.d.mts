export const SAMPLE_SCHEMA: string;
export const SUMMARY_SCHEMA: string;
export const NOT_APPLICABLE: "not-applicable";
export const UNAVAILABLE: "unavailable";
export const MISSING_VALUES: string[];
export const VARIANTS: string[];
export const BOUNDARIES: string[];
export const PASSES: string[];
export const OUTCOMES: string[];
export const CLOCKS: string[];
export const MODES: string[];
export const AUDIO_STATES: string[];
export const DENOMINATORS: string[];
export const EXPLORATORY_BELOW: number;
export const SIGNED_PHASES: string[];
export const RUN_ID_PATTERN: RegExp;

export type Stats = {
  N: number;
  p50: number | "unavailable";
  p95: number | "unavailable";
  p99: number | "unavailable";
  max: number | "unavailable";
  mean: number | "unavailable";
};

export type Sample = {
  schema: string;
  runId: string;
  variant: string;
  caseId: string;
  requestSeq: number | string;
  mode: string;
  sceneRevision: number | string;
  staticFingerprint: string;
  phase: string;
  duration: number;
  units: string;
  outcome: string;
  boundary: string;
  pass: string;
  workers: number | string;
  workerIndex: number | string;
  warm: boolean;
  clock: string;
  audio: string;
  tapeStep: number | string;
};

export type PhaseSummary = {
  units: string;
  count: number;
  outcomes: Record<string, number>;
  warm: Stats;
  cold: Stats;
  exploratory: boolean;
  censoredCount?: number;
  includingCensored?: { note: string; censoredAreLowerBounds: boolean; warm: Stats; cold: Stats };
};

export type RunIndexLine = {
  runId: string;
  variant: string;
  case: string;
  pass: string;
  boundary: string;
  workers: number | string;
  audio: string;
  build: string;
  parity: boolean;
  status: string;
  start: string;
  end: string;
  orderIndex: number | string;
  sampleCount: number | string;
};

export type PrivacyTerm = { rule: string; value: string };

export function isMissingValue(value: unknown): boolean;
export function nearestRank(values: number[], p: number): number | "unavailable";
export function computeStats(values: number[]): Stats;
export function validateSample(sample: unknown): string[];
export function createSample(fields: Record<string, unknown>): Sample;
export function serializeJsonl(objects: unknown[]): string;
export function parseJsonl(text: string): unknown[];
export function readJson(file: string): unknown;
export function writeJson(file: string, value: unknown): void;
export function sha256Text(data: string | Uint8Array): string;
export function sha256File(file: string): string;
export function artifactsSha256(dir: string, skip?: string[]): string;
export function summarizeSamples(samples: Sample[]): {
  schema: string;
  sampleCount: number;
  phases: Record<string, PhaseSummary>;
};
export const CENSORED_PHASE: string;
export function censoredBlock(censoredCount: number, warm: number[], cold: number[]): unknown;
export function makeDenominators(counts: Record<string, number>): Record<string, number | string>;
export function groupKeyOf(entry: RunIndexLine): string;
export function buildGroups(
  runs: { entry: RunIndexLine; samples: Sample[]; denominators?: Record<string, number | string> }[],
): {
  key: Record<string, unknown>;
  runCount: number;
  runIds: string[];
  excludedRuns: { runId: string; status: string }[];
  denominators: Record<string, number | string>;
  pooled: Record<string, { units: string; warm: Stats; cold: Stats }>;
  perRun: { runId: string; orderIndex: number | string; status: string; phases: Record<string, PhaseSummary> }[];
  dispersion: Record<string, unknown>;
  exploratoryRuns: Record<string, number>;
}[];
export function renderTables(groups: ReturnType<typeof buildGroups>): string;
export function appendRunIndex(outDir: string, line: RunIndexLine): void;
export function readRunIndex(outDir: string): RunIndexLine[];
export function executeRun(options: {
  outDir: string;
  meta: { runId: string; variant: string; case: string; pass: string; boundary: string; workers?: number | string; audio?: string; build?: string; parity?: boolean };
  orderIndex?: number;
  execute: (context: { runDir: string }) => Promise<{
    status?: "passed" | "failed";
    error?: string;
    sampleCount?: number;
    phasesNotReached?: string[];
  }>;
  clock?: () => Date;
}): Promise<RunIndexLine>;
export function diffLeaves(
  expected: unknown,
  actual: unknown,
): { path: string; kind: string; expected?: unknown; actual?: unknown }[];
export function privacyTerms(): PrivacyTerm[];
export function sanitizeText(text: string, terms?: PrivacyTerm[]): string;
export function sanitizeTrace(value: unknown, terms?: PrivacyTerm[]): unknown;
export function scanLine(line: string, terms?: PrivacyTerm[]): string[];
export function scanPaths(paths: string[], terms?: PrivacyTerm[]): Promise<string[]>;
export function verifyWorkloads(dir: string): {
  ok: boolean;
  problems: string[];
  manifestSha256: string;
  fileCount: number;
};
