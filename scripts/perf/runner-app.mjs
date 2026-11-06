#!/usr/bin/env node
// One in-app measurement: the production build behind `next start`, a fresh browser, the real UI.
// Usage: node runner-app.mjs --config <file>. The parent (cli.mjs) owns the run directory.
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

import { startAllocation, startTracing } from "./cdp-tools.mjs";
import { computeCheckFromDump, deriveAppSamples } from "./derive-app.mjs";
import { UNAVAILABLE, NOT_APPLICABLE, serializeJsonl, sha256File, tempEnvironment, writeJson } from "./lib.mjs";
import { analyzeTrace, rankJobs } from "./trace-analyze.mjs";

const require = createRequire(import.meta.url);
const SWITCH_TIMEOUT_MS = 10_000;
const SETTLE_MS = 120;

function readConfig() {
  const index = process.argv.indexOf("--config");
  if (index < 0 || !process.argv[index + 1]) throw new Error("runner-app needs --config <file>");
  return JSON.parse(readFileSync(resolve(process.argv[index + 1]), "utf8"));
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
    server.on("error", reject);
  });
}

async function startServer(port) {
  const bin = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [bin, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, ...tempEnvironment(process.cwd()), NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  child.stdout.on("data", (data) => console.log(`[next] ${String(data).trimEnd()}`));
  child.stderr.on("data", (data) => console.error(`[next] ${String(data).trimEnd()}`));
  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(base);
      if (response.ok) return { child, base };
    } catch {
      // Not listening yet.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  child.kill();
  throw new Error("next start did not answer within 90 s");
}

function stopServer(child) {
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill("SIGTERM");
}

/** Chromium's Web Audio render load, sampled from Node. These are browser load indicators, not hardware output evidence. */
function startAudioSampler(cdp, getContextId) {
  const samples = [];
  let stopped = false;
  const loop = (async () => {
    while (!stopped) {
      const contextId = getContextId();
      if (contextId) {
        try {
          const { realtimeData } = await cdp.send("WebAudio.getRealtimeData", { contextId });
          samples.push(realtimeData);
        } catch {
          // The context may be gone; the next tick tries again.
        }
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    }
  })();
  return {
    samples,
    async stop() {
      stopped = true;
      await loop;
    },
  };
}

// Setup of tests/e2e/workspace.spec.ts lines 288-395 ("survives the full entity-limit project"),
// copied so the in-app fixture is the same as the gate's. selectPreset is tests/e2e/workspace-helpers.ts.
async function selectPreset(page, presetId) {
  const menu = page.getByRole("dialog", { name: "Project" });
  if (!(await menu.isVisible())) {
    await page.getByRole("button", { name: /^Project:/ }).click();
    await menu.waitFor({ state: "visible" });
  }
  await page.getByLabel("Scene preset").selectOption(presetId);
}

async function buildHundredWallFixture(page, base) {
  await page.goto(`${base}/lab`);
  await selectPreset(page, "stress-100-walls");
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("echo-canvas:project:hybrid:v1");
    if (!raw) return false;
    const cache = JSON.parse(raw);
    return cache.present?.scene?.walls?.length === 100;
  });
  const stressCache = await page.evaluate(() => {
    const key = "echo-canvas:project:hybrid:v1";
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error("Hybrid cache was not created.");
    const cache = JSON.parse(raw);
    const project = cache.present;
    const host = project.scene.walls.find(({ id }) => id === "stress_boundary_north");
    const baseSource = project.scene.sources[0];
    if (!host || !baseSource) throw new Error("Stress fixture is incomplete.");
    project.listeners = Array.from({ length: 8 }, (_, index) => ({
      id: `stress_listener_${index}`,
      name: `Stress Listener ${index + 1}`,
      position: { x: 1 + index, y: 1.5, z: 1 + (index % 4) },
      headingDeg: index * 15,
      enabled: true,
    }));
    project.activeListenerId = project.listeners[0].id;
    project.selection = { type: "listener", id: project.activeListenerId };
    project.scene.sources = Array.from({ length: 4 }, (_, index) => ({
      ...baseSource,
      id: `stress_source_${index}`,
      name: `Stress Source ${index + 1}`,
      position: { x: 8 + index * 0.7, y: 6 + index * 0.35 },
    }));
    project.sourceHeightsM = Object.fromEntries(project.scene.sources.map(({ id }, index) => [id, 1 + index * 0.4]));
    project.scene.portals = Array.from({ length: 8 }, (_, index) => ({
      id: `stress_portal_${index}`,
      wallId: host.id,
      center: { x: 0.8 + index * 1.45, y: 0 },
      widthM: 0.6,
      heightM: 2,
      open: index % 2 === 0,
      lossDb: 3,
    }));
    project.portal3dById = Object.fromEntries(project.scene.portals.map((portal) => [portal.id, { bottomM: 0, topM: 2, thicknessM: 0.12 }]));
    project.revision += 1;
    project.scene.revision = project.revision;
    cache.past = [];
    cache.future = [];
    return JSON.stringify(cache);
  });
  await page.addInitScript(({ cache }) => {
    const marker = "echo-canvas:stress-cache-installed";
    if (sessionStorage.getItem(marker)) return;
    localStorage.setItem("echo-canvas:project:hybrid:v1", cache);
    sessionStorage.setItem(marker, "1");
  }, { cache: stressCache });
  await page.reload();
}

/** In-page promise on the status attributes: resolves on the next accepted frame, with no polling sleeps. */
function waitForCommit(statusbar, previousSequence, timeoutMs) {
  return statusbar.evaluate(
    (element, args) =>
      new Promise((resolveCommit) => {
        const read = () => ({
          sequence: Number(element.getAttribute("data-acoustic-sequence")),
          source: element.getAttribute("data-worker-source"),
          count: element.getAttribute("data-worker-count"),
        });
        const finish = (value) => {
          clearTimeout(timer);
          observer.disconnect();
          resolveCommit(value);
        };
        const check = () => {
          const state = read();
          if (Number.isFinite(state.sequence) && state.sequence > args.previous) finish({ ok: true, ...state });
        };
        const observer = new MutationObserver(check);
        observer.observe(element, { attributes: true });
        const timer = setTimeout(() => finish({ ok: false, ...read() }), args.timeoutMs);
        check();
      }),
    { previous: previousSequence, timeoutMs },
  );
}

async function readStatus(statusbar) {
  return statusbar.evaluate((element) => ({
    sequence: Number(element.getAttribute("data-acoustic-sequence")),
    source: element.getAttribute("data-worker-source"),
    count: element.getAttribute("data-worker-count"),
    computeMs: element.getAttribute("data-worker-compute-ms"),
    revision: element.getAttribute("data-acoustic-revision"),
  }));
}

function expectedWorkers(hardwareConcurrency, sources) {
  const capacity = !Number.isFinite(hardwareConcurrency) || hardwareConcurrency <= 0 ? 1 : Math.min(4, Math.max(1, Math.floor(hardwareConcurrency) - 2));
  return Math.min(sources, capacity);
}

async function main() {
  const config = readConfig();
  tempEnvironment(process.cwd());
  const runDir = resolve(config.runDir);
  const result = { status: "failed", startedAt: new Date().toISOString(), errors: [] };
  const buildIdFile = join(process.cwd(), ".next", "BUILD_ID");
  if (!existsSync(buildIdFile)) throw new Error(".next/BUILD_ID is missing; run corepack pnpm build first");
  result.buildId = readFileSync(buildIdFile, "utf8").trim();

  const port = await freePort();
  const { child: server, base } = await startServer(port);
  const browser = await chromium.launch();
  let samples = [];
  let traceInfo = null;
  let computeCheck = null;
  let tracing = null;
  let allocation = null;
  const forceSerial = config.variant === "TS-S";
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("console", (message) => console.log(`[page] ${message.text()}`));
    page.on("pageerror", (error) => console.error(`[pageerror] ${error.message}`));
    const probeConfig = { forceSerial, traced: config.pass === "traced" };
    await page.addInitScript((value) => {
      window.__EC102_CONFIG = value;
    }, probeConfig);
    if (config.hardwareConcurrency) {
      await page.addInitScript((value) => Object.defineProperty(navigator, "hardwareConcurrency", { get: () => value }), config.hardwareConcurrency);
    }
    await page.addInitScript({ path: resolve("scripts/perf/app-probes.js") });

    const browserSession = await browser.newBrowserCDPSession();
    const pageSession = await context.newCDPSession(page);
    const audioSession = await context.newCDPSession(page);
    const contextIds = [];
    audioSession.on("WebAudio.contextCreated", (event) => contextIds.push(event.context.contextId));
    await audioSession.send("WebAudio.enable");
    const cpuBefore = await processSnapshot(browserSession);

    const caseId = config.caseSpec.caseId;
    const statusbar = page.locator(".workspace-statusbar");
    const audioOn = config.audio === "on";
    let hardwareConcurrency = null;
    let sourceCount = 4;
    let outliner = null;
    if (caseId === "APP_H100_SWITCH") {
      await buildHundredWallFixture(page, base);
      outliner = page.getByRole("complementary", { name: "Scene Outliner" });
      await outliner.locator(".kind-wall").first().waitFor();
      const counts = {
        walls: await outliner.locator(".kind-wall").count(),
        portals: await outliner.locator(".kind-portal").count(),
        sources: await outliner.locator(".kind-source").count(),
        listeners: await outliner.locator(".kind-listener").count(),
      };
      result.fixtureCounts = counts;
      if (counts.walls !== 100 || counts.portals !== 8 || counts.sources !== 4 || counts.listeners !== 8) {
        result.errors.push(`fixture counts differ: ${JSON.stringify(counts)}`);
      }
      sourceCount = counts.sources;
    } else if (caseId === "APP_C_DRAG" || caseId === "CONTROLS") {
      await page.goto(`${base}/classic`);
      sourceCount = 2;
    } else {
      throw new Error(`unknown in-app case ${caseId}`);
    }
    hardwareConcurrency = await page.evaluate(() => navigator.hardwareConcurrency);
    const workspace = page.getByTestId("unified-workspace");
    if (audioOn) {
      await page.getByRole("button", { name: "Play", exact: true }).click();
      await workspace.waitFor();
      await page.waitForFunction(() => document.querySelector('[data-testid="unified-workspace"]')?.getAttribute("data-audio-contexts") === "1");
    } else {
      const graphs = await workspace.getAttribute("data-audio-graphs");
      result.audioOffGraphs = graphs;
      if (graphs !== "0") result.errors.push(`audio off but data-audio-graphs is ${graphs}`);
    }
    await page.waitForFunction(() => {
      const raw = document.querySelector(".workspace-statusbar")?.getAttribute("data-worker-compute-ms");
      return raw !== null && raw !== undefined && raw !== "" && Number.isFinite(Number(raw));
    }, undefined, { timeout: 30_000 });
    const expectedCount = forceSerial ? 0 : expectedWorkers(hardwareConcurrency, sourceCount);
    const settled = await readStatus(statusbar);
    result.statusBeforeWindow = { ...settled, expectedWorkerCount: expectedCount, hardwareConcurrency };

    if (caseId === "APP_H100_SWITCH") await crossCheckFixture(page, config, runDir, result);
    const sampler = audioOn ? startAudioSampler(audioSession, () => contextIds.at(-1)) : null;
    if (config.pass === "traced") tracing = await startTracing(browserSession);
    if (config.pass === "alloc") allocation = await startAllocation(browserSession, pageSession);
    const timeouts = [];
    let submitted = 0;

    if (caseId === "APP_H100_SWITCH") {
      for (let index = 0; index < 3; index += 1) {
        await outliner.locator(".kind-listener").nth(index).click();
        await page.waitForTimeout(SETTLE_MS);
      }
      await page.evaluate(() => {
        window.__ec102.reset();
        window.__ec102.mark("ec102:window:start");
      });
      let previous = (await readStatus(statusbar)).sequence;
      for (let index = 0; index < config.samples; index += 1) {
        await outliner.locator(".kind-listener").nth(index % 8).click();
        submitted += 1;
        const committed = await waitForCommit(statusbar, previous, SWITCH_TIMEOUT_MS);
        if (!committed.ok) {
          timeouts.push(index);
          result.errors.push(`switch ${index} timed out after ${SWITCH_TIMEOUT_MS} ms`);
          continue;
        }
        previous = committed.sequence;
      }
    } else if (caseId === "APP_C_DRAG") {
      const dragMs = config.maxDurationMs ?? 10_000;
      if (audioOn) await page.waitForTimeout(2000);
      const handle = page.getByTestId("source-rain");
      const box = await handle.boundingBox();
      if (!box) throw new Error("Rain source handle is not visible.");
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.evaluate(() => {
        window.__ec102.reset();
        window.__ec102.mark("ec102:window:start");
      });
      const startedAt = Date.now();
      while (Date.now() - startedAt < dragMs) {
        const phase = ((Date.now() - startedAt) / 2000) * Math.PI * 2;
        await page.mouse.move(centerX + Math.sin(phase) * 36, centerY + Math.sin(phase * 2) * 18);
        submitted += 1;
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
      await page.waitForTimeout(300);
    } else {
      await runInAppControls(page, result, audioOn);
    }
    await page.evaluate(() => window.__ec102.mark("ec102:window:end"));
    const audioSamples = sampler ? (await sampler.stop(), sampler.samples) : [];
    if (result.controls?.audio) {
      const capacities = audioSamples.map((sample) => sample.renderCapacity);
      result.controls.audio.realtime = {
        samples: audioSamples.length,
        allRenderCapacityFinite: capacities.every((value) => Number.isFinite(value)),
        renderCapacity: capacities.length === 0 ? "unavailable" : { min: Math.min(...capacities), max: Math.max(...capacities), mean: capacities.reduce((s, v) => s + v, 0) / capacities.length },
        callbackIntervalMeanS: audioSamples.map((sample) => sample.callbackIntervalMean).slice(0, 5),
      };
    }
    const dump = await page.evaluate(() => window.__ec102.dump());
    if (config.pass === "traced") {
      // Spaced marks give the clock fit a time span; a burst would not.
      await page.evaluate(async () => {
        for (let index = 0; index < 30; index += 1) {
          const now = performance.now();
          performance.mark(`ec102:clk:main:${index}:${now}:${performance.timeOrigin + now}`);
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      });
    }
    if (tracing) traceInfo = await tracing.stop(join(runDir, "chromium-trace.json"));
    if (allocation) result.alloc = await allocation.stop(runDir);
    writeFileSync(join(runDir, "probe-dump.json"), JSON.stringify(dump), "utf8");
    computeCheck = computeCheckFromDump(dump);

    const derived = deriveAppSamples(dump, {
      runId: config.runId,
      variant: config.variant,
      caseId,
      mode: caseId === "APP_H100_SWITCH" ? "hybrid" : "classic",
      pass: config.pass,
      workers: forceSerial ? NOT_APPLICABLE : (Number(dump.commits.at(-1)?.workerCount) || expectedCount),
      audio: audioOn ? "on" : "off",
      audioSamples,
      submitted,
      timeouts: timeouts.length,
    });
    samples = caseId === "CONTROLS" ? [] : derived.samples;
    result.denominators = derived.denominators;
    result.observed = {
      ...derived.observed,
      expectedWorkerCount: expectedCount,
      hardwareConcurrency,
      workerSourceAttribute: derived.observed.workerSources,
      workerCountAttribute: derived.observed.workerCounts,
    };
    if (audioOn) {
      result.audio = {
        note: "Chromium Web Audio render load through the DevTools WebAudio domain; browser load indicators, not hardware output evidence",
        contexts: dump.contexts,
        realtimeSamples: audioSamples.length,
      };
    }
    if (caseId !== "CONTROLS") assertSources(result, config, derived.observed, expectedCount);
    if (caseId === "APP_H100_SWITCH" && config.parity) result.errors.push("--parity does not apply in-app");

    const cpuAfter = await processSnapshot(browserSession);
    writeJson(join(runDir, "process-cpu.json"), {
      unit: "core-seconds",
      note: "cpuTime per browser process from CDP SystemInfo.getProcessInfo before and after the window.",
      before: cpuBefore,
      after: cpuAfter,
    });
    writeJson(join(runDir, "browser-facts.json"), {
      version: browser.version(),
      executableSha256: sha256File(chromium.executablePath()),
      launchArgs: "playwright default launch options, none added",
      userAgent: await page.evaluate(() => navigator.userAgent),
      hardwareConcurrency,
      crossOriginIsolated: await page.evaluate(() => self.crossOriginIsolated),
    });
    if (caseId !== "CONTROLS") result.status = result.errors.length === 0 ? "passed" : "failed";
    else result.status = "passed";
    result.dumpSummary = { commits: dump.commits.length, posts: dump.posts.length, params: dump.params.length, longTasks: dump.longTasks.length, support: dump.support };
  } catch (error) {
    result.errors.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
    try {
      if (tracing && !traceInfo) traceInfo = await tracing.stop(join(runDir, "chromium-trace.json"));
    } catch {
      // Nothing more to keep.
    }
  } finally {
    await browser.close().catch(() => undefined);
    stopServer(server);
  }
  if (result.errors.length > 0) {
    result.status = "failed";
    result.error = result.errors.join(" | ");
  }
  writeFileSync(join(runDir, "samples.jsonl"), serializeJsonl(samples), "utf8");
  if (!existsSync(join(runDir, "parity-diffs.jsonl"))) writeFileSync(join(runDir, "parity-diffs.jsonl"), NOT_APPLICABLE, "utf8");
  result.sampleCount = samples.length;
  if (traceInfo) {
    try {
      const phase = "app.worker-compute-metric";
      const jobs = config.caseSpec.caseId === "CONTROLS" ? [] : rankJobs(join(runDir, "samples.jsonl"), phase, 3);
      const analysis = await analyzeTrace({ file: traceInfo.file, outDir: runDir, exemplars: { phase, jobs }, computeCheck });
      result.trace = { computeVsTrace: analysis.computeVsTrace, bytes: traceInfo.bytes, threads: analysis.threads, marks: analysis.marks, gcEvents: analysis.gcEvents, cpuThreads: analysis.cpuThreads, exemplars: analysis.exemplars };
      if (result.controls) {
        const { evaluateControls } = await import("./controls-check.mjs");
        result.controls.evaluation = evaluateControls(runDir, result.controls.observations);
        writeJson(join(runDir, "controls.json"), { schema: "ec102.controls.v1", boundary: "browser-app", ...result.controls });
      }
    } catch (error) {
      result.status = "failed";
      result.errors.push(`trace analysis failed: ${error instanceof Error ? error.message : error}`);
      result.error = result.errors.join(" | ");
    }
  }
  result.endedAt = new Date().toISOString();
  writeJson(join(runDir, "runner-result.json"), result);
  process.exit(result.status === "passed" ? 0 : 2);
}

function assertSources(result, config, observed, expectedCount) {
  if (observed.commits === 0) {
    result.errors.push("no accepted frame was observed during the window");
    return;
  }
  if (config.variant === "TS-S") {
    if (observed.workerSources.length !== 1 || observed.workerSources[0] !== "Fallback") {
      result.errors.push(`fallback did not activate cleanly: data-worker-source values ${JSON.stringify(observed.workerSources)}`);
    }
    if (observed.workersCreated !== 0) result.errors.push(`a worker was created during a forced-serial run (${observed.workersCreated})`);
  } else {
    if (observed.workerSources.length !== 1 || observed.workerSources[0] !== "Worker") {
      result.errors.push(`data-worker-source values ${JSON.stringify(observed.workerSources)}, expected Worker only`);
    }
    if (observed.workerCounts.length !== 1 || observed.workerCounts[0] !== String(expectedCount)) {
      result.errors.push(`data-worker-count values ${JSON.stringify(observed.workerCounts)}, expected ${expectedCount}`);
    }
  }
}

/**
 * The workload manifest records staticGeometryHash and classicProjectionHash for the generated
 * 100-wall scene. This computes both from the project the app actually holds and says whether they
 * match. A mismatch is reported, not patched.
 */
async function crossCheckFixture(page, config, runDir, result) {
  const raw = await page.evaluate(() => localStorage.getItem("echo-canvas:project:hybrid:v1"));
  const project = JSON.parse(raw).present;
  const bundle = await import(pathToFileURL(resolve(config.nodeBundlePath)).href);
  const inApp = bundle.fixtureHashes(project);
  const manifest = JSON.parse(readFileSync(resolve("benchmarks/perf/workloads/v1/manifest.json"), "utf8"));
  const expected = { staticGeometryHash: manifest.scene.staticGeometryHash, classicProjectionHash: manifest.scene.classicProjectionHash };
  const check = {
    inApp,
    workloadManifest: expected,
    staticGeometryHashMatches: inApp.staticGeometryHash === expected.staticGeometryHash,
    classicProjectionHashMatches: inApp.classicProjectionHash === expected.classicProjectionHash,
    appProjectRevision: project.revision,
    appCounts: { walls: project.scene.walls.length, portals: project.scene.portals.length, sources: project.scene.sources.length, listeners: project.listeners.length },
  };
  writeJson(join(runDir, "fixture-crosscheck.json"), check);
  result.fixtureCrossCheck = check;
}

async function runInAppControls(page, result, audioOn) {
  const workspace = page.getByTestId("unified-workspace");
  const observations = await page.evaluate(async () => {
    const out = { longTaskSupport: PerformanceObserver.supportedEntryTypes.includes("longtask"), longTasksSeen: [] };
    let observer = null;
    if (out.longTaskSupport) {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) out.longTasksSeen.push({ start: entry.startTime, duration: entry.duration });
      });
      observer.observe({ type: "longtask", buffered: false });
    }
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    function ec102MainBusy(ms) {
      const end = performance.now() + ms;
      while (performance.now() < end) {
        // Busy wait.
      }
    }
    await sleep(100);
    const start = performance.now();
    performance.mark("ec102:control:main-block:start");
    ec102MainBusy(60);
    out.mainBlockMs = performance.now() - start;
    performance.mark("ec102:control:main-block:end");
    await sleep(150);
    if (observer) out.longTasksSeen.push(...observer.takeRecords().map((entry) => ({ start: entry.startTime, duration: entry.duration })));
    observer?.disconnect();
    for (let index = 0; index < 200; index += 1) {
      const now = performance.now();
      performance.mark(`ec102:clk:main:${index}:${now}:${performance.timeOrigin + now}`);
      if (index % 10 === 0) await sleep(2);
    }
    let kept = 0;
    for (let round = 0; round < 60; round += 1) kept += Array.from({ length: 20_000 }, (_, i) => ({ i, text: String(i) })).length;
    out.gcAllocation = { main: kept, workerRounds: "not-applicable" };
    let smallest = Infinity;
    let last = performance.now();
    for (let i = 0; i < 10_000; i += 1) {
      const value = performance.now();
      const delta = value - last;
      if (delta > 0 && delta < smallest) smallest = delta;
      last = value;
    }
    out.clockResolutionMs = { main: smallest, workers: "not-applicable" };
    out.workerBlock = "not-applicable";
    return out;
  });
  const audio = { requested: audioOn };
  if (audioOn) {
    const before = await page.evaluate(() => window.__ec102.dump().params.length);
    const handle = page.getByTestId("source-rain");
    const box = await handle.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      for (let step = 0; step < 40; step += 1) {
        await page.mouse.move(cx + Math.sin(step / 4) * 30, cy + Math.cos(step / 4) * 15);
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
    }
    await page.waitForTimeout(300);
    const dump = await page.evaluate(() => window.__ec102.dump());
    audio.paramOpsAfterMove = dump.params.length - before;
    audio.paramOpsByName = Object.fromEntries(
      [...new Set(dump.params.map((call) => call.name))].map((name) => [name, dump.params.filter((call) => call.name === name).length]),
    );
    audio.contexts = dump.contexts;
    audio.audioContextsAttribute = await workspace.getAttribute("data-audio-contexts");
  }
  observations.mainBlockWindow = { start: 0, end: 0 };
  observations.clockMarks = { main: 200, perWorker: "not-applicable" };
  result.controls = { observations, audio };
}

async function processSnapshot(session) {
  try {
    const { processInfo } = await session.send("SystemInfo.getProcessInfo");
    return processInfo.map(({ type, id, cpuTime }) => ({ type, id, cpuTime }));
  } catch (error) {
    return `${UNAVAILABLE}: ${error instanceof Error ? error.message.split("\n")[0] : error}`;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
