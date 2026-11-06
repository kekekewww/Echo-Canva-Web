import { CONCRETE_PARTITION_PRESET } from "@/domain/presets/concrete-partition";
import { HARD_ROOM_PRESET } from "@/domain/presets/hard-room";
import { STRESS_100_WALLS_PRESET } from "@/domain/presets/stress-100-walls";
import { TREATED_ROOM_PRESET } from "@/domain/presets/treated-room";
import type { SceneSpec } from "@/domain/scene/types";

import type { CorpusCaseDefinition } from "../types";

export function cloneScene(scene: SceneSpec, revision: number): SceneSpec {
  const clone = structuredClone(scene);
  clone.revision = revision;
  return clone;
}

export function sceneCounts(scene: SceneSpec, primitives = 0): NonNullable<CorpusCaseDefinition["counts"]> {
  return {
    walls: scene.walls.length,
    portals: scene.portals.length,
    primitives,
    enabledSources: scene.sources.length,
    activeListeners: 1,
  };
}

export const STRESS_EXTRA_SOURCES_NOTE =
  "The Stress preset has one source; sources beyond the first are added at fixed in-room positions (stress_rain, stress_voice, stress_radio_2).";

/** The Stress preset with its first 1, 2 or 4 sources; extra sources sit at fixed in-room positions. */
export function stressScene(sourceCount: 1 | 2 | 4, revision: number): SceneSpec {
  const scene = cloneScene(STRESS_100_WALLS_PRESET, revision);
  const extra: SceneSpec["sources"] = [
    { id: "stress_rain", name: "Stress rain", clipId: "rain_loop", sourceType: "point", position: { x: 10.5, y: 1.2 }, gainDb: -8, loop: true },
    { id: "stress_voice", name: "Stress voice", clipId: "voice_loop", sourceType: "point", position: { x: 6, y: 7.2 }, gainDb: -4, loop: true },
    { id: "stress_radio_2", name: "Stress radio 2", clipId: "radio_loop", sourceType: "point", position: { x: 11.2, y: 4 }, gainDb: -6, loop: true },
  ];
  scene.sources = [...scene.sources, ...extra].slice(0, sourceCount);
  return scene;
}

export function stressSource(count: 1 | 2 | 4): CorpusCaseDefinition["source"] {
  return {
    type: "derived",
    refs: ["src/domain/presets/stress-100-walls.ts"],
    ...(count > 1 ? { notes: STRESS_EXTRA_SOURCES_NOTE } : {}),
  };
}

function reflectionHeavyScene(): SceneSpec {
  const scene = cloneScene(HARD_ROOM_PRESET, 113);
  scene.name = "Reflection Heavy";
  scene.sources[0]!.position = { x: 4, y: 4 };
  scene.listener.position = { x: 6, y: 4 };
  scene.settings.maxEarlyReflections = 2;
  return scene;
}

function frameCase(
  id: string,
  scenario: NonNullable<CorpusCaseDefinition["scenario"]>,
  tags: string[],
  source: CorpusCaseDefinition["source"],
  scene: SceneSpec,
): CorpusCaseDefinition {
  return {
    id,
    mode: "classic-2d5d",
    kind: "classic-frame",
    expectedOutcome: "ok",
    tags,
    scenario,
    source,
    seed: null,
    counts: sceneCounts(scene),
    input: { scene },
  };
}

const ORACLE_REF = "src/benchmarks/classic-baseline.ts";

function oracleCases(): CorpusCaseDefinition[] {
  const concrete = cloneScene(CONCRETE_PARTITION_PRESET, 100);
  const closedPortal = cloneScene(CONCRETE_PARTITION_PRESET, 101);
  closedPortal.portals[0]!.open = false;
  const concretePortal = cloneScene(CONCRETE_PARTITION_PRESET, 102);
  concretePortal.listener.position = { x: 3, y: 1.5 };
  const concretePortalClosed = cloneScene(concretePortal, 103);
  concretePortalClosed.portals[0]!.open = false;
  const concreteMoved = cloneScene(CONCRETE_PARTITION_PRESET, 104);
  concreteMoved.listener.position = { x: 2.5, y: 6.4 };
  const hard = cloneScene(HARD_ROOM_PRESET, 105);
  const hardMoved = cloneScene(HARD_ROOM_PRESET, 106);
  hardMoved.listener.position = { x: 2, y: 2 };
  const treated = cloneScene(TREATED_ROOM_PRESET, 107);
  const treatedMoved = cloneScene(TREATED_ROOM_PRESET, 108);
  treatedMoved.sources[0]!.position = { x: 6, y: 6.5 };
  const stress = cloneScene(STRESS_100_WALLS_PRESET, 109);

  const derived = { type: "derived" as const, refs: [ORACLE_REF] };
  const preset = (file: string) => ({
    type: "preset" as const,
    refs: [ORACLE_REF, `src/domain/presets/${file}`],
  });
  return [
    frameCase("C001_CONCRETE_DEFAULT", "S2", ["oracle", "preset"], preset("concrete-partition.ts"), concrete),
    frameCase("C002_CONCRETE_CLOSED_PORTAL", "S2", ["oracle", "portal-closed"], derived, closedPortal),
    frameCase("C003_CONCRETE_PORTAL_ROUTE", "S2", ["oracle", "portal-route"], derived, concretePortal),
    frameCase("C004_CONCRETE_BLOCKED", "S2", ["oracle", "blocked"], derived, concretePortalClosed),
    frameCase("C005_CONCRETE_MOVED_LISTENER", "S2", ["oracle", "moved-listener"], derived, concreteMoved),
    frameCase("C006_HARD_ROOM", "S1", ["oracle", "preset"], preset("hard-room.ts"), hard),
    frameCase("C007_HARD_ROOM_MOVED_LISTENER", "S1", ["oracle", "moved-listener"], derived, hardMoved),
    frameCase("C008_TREATED_ROOM", "S1", ["oracle", "preset"], preset("treated-room.ts"), treated),
    frameCase("C009_TREATED_ROOM_MOVED_SOURCE", "S1", ["oracle", "moved-source"], derived, treatedMoved),
    frameCase("C010_STRESS_100_WALLS", "S3", ["oracle", "stress"], preset("stress-100-walls.ts"), stress),
  ];
}

export function classicCaseDefinitions(): CorpusCaseDefinition[] {
  return [
    ...oracleCases(),
    frameCase("C011_STRESS_1_SOURCE", "S4", ["stress", "source-count"], stressSource(1), stressScene(1, 110)),
    frameCase("C012_STRESS_2_SOURCES", "S4", ["stress", "source-count"], stressSource(2), stressScene(2, 111)),
    frameCase("C013_STRESS_4_SOURCES", "S4", ["stress", "source-count"], stressSource(4), stressScene(4, 112)),
    frameCase(
      "C014_REFLECTION_HEAVY",
      "S7",
      ["reflection-cap", "symmetric", "tie"],
      {
        type: "handwritten",
        refs: ["src/domain/presets/hard-room.ts"],
        notes:
          "Hard 10 by 8 m room; source (4,4) and listener (6,4) mirror each other so opposite walls tie in gain; maxEarlyReflections is 2 so the cap is reached.",
      },
      reflectionHeavyScene(),
    ),
  ];
}
