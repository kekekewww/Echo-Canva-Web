import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// CI sends this script on stdin to Node inside the already-running image.
assert.notEqual(process.getuid(), 0, "Production runtime must be non-root");
for (const entry of [".git", ".env", ".env.local", ".env.example", "tests", "scripts", "pnpm-lock.yaml"]) {
  assert.equal(existsSync(entry), false, `Unexpected runtime file: ${entry}`);
}
for (const entry of ["LICENSE", "THIRD_PARTY_NOTICES.md", "public/audio/LICENSE.md"]) {
  assert.ok(existsSync(entry), `Required distribution notice missing: ${entry}`);
}

const noticeRoot = path.resolve("third-party-licenses");
const inventory = JSON.parse(readFileSync(path.join(noticeRoot, "inventory.json"), "utf8"));
assert.equal(inventory.generatedBy, "scripts/collect-runtime-licenses.mjs");
assert.ok(inventory.packages.length > 0, "Runtime package inventory must not be empty");
assert.equal(inventory.summary.runtimePackages, inventory.packages.length);
for (const key of ["missingLicenseMetadata", "missingInstalledPackages", "ignoredExternalRuntimeLinks"]) {
  assert.equal(inventory.summary[key], 0, `Unreviewed runtime license inventory gap: ${key}`);
}

// Exact upstream artifact lacks an original notice. Preserve the documented
// exception rather than manufacturing attribution or treating it as resolved.
const reviewedExceptions = new Set(["client-only@0.0.1"]);
const exceptions = [];
for (const entry of inventory.packages) {
  const key = `${entry.name}@${entry.version}`;
  if (entry.supplementalNotice?.provenanceException === true) {
    assert.ok(reviewedExceptions.has(key), `Unreviewed upstream provenance exception: ${key}`);
    assert.equal(entry.noticeStatus, "upstream notice unavailable; provenance exception");
    assert.equal(entry.license, "MIT");
    assert.ok(entry.supplementalNotice.sources.includes("https://registry.npmjs.org/client-only/0.0.1"));
    exceptions.push(key);
  } else {
    assert.equal(entry.noticeStatus, "preserved", `Runtime package notice missing: ${key}`);
  }
  assert.ok(entry.notices.length > 0, `No notice/provenance files packaged for ${key}`);
  for (const notice of entry.notices) {
    const target = path.resolve(noticeRoot, entry.directory, notice);
    const relative = path.relative(noticeRoot, target);
    assert.ok(!relative.startsWith("..") && !path.isAbsolute(relative), "Notice path must stay inside inventory");
    assert.ok(existsSync(target), `Listed runtime notice not packaged: ${key}/${notice}`);
  }
}
assert.equal(inventory.summary.provenanceExceptions, exceptions.length);
assert.equal(inventory.summary.missingNoticeFiles, exceptions.length, "Unreviewed missing runtime notice");
console.log(JSON.stringify({ runtimeUser: process.getuid(), summary: inventory.summary, unresolvedProvenance: exceptions }, null, 2));
