import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, it } from "vitest";

import { runCorpusCase } from "../../benchmarks/corpus/harness/ts-serial-adapter";
import type { CorpusCaseKind } from "../../benchmarks/corpus/harness/types";
import {
  aggregateSha256,
  canonicalize,
  collectEnvironment,
  collectGitInfo,
  sha256Hex,
} from "../../scripts/corpus/lib.mjs";

const ROOT = resolve(process.cwd());

type ManifestCase = {
  id: string;
  kind: CorpusCaseKind;
  input: { path: string; sha256: string };
};

function corpusFile(corpusDir: string, manifestPath: string): string {
  return resolve(corpusDir, manifestPath.replace(/^benchmarks\/corpus\/v1\//, ""));
}

describe("corpus run", () => {
  it("writes canonical outputs and run.json for every case", () => {
    const runDirValue = process.env.ECHO_CORPUS_RUN_DIR;
    if (!runDirValue) throw new Error("Set ECHO_CORPUS_RUN_DIR (use scripts/corpus/cli.mjs run).");
    const order = process.env.ECHO_CORPUS_ORDER ?? "manifest";
    if (order !== "manifest" && order !== "reverse") throw new Error(`Unknown ECHO_CORPUS_ORDER ${order}`);
    const runDir = resolve(runDirValue);
    const corpusDir = resolve(ROOT, process.env.ECHO_CORPUS_DIR ?? "benchmarks/corpus/v1");

    const manifestBytes = readFileSync(resolve(corpusDir, "manifest.json"));
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as {
      baseline: { treeHashes: Record<string, string> };
      cases: ManifestCase[];
    };
    const cases = order === "reverse" ? [...manifest.cases].reverse() : manifest.cases;

    const startedAt = new Date().toISOString();
    rmSync(resolve(runDir, "outputs"), { recursive: true, force: true });
    mkdirSync(resolve(runDir, "outputs"), { recursive: true });

    const caseHashes: Record<string, string> = {};
    const negativeZeroPaths: Record<string, string[]> = {};
    for (const entry of cases) {
      const inputText = readFileSync(corpusFile(corpusDir, entry.input.path), "utf8");
      if (sha256Hex(inputText) !== entry.input.sha256) {
        throw new Error(`${entry.id}: input hash differs from the manifest; run verify first`);
      }
      const canonical = canonicalize(runCorpusCase(entry.id, entry.kind, JSON.parse(inputText)));
      writeFileSync(resolve(runDir, "outputs", `${entry.id}.json`), canonical.text);
      caseHashes[entry.id] = sha256Hex(canonical.text);
      if (canonical.negativeZeroPaths.length > 0) negativeZeroPaths[entry.id] = canonical.negativeZeroPaths;
    }

    const runId = runDir.split(/[\\/]/).pop() ?? "run";
    const run = {
      runId,
      order,
      corpusSha256: sha256Hex(manifestBytes),
      ...collectGitInfo(ROOT, manifest.baseline.treeHashes),
      environment: collectEnvironment(),
      caseHashes: Object.fromEntries(Object.entries(caseHashes).sort(([a], [b]) => (a < b ? -1 : 1))),
      aggregateSha256: aggregateSha256(caseHashes),
      negativeZeroPaths,
      startedAt,
    };
    writeFileSync(resolve(runDir, "run.json"), `${JSON.stringify(run, null, 2)}\n`);
  });
});
