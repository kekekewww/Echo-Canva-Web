type Loose = Record<string, unknown>;
export const PAIR_PHASES: string[][];
export const OVERHEAD_PHASES: string[];
export function pairedDifferences(runs: { entry: Loose; samples: Loose[] }[]): {
  case: string;
  pass: string;
  boundary: string;
  audio: string;
  build: string;
  orderIndex: number | string;
  tsS: string;
  tsW: string;
  phases: Record<string, unknown>;
}[];
export function overheadComparisons(groups: Loose[]): {
  comparison: string;
  group: Loose;
  phases: Record<string, unknown>;
  runs: Record<string, string[]>;
}[];
export function parityRows(parityRuns: Loose[]): Loose[];
export function renderComparisons(input: { paired: Loose[]; overhead: Loose[]; parity: Loose[] }): string;
