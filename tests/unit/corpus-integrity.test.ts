import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { hostname, tmpdir, userInfo } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canonicalize,
  collectGitInfo,
  parseGitStatusZ,
  sha256Hex,
  verifyCorpus,
} from "../../scripts/corpus/lib.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const REAL = path.join(REPO, "benchmarks/corpus/v1");
const CLI = path.join(REPO, "scripts/corpus/cli.mjs");
const PRIVACY = /(?<![A-Za-z])[A-Za-z]:[\\/]|\/Users\/|\/home\/|[A-Za-z0-9._-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/;

type Entry = { id: string; input: { path: string; sha256: string; bytes: number }; expected: { path: string; sha256: string; bytes: number } };
type Manifest = { rules: { path: string; sha256: string | null }; cases: Entry[] };

// Each test verifies or copies a 7 MB corpus, which outlasts the 5 s default on a slow disk.
vi.setConfig({ testTimeout: 60_000 });

let temp: string;
let copy: string;

beforeEach(() => {
  temp = mkdtempSync(path.join(tmpdir(), "echo-corpus-integrity-"));
  copy = path.join(temp, "v1");
  cpSync(REAL, copy, { recursive: true });
});

afterEach(() => {
  rmSync(temp, { recursive: true, force: true });
});

const read = (root: string, relative: string) => readFileSync(path.join(root, relative), "utf8");
const manifestOf = (root: string) => JSON.parse(read(root, "manifest.json")) as Manifest;
const local = (manifestPath: string) => manifestPath.replace(/^benchmarks\/corpus\/v1\//, "");

function writeManifest(root: string, manifest: Manifest): void {
  writeFileSync(path.join(root, "manifest.json"), canonicalize(manifest).text);
}

function rewriteExpected(root: string, caseId: string, text: string): void {
  const manifest = manifestOf(root);
  const entry = manifest.cases.find(({ id }) => id === caseId)!;
  writeFileSync(path.join(root, local(entry.expected.path)), text);
  entry.expected.sha256 = sha256Hex(text);
  entry.expected.bytes = Buffer.byteLength(text, "utf8");
  writeManifest(root, manifest);
}

function rewriteRules(root: string, change: (text: string) => string): void {
  const manifest = manifestOf(root);
  const text = change(read(root, manifest.rules.path));
  writeFileSync(path.join(root, manifest.rules.path), text);
  manifest.rules.sha256 = sha256Hex(text);
  writeManifest(root, manifest);
}

// The real rules are frozen. Freeze tests start from a draft copy with one undecided class.
function reopenAsDraft(root: string): void {
  rewriteRules(root, (text) =>
    text
      .replace('"status": "frozen"', '"status": "draft"')
      .replace(/"frozenOn": "[^"]*"/, '"frozenOn": null')
      .replace(/("hybrid-gain-db": {[^}]*"status":)"approved"/, '$1"proposed"'),
  );
}

const firstCase = (root: string) => manifestOf(root).cases[0]!;

describe("verifyCorpus", () => {
  it("accepts the real corpus", () => {
    const result = verifyCorpus(REAL);
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.caseCount).toBe(72);
    expect(result.corpusSha256).toBe(sha256Hex(readFileSync(path.join(REAL, "manifest.json"))));
  });

  it("names an input whose bytes changed", () => {
    const entry = firstCase(copy);
    const file = path.join(copy, local(entry.input.path));
    writeFileSync(file, `${readFileSync(file, "utf8")} `);
    const result = verifyCorpus(copy);
    expect(result.ok).toBe(false);
    expect(result.problems.join("\n")).toContain(entry.input.path);
  });

  it("names an expected file that was converted to CRLF", () => {
    const entry = firstCase(copy);
    const file = path.join(copy, local(entry.expected.path));
    writeFileSync(file, readFileSync(file, "utf8").replaceAll("\n", "\r\n"));
    const result = verifyCorpus(copy);
    expect(result.ok).toBe(false);
    expect(result.problems.find((problem) => /CRLF/.test(problem))).toContain(entry.expected.path);
  });

  it("names an expected file that gained a UTF-8 BOM", () => {
    const entry = firstCase(copy);
    const file = path.join(copy, local(entry.expected.path));
    writeFileSync(file, `﻿${readFileSync(file, "utf8")}`);
    const result = verifyCorpus(copy);
    expect(result.ok).toBe(false);
    expect(result.problems.find((problem) => /BOM/.test(problem))).toContain(entry.expected.path);
  });

  it("names an unlisted file in inputs", () => {
    writeFileSync(path.join(copy, "inputs", "ORPHAN_CASE.json"), "{}\n");
    const result = verifyCorpus(copy);
    expect(result.ok).toBe(false);
    expect(result.problems.find((problem) => /orphan/i.test(problem))).toContain("ORPHAN_CASE.json");
  });

  it("flags a new output field as unclassified even with a consistent manifest", () => {
    const entry = firstCase(copy);
    const parsed = JSON.parse(read(copy, local(entry.expected.path))) as Record<string, unknown>;
    rewriteExpected(copy, entry.id, canonicalize({ ...parsed, brandNewField: 1 }).text);
    const result = verifyCorpus(copy);
    expect(result.ok).toBe(false);
    const problem = result.problems.find((text) => /unclassified/.test(text));
    expect(problem).toContain(entry.id);
    expect(problem).toContain("/brandNewField");
  });

  it("checks that the recorded outcome matches the manifest", () => {
    const manifest = manifestOf(copy);
    const entry = manifest.cases[0]! as Entry & { expectedOutcome: string };
    entry.expectedOutcome = "error";
    writeManifest(copy, manifest);
    const result = verifyCorpus(copy);
    expect(result.ok).toBe(false);
    expect(result.problems.find((problem) => /outcome/.test(problem))).toContain(entry.id);
  });

  it("collects problems instead of throwing on a malformed manifest", () => {
    writeFileSync(path.join(copy, "manifest.json"), "{ not json");
    expect(() => verifyCorpus(copy)).not.toThrow();
    expect(verifyCorpus(copy).ok).toBe(false);
    writeFileSync(path.join(copy, "manifest.json"), '{"cases": [null, 3, {"id": 4}]}\n');
    const result = verifyCorpus(copy);
    expect(result.ok).toBe(false);
    expect(result.problems.length).toBeGreaterThan(0);
  });

  it("detects a rules file that no longer matches the manifest hash", () => {
    const manifest = manifestOf(copy);
    writeFileSync(path.join(copy, manifest.rules.path), `${read(copy, manifest.rules.path)} `);
    const result = verifyCorpus(copy);
    expect(result.ok).toBe(false);
    expect(result.problems.join("\n")).toContain(manifest.rules.path);
  });

  it("names a proposed class when frozen rules are required", () => {
    rewriteRules(copy, (text) =>
      text.replace(/("classic-length-m": \{[^\n]*"status":)"existing-test"/, '$1"proposed"'),
    );
    expect(verifyCorpus(copy).ok).toBe(true);
    const result = verifyCorpus(copy, { requireFrozen: true });
    expect(result.ok).toBe(false);
    expect(result.problems.join("\n")).toContain("classic-length-m");
  });
});

function runCli(args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: REPO, encoding: "utf8", timeout: 60_000 });
}

describe("corpus CLI", () => {
  it("verifies the real corpus", () => {
    const result = runCli(["verify"]);
    expect(result.status, result.stderr + result.stdout).toBe(0);
  });

  it("refuses to freeze while a class is proposed and leaves the files unchanged", () => {
    reopenAsDraft(copy);
    const before = [read(copy, "manifest.json"), read(copy, "comparison-rules.json")];
    const result = runCli(["freeze", "--frozen-on", "2026-11-06", "--corpus", copy]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/proposed/);
    expect([read(copy, "manifest.json"), read(copy, "comparison-rules.json")]).toEqual(before);
  });

  it("freezes once every class is decided and rewrites the rules hash", () => {
    reopenAsDraft(copy);
    rewriteRules(copy, (text) => text.replaceAll('"status":"proposed"', '"status":"approved"'));
    const result = runCli(["freeze", "--frozen-on", "2026-11-06", "--corpus", copy]);
    expect(result.status, result.stderr).toBe(0);
    const rules = JSON.parse(read(copy, "comparison-rules.json")) as { status: string; frozenOn: string };
    expect(rules).toMatchObject({ status: "frozen", frozenOn: "2026-11-06" });
    expect(manifestOf(copy).rules.sha256).toBe(sha256Hex(read(copy, "comparison-rules.json")));
    expect(verifyCorpus(copy, { requireFrozen: true }).problems).toEqual([]);
  });

  it("refresh-rules-hash rewrites only the rules hash", () => {
    const manifest = manifestOf(copy);
    writeFileSync(path.join(copy, manifest.rules.path), `${read(copy, manifest.rules.path)}\n`);
    expect(verifyCorpus(copy).ok).toBe(false);
    const result = runCli(["refresh-rules-hash", "--corpus", copy]);
    expect(result.status, result.stderr).toBe(0);
    const after = manifestOf(copy);
    expect(after.rules.sha256).toBe(sha256Hex(read(copy, manifest.rules.path)));
    expect({ ...after, rules: manifest.rules }).toEqual(manifest);
    expect(verifyCorpus(copy).problems).toEqual([]);
  });
});

describe("source hygiene and git facts", () => {
  it("keeps raw NUL bytes out of the corpus sources", () => {
    const listed = spawnSync(
      "git",
      ["ls-files", "scripts/corpus", "benchmarks/corpus/harness", "tests/corpus", "tests/unit/corpus-comparator.test.ts",
        "tests/unit/corpus-integrity.test.ts", "tests/unit/corpus-replay.test.ts"],
      { cwd: REPO, encoding: "utf8" },
    );
    expect(listed.status).toBe(0);
    const files = listed.stdout.split("\n").filter((name) => name.length > 0);
    expect(files.length).toBeGreaterThan(5);
    for (const file of files) expect(readFileSync(path.join(REPO, file)).includes(0), file).toBe(false);
  });

  it("parses NUL-separated git status into repo-relative paths", () => {
    const nul = "\u0000";
    const status = [" M docs/with space/a b.md", "?? new-file.txt", "R  renamed/new.ts", "old/name.ts", "A  added.ts", ""].join(nul);
    expect(parseGitStatusZ(status)).toEqual([
      "added.ts",
      "docs/with space/a b.md",
      "new-file.txt",
      "renamed/new.ts",
    ]);
    expect(parseGitStatusZ("")).toEqual([]);
  });

  it("reports unknown product trees when git cannot answer", () => {
    const outside = mkdtempSync(path.join(temp, "no-repo-"));
    const previous = process.env.GIT_CEILING_DIRECTORIES;
    process.env.GIT_CEILING_DIRECTORIES = temp;
    try {
      const info = collectGitInfo(outside, { treeHashes: {}, packageJsonNoScriptsSha256: "x" });
      expect(info.gitHead).toBe("unavailable");
      expect(info.gitDirty).toBe("unavailable");
      expect(info.productTreesMatchBaseline).toBe("unavailable");
      expect(info.productTreeDiffs).toBe("unavailable");
      expect(info.packageJsonNoScriptsSha256).toBe("unavailable");
    } finally {
      if (previous === undefined) delete process.env.GIT_CEILING_DIRECTORIES;
      else process.env.GIT_CEILING_DIRECTORIES = previous;
    }
  });
});

describe("public files stay free of local identity", () => {
  it("has no absolute path or email in the manifest, rules or evidence", () => {
    const files = ["manifest.json", "comparison-rules.json"];
    const evidence = path.join(REAL, "evidence");
    if (existsSync(evidence)) {
      for (const name of readdirSync(evidence)) if (name.endsWith(".json")) files.push(`evidence/${name}`);
    }
    for (const file of files) expect(read(REAL, file), file).not.toMatch(PRIVACY);
  });

  it("writes a run.json without hostname, username or absolute paths", () => {
    const out = path.join(temp, "runs");
    const result = spawnSync(process.execPath, [CLI, "run", "--run-id", "privacy", "--out", out], {
      cwd: REPO,
      encoding: "utf8",
      timeout: 240_000,
    });
    expect(result.status, result.stderr + result.stdout).toBe(0);
    const text = readFileSync(path.join(out, "privacy", "run.json"), "utf8");
    expect(text).not.toMatch(PRIVACY);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty("hostname");
    expect(parsed).not.toHaveProperty("username");
    expect(JSON.stringify(parsed)).not.toMatch(/"(hostname|username)"/);
    const host = hostname();
    const user = userInfo().username;
    if (host.length > 3) expect(text.toLowerCase()).not.toContain(host.toLowerCase());
    if (user.length > 3) expect(text.toLowerCase()).not.toContain(user.toLowerCase());
    // Committed trees only, so an uncommitted working tree does not matter.
    expect(parsed).toMatchObject({ productTreesMatchBaseline: true, productTreeDiffs: [] });
    expect(parsed).toMatchObject({
      runId: "privacy",
      order: "manifest",
      corpusSha256: sha256Hex(readFileSync(path.join(REAL, "manifest.json"))),
    });
  }, 300_000);
});
