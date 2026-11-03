import { describe, expect, it } from "vitest";

import { EarlyReflectionBank } from "@/audio/EarlyReflectionBank";
import { classicReflectionKey } from "@/audio/reflection-slots";
import type { AudioNodeLike, AudioParamLike } from "@/audio/types";
import { computeAcousticFrame } from "@/acoustics/compute-frame";
import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { STRESS_100_WALLS_PRESET } from "@/domain/presets/stress-100-walls";
import type { SceneSpec } from "@/domain/scene/types";

type ParamEvent =
  | Readonly<{ type: "target"; value: number; time: number; timeConstant: number }>
  | Readonly<{ type: "set"; value: number; time: number }>
  | Readonly<{ type: "ramp"; value: number; time: number }>
  | Readonly<{ type: "hold" | "cancel"; time: number }>;

class FakeParam implements AudioParamLike {
  readonly targets: Array<{ target: number; startTime: number; timeConstant: number }> = [];
  readonly sets: Array<{ value: number; startTime: number }> = [];
  readonly ramps: Array<{ value: number; endTime: number }> = [];
  readonly events: ParamEvent[] = [];

  constructor(readonly value = 0) {}

  cancelAndHoldAtTime(time: number): AudioParamLike {
    this.events.push({ type: "hold", time });
    return this;
  }
  cancelScheduledValues(time: number): AudioParamLike {
    this.events.push({ type: "cancel", time });
    return this;
  }
  setValueCurveAtTime(): AudioParamLike { return this; }
  setTargetAtTime(target: number, startTime: number, timeConstant: number): AudioParamLike {
    this.targets.push({ target, startTime, timeConstant });
    this.events.push({ type: "target", value: target, time: startTime, timeConstant });
    return this;
  }
  setValueAtTime(value: number, startTime: number): AudioParamLike {
    this.sets.push({ value, startTime });
    this.events.push({ type: "set", value, time: startTime });
    return this;
  }
  linearRampToValueAtTime(value: number, endTime: number): AudioParamLike {
    this.ramps.push({ value, endTime });
    this.events.push({ type: "ramp", value, time: endTime });
    return this;
  }

  /** The value the param settles on after its most recent scheduled value-setting event. */
  get scheduledValue(): number {
    const last = [...this.events].reverse().find((event) => event.type !== "hold" && event.type !== "cancel");
    return last && "value" in last ? last.value : this.value;
  }
}

class FakeNode implements AudioNodeLike {
  readonly connections: AudioNodeLike[] = [];
  disconnectCalls = 0;

  connect(destination: AudioNodeLike): AudioNodeLike {
    this.connections.push(destination);
    return destination;
  }

  disconnect(): void { this.disconnectCalls += 1; }
}

class FakeContext {
  readonly allNodes: FakeNode[] = [];
  readonly delays: Array<FakeNode & { delayTime: FakeParam }> = [];
  readonly gains: Array<FakeNode & { gain: FakeParam }> = [];
  readonly filters: Array<FakeNode & { frequency: FakeParam; type: BiquadFilterType }> = [];
  readonly panners: Array<FakeNode & {
    positionX: FakeParam;
    positionY: FakeParam;
    positionZ: FakeParam;
    panningModel: PanningModelType;
    distanceModel: DistanceModelType;
    rolloffFactor: number;
    refDistance: number;
    maxDistance: number;
  }> = [];
  failOnCreation: number | null = null;
  private creationCount = 0;

  createDelay() {
    const node = this.track(Object.assign(new FakeNode(), { delayTime: new FakeParam() }));
    this.delays.push(node);
    return node;
  }

  createGain() {
    const node = this.track(Object.assign(new FakeNode(), { gain: new FakeParam(1) }));
    this.gains.push(node);
    return node;
  }

  createBiquadFilter() {
    const node = this.track(Object.assign(new FakeNode(), { frequency: new FakeParam(20_000), type: "lowpass" as BiquadFilterType }));
    this.filters.push(node);
    return node;
  }

  createPanner() {
    const node = this.track(Object.assign(new FakeNode(), {
      positionX: new FakeParam(), positionY: new FakeParam(), positionZ: new FakeParam(),
      panningModel: "equalpower" as PanningModelType, distanceModel: "inverse" as DistanceModelType,
      rolloffFactor: 1, refDistance: 1, maxDistance: 10_000,
    }));
    this.panners.push(node);
    return node;
  }

  private track<T extends FakeNode>(node: T): T {
    this.creationCount += 1;
    if (this.creationCount === this.failOnCreation) throw new Error("Injected node factory failure.");
    this.allNodes.push(node);
    return node;
  }
}

const listener = { x: 4, y: 3 };
const tap = (index: number) => ({
  wallId: `wall-${index}`,
  reflectionPoint: { x: 8 + index, y: 2 },
  pathLengthM: 8,
  delayMs: 15 + index,
  gainDb: -9 - index,
  lowpassHz: 4_000 - index * 100,
});

describe("EarlyReflectionBank", () => {
  it("creates a fixed six-tap pool once and ignores extra reflection taps", () => {
    const context = new FakeContext();
    const bank = new EarlyReflectionBank(context as never, new FakeNode(), new FakeNode(), () => listener, true);

    bank.apply(Array.from({ length: 8 }, (_, index) => tap(index)), 3);

    expect(context.delays).toHaveLength(6);
    expect(context.gains).toHaveLength(6);
    expect(context.filters).toHaveLength(6);
    expect(context.panners).toHaveLength(6);
    expect(context.gains[5]?.gain.targets.at(-1)?.target).toBeCloseTo(10 ** (-14 / 20));
    expect(context.gains.some((gain) => gain.gain.targets.some(({ target }) => target === 10 ** (-15 / 20)))).toBe(false);
  });

  it("ramps inactive taps to silence without allocating nodes during frame updates", () => {
    const context = new FakeContext();
    const bank = new EarlyReflectionBank(context as never, new FakeNode(), new FakeNode(), () => listener, true);
    bank.apply([tap(0), tap(1)], 3);
    const nodeCounts = [context.delays.length, context.gains.length, context.filters.length, context.panners.length];

    bank.apply([tap(0)], 3.1);

    // The released tap ramps linearly to exact silence; never-used taps stay at 0 untouched.
    expect(context.gains[1]?.gain.ramps.at(-1)).toEqual({ value: 0, endTime: 3.12 });
    expect(context.gains.slice(1).every((gain) => gain.gain.scheduledValue === 0)).toBe(true);
    expect(context.gains.slice(2).every((gain) => gain.gain.events.length === 0)).toBe(true);
    expect([context.delays.length, context.gains.length, context.filters.length, context.panners.length])
      .toEqual(nodeCounts);
  });

  it("maps a 3D reflection point to the persistent tap panner and silences removed taps", () => {
    const context = new FakeContext();
    const bank = new EarlyReflectionBank(context as never, new FakeNode(), new FakeNode(), () => listener, true);
    const nodeCounts = [context.delays.length, context.gains.length, context.filters.length, context.panners.length];

    bank.applySpatial3d([{
      id: "first:ceiling",
      position: { x: 8, y: 3, z: 5 },
      delayMs: 18,
      gainDb: -14,
      lowpassHz: 6_000,
    }], { x: 4, y: 1, z: 2 }, 3);

    expect(context.delays[0]?.delayTime.scheduledValue).toBeCloseTo(0.018);
    expect(context.gains[0]?.gain.targets.at(-1)?.target).toBeCloseTo(10 ** (-14 / 20));
    expect(context.filters[0]?.frequency.scheduledValue).toBe(6_000);
    expect(context.panners[0]?.positionX.scheduledValue).toBe(4);
    expect(context.panners[0]?.positionY.scheduledValue).toBe(2);
    expect(context.panners[0]?.positionZ.scheduledValue).toBe(-3);

    bank.applySpatial3d([], { x: 4, y: 1, z: 2 }, 3.1);
    expect(context.gains.every((gain) => gain.gain.scheduledValue === 0)).toBe(true);
    expect([context.delays.length, context.gains.length, context.filters.length, context.panners.length])
      .toEqual(nodeCounts);
  });

  it("rolls back partial tap allocation and disconnects all owned nodes on disposal", () => {
    const failed = new FakeContext();
    failed.failOnCreation = 6;

    expect(() => new EarlyReflectionBank(failed as never, new FakeNode(), new FakeNode(), () => listener, true))
      .toThrow(/factory failure/i);
    expect(failed.allNodes).not.toHaveLength(0);
    expect(failed.allNodes.every((node) => node.disconnectCalls === 1)).toBe(true);

    const context = new FakeContext();
    const bank = new EarlyReflectionBank(context as never, new FakeNode(), new FakeNode(), () => listener, true);
    bank.dispose();
    bank.dispose();
    expect(context.allNodes.every((node) => node.disconnectCalls === 1)).toBe(true);
  });
});

describe("EarlyReflectionBank stable slots (#21)", () => {
  const makeBank = () => {
    const context = new FakeContext();
    let listenerPosition = listener;
    const bank = new EarlyReflectionBank(
      context as never,
      new FakeNode(),
      new FakeNode(),
      () => listenerPosition,
      true,
    );
    return { context, bank, moveListener: (next: typeof listener) => { listenerPosition = next; } };
  };

  it("keeps each path in its tap when the gain ranking swaps", () => {
    const { context, bank } = makeBank();
    bank.apply([tap(0), tap(1)], 3);
    const delayEvents = context.delays.map(({ delayTime }) => delayTime.events.length);

    // tap(1) is now louder than tap(0): ranks swap, delays are unchanged.
    bank.apply([{ ...tap(1), gainDb: -1 }, tap(0)], 3.1);

    expect(bank.slotKeys.slice(0, 2)).toEqual(["wall-0", "wall-1"]);
    expect(context.delays.map(({ delayTime }) => delayTime.events.length)).toEqual(delayEvents);
    expect(context.gains[1]?.gain.targets.at(-1)?.target).toBeCloseTo(10 ** (-1 / 20));
  });

  it("smooths the delay of a continuing path but never glides a tap to another path", () => {
    const { context, bank } = makeBank();
    const six = Array.from({ length: 6 }, (_, index) => tap(index));
    bank.apply(six, 3);

    // wall-5 leaves and wall-9 arrives; every tap is occupied, so wall-5's tap retunes.
    const replacement = { ...tap(9), delayMs: 40 };
    bank.apply([...six.slice(0, 5).map((entry) => ({ ...entry, delayMs: entry.delayMs + 0.5 })), replacement], 3.1);

    expect(bank.slotKeys).toEqual(["wall-0", "wall-1", "wall-2", "wall-3", "wall-4", "wall-9"]);
    expect(context.delays[0]?.delayTime.events.at(-1)).toEqual({
      type: "target", value: 0.0155, time: 3.1, timeConstant: 0.08,
    });
    const retuned = context.delays[5]!.delayTime.events.filter(({ time }) => time >= 3.1);
    expect(retuned).toEqual([
      { type: "cancel", time: 3.1 },
      { type: "set", value: 0.04, time: 3.12 },
    ]);
    const level = context.gains[5]!.gain.events.filter(({ time }) => time >= 3.1);
    expect(level).toEqual([
      { type: "hold", time: 3.1 },
      { type: "ramp", value: 0, time: 3.12 },
      { type: "target", value: 10 ** (-18 / 20), time: 3.12, timeConstant: 0.08 },
    ]);
  });

  it("supersedes a retune that is interrupted by another path change", () => {
    const { context, bank } = makeBank();
    const six = Array.from({ length: 6 }, (_, index) => tap(index));
    bank.apply(six, 3);
    bank.apply([...six.slice(0, 5), tap(9)], 3.1);
    const delayParam = context.delays[5]!.delayTime;
    const levelParam = context.gains[5]!.gain;
    const [delayBefore, levelBefore] = [delayParam.events.length, levelParam.events.length];

    // A second change lands while the first retune (silent at 3.12) is still pending.
    bank.apply([...six.slice(0, 5), { ...tap(10), delayMs: 50 }], 3.11);

    expect(bank.slotKeys[5]).toBe("wall-10");
    // The pending 3.12 value is cancelled and the new path is set at the new silent point.
    expect(delayParam.events.slice(delayBefore)).toEqual([
      { type: "cancel", time: 3.11 },
      { type: "set", value: 0.05, time: 3.13 },
    ]);
    expect(levelParam.events.slice(levelBefore)).toEqual([
      { type: "hold", time: 3.11 },
      { type: "ramp", value: 0, time: 3.13 },
      { type: "target", value: 10 ** (-19 / 20), time: 3.13, timeConstant: 0.08 },
    ]);
  });

  it("sets tap values directly when the context is not rendering", () => {
    const { context, bank } = makeBank();
    bank.apply([tap(0)], 3, { immediate: true });
    bank.apply([tap(1)], 3, { immediate: true });

    expect(context.gains[0]?.gain.ramps).toEqual([]);
    expect(context.gains[0]?.gain.scheduledValue).toBe(0);
    expect(context.gains[1]?.gain.scheduledValue).toBeCloseTo(10 ** (-10 / 20));
    expect(context.delays[1]?.delayTime.scheduledValue).toBeCloseTo(0.016);
    expect(context.delays.every(({ delayTime }) => delayTime.targets.length === 0)).toBe(true);
  });

  it.each([
    ["Concrete Partition", CONCRETE_PARTITION_PRESET],
    ["Stress — 100 Walls", STRESS_100_WALLS_PRESET],
  ] as const)("never glides a delay line between different paths while the listener moves (%s)", (_, preset) => {
    let rankingChanges = 0;
    for (const source of (preset as SceneSpec).sources) {
      const { context, bank, moveListener } = makeBank();
      let previousRanking: string | null = null;
      for (let step = 0; step <= 200; step += 1) {
        const scene = structuredClone(preset) as SceneSpec;
        scene.listener = {
          ...scene.listener,
          position: { x: scene.listener.position.x + step * 0.01, y: scene.listener.position.y + step * 0.005 },
        };
        const frame = computeAcousticFrame(scene).sources.find(({ sourceId }) => sourceId === source.id)!;
        const ranked = frame.earlyReflections.slice(0, 6).map(classicReflectionKey);
        if (previousRanking !== null && previousRanking !== ranked.join("|")) rankingChanges += 1;
        previousRanking = ranked.join("|");
        moveListener(scene.listener.position);
        const before = [...bank.slotKeys];
        const glideCounts = context.delays.map(({ delayTime }) => delayTime.targets.length);
        bank.apply(frame.earlyReflections, 3 + step * 0.08);
        bank.slotKeys.forEach((key, slot) => {
          // A setTargetAtTime glide on a tap's delay is only allowed for the same path.
          if (context.delays[slot]!.delayTime.targets.length > glideCounts[slot]!) {
            expect(key).toBe(before[slot]);
          }
        });
        expect(new Set(bank.slotKeys.filter((key) => key !== null))).toEqual(new Set(ranked));
      }
    }
    // The sweep must actually exercise ranking/path-set changes to be meaningful.
    expect(rankingChanges).toBeGreaterThan(0);
  });
});
