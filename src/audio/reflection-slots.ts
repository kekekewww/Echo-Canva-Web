/**
 * Stable placement of ranked reflection paths into a fixed pool of audio taps.
 *
 * The acoustic model still decides *which* paths are audible (rank, tie-break,
 * and six-tap limit are unchanged). This allocator only decides *where* each
 * audible path plays, so that a path that stays audible keeps its tap and its
 * delay line never glides across to an unrelated path when the ranking changes.
 */
export function assignReflectionSlots(
  previousKeys: readonly (string | null)[],
  rankedKeys: readonly string[],
  quietSlots: readonly boolean[] = previousKeys.map((key) => key === null),
): (string | null)[] {
  const slotCount = previousKeys.length;
  const wanted: string[] = [];
  for (const key of rankedKeys) {
    if (wanted.length === slotCount) break;
    if (!wanted.includes(key)) wanted.push(key);
  }
  const wantedKeys = new Set(wanted);
  const assignment: (string | null)[] = Array.from({ length: slotCount }, () => null);
  const placed = new Set<string>();

  previousKeys.forEach((key, slot) => {
    if (key !== null && wantedKeys.has(key) && !placed.has(key)) {
      assignment[slot] = key;
      placed.add(key);
    }
  });

  // Prefer silent idle slots (no retune needed), then slots that are still
  // fading after a release, then slots whose audible path is being replaced.
  const slotCost = (slot: number): number => {
    if (previousKeys[slot] === null) return quietSlots[slot] ? 0 : 1;
    return 2;
  };
  const freeSlots = assignment
    .map((key, slot) => (key === null ? slot : -1))
    .filter((slot) => slot >= 0)
    .sort((left, right) => slotCost(left) - slotCost(right) || left - right);

  let cursor = 0;
  for (const key of wanted) {
    if (placed.has(key)) continue;
    const slot = freeSlots[cursor];
    if (slot === undefined) break;
    cursor += 1;
    assignment[slot] = key;
    placed.add(key);
  }
  return assignment;
}

/** Stable identity of a Classic reflection path (first or second order). */
export function classicReflectionKey(
  reflection: Readonly<{ wallId: string; wallIds?: readonly string[] }>,
): string {
  return reflection.wallIds?.join(">") ?? reflection.wallId;
}
