import { SourceGraph } from "@/audio/SourceGraph";
import { SchroederReverb } from "@/audio/SchroederReverb";
import {
  MASTER_FADE_SECONDS,
  SmoothedParam,
} from "@/audio/parameter-smoothing";
import type {
  AudioBufferLike,
  AudioContextLike,
  AudioParamLike,
  AudioEngineDiagnostics,
  AudioEngineStatus,
  DynamicsCompressorNodeLike,
  GainNodeLike,
  HybridDirectAudioState,
  HybridReflectionAudioState,
} from "@/audio/types";
import { AUDIO_ASSETS } from "@/domain/audio-assets/registry";
import type { PreviewMode } from "@/domain/editor/state";
import type { SceneSpec } from "@/domain/scene/types";
import type { AcousticFrame } from "@/acoustics/compute-frame";

export type AudioEngineDependencies = Readonly<{
  createContext?: () => AudioContextLike;
  fetchArrayBuffer?: (url: string) => Promise<ArrayBuffer>;
  resolveAudioAsset?: (clipId: string) => Promise<ArrayBuffer | null>;
  /** Wall-clock scheduler for deferred graph cleanup and fade waits (defaults to setTimeout). */
  schedule?: (callback: () => void, delayMs: number) => unknown;
}>;

/** Extra wall-clock margin so a fade has rendered before the next step runs. */
const FADE_WAIT_MARGIN_MS = 10;

function createBrowserAudioContext(): AudioContextLike {
  if (typeof window === "undefined") {
    throw new Error("Audio can only start in a browser after a user gesture.");
  }
  const Context = window.AudioContext;
  if (!Context) throw new Error("Web Audio is not supported by this browser.");
  return new Context() as unknown as AudioContextLike;
}

async function fetchLocalArrayBuffer(url: string): Promise<ArrayBuffer> {
  if (!url.startsWith("/audio/") || url.includes("://")) {
    throw new Error("Audio assets must use the local registry.");
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load local audio asset (${response.status}).`);
  return response.arrayBuffer();
}

const ASSET_BY_ID = new Map(AUDIO_ASSETS.map((asset) => [asset.id, asset]));

export class AudioEngine {
  private readonly createContext: () => AudioContextLike;
  private readonly fetchArrayBuffer: (url: string) => Promise<ArrayBuffer>;
  private readonly resolveAudioAsset: ((clipId: string) => Promise<ArrayBuffer | null>) | null;
  private readonly schedule: (callback: () => void, delayMs: number) => unknown;
  private readonly sourceGraphs = new Map<string, SourceGraph>();
  private readonly retiringGraphs = new Set<SourceGraph>();
  private readonly bufferCache = new Map<string, Promise<AudioBufferLike>>();
  private context: AudioContextLike | null = null;
  private masterCompressor: DynamicsCompressorNodeLike | null = null;
  private masterGain: GainNodeLike | null = null;
  private masterMuted = false;
  private listenerParams: readonly SmoothedParam[] = [];
  private simulatedReverbReturn: GainNodeLike | null = null;
  private simulatedReverbLevel: SmoothedParam | null = null;
  private schroederReverb: SchroederReverb | null = null;
  private status: AudioEngineStatus = "idle";
  private mode: PreviewMode = "raw";
  private applyCount = 0;
  private sourceStarts = 0;
  private contextCreations = 0;
  private error: string | null = null;
  private operationTail: Promise<void> = Promise.resolve();
  private desiredScene: SceneSpec | null = null;
  private latestAcousticFrame: AcousticFrame | null = null;
  private latestAcousticFrameListener: SceneSpec["listener"] | null = null;
  private hybridDirectState: HybridDirectAudioState | null = null;
  private hybridReflectionState: HybridReflectionAudioState | null = null;
  private sceneVersion = 0;
  private desiredRunning = false;
  private runIntentGeneration = 0;
  private hasSuccessfullyStarted = false;
  private disposed = false;

  constructor(dependencies: AudioEngineDependencies = {}) {
    this.createContext = dependencies.createContext ?? createBrowserAudioContext;
    this.fetchArrayBuffer = dependencies.fetchArrayBuffer ?? fetchLocalArrayBuffer;
    this.resolveAudioAsset = dependencies.resolveAudioAsset ?? null;
    this.schedule = dependencies.schedule ?? ((callback, delayMs) => setTimeout(callback, delayMs));
  }

  async start(scene: SceneSpec): Promise<void> {
    if (this.disposed) throw new Error("Audio engine has been disposed.");
    const runIntent = this.runIntentGeneration + 1;
    this.runIntentGeneration = runIntent;
    this.desiredRunning = true;
    this.requestScene(scene);
    this.status = "starting";
    this.error = null;
    const operation = this.enqueue(() => this.reconcile());
    try {
      await operation;
    } catch (error) {
      if (!this.disposed && runIntent === this.runIntentGeneration) {
        this.desiredRunning = false;
        this.recordError(error, "Audio failed to start.");
      }
      throw error;
    }
  }

  async applyScene(scene: SceneSpec): Promise<void> {
    if (this.disposed) return;
    this.requestScene(scene);
    if (
      !this.context ||
      !this.desiredRunning ||
      (!this.hasSuccessfullyStarted && this.status !== "starting")
    ) {
      return;
    }
    try {
      await this.enqueue(() => this.reconcile());
      if (!this.disposed) this.applyCount += 1;
    } catch (error) {
      this.recordError(error, "Audio scene update failed.");
      throw error;
    }
  }

  setMode(mode: PreviewMode): void {
    this.mode = mode;
    this.applyMode();
  }

  /**
   * Accepts a Classic frame for the current revision. Accepted acoustic data
   * from one engine replaces the other's held state: only one adapter is
   * mounted at a time, so the latest accepted source of truth wins.
   *
   * `lagging: true` admits a frame for an older revision that the caller has
   * verified differs from the current scene only in pose (ADR 0007). Its
   * directions are applied relative to the current listener pose.
   */
  applyAcousticFrame(frame: AcousticFrame, options: Readonly<{ lagging?: boolean }> = {}): void {
    if (this.disposed || !this.desiredScene) return;
    if (frame.revision !== this.desiredScene.revision && !options.lagging) return;
    this.latestAcousticFrame = frame;
    this.latestAcousticFrameListener = this.desiredScene.listener;
    this.hybridDirectState = null;
    this.hybridReflectionState = null;
    const context = this.context;
    const scene = this.desiredScene;
    if (!context || !scene) return;
    this.applyFrameParameters(frame, scene.listener, context);
  }

  applyHybridDirectState(state: HybridDirectAudioState): void {
    if (this.disposed) return;
    this.hybridDirectState = state;
    this.clearClassicFrame();
    const context = this.context;
    const scene = this.desiredScene;
    if (!context || !scene) return;
    this.applyHybridDirectParameters(state, scene, context);
  }

  applyHybridReflectionState(state: HybridReflectionAudioState): void {
    if (this.disposed) return;
    this.hybridReflectionState = state;
    this.clearClassicFrame();
    const context = this.context;
    const scene = this.desiredScene;
    if (!context || !scene) return;
    this.applyHybridReflectionParameters(state, scene, context);
  }

  async stop(): Promise<void> {
    this.runIntentGeneration += 1;
    this.desiredRunning = false;
    if (!this.context || this.disposed) return;
    this.status = "suspended";
    await this.enqueue(async () => {
      const context = this.context;
      if (!context || this.disposed) return;
      if (context.state === "running") {
        // Fade the master out before suspending so the output does not stop mid-cycle.
        await this.fadeMasterOut(context);
        if (this.disposed) return;
        // A newer Start intent arrived during the fade; its reconcile fades back in.
        if (this.desiredRunning) return;
      }
      if (context.state !== "closed" && context.state !== "suspended") {
        await context.suspend();
      }
      if (!this.disposed && !this.desiredRunning) this.status = "suspended";
    });
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.runIntentGeneration += 1;
    this.desiredRunning = false;
    this.desiredScene = null;
    this.sceneVersion += 1;
    this.status = "disposed";
    this.error = null;

    const graphs = [...this.sourceGraphs.values(), ...this.retiringGraphs];
    this.sourceGraphs.clear();
    this.retiringGraphs.clear();
    this.bufferCache.clear();
    const context = this.context;
    const reverb = this.schroederReverb;
    const reverbReturn = this.simulatedReverbReturn;
    const compressor = this.masterCompressor;
    const masterGain = this.masterGain;
    this.schroederReverb = null;
    this.simulatedReverbReturn = null;
    this.simulatedReverbLevel = null;
    this.masterCompressor = null;
    this.masterGain = null;
    this.context = null;

    if (context?.state === "running" && masterGain) {
      // Fade out before tearing the graph down so disposal does not click.
      await this.fadeOut(masterGain.gain, context);
    }
    for (const graph of graphs) graph.dispose();
    reverb?.dispose();
    for (const node of [reverbReturn, compressor, masterGain]) {
      try {
        node?.disconnect();
      } catch {
        // Continue terminal cleanup even if a browser node is already disconnected.
      }
    }
    if (context && context.state !== "closed") await context.close();
  }

  getDiagnostics(): AudioEngineDiagnostics {
    return {
      status: this.status,
      mode: this.mode,
      graphCount: this.sourceGraphs.size,
      sourceStarts: this.sourceStarts,
      applyCount: this.applyCount,
      contextCreations: this.contextCreations,
      sourceGraphIds: Object.fromEntries(
        [...this.sourceGraphs].map(([sourceId, graph]) => [sourceId, graph.identity]),
      ),
      error: this.error,
      acousticFallbackNotice: null,
    };
  }

  private ensureContext(): AudioContextLike {
    if (this.disposed) throw new Error("Audio engine has been disposed.");
    if (this.context) return this.context;
    const context = this.createContext();
    this.contextCreations += 1;
    let compressor: DynamicsCompressorNodeLike | null = null;
    let masterGain: GainNodeLike | null = null;
    let simulatedReverbReturn: GainNodeLike | null = null;
    let schroederReverb: SchroederReverb | null = null;
    try {
      compressor = context.createDynamicsCompressor();
      masterGain = context.createGain();
      masterGain.gain.value = 1;
      compressor.connect(masterGain);
      masterGain.connect(context.destination);
      simulatedReverbReturn = context.createGain();
      simulatedReverbReturn.gain.value = this.mode === "simulated" ? 1 : 0;
      simulatedReverbReturn.connect(compressor);
      schroederReverb = new SchroederReverb(context, simulatedReverbReturn);
    } catch (error) {
      schroederReverb?.dispose();
      try {
        simulatedReverbReturn?.disconnect();
      } catch {
        // Best-effort rollback of a context that was never committed.
      }
      try {
        compressor?.disconnect();
      } catch {
        // Best-effort rollback of a context that was never committed.
      }
      try {
        masterGain?.disconnect();
      } catch {
        // Best-effort rollback of a context that was never committed.
      }
      if (context.state !== "closed") {
        void context.close().catch(() => undefined);
      }
      throw error;
    }
    this.context = context;
    this.masterCompressor = compressor;
    this.masterGain = masterGain;
    this.masterMuted = false;
    const listener = context.listener;
    this.listenerParams = [
      listener.positionX,
      listener.positionY,
      listener.positionZ,
      listener.forwardX,
      listener.forwardY,
      listener.forwardZ,
      listener.upX,
      listener.upY,
      listener.upZ,
    ].map((parameter) => new SmoothedParam(parameter));
    this.simulatedReverbReturn = simulatedReverbReturn;
    this.simulatedReverbLevel = new SmoothedParam(simulatedReverbReturn.gain);
    this.schroederReverb = schroederReverb;
    return context;
  }

  private async syncSourceGraphs(
    scene: SceneSpec,
    version: number,
    context: AudioContextLike,
  ): Promise<boolean> {
    const output = this.masterCompressor;
    const reverbInput = this.schroederReverb?.input;
    if (!output || !reverbInput || context !== this.context) return false;

    const additions = scene.sources.filter((source) => {
      const committed = this.sourceGraphs.get(source.id);
      return !committed || !committed.matches(source);
    });
    const buffers = await Promise.all(
      additions.map((source) => this.loadBuffer(source.clipId, context)),
    );

    if (
      this.disposed ||
      !this.desiredRunning ||
      version !== this.sceneVersion ||
      context !== this.context ||
      output !== this.masterCompressor
    ) {
      return false;
    }

    const staged = new Map<string, SourceGraph>();
    try {
      for (let index = 0; index < additions.length; index += 1) {
        const source = additions[index]!;
        const graph = new SourceGraph(
          context,
          output,
          reverbInput,
          source,
          scene.listener,
          buffers[index]!,
          this.mode,
          scene.settings.hrtfEnabled,
        );
        staged.set(source.id, graph);
        this.sourceStarts += 1;
      }
    } catch (error) {
      for (const graph of staged.values()) graph.dispose();
      throw error;
    }

    if (
      this.disposed ||
      !this.desiredRunning ||
      version !== this.sceneVersion ||
      context !== this.context ||
      output !== this.masterCompressor
    ) {
      for (const graph of staged.values()) graph.dispose();
      return false;
    }

    const activeSourceIds = new Set(scene.sources.map(({ id }) => id));
    for (const [sourceId, graph] of this.sourceGraphs) {
      if (!activeSourceIds.has(sourceId) || staged.has(sourceId)) {
        this.retireGraph(graph, context);
        this.sourceGraphs.delete(sourceId);
      }
    }
    for (const [sourceId, graph] of staged) {
      this.sourceGraphs.set(sourceId, graph);
    }
    return true;
  }

  private loadBuffer(
    clipId: string,
    context: AudioContextLike,
  ): Promise<AudioBufferLike> {
    const cached = this.bufferCache.get(clipId);
    if (cached) return cached;
    const asset = ASSET_BY_ID.get(clipId);
    const data = this.resolveAudioAsset
      ? this.resolveAudioAsset(clipId).then((resolved) => {
        if (resolved) return resolved;
        if (!asset) throw new Error(`Unknown local audio asset: ${clipId}`);
        return this.fetchArrayBuffer(asset.url);
      })
      : asset
        ? this.fetchArrayBuffer(asset.url)
        : Promise.reject(new Error(`Unknown local audio asset: ${clipId}`));
    const loading = data
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        if (buffer.numberOfChannels !== 1) {
          throw new Error(`Audio asset ${clipId} must decode as mono.`);
        }
        return buffer;
      })
      .catch((error: unknown) => {
        if (this.bufferCache.get(clipId) === loading) {
          this.bufferCache.delete(clipId);
        }
        throw error;
      });
    this.bufferCache.set(clipId, loading);
    return loading;
  }

  /**
   * Scene reconcile. Authoring parameters always follow the scene. Simulation
   * parameters are never re-derived from the scene for a graph that already
   * holds accepted acoustic data; a graph without any (new source, replaced
   * clip) first takes the held accepted data, and only falls back to a
   * free-field estimate when none exists for its source.
   */
  private applySourceParameters(scene: SceneSpec, context: AudioContextLike): void {
    const now = context.currentTime;
    for (const source of scene.sources) {
      const graph = this.sourceGraphs.get(source.id);
      if (!graph) continue;
      graph.applyAuthoring(source, scene.settings.hrtfEnabled, now);
      if (graph.hasSimulation) continue;
      this.applyHeldSimulation(graph, source.id, now);
      if (!graph.hasSimulation) graph.applyFreeField(source, scene.listener, now);
    }
    if (this.latestAcousticFrame) this.schroederReverb?.apply(this.latestAcousticFrame.room, now);
  }

  private applyHeldSimulation(graph: SourceGraph, sourceId: string, now: number): void {
    const frame = this.latestAcousticFrame;
    const frameListener = this.latestAcousticFrameListener;
    const sourceFrame = frame?.sources.find((candidate) => candidate.sourceId === sourceId);
    if (sourceFrame && frameListener) {
      graph.applyFrame(sourceFrame, frameListener, now);
      return;
    }
    const direct = this.hybridDirectState;
    const directState = direct?.sourceStates[sourceId];
    if (direct && directState) graph.applySpatialDirect(directState, direct.listenerPosition, now);
    const reflections = this.hybridReflectionState;
    if (reflections) {
      graph.applySpatialReflections(
        reflections.listenerPosition,
        reflections.reflectionsBySource[sourceId] ?? [],
        now,
      );
    }
  }

  private clearClassicFrame(): void {
    this.latestAcousticFrame = null;
    this.latestAcousticFrameListener = null;
  }

  private applyHybridDirectParameters(
    state: HybridDirectAudioState,
    scene: SceneSpec,
    context: AudioContextLike,
  ): void {
    for (const source of scene.sources) {
      const sourceState = state.sourceStates[source.id];
      if (!sourceState) continue;
      this.sourceGraphs.get(source.id)?.applySpatialDirect(
        sourceState,
        state.listenerPosition,
        context.currentTime,
      );
    }
  }

  private applyHybridReflectionParameters(
    state: HybridReflectionAudioState,
    scene: SceneSpec,
    context: AudioContextLike,
  ): void {
    for (const source of scene.sources) {
      this.sourceGraphs.get(source.id)?.applySpatialReflections(
        state.listenerPosition,
        state.reflectionsBySource[source.id] ?? [],
        context.currentTime,
      );
    }
  }

  private applyFrameParameters(
    frame: AcousticFrame,
    listener: SceneSpec["listener"],
    context: AudioContextLike,
  ): void {
    this.schroederReverb?.apply(frame.room, context.currentTime);
    for (const sourceFrame of frame.sources) {
      this.sourceGraphs.get(sourceFrame.sourceId)?.applyFrame(
        sourceFrame,
        listener,
        context.currentTime,
      );
    }
  }

  private applyListener(scene: SceneSpec, context: AudioContextLike): void {
    const now = context.currentTime;
    const headingRad = (scene.listener.headingDeg * Math.PI) / 180;
    // Positions are listener-relative, so the listener stays at the origin.
    const values = [0, 0, 0, Math.sin(headingRad), 0, -Math.cos(headingRad), 0, 1, 0];
    this.listenerParams.forEach((parameter, index) => parameter.smooth(values[index]!, now));
  }

  private retireGraph(graph: SourceGraph, context: AudioContextLike): void {
    if (context.state !== "running") {
      // A suspended clock never reaches a fade's end; nothing is audible anyway.
      graph.dispose();
      return;
    }
    const now = context.currentTime;
    const releasedAt = graph.retire(now);
    this.retiringGraphs.add(graph);
    this.schedule(() => {
      if (!this.retiringGraphs.delete(graph)) return;
      graph.dispose();
    }, Math.max(0, (releasedAt - now) * 1000) + FADE_WAIT_MARGIN_MS);
  }

  private async fadeMasterOut(context: AudioContextLike): Promise<void> {
    const masterGain = this.masterGain;
    if (!masterGain) return;
    this.masterMuted = true;
    await this.fadeOut(masterGain.gain, context);
  }

  private fadeMasterIn(context: AudioContextLike): void {
    const masterGain = this.masterGain;
    if (!masterGain || !this.masterMuted) return;
    this.masterMuted = false;
    const now = context.currentTime;
    masterGain.gain.cancelAndHoldAtTime(now);
    masterGain.gain.linearRampToValueAtTime(1, now + MASTER_FADE_SECONDS);
  }

  private fadeOut(parameter: AudioParamLike, context: AudioContextLike): Promise<void> {
    const now = context.currentTime;
    parameter.cancelAndHoldAtTime(now);
    parameter.linearRampToValueAtTime(0, now + MASTER_FADE_SECONDS);
    return new Promise((resolve) => {
      this.schedule(resolve, MASTER_FADE_SECONDS * 1000 + FADE_WAIT_MARGIN_MS);
    });
  }

  private applyMode(): void {
    if (!this.context) return;
    this.simulatedReverbLevel?.smooth(this.mode === "simulated" ? 1 : 0, this.context.currentTime);
    for (const graph of this.sourceGraphs.values()) {
      graph.applyMode(this.mode, this.context.currentTime);
    }
  }

  private requestScene(scene: SceneSpec): void {
    this.desiredScene = scene;
    this.sceneVersion += 1;
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    const scheduled = this.operationTail.then(operation);
    this.operationTail = scheduled.catch(() => undefined);
    return scheduled;
  }

  private async reconcile(): Promise<void> {
    while (!this.disposed) {
      if (!this.desiredRunning) {
        if (this.context) this.status = "suspended";
        return;
      }
      const scene = this.desiredScene;
      if (!scene) return;
      const version = this.sceneVersion;
      const context = this.ensureContext();
      const committed = await this.syncSourceGraphs(scene, version, context);
      if (this.disposed) return;
      if (!this.desiredRunning) {
        this.status = "suspended";
        return;
      }
      if (!committed || version !== this.sceneVersion) continue;

      this.applyListener(scene, context);
      this.applySourceParameters(scene, context);
      this.applyMode();
      this.error = null;

      if (!this.desiredRunning) {
        this.status = "suspended";
        return;
      }
      if (context.state !== "running") await context.resume();
      if (this.disposed) return;
      if (!this.desiredRunning) {
        this.status = "suspended";
        return;
      }
      this.fadeMasterIn(context);
      if (version !== this.sceneVersion) continue;
      this.status = "running";
      this.hasSuccessfullyStarted = true;
      return;
    }
  }

  private recordError(error: unknown, fallback: string): void {
    if (this.disposed) return;
    this.status = "error";
    this.error = error instanceof Error ? error.message : fallback;
  }
}
