#!/usr/bin/env node
// One browser-pool measurement in its own Node process and its own browser process.
// Usage: node runner-pool.mjs --config <file>. The parent (cli.mjs) owns the run directory.
import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

import { chromium } from "@playwright/test";

import { deriveSamples } from "./derive-pool.mjs";
import { serialSamples } from "./derive-serial.mjs";
import { NOT_APPLICABLE, UNAVAILABLE, computeStats, makeDenominators, serializeJsonl, sha256File, writeJson } from "./lib.mjs";
import { compareTapeParity } from "./parity.mjs";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".map": "application/json" };
const DEFAULT_STEP_TIMEOUT_MS = 10_000;
const RUN_TIMEOUT_MS = 20 * 60_000;

function readConfig() {
  const index = process.argv.indexOf("--config");
  if (index < 0 || !process.argv[index + 1]) throw new Error("runner-pool needs --config <file>");
  return JSON.parse(readFileSync(resolve(process.argv[index + 1]), "utf8"));
}

/** Plain static files from 127.0.0.1 with no COOP or COEP headers, as production serves the app. */
function serve(root) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const file = normalize(join(root, decodeURIComponent(url.pathname)));
    if (!file.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = readFileSync(file);
      response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolveListening) => {
    server.listen(0, "127.0.0.1", () => resolveListening({ server, port: server.address().port }));
  });
}

function loadInput(config) {
  const { caseSpec } = config;
  const input = JSON.parse(readFileSync(resolve(caseSpec.inputPath), "utf8"));
  if (config.replay === "closed") {
    return {
      scene: caseSpec.mode === "classic" ? input.scene : null,
      document: caseSpec.mode === "hybrid" ? input.document : null,
      events: input.events.map((event) => ({ plannedMs: null, event })),
    };
  }
  const scene = JSON.parse(readFileSync(resolve(caseSpec.scenePath), "utf8"));
  return {
    scene: caseSpec.mode === "classic" ? scene : null,
    document: caseSpec.mode === "hybrid" ? scene : null,
    events: input.events.map(({ plannedMs, event }) => ({ plannedMs, event })),
  };
}

function summarizeCalibration(calibrations) {
  return calibrations.map((entry) => ({
    worker: entry.worker,
    pings: entry.rttMs.length,
    rttMs: computeStats(entry.rttMs),
    halfRttMs: entry.rttMs.length > 0 ? Math.min(...entry.rttMs) / 2 : UNAVAILABLE,
    offsetMs: computeStats(entry.offsetMs),
    clockResolutionMs: entry.clockResolutionMs,
  }));
}

async function processSnapshot(session) {
  try {
    const { processInfo } = await session.send("SystemInfo.getProcessInfo");
    return processInfo.map(({ type, id, cpuTime }) => ({ type, id, cpuTime }));
  } catch (error) {
    return `${UNAVAILABLE}: ${error instanceof Error ? error.message.split("\n")[0] : error}`;
  }
}

async function pageMetrics(session) {
  try {
    const { metrics } = await session.send("Performance.getMetrics");
    return Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
  } catch (error) {
    return `${UNAVAILABLE}: ${error instanceof Error ? error.message.split("\n")[0] : error}`;
  }
}

async function main() {
  const config = readConfig();
  const runDir = resolve(config.runDir);
  const result = { status: "failed", startedAt: new Date().toISOString(), errors: [] };
  const { server, port } = await serve(resolve(config.bundleDir));
  const browser = await chromium.launch();
  let page = null;
  let samples = [];
  try {
    const context = await browser.newContext();
    page = await context.newPage();
    page.on("console", (message) => console.log(`[page] ${message.text()}`));
    page.on("pageerror", (error) => console.error(`[pageerror] ${error.message}`));
    await page.goto(`http://127.0.0.1:${port}/${config.pageFile}`);
    await page.waitForFunction(() => "__perf" in window);
    const info = await page.evaluate(() => window.__perf.info());
    const browserSession = await browser.newBrowserCDPSession();
    const pageSession = await context.newCDPSession(page);
    await pageSession.send("Performance.enable");
    const cpuBefore = await processSnapshot(browserSession);
    const metricsBefore = await pageMetrics(pageSession);

    writeJson(join(runDir, "browser-facts.json"), {
      version: browser.version(),
      executableSha256: sha256File(chromium.executablePath()),
      launchArgs: "playwright default launch options, none added",
      userAgent: info.userAgent,
      hardwareConcurrency: info.hardwareConcurrency,
      crossOriginIsolated: info.crossOriginIsolated,
      mainClockResolutionMs: info.mainClockResolutionMs,
    });

    const input = loadInput(config);
    const workerMode = config.caseSpec.mode;
    const tsW = config.variant === "TS-W";
    const calibration = { start: NOT_APPLICABLE, end: NOT_APPLICABLE };
    let startCalibration = null;
    if (tsW && config.pass !== "bare") {
      const expected = Math.min(
        (input.scene ?? input.document.baseScene).sources.length,
        Math.min(4, Math.max(1, Math.floor(config.hardwareConcurrency ?? info.hardwareConcurrency) - 2)),
      );
      startCalibration = await page.evaluate(([mode, count, pings]) => window.__perf.calibrate(mode, count, pings), [workerMode, expected, 64]);
    }

    const stepTimeoutMs = config.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
    const base = {
      runId: config.runId,
      caseId: config.caseSpec.caseId,
      mode: workerMode,
      boundary: "browser-pool",
      pass: config.pass,
    };
    let parityResult = null;
    let timedOut = false;
    const deadline = new Promise((_, reject) => setTimeout(() => reject(new Error("run exceeded the 20 minute limit")), RUN_TIMEOUT_MS));

    if (config.variant === "TS-S" && config.tsSPath === "decomposed") {
      const serial = await Promise.race([
        page.evaluate((payload) => window.__perf.runSerial(payload), {
          input: workerMode === "classic"
            ? { mode: "classic", tape: { scene: input.scene, events: input.events.map(({ event }) => event) } }
            : { mode: "hybrid", tape: { document: input.document, events: input.events.map(({ event }) => event) } },
          repeat: config.parity ? 1 : config.repeat,
          paced: !config.parity,
          collectFrames: config.parity,
        }),
        deadline,
      ]);
      result.jobs = serial.jobs;
      result.intervalMs = serial.intervalMs;
      result.wallMs = serial.endedAtMs - serial.startedAtMs;
      samples = serialSamples(serial.records, { ...base, variant: "TS-S" }).map((sample) => ({ ...sample, boundary: "browser-pool" }));
      result.denominators = makeDenominators(config.parity ? {} : { submitted: serial.jobs, completed: serial.jobs, accepted: serial.jobs, error: 0 });
      if (config.parity) parityResult = compareTapeParity(config.caseSpec, serial.steps);
    } else {
      const poolConfig = {
        kind: config.pass === "bare" ? "bare" : "probe",
        mode: workerMode,
        variant: config.variant,
        replay: config.replay,
        parity: config.parity,
        repeat: config.parity ? 1 : config.repeat,
        hardwareConcurrency: config.hardwareConcurrency ?? null,
        stepTimeoutMs,
        maxDurationMs: config.maxDurationMs ?? null,
        scene: input.scene,
        document: input.document,
        events: input.events,
      };
      const log = await Promise.race([page.evaluate((payload) => window.__perf.runPool(payload), poolConfig), deadline]);
      writeFileSync(join(runDir, "raw-log.json"), JSON.stringify(log), "utf8");
      const workers = log.workersCreated > 0 ? log.workersCreated : (log.expectedWorkers > 0 ? log.expectedWorkers : NOT_APPLICABLE);
      const derived = deriveSamples(log, { ...base, variant: config.variant, workers: tsW ? workers : NOT_APPLICABLE });
      samples = derived.samples;
      result.denominators = makeDenominators(derived.denominators);
      result.workers = { expected: log.expectedWorkers, created: log.workersCreated, reportedByPool: derived.workerCounts };
      result.integrity = derived.integrity;
      result.shardCompute = derived.shardCompute;
      result.jobs = derived.jobs;
      result.phaseResidualCount = derived.phaseResidualCount;
      result.poolErrors = log.errors;
      timedOut = log.steps.some((step) => step.outcome === "timeout");
      calibration.end = summarizeCalibration(log.endCalibration);
      calibration.endRaw = log.endCalibration;
      if (log.errors.length > 0) result.errors.push(...log.errors);
      if (timedOut) result.errors.push("a step timed out; the run stopped and kept what it had collected");
      if (tsW) {
        if (log.results.some((entry) => entry.source === "fallback")) result.errors.push("the production pool fell back to the serial path during a TS-W run");
        if (config.pass !== "bare" && (derived.workerCounts.length !== 1 || derived.workerCounts[0] !== log.expectedWorkers || log.workersCreated !== log.expectedWorkers)) {
          result.errors.push(`worker count mismatch: expected ${log.expectedWorkers}, created ${log.workersCreated}, pool reported ${JSON.stringify(derived.workerCounts)}`);
        }
        if (config.pass === "bare" && (derived.workerCounts.length !== 1 || derived.workerCounts[0] !== log.expectedWorkers)) {
          result.errors.push(`worker count mismatch: expected ${log.expectedWorkers}, pool reported ${JSON.stringify(derived.workerCounts)}`);
        }
        if (derived.integrity !== NOT_APPLICABLE && !derived.integrity.ok) result.errors.push(`message integrity: ${derived.integrity.anomalies.slice(0, 5).join("; ")}`);
        if (config.pass !== "bare" && derived.shardCompute.count > 0 && derived.shardCompute.nonInteger === 0) {
          result.errors.push("every shard.compute value is an integer: the preamble clock is not in effect");
        }
      } else {
        const fallback = log.results.filter((entry) => entry.source === "fallback").length;
        if (fallback === 0 || fallback !== log.results.length) result.errors.push(`production fallback did not activate cleanly (${fallback} of ${log.results.length} results were fallback)`);
      }
      if (config.parity) {
        if (log.parity.length === 0) result.errors.push("parity run collected no frames");
        else parityResult = compareTapeParity(config.caseSpec, log.parity);
      }
    }

    if (startCalibration) {
      calibration.start = {
        note: "short-lived probe workers from the same entry, pinged before the measured window",
        mainClockResolutionMs: startCalibration.mainClockResolutionMs,
        workers: summarizeCalibration(startCalibration.calibrations),
      };
      writeJson(join(runDir, "clock-calibration.json"), {
        start: calibration.start,
        end: { note: "the pool's own workers, pinged after the measured window", workers: calibration.end },
        raw: { start: startCalibration.calibrations, end: calibration.endRaw },
      });
    } else {
      writeJson(join(runDir, "clock-calibration.json"), { start: NOT_APPLICABLE, end: calibration.end });
    }
    if (parityResult) {
      writeFileSync(join(runDir, "parity-diffs.jsonl"), serializeJsonl(parityResult.lines), "utf8");
      result.parity = parityResult.verdict;
      if (!parityResult.verdict.rulesOk || parityResult.verdict.stepCount !== parityResult.verdict.expectedStepCount) {
        result.errors.push(`parity: ${parityResult.verdict.violationCount} rule violation(s), ${parityResult.verdict.stepCount} of ${parityResult.verdict.expectedStepCount} steps`);
      }
    } else {
      writeFileSync(join(runDir, "parity-diffs.jsonl"), "not-applicable", "utf8");
    }

    const cpuAfter = await processSnapshot(browserSession);
    const metricsAfter = await pageMetrics(pageSession);
    writeJson(join(runDir, "process-cpu.json"), {
      unit: "core-seconds",
      note: "cpuTime per browser process from CDP SystemInfo.getProcessInfo, read before and after the replay, outside the measured window.",
      before: cpuBefore,
      after: cpuAfter,
    });
    writeJson(join(runDir, "page-metrics.json"), { before: metricsBefore, after: metricsAfter });
    result.status = result.errors.length === 0 ? "passed" : "failed";
    if (result.errors.length > 0) result.error = result.errors.join(" | ");
  } catch (error) {
    result.error = error instanceof Error ? (error.stack ?? error.message) : String(error);
    result.errors.push(result.error);
    if (!existsSync(join(runDir, "parity-diffs.jsonl"))) writeFileSync(join(runDir, "parity-diffs.jsonl"), "not-applicable", "utf8");
  } finally {
    await browser.close().catch(() => undefined);
    server.closeAllConnections();
    server.close();
  }

  // A parity run records no timing.
  if (config.parity) samples = [];
  writeFileSync(join(runDir, "samples.jsonl"), serializeJsonl(samples), "utf8");
  result.sampleCount = samples.length;
  result.endedAt = new Date().toISOString();
  writeJson(join(runDir, "runner-result.json"), result);
  process.exitCode = result.status === "passed" ? 0 : 2;
  process.exit(process.exitCode);
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});
