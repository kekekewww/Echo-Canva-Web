import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../docs/maintenance/source-baseline-manifest.json", import.meta.url), "utf8"));
const history = JSON.parse(readFileSync(new URL("../docs/maintenance/repository-history.json", import.meta.url), "utf8"));
const git = (...args) => execFileSync("git", args, { encoding: "utf8", cwd: new URL("..", import.meta.url) }).trim();

// This is a reviewed exception for one existing LICENSE-only repository root,
// not a general permission to import additional histories or product code.
const SOURCE = Object.freeze({
  repository: "https://github.com/kekekewww/Echo-Canva",
  tag: "v1.0.0-build-week",
  sourceCommit: "c8fe24700b67861e2f64fbb8950e9281c0e13a3c",
  extractionRoot: "7c03345925369529a998316670e3fcece896b68c",
  sourceTree: "ca4a2543f6f0e8848fe8d8eb57f3ed70faaba294",
});
const INITIALIZER = Object.freeze({
  repository: "https://github.com/kekekewww/Echo-Canva-Web",
  commit: "923b79dd73b572100c6505694a50fa267dd3df72",
  tree: "39c9070bde6562a2239d40592340e39575fe78d4",
});
const INITIALIZER_FILE = Object.freeze({
  path: "LICENSE",
  mode: "100644",
  gitBlob: "c8016f0c6346720d3172abde5f7f834e21c0946e",
});

function requireRecord(actual, expected, label) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual?.[key] !== value) throw new Error(`${label} ${key} mismatch`);
  }
}

if (history.schemaVersion !== 1) throw new Error("Unsupported repository history record");
requireRecord(history.source, SOURCE, "History source");
requireRecord(history.destinationInitializer, INITIALIZER, "History initializer");
if (history.destinationInitializer.files?.length !== 1) throw new Error("Initializer must contain exactly LICENSE");
requireRecord(history.destinationInitializer.files[0], INITIALIZER_FILE, "History initializer file");
requireRecord(manifest, {
  sourceRepository: SOURCE.repository,
  sourceTag: SOURCE.tag,
  sourceCommit: SOURCE.sourceCommit,
  sourceTree: SOURCE.sourceTree,
}, "Baseline manifest");

const roots = git("rev-list", "--max-parents=0", "HEAD").split("\n").sort();
const expectedRoots = [SOURCE.extractionRoot, INITIALIZER.commit].sort();
if (roots.length !== 2 || roots.some((root, index) => root !== expectedRoots[index])) {
  throw new Error(`Expected only the exact extraction and LICENSE initializer roots; found ${roots.join(", ")}`);
}

function readTree(commit, expectedTree, label) {
  const tree = git("rev-parse", `${commit}^{tree}`);
  if (tree !== expectedTree) throw new Error(`${label} tree mismatch: ${tree}`);
  return git("ls-tree", "-r", commit).split("\n").map((line) => {
    const [metadata, path] = line.split("\t");
    const [mode, type, gitBlob] = metadata.split(" ");
    if (type !== "blob") throw new Error(`${label} contains a non-file entry: ${path}`);
    return { path, mode, gitBlob };
  });
}

const initializerEntries = readTree(INITIALIZER.commit, INITIALIZER.tree, "Initializer");
if (initializerEntries.length !== 1) throw new Error("Initializer must contain exactly LICENSE");
requireRecord(initializerEntries[0], INITIALIZER_FILE, "Initializer file");

const entries = readTree(SOURCE.extractionRoot, SOURCE.sourceTree, "Source root");
if (manifest.files?.length !== 291) throw new Error("Expected exactly 291 baseline source records");
if (entries.length !== manifest.files.length) throw new Error("Source file count mismatch");
const expected = new Map(manifest.files.map((file) => [file.path, file]));
if (expected.size !== manifest.files.length) throw new Error("Duplicate baseline source records");
for (const file of entries) {
  const baseline = expected.get(file.path);
  if (!baseline || baseline.gitBlob !== file.gitBlob || baseline.mode !== file.mode) {
    throw new Error(`Source file mismatch: ${file.path}`);
  }
}
console.log(`PASS: ${entries.length} source files; immutable root tree ${SOURCE.sourceTree}; upstream ${SOURCE.sourceCommit}; exact LICENSE initializer ${INITIALIZER.commit}; no additional roots`);
