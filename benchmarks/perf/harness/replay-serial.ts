import {
  assembleAcousticFrame,
  computeClassicSourceResults,
  createClassicPoseSnapshot,
  createClassicStaticContext,
  type AcousticFrame,
} from "@/acoustics/compute-frame";
import { acousticUpdateIntervalMs } from "@/acoustics/update-rate";
import {
  createHybridGeometryCompiler,
  hybridStaticGeometryHash,
  type HybridStaticGeometry,
} from "@/acoustics/hybrid3d/compile";
import type { SceneDocumentV2 } from "@/domain/scene-document/types";
import {
  assembleHybridDirectFrame,
  computeHybridDirectSources,
  createHybridDirectPoseSnapshot,
  type HybridDirectFrame,
} from "@/acoustics/hybrid3d/direct";
import { estimateRoomAcoustics } from "@/acoustics/room-acoustics";

import {
  createClassicStepBuilder,
  createHybridStepBuilder,
  type ClassicTapeInput,
  type HybridTapeInput,
  type TapeEvent,
} from "./tape";

export const WARM_JOBS = 100;
export const WARM_MS = 5000;

/** Warm means both 100 jobs and 5 s have passed in this process (plan section 4.1). */
export function isWarm(jobsBefore: number, elapsedMs: number): boolean {
  return jobsBefore >= WARM_JOBS && elapsedMs >= WARM_MS;
}

export type SerialPhase =
  | "static.build"
  | "static.compile"
  | "pose.snapshot"
  | "room.estimate"
  | "solve"
  | "assemble"
  | "job.total";

export type SerialRecord = {
  requestSeq: number;
  tapeStep: number;
  sceneRevision: number;
  staticFingerprint: string;
  phase: SerialPhase;
  duration: number;
  warm: boolean;
  /** static-install when the static fingerprint differs from the previous job in this process, or for the first job. */
  jobKind: "pose-only" | "static-install";
};

export type ParityStep =
  | { step: number; event: string; staticFingerprint: string; frame: AcousticFrame }
  | {
      step: number;
      event: string;
      staticGeometryHash: string;
      classicProjectionHash: string;
      frame: HybridDirectFrame;
    };

export type SerialReplayOptions = {
  input: { mode: "classic"; tape: ClassicTapeInput } | { mode: "hybrid"; tape: HybridTapeInput };
  repeat: number;
  /** Closed loop paced to the scene's own update interval, so idle and GC behaviour match TS-W. */
  paced: boolean;
  /** Parity mode: keeps the frames of the first replay, stamps timestamps 0, and records no timing. */
  collectFrames: boolean;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  /** Test seam: the compiler's static compile function, to count real static compiles. */
  compileStatic?: (document: SceneDocumentV2) => HybridStaticGeometry;
};

export type SerialReplayResult = {
  records: SerialRecord[];
  steps: ParityStep[];
  jobs: number;
  intervalMs: number;
  startedAtMs: number;
  endedAtMs: number;
  /** Sum of frame revisions, so the solver's results stay observable without retaining frames. */
  checksum: number;
};

type Timer = () => number;

function classicJob(
  scene: ClassicTapeInput["scene"],
  now: Timer,
  generatedAtMs: number,
): { frame: AcousticFrame; staticFingerprint: string; phases: [SerialPhase, number][] } {
  const t0 = now();
  const context = createClassicStaticContext(scene);
  const t1 = now();
  const snapshot = createClassicPoseSnapshot(scene, context);
  const t2 = now();
  const room = estimateRoomAcoustics(scene);
  const t3 = now();
  const results = computeClassicSourceResults(
    context,
    snapshot,
    snapshot.sources.map(({ id }) => id),
  );
  const t4 = now();
  const frame = assembleAcousticFrame(snapshot, room, results, generatedAtMs);
  const t5 = now();
  return {
    frame,
    staticFingerprint: context.fingerprint,
    phases: [
      ["static.build", t1 - t0],
      ["pose.snapshot", t2 - t1],
      ["room.estimate", t3 - t2],
      ["solve", t4 - t3],
      ["assemble", t5 - t4],
      ["job.total", t5 - t0],
    ],
  };
}

function hybridJob(
  document: HybridTapeInput["document"],
  compiler: ReturnType<typeof createHybridGeometryCompiler>,
  now: Timer,
  computedAtMs: number,
): { frame: HybridDirectFrame; staticFingerprint: string; phases: [SerialPhase, number][] } {
  const t0 = now();
  const geometry = compiler.compile(document);
  const t1 = now();
  const snapshot = createHybridDirectPoseSnapshot(geometry);
  const t2 = now();
  const results = computeHybridDirectSources(
    snapshot,
    geometry.bvh,
    snapshot.sources.map(({ id }) => id),
  );
  const t3 = now();
  const frame = assembleHybridDirectFrame(snapshot, results, computedAtMs);
  const t4 = now();
  return {
    frame,
    staticFingerprint: snapshot.staticFingerprint,
    phases: [
      ["static.compile", t1 - t0],
      ["pose.snapshot", t2 - t1],
      ["solve", t3 - t2],
      ["assemble", t4 - t3],
      ["job.total", t4 - t0],
    ],
  };
}

export async function replayTapeSerial(options: SerialReplayOptions): Promise<SerialReplayResult> {
  const { input, now } = options;
  const events: readonly TapeEvent[] = input.tape.events;
  const settings = input.mode === "classic" ? input.tape.scene.settings : input.tape.document.baseScene.settings;
  const intervalMs = acousticUpdateIntervalMs(settings.acousticUpdateHz);
  const replays = options.collectFrames ? 1 : options.repeat;
  const records: SerialRecord[] = [];
  const steps: ParityStep[] = [];
  const stamp = options.collectFrames ? 0 : Date.now();
  let jobs = 0;
  let checksum = 0;
  let nextAllowedMs = 0;
  let previousFingerprint: string | null = null;
  let firstJobMs = 0;
  const startedAtMs = now();
  // Production keeps one geometry compiler for the whole session, so a pose-only replay
  // compiles static geometry once per process, not once per replay.
  const compiler = createHybridGeometryCompiler(options.compileStatic);

  try {
    for (let replay = 0; replay < replays; replay += 1) {
      const revisionOffset = replay * events.length;
      const buildClassic = input.mode === "classic" ? createClassicStepBuilder(input.tape, revisionOffset) : null;
      const buildHybrid = input.mode === "hybrid" ? createHybridStepBuilder(input.tape, revisionOffset) : null;

      for (const event of events) {
        const classicStep = buildClassic ? buildClassic(event) : null;
        const hybridStep = buildHybrid ? buildHybrid(event) : null;
        if (options.paced) {
          const waitMs = nextAllowedMs - now();
          if (waitMs > 0) await options.sleep(waitMs);
        }
        const jobStartMs = now();
        if (jobs === 0) firstJobMs = jobStartMs;
        nextAllowedMs = jobStartMs + intervalMs;
        const warm = isWarm(jobs, jobStartMs - firstJobMs);
        const requestSeq = jobs + 1;

        const done = classicStep
          ? classicJob(classicStep.scene, now, stamp)
          : hybridJob(hybridStep!.document, compiler, now, stamp);
        const tapeStep = (classicStep ?? hybridStep)!.step;
        const sceneRevision = done.frame.revision;
        const jobKind = done.staticFingerprint === previousFingerprint ? "pose-only" : "static-install";
        previousFingerprint = done.staticFingerprint;
        checksum += sceneRevision;
        jobs += 1;

        if (options.collectFrames) {
          if (classicStep) {
            steps.push({
              step: tapeStep,
              event: event.type,
              staticFingerprint: done.staticFingerprint,
              frame: done.frame as AcousticFrame,
            });
          } else {
            const document = hybridStep!.document;
            steps.push({
              step: tapeStep,
              event: event.type,
              staticGeometryHash: hybridStaticGeometryHash(document),
              classicProjectionHash: document.compatibility.classicProjectionHash,
              frame: done.frame as HybridDirectFrame,
            });
          }
          continue;
        }
        for (const [phase, duration] of done.phases) {
          records.push({
            requestSeq,
            tapeStep,
            sceneRevision,
            staticFingerprint: done.staticFingerprint,
            phase,
            duration,
            warm,
            jobKind,
          });
        }
      }
    }
  } catch (error) {
    // Samples of the jobs that finished stay on disk with the failed run.
    throw Object.assign(error instanceof Error ? error : new Error(String(error)), { partial: { records, jobs } });
  }
  return { records, steps, jobs, intervalMs, startedAtMs, endedAtMs: now(), checksum };
}
