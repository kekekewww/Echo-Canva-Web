import { dbToLinear, distanceAttenuation, equalPowerCrossfade } from "@/audio/math";
import { EarlyReflectionBank } from "@/audio/EarlyReflectionBank";
import {
  MODE_CROSSFADE_SECONDS,
  SOURCE_FADE_IN_SECONDS,
  SOURCE_FADE_OUT_SECONDS,
  SmoothedParam,
  scheduleEqualPowerCrossfade,
} from "@/audio/parameter-smoothing";
import type {
  AudioBufferLike,
  AudioBufferSourceNodeLike,
  BiquadFilterNodeLike,
  AudioContextLike,
  AudioNodeLike,
  GainNodeLike,
  PannerNodeLike,
  HybridEarlyReflectionTap,
  HybridDirectSourceAudioState,
} from "@/audio/types";
import type { PreviewMode } from "@/domain/editor/state";
import type { SceneSpec } from "@/domain/scene/types";
import type { AcousticFrameSource } from "@/acoustics/compute-frame";

let nextGraphIdentity = 1;
const HALF_PI = Math.PI * 0.5;
/** Reflection taps can hold up to 0.2 s of delayed signal after the source fades out. */
const RETIRE_TAIL_SECONDS = 0.25;

type SceneSource = SceneSpec["sources"][number];
type SceneListener = SceneSpec["listener"];

/**
 * One persistent native-node graph per source.
 *
 * Parameters have two owners. Authoring parameters (`source.gainDb`, panning
 * model) follow the scene on every reconcile. Simulation parameters (distance
 * gain, obstruction filter, panner position, reverb send, reflection taps) are
 * written only from accepted acoustic data; between accepted frames they hold
 * their last accepted targets. A graph that has never received acoustic data
 * follows a free-field estimate of the scene pose until it does.
 */
export class SourceGraph {
  readonly identity = nextGraphIdentity++;
  readonly sourceId: string;
  private readonly context: AudioContextLike;
  private readonly sourceNode: AudioBufferSourceNodeLike;
  private readonly envelope: GainNodeLike;
  private readonly sourceGain: GainNodeLike;
  private readonly distanceGain: GainNodeLike;
  private readonly lowPass: BiquadFilterNodeLike;
  private readonly rawModeGain: GainNodeLike;
  private readonly simulatedModeGain: GainNodeLike;
  private readonly panner: PannerNodeLike;
  private readonly reverbSend: GainNodeLike;
  private readonly earlyReflectionBank: EarlyReflectionBank;
  private readonly authoredGain: SmoothedParam;
  private readonly directGain: SmoothedParam;
  private readonly directLowpass: SmoothedParam;
  private readonly directX: SmoothedParam;
  private readonly directY: SmoothedParam;
  private readonly directZ: SmoothedParam;
  private readonly reverbLevel: SmoothedParam;
  private listenerPosition: SceneListener["position"];
  private readonly clipId: string;
  private readonly loop: boolean;
  private mode: PreviewMode;
  private hrtfEnabled: boolean;
  private modeTransition: Readonly<{
    fromAngleRad: number;
    startTime: number;
    toAngleRad: number;
  }> | null = null;
  private simulationApplied = false;
  private retiredUntil: number | null = null;
  private sourceStopped = false;
  private disposed = false;

  constructor(
    context: AudioContextLike,
    output: AudioNodeLike,
    reverbInput: AudioNodeLike,
    source: SceneSource,
    listener: SceneListener,
    buffer: AudioBufferLike,
    mode: PreviewMode,
    hrtfEnabled: boolean,
  ) {
    this.context = context;
    this.sourceId = source.id;
    this.clipId = source.clipId;
    this.loop = source.loop;
    this.mode = mode;
    this.hrtfEnabled = hrtfEnabled;
    this.listenerPosition = listener.position;

    const createdNodes: AudioNodeLike[] = [];
    let sourceNode: AudioBufferSourceNodeLike | null = null;
    let earlyReflectionBank: EarlyReflectionBank | null = null;
    let started = false;
    try {
      sourceNode = context.createBufferSource();
      createdNodes.push(sourceNode);
      const envelope = context.createGain();
      createdNodes.push(envelope);
      const sourceGain = context.createGain();
      createdNodes.push(sourceGain);
      const distanceGain = context.createGain();
      createdNodes.push(distanceGain);
      const lowPass = context.createBiquadFilter();
      createdNodes.push(lowPass);
      const rawModeGain = context.createGain();
      createdNodes.push(rawModeGain);
      const simulatedModeGain = context.createGain();
      createdNodes.push(simulatedModeGain);
      const panner = context.createPanner();
      createdNodes.push(panner);
      const reverbSend = context.createGain();
      createdNodes.push(reverbSend);

      this.sourceNode = sourceNode;
      this.envelope = envelope;
      this.sourceGain = sourceGain;
      this.distanceGain = distanceGain;
      this.lowPass = lowPass;
      this.rawModeGain = rawModeGain;
      this.simulatedModeGain = simulatedModeGain;
      this.panner = panner;
      this.reverbSend = reverbSend;
      this.authoredGain = new SmoothedParam(sourceGain.gain);
      this.directGain = new SmoothedParam(distanceGain.gain);
      this.directLowpass = new SmoothedParam(lowPass.frequency);
      this.directX = new SmoothedParam(panner.positionX);
      this.directY = new SmoothedParam(panner.positionY);
      this.directZ = new SmoothedParam(panner.positionZ);
      this.reverbLevel = new SmoothedParam(reverbSend.gain);

      panner.panningModel = hrtfEnabled ? "HRTF" : "equalpower";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.maxDistance = 50;
      panner.rolloffFactor = 0;
      lowPass.type = "lowpass";
      lowPass.frequency.value = 20_000;
      reverbSend.gain.value = dbToLinear(-12);
      envelope.gain.value = 0;

      sourceNode.buffer = buffer;
      sourceNode.loop = source.loop;
      sourceNode.connect(envelope);
      envelope.connect(sourceGain);
      sourceGain.connect(rawModeGain);
      rawModeGain.connect(output);
      sourceGain.connect(distanceGain);
      distanceGain.connect(lowPass);
      lowPass.connect(panner);
      panner.connect(simulatedModeGain);
      simulatedModeGain.connect(output);
      simulatedModeGain.connect(reverbSend);
      reverbSend.connect(reverbInput);
      earlyReflectionBank = new EarlyReflectionBank(
        context,
        sourceGain,
        simulatedModeGain,
        () => this.listenerPosition,
        hrtfEnabled,
      );
      this.earlyReflectionBank = earlyReflectionBank;

      this.initializeParameters(source, listener, mode);
      const now = context.currentTime;
      sourceNode.start();
      started = true;
      // Fade the source in instead of starting the waveform at full level.
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(1, now + SOURCE_FADE_IN_SECONDS);
    } catch (error) {
      earlyReflectionBank?.dispose();
      if (started && sourceNode) {
        try {
          sourceNode.stop();
        } catch {
          // Best-effort rollback for a partially constructed browser graph.
        }
      }
      for (const node of createdNodes.reverse()) {
        try {
          node.disconnect();
        } catch {
          // Best-effort rollback for a partially constructed browser graph.
        }
      }
      throw error;
    }
  }

  matches(source: SceneSource): boolean {
    return source.clipId === this.clipId && source.loop === this.loop;
  }

  /** True once accepted acoustic data has driven this graph's simulation parameters. */
  get hasSimulation(): boolean {
    return this.simulationApplied;
  }

  /** Reflection path keys by tap index, for diagnostics and tests. */
  get reflectionSlotKeys(): readonly (string | null)[] {
    return this.earlyReflectionBank.slotKeys;
  }

  /** Scene-owned parameters: applied on every reconcile in every mode. */
  applyAuthoring(source: SceneSource, hrtfEnabled: boolean, now: number): void {
    if (this.disposed || this.retiredUntil !== null) return;
    this.authoredGain.smooth(dbToLinear(source.gainDb), now);
    if (hrtfEnabled !== this.hrtfEnabled) {
      this.hrtfEnabled = hrtfEnabled;
      this.panner.panningModel = hrtfEnabled ? "HRTF" : "equalpower";
    }
    this.earlyReflectionBank.setHrtfEnabled(hrtfEnabled);
  }

  /**
   * Free-field estimate for a graph that has never received acoustic data.
   * Once a frame or Hybrid state has been applied this is a no-op, so the
   * last accepted occlusion/Portal state holds between frames instead of
   * snapping back to an unobstructed estimate.
   */
  applyFreeField(source: SceneSource, listener: SceneListener, now: number): void {
    if (this.disposed || this.retiredUntil !== null || this.simulationApplied) return;
    this.listenerPosition = listener.position;
    const distanceM = Math.hypot(
      source.position.x - listener.position.x,
      source.position.y - listener.position.y,
    );
    this.directGain.smooth(distanceAttenuation(distanceM), now);
    this.directX.smooth(source.position.x - listener.position.x, now);
    this.directY.smooth(0, now);
    this.directZ.smooth(-(source.position.y - listener.position.y), now);
  }

  applyMode(mode: PreviewMode, now: number): void {
    if (this.disposed || mode === this.mode) return;
    const toAngleRad = mode === "simulated" ? HALF_PI : 0;
    const fromAngleRad = this.currentModeAngle(now);
    scheduleEqualPowerCrossfade(
      this.rawModeGain.gain,
      this.simulatedModeGain.gain,
      fromAngleRad,
      toAngleRad,
      now,
    );
    this.mode = mode;
    this.modeTransition = { fromAngleRad, startTime: now, toAngleRad };
  }

  applyFrame(sourceFrame: AcousticFrameSource, listener: SceneListener, now: number): void {
    if (this.disposed || this.retiredUntil !== null) return;
    this.simulationApplied = true;
    this.listenerPosition = listener.position;
    this.directGain.smooth(
      dbToLinear(sourceFrame.dryGainDb) * distanceAttenuation(sourceFrame.effectiveDistanceM),
      now,
    );
    this.directLowpass.smooth(sourceFrame.lowpassHz, now);
    this.directX.smooth(sourceFrame.virtualPosition.x - listener.position.x, now);
    this.directY.smooth(0, now);
    this.directZ.smooth(-(sourceFrame.virtualPosition.y - listener.position.y), now);
    this.reverbLevel.smooth(dbToLinear(sourceFrame.reverbSendDb), now);
    this.earlyReflectionBank.apply(sourceFrame.earlyReflections, now, this.tapOptions());
  }

  applySpatialDirect(
    sourceState: HybridDirectSourceAudioState,
    listenerPosition: Readonly<{ x: number; y: number; z: number }>,
    now: number,
  ): void {
    if (this.disposed || this.retiredUntil !== null) return;
    this.simulationApplied = true;
    const sourcePosition = sourceState.position;
    const relativeX = sourcePosition.x - listenerPosition.x;
    const relativeY = sourcePosition.y - listenerPosition.y;
    const relativeZ = sourcePosition.z - listenerPosition.z;
    this.directGain.smooth(
      dbToLinear(sourceState.dryGainDb) * distanceAttenuation(sourceState.effectiveDistanceM),
      now,
    );
    this.directLowpass.smooth(sourceState.lowpassHz, now);
    this.directX.smooth(relativeX, now);
    this.directY.smooth(relativeY, now);
    this.directZ.smooth(relativeZ === 0 ? 0 : -relativeZ, now);
  }

  applySpatialReflections(
    listenerPosition: Readonly<{ x: number; y: number; z: number }>,
    reflections: readonly HybridEarlyReflectionTap[],
    now: number,
  ): void {
    if (this.disposed || this.retiredUntil !== null) return;
    this.simulationApplied = true;
    this.earlyReflectionBank.applySpatial3d(reflections, listenerPosition, now, this.tapOptions());
  }

  /**
   * Fades the source out, stops it at the end of the fade, and returns the
   * audio-clock time after which `dispose` can disconnect without cutting the
   * reflection-tap tail. Idempotent.
   */
  retire(now: number): number {
    if (this.disposed) return now;
    if (this.retiredUntil !== null) return this.retiredUntil;
    const fadeEnd = now + SOURCE_FADE_OUT_SECONDS;
    const level = this.envelope.gain;
    level.cancelAndHoldAtTime(now);
    level.linearRampToValueAtTime(0, fadeEnd);
    try {
      this.sourceNode.stop(fadeEnd);
      this.sourceStopped = true;
    } catch {
      // A browser can reject stop after a failed or already-ended source.
    }
    this.retiredUntil = fadeEnd + RETIRE_TAIL_SECONDS;
    return this.retiredUntil;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (!this.sourceStopped) {
      try {
        this.sourceNode.stop();
      } catch {
        // A browser can reject stop after a failed or already-ended source.
      }
      this.sourceStopped = true;
    }
    for (const node of [
      this.sourceNode,
      this.envelope,
      this.sourceGain,
      this.distanceGain,
      this.lowPass,
      this.panner,
      this.reverbSend,
      this.rawModeGain,
      this.simulatedModeGain,
    ]) {
      try {
        node.disconnect();
      } catch {
        // Disconnect is best-effort during terminal cleanup.
      }
    }
    this.earlyReflectionBank.dispose();
  }

  private tapOptions(): Readonly<{ immediate: boolean }> {
    // A suspended context does not advance its clock, so fades would never
    // complete; set tap values directly and let the master fade cover resume.
    return { immediate: this.context.state !== "running" };
  }

  private initializeParameters(
    source: SceneSource,
    listener: SceneListener,
    mode: PreviewMode,
  ): void {
    const distanceM = Math.hypot(
      source.position.x - listener.position.x,
      source.position.y - listener.position.y,
    );
    const coefficients = equalPowerCrossfade(mode === "simulated" ? 1 : 0);
    this.sourceGain.gain.value = dbToLinear(source.gainDb);
    this.distanceGain.gain.value = distanceAttenuation(distanceM);
    this.panner.positionX.value = source.position.x - listener.position.x;
    this.panner.positionY.value = 0;
    this.panner.positionZ.value = -(source.position.y - listener.position.y);
    this.rawModeGain.gain.value = coefficients.raw;
    this.simulatedModeGain.gain.value = coefficients.simulated;
  }

  private currentModeAngle(now: number): number {
    const transition = this.modeTransition;
    if (!transition) return this.mode === "simulated" ? HALF_PI : 0;
    const progress = Math.min(
      1,
      Math.max(0, (now - transition.startTime) / MODE_CROSSFADE_SECONDS),
    );
    return transition.fromAngleRad +
      (transition.toAngleRad - transition.fromAngleRad) * progress;
  }
}
