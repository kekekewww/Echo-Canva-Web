import { dbToLinear } from "@/audio/math";
import {
  PARAMETER_SMOOTHING_SECONDS,
  SmoothedParam,
  TAP_RETUNE_FADE_SECONDS,
} from "@/audio/parameter-smoothing";
import { assignReflectionSlots, classicReflectionKey } from "@/audio/reflection-slots";
import type {
  AudioContextLike,
  AudioNodeLike,
  BiquadFilterNodeLike,
  DelayNodeLike,
  GainNodeLike,
  HybridEarlyReflectionTap,
  PannerNodeLike,
} from "@/audio/types";
import type { AcousticEarlyReflection } from "@/acoustics/compute-frame";
import type { Vec2 } from "@/domain/scene/types";

export const MAX_EARLY_REFLECTION_TAPS = 6;
const MAX_EARLY_DELAY_SECONDS = 0.2;

type ReflectionTapNodes = Readonly<{
  delay: DelayNodeLike;
  gain: GainNodeLike;
  filter: BiquadFilterNodeLike;
  panner: PannerNodeLike;
  delayTime: SmoothedParam;
  level: SmoothedParam;
  frequency: SmoothedParam;
  positionX: SmoothedParam;
  positionY: SmoothedParam;
  positionZ: SmoothedParam;
}>;

type TapSlotState = {
  /** Identity of the reflection path currently assigned to this tap, if any. */
  key: string | null;
  /** Audio-clock time until which a scheduled fade/retune owns this tap. */
  busyUntil: number;
};

type TapTarget = Readonly<{
  key: string;
  delaySeconds: number;
  gain: number;
  lowpassHz: number;
  x: number;
  y: number;
  z: number;
}>;

export type TapUpdateOptions = Readonly<{
  /** Apply values without fades, for a context that is not rendering. */
  immediate?: boolean;
}>;

/**
 * A fixed, simulated-only pool of six early-reflection taps.
 *
 * Paths keep their tap while they stay audible. A tap only changes the delay
 * of the path it already carries by smoothing; moving a tap to a different
 * path fades it out, sets the new delay/filter/position while silent, and fades
 * back in, so no delay line glides between unrelated paths (no Doppler chirp).
 */
export class EarlyReflectionBank {
  private readonly taps: readonly ReflectionTapNodes[];
  private readonly slots: TapSlotState[];
  private hrtfEnabled: boolean;
  private disposed = false;

  constructor(
    context: AudioContextLike,
    input: AudioNodeLike,
    output: AudioNodeLike,
    private readonly listenerPosition: () => Vec2,
    hrtfEnabled: boolean,
  ) {
    const createdNodes: AudioNodeLike[] = [];
    const taps: ReflectionTapNodes[] = [];
    try {
      for (let index = 0; index < MAX_EARLY_REFLECTION_TAPS; index += 1) {
        const delay = context.createDelay(MAX_EARLY_DELAY_SECONDS);
        createdNodes.push(delay);
        const gain = context.createGain();
        createdNodes.push(gain);
        const filter = context.createBiquadFilter();
        createdNodes.push(filter);
        const panner = context.createPanner();
        createdNodes.push(panner);
        filter.type = "lowpass";
        filter.frequency.value = 20_000;
        gain.gain.value = 0;
        panner.panningModel = hrtfEnabled ? "HRTF" : "equalpower";
        panner.distanceModel = "inverse";
        panner.rolloffFactor = 0;
        panner.refDistance = 1;
        panner.maxDistance = 50;
        input.connect(delay);
        delay.connect(gain);
        gain.connect(filter);
        filter.connect(panner);
        panner.connect(output);
        taps.push({
          delay,
          gain,
          filter,
          panner,
          delayTime: new SmoothedParam(delay.delayTime),
          level: new SmoothedParam(gain.gain),
          frequency: new SmoothedParam(filter.frequency),
          positionX: new SmoothedParam(panner.positionX),
          positionY: new SmoothedParam(panner.positionY),
          positionZ: new SmoothedParam(panner.positionZ),
        });
      }
    } catch (error) {
      for (const node of createdNodes.reverse()) {
        try {
          node.disconnect();
        } catch {
          // Roll back any partially allocated tap nodes before surfacing the failure.
        }
      }
      throw error;
    }
    this.taps = taps;
    this.slots = taps.map(() => ({ key: null, busyUntil: Number.NEGATIVE_INFINITY }));
    this.hrtfEnabled = hrtfEnabled;
  }

  apply(
    reflections: readonly AcousticEarlyReflection[],
    now: number,
    options: TapUpdateOptions = {},
  ): void {
    if (this.disposed) return;
    const listener = this.listenerPosition();
    this.applyTargets(reflections.slice(0, MAX_EARLY_REFLECTION_TAPS).map((reflection) => ({
      key: classicReflectionKey(reflection),
      delaySeconds: clampDelaySeconds(reflection.delayMs / 1000),
      gain: dbToLinear(reflection.gainDb),
      lowpassHz: clampFrequency(reflection.lowpassHz),
      x: reflection.reflectionPoint.x - listener.x,
      y: 0,
      z: -(reflection.reflectionPoint.y - listener.y),
    })), now, options.immediate ?? false);
  }

  applySpatial3d(
    reflections: readonly HybridEarlyReflectionTap[],
    listener: Readonly<{ x: number; y: number; z: number }>,
    now: number,
    options: TapUpdateOptions = {},
  ): void {
    if (this.disposed) return;
    this.applyTargets(reflections.slice(0, MAX_EARLY_REFLECTION_TAPS).map((reflection) => {
      const relativeZ = reflection.position.z - listener.z;
      return {
        key: reflection.id,
        delaySeconds: clampDelaySeconds(reflection.delayMs / 1000),
        gain: dbToLinear(reflection.gainDb),
        lowpassHz: clampFrequency(reflection.lowpassHz),
        x: reflection.position.x - listener.x,
        y: reflection.position.y - listener.y,
        z: relativeZ === 0 ? 0 : -relativeZ,
      };
    }), now, options.immediate ?? false);
  }

  setHrtfEnabled(enabled: boolean): void {
    if (this.disposed || enabled === this.hrtfEnabled) return;
    this.hrtfEnabled = enabled;
    for (const tap of this.taps) tap.panner.panningModel = enabled ? "HRTF" : "equalpower";
  }

  /** Reflection path keys by tap index, for diagnostics and tests. */
  get slotKeys(): readonly (string | null)[] {
    return this.slots.map(({ key }) => key);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const tap of this.taps) {
      for (const node of [tap.delay, tap.gain, tap.filter, tap.panner]) {
        try {
          node.disconnect();
        } catch {
          // Terminal cleanup is best-effort for browser nodes.
        }
      }
    }
  }

  private applyTargets(targets: readonly TapTarget[], now: number, immediate: boolean): void {
    const targetsByKey = new Map<string, TapTarget>();
    for (const target of targets) {
      if (!targetsByKey.has(target.key)) targetsByKey.set(target.key, target);
    }
    const assignment = assignReflectionSlots(
      this.slots.map(({ key }) => key),
      [...targetsByKey.keys()],
      this.slots.map(({ key, busyUntil }) => key === null && now >= busyUntil),
    );

    for (let index = 0; index < this.taps.length; index += 1) {
      const nextKey = assignment[index] ?? null;
      const target = nextKey === null ? null : targetsByKey.get(nextKey)!;
      const slot = this.slots[index]!;
      if (immediate) {
        this.snapTap(index, target, now);
      } else if (target === null) {
        if (slot.key !== null) this.releaseTap(index, now);
      } else if (slot.key === target.key) {
        // Updates that arrive while the tap is still retuning are superseded by
        // the next frame; scheduling them now would interrupt the fade.
        if (now >= slot.busyUntil) this.smoothTap(index, target, now);
      } else if (slot.key === null && now >= slot.busyUntil) {
        this.enterQuietTap(index, target, now);
      } else {
        this.retuneTap(index, target, now);
      }
    }
  }

  /** Same path as before: smooth every parameter (a small, physical change). */
  private smoothTap(index: number, target: TapTarget, now: number): void {
    const tap = this.taps[index]!;
    tap.delayTime.smooth(target.delaySeconds, now);
    tap.level.smooth(target.gain, now);
    tap.frequency.smooth(target.lowpassHz, now);
    tap.positionX.smooth(target.x, now);
    tap.positionY.smooth(target.y, now);
    tap.positionZ.smooth(target.z, now);
  }

  /** A silent idle tap takes a new path: set it while silent, then fade in. */
  private enterQuietTap(index: number, target: TapTarget, now: number): void {
    const tap = this.taps[index]!;
    this.setTapShape(tap, target, now);
    tap.level.invalidate();
    tap.level.smooth(target.gain, now);
    this.slots[index] = { key: target.key, busyUntil: now };
  }

  /** An audible (or still fading) tap moves to a different path. */
  private retuneTap(index: number, target: TapTarget, now: number): void {
    const tap = this.taps[index]!;
    const silentAt = now + TAP_RETUNE_FADE_SECONDS;
    const level = tap.level.param;
    level.cancelAndHoldAtTime(now);
    level.linearRampToValueAtTime(0, silentAt);
    level.setTargetAtTime(target.gain, silentAt, PARAMETER_SMOOTHING_SECONDS);
    tap.level.markScheduled(target.gain);
    this.setTapShape(tap, target, silentAt, now);
    this.slots[index] = { key: target.key, busyUntil: silentAt };
  }

  /** A path left the audible set: fade its tap to exact silence. */
  private releaseTap(index: number, now: number): void {
    const tap = this.taps[index]!;
    const silentAt = now + TAP_RETUNE_FADE_SECONDS;
    const level = tap.level.param;
    level.cancelAndHoldAtTime(now);
    level.linearRampToValueAtTime(0, silentAt);
    tap.level.markScheduled(0);
    this.slots[index] = { key: null, busyUntil: silentAt };
  }

  /** No fades for a context that is not rendering; values apply on resume. */
  private snapTap(index: number, target: TapTarget | null, now: number): void {
    const tap = this.taps[index]!;
    const gain = target?.gain ?? 0;
    if (!Object.is(tap.level.target, gain) || now < this.slots[index]!.busyUntil) {
      tap.level.param.cancelScheduledValues(now);
      tap.level.setAt(gain, now);
    }
    if (target) this.setTapShape(tap, target, now, now, true);
    this.slots[index] = { key: target?.key ?? null, busyUntil: now };
  }

  private setTapShape(
    tap: ReflectionTapNodes,
    target: TapTarget,
    at: number,
    cancelFrom = at,
    skipUnchanged = false,
  ): void {
    const entries: readonly (readonly [SmoothedParam, number])[] = [
      [tap.delayTime, target.delaySeconds],
      [tap.frequency, target.lowpassHz],
      [tap.positionX, target.x],
      [tap.positionY, target.y],
      [tap.positionZ, target.z],
    ];
    for (const [parameter, value] of entries) {
      if (skipUnchanged && Object.is(parameter.target, value)) continue;
      // Drop any value still pending from an interrupted retune, then set the
      // new path's value exactly at the silent point.
      parameter.param.cancelScheduledValues(cancelFrom);
      parameter.setAt(value, at);
    }
  }
}

function clampDelaySeconds(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_EARLY_DELAY_SECONDS, Math.max(0, value));
}

function clampFrequency(value: number): number {
  if (!Number.isFinite(value)) return 20_000;
  return Math.min(20_000, Math.max(80, value));
}
