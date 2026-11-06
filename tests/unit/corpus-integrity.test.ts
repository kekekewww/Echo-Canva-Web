import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
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
  aggregateSha256,
  canonicalize,
  collectGitInfo,
  packageJsonNoScriptsSha256,
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
// beforeEach copies it too, and hooks have their own 10 s default.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The dev container has neither git nor a .git directory.
const HAS_GIT = spawnSync("git", ["rev-parse", "--git-dir"], { cwd: REPO, stdio: "ignore" }).status === 0;

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
    expect(result.caseCount).toBe(86);
    expect(result.corpusSha256).toBe(sha256Hex(readFileSync(path.join(REAL, "manifest.json"))));
  });

  it("accepts the real corpus as frozen", () => {
    const result = verifyCorpus(REAL, { requireFrozen: true });
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("reports a manifest without cases", () => {
    const manifest = manifestOf(copy);
    manifest.cases = [];
    writeManifest(copy, manifest);
    const result = verifyCorpus(copy);
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/no cases|cases is empty/);
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
    writeFileSync(file, `\uFEFF${readFileSync(file, "utf8")}`);
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

describe("freeze anchors on the real corpus", () => {
  const evidence = (name: string) =>
    JSON.parse(read(REAL, `evidence/${name}.json`)) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  it("pins the manifest hash in the acceptance rerun and the sensitivity run", () => {
    const manifestSha = sha256Hex(readFileSync(path.join(REAL, "manifest.json")));
    const acceptance = evidence("acceptance-rerun");
    expect(acceptance.corpusSha256).toBe(manifestSha);
    const runs = Object.entries(acceptance.runs as Record<string, { corpusSha256: string }>);
    expect(runs.length).toBeGreaterThan(0);
    for (const [name, run] of runs) expect(run.corpusSha256, `run ${name}`).toBe(manifestSha);
    expect(evidence("sensitivity").corpusSha256).toBe(manifestSha);
  });

  it("pins the rules hash in the sensitivity evidence", () => {
    expect(manifestOf(REAL).rules.sha256).toBe(evidence("sensitivity").rulesSha256);
  });

  it("pins the expected outputs to the accepted aggregate", () => {
    const hashes = Object.fromEntries(manifestOf(REAL).cases.map((entry) => [entry.id, entry.expected.sha256]));
    expect(aggregateSha256(hashes)).toBe(evidence("acceptance-rerun").runs.A.aggregateSha256);
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

  it("verify --require-frozen passes on the real corpus", () => {
    const result = runCli(["verify", "--require-frozen"]);
    expect(result.status, result.stderr + result.stdout).toBe(0);
  });

  it("verify --require-frozen fails on a copy with a proposed class, plain verify passes", () => {
    reopenAsDraft(copy);
    expect(runCli(["verify", "--corpus", copy]).status).toBe(0);
    const result = runCli(["verify", "--require-frozen", "--corpus", copy]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/hybrid-gain-db|proposed|frozen/);
  });

  it("has corpus:verify require the freeze", () => {
    const scripts = (JSON.parse(readFileSync(path.join(REPO, "package.json"), "utf8")) as { scripts: Record<string, string> }).scripts;
    expect(scripts["corpus:verify"]).toBe("node scripts/corpus/cli.mjs verify --require-frozen");
  });

  it("refuses to freeze while a class is proposed and leaves the files unchanged", () => {
    reopenAsDraft(copy);
    const before = [read(copy, "manifest.json"), read(copy, "comparison-rules.json")];
    const result = runCli(["freeze", "--frozen-on", "2026-11-06", "--corpus", copy]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/proposed/);
    expect([read(copy, "manifest.json"), read(copy, "comparison-rules.json")]).toEqual(before);
  });

  it("compare flags an extra output in either directory", () => {
    const manifest = manifestOf(copy);
    for (const name of ["X", "Y"]) {
      const outputs = path.join(temp, name, "outputs");
      mkdirSync(outputs, { recursive: true });
      for (const entry of manifest.cases) {
        writeFileSync(path.join(outputs, `${entry.id}.json`), read(copy, local(entry.expected.path)));
      }
    }
    const clean = runCli(["compare", path.join(temp, "X"), path.join(temp, "Y"), "--corpus", copy]);
    expect(clean.status, clean.stderr + clean.stdout).toBe(0);
    writeFileSync(path.join(temp, "Y", "outputs", "STALE_CASE.json"), "{}\n");
    const second = runCli(["compare", path.join(temp, "X"), path.join(temp, "Y"), "--corpus", copy]);
    expect(second.status, second.stdout).not.toBe(0);
    expect(second.stdout).toMatch(/extra=1/);
    const first = runCli(["compare", path.join(temp, "Y"), path.join(temp, "X"), "--corpus", copy]);
    expect(first.status, first.stdout).not.toBe(0);
    expect(first.stdout).toMatch(/extra=1/);
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

  it("refresh-rules-hash refuses once the rules are frozen and leaves the files unchanged", () => {
    const manifest = manifestOf(copy);
    writeFileSync(path.join(copy, manifest.rules.path), `${read(copy, manifest.rules.path)}\n`);
    const before = [read(copy, "manifest.json"), read(copy, manifest.rules.path)];
    const result = runCli(["refresh-rules-hash", "--corpus", copy]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/frozen/);
    expect([read(copy, "manifest.json"), read(copy, manifest.rules.path)]).toEqual(before);
  });

  it("refresh-rules-hash rewrites only the rules hash while the rules are draft", () => {
    reopenAsDraft(copy);
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
  it.skipIf(!HAS_GIT)("keeps raw NUL bytes and UTF-8 BOMs out of the corpus sources", () => {
    const listed = spawnSync(
      "git",
      ["ls-files", "scripts/corpus", "benchmarks/corpus/harness", "tests/corpus", "tests/unit/corpus-comparator.test.ts",
        "tests/unit/corpus-integrity.test.ts", "tests/unit/corpus-replay.test.ts"],
      { cwd: REPO, encoding: "utf8" },
    );
    expect(listed.status).toBe(0);
    const files = listed.stdout.split("\n").filter((name) => name.length > 0);
    expect(files.length).toBeGreaterThan(5);
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    for (const file of files) {
      const bytes = readFileSync(path.join(REPO, file));
      expect(bytes.includes(0), `${file} NUL`).toBe(false);
      expect(bytes.includes(bom), `${file} BOM`).toBe(false);
    }
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

  describe.skipIf(!HAS_GIT)("collectGitInfo against HEAD", () => {
    const gitOut = (...args: string[]) =>
      spawnSync("git", args, { cwd: REPO, encoding: "utf8" }).stdout.trim();
    const headBaseline = () => ({
      treeHashes: Object.fromEntries(
        ["src", "pnpm-lock.yaml", "pnpm-workspace.yaml", "patches"].map((name) => [name, gitOut("rev-parse", `HEAD:${name}`)]),
      ),
      packageJsonNoScriptsSha256: packageJsonNoScriptsSha256(gitOut("show", "HEAD:package.json")),
    });

    it("matches a baseline built from the current HEAD trees", () => {
      const info = collectGitInfo(REPO, headBaseline());
      expect(info.productTreesMatchBaseline).toBe(true);
      expect(info.productTreeDiffs).toEqual([]);
    });

    it("names the tree whose hash differs", () => {
      const baseline = headBaseline();
      baseline.treeHashes.src = "0".repeat(40);
      const info = collectGitInfo(REPO, baseline);
      expect(info.productTreesMatchBaseline).toBe(false);
      expect(info.productTreeDiffs).toEqual(["src"]);
    });
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
  it("has no absolute path or email in the corpus files, README or this work's knowledge pages", () => {
    const files: string[] = ["benchmarks/corpus/README.md"];
    // Pages written for this work only. Other knowledge pages have their own history.
    files.push(
      "knowledge/raw/sources/ec-101-corpus-baseline.md",
      "knowledge/sessions/2026-11-06-claude-ec-101-corpus.md",
      "knowledge/handoffs/2026-11-06-ec-101-claude.md",
    );
    for (const name of ["manifest.json", "comparison-rules.json"]) files.push(`benchmarks/corpus/v1/${name}`);
    for (const dir of ["evidence", "inputs", "expected"]) {
      const full = path.join(REAL, dir);
      if (!existsSync(full)) continue;
      for (const name of readdirSync(full)) if (name.endsWith(".json")) files.push(`benchmarks/corpus/v1/${dir}/${name}`);
    }
    expect(files.length).toBeGreaterThan(170);
    for (const file of files) {
      const full = path.join(REPO, file);
      if (!existsSync(full)) continue; // a knowledge page may not be checked out
      const match = PRIVACY.exec(readFileSync(full, "utf8"));
      expect(match === null ? null : `${file}: ${match[0]}`).toBeNull();
    }
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
    // Whether the product trees match the baseline depends on the branch, so it is tested on collectGitInfo.
    expect(parsed).toHaveProperty("productTreesMatchBaseline");
    expect(parsed).toMatchObject({
      runId: "privacy",
      order: "manifest",
      corpusSha256: sha256Hex(readFileSync(path.join(REAL, "manifest.json"))),
    });
  }, 300_000);
});
