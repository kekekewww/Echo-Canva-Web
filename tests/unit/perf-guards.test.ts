import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { assertInsideRepo, isInside, tempEnvironment } from "../../scripts/perf/lib.mjs";

const ROOT = resolve(process.cwd());

describe("path guard", () => {
  it("accepts the root and paths below it, and rejects siblings and parents", () => {
    expect(isInside(ROOT, ROOT)).toBe(true);
    expect(isInside(ROOT, join(ROOT, ".perf-runs", "x"))).toBe(true);
    expect(isInside(ROOT, join(ROOT, "a", "..", "b"))).toBe(true);
    expect(isInside(ROOT, dirname(ROOT))).toBe(false);
    expect(isInside(ROOT, `${ROOT}-sibling`)).toBe(false);
    expect(isInside(ROOT, join(ROOT, "..", "elsewhere"))).toBe(false);
  });

  it("throws a message naming the option when a path leaves the repository", () => {
    expect(() => assertInsideRepo(join(ROOT, "..", "outside"), "--out", ROOT)).toThrow(/--out must resolve inside the repository root/);
    expect(assertInsideRepo(join(ROOT, ".perf-runs", "ok"), "--out", ROOT)).toBe(join(ROOT, ".perf-runs", "ok"));
  });

  it("makes the run command refuse an --out outside the repository before doing any work", () => {
    const outside = join(dirname(ROOT), "ec102-should-not-exist");
    const result = spawnSync(
      process.execPath,
      ["scripts/perf/cli.mjs", "run", "--variant", "TS-S", "--case", "TC01_LISTENER_TAPE_SEEDED", "--run-id", "guard-test", "--out", outside],
      { cwd: ROOT, encoding: "utf8" },
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--out must resolve inside the repository root");
    expect(existsSync(outside)).toBe(false);
  });

  it("refuses summarize paths outside the repository", () => {
    const result = spawnSync(process.execPath, ["scripts/perf/cli.mjs", "summarize", "--out", ".perf-runs/none", "--to", join(dirname(ROOT), "ec102-evidence")], { cwd: ROOT, encoding: "utf8" });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--to must resolve inside the repository root");
  });
});

describe("temp environment guard", () => {
  const inside = join(ROOT, ".claude", "ec102-tmp");
  const all = { TEMP: inside, TMP: inside, TMPDIR: inside };

  it("returns the three variables when they are set inside the worktree", () => {
    expect(tempEnvironment(ROOT, all, "win32")).toEqual({ TEMP: inside, TMP: inside, TMPDIR: inside });
  });

  it("refuses on Windows when one is unset or points outside", () => {
    expect(() => tempEnvironment(ROOT, { TEMP: inside, TMP: inside }, "win32")).toThrow(/TMPDIR is not set/);
    expect(() => tempEnvironment(ROOT, {}, "win32")).toThrow(/TEMP is not set/);
    expect(() => tempEnvironment(ROOT, { ...all, TMP: join(dirname(ROOT), "tmp") }, "win32")).toThrow(/TMP points outside the worktree/);
  });

  it("does not enforce the rule on other platforms", () => {
    expect(tempEnvironment(ROOT, {}, "darwin")).toEqual({});
    expect(tempEnvironment(ROOT, { TMPDIR: ["", "var", "folders", "x"].join("/") }, "linux")).toEqual({});
  });
});

describe("spawns in scripts/perf", () => {
  const files = readdirSync(join(ROOT, "scripts", "perf")).filter((name) => name.endsWith(".mjs"));

  it("never starts a shell or builds a command line from a string", () => {
    for (const name of files) {
      const text = readFileSync(join(ROOT, "scripts", "perf", name), "utf8");
      expect(text, `${name} uses shell: true`).not.toMatch(/shell:\s*true/);
      expect(text, `${name} calls exec( or execSync(`).not.toMatch(/(?<![.\w])exec(Sync)?\(/);
    }
  });

  it("passes only argument arrays to spawn, spawnSync and execFile", () => {
    for (const name of files) {
      const text = readFileSync(join(ROOT, "scripts", "perf", name), "utf8");
      for (const match of text.matchAll(/\b(spawn|spawnSync|execFileAsync)\(\s*([^,]+),\s*(\[|\.\.\.)?/g)) {
        const second = text.slice(match.index!, match.index! + 200);
        expect(second, `${name}: ${match[0]}`).toMatch(/,\s*(\[|[A-Za-z_]+Args|\.\.\.)/);
      }
    }
  });
});
