import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { canonicalize, compareOutputs } from "../corpus/lib.mjs";
import { diffLeaves } from "./lib.mjs";

/**
 * Compares tape steps with the frozen expected output: bit for bit through `canonicalize`, then
 * with the corpus comparison rules. Every differing leaf and every rule violation becomes a line.
 */
export function compareTapeParity({ caseId, kind, expectedPath, rulesPath }, steps) {
  const expectedText = readFileSync(resolve(expectedPath), "utf8");
  const actual = canonicalize({ caseId, kind, outcome: "ok", value: { steps } });
  const bitExact = actual.text === expectedText;
  const expected = JSON.parse(expectedText);
  const actualParsed = JSON.parse(actual.text);
  const leafDiffs = diffLeaves(expected, actualParsed);
  const rules = JSON.parse(readFileSync(resolve(rulesPath), "utf8"));
  const report = compareOutputs(expected, actualParsed, rules, { caseId, kind });
  const lines = [
    ...leafDiffs.map((diff) => ({ type: "leaf-difference", ...diff })),
    ...report.violations.map((violation) => ({ type: "rule-violation", ...violation })),
  ];
  return {
    lines,
    verdict: {
      stepCount: steps.length,
      expectedStepCount: expected.value.steps.length,
      bitExact,
      rulesOk: report.ok,
      leafCount: report.leafCount,
      differingLeafCount: leafDiffs.length,
      violationCount: report.violations.length,
    },
  };
}
