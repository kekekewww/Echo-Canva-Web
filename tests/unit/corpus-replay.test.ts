import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { createClassicStaticContext } from "@/acoustics/compute-frame";
import { corpusCaseDefinitions } from "../../benchmarks/corpus/harness/definitions";
import { runCorpusCase } from "../../benchmarks/corpus/harness/ts-serial-adapter";
import type { CorpusCaseKind } from "../../benchmarks/corpus/harness/types";
import { aggregateSha256, canonicalize, sha256Hex } from "../../scripts/corpus/lib.mjs";

const ROOT = resolve(process.cwd());

type ManifestCase = {
  id: string;
  kind: CorpusCaseKind;
  input: { path: string; sha256: string; bytes: number };
  expected: { path: string; sha256: string; bytes: number };
};

function readText(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

const manifest = JSON.parse(readText("benchmarks/corpus/v1/manifest.json")) as { cases: ManifestCase[] };

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

  it("replays every case deterministically and byte-exactly", () => {
    const hashes: Record<string, string> = {};
    let bitExact = 0;
    for (const entry of manifest.cases) {
      const inputText = readText(entry.input.path);
      expect(sha256Hex(inputText), `${entry.id} input hash`).toBe(entry.input.sha256);
      const expectedText = readText(entry.expected.path);
      expect(sha256Hex(expectedText), `${entry.id} expected hash`).toBe(entry.expected.sha256);

      const first = canonicalize(runCorpusCase(entry.id, entry.kind, JSON.parse(inputText))).text;
      const second = canonicalize(runCorpusCase(entry.id, entry.kind, JSON.parse(inputText))).text;
      expect(second, `${entry.id} determinism`).toBe(first);
      expect(first, `${entry.id} bytes`).toBe(expectedText);
      hashes[entry.id] = sha256Hex(first);
      bitExact += 1;
    }
    console.info(
      `[corpus] aggregateSha256=${aggregateSha256(hashes)} bitExact=${bitExact}/${manifest.cases.length} platform=${process.platform} node=${process.version}`,
    );
  });
});
