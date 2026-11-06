import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { createClassicStaticContext } from "@/acoustics/compute-frame";
import { classicProjectionHash } from "@/domain/scene-document/validate";
import { corpusCaseDefinitions } from "../../benchmarks/corpus/harness/definitions";
import { runCorpusCase } from "../../benchmarks/corpus/harness/ts-serial-adapter";
import type { CorpusCaseKind } from "../../benchmarks/corpus/harness/types";
import { aggregateSha256, canonicalize, compareOutputs, sha256Hex } from "../../scripts/corpus/lib.mjs";
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

const manifest = JSON.parse(readText("benchmarks/corpus/v1/manifest.json")) as { cases: ManifestCase[] };
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

  it("rebuilds every frozen input byte-for-byte from the definitions", () => {
    const definitions = corpusCaseDefinitions();
    expect(definitions.map(({ id }) => id)).toEqual(manifest.cases.map(({ id }) => id));
    for (const definition of definitions) {
      const entry = manifest.cases.find(({ id }) => id === definition.id)!;
      expect(`${JSON.stringify(definition.input, null, 2)}\n`, definition.id).toBe(readText(entry.input.path));
    }
  });

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
