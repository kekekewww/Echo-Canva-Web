import type { CorpusCaseDefinition } from "../types";
import { classicCaseDefinitions } from "./classic";
import { hybridCaseDefinitions } from "./hybrid";
import { kernelCaseDefinitions } from "./kernels";

/** All corpus cases in fixed order. Later tasks add families by appending here. */
export function corpusCaseDefinitions(): readonly CorpusCaseDefinition[] {
  return [...classicCaseDefinitions(), ...hybridCaseDefinitions(), ...kernelCaseDefinitions()];
}
