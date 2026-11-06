import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validateScene } from "@/domain/scene/validate";
import { validateSceneDocument } from "@/domain/scene-document/validate";
import { corpusCaseDefinitions } from "../../benchmarks/corpus/harness/definitions";
import { runCorpusCase } from "../../benchmarks/corpus/harness/ts-serial-adapter";
import type { CorpusCaseDefinition } from "../../benchmarks/corpus/harness/types";
import { canonicalize, packageJsonNoScriptsSha256, sha256Hex } from "../../scripts/corpus/lib.mjs";

const ROOT = resolve(process.cwd());
const CORPUS_DIR = "benchmarks/corpus/v1";
const BASELINE_COMMIT = "98a4374fa839aa5dee7c6c35e575b8003f7f1a31";
const EQUIVALENT_COMMITS = ["dd57934c31915c64c0c505face8cdb7534a24346"];

function gitPackageJsonNoScriptsSha256(): string {
  const text = execFileSync("git", ["show", `${BASELINE_COMMIT}:package.json`], { cwd: ROOT, encoding: "utf8" });
  return packageJsonNoScriptsSha256(text);
}

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

function writeLf(path: string, text: string): void {
  writeFileSync(resolve(ROOT, path), text, { encoding: "utf8" });
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

    const nodeVersion = process.versions.node;
    const pinnedNode = readFileSync(resolve(ROOT, ".nvmrc"), "utf8").trim().replace(/^v/, "");
    if (nodeVersion !== pinnedNode) {
      throw new Error(`Refusing to generate on Node ${nodeVersion}: .nvmrc pins ${pinnedNode}.`);
    }
    const packageManager = (JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")) as {
      packageManager?: string;
    }).packageManager ?? "";
    const pnpmVersion = /^pnpm@(\d+\.\d+\.\d+)/.exec(packageManager)?.[1];
    if (!pnpmVersion) throw new Error("package.json packageManager does not name a pnpm version.");

    // Compute everything in memory first so a throw leaves the existing corpus untouched.
    const pending: { inputPath: string; inputText: string; expectedPath: string; expectedText: string }[] = [];
    const cases = definitions.map((definition) => {
      assertValidInput(definition);
      const inputText = `${JSON.stringify(definition.input, null, 2)}
`;
      const run = () => runCorpusCase(definition.id, definition.kind, JSON.parse(inputText));
      const output = run();
      if (output.outcome !== definition.expectedOutcome) {
        const detail = output.outcome === "error" ? `${output.error.name}: ${output.error.message}` : "ok";
        throw new Error(
          `${definition.id}: expected outcome ${definition.expectedOutcome} but got ${output.outcome} (${detail})`,
        );
      }
      const canonical = canonicalize(output);
      const again = canonicalize(run()).text;
      if (again !== canonical.text) {
        throw new Error(`${definition.id}: two in-process computations differ`);
      }
      if (canonical.negativeZeroPaths.length > 0) {
        console.info(`[corpus-generate] ${definition.id} negative zero at: ${canonical.negativeZeroPaths.join(", ")}`);
      }
      const inputPath = `${CORPUS_DIR}/inputs/${definition.id}.json`;
      const expectedPath = `${CORPUS_DIR}/expected/${definition.id}.json`;
      pending.push({ inputPath, inputText, expectedPath, expectedText: canonical.text });
      return {
        id: definition.id,
        mode: definition.mode,
        kind: definition.kind,
        expectedOutcome: definition.expectedOutcome,
        tags: definition.tags,
        scenario: definition.scenario,
        source: definition.source,
        seed: definition.seed,
        counts: definition.counts,
        license: "MIT (repository)",
        input: { path: inputPath, sha256: sha256Hex(inputText), bytes: Buffer.byteLength(inputText, "utf8") },
        expected: {
          path: expectedPath,
          sha256: sha256Hex(canonical.text),
          bytes: Buffer.byteLength(canonical.text, "utf8"),
        },
      };
    });

    const manifest = {
      corpusId: "echo-canvas-common",
      corpusVersion: "1",
      baseline: {
        commit: BASELINE_COMMIT,
        equivalentCommits: EQUIVALENT_COMMITS,
        packageJsonNoScriptsSha256: gitPackageJsonNoScriptsSha256(),
        treeHashes: {
          src: gitTreeHash("src"),
          "package.json": gitTreeHash("package.json"),
          "pnpm-lock.yaml": gitTreeHash("pnpm-lock.yaml"),
          "pnpm-workspace.yaml": gitTreeHash("pnpm-workspace.yaml"),
          patches: gitTreeHash("patches"),
        },
      },
      runtime: { node: nodeVersion, pnpm: pnpmVersion },
      prng: {
        algorithm: "lcg32-v1",
        multiplier: 1664525,
        increment: 1013904223,
        modulus: "2^32",
        output: "state / 2^32",
      },
      rules: {
        path: "comparison-rules.json",
        sha256: existsSync(rulesPath) ? sha256Hex(readFileSync(rulesPath)) : null,
      },
      cases,
    };
    const manifestText = canonicalize(manifest).text;

    rmSync(resolve(ROOT, CORPUS_DIR, "inputs"), { recursive: true, force: true });
    rmSync(resolve(ROOT, CORPUS_DIR, "expected"), { recursive: true, force: true });
    mkdirSync(resolve(ROOT, CORPUS_DIR, "inputs"), { recursive: true });
    mkdirSync(resolve(ROOT, CORPUS_DIR, "expected"), { recursive: true });
    for (const entry of pending) {
      writeLf(entry.inputPath, entry.inputText);
      writeLf(entry.expectedPath, entry.expectedText);
    }
    writeLf(`${CORPUS_DIR}/manifest.json`, manifestText);
  });
});
