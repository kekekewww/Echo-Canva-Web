#!/usr/bin/env node
// Turns a summarized evidence directory into what gets committed: plain tables and checksums for
// readers, plain summaries for the runs behind each conclusion, and compressed archives for the rest.
// Everything is sanitised and scanned before packing, because a scan cannot see inside an archive.
//
//   node scripts/perf/pack-evidence.mjs --out <rawRunsDir> --evidence <evidenceDir> [--pilot <rawDir>]
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

import { sanitizeText } from "./lib.mjs";

const REPO = path.resolve(import.meta.dirname, "..", "..");
const SELECTED = [
  "sched-app-w", "r1-traced-app-w-1", "r1-traced-app-w-2", "ct-shell", "ct-vp1080", "ct-full", "ct-fullgpu",
  "attr-app-w", "attr-app-s", "inv-app-w", "r1-traced-w-w01", "r1-traced-w-w02", "r1-traced-w-w03", "r1-traced-w-w04",
  "r1-traced-s-th01", "r1-alloc-app-w",
];
const SUMMARY_FILES = [
  "run-status.json", "environment.json", "summary.json", "clock-alignment.json", "compute-vs-trace.json",
  "job-decomposition-jobs-summary.json", "gc-summary.json", "gc-concurrent.json", "cpu-top.json", "process-cpu.json",
];
const RAW_FILES = /^(gc\.jsonl|job-decomposition-jobs\.jsonl|alloc-.*\.heapprofile\.json|.*\.cpuprofile|.*\.heapprofile)$/;

function argument(name) {
  const at = process.argv.indexOf(`--${name}`);
  return at < 0 ? undefined : process.argv[at + 1];
}

function inside(relative) {
  const absolute = path.resolve(REPO, relative);
  if (absolute !== REPO && !absolute.startsWith(REPO + path.sep)) throw new Error(`${relative} is outside the repository`);
  return absolute;
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { cwd: REPO, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

/** Reproducible archive: sorted names, fixed times, numeric owner 0, no gzip name or time. */
function archive(sourceDir, target) {
  const tarPath = `${target}.tmp`;
  const relativeTar = path.relative(REPO, tarPath).replaceAll("\\", "/");
  const relativeSource = path.relative(REPO, sourceDir).replaceAll("\\", "/");
  run("tar", ["--sort=name", "--mtime=@0", "--owner=0", "--group=0", "--numeric-owner", "-cf", relativeTar, "-C", relativeSource, "."]);
  writeFileSync(target, gzipSync(readFileSync(tarPath), { level: 9 }));
  rmSync(tarPath);
}

function collectSanitised(runDir, targetDir, matches) {
  mkdirSync(targetDir, { recursive: true });
  for (const name of readdirSync(runDir)) {
    if (!matches(name)) continue;
    writeFileSync(path.join(targetDir, name), sanitizeText(readFileSync(path.join(runDir, name), "utf8")));
  }
}

const out = inside(argument("out") ?? ".perf-runs/ec102-win-1");
const evidence = inside(argument("evidence") ?? "benchmarks/perf/results/ec-102-windows-2026-11-06");
const pilot = argument("pilot") ? inside(argument("pilot")) : null;
if (!existsSync(path.join(evidence, "runs"))) throw new Error(`${evidence} has no runs directory; run summarize first`);

const work = inside(".perf-runs/pack-work");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

// Stock gate, one line per run, so the pass and fail record is readable without unpacking anything.
const stock = [];
for (const [label, dir] of [["pilot", pilot], ["measurement", out]]) {
  if (!dir || !existsSync(dir)) continue;
  for (const name of readdirSync(dir).sort()) {
    const metrics = path.join(dir, name, "worker-stress-metrics.json");
    if (!existsSync(metrics)) continue;
    const m = JSON.parse(readFileSync(metrics, "utf8"));
    const status = JSON.parse(readFileSync(path.join(dir, name, "run-status.json"), "utf8"));
    stock.push(JSON.stringify({ batch: label, runId: name, status: status.status, p95Ms: m.p95Ms, timings: m.timings, longTasks: m.longTasks, workers: m.expectedWorkerCount, startedAt: status.start }));
  }
}
writeFileSync(path.join(evidence, "stock-gate.jsonl"), `${stock.join("\n")}\n`);

const selectedDir = path.join(evidence, "selected");
rmSync(selectedDir, { recursive: true, force: true });
const slicesDir = path.join(work, "slices");
const rawDir = path.join(work, "raw");
for (const id of SELECTED) {
  const runDir = path.join(out, id);
  if (!existsSync(runDir)) throw new Error(`selected run ${id} is missing`);
  const reanalysis = path.join(runDir, "reanalysis");
  collectSanitised(runDir, path.join(selectedDir, id), (name) => SUMMARY_FILES.includes(name));
  if (existsSync(reanalysis)) {
    collectSanitised(reanalysis, path.join(selectedDir, id), (name) => name === "job-decomposition-jobs-summary.json");
  }
  const slices = readdirSync(runDir).filter((name) => /^exemplar-.*\.trace\.json$/.test(name)).sort().slice(0, 3);
  collectSanitised(runDir, path.join(slicesDir, id), (name) => slices.includes(name));
  collectSanitised(runDir, path.join(rawDir, id), (name) => RAW_FILES.test(name));
}
// The Node passes keep profiler output under their own run directories.
for (const id of ["r1b-node-traced-th01", "r1b-node-alloc-th01"]) {
  const runDir = path.join(out, id);
  if (existsSync(runDir)) collectSanitised(runDir, path.join(rawDir, id), (name) => RAW_FILES.test(name));
}

// Scan while everything is still plain text.
const runsDir = path.join(evidence, "runs");
const scanTargets = [evidence, slicesDir, rawDir].map((dir) => path.relative(REPO, dir).replaceAll("\\", "/"));
process.stdout.write(run(process.execPath, ["scripts/perf/cli.mjs", "scan", ...scanTargets]));

archive(runsDir, path.join(evidence, "runs.tar.gz"));
archive(slicesDir, path.join(evidence, "exemplar-slices.tar.gz"));
archive(rawDir, path.join(evidence, "raw-cpu-alloc-gc.tar.gz"));
writeFileSync(path.join(evidence, "groups.json.gz"), gzipSync(readFileSync(path.join(evidence, "groups.json")), { level: 9 }));
rmSync(runsDir, { recursive: true, force: true });
rmSync(path.join(evidence, "groups.json"));
rmSync(work, { recursive: true, force: true });

for (const name of readdirSync(evidence).sort()) {
  console.log(name);
}
