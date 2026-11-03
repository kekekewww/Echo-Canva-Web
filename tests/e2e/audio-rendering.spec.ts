import { expect, test } from "@playwright/test";

type OcclusionSpectrumRender = Readonly<{
  routeType: "direct" | "portal" | "blocked" | "unavailable";
  dryGainDb: number;
  lowpassHz: number;
  finite: boolean;
  peak: number;
  rmsDb: number;
  lowBandDb: number;
  highBandDb: number;
}>;

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
  occlusionSpectrum: Readonly<{
    lowBandHz: Readonly<{ min: number; max: number }>;
    highBandHz: Readonly<{ min: number; max: number }>;
    analysisStartSeconds: number;
    analysisEndSeconds: number;
    direct: OcclusionSpectrumRender;
    occluded: OcclusionSpectrumRender;
  }>;
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

/**
 * Rendered-graph evidence only (not listening or localization evidence).
 * The production SourceGraph renders the same seeded white noise (uniform,
 * peak 0.25) in Simulated mode for the Concrete Partition radio behind the
 * partition: door open is a clear direct route, door closed is occluded.
 * Bands: low [20, 500) Hz, high [4, 16) kHz; levels are mean-square dB re
 * full scale over the settled 0.6-1.0 s window, both channels summed.
 */
test("browser renders lower high-band energy through the occluded source graph than the direct one", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(
    () => typeof window.__echoCanvasRenderGateCValidation === "function",
  );

  const result = await page.evaluate(async () => {
    const probe = window.__echoCanvasRenderGateCValidation;
    if (!probe) throw new Error("Gate C browser audio-render validation probe is unavailable.");
    return probe();
  });
  const { direct, occluded } = result.occlusionSpectrum;
  await test.info().attach("occlusion-spectrum.json", {
    body: JSON.stringify(result.occlusionSpectrum, null, 2),
    contentType: "application/json",
  });

  expect(result.available).toBe(true);
  expect(result.occlusionSpectrum.lowBandHz).toEqual({ min: 20, max: 500 });
  expect(result.occlusionSpectrum.highBandHz).toEqual({ min: 4_000, max: 16_000 });
  // Preconditions: the frames come from computeAcousticFrame, not test values.
  expect(direct.routeType).toBe("direct");
  expect(occluded.routeType).toBe("blocked");
  expect(occluded.dryGainDb).toBeLessThan(direct.dryGainDb);
  expect(occluded.lowpassHz).toBeLessThan(direct.lowpassHz);

  for (const render of [direct, occluded]) {
    expect(render.finite).toBe(true);
    expect(render.peak).toBeGreaterThan(0);
    expect(render.peak).toBeLessThanOrEqual(1);
    expect(Number.isFinite(render.rmsDb)).toBe(true);
    expect(render.rmsDb).toBeLessThan(0);
    expect(Number.isFinite(render.lowBandDb)).toBe(true);
    expect(Number.isFinite(render.highBandDb)).toBe(true);
  }
  // Uniform noise mean square (0.25^2 / 3) at 1/6 inverse-distance gain for
  // 6 m, panned fully to one channel: 10 log10(0.0208333 / 36) = -32.42 dB.
  expect(Math.abs(direct.rmsDb - -32.42)).toBeLessThanOrEqual(1);

  const dryGainDeltaDb = occluded.dryGainDb - direct.dryGainDb;
  const lowBandDeltaDb = occluded.lowBandDb - direct.lowBandDb;
  const highBandDeltaDb = occluded.highBandDb - direct.highBandDb;
  // Below the obstruction cutoff the low band follows the dry-gain change;
  // +/-3 dB allows for the biquad's passband shape near 500 Hz.
  expect(
    Math.abs(lowBandDeltaDb - dryGainDeltaDb),
    `Low-band change ${lowBandDeltaDb} dB should follow dry-gain change ${dryGainDeltaDb} dB within 3 dB.`,
  ).toBeLessThanOrEqual(3);
  // The obstruction lowpass must remove at least 20 dB more high-band energy
  // than the broadband dry-gain change alone.
  expect(
    highBandDeltaDb,
    `High-band change ${highBandDeltaDb} dB should be at least 20 dB below dry-gain change ${dryGainDeltaDb} dB.`,
  ).toBeLessThanOrEqual(dryGainDeltaDb - 20);
});
