export type FieldClass = {
  unit?: string;
  compare: "exact" | "decimal" | "tolerance" | "circular";
  decimals?: number;
  atol?: number;
  rtol?: number;
  period?: number;
  status: "discrete" | "existing-test" | "proposed" | "approved";
  source: string;
};

export type CorpusRules = {
  rulesVersion: string;
  status: "draft" | "frozen";
  frozenOn: string | null;
  classes: Record<string, FieldClass>;
  rules: { kinds: string[]; path: string; class: string }[];
};

export type Violation = {
  type: "structure" | "unclassified" | "ambiguous" | "discrete" | "continuous";
  path: string;
  expected?: unknown;
  actual?: unknown;
  class?: string;
  detail?: string;
};

export type ClassStats = {
  count: number;
  maxAbsError: number;
  p50AbsError: number;
  p95AbsError: number;
  maxRelError: number | null;
  worst: { caseId: string; path: string; expected: number; actual: number } | null;
};

export type CompareReport = {
  caseId: string;
  kind: string;
  ok: boolean;
  bitExact: boolean;
  leafCount: number;
  violations: Violation[];
  stats: Record<string, ClassStats>;
};

export type CompareSummary = {
  ok: boolean;
  caseCount: number;
  bitExactCases: number;
  violationCount: number;
  firstViolations: (Violation & { caseId: string })[];
  stats: Record<string, ClassStats>;
};

export function canonicalize(value: unknown): { text: string; negativeZeroPaths: string[] };
export function sha256Hex(data: string | Uint8Array): string;
export function aggregateSha256(caseHashes: Record<string, string>): string;
export function validateRules(rules: CorpusRules): void;
export function compareOutputs(
  expected: unknown,
  actual: unknown,
  rules: CorpusRules,
  context: { caseId: string; kind: string },
): CompareReport;
export function summarizeReports(reports: CompareReport[]): CompareSummary;
