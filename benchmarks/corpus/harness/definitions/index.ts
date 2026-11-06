import type { CorpusCaseDefinition } from "../types";
import { classicCaseDefinitions } from "./classic";
import { degenerateCaseDefinitions } from "./degenerate";
import { hybridCaseDefinitions } from "./hybrid";
import { kernelCaseDefinitions } from "./kernels";
import { migrationCaseDefinitions } from "./migration";
import { tapeCaseDefinitions } from "./tapes";

/** All corpus cases in fixed order. Later tasks add families by appending here. */
export function corpusCaseDefinitions(): readonly CorpusCaseDefinition[] {
  return [
    ...classicCaseDefinitions(),
    ...hybridCaseDefinitions(),
    ...kernelCaseDefinitions(),
    ...migrationCaseDefinitions(),
    ...degenerateCaseDefinitions(),
    ...tapeCaseDefinitions(),
  ];
}
