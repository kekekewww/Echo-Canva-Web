import { describe, expect, it } from "vitest";

import { computeAcousticFrame, createClassicStaticContext } from "@/acoustics/compute-frame";
import {
  AcousticFrameClient,
  acceptsClassicWorkerFrame,
  holdsClassicFrame,
} from "@/hooks/useAcousticFrame";
import type { AcousticWorkerRequest, AcousticWorkerResponse } from "@/workers/acoustics.worker";
import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import type { SceneSpec } from "@/domain/scene/types";

class FakeTimers {
  private nextId = 1;
  private readonly callbacks = new Map<number, () => void>();

  schedule = (callback: () => void): number => {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  };

  cancel = (id: number): void => {
    this.callbacks.delete(id);
  };

  flush(): void {
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    callbacks.forEach((callback) => callback());
  }
}

class FakeWorker {
  readonly posted: AcousticWorkerRequest[] = [];
  onerror: ((event: ErrorEvent) => unknown) | null = null;
  onmessage: ((event: MessageEvent<AcousticWorkerResponse>) => void) | null = null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null;
  terminateCalls = 0;

  postMessage(message: AcousticWorkerRequest): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminateCalls += 1;
  }
}

class FakeTimeline {
  nowMs = 0;
  private nextId = 1;
  private readonly tasks = new Map<number, { callback: () => void; dueMs: number }>();

  schedule = (callback: () => void, delayMs = 0): number => {
    const id = this.nextId++;
    this.tasks.set(id, { callback, dueMs: this.nowMs + delayMs });
    return id;
  };

  cancel = (id: number): void => {
    this.tasks.delete(id);
  };

  advance(ms: number): void {
    this.nowMs += ms;
    while (true) {
      const task = [...this.tasks.entries()]
        .filter(([, candidate]) => candidate.dueMs <= this.nowMs)
        .sort(([, left], [, right]) => left.dueMs - right.dueMs)[0];
      if (!task) return;
      this.tasks.delete(task[0]);
      task[1].callback();
    }
  }
}

function sceneAt(revision: number): SceneSpec {
  const scene = structuredClone(CONCRETE_PARTITION_PRESET);
  scene.revision = revision;
  return scene;
}

describe("AcousticFrameClient", () => {
  it("forwards the Worker compute duration with the frame", () => {
    const timers = new FakeTimers();
    const worker = new FakeWorker();
    const received: unknown[] = [];
    const client = new AcousticFrameClient({
      cancel: (timer) => timers.cancel(timer as number),
      cancelFrame: (frame) => timers.cancel(frame as number),
      createWorker: () => worker,
      onFallback: () => undefined,
      onFrame: (_, metrics) => received.push(metrics),
      schedule: timers.schedule,
      scheduleFrame: timers.schedule,
    });
    const scene = sceneAt(59);

    client.start(scene);
    worker.onmessage?.({
      data: {
        type: "FRAME",
        revision: scene.revision,
        frame: computeAcousticFrame(scene),
        metrics: {
          computeMs: 3.25,
          completedAtMs: 40,
          workerCount: 2,
          sourceComputeMsMax: 2.5,
          sourceComputeMsTotal: 4.5,
        },
      },
    } as MessageEvent<AcousticWorkerResponse>);

    expect(received).toEqual([{
      source: "worker",
      computeMs: 3.25,
      workerCount: 2,
      sourceComputeMsMax: 2.5,
      sourceComputeMsTotal: 4.5,
    }]);
  });

  it("rate-limits and coalesces fallback computations across a drag timeline", () => {
    const timeline = new FakeTimeline();
    const fallbackRevisions: number[] = [];
    const fallbackMetrics: unknown[] = [];
    const client = new AcousticFrameClient({
      cancel: (timer) => timeline.cancel(timer as number),
      cancelFrame: (frame) => timeline.cancel(frame as number),
      createWorker: () => {
        throw new Error("Worker unavailable");
      },
      onFallback: (frame, metrics) => {
        fallbackRevisions.push(frame.revision);
        fallbackMetrics.push(metrics);
      },
      onFrame: () => undefined,
      schedule: timeline.schedule,
      scheduleFrame: timeline.schedule,
      now: () => timeline.nowMs,
    });
    const initial = sceneAt(60);
    initial.settings.acousticUpdateHz = 10;
    const intermediate = sceneAt(61);
    intermediate.settings.acousticUpdateHz = 10;
    const latest = sceneAt(62);
    latest.settings.acousticUpdateHz = 10;

    client.start(initial);
    client.updateScene(intermediate);
    client.updateScene(latest);
    expect(fallbackRevisions).toEqual([60]);

    timeline.advance(99);
    expect(fallbackRevisions).toEqual([60]);
    timeline.advance(1);
    expect(fallbackRevisions).toEqual([60, 62]);
    expect(fallbackMetrics).toEqual([
      {
        source: "fallback",
        computeMs: 0,
        requestSequence: 1,
        workerCount: 0,
        sourceComputeMsMax: 0,
        sourceComputeMsTotal: 0,
      },
      {
        source: "fallback",
        computeMs: 0,
        requestSequence: 2,
        workerCount: 0,
        sourceComputeMsMax: 0,
        sourceComputeMsTotal: 0,
      },
    ]);
  });

  it("posts only the newest client-side scene revision from a burst", () => {
    const timers = new FakeTimers();
    const frameTimers = new FakeTimers();
    const worker = new FakeWorker();
    const client = new AcousticFrameClient({
      cancel: (timer) => timers.cancel(timer as number),
      cancelFrame: (frame) => frameTimers.cancel(frame as number),
      createWorker: () => worker,
      onFallback: () => undefined,
      onFrame: () => undefined,
      schedule: timers.schedule,
      scheduleFrame: frameTimers.schedule,
    });

    client.start(sceneAt(40));
    client.updateScene(sceneAt(41));
    client.updateScene(sceneAt(42));
    timers.flush();
    frameTimers.flush();

    expect(worker.posted).toEqual([{ type: "UPDATE_SCENE", scene: sceneAt(42) }]);
  });

  it("retains the newest scene when a later pointer update follows the settle callback", () => {
    const timers = new FakeTimers();
    const frameTimers = new FakeTimers();
    const worker = new FakeWorker();
    const client = new AcousticFrameClient({
      cancel: (timer) => timers.cancel(timer as number),
      cancelFrame: (frame) => frameTimers.cancel(frame as number),
      createWorker: () => worker,
      onFallback: () => undefined,
      onFrame: () => undefined,
      schedule: timers.schedule,
      scheduleFrame: frameTimers.schedule,
    });

    client.start(sceneAt(43));
    client.updateScene(sceneAt(44));
    timers.flush();
    client.updateScene(sceneAt(45));

    expect(worker.posted).toEqual([]);
    frameTimers.flush();
    expect(worker.posted).toEqual([{ type: "UPDATE_SCENE", scene: sceneAt(45) }]);
  });

  it.each(["unavailable", "onerror", "onmessageerror"])(
    "falls back deterministically when Worker is %s",
    (failureMode) => {
      const timers = new FakeTimers();
      const fallbackRevisions: number[] = [];
      const worker = new FakeWorker();
      const client = new AcousticFrameClient({
        cancel: (timer) => timers.cancel(timer as number),
        cancelFrame: (frame) => timers.cancel(frame as number),
        createWorker: () => {
          if (failureMode === "unavailable") throw new Error("Worker unavailable");
          return worker;
        },
        onFallback: (frame) => fallbackRevisions.push(frame.revision),
        onFrame: () => undefined,
        schedule: timers.schedule,
        scheduleFrame: timers.schedule,
      });

      client.start(sceneAt(50));
      if (failureMode === "onerror") worker.onerror?.(new Event("error") as ErrorEvent);
      if (failureMode === "onmessageerror") worker.onmessageerror?.(new MessageEvent("messageerror"));

      expect(fallbackRevisions).toEqual([50]);
      expect(worker.terminateCalls).toBe(failureMode === "unavailable" ? 0 : 1);
    },
  );
});

describe("Classic frame acceptance under continuous edits (ADR 0008)", () => {
  it("forwards the Worker static fingerprint with the frame", () => {
    const timers = new FakeTimers();
    const worker = new FakeWorker();
    const fingerprints: (string | undefined)[] = [];
    const client = new AcousticFrameClient({
      cancel: (timer) => timers.cancel(timer as number),
      cancelFrame: (frame) => timers.cancel(frame as number),
      createWorker: () => worker,
      onFallback: () => undefined,
      onFrame: (_, __, staticFingerprint) => fingerprints.push(staticFingerprint),
      schedule: timers.schedule,
      scheduleFrame: timers.schedule,
    });
    const scene = sceneAt(70);
    client.start(scene);
    worker.onmessage?.({
      data: {
        type: "FRAME",
        revision: scene.revision,
        frame: computeAcousticFrame(scene),
        staticFingerprint: "abc123",
        metrics: { computeMs: 1, completedAtMs: 1 },
      },
    } as MessageEvent<AcousticWorkerResponse>);

    expect(fingerprints).toEqual(["abc123"]);
  });

  it("accepts a pose-lagging frame and rejects a structure-stale one", () => {
    const frame = computeAcousticFrame(sceneAt(80));
    const fingerprint = createClassicStaticContext(sceneAt(80)).fingerprint;
    const moved = sceneAt(83);
    moved.listener = { ...moved.listener, position: { x: 3.4, y: 4 } };
    const closed = sceneAt(83);
    closed.portals[0]!.open = false;

    expect(acceptsClassicWorkerFrame(frame, fingerprint, sceneAt(80))).toBe(true);
    expect(acceptsClassicWorkerFrame(frame, fingerprint, moved)).toBe(true);
    expect(acceptsClassicWorkerFrame(frame, undefined, moved)).toBe(false);
    expect(acceptsClassicWorkerFrame(frame, fingerprint, closed)).toBe(false);
  });

  it("holds a lagging frame only while the structure and sources are unchanged", () => {
    const frame = computeAcousticFrame(sceneAt(90));
    const verifiedAgainst = sceneAt(91);
    const moved = sceneAt(95);
    moved.sources[1]!.position = { x: 9.5, y: 2 };
    const restructured = sceneAt(96);
    restructured.walls[0] = { ...restructured.walls[0]!, materialId: "wood_medium" };
    const fewer = sceneAt(96);
    fewer.sources.splice(1, 1);

    expect(holdsClassicFrame(frame, null, sceneAt(90))).toBe(true);
    expect(holdsClassicFrame(frame, null, moved)).toBe(false);
    expect(holdsClassicFrame(frame, verifiedAgainst, moved)).toBe(true);
    expect(holdsClassicFrame(frame, verifiedAgainst, restructured)).toBe(false);
    expect(holdsClassicFrame(frame, verifiedAgainst, fewer)).toBe(false);
  });
});
