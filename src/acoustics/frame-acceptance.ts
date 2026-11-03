import {
  createClassicStaticContext,
  type AcousticFrame,
  type ClassicStaticContext,
} from "@/acoustics/compute-frame";
import type { SceneSpec } from "@/domain/scene/types";

/**
 * Frame acceptance under continuous edits (ADR 0007).
 *
 * A complete frame computed for revision R may be adopted while the scene is
 * already at a newer revision R+k only when the newer scene differs in pose
 * alone: the same static structure (the Worker static fingerprint) and the
 * same ordered source IDs. Such a frame is "pose-lagging": it is internally
 * consistent, it was computed against the current walls/Portals/materials, and
 * it describes listener/source positions at most one coalesced update old. A
 * frame computed against a different structure is never adopted.
 */

/** True when two ordered ID lists are identical. */
export function sameIdOrder(
  left: readonly Readonly<{ id: string }>[] | readonly string[],
  right: readonly Readonly<{ id: string }>[] | readonly string[],
): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index]!;
    const b = right[index]!;
    if ((typeof a === "string" ? a : a.id) !== (typeof b === "string" ? b : b.id)) return false;
  }
  return true;
}

/**
 * Deep equality for JSON-like scene data. A missing key and an `undefined`
 * value compare equal, matching how `JSON.stringify` (used by the static
 * fingerprint) treats them.
 */
export function jsonEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== "object" || typeof right !== "object" || left === null || right === null) {
    return false;
  }
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left)) {
    const other = right as readonly unknown[];
    if (left.length !== other.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (!jsonEqual(left[index], other[index])) return false;
    }
    return true;
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  // Allocation-free: this runs on every pose update of a drag.
  for (const key in leftRecord) {
    if (!Object.hasOwn(leftRecord, key)) continue;
    if (!jsonEqual(leftRecord[key], rightRecord[key])) return false;
  }
  for (const key in rightRecord) {
    if (!Object.hasOwn(rightRecord, key) || Object.hasOwn(leftRecord, key)) continue;
    if (rightRecord[key] !== undefined) return false;
  }
  return true;
}

/**
 * True when two Classic scenes share the static structure that
 * `createClassicStaticContext` fingerprints. This is a cheap structural
 * comparison for hot render paths, where re-serializing and hashing the
 * static scene on every pose change would cost more.
 */
export function sameClassicStaticStructure(
  left: ClassicStaticContext["scene"],
  right: ClassicStaticContext["scene"],
): boolean {
  if (left === right) return true;
  return left.schemaVersion === right.schemaVersion
    && left.units === right.units
    && left.name === right.name
    && jsonEqual(left.room, right.room)
    && jsonEqual(left.walls, right.walls)
    && jsonEqual(left.portals, right.portals)
    && jsonEqual(left.settings, right.settings);
}

/** True when `scene` differs from the frame's input only in pose (see module docs). */
export function isPoseLaggingClassicFrame(
  frame: AcousticFrame,
  frameStaticFingerprint: string | undefined,
  scene: SceneSpec,
): boolean {
  if (frame.revision === scene.revision || !frameStaticFingerprint) return false;
  if (!sameIdOrder(frame.sources.map(({ sourceId }) => sourceId), scene.sources)) return false;
  return createClassicStaticContext(scene).fingerprint === frameStaticFingerprint;
}
