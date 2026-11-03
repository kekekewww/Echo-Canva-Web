import { SchroederReverb } from "@/audio/SchroederReverb";
import { SourceGraph } from "@/audio/SourceGraph";
import { scheduleEqualPowerCrossfade } from "@/audio/parameter-smoothing";
import type { AudioContextLike } from "@/audio/types";
import { computeAcousticFrame, type AcousticFrameSource } from "@/acoustics/compute-frame";
import type { RoomAcousticFrame } from "@/acoustics/types";
import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import type { SceneSpec } from "@/domain/scene/types";

const SAMPLE_RATE = 48_000;
const TARGET_RT60_SECONDS = 0.8;
const IMPULSE_START_SECONDS = 0.5;
const REVERB_RENDER_SECONDS = 4;
const TRANSITION_START_SECONDS = 0.25;
const TRANSITION_RENDER_SECONDS = 0.5;
const WINDOW_SECONDS = 0.02;
const RT60_ENERGY_RATIO = 1e-6;
const LIFECYCLE_RENDER_SECONDS = 0.5;
const LIFECYCLE_RETIRE_SECONDS = 0.25;
const LIFECYCLE_SIGNAL_LEVEL = 0.1;
/**
 * Direct-versus-occluded spectral render. A graph fades in over 15 ms and
 * smooths simulation parameters with a 0.08 s time constant, so analysis
 * starts at 0.6 s (7.5 time constants: residual < 0.06% of each step).
 */
const SPECTRUM_RENDER_SECONDS = 1;
const SPECTRUM_ANALYSIS_START_SECONDS = 0.6;
const SPECTRUM_FFT_SIZE = 4096;
const SPECTRUM_HOP_SIZE = SPECTRUM_FFT_SIZE / 2;
const SPECTRUM_NOISE_PEAK = 0.25;
const SPECTRUM_NOISE_SEED = 0x6563686f;
/** Analysed bands in Hz: low is [20, 500), high is [4000, 16000). */
const SPECTRUM_LOW_BAND_HZ = Object.freeze({ min: 20, max: 500 });
const SPECTRUM_HIGH_BAND_HZ = Object.freeze({ min: 4_000, max: 16_000 });
const SPECTRUM_SOURCE_ID = "radio";
const SPECTRUM_PORTAL_ID = "partition_door";

export type OcclusionSpectrumRender = Readonly<{
  /** Route classified by computeAcousticFrame for the rendered frame. */
  routeType: AcousticFrameSource["routeType"] | "unavailable";
  /** Frame values written into SourceGraph.applyFrame. */
  dryGainDb: number;
  lowpassHz: number;
  finite: boolean;
  /** Peak sample magnitude in the analysis window (full scale = 1). */
  peak: number;
  /** Mean-square level of the analysis window, both channels summed, dB re full scale. */
  rmsDb: number;
  /** Band mean-square energy, both channels summed, dB re full scale. */
  lowBandDb: number;
  highBandDb: number;
}>;

export type OcclusionSpectrumValidation = Readonly<{
  lowBandHz: Readonly<{ min: number; max: number }>;
  highBandHz: Readonly<{ min: number; max: number }>;
  analysisStartSeconds: number;
  analysisEndSeconds: number;
  direct: OcclusionSpectrumRender;
  occluded: OcclusionSpectrumRender;
}>;

export type GateCAudioRenderValidation = Readonly<{
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
  /** Production SourceGraph start (fade-in) and retire (fade-out) on a constant signal. */
  lifecycleMaxStep: number;
  lifecyclePeak: number;
  lifecycleMaxStepRatio: number;
  /** Peak after the retire fade has finished; should be silence. */
  lifecycleTailPeak: number;
  /**
   * Production SourceGraph rendered in Simulated mode with the same seeded
   * noise and a direct (door open) versus occluded (door closed) frame.
   */
  occlusionSpectrum: OcclusionSpectrumValidation;
}>;

declare global {
  interface Window {
    __echoCanvasRenderGateCValidation?: () => Promise<GateCAudioRenderValidation>;
  }
}

const VALIDATION_ROOM: RoomAcousticFrame = Object.freeze({
  volumeM3: 72,
  totalSurfaceM2: 118,
  // Use equal bands here so this rendered check measures the mid-band comb
  // decay rather than a deliberately longer low-frequency room tail.
  rt60S: { low: TARGET_RT60_SECONDS, mid: TARGET_RT60_SECONDS, high: TARGET_RT60_SECONDS },
  preDelayMs: 20,
});

/**
 * Renders the production Schroeder network with the browser's OfflineAudioContext.
 * It is intentionally only exposed as an automated validation hook; it does not
 * participate in the interactive preview's live audio graph.
 */
export async function renderGateCAudioValidation(): Promise<GateCAudioRenderValidation> {
  if (typeof OfflineAudioContext === "undefined") {
    return unavailableValidation();
  }

  const reverbBuffer = await renderSchroederImpulse();
  const transitionBuffer = await renderModeTransition();
  const reverbChannels = inspectChannels(reverbBuffer);
  const transitionSamples = transitionBuffer.getChannelData(0);
  const transitionMaxStep = maxSampleStep(
    transitionSamples,
    transitionBuffer.sampleRate,
    TRANSITION_START_SECONDS,
    TRANSITION_START_SECONDS + 0.08,
  );
  const transitionPeak = peakAmplitude(transitionSamples);
  const lifecycleBuffer = await renderSourceLifecycle();
  const lifecycleSamples = lifecycleBuffer.getChannelData(0);
  const lifecycleMaxStep = maxSampleStep(
    lifecycleSamples,
    lifecycleBuffer.sampleRate,
    0,
    LIFECYCLE_RENDER_SECONDS,
  );
  const lifecyclePeak = peakAmplitude(lifecycleSamples);
  const tailStart = Math.ceil((LIFECYCLE_RETIRE_SECONDS + 0.05) * lifecycleBuffer.sampleRate);
  const occlusionSpectrum = spectrumValidation(
    await renderOcclusionSpectrum(true),
    await renderOcclusionSpectrum(false),
  );

  return {
    available: true,
    finite: reverbChannels.every((channel) => channel.finite) && transitionSamples.every(Number.isFinite),
    reverbChannels,
    peak: Math.max(...reverbChannels.map((channel) => channel.peak)),
    estimatedRt60Seconds: estimateRt60Seconds(reverbBuffer),
    estimatedRt60Method: "stereo-energy",
    targetRt60Seconds: TARGET_RT60_SECONDS,
    transitionMaxStep,
    transitionPeak,
    transitionMaxStepRatio: transitionPeak > 0 ? transitionMaxStep / transitionPeak : Number.NaN,
    lifecycleMaxStep,
    lifecyclePeak,
    lifecycleMaxStepRatio: lifecyclePeak > 0 ? lifecycleMaxStep / lifecyclePeak : Number.NaN,
    lifecycleTailPeak: peakAmplitude(lifecycleSamples.subarray(tailStart)),
    occlusionSpectrum,
  };
}

export function installGateCAudioRenderValidation(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const previous = window.__echoCanvasRenderGateCValidation;
  window.__echoCanvasRenderGateCValidation = renderGateCAudioValidation;
  return () => {
    if (previous) {
      window.__echoCanvasRenderGateCValidation = previous;
    } else {
      delete window.__echoCanvasRenderGateCValidation;
    }
  };
}

async function renderSchroederImpulse(): Promise<AudioBuffer> {
  const context = new OfflineAudioContext(
    2,
    Math.ceil(REVERB_RENDER_SECONDS * SAMPLE_RATE),
    SAMPLE_RATE,
  );
  const source = context.createBufferSource();
  const impulse = context.createBuffer(1, 1, SAMPLE_RATE);
  impulse.getChannelData(0)[0] = 0.1;
  source.buffer = impulse;
  const stereoInput = context.createChannelMerger(2);

  const reverb = new SchroederReverb(
    context as unknown as AudioContextLike,
    context.destination as unknown as AudioContextLike["destination"],
  );
  reverb.apply(VALIDATION_ROOM, 0);
  source.connect(stereoInput, 0, 0);
  source.connect(stereoInput, 0, 1);
  stereoInput.connect(reverb.input as unknown as AudioNode);
  source.start(IMPULSE_START_SECONDS);

  const rendered = await context.startRendering();
  stereoInput.disconnect();
  reverb.dispose();
  return rendered;
}

async function renderModeTransition(): Promise<AudioBuffer> {
  const context = new OfflineAudioContext(
    1,
    Math.ceil(TRANSITION_RENDER_SECONDS * SAMPLE_RATE),
    SAMPLE_RATE,
  );
  const source = context.createBufferSource();
  const signal = context.createBuffer(1, context.length, SAMPLE_RATE);
  signal.getChannelData(0).fill(0.1);
  source.buffer = signal;

  const raw = context.createGain();
  const simulated = context.createGain();
  raw.gain.value = 1;
  simulated.gain.value = 0;
  source.connect(raw);
  source.connect(simulated);
  raw.connect(context.destination);
  simulated.connect(context.destination);
  scheduleEqualPowerCrossfade(raw.gain, simulated.gain, 0, Math.PI * 0.5, TRANSITION_START_SECONDS);
  source.start(0);

  return context.startRendering();
}

/**
 * Renders the production SourceGraph on a constant (DC) signal in Raw mode:
 * it starts at 0 s and is retired at 0.25 s. Any sample step therefore comes
 * from the lifecycle envelopes; a hard start or stop would step by the full
 * signal level.
 */
async function renderSourceLifecycle(): Promise<AudioBuffer> {
  const context = new OfflineAudioContext(
    2,
    Math.ceil(LIFECYCLE_RENDER_SECONDS * SAMPLE_RATE),
    SAMPLE_RATE,
  );
  const signal = context.createBuffer(1, SAMPLE_RATE, SAMPLE_RATE);
  signal.getChannelData(0).fill(LIFECYCLE_SIGNAL_LEVEL);
  const output = context.createGain();
  const reverbInput = context.createGain();
  output.connect(context.destination);
  const graph = new SourceGraph(
    context as unknown as AudioContextLike,
    output as unknown as AudioContextLike["destination"],
    reverbInput as unknown as AudioContextLike["destination"],
    {
      id: "lifecycle_validation",
      name: "Lifecycle validation",
      clipId: "radio_loop",
      sourceType: "point",
      position: { x: 1, y: 0 },
      gainDb: 0,
      loop: true,
    },
    { position: { x: 0, y: 0 }, headingDeg: 0 },
    signal,
    "raw",
    false,
  );
  graph.retire(LIFECYCLE_RETIRE_SECONDS);
  const rendered = await context.startRendering();
  graph.dispose();
  output.disconnect();
  return rendered;
}

/**
 * Renders the production SourceGraph in Simulated mode with seeded white
 * noise. The source is the Concrete Partition radio behind the partition; the
 * door's open state selects a direct or occluded frame from
 * computeAcousticFrame, whose dry gain and lowpass cutoff drive the graph's
 * obstruction filter. Early-reflection taps are omitted so the comparison
 * isolates the direct path, and the reverb send is left unconnected.
 */
async function renderOcclusionSpectrum(
  portalOpen: boolean,
): Promise<Readonly<{ buffer: AudioBuffer; frameSource: AcousticFrameSource | null }>> {
  const scene = structuredClone(CONCRETE_PARTITION_PRESET) as SceneSpec;
  const portals = scene.portals.map((portal) =>
    portal.id === SPECTRUM_PORTAL_ID ? { ...portal, open: portalOpen } : portal,
  );
  const sceneForFrame: SceneSpec = { ...scene, portals };
  const source = sceneForFrame.sources.find((candidate) => candidate.id === SPECTRUM_SOURCE_ID);
  const frameSource = computeAcousticFrame(sceneForFrame).sources.find(
    (candidate) => candidate.sourceId === SPECTRUM_SOURCE_ID,
  ) ?? null;

  const context = new OfflineAudioContext(
    2,
    Math.ceil(SPECTRUM_RENDER_SECONDS * SAMPLE_RATE),
    SAMPLE_RATE,
  );
  if (!source || !frameSource) {
    return { buffer: await context.startRendering(), frameSource: null };
  }
  const signal = context.createBuffer(1, context.length, SAMPLE_RATE);
  fillSeededNoise(signal.getChannelData(0), SPECTRUM_NOISE_SEED, SPECTRUM_NOISE_PEAK);
  const output = context.createGain();
  const reverbInput = context.createGain();
  output.connect(context.destination);
  const graph = new SourceGraph(
    context as unknown as AudioContextLike,
    output as unknown as AudioContextLike["destination"],
    reverbInput as unknown as AudioContextLike["destination"],
    // Authored gain is 0 dB so the comparison measures only frame values.
    { ...source, gainDb: 0 },
    sceneForFrame.listener,
    signal,
    "simulated",
    false,
  );
  graph.applyFrame({ ...frameSource, earlyReflections: [] }, sceneForFrame.listener, 0);
  const buffer = await context.startRendering();
  graph.dispose();
  output.disconnect();
  return { buffer, frameSource };
}

function spectrumValidation(
  direct: Readonly<{ buffer: AudioBuffer; frameSource: AcousticFrameSource | null }>,
  occluded: Readonly<{ buffer: AudioBuffer; frameSource: AcousticFrameSource | null }>,
): OcclusionSpectrumValidation {
  return {
    lowBandHz: SPECTRUM_LOW_BAND_HZ,
    highBandHz: SPECTRUM_HIGH_BAND_HZ,
    analysisStartSeconds: SPECTRUM_ANALYSIS_START_SECONDS,
    analysisEndSeconds: SPECTRUM_RENDER_SECONDS,
    direct: analyseSpectrumRender(direct.buffer, direct.frameSource),
    occluded: analyseSpectrumRender(occluded.buffer, occluded.frameSource),
  };
}

function analyseSpectrumRender(
  buffer: AudioBuffer,
  frameSource: AcousticFrameSource | null,
): OcclusionSpectrumRender {
  if (!frameSource) return unavailableSpectrumRender();
  const start = Math.floor(SPECTRUM_ANALYSIS_START_SECONDS * buffer.sampleRate);
  const binHz = buffer.sampleRate / SPECTRUM_FFT_SIZE;
  const window = hannWindow(SPECTRUM_FFT_SIZE);
  let windowPower = 0;
  for (const weight of window) windowPower += weight * weight;
  const real = new Float64Array(SPECTRUM_FFT_SIZE);
  const imaginary = new Float64Array(SPECTRUM_FFT_SIZE);
  let finite = true;
  let peak = 0;
  let meanSquare = 0;
  let lowBand = 0;
  let highBand = 0;
  let frames = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel).subarray(start);
    finite &&= samples.every(Number.isFinite);
    peak = Math.max(peak, peakAmplitude(samples));
    let channelSquare = 0;
    for (const sample of samples) channelSquare += sample * sample;
    meanSquare += channelSquare / samples.length;
    let channelFrames = 0;
    for (let offset = 0; offset + SPECTRUM_FFT_SIZE <= samples.length; offset += SPECTRUM_HOP_SIZE) {
      for (let index = 0; index < SPECTRUM_FFT_SIZE; index += 1) {
        real[index] = samples[offset + index]! * window[index]!;
        imaginary[index] = 0;
      }
      fftInPlace(real, imaginary);
      // One-sided Welch estimate: each bin below Nyquist carries twice its
      // power, normalised so the full band sums to the signal mean square.
      for (let bin = 1; bin < SPECTRUM_FFT_SIZE / 2; bin += 1) {
        const frequencyHz = bin * binHz;
        const power = (2 * (real[bin]! ** 2 + imaginary[bin]! ** 2)) /
          (SPECTRUM_FFT_SIZE * windowPower);
        if (frequencyHz >= SPECTRUM_LOW_BAND_HZ.min && frequencyHz < SPECTRUM_LOW_BAND_HZ.max) {
          lowBand += power;
        } else if (
          frequencyHz >= SPECTRUM_HIGH_BAND_HZ.min && frequencyHz < SPECTRUM_HIGH_BAND_HZ.max
        ) {
          highBand += power;
        }
      }
      channelFrames += 1;
    }
    frames = Math.max(frames, channelFrames);
  }
  return {
    routeType: frameSource.routeType,
    dryGainDb: frameSource.dryGainDb,
    lowpassHz: frameSource.lowpassHz,
    finite,
    peak,
    rmsDb: powerDb(meanSquare),
    lowBandDb: frames > 0 ? powerDb(lowBand / frames) : Number.NaN,
    highBandDb: frames > 0 ? powerDb(highBand / frames) : Number.NaN,
  };
}

function powerDb(power: number): number {
  return power > 0 ? 10 * Math.log10(power) : Number.NEGATIVE_INFINITY;
}

/** Deterministic uniform white noise in [-peak, peak] (mulberry32 generator). */
function fillSeededNoise(samples: Float32Array, seed: number, peak: number): void {
  let state = seed >>> 0;
  for (let index = 0; index < samples.length; index += 1) {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const unit = ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    samples[index] = (unit * 2 - 1) * peak;
  }
}

function hannWindow(size: number): Float64Array {
  const window = new Float64Array(size);
  for (let index = 0; index < size; index += 1) {
    window[index] = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / size);
  }
  return window;
}

/** Iterative radix-2 complex FFT; `real.length` must be a power of two. */
function fftInPlace(real: Float64Array, imaginary: Float64Array): void {
  const size = real.length;
  for (let index = 1, reversed = 0; index < size; index += 1) {
    let bit = size >> 1;
    for (; reversed & bit; bit >>= 1) reversed ^= bit;
    reversed ^= bit;
    if (index < reversed) {
      [real[index], real[reversed]] = [real[reversed]!, real[index]!];
      [imaginary[index], imaginary[reversed]] = [imaginary[reversed]!, imaginary[index]!];
    }
  }
  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    const stepReal = Math.cos(angle);
    const stepImaginary = Math.sin(angle);
    for (let offset = 0; offset < size; offset += length) {
      let twiddleReal = 1;
      let twiddleImaginary = 0;
      for (let index = 0; index < length / 2; index += 1) {
        const even = offset + index;
        const odd = even + length / 2;
        const oddReal = real[odd]! * twiddleReal - imaginary[odd]! * twiddleImaginary;
        const oddImaginary = real[odd]! * twiddleImaginary + imaginary[odd]! * twiddleReal;
        real[odd] = real[even]! - oddReal;
        imaginary[odd] = imaginary[even]! - oddImaginary;
        real[even] = real[even]! + oddReal;
        imaginary[even] = imaginary[even]! + oddImaginary;
        const nextReal = twiddleReal * stepReal - twiddleImaginary * stepImaginary;
        twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal;
        twiddleReal = nextReal;
      }
    }
  }
}

function unavailableSpectrumRender(): OcclusionSpectrumRender {
  return {
    routeType: "unavailable",
    dryGainDb: Number.NaN,
    lowpassHz: Number.NaN,
    finite: false,
    peak: Number.NaN,
    rmsDb: Number.NaN,
    lowBandDb: Number.NaN,
    highBandDb: Number.NaN,
  };
}

function unavailableValidation(): GateCAudioRenderValidation {
  return {
    available: false,
    finite: false,
    reverbChannels: [],
    peak: Number.NaN,
    estimatedRt60Seconds: Number.NaN,
    estimatedRt60Method: "stereo-energy",
    targetRt60Seconds: TARGET_RT60_SECONDS,
    transitionMaxStep: Number.NaN,
    transitionPeak: Number.NaN,
    transitionMaxStepRatio: Number.NaN,
    lifecycleMaxStep: Number.NaN,
    lifecyclePeak: Number.NaN,
    lifecycleMaxStepRatio: Number.NaN,
    lifecycleTailPeak: Number.NaN,
    occlusionSpectrum: {
      lowBandHz: SPECTRUM_LOW_BAND_HZ,
      highBandHz: SPECTRUM_HIGH_BAND_HZ,
      analysisStartSeconds: SPECTRUM_ANALYSIS_START_SECONDS,
      analysisEndSeconds: SPECTRUM_RENDER_SECONDS,
      direct: unavailableSpectrumRender(),
      occluded: unavailableSpectrumRender(),
    },
  };
}

function inspectChannels(buffer: AudioBuffer): readonly Readonly<{ finite: boolean; peak: number }>[] {
  const channels: Array<Readonly<{ finite: boolean; peak: number }>> = [];
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    channels.push({ finite: samples.every(Number.isFinite), peak: peakAmplitude(samples) });
  }
  return channels;
}

function peakAmplitude(samples: Float32Array): number {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  return peak;
}

function estimateRt60Seconds(buffer: AudioBuffer): number {
  return estimateDecaySeconds(buffer, RT60_ENERGY_RATIO);
}

function estimateDecaySeconds(
  buffer: AudioBuffer,
  energyRatio: number,
): number {
  const windowLength = Math.max(1, Math.round(WINDOW_SECONDS * buffer.sampleRate));
  const windowCount = Math.floor(buffer.length / windowLength);
  const energy = new Float64Array(windowCount);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let windowIndex = 0; windowIndex < windowCount; windowIndex += 1) {
      const offset = windowIndex * windowLength;
      for (let index = 0; index < windowLength; index += 1) {
        const sample = samples[offset + index]!;
        energy[windowIndex] += sample * sample;
      }
    }
  }

  const remaining = new Float64Array(windowCount);
  let accumulated = 0;
  for (let index = windowCount - 1; index >= 0; index -= 1) {
    accumulated += energy[index]!;
    remaining[index] = accumulated;
  }

  let onset = 0;
  while (onset < windowCount && energy[onset]! <= 1e-14) onset += 1;
  const reference = remaining[onset] ?? 0;
  if (!Number.isFinite(reference) || reference <= 0) return Number.NaN;
  const threshold = reference * energyRatio;
  for (let index = onset; index < windowCount; index += 1) {
    if (remaining[index]! <= threshold) {
      return (index - onset) * WINDOW_SECONDS;
    }
  }
  return Number.NaN;
}

function maxSampleStep(
  samples: Float32Array,
  sampleRate: number,
  startSeconds: number,
  endSeconds: number,
): number {
  const start = Math.max(1, Math.floor(startSeconds * sampleRate));
  const end = Math.min(samples.length, Math.ceil(endSeconds * sampleRate));
  let maximum = 0;
  for (let index = start; index < end; index += 1) {
    maximum = Math.max(maximum, Math.abs(samples[index]! - samples[index - 1]!));
  }
  return maximum;
}
