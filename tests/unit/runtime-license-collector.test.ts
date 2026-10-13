import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const collector = fileURLToPath(new URL("../../scripts/collect-runtime-licenses.mjs", import.meta.url));
const runtimeGuard = fileURLToPath(new URL("../../scripts/docker-runtime-check.mjs", import.meta.url));
const ownLicense = readFileSync(new URL("../../LICENSE", import.meta.url));
const tempBoundary = realpathSync(tmpdir());
const fixturePrefix = "echo-runtime-notices-test-";
const packageName = "@echo-canvas/test-runtime";
const packageVersion = "1.0.0";
const packageKey = `${packageName}@${packageVersion}`;

interface Inventory {
  generatedBy: string;
  summary: Record<string, number>;
  packages: {
    name: string;
    version: string;
    license: string;
    directory: string;
    notices: string[];
    noticeStatus: string;
    supplementalNotice?: { provenanceException: boolean };
  }[];
}

let fixtureRoot: string;

function write(relative: string, contents: string | Buffer) {
  const target = path.join(fixtureRoot, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function prepareCollectorFixture(options: { notice?: boolean; installed?: boolean } = {}) {
  const metadata = JSON.stringify({ name: packageName, version: packageVersion, license: "MIT" });
  const installed = "node_modules/.pnpm/test-runtime@1.0.0/node_modules/@echo-canvas/test-runtime";
  const runtime = ".next/standalone/node_modules/@echo-canvas/test-runtime";
  mkdirSync(path.join(fixtureRoot, "node_modules"), { recursive: true });
  write("package.json", JSON.stringify({ name: "notice-test-project", dependencies: {} }));
  write(`${runtime}/package.json`, metadata);
  if (options.installed !== false) {
    write(`${installed}/package.json`, metadata);
    if (options.notice !== false) write(`${installed}/LICENSE`, ownLicense);
  } else {
    // A complete traced notice does not compensate for an unknown original package.
    write(`${runtime}/LICENSE`, ownLicense);
  }
}

function runCollector() {
  return spawnSync(process.execPath, [collector, fixtureRoot], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 10_000,
  });
}

function readInventory(): Inventory {
  return JSON.parse(readFileSync(path.join(fixtureRoot, "third-party-licenses/inventory.json"), "utf8"));
}

function prepareRuntimeFixture(exception = false, maskSummary = false, originalIdentity = false) {
  const name = exception || originalIdentity ? "client-only" : packageName;
  const version = exception || originalIdentity ? "0.0.1" : packageVersion;
  const directory = encodeURIComponent(`${name}@${version}`);
  const inventory: Inventory = {
    generatedBy: "scripts/collect-runtime-licenses.mjs",
    summary: {
      runtimePackages: 1,
      missingLicenseMetadata: 0,
      missingNoticeFiles: exception && !maskSummary ? 1 : 0,
      missingInstalledPackages: 0,
      ignoredExternalRuntimeLinks: 0,
      provenanceExceptions: exception && !maskSummary ? 1 : 0,
    },
    packages: [{
      name,
      version,
      license: "MIT",
      directory,
      notices: ["LICENSE"],
      noticeStatus: exception && !maskSummary ? "upstream notice unavailable; provenance exception" : "preserved",
      ...(exception ? { supplementalNotice: { provenanceException: true } } : {}),
    }],
  };
  write("LICENSE", ownLicense);
  write("THIRD_PARTY_NOTICES.md", "Distribution notices are retained in third-party-licenses.\n");
  write("public/audio/LICENSE.md", "Test fixture audio notice.\n");
  write(`third-party-licenses/${directory}/LICENSE`, ownLicense);
  write("third-party-licenses/inventory.json", JSON.stringify(inventory));
}

function runRuntimeGuard() {
  // Execute the actual ESM guard with only the container UID simulated. It still
  // reads the isolated distribution files and applies its own inventory checks.
  const source = `Object.defineProperty(process, "getuid", { value: () => 1000 }); await import(${JSON.stringify(pathToFileURL(runtimeGuard).href)});`;
  return spawnSync(process.execPath, ["--input-type=module", "--eval", source], {
    cwd: fixtureRoot,
    encoding: "utf8",
    timeout: 10_000,
  });
}

beforeEach(() => {
  fixtureRoot = mkdtempSync(path.join(tempBoundary, fixturePrefix));
});

afterEach(() => {
  const resolved = realpathSync(fixtureRoot);
  // Recursive cleanup is limited to the mkdtemp directory created by this test.
  expect(path.dirname(resolved)).toBe(tempBoundary);
  expect(path.basename(resolved).startsWith(fixturePrefix)).toBe(true);
  rmSync(resolved, { recursive: true, force: true });
});

describe("runtime license collector release gate", () => {
  it("preserves the complete own-license bytes and succeeds with no gaps", () => {
    prepareCollectorFixture();
    const result = runCollector();
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    const inventory = readInventory();
    expect(inventory.summary).toMatchObject({
      runtimePackages: 1,
      missingLicenseMetadata: 0,
      missingNoticeFiles: 0,
      missingInstalledPackages: 0,
      provenanceExceptions: 0,
    });
    const record = inventory.packages[0];
    expect(record.noticeStatus).toBe("preserved");
    expect(record.notices).toContain("LICENSE");
    expect(readFileSync(path.join(fixtureRoot, "third-party-licenses", record.directory, "LICENSE"))).toEqual(ownLicense);
  });

  it("fails on a missing notice while retaining a diagnostic inventory", () => {
    prepareCollectorFixture({ notice: false });
    const result = runCollector();
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/unresolved gaps:.*missingNoticeFiles=1/);
    const inventory = readInventory();
    expect(inventory.summary.missingNoticeFiles).toBe(1);
    expect(inventory.packages[0]).toMatchObject({ noticeStatus: "missing", notices: [] });
  });

  it("rejects a provenance exception even when supplemental LICENSE bytes exist", () => {
    prepareCollectorFixture();
    write("docs/licenses/supplemental/LICENSE", ownLicense);
    write("docs/licenses/runtime-notice-fallbacks.json", JSON.stringify({
      [packageKey]: {
        provenanceException: true,
        files: ["docs/licenses/supplemental/LICENSE"],
        sources: [],
        note: "A file count cannot resolve this declared provenance exception.",
      },
    }));
    const result = runCollector();
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/provenanceExceptions=1/);
    const inventory = readInventory();
    expect(inventory.summary.provenanceExceptions).toBe(1);
    expect(inventory.packages[0].noticeStatus).toMatch(/provenance exception/);
    expect(inventory.packages[0].notices).toContain("supplemental/docs/licenses/supplemental/LICENSE");
  });

  it("fails when the installed original is absent despite a traced license", () => {
    prepareCollectorFixture({ installed: false });
    const result = runCollector();
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/missingInstalledPackages=1/);
    const inventory = readInventory();
    expect(inventory.summary.missingInstalledPackages).toBe(1);
    expect(inventory.summary.missingNoticeFiles).toBe(0);
    expect(inventory.packages[0].noticeStatus).toBe("preserved");
  });

  it("rejects the original client-only identity despite borrowed notice bytes and zero gaps", () => {
    const metadata = JSON.stringify({ name: "client-only", version: "0.0.1", license: "MIT" });
    write("package.json", JSON.stringify({ name: "notice-test-project", dependencies: {} }));
    write(".next/standalone/node_modules/client-only/package.json", metadata);
    write("node_modules/.pnpm/client-only@0.0.1/node_modules/client-only/package.json", metadata);
    write("node_modules/.pnpm/client-only@0.0.1/node_modules/client-only/LICENSE", ownLicense);
    const result = runCollector();
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Original client-only artifact remains/);
    const inventory = readInventory();
    expect(inventory.summary).toMatchObject({
      missingLicenseMetadata: 0,
      missingNoticeFiles: 0,
      missingInstalledPackages: 0,
      provenanceExceptions: 0,
    });
    expect(inventory.packages[0]).toMatchObject({ name: "client-only", version: "0.0.1", noticeStatus: "preserved" });
  });
});

describe("production runtime notice guard", () => {
  it("accepts a non-root distribution with complete preserved notices", () => {
    prepareRuntimeFixture();
    const result = runRuntimeGuard();
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ runtimeUser: 1000, unresolvedProvenance: [] });
  });

  it("rejects the previous client-only provenance exception", () => {
    prepareRuntimeFixture(true);
    const result = runRuntimeGuard();
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Unreviewed runtime license inventory gap/);
  });

  it("rejects an exception record even if its summary falsely reports no gaps", () => {
    prepareRuntimeFixture(true, true);
    const result = runRuntimeGuard();
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Upstream provenance exception remains: client-only@0\.0\.1/);
  });

  it("rejects the original client-only identity despite borrowed notices and zero gap counts", () => {
    prepareRuntimeFixture(false, false, true);
    const inventory = readInventory();
    expect(inventory.summary.provenanceExceptions).toBe(0);
    expect(inventory.packages[0].noticeStatus).toBe("preserved");
    expect(inventory.packages[0].supplementalNotice).toBeUndefined();
    const result = runRuntimeGuard();
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Original client-only artifact remains/);
  });
});
