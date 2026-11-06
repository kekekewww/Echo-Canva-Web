#!/usr/bin/env node
// The existing Playwright specs, unmodified, run exactly as the design names them. Their stdout,
// stderr and exit status are kept; a failing gate is data and stays a failed run.
// Usage: node runner-stock.mjs --config <file>.
import { spawn } from "node:child_process";
import { closeSync, existsSync, openSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";

import { NOT_APPLICABLE, UNAVAILABLE, createSample, tempEnvironment, makeDenominators, serializeJsonl, sha256File, sha256Text, writeJson } from "./lib.mjs";

const SPECS = {
  APP_H100_SWITCH: {
    args: ["tests/e2e/workspace.spec.ts", "--grep", "survives the full entity-limit"],
    env: {},
    metricsName: "worker-stress-metrics.json",
  },
  APP_C_DRAG: {
    args: ["tests/e2e/audio-render-capacity.spec.ts"],
    env: { ECHO_AUDIO_BENCHMARK: "1" },
    metricsName: "audio-render-capacity.json",
  },
};

function readConfig() {
  const index = process.argv.indexOf("--config");
  if (index < 0 || !process.argv[index + 1]) throw new Error("runner-stock needs --config <file>");
  return JSON.parse(readFileSync(resolve(process.argv[index + 1]), "utf8"));
}

function findFile(dir, name) {
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(path, name);
      if (found) return found;
    } else if (entry.name === name) return path;
  }
  return null;
}

function staticHash(dir) {
  const lines = [];
  const walk = (current, prefix) => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(join(current, entry.name), relative);
      else lines.push(`${relative}\u0000${sha256File(join(current, entry.name))}`);
    }
  };
  walk(dir, "");
  return sha256Text(lines.join("\n"));
}

async function main() {
  const config = readConfig();
  tempEnvironment(process.cwd());
  const runDir = resolve(config.runDir);
  const spec = SPECS[config.caseSpec.caseId];
  const result = { status: "failed", startedAt: new Date().toISOString(), errors: [] };
  if (!spec) throw new Error(`no stock spec for ${config.caseSpec.caseId}`);
  const buildIdFile = join(process.cwd(), ".next", "BUILD_ID");
  if (!existsSync(buildIdFile)) throw new Error(".next/BUILD_ID is missing; run corepack pnpm build first");
  result.build = { buildId: readFileSync(buildIdFile, "utf8").trim(), staticSha256: staticHash(join(process.cwd(), ".next", "static")) };

  // A repository-relative path: an absolute one contains spaces and would be split by the shell.
  const outputRelative = `${config.runDir.replaceAll("\\", "/")}/pw-output`;
  if (/\s/.test(outputRelative)) throw new Error(`the run directory path contains whitespace: ${outputRelative}`);
  const outputDir = resolve(outputRelative);
  // No shell and no string-built command line: corepack's own script is run by node with an argument list.
  const corepackScript = join(dirname(process.execPath), "node_modules", "corepack", "dist", "corepack.js");
  if (!existsSync(corepackScript)) throw new Error("corepack.js was not found next to the node executable");
  const playwrightArgs = ["pnpm", "exec", "playwright", "test", ...spec.args, "--workers=1", "--retries=0", "--trace=off", `--output=${outputRelative}`];
  result.command = `corepack ${playwrightArgs.join(" ").replace(outputRelative, "<run>/pw-output")}`;
  const out = openSync(join(runDir, "stdout.log"), "w");
  const err = openSync(join(runDir, "stderr.log"), "w");
  const shimDir = resolve(".claude/ec102-bin");
  const exit = await new Promise((resolveExit, reject) => {
    const child = spawn(process.execPath, [corepackScript, ...playwrightArgs], {
      cwd: process.cwd(),
      shell: false,
      stdio: ["ignore", out, err],
      env: { ...process.env, ...tempEnvironment(process.cwd()), ...spec.env, NEXT_TELEMETRY_DISABLED: "1", PATH: `${shimDir}${delimiter}${process.env.PATH}` },
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("close", (code, signal) => resolveExit({ code, signal }));
  }).finally(() => {
    closeSync(out);
    closeSync(err);
  });
  result.exit = exit;

  const metricsFile = findFile(outputDir, spec.metricsName);
  let samples = [];
  if (metricsFile) {
    const metrics = JSON.parse(readFileSync(metricsFile, "utf8"));
    writeJson(join(runDir, spec.metricsName), metrics);
    result.metricsFile = spec.metricsName;
    if (config.caseSpec.caseId === "APP_H100_SWITCH") {
      const base = {
        runId: config.runId,
        variant: "TS-W",
        caseId: "APP_H100_SWITCH",
        mode: "hybrid",
        boundary: "browser-app",
        pass: "stock",
        workers: metrics.expectedWorkerCount,
        audio: "on",
        clock: "main-date-now",
      };
      metrics.timings.forEach((value, index) => {
        samples.push(createSample({ ...base, phase: "app.worker-compute-metric", duration: value, units: "ms", warm: false, requestSeq: metrics.completedSequences?.[index] }));
      });
      metrics.longTasks.forEach((value) => {
        samples.push(createSample({ ...base, phase: "app.long-task", duration: value, units: "ms", warm: false, clock: "main-perf-now" }));
      });
      result.metrics = { p95Ms: metrics.p95Ms, expectedWorkerCount: metrics.expectedWorkerCount, workerStatuses: metrics.workerStatuses?.length ?? UNAVAILABLE, timings: metrics.timings.length, longTasks: metrics.longTasks.length };
    } else {
      result.metrics = { pointerMoves: metrics.pointerMoves, distinctAcceptedRevisionsSampledDuringDrag: metrics.distinctAcceptedRevisionsSampledDuringDrag, samplesDuringDrag: metrics.samplesDuringDrag };
    }
  } else {
    result.errors.push(`${spec.metricsName} was not produced (the spec may have failed before writing it)`);
  }
  if (exit.code !== 0) result.errors.unshift(`playwright exited with code ${exit.code}${exit.signal ? ` (signal ${exit.signal})` : ""}; the gate result is kept as data`);

  writeFileSync(join(runDir, "samples.jsonl"), serializeJsonl(samples), "utf8");
  writeFileSync(join(runDir, "parity-diffs.jsonl"), NOT_APPLICABLE, "utf8");
  result.sampleCount = samples.length;
  result.denominators = makeDenominators(samples.length > 0 ? { submitted: result.metrics.timings, completed: result.metrics.timings, accepted: result.metrics.timings, timeout: 0 } : {});
  result.status = exit.code === 0 && result.errors.length === 0 ? "passed" : "failed";
  if (result.errors.length > 0) result.error = result.errors.join(" | ");
  result.endedAt = new Date().toISOString();
  writeJson(join(runDir, "runner-result.json"), result);
  process.exit(result.status === "passed" ? 0 : 2);
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
