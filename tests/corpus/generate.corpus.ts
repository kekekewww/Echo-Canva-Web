import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validateScene } from "@/domain/scene/validate";
import { validateSceneDocument } from "@/domain/scene-document/validate";
import { corpusCaseDefinitions } from "../../benchmarks/corpus/harness/definitions";
import { runCorpusCase } from "../../benchmarks/corpus/harness/ts-serial-adapter";
import type { CorpusCaseDefinition } from "../../benchmarks/corpus/harness/types";
import { canonicalize, sha256Hex } from "../../scripts/corpus/lib.mjs";

const ROOT = resolve(process.cwd());
const CORPUS_DIR = "benchmarks/corpus/v1";
const BASELINE_COMMIT = "98a4374fa839aa5dee7c6c35e575b8003f7f1a31";
const EQUIVALENT_COMMITS = ["dd57934c31915c64c0c505face8cdb7534a24346"];

function gitTreeHash(path: string): string {
  return execFileSync("git", ["rev-parse", `${BASELINE_COMMIT}:${path}`], { cwd: ROOT, encoding: "utf8" }).trim();
}

function assertValidInput(definition: CorpusCaseDefinition): void {
  const input = definition.input as { scene?: unknown; document?: unknown };
  if (definition.kind === "classic-frame") {
    const result = validateScene(input.scene);
    if (!result.ok) throw new Error(`${definition.id}: scene is invalid: ${result.errors[0]?.message}`);
  } else if (definition.kind === "hybrid-frame") {
    const result = validateSceneDocument(input.document);
    if (!result.ok) throw new Error(`${definition.id}: document is invalid: ${result.errors[0]?.message}`);
  }
}

function writeLf(path: string, text: string): { sha256: string; bytes: number } {
  writeFileSync(resolve(ROOT, path), text, { encoding: "utf8" });
  return { sha256: sha256Hex(text), bytes: Buffer.byteLength(text, "utf8") };
}

describe("corpus generator", () => {
  it("writes the frozen corpus", () => {
    if (process.env.ECHO_CORPUS_UPDATE !== "1") {
      throw new Error("Refusing to write the corpus: set ECHO_CORPUS_UPDATE=1.");
    }
    const rulesPath = resolve(ROOT, CORPUS_DIR, "comparison-rules.json");
    if (existsSync(rulesPath)) {
      const rules = JSON.parse(readFileSync(rulesPath, "utf8")) as { status?: string };
      if (rules.status === "frozen") throw new Error("Refusing to regenerate: comparison rules are frozen.");
    }

    const definitions = corpusCaseDefinitions();
    expect(new Set(definitions.map(({ id }) => id)).size).toBe(definitions.length);

    rmSync(resolve(ROOT, CORPUS_DIR, "inputs"), { recursive: true, force: true });
    rmSync(resolve(ROOT, CORPUS_DIR, "expected"), { recursive: true, force: true });
    mkdirSync(resolve(ROOT, CORPUS_DIR, "inputs"), { recursive: true });
    mkdirSync(resolve(ROOT, CORPUS_DIR, "expected"), { recursive: true });

    const cases = definitions.map((definition) => {
      assertValidInput(definition);
      const inputText = `${JSON.stringify(definition.input, null, 2)}\n`;
      const run = () => runCorpusCase(definition.id, definition.kind, JSON.parse(inputText));
      const output = run();
      const canonical = canonicalize(output);
      const again = canonicalize(run()).text;
      if (again !== canonical.text) {
        throw new Error(`${definition.id}: two in-process computations differ`);
      }
      if (canonical.negativeZeroPaths.length > 0) {
        console.info(`[corpus-generate] ${definition.id} negative zero at: ${canonical.negativeZeroPaths.join(", ")}`);
      }
      if (output.outcome === "error") {
        console.info(`[corpus-generate] ${definition.id} error outcome: ${output.error.name}: ${output.error.message}`);
      }
      const inputPath = `${CORPUS_DIR}/inputs/${definition.id}.json`;
      const expectedPath = `${CORPUS_DIR}/expected/${definition.id}.json`;
      return {
        id: definition.id,
        mode: definition.mode,
        kind: definition.kind,
        tags: definition.tags,
        scenario: definition.scenario,
        source: definition.source,
        seed: definition.seed,
        counts: definition.counts,
        license: "MIT (repository)",
        input: { path: inputPath, ...writeLf(inputPath, inputText) },
        expected: { path: expectedPath, ...writeLf(expectedPath, canonical.text) },
      };
    });

    const manifest = {
      corpusId: "echo-canvas-common",
      corpusVersion: "1",
      baseline: {
        commit: BASELINE_COMMIT,
        equivalentCommits: EQUIVALENT_COMMITS,
        treeHashes: {
          src: gitTreeHash("src"),
          "package.json": gitTreeHash("package.json"),
          "pnpm-lock.yaml": gitTreeHash("pnpm-lock.yaml"),
          "pnpm-workspace.yaml": gitTreeHash("pnpm-workspace.yaml"),
          patches: gitTreeHash("patches"),
        },
      },
      runtime: { node: "22.23.3", pnpm: "11.7.0" },
      prng: {
        algorithm: "lcg32-v1",
        multiplier: 1664525,
        increment: 1013904223,
        modulus: "2^32",
        output: "state / 2^32",
      },
      rules: { path: "comparison-rules.json", sha256: null },
      cases,
    };
    writeLf(`${CORPUS_DIR}/manifest.json`, canonicalize(manifest).text);
  });
});
