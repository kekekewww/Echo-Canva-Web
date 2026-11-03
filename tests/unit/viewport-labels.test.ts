import { describe, expect, it } from "vitest";

import {
  LABEL_PADDING,
  MONO_ADVANCE_EM,
  boxesIntersect,
  estimateLabelBox,
  layoutViewportLabels,
  type LabelOffset,
  type ViewportLabelCandidate,
} from "@/components/lab/viewport-labels";

const ABOVE_THEN_BELOW: readonly LabelOffset[] = [
  { dx: 0, dy: -20, align: "middle" },
  { dx: 0, dy: 30, align: "middle" },
];

function candidate(key: string, x: number, y: number, priority: number, extra: Partial<ViewportLabelCandidate> = {}): ViewportLabelCandidate {
  return {
    key,
    text: key,
    className: "label",
    anchor: { x, y },
    fontSizePx: 10,
    priority,
    offsets: ABOVE_THEN_BELOW,
    ...extra,
  };
}

describe("estimateLabelBox", () => {
  it("sizes monospace text from the advance width and aligns it like SVG text-anchor", () => {
    const width = 4 * 10 * MONO_ADVANCE_EM;
    const middle = estimateLabelBox("abcd", { x: 100, y: 50 }, "middle", 10);
    const start = estimateLabelBox("abcd", { x: 100, y: 50 }, "start", 10);
    const end = estimateLabelBox("abcd", { x: 100, y: 50 }, "end", 10);
    expect(middle.minX).toBeCloseTo(100 - width / 2 - LABEL_PADDING, 9);
    expect(middle.maxX).toBeCloseTo(100 + width / 2 + LABEL_PADDING, 9);
    expect(start.minX).toBeCloseTo(100 - LABEL_PADDING, 9);
    expect(end.maxX).toBeCloseTo(100 + LABEL_PADDING, 9);
    expect(middle.minY).toBeLessThan(50);
    expect(middle.maxY).toBeGreaterThan(50);
  });

  it("widens the box for letter spacing", () => {
    const plain = estimateLabelBox("abcd", { x: 0, y: 0 }, "start", 10);
    const spaced = estimateLabelBox("abcd", { x: 0, y: 0 }, "start", 10, 0.05);
    expect(spaced.maxX - spaced.minX).toBeCloseTo(plain.maxX - plain.minX + 4 * 10 * 0.05, 9);
  });
});

describe("layoutViewportLabels", () => {
  it("moves a lower-priority label to its next offset instead of overlapping a higher-priority one", () => {
    const placed = layoutViewportLabels([
      candidate("low", 100, 100, 1),
      candidate("high", 100, 100, 2),
    ]);
    const high = placed.find(({ key }) => key === "high")!;
    const low = placed.find(({ key }) => key === "low")!;
    expect(high.y).toBe(80);
    expect(low.y).toBe(130);
    expect(boxesIntersect(high.box, low.box)).toBe(false);
  });

  it("hides an optional label that cannot be placed and keeps a required one at its first offset", () => {
    const blocked = { minX: 0, minY: 0, maxX: 400, maxY: 400 };
    const placed = layoutViewportLabels([
      candidate("optional", 100, 100, 1),
      candidate("required", 200, 200, 1, { required: true }),
    ], [blocked]);
    expect(placed.map(({ key }) => key)).toEqual(["required"]);
    expect(placed[0]).toMatchObject({ x: 200, y: 180 });
  });

  it("avoids obstacles and stays inside the bounds when another offset fits", () => {
    const obstacle = { minX: 80, minY: 60, maxX: 120, maxY: 90 };
    const [nearTop] = layoutViewportLabels([candidate("top", 300, 10, 1)], [], { minX: 0, minY: 0, maxX: 600, maxY: 400 });
    const [nearObstacle] = layoutViewportLabels([candidate("blocked", 100, 100, 1)], [obstacle]);
    expect(nearTop!.y).toBe(40);
    expect(nearObstacle!.y).toBe(130);
    expect(boxesIntersect(nearObstacle!.box, obstacle)).toBe(false);
  });

  it("is deterministic regardless of input order and returns labels from lowest to highest priority", () => {
    const labels = [
      candidate("b", 100, 100, 1),
      candidate("a", 100, 100, 1),
      candidate("c", 100, 100, 3),
      candidate("d", 400, 100, 2),
    ];
    const forward = layoutViewportLabels(labels);
    const reversed = layoutViewportLabels([...labels].reverse());
    expect(reversed).toEqual(forward);
    expect(forward.map(({ priority }) => priority)).toEqual([...forward.map(({ priority }) => priority)].sort((left, right) => left - right));
    // "c" wins the shared anchor, "a" sorts before "b" and takes the remaining offset, "b" is hidden.
    expect(forward.map(({ key }) => key).sort()).toEqual(["a", "c", "d"]);
  });

  it("never returns overlapping labels for optional candidates", () => {
    const crowded = Array.from({ length: 12 }, (_, index) => candidate(`label-${index}`, 100 + index * 6, 100 + (index % 3) * 8, index % 4));
    const placed = layoutViewportLabels(crowded);
    for (let left = 0; left < placed.length; left += 1) {
      for (let right = left + 1; right < placed.length; right += 1) {
        expect(boxesIntersect(placed[left]!.box, placed[right]!.box)).toBe(false);
      }
    }
  });

  it("skips empty text", () => {
    expect(layoutViewportLabels([candidate("empty", 0, 0, 1, { text: "" })])).toEqual([]);
  });
});
