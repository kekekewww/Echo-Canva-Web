import { afterEach, describe, expect, it, vi } from "vitest";

import { computeClassicSourceResults, type ClassicStaticContext } from "@/acoustics/compute-frame";
import {
  compileHybridStaticGeometry,
  createHybridGeometryCompiler,
  hybridStaticGeometryHash,
} from "@/acoustics/hybrid3d/compile";
import { STRESS_100_WALLS_PRESET } from "@/domain/presets/stress-100-walls";
import type { SceneSpec } from "@/domain/scene/types";
import { createDefaultHybridProject } from "@/domain/workspace/defaults";
import { projectHybridDocument } from "@/domain/workspace/projections";
import type { ClassicSourceWorkerRequest, ClassicSourceWorkerResponse } from "@/workers/classic-source.worker";
import { createClassicSourcePool } from "@/workers/classic-source-pool";

// #24: pose-only updates must not re-serialize and hash the static structure.
// Both static fingerprints are FNV-1a over JSON.stringify of the static inputs,
// so counting JSON.stringify calls observes whether they are recomputed.

afterEach(() => {
  vi.restoreAllMocks();
});

function syncWorker(): ClassicSourceWorkerRequest[] & { worker: unknown } {
  const posted = [] as unknown as ClassicSourceWorkerRequest[] & { worker: unknown };
  let installed: ClassicStaticContext | null = null;
  const worker = {
    onmessage: null as null | ((event: MessageEvent<ClassicSourceWorkerResponse>) => void),
    onerror: null,
    onmessageerror: null,
    terminate: () => undefined,
    postMessage(request: ClassicSourceWorkerRequest) {
      posted.push(request);
      const reply = (data: ClassicSourceWorkerResponse) => worker.onmessage?.({ data } as MessageEvent<ClassicSourceWorkerResponse>);
      if (request.type === "INSTALL_STATIC") {
        installed = request.context;
        reply({ type: "STATIC_INSTALLED", requestId: request.requestId, staticFingerprint: request.context.fingerprint });
      } else if (request.type === "COMPUTE_SHARD" && installed) {
        reply({
          type: "SHARD_RESULT",
          requestId: request.requestId,
          staticFingerprint: request.staticFingerprint,
          revision: request.snapshot.revision,
          sourceIds: request.sourceIds,
          results: computeClassicSourceResults(installed, request.snapshot, request.sourceIds),
          computeMs: 1,
          completedAtMs: 1,
        });
      }
    },
  };
  posted.worker = worker;
  return posted;
}

describe("static structure caching (#24)", () => {
  it("builds the Classic static context once across 100 pose-only dispatches", () => {
    const posted = syncWorker();
    const pool = createClassicSourcePool({
      createWorker: () => posted.worker as never,
      hardwareConcurrency: 3,
      jobTimeoutMs: 0,
      schedule: (callback) => { callback(); return 1; },
      cancel: () => undefined,
    });
    const frames: number[] = [];
    pool.onmessage = (event) => { if (event.data.type === "FRAME") frames.push(event.data.revision); };
    const base = structuredClone(STRESS_100_WALLS_PRESET) as SceneSpec;
    pool.postMessage({ type: "UPDATE_SCENE", scene: { ...base, revision: 1 } });

    const stringify = vi.spyOn(JSON, "stringify");
    for (let revision = 2; revision <= 101; revision += 1) {
      const scene = structuredClone(base);
      scene.revision = revision;
      scene.listener = { ...scene.listener, position: { x: scene.listener.position.x + revision * 0.001, y: scene.listener.position.y } };
      pool.postMessage({ type: "UPDATE_SCENE", scene });
    }

    expect(frames).toHaveLength(101);
    expect(stringify).not.toHaveBeenCalled();
    expect(posted.filter(({ type }) => type === "INSTALL_STATIC")).toHaveLength(1);

    const restructured = structuredClone(base);
    restructured.revision = 102;
    restructured.walls[0] = { ...restructured.walls[0]!, thicknessM: restructured.walls[0]!.thicknessM + 0.05 };
    pool.postMessage({ type: "UPDATE_SCENE", scene: restructured });
    expect(stringify).toHaveBeenCalled();
    expect(posted.filter(({ type }) => type === "INSTALL_STATIC")).toHaveLength(2);
  });

  it("does not rehash or recompile Hybrid static geometry for 100 pose-only updates", () => {
    let project = createDefaultHybridProject();
    const compileStatic = vi.fn(compileHybridStaticGeometry);
    const compiler = createHybridGeometryCompiler(compileStatic);
    compiler.compile(projectHybridDocument(project));

    const stringify = vi.spyOn(JSON, "stringify");
    const documents = [];
    for (let index = 1; index <= 100; index += 1) {
      const listener = project.listeners[0]!;
      project = {
        ...project,
        revision: project.revision + 1,
        listeners: [{ ...listener, position: { ...listener.position, x: listener.position.x + 0.001 } }, ...project.listeners.slice(1)],
      };
      const document = projectHybridDocument(project);
      documents.push(document);
      stringify.mockClear();
      const geometry = compiler.compile(document);
      expect(stringify).not.toHaveBeenCalled();
      expect(geometry.document).toBe(document);
    }
    stringify.mockRestore();

    expect(compileStatic).toHaveBeenCalledTimes(1);
    // The reused structure still carries the hash the documents would produce.
    expect(compiler.compile(documents.at(-1)!).staticGeometryHash).toBe(hybridStaticGeometryHash(documents.at(-1)!));

    const taller = projectHybridDocument({ ...project, room3d: { ...project.room3d, heightM: project.room3d.heightM + 0.5 } });
    compiler.compile(taller);
    expect(compileStatic).toHaveBeenCalledTimes(2);
  });
});
