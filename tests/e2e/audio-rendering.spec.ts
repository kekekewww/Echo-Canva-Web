import { expect, test } from "@playwright/test";

type RenderValidation = Readonly<{
  available: boolean;
  finite: boolean;
  reverbChannels: readonly Readonly<{
    finite: boolean;
    peak: number;
  }>[];
  peak: number;
  estimatedRt60Seconds: number;
  estimatedRt60Method: "stereo-energy";
  targetRt60Seconds: number;
  transitionMaxStep: number;
  transitionPeak: number;
  transitionMaxStepRatio: number;
  lifecycleMaxStep: number;
  lifecyclePeak: number;
  lifecycleMaxStepRatio: number;
  lifecycleTailPeak: number;
}>;

declare global {
  interface Window {
    __echoCanvasRenderGateCValidation?: () => Promise<RenderValidation>;
  }
}

test("browser renders a finite, decay-controlled reverb and a continuous Raw/Simulated transition", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(
    () => typeof window.__echoCanvasRenderGateCValidation === "function",
  );

  const result = await page.evaluate(async () => {
    const probe = window.__echoCanvasRenderGateCValidation;
    if (!probe) throw new Error("Gate C browser audio-render validation probe is unavailable.");
    return probe();
  });

  expect(result.available).toBe(true);
  expect(result.finite).toBe(true);
  expect(result.reverbChannels).toHaveLength(2);
  for (const channel of result.reverbChannels) {
    expect(channel.finite).toBe(true);
    expect(channel.peak).toBeGreaterThan(0);
    expect(channel.peak).toBeLessThanOrEqual(1);
  }
  expect(result.peak).toBeGreaterThan(0);
  expect(result.peak).toBeLessThanOrEqual(1);
  expect(result.estimatedRt60Seconds).toBeGreaterThan(0);
  expect(result.estimatedRt60Method).toBe("stereo-energy");
  expect(result.estimatedRt60Seconds).toBeGreaterThanOrEqual(result.targetRt60Seconds * 0.8);
  expect(result.estimatedRt60Seconds).toBeLessThanOrEqual(result.targetRt60Seconds * 1.2);
  expect(result.transitionPeak).toBeGreaterThan(0);
  expect(result.transitionPeak).toBeLessThanOrEqual(1);
  expect(
    result.transitionMaxStepRatio,
    `Raw/Simulated step ratio ${result.transitionMaxStepRatio} must stay within 1% of peak ${result.transitionPeak}.`,
  ).toBeLessThanOrEqual(0.01);
  // Production SourceGraph start/retire on a constant 0.1 signal: without
  // envelopes the first and last samples would step by 100% of the peak.
  expect(result.lifecyclePeak).toBeCloseTo(0.1, 3);
  expect(
    result.lifecycleMaxStepRatio,
    `Source start/retire step ratio ${result.lifecycleMaxStepRatio} must stay within 1% of peak ${result.lifecyclePeak}.`,
  ).toBeLessThanOrEqual(0.01);
  expect(result.lifecycleTailPeak).toBeLessThanOrEqual(1e-6);
});
