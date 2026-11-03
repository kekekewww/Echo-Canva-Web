import { writeFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

// Opt-in benchmark for #25 (not a gate). It samples Chromium's Web Audio render
// load through the DevTools WebAudio domain while a source is dragged
// continuously during playback, and counts how many distinct acoustic frames the
// workspace accepts during the drag (#23). Results depend on the machine and
// browser; record them as benchmark evidence with the environment.
//
//   ECHO_AUDIO_BENCHMARK=1 pnpm exec playwright test tests/e2e/audio-render-capacity.spec.ts
//
// Requires `pnpm build` first (the Playwright web server runs `pnpm start`).
test.skip(!process.env.ECHO_AUDIO_BENCHMARK, "Set ECHO_AUDIO_BENCHMARK=1 to run the render-capacity benchmark.");

const DRAG_MS = 10_000;
const IDLE_MS = 2_000;
const SAMPLE_EVERY_MS = 250;
const POINTER_STEP_MS = 16;

type RealtimeData = Readonly<{
  currentTime: number;
  renderCapacity: number;
  callbackIntervalMean: number;
  callbackIntervalVariance: number;
}>;

function summarize(values: readonly number[]) {
  const sorted = values.toSorted((left, right) => left - right);
  const at = (quantile: number) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)] ?? Number.NaN;
  const mean = sorted.reduce((total, value) => total + value, 0) / Math.max(1, sorted.length);
  return { count: sorted.length, mean, p50: at(0.5), p95: at(0.95), max: sorted.at(-1) ?? Number.NaN };
}

test("records Web Audio render capacity and accepted frames during a continuous source drag", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Uses the Chromium DevTools WebAudio domain.");
  test.setTimeout(DRAG_MS + IDLE_MS + 60_000);

  const cdp = await page.context().newCDPSession(page);
  const contextIds: string[] = [];
  cdp.on("WebAudio.contextCreated", (event: { context: { contextId: string } }) => {
    contextIds.push(event.context.contextId);
  });
  await cdp.send("WebAudio.enable");

  await page.goto("/classic");
  const workspace = page.getByTestId("unified-workspace");
  const statusbar = page.locator(".workspace-statusbar");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(workspace).toHaveAttribute("data-audio-contexts", "1");
  await expect.poll(() => contextIds.length).toBeGreaterThan(0);
  await expect(statusbar).toHaveAttribute("data-worker-source", "Worker");
  const contextId = contextIds.at(-1)!;
  const realtime = async (): Promise<RealtimeData> => (
    await cdp.send("WebAudio.getRealtimeData" as never, { contextId } as never) as { realtimeData: RealtimeData }
  ).realtimeData;

  const idle: RealtimeData[] = [];
  for (let elapsed = 0; elapsed < IDLE_MS; elapsed += SAMPLE_EVERY_MS) {
    await page.waitForTimeout(SAMPLE_EVERY_MS);
    idle.push(await realtime());
  }

  const handle = page.getByTestId("source-rain");
  const box = await handle.boundingBox();
  if (!box) throw new Error("Rain source handle is not visible.");
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();

  const drag: RealtimeData[] = [];
  const acceptedRevisions = new Set<string>();
  let pointerMoves = 0;
  const startedAt = Date.now();
  let nextSampleAt = startedAt + SAMPLE_EVERY_MS;
  while (Date.now() - startedAt < DRAG_MS) {
    const phase = ((Date.now() - startedAt) / 2_000) * Math.PI * 2;
    // A slow figure-of-eight inside the rain source's room, small enough to stay valid.
    await page.mouse.move(centerX + Math.sin(phase) * 36, centerY + Math.sin(phase * 2) * 18);
    pointerMoves += 1;
    if (Date.now() >= nextSampleAt) {
      nextSampleAt += SAMPLE_EVERY_MS;
      drag.push(await realtime());
      const revision = await statusbar.getAttribute("data-acoustic-revision");
      if (revision) acceptedRevisions.add(revision);
    }
    await page.waitForTimeout(POINTER_STEP_MS);
  }
  await page.mouse.up();

  const metrics = {
    environment: {
      userAgent: await page.evaluate(() => navigator.userAgent),
      hardwareConcurrency: await page.evaluate(() => navigator.hardwareConcurrency),
    },
    settings: { dragMs: DRAG_MS, idleMs: IDLE_MS, sampleEveryMs: SAMPLE_EVERY_MS, pointerStepMs: POINTER_STEP_MS },
    idleRenderCapacity: summarize(idle.map(({ renderCapacity }) => renderCapacity)),
    dragRenderCapacity: summarize(drag.map(({ renderCapacity }) => renderCapacity)),
    dragCallbackIntervalMeanMs: summarize(drag.map(({ callbackIntervalMean }) => callbackIntervalMean * 1_000)),
    dragCallbackIntervalStdMs: summarize(drag.map(({ callbackIntervalVariance }) => Math.sqrt(callbackIntervalVariance) * 1_000)),
    pointerMoves,
    distinctAcceptedRevisionsSampledDuringDrag: acceptedRevisions.size,
    samplesDuringDrag: drag.length,
  };
  const path = test.info().outputPath("audio-render-capacity.json");
  await writeFile(path, JSON.stringify(metrics, null, 2));
  await test.info().attach("audio-render-capacity", { path, contentType: "application/json" });
  console.log(`audio-render-capacity ${JSON.stringify(metrics)}`);

  expect(drag.length).toBeGreaterThan(0);
  expect(drag.every(({ renderCapacity }) => Number.isFinite(renderCapacity))).toBe(true);
});
