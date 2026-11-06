export type CorpusCaseKind =
  | "classic-frame"
  | "hybrid-frame"
  | "hybrid-visibility"
  | "hybrid-second-order"
  | "hybrid-patch"
  | "scene-validation"
  | "workspace-migration"
  | "classic-tape"
  | "hybrid-tape";

export type CorpusCaseDefinition = {
  id: string;
  mode: "classic-2d5d" | "hybrid-3d";
  kind: CorpusCaseKind;
  tags: string[];
  scenario: "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | null;
  source: {
    type: "preset" | "test-fixture" | "derived" | "handwritten";
    refs: string[];
    notes?: string;
  };
  seed: { value: number; algorithm: "lcg32-v1"; consumers: string } | null;
  counts: {
    walls: number;
    portals: number;
    primitives: number;
    enabledSources: number;
    activeListeners: number;
  } | null;
  input: unknown;
};

export type CorpusOutput =
  | { caseId: string; kind: CorpusCaseKind; outcome: "ok"; value: unknown }
  | { caseId: string; kind: CorpusCaseKind; outcome: "error"; error: { name: string; message: string } };
