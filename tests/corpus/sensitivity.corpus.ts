import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, it } from "vitest";

import { classicProjectionHash } from "@/domain/scene-document/validate";
import { lcg32 } from "../../benchmarks/corpus/harness/prng";
import { runCorpusCase } from "../../benchmarks/corpus/harness/ts-serial-adapter";
import type { CorpusCaseKind } from "../../benchmarks/corpus/harness/types";
import { canonicalize, collectGitInfo, compareOutputs, sha256Hex } from "../../scripts/corpus/lib.mjs";
import type { CorpusRules } from "../../scripts/corpus/lib.mjs";

const ROOT = resolve(process.cwd());
const CORPUS_DIR = "benchmarks/corpus/v1";
const SEED = 20261106;
const DELTAS_M = [1e-12, 1e-9];
const KINDS = new Set<CorpusCaseKind>(["classic-frame", "hybrid-frame", "classic-tape", "hybrid-tape"]);
const POSITION_KEYS = new Set(["position", "a", "b"]);
const AXES = ["x", "y", "z"] as const;
const MAX_EXAMPLES = 3;
// These hash the exact input doubles, so any coordinate change moves them. They are counted, not treated as flips.
const HASH_PATH = /\/(staticFingerprint|staticGeometryHash|classicProjectionHash)$/;
const ALGORITHM =
  "Per case and delta the lcg32 generator is restarted from the seed. Walking the input depth-first in authored key order, " +
  "every numeric x, y and z of an object stored under the key position, a or b (listener, sources, wall endpoints, " +
  "primitives and tape events) takes one draw u; the coordinate moves by -delta when u < 0.5 and by +delta otherwise. " +
  "Room, portal and height fields are not touched. Hybrid documents get their classic projection hash recomputed. " +
  "The perturbed output is compared with the unperturbed output of the same code under comparison-rules.json.";

type ManifestCase = { id: string; kind: CorpusCaseKind; input: { path: string } };
type Example = { caseId: string; path: string; expected: unknown; actual: unknown; detail?: string };
type Cell = {
  /** Numeric leaves compared, in every unit. */
  sampleCount: number;
  /** Numeric leaves compared in units (frames, or single tape steps) that had no discrete flip. */
  cleanSampleCount: number;
  /** Largest absolute change in units without a discrete flip, so reordered arrays do not masquerade as drift. */
  maxAbsDelta: number;
  worst: { caseId: string; path: string } | null;
  /** Largest absolute change over every unit, including units whose arrays were reordered or resized. */
  maxAbsDeltaIncludingFlippedUnits: number;
  worstIncludingFlippedUnits: { caseId: string; path: string } | null;
  discreteFlips: { count: number; examples: Example[] };
  /** Leaves outside the class tolerance, counted in units without a discrete flip. */
  toleranceViolations: number;
  toleranceViolationsIncludingFlippedUnits: number;
};

function readText(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Perturbs coordinates in place and returns how many were moved. */
function perturb(root: unknown, deltaM: number): number {
  const draw = lcg32(SEED);
  let moved = 0;
  const visit = (node: unknown, key: string | null): void => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, key);
      return;
    }
    if (!isRecord(node)) return;
    if (key !== null && POSITION_KEYS.has(key)) {
      for (const axis of AXES) {
        const value = node[axis];
        if (typeof value === "number") {
          node[axis] = value + (draw() < 0.5 ? -deltaM : deltaM);
          moved += 1;
        }
      }
    }
    for (const [childKey, child] of Object.entries(node)) visit(child, childKey);
  };
  visit(root, null);
  return moved;
}

function emptyCell(): Cell {
  return {
    sampleCount: 0,
    cleanSampleCount: 0,
    maxAbsDelta: 0,
    worst: null,
    maxAbsDeltaIncludingFlippedUnits: 0,
    worstIncludingFlippedUnits: null,
    discreteFlips: { count: 0, examples: [] },
    toleranceViolations: 0,
    toleranceViolationsIncludingFlippedUnits: 0,
  };
}

function roundTrip(output: unknown): { outcome: string; value?: unknown } {
  return JSON.parse(canonicalize(output).text) as { outcome: string; value?: unknown };
}

function addFlip(cell: Cell, example: Example): void {
  cell.discreteFlips.count += 1;
  if (cell.discreteFlips.examples.length < MAX_EXAMPLES) cell.discreteFlips.examples.push(example);
}

describe("corpus sensitivity", () => {
  it("measures how far outputs move under sub-micrometre coordinate noise", () => {
    if (process.env.ECHO_CORPUS_UPDATE !== "1") {
      throw new Error("Refusing to write evidence: set ECHO_CORPUS_UPDATE=1.");
    }
    const manifest = JSON.parse(readText(`${CORPUS_DIR}/manifest.json`)) as {
      baseline: { treeHashes: Record<string, string>; packageJsonNoScriptsSha256?: string };
      cases: ManifestCase[];
    };
    const rules = JSON.parse(readText(`${CORPUS_DIR}/comparison-rules.json`)) as CorpusRules;
    const cases = manifest.cases.filter(({ kind }) => KINDS.has(kind));

    const perClass: Record<string, Record<string, Cell>> = {};
    const cellFor = (className: string, deltaKey: string): Cell => {
      perClass[className] ??= {};
      return (perClass[className][deltaKey] ??= emptyCell());
    };
    for (const className of Object.keys(rules.classes)) for (const delta of DELTAS_M) cellFor(className, String(delta));
    const unitsWithFlips: Record<string, Record<string, number>> = Object.fromEntries(
      DELTAS_M.map((delta) => [String(delta), {}]),
    );
    const hashChanges: Record<string, number> = Object.fromEntries(DELTAS_M.map((delta) => [String(delta), 0]));

    const coordinatesPerturbed: Record<string, number> = {};
    for (const entry of cases) {
      const input = JSON.parse(readText(entry.input.path)) as Record<string, unknown>;
      const baseline = roundTrip(runCorpusCase(entry.id, entry.kind, input));
      for (const delta of DELTAS_M) {
        const deltaKey = String(delta);
        const noisy = structuredClone(input);
        coordinatesPerturbed[entry.id] = perturb(noisy, delta);
        const document = noisy.document as
          | { baseScene: Parameters<typeof classicProjectionHash>[0]; compatibility: { classicProjectionHash: string } }
          | undefined;
        if (document) document.compatibility.classicProjectionHash = classicProjectionHash(document.baseScene);
        const output = roundTrip(runCorpusCase(entry.id, entry.kind, noisy));

        const caseFlip = (detail: string, expected: unknown, actual: unknown, path: string): void => {
          addFlip(cellFor("discrete", deltaKey), { caseId: entry.id, path, expected, actual, detail });
          unitsWithFlips[deltaKey]![entry.id] = (unitsWithFlips[deltaKey]![entry.id] ?? 0) + 1;
        };
        const baselineSteps = (baseline.value as { steps?: unknown[] } | undefined)?.steps;
        const outputSteps = (output.value as { steps?: unknown[] } | undefined)?.steps;
        if (output.outcome !== baseline.outcome) {
          caseFlip("a perturbed input made validation or the solver throw", baseline.outcome, output.outcome, "/outcome");
          continue;
        }
        const isTape = baselineSteps !== undefined;
        if (isTape && (outputSteps === undefined || outputSteps.length !== baselineSteps.length)) {
          const stop = (outputSteps?.at(-1) as { error?: { message?: string } } | undefined)?.error?.message;
          caseFlip(`tape length changed${stop ? ` (${stop})` : ""}`, baselineSteps.length, outputSteps?.length ?? null, "/value/steps");
          continue;
        }

        // A frame is one comparison unit. A tape step is its own unit, so a flip in one step
        // does not hide the continuous drift of the other steps.
        const units = isTape
          ? baselineSteps.map((step, index) => ({
              label: `${entry.id}#${index}`,
              expected: { ...baseline, value: { steps: [step] } },
              actual: { ...output, value: { steps: [outputSteps![index]] } },
              remap: (path: string) => path.startsWith("/value/steps/0/") ? `/value/steps/${index}${path.slice("/value/steps/0".length)}` : path,
            }))
          : [{ label: entry.id, expected: baseline, actual: output, remap: (path: string) => path }];

        for (const unit of units) {
          const report = compareOutputs(unit.expected, unit.actual, rules, { caseId: entry.id, kind: entry.kind });
          const isHash = (violation: { type: string; path: string }) =>
            violation.type === "discrete" && HASH_PATH.test(violation.path);
          const flipped = report.violations.some((violation) => violation.type !== "continuous" && !isHash(violation));
          if (flipped) unitsWithFlips[deltaKey]![entry.id] = (unitsWithFlips[deltaKey]![entry.id] ?? 0) + 1;
          for (const [className, stats] of Object.entries(report.stats)) {
            const cell = cellFor(className, deltaKey);
            cell.sampleCount += stats.count;
            const worst = stats.worst ? { caseId: entry.id, path: unit.remap(stats.worst.path) } : null;
            if (stats.maxAbsError > cell.maxAbsDeltaIncludingFlippedUnits && worst) {
              cell.maxAbsDeltaIncludingFlippedUnits = stats.maxAbsError;
              cell.worstIncludingFlippedUnits = worst;
            }
            if (!flipped) {
              cell.cleanSampleCount += stats.count;
              if (stats.maxAbsError > cell.maxAbsDelta && worst) {
                cell.maxAbsDelta = stats.maxAbsError;
                cell.worst = worst;
              }
            }
          }
          for (const violation of report.violations) {
            if (isHash(violation)) {
              hashChanges[deltaKey] = (hashChanges[deltaKey] ?? 0) + 1;
            } else if (violation.type === "continuous") {
              const cell = cellFor(violation.class ?? "unknown", deltaKey);
              cell.toleranceViolationsIncludingFlippedUnits += 1;
              if (!flipped) cell.toleranceViolations += 1;
            } else {
              addFlip(cellFor(violation.class ?? "structure", deltaKey), {
                caseId: entry.id,
                path: unit.remap(violation.path),
                expected: violation.expected,
                actual: violation.actual,
                ...(violation.detail ? { detail: violation.detail } : {}),
              });
            }
          }
        }
      }
    }

    const evidence = {
      algorithm: ALGORITHM,
      seed: SEED,
      deltasM: DELTAS_M,
      perClass,
      unitsWithFlips,
      hashChanges,
      coordinatesPerturbed,
      rulesSha256: sha256Hex(readFileSync(resolve(ROOT, CORPUS_DIR, "comparison-rules.json"))),
      corpusSha256: sha256Hex(readFileSync(resolve(ROOT, CORPUS_DIR, "manifest.json"))),
      gitHead: collectGitInfo(ROOT, manifest.baseline).gitHead,
    };
    mkdirSync(resolve(ROOT, CORPUS_DIR, "evidence"), { recursive: true });
    writeFileSync(resolve(ROOT, CORPUS_DIR, "evidence/sensitivity.json"), canonicalize(evidence).text);
  });
});
