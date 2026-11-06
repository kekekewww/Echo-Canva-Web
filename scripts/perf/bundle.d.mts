export const BUNDLE_ROOT: string;
export function resolveVite(repoRoot: string): { entry: string; version: string };
export function hashBundle(dir: string): string;
export function checkWorkerBundles(
  dir: string,
  expectPreamble: boolean,
): { file: string; preamblePresent: boolean; preambleIndex: number; productionListenerIndex: number; ok: boolean }[];
export function buildBundle(
  repoRoot: string,
  kind: string,
): Promise<{ kind: string; dir: string; sha256: string; viteVersion: string; workerChecks: unknown[]; page?: string }>;
