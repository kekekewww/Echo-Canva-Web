import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { hybridStaticGeometryHash } from "@/acoustics/hybrid3d/compile";
import { PRESETS } from "@/domain/presets";
import type { SceneSpec } from "@/domain/scene/types";
import { validateScene } from "@/domain/scene/validate";
import { createSceneDocumentV2 } from "@/domain/scene-document/serialize";
import type { SceneDocumentV2 } from "@/domain/scene-document/types";
import { createDefaultHybridProject } from "@/domain/workspace/defaults";
import { projectClassicScene, projectHybridDocument } from "@/domain/workspace/projections";
import { projectReducer } from "@/domain/workspace/project-reducer";
import type { WorkspaceProject } from "@/domain/workspace/types";

import { lcg32 } from "../../corpus/harness/prng";
import { createClassicStepBuilder, createHybridStepBuilder, type TapeEvent } from "./tape";

export const WORKLOAD_ID = "ec102-workloads-v1";
export const WORKLOAD_DIR = "benchmarks/perf/workloads/v1";
export const WORKLOAD_SEED = 20261107;
export const GENERATOR_PATH = "benchmarks/perf/harness/generate-workloads.ts";

const POSE_HZ = 60;
const STATIC_HZ = 5;
const POSE_DURATION_MS = 60_000;
const STATIC_DURATION_MS = 30_000;
const WAYPOINT_EVERY_MS = 1000;
const STATIC_WALL_ID = "stress_50";
const STATIC_MATERIALS = ["wood_medium", "concrete_hard"] as const;
const PORTAL_EDGE_Y = 0.4;

export type TimedEvent = { plannedMs: number; event: TapeEvent };
export type WorkloadTape = {
  id: string;
  rateHz: number;
  durationMs: number;
  seed: number;
  events: TimedEvent[];
};

type MutableProject = { -readonly [K in keyof WorkspaceProject]: WorkspaceProject[K] };

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * The fixture of tests/e2e/workspace.spec.ts lines 288-395: preset stress-100-walls selected the
 * way the app does (REPLACE_SCENE into a Hybrid project), then the same mutation as lines 315-352
 * (8 listeners, 4 sources, 8 portals on the north boundary wall).
 */
export function buildFixtureProject(): WorkspaceProject {
  const replaced = projectReducer(createDefaultHybridProject(), {
    type: "REPLACE_SCENE",
    scene: structuredClone(PRESETS["stress-100-walls"]),
  });
  const project = structuredClone(replaced) as MutableProject;
  const scene = project.scene;
  const host = scene.walls.find(({ id }) => id === "stress_boundary_north");
  const baseSource = scene.sources[0];
  if (!host || !baseSource) throw new Error("Stress fixture is incomplete.");
  project.listeners = Array.from({ length: 8 }, (_, index) => ({
    id: `stress_listener_${index}`,
    name: `Stress Listener ${index + 1}`,
    position: { x: 1 + index, y: 1.5, z: 1 + (index % 4) },
    headingDeg: index * 15,
    enabled: true,
  }));
  project.activeListenerId = project.listeners[0]!.id;
  project.selection = { type: "listener", id: project.activeListenerId };
  scene.sources = Array.from({ length: 4 }, (_, index) => ({
    ...baseSource,
    id: `stress_source_${index}`,
    name: `Stress Source ${index + 1}`,
    position: { x: 8 + index * 0.7, y: 6 + index * 0.35 },
  }));
  project.sourceHeightsM = Object.fromEntries(scene.sources.map(({ id }, index) => [id, 1 + index * 0.4]));
  scene.portals = Array.from({ length: 8 }, (_, index) => ({
    id: `stress_portal_${index}`,
    wallId: host.id,
    center: { x: 0.8 + index * 1.45, y: 0 },
    widthM: 0.6,
    heightM: 2,
    open: index % 2 === 0,
    lossDb: 3,
  }));
  project.portal3dById = Object.fromEntries(scene.portals.map((portal) => [portal.id, {
    bottomM: 0,
    topM: 2,
    thicknessM: 0.12,
  }]));
  project.revision += 1;
  scene.revision = project.revision;
  return project;
}

export function buildPoseTape(scene: SceneSpec): WorkloadTape {
  const random = lcg32(WORKLOAD_SEED);
  const seconds = POSE_DURATION_MS / WAYPOINT_EVERY_MS;
  const waypoints: { x: number; y: number; heading: number }[] = [];
  let heading = random() * 360;
  for (let index = 0; index <= seconds; index += 1) {
    const x = 0.6 + random() * 10.8;
    const y = 0.6 + random() * 6.8;
    heading += (random() - 0.5) * 120;
    if (index % 5 === 4) {
      const portal = scene.portals[Math.floor(index / 5) % scene.portals.length]!;
      const side = Math.floor(index / 5) % 2 === 0 ? 1 : -1;
      waypoints.push({ x: portal.center.x + (side * portal.widthM) / 2, y: PORTAL_EDGE_Y, heading });
    } else {
      waypoints.push({ x, y, heading });
    }
  }
  return {
    id: "pose-60hz-60s",
    rateHz: POSE_HZ,
    durationMs: POSE_DURATION_MS,
    seed: WORKLOAD_SEED,
    events: poseEvents(waypoints, POSE_DURATION_MS),
  };
}

function poseEvents(waypoints: { x: number; y: number; heading: number }[], durationMs: number): TimedEvent[] {
  const count = Math.round((durationMs / 1000) * POSE_HZ);
  const events: TimedEvent[] = [];
  for (let index = 0; index < count; index += 1) {
    const plannedMs = (index * 1000) / POSE_HZ;
    const segment = Math.floor(plannedMs / WAYPOINT_EVERY_MS);
    const fraction = plannedMs / WAYPOINT_EVERY_MS - segment;
    const from = waypoints[segment]!;
    const to = waypoints[segment + 1]!;
    const headingDeg = (((from.heading + (to.heading - from.heading) * fraction) % 360) + 360) % 360;
    events.push({
      plannedMs,
      event: {
        type: "listener-pose",
        position: {
          x: round4(from.x + (to.x - from.x) * fraction),
          y: round4(from.y + (to.y - from.y) * fraction),
        },
        headingDeg: round4(headingDeg),
      },
    });
  }
  return events;
}

/** The same draw order as the 60 s tape, shortened to 30 s, plus 150 static events at 5 Hz. */
export function buildStaticTape(scene: SceneSpec): WorkloadTape {
  const pose = buildPoseTape(scene);
  const poses = pose.events.filter(({ plannedMs }) => plannedMs < STATIC_DURATION_MS);
  const wall = scene.walls.find(({ id }) => id === STATIC_WALL_ID);
  if (!wall) throw new Error(`Fixture has no wall ${STATIC_WALL_ID}`);
  const portalOpen = new Map(scene.portals.map(({ id, open }) => [id, open]));
  const statics: TimedEvent[] = [];
  const total = (STATIC_DURATION_MS / 1000) * STATIC_HZ;
  const counts = { endpoint: 0, material: 0, portal: 0 };
  for (let index = 0; index < total; index += 1) {
    // Offset by half a pose frame so a static event never shares a planned time with a pose.
    const plannedMs = (index * 1000) / STATIC_HZ + 1000 / POSE_HZ / 2;
    let event: TapeEvent;
    if (index % 3 === 0) {
      const delta = counts.endpoint % 2 === 0 ? 0.05 : -0.05;
      counts.endpoint += 1;
      event = {
        type: "wall-endpoint",
        id: wall.id,
        a: { ...wall.a },
        b: { x: round4(wall.b.x + delta), y: wall.b.y },
      };
    } else if (index % 3 === 1) {
      event = { type: "wall-material", id: wall.id, materialId: STATIC_MATERIALS[counts.material % 2]! };
      counts.material += 1;
    } else {
      const portal = scene.portals[counts.portal % scene.portals.length]!;
      const open = !portalOpen.get(portal.id)!;
      portalOpen.set(portal.id, open);
      counts.portal += 1;
      event = { type: "portal-toggle", id: portal.id, open };
    }
    statics.push({ plannedMs, event });
  }
  const events = [...poses, ...statics].sort((left, right) => left.plannedMs - right.plannedMs);
  return {
    id: "static-5hz-30s",
    rateHz: STATIC_HZ,
    durationMs: STATIC_DURATION_MS,
    seed: WORKLOAD_SEED,
    events,
  };
}

function assertTapeValid(classic: SceneSpec, hybrid: SceneDocumentV2, tape: WorkloadTape): void {
  const buildClassic = createClassicStepBuilder({ scene: classic, events: [] }, 0);
  const buildHybrid = createHybridStepBuilder({ document: hybrid, events: [] }, 0);
  for (const { event } of tape.events) {
    buildClassic(event);
    buildHybrid(event);
  }
}

function count(events: TimedEvent[]): Record<string, number> {
  const byType: Record<string, number> = {};
  for (const { event } of events) byType[event.type] = (byType[event.type] ?? 0) + 1;
  return byType;
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function jsonText(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Valid JSON with the header at 2-space indent and one event per line, to keep the file small. */
export function tapeText(tape: WorkloadTape): string {
  const { events, ...header } = tape;
  const head = JSON.stringify(header, null, 2).slice(0, -2);
  const lines = events.map((entry) => `    ${JSON.stringify(entry)}`);
  return `${head},\n  "events": [\n${lines.join(",\n")}\n  ]\n}\n`;
}

export type WorkloadManifest = ReturnType<typeof buildWorkloads>["manifest"];

export function buildWorkloads(sourceCommit: string) {
  const project = buildFixtureProject();
  const hybrid = projectHybridDocument(project);
  const classic = projectClassicScene(project);

  const walls = classic.walls.length;
  const portals = classic.portals.length;
  const sources = classic.sources.length;
  if (walls !== 100 || portals !== 8 || sources !== 4 || project.listeners.length !== 8) {
    throw new Error(`Fixture counts differ: ${walls} walls, ${portals} portals, ${sources} sources.`);
  }
  if (!validateScene(classic).ok) throw new Error("Classic fixture scene is rejected by validateScene.");
  createSceneDocumentV2(hybrid.baseScene, hybrid.extensions);

  const poseTape = buildPoseTape(classic);
  const staticTape = buildStaticTape(classic);
  for (const tape of [poseTape, staticTape]) assertTapeValid(classic, hybrid, tape);
  if (poseTape.events.length !== 3600) throw new Error(`Pose tape has ${poseTape.events.length} events.`);
  const staticCount = staticTape.events.filter(({ event }) => event.type !== "listener-pose").length;
  if (staticTape.events.length !== 1950 || staticCount !== 150) {
    throw new Error(`Static tape has ${staticTape.events.length} events, ${staticCount} static.`);
  }

  const files = new Map<string, string>([
    ["h100-scene.json", jsonText(hybrid)],
    ["c100-scene.json", jsonText(classic)],
    ["pose-60hz-60s.json", tapeText(poseTape)],
    ["static-5hz-30s.json", tapeText(staticTape)],
  ]);

  const cases = [
    { id: "W01_H100_POSE_60HZ_60S", mode: "hybrid", scene: "h100-scene.json", tape: poseTape, file: "pose-60hz-60s.json" },
    { id: "W02_H100_STATIC_5HZ_30S", mode: "hybrid", scene: "h100-scene.json", tape: staticTape, file: "static-5hz-30s.json" },
    { id: "W03_C100_POSE_60HZ_60S", mode: "classic", scene: "c100-scene.json", tape: poseTape, file: "pose-60hz-60s.json" },
    { id: "W04_C100_STATIC_5HZ_30S", mode: "classic", scene: "c100-scene.json", tape: staticTape, file: "static-5hz-30s.json" },
  ].map(({ id, mode, scene, tape, file }) => ({
    id,
    mode,
    replay: "open",
    scene,
    tape: file,
    rateHz: tape.rateHz,
    durationMs: tape.durationMs,
    eventCount: tape.events.length,
    eventsByType: count(tape.events),
  }));

  const manifest = {
    id: WORKLOAD_ID,
    generator: GENERATOR_PATH,
    sourceCommit,
    seed: WORKLOAD_SEED,
    prng: {
      name: "lcg32",
      source: "benchmarks/corpus/harness/prng.ts",
      algorithm: "state = seed; next() { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 2 ** 32; }",
      multiplier: 1664525,
      increment: 1013904223,
      modulus: "2^32",
      drawOrder: "One generator seeded once. Initial heading: one draw times 360. Then for each of the 61 waypoints, in order: x, y, heading delta. Position draws are discarded for portal-edge waypoints, so the draw count does not depend on the portal rule. The 30 s tape reuses the first 31 waypoints of the same sequence.",
    },
    scene: {
      fixtureSource: "tests/e2e/workspace.spec.ts lines 288-395 (preset stress-100-walls, then the mutation of lines 315-352)",
      preset: "stress-100-walls",
      walls,
      portals,
      sources,
      listeners: project.listeners.length,
      primitives: 0,
      staticGeometryHash: hybridStaticGeometryHash(hybrid),
      classicProjectionHash: hybrid.compatibility.classicProjectionHash,
    },
    tapes: {
      "pose-60hz-60s.json": { eventCount: poseTape.events.length, eventsByType: count(poseTape.events) },
      "static-5hz-30s.json": { eventCount: staticTape.events.length, eventsByType: count(staticTape.events) },
    },
    cases,
    files: Object.fromEntries(
      [...files].map(([name, text]) => [name, { sha256: sha256(text), bytes: Buffer.byteLength(text, "utf8") }]),
    ),
    notes: [
      "primitive-pose is not exercised by these workloads: the fixture has no primitives. Only corpus case TH02 exercises it.",
      "Static events: wall-endpoint nudges the b end of stress_50 by +0.05 m and -0.05 m alternately from its original position; wall-material alternates wood_medium and concrete_hard; portal-toggle cycles stress_portal_0 to _7 and flips the current state.",
      "Static events are planned at index * 200 ms plus 8.3333 ms, so none shares a planned time with a pose event.",
      "Every event was replayed through validateScene and createSceneDocumentV2 at generation time; none was rejected.",
    ],
    corpusV1: "Unchanged. Corpus v1 (benchmarks/corpus/v1) still covers scenarios S1-S7 with its own tapes; these workloads do not replace or modify any of them.",
  };

  return { files, manifest, manifestText: jsonText(manifest) };
}

function main(): void {
  // --check mode regenerates into another directory and never touches workloads/v1.
  const checkDir = process.env.ECHO_PERF_OUT_DIR;
  if (checkDir === undefined && process.env.ECHO_PERF_UPDATE !== "1") {
    throw new Error("Refusing to write workloads: set ECHO_PERF_UPDATE=1.");
  }
  if (checkDir !== undefined && resolve(process.cwd(), checkDir) === resolve(process.cwd(), WORKLOAD_DIR)) {
    throw new Error("ECHO_PERF_OUT_DIR must not be the committed workloads directory.");
  }
  const sourceCommit = process.env.ECHO_PERF_SOURCE_COMMIT;
  if (!sourceCommit) throw new Error("ECHO_PERF_SOURCE_COMMIT is not set; use scripts/perf/cli.mjs generate-workloads.");
  const dir = resolve(process.cwd(), checkDir ?? WORKLOAD_DIR);
  mkdirSync(dir, { recursive: true });
  const { files, manifestText } = buildWorkloads(sourceCommit);
  for (const [name, text] of files) writeFileSync(resolve(dir, name), text, { encoding: "utf8" });
  writeFileSync(resolve(dir, "manifest.json"), manifestText, { encoding: "utf8" });
  console.log(`wrote ${files.size + 1} files to ${checkDir ?? WORKLOAD_DIR}`);
}

if (process.env.ECHO_PERF_GENERATE === "1") main();
