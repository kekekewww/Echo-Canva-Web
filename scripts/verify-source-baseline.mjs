import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../docs/maintenance/source-baseline-manifest.json", import.meta.url), "utf8"));
const git = (...args) => execFileSync("git", args, { encoding: "utf8", cwd: new URL("..", import.meta.url) }).trim();
const roots = git("rev-list", "--max-parents=0", "HEAD").split("\n");
if (roots.length !== 1) throw new Error("Expected exactly one independent extraction root");
const tree = git("rev-parse", `${roots[0]}^{tree}`);
if (tree !== manifest.sourceTree) throw new Error(`Source root tree mismatch: ${tree}`);
const entries = git("ls-tree", "-r", roots[0]).split("\n").map((line) => {
  const [metadata, path] = line.split("\t");
  return { path, mode: metadata.split(" ")[0], gitBlob: metadata.split(" ")[2] };
});
if (entries.length !== manifest.files.length) throw new Error("Source file count mismatch");
const expected = new Map(manifest.files.map((file) => [file.path, file]));
for (const file of entries) {
  const baseline = expected.get(file.path);
  if (!baseline || baseline.gitBlob !== file.gitBlob || baseline.mode !== file.mode) {
    throw new Error(`Source file mismatch: ${file.path}`);
  }
}
console.log(`PASS: ${entries.length} source files; immutable root tree ${tree}; upstream ${manifest.sourceCommit}`);
