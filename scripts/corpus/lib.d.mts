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
  negativeZeroPaths: { expected: string[]; actual: string[] };
  leafCount: number;
  violations: Violation[];
  stats: Record<string, ClassStats>;
  samples: Record<string, { abs: number[]; rel: number[] }>;
};

export type CompareSummary = {
  ok: boolean;
  caseCount: number;
  bitExactCases: number;
  negativeZeroLeafCount: number;
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

export type VerifyResult = { ok: boolean; problems: string[]; corpusSha256: string; caseCount: number };
export function verifyCorpus(rootDir: string, options?: { requireFrozen?: boolean }): VerifyResult;

export type GitInfo = {
  gitHead: string;
  gitDirty: string[] | "unavailable";
  productTrees: { src: string; "package.json": string; "pnpm-lock.yaml": string };
  productTreesMatchBaseline: boolean;
  productTreeDiffs: string[] | "unavailable";
  packageJsonNoScriptsSha256: string;
};
export function packageJsonNoScriptsSha256(text: string): string;
export function collectGitInfo(
  repoRoot: string,
  baseline: { treeHashes: Record<string, string>; packageJsonNoScriptsSha256?: string },
): GitInfo;
export function collectEnvironment(): {
  node: string;
  v8: string;
  platform: string;
  arch: string;
  cpuModel: string;
  logicalCpus: number | "unavailable";
};
