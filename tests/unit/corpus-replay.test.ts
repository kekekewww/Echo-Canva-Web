import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { createClassicStaticContext } from "@/acoustics/compute-frame";
import { MATERIALS } from "@/domain/materials/registry";
import { compileHybridGeometry } from "@/acoustics/hybrid3d/compile";
import { findPrunedSecondOrderReflections3D } from "@/acoustics/hybrid3d/second-order";
import { classicProjectionHash } from "@/domain/scene-document/validate";
import { corpusCaseDefinitions } from "../../benchmarks/corpus/harness/definitions";
import { runCorpusCase } from "../../benchmarks/corpus/harness/ts-serial-adapter";
import type { CorpusCaseKind } from "../../benchmarks/corpus/harness/types";
import { aggregateSha256, canonicalize, collectGitInfo, compareOutputs, sha256Hex } from "../../scripts/corpus/lib.mjs";
import type { CorpusRules } from "../../scripts/corpus/lib.mjs";

const ROOT = resolve(process.cwd());

type ManifestCase = {
  id: string;
  kind: CorpusCaseKind;
  expectedOutcome: "ok" | "error";
  tags: string[];
  input: { path: string; sha256: string; bytes: number };
  expected: { path: string; sha256: string; bytes: number };
};

function readText(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

const manifest = JSON.parse(readText("benchmarks/corpus/v1/manifest.json")) as {
  baseline: Parameters<typeof collectGitInfo>[1];
  cases: ManifestCase[];
};
const rules = JSON.parse(readText("benchmarks/corpus/v1/comparison-rules.json")) as CorpusRules;

function round(value: number): number {
  return Number(value.toFixed(6));
}

type ProjectedFrame = {
  staticFingerprint: string;
  frame: {
    room: { volumeM3: number; rt60S: { low: number; mid: number; high: number } };
    sources: {
      sourceId: string;
      routeType: string;
      directVisible: boolean;
      physicalDistanceM: number;
      effectiveDistanceM: number;
      dryGainDb: number;
      lowpassHz: number;
      virtualPosition: { x: number; y: number };
      occluderWallIds: string[];
      portalIds: string[];
      earlyReflections: { wallId: string; pathLengthM: number; delayMs: number; gainDb: number }[];
    }[];
  };
};

function projectLikeOracle(id: string, value: ProjectedFrame) {
  const { frame } = value;
  return {
    id,
    room: {
      volumeM3: round(frame.room.volumeM3),
      rt60S: {
        low: round(frame.room.rt60S.low),
        mid: round(frame.room.rt60S.mid),
        high: round(frame.room.rt60S.high),
      },
    },
    sources: frame.sources.map((source) => ({
      id: source.sourceId,
      routeType: source.routeType,
      directVisible: source.directVisible,
      physicalDistanceM: round(source.physicalDistanceM),
      effectiveDistanceM: round(source.effectiveDistanceM),
      dryGainDb: round(source.dryGainDb),
      lowpassHz: round(source.lowpassHz),
      virtualPosition: { x: round(source.virtualPosition.x), y: round(source.virtualPosition.y) },
      occluderWallIds: [...source.occluderWallIds],
      portalIds: [...source.portalIds],
      earlyReflections: source.earlyReflections.map((reflection) => ({
        wallId: reflection.wallId,
        pathLengthM: round(reflection.pathLengthM),
        delayMs: round(reflection.delayMs),
        gainDb: round(reflection.gainDb),
      })),
    })),
  };
}

function expectedOf(id: string): unknown {
  const entry = manifest.cases.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing manifest case ${id}`);
  return JSON.parse(readText(entry.expected.path));
}

describe("frozen corpus replay", () => {
  it("keeps C001-C010 equal to the Classic regression oracle", () => {
    const oracle = JSON.parse(readText("benchmarks/results/mvp-baseline.json")) as {
      scenarios: { id: string }[];
    };
    expect(oracle.scenarios).toHaveLength(10);
    for (const scenario of oracle.scenarios) {
      const output = expectedOf(scenario.id) as { outcome: string; value: ProjectedFrame };
      expect(output.outcome, scenario.id).toBe("ok");
      expect(projectLikeOracle(scenario.id, output.value), scenario.id).toEqual(scenario);
    }
  });

  it("records the expected outcome for every case", () => {
    for (const entry of manifest.cases) {
      const output = expectedOf(entry.id) as { outcome: string };
      expect(output.outcome, entry.id).toBe(entry.expectedOutcome);
    }
  });

  it("pins the static fingerprint to authored input key order", () => {
    const entry = manifest.cases.find(({ id }) => id === "C001_CONCRETE_DEFAULT")!;
    const input = JSON.parse(readText(entry.input.path)) as { scene: unknown };
    const scene = structuredClone(CONCRETE_PARTITION_PRESET);
    scene.revision = 100;
    const fingerprint = createClassicStaticContext(scene).fingerprint;
    expect((expectedOf("C001_CONCRETE_DEFAULT") as { value: ProjectedFrame }).value.staticFingerprint)
      .toBe(fingerprint);
    expect(createClassicStaticContext(input.scene as typeof scene).fingerprint).toBe(fingerprint);
  });

  it("keeps the SO001 floor-to-ceiling reflection analytic", () => {
    const output = expectedOf("SO001_FLOOR_CEILING") as {
      value: { exhaustive: { id: string; reflectionPoints: unknown[]; pathLengthM: number }[] };
    };
    const path = output.value.exhaustive.find(({ id }) => id === "second:floor>ceiling");
    expect(path?.reflectionPoints).toEqual([{ x: 1.5, y: 0, z: 0 }, { x: 3, y: 3, z: 0 }]);
    expect(Math.abs((path?.pathLengthM ?? Number.NaN) - Math.sqrt(45))).toBeLessThanOrEqual(1e-5);
  });

  // Live presets feed the definitions, so a harmless preset edit would fail this; the evidence anchors still pin the input bytes.
  it.skipIf(collectGitInfo(ROOT, manifest.baseline).productTreesMatchBaseline !== true)(
    "rebuilds every frozen input byte-for-byte from the definitions",
    () => {
      const definitions = corpusCaseDefinitions();
      expect(definitions.map(({ id }) => id)).toEqual(manifest.cases.map(({ id }) => id));
      for (const definition of definitions) {
        const entry = manifest.cases.find(({ id }) => id === definition.id)!;
        expect(`${JSON.stringify(definition.input, null, 2)}\n`, definition.id).toBe(readText(entry.input.path));
      }
    },
  );

  it("replays every case deterministically and within the comparison rules", () => {
    const hashes: Record<string, string> = {};
    const negativeZeroCounts: Record<string, number> = {};
    let bitExact = 0;
    for (const entry of manifest.cases) {
      const inputText = readText(entry.input.path);
      expect(sha256Hex(inputText), `${entry.id} input hash`).toBe(entry.input.sha256);
      const expectedText = readText(entry.expected.path);
      expect(sha256Hex(expectedText), `${entry.id} expected hash`).toBe(entry.expected.sha256);

      const firstRun = canonicalize(runCorpusCase(entry.id, entry.kind, JSON.parse(inputText)));
      const first = firstRun.text;
      const second = canonicalize(runCorpusCase(entry.id, entry.kind, JSON.parse(inputText))).text;
      expect(second, `${entry.id} determinism`).toBe(first);
      // Both sides are re-parsed canonical text, so -0 is 0 here exactly as it is on disk.
      const report = compareOutputs(JSON.parse(expectedText), JSON.parse(first), rules, {
        caseId: entry.id,
        kind: entry.kind,
      });
      expect(report.violations, `${entry.id} violations`).toEqual([]);
      if (/^(H|C|DC|DH)\d/.test(entry.id)) negativeZeroCounts[entry.id] = firstRun.negativeZeroPaths.length;
      hashes[entry.id] = sha256Hex(first);
      if (report.bitExact) bitExact += 1;
    }
    console.info(
      `[corpus] negativeZeroPaths ${JSON.stringify(
        Object.fromEntries(Object.entries(negativeZeroCounts).filter(([, count]) => count > 0)),
      )} checked=${Object.keys(negativeZeroCounts).length}`,
    );
    console.info(
      `[corpus] aggregateSha256=${aggregateSha256(hashes)} bitExact=${bitExact}/${manifest.cases.length} platform=${process.platform} node=${process.version}`,
    );
  }, 120_000);
});

type TapeStep = { step: number; event: string; staticFingerprint?: string; staticGeometryHash?: string };

describe("migration, degenerate and tape pins", () => {
  it("tags every D* and M* case", () => {
    for (const entry of manifest.cases) {
      if (entry.id.startsWith("D")) expect(entry.tags, entry.id).toContain("degenerate");
      if (/^M\d/.test(entry.id)) expect(entry.tags, entry.id).toContain("migration");
    }
  });

  it("pins the Hybrid source-on-listener error", () => {
    expect(expectedOf("DH01_SOURCE_ON_LISTENER")).toMatchObject({
      outcome: "error",
      error: { message: "Source and listener positions must be distinct in Hybrid 3D." },
    });
  });

  it("pins the migration payloads", () => {
    const m001 = expectedOf("M001_SCENESPEC_V1_TO_CLASSIC") as {
      value: { result: string; project: { sourceHeightsM: Record<string, number> } };
    };
    expect(m001.value.result).toBe("ok");
    expect(Object.values(m001.value.project.sourceHeightsM).length).toBeGreaterThan(0);
    expect(Object.values(m001.value.project.sourceHeightsM).every((height) => height === 1.5)).toBe(true);

    const m002 = expectedOf("M002_DOC_V2_SPATIAL_TO_HYBRID") as {
      value: { result: string; project: { scene: Parameters<typeof classicProjectionHash>[0] }; classicProjectionHash: string };
    };
    expect(m002.value.result).toBe("ok");
    expect(m002.value.classicProjectionHash).toBe(classicProjectionHash(m002.value.project.scene));

    const m012 = expectedOf("M012_INVALID_SPATIAL_REJECTED") as { outcome: string; error: { message: string } };
    expect(m012.outcome).toBe("error");
    expect(m012.error.message).toMatch(/invalid 3D geometry/);
  });

  it("freezes the migrated M004 history as compact patches", () => {
    const m004 = expectedOf("M004_LEGACY_CACHE_2_0") as { value: { history: { past: { operations: unknown[] }[] } } };
    expect(m004.value.history.past.length).toBeGreaterThan(0);
    for (const patch of m004.value.history.past) expect(Array.isArray(patch.operations)).toBe(true);
  });

  it.each([
    ["TC02_STATIC_EDIT_TAPE", "staticFingerprint", 24],
    ["TH02_STATIC_EDIT_TAPE", "staticGeometryHash", 24],
  ] as const)("%s changes the static hash on every static step and only then", (id, field, length) => {
    const steps = (expectedOf(id) as { value: { steps: TapeStep[] } }).value.steps;
    expect(steps).toHaveLength(length);
    const staticEvents = new Set(["wall-endpoint", "wall-material", "portal-toggle", "primitive-pose"]);
    for (let index = 1; index < steps.length; index++) {
      const changed = steps[index]![field] !== steps[index - 1]![field];
      expect(changed, `${id} step ${index} ${steps[index]!.event}`).toBe(staticEvents.has(steps[index]!.event));
    }
  });

  it("freezes the seeded tapes at 64 steps", () => {
    for (const id of ["TC01_LISTENER_TAPE_SEEDED", "TH01_LISTENER_TAPE_SEEDED"]) {
      const entry = manifest.cases.find((candidate) => candidate.id === id)!;
      const input = JSON.parse(readText(entry.input.path)) as { events: unknown[] };
      expect(input.events, id).toHaveLength(64);
      const steps = (expectedOf(id) as { value: { steps: unknown[] } }).value.steps;
      expect(steps, id).toHaveLength(64);
    }
  });
});

// Input files are read untyped; the pins below name the fields they use.
function inputOf(id: string): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  const entry = manifest.cases.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing manifest case ${id}`);
  return JSON.parse(readText(entry.input.path));
}

type Reflection = { wallId: string; gainDb: number; delayMs: number };
type Source = { sourceId: string; earlyReflections: Reflection[] };
type HybridPath = { id: string; pathLengthM: number };
type HybridValue = {
  staticGeometryHash: string;
  frame: {
    classicProjectionHash: string;
    paths: { sourceId: string; directVisible: boolean }[];
    firstOrderReflectionsBySource: Record<string, HybridPath[]>;
    secondOrderReflectionsBySource: Record<string, HybridPath[]>;
  };
  earlyTapsBySource: Record<string, { id: string; gainDb: number; delayMs: number }[]>;
};

const classicValue = (id: string) =>
  (expectedOf(id) as { value: { staticFingerprint: string; frame: { room: { preDelayMs: number }; sources: Source[] } } })
    .value;
const hybridValue = (id: string) => (expectedOf(id) as { value: HybridValue }).value;
const ids = (paths: readonly HybridPath[]) => paths.map(({ id }) => id);

/** The options `computeHybridDirectSources` passes to the second-order search. */
const FRAME_SECOND_ORDER_OPTIONS = { maxCandidates: 6, maxRepresentativePatches: 24 };

function secondOrderSearch(id: string, options: Parameters<typeof findPrunedSecondOrderReflections3D>[3]) {
  const geometry = compileHybridGeometry(inputOf(id).document);
  return findPrunedSecondOrderReflections3D(
    geometry.sourcePositions.radio!,
    geometry.listenerPosition,
    geometry.bvh,
    options,
  );
}

describe("clamp, cap and locale pins", () => {
  // MIN_PRE_DELAY_MS and MAX_PRE_DELAY_MS are not exported from src/acoustics/room-acoustics.ts, so the literals are stated here.
  it("CL01 and CL02 sit at the pre-delay floor and ceiling", () => {
    const area = (id: string) => {
      const polygon = inputOf(id).scene.room.outerPolygon as { x: number; y: number }[];
      const xs = polygon.map(({ x }) => x);
      const ys = polygon.map(({ y }) => y);
      return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    };
    expect((Math.sqrt(area("CL01_PRE_DELAY_FLOOR")) / 343) * 1000).toBeLessThan(5);
    expect(classicValue("CL01_PRE_DELAY_FLOOR").frame.room.preDelayMs).toBe(5);
    expect((Math.sqrt(area("CL02_PRE_DELAY_CEILING")) / 343) * 1000).toBeGreaterThan(80);
    expect(classicValue("CL02_PRE_DELAY_CEILING").frame.room.preDelayMs).toBe(80);
  });

  // MAX_EARLY_DELAY_MS (80) is not exported from src/acoustics/image-source.ts.
  it("CL05 keeps the two near walls and rejects the two whose excess delay is above 80 ms", () => {
    const { scene } = inputOf("CL05_EARLY_DELAY_CAP");
    const source = scene.sources[0].position as { x: number; y: number };
    const listener = scene.listener.position as { x: number; y: number };
    const kept = classicValue("CL05_EARLY_DELAY_CAP").frame.sources[0]!.earlyReflections.map(({ wallId }) => wallId);
    expect(kept).toEqual(["cap_south", "cap_west"]);
    const direct = Math.hypot(listener.x - source.x, listener.y - source.y);
    const excessMs = (image: { x: number; y: number }) =>
      ((Math.hypot(listener.x - image.x, listener.y - image.y) - direct) / 343) * 1000;
    expect(excessMs({ x: -source.x, y: source.y })).toBeLessThan(80);
    expect(excessMs({ x: source.x, y: 100 - source.y })).toBeLessThan(80);
    expect(excessMs({ x: source.x, y: -source.y })).toBeGreaterThan(80);
    expect(excessMs({ x: 100 - source.x, y: source.y })).toBeGreaterThan(80);
  });

  // MAX_SECOND_ORDER_PATH_M (50), MAX_EARLY_DELAY_MS (80) and MIN_SECOND_ORDER_GAIN_DB (-36) are not exported from image-source.ts.
  it("CL06 has a valid second-order path of 52.95 m that only the 50 m limit rejects", () => {
    const { scene } = inputOf("CL06_SECOND_ORDER_PATH_LIMIT");
    const source = scene.sources[0].position as { x: number; y: number };
    const listener = scene.listener.position as { x: number; y: number };
    const west = scene.walls.find(({ id }: { id: string }) => id === "far_west").a.x as number;
    const east = scene.walls.find(({ id }: { id: string }) => id === "far_east").a.x as number;
    // Image of the source in the west wall, then in the east wall; both walls are vertical so y is unchanged.
    const imageX = 2 * east - (2 * west - source.x);
    const pathLengthM = Math.hypot(imageX - listener.x, source.y - listener.y);
    expect(pathLengthM).toBeCloseTo(52.95, 2);
    expect(pathLengthM).toBeGreaterThan(50);
    const directM = Math.hypot(listener.x - source.x, listener.y - source.y);
    const excessDelayMs = ((pathLengthM - directM) / 343) * 1000;
    expect(excessDelayMs).toBeCloseTo(45.45, 2);
    expect(excessDelayMs).toBeLessThan(80);
    const concrete = MATERIALS.find(({ id }) => id === "concrete_hard")!;
    const amplitude = Math.sqrt(
      Math.max(0, 1 - concrete.absorption.mid - 10 ** (-concrete.transmissionLossDb.mid / 10)) * (1 - concrete.scattering),
    );
    const gainDb = 20 * Math.log10((amplitude * amplitude) / pathLengthM);
    expect(gainDb).toBeCloseTo(-35.56, 2);
    expect(gainDb).toBeGreaterThan(-36);
    const value = classicValue("CL06_SECOND_ORDER_PATH_LIMIT").frame.sources[0] as Source & { routeType: string };
    expect(value.routeType).toBe("blocked");
    expect(value.earlyReflections.map(({ wallId }) => wallId)).toEqual(["far_west", "far_east"]);
    expect((value.earlyReflections as unknown as { wallIds: string[] }[]).every(({ wallIds }) => wallIds.length === 1)).toBe(true);
  });

  it("HL02 keeps four second-order paths of 50 m or less and omits longer valid ones", () => {
    const value = hybridValue("HL02_SECOND_ORDER_PATH_LIMIT");
    expect(value.frame.paths[0]!.directVisible).toBe(false);
    const kept = value.frame.secondOrderReflectionsBySource.radio!;
    expect(kept).toHaveLength(4);
    expect(Math.max(...kept.map(({ pathLengthM }) => pathLengthM))).toBeLessThanOrEqual(50);
    const uncapped = secondOrderSearch("HL02_SECOND_ORDER_PATH_LIMIT", {
      ...FRAME_SECOND_ORDER_OPTIONS,
      maxPathLengthM: Number.POSITIVE_INFINITY,
    });
    expect(uncapped.paths.some(({ pathLengthM }) => pathLengthM > 50)).toBe(true);
    expect(ids(kept)).toEqual(ids(secondOrderSearch("HL02_SECOND_ORDER_PATH_LIMIT", FRAME_SECOND_ORDER_OPTIONS).paths));
  });

  it("HL03 retains exactly six second-order paths out of twelve valid ones", () => {
    const value = hybridValue("HL03_SECOND_ORDER_TOP_K");
    expect(value.frame.paths[0]!.directVisible).toBe(false);
    expect(value.frame.secondOrderReflectionsBySource.radio).toHaveLength(6);
    const search = secondOrderSearch("HL03_SECOND_ORDER_TOP_K", FRAME_SECOND_ORDER_OPTIONS);
    expect(search.stats.validPaths).toBe(12);
    expect(search.stats.topKPruned).toBe(6);
  });

  // The frame path passes maxCandidates 6 itself, so DEFAULT_SECOND_ORDER_TOP_K is only reached through the kernel input.
  it("SO005 keeps six of eighteen valid second-order paths when maxCandidates is left out", () => {
    const { options } = inputOf("SO005_DEFAULT_TOP_K");
    expect(options).not.toHaveProperty("maxCandidates");
    const value = (expectedOf("SO005_DEFAULT_TOP_K") as {
      value: { exhaustive: unknown[]; pruned: { paths: unknown[]; stats: { validPaths: number; topKPruned: number } } };
    }).value;
    expect(value.exhaustive).toHaveLength(18);
    expect(value.pruned.stats.validPaths).toBe(18);
    expect(value.pruned.paths).toHaveLength(6);
    expect(value.pruned.stats.topKPruned).toBe(12);
  });

  it("HL04 has 26 physical surfaces and the frame considers 24", () => {
    const value = hybridValue("HL04_REPRESENTATIVE_PATCH_CAP");
    expect(value.frame.paths[0]!.directVisible).toBe(false);
    const search = secondOrderSearch("HL04_REPRESENTATIVE_PATCH_CAP", FRAME_SECOND_ORDER_OPTIONS);
    expect(search.stats.availablePatches).toBe(26);
    expect(search.stats.consideredPatches).toBe(24);
    const uncapped = secondOrderSearch("HL04_REPRESENTATIVE_PATCH_CAP", {
      ...FRAME_SECOND_ORDER_OPTIONS,
      maxRepresentativePatches: 1000,
    });
    expect(uncapped.paths.length).toBeGreaterThan(search.paths.length);
    expect(ids(value.frame.secondOrderReflectionsBySource.radio!)).toEqual(ids(search.paths));
  });

  it("DV09 passes the schema and fails at the room dimension check", () => {
    const { json } = inputOf("DV09_ROOM_WIDTH_ABOVE_LIMIT");
    const polygon = JSON.parse(json).room.outerPolygon as { x: number; y: number }[];
    expect(polygon.every(({ x, y }) => Math.abs(x) <= 50 && Math.abs(y) <= 50)).toBe(true);
    const output = expectedOf("DV09_ROOM_WIDTH_ABOVE_LIMIT") as { value: { ok: boolean; errors: { code: string }[] } };
    expect(output.value.ok).toBe(false);
    expect(output.value.errors.map(({ code }) => code)).toEqual(["room_dimension_exceeded"]);
  });

  it("LC01 orders exact gain ties by locale, which differs from code-unit order", () => {
    const reflections = classicValue("LC01_MIXED_CASE_TIE_CLASSIC").frame.sources[0]!.earlyReflections;
    expect(reflections.map(({ wallId }) => wallId)).toEqual(["edge_1", "edge-1", "edge_a", "Edge_b"]);
    expect(reflections[0]!.gainDb).toBe(reflections[1]!.gainDb);
    expect(reflections[2]!.gainDb).toBe(reflections[3]!.gainDb);
    expect(["edge_1", "edge-1"].sort()).toEqual(["edge-1", "edge_1"]);
    expect(["edge_a", "Edge_b"].sort()).toEqual(["Edge_b", "edge_a"]);
  });

  it("LC02 orders Hybrid ties by locale in the first-order, second-order and tap lists", () => {
    const value = hybridValue("LC02_MIXED_CASE_TIE_HYBRID");
    expect(value.frame.paths.map(({ sourceId, directVisible }) => [sourceId, directVisible])).toEqual([
      ["radio", false],
      ["echo", true],
    ]);
    const echoFirst = value.frame.firstOrderReflectionsBySource.echo!;
    const tie = echoFirst.filter(({ id }) => id === "first:edge_a" || id === "first:Edge_b");
    expect(tie).toHaveLength(2);
    expect(tie[0]!.pathLengthM).toBe(tie[1]!.pathLengthM);
    expect(ids(tie)).toEqual(["first:edge_a", "first:Edge_b"]);
    const radioSecond = value.frame.secondOrderReflectionsBySource.radio!;
    const tied = radioSecond.filter(({ pathLengthM }) => pathLengthM === radioSecond[4]!.pathLengthM);
    expect(ids(tied)).toEqual(["second:Edge_b>edge_1", "second:edge-1>edge_a"]);
    expect(value.earlyTapsBySource.echo!.map(({ id }) => id).slice(-2)).toEqual(["first:edge_a", "first:Edge_b"]);
  });

  it("LC03 and LC04 pin the hashes of a scene name with BMP and non-BMP characters", () => {
    const name = inputOf("LC03_UNICODE_NAME_CLASSIC").scene.name as string;
    expect(name).toContain("\u{1D11E}");
    expect(name).toMatch(/[^\u0000-\u007f]/u);
    expect(inputOf("LC04_UNICODE_NAME_HYBRID").document.baseScene.name).toBe(name);
    const classic = inputOf("LC03_UNICODE_NAME_CLASSIC").scene;
    const asciiClassic = { ...classic, name: "Ascii name" };
    expect(classicValue("LC03_UNICODE_NAME_CLASSIC").staticFingerprint).toMatch(/^[0-9a-f]{8}$/);
    expect(classicValue("LC03_UNICODE_NAME_CLASSIC").staticFingerprint).toBe(createClassicStaticContext(classic).fingerprint);
    expect(createClassicStaticContext(asciiClassic).fingerprint).not.toBe(createClassicStaticContext(classic).fingerprint);
    const hybrid = hybridValue("LC04_UNICODE_NAME_HYBRID");
    expect(hybrid.staticGeometryHash).toMatch(/^[0-9a-f]{8}$/);
    expect(hybrid.frame.classicProjectionHash).toMatch(/^[0-9a-f]{8}$/);
    const document = inputOf("LC04_UNICODE_NAME_HYBRID").document;
    const asciiDocument = { ...document, baseScene: { ...document.baseScene, name: "Ascii name" } };
    expect(hybrid.staticGeometryHash).toBe(compileHybridGeometry(document).staticGeometryHash);
    // The geometry hash does not read the scene name; only the classic projection hash does.
    expect(compileHybridGeometry(asciiDocument).staticGeometryHash).toBe(hybrid.staticGeometryHash);
    expect(classicProjectionHash(document.baseScene)).toBe(hybrid.frame.classicProjectionHash);
    expect(classicProjectionHash(asciiDocument.baseScene)).not.toBe(classicProjectionHash(document.baseScene));
  });

  // fnv1a hashes charCodeAt(0) of each code point, which is only the high surrogate for U+1D11E and U+1D11F. This pins what
  // production does today, which is a collision.
  it("LC05 collides with LC03 on the static fingerprint", () => {
    const a = inputOf("LC03_UNICODE_NAME_CLASSIC").scene;
    const b = inputOf("LC05_NONBMP_SIBLING_CLASSIC").scene;
    expect(a.name).not.toBe(b.name);
    expect({ ...a, name: "" }).toEqual({ ...b, name: "" });
    expect(classicValue("LC05_NONBMP_SIBLING_CLASSIC").staticFingerprint)
      .toBe(classicValue("LC03_UNICODE_NAME_CLASSIC").staticFingerprint);
    expect(classicProjectionHash(a)).toBe(classicProjectionHash(b));
  });
});
