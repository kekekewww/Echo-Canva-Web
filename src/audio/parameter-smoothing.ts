import type { AudioParamLike } from "@/audio/types";
import { equalPowerCrossfade } from "@/audio/math";

export const PARAMETER_SMOOTHING_SECONDS = 0.08;
export const MODE_CROSSFADE_SECONDS = 0.08;

/**
 * Lifecycle envelope and tap-retune timings. These are perceptual engineering
 * choices that remove waveform discontinuities; they are not acoustic physics.
 */
export const SOURCE_FADE_IN_SECONDS = 0.015;
export const SOURCE_FADE_OUT_SECONDS = 0.025;
export const MASTER_FADE_SECONDS = 0.03;
export const TAP_RETUNE_FADE_SECONDS = 0.02;

const MODE_CROSSFADE_SAMPLE_COUNT = 33;

export function smoothParameter(
  parameter: AudioParamLike,
  target: number,
  now: number,
  timeConstant = PARAMETER_SMOOTHING_SECONDS,
): void {
  parameter.setTargetAtTime(target, now, timeConstant);
}

/**
 * Owns the smoothed automation of one AudioParam. Re-issuing `setTargetAtTime`
 * with the same target and time constant produces the same exponential
 * trajectory, so an identical request is skipped instead of adding another
 * automation event. Any other writer must call `invalidate` (or use `setAt` /
 * `markScheduled`) so the remembered target stays truthful.
 */
export class SmoothedParam {
  private lastTarget: number | null = null;
  private lastTimeConstant: number | null = null;

  constructor(readonly param: AudioParamLike) {}

  smooth(target: number, now: number, timeConstant = PARAMETER_SMOOTHING_SECONDS): void {
    // Object.is keeps exact numeric identity (including the sign of zero).
    if (
      this.lastTarget !== null &&
      Object.is(this.lastTarget, target) &&
      this.lastTimeConstant === timeConstant
    ) return;
    this.param.setTargetAtTime(target, now, timeConstant);
    this.lastTarget = target;
    this.lastTimeConstant = timeConstant;
  }

  /** Schedules an exact value and records it as the settled target. */
  setAt(value: number, time: number): void {
    this.param.setValueAtTime(value, time);
    this.markScheduled(value);
  }

  /** Records a target reached by automation scheduled directly on `param`. */
  markScheduled(target: number, timeConstant = PARAMETER_SMOOTHING_SECONDS): void {
    this.lastTarget = target;
    this.lastTimeConstant = timeConstant;
  }

  invalidate(): void {
    this.lastTarget = null;
    this.lastTimeConstant = null;
  }

  get target(): number | null {
    return this.lastTarget;
  }
}

export function scheduleEqualPowerCrossfade(
  raw: AudioParamLike,
  simulated: AudioParamLike,
  fromAngleRad: number,
  toAngleRad: number,
  now: number,
): void {
  const rawCurve = new Float32Array(MODE_CROSSFADE_SAMPLE_COUNT);
  const simulatedCurve = new Float32Array(MODE_CROSSFADE_SAMPLE_COUNT);

  for (let index = 0; index < MODE_CROSSFADE_SAMPLE_COUNT; index += 1) {
    const progress = index / (MODE_CROSSFADE_SAMPLE_COUNT - 1);
    const angleRad = fromAngleRad + (toAngleRad - fromAngleRad) * progress;
    const mix = angleRad / (Math.PI * 0.5);
    const coefficients = equalPowerCrossfade(mix);
    rawCurve[index] = coefficients.raw;
    simulatedCurve[index] = coefficients.simulated;
  }

  raw.cancelAndHoldAtTime(now);
  simulated.cancelAndHoldAtTime(now);
  raw.setValueCurveAtTime(rawCurve, now, MODE_CROSSFADE_SECONDS);
  simulated.setValueCurveAtTime(simulatedCurve, now, MODE_CROSSFADE_SECONDS);
}
