import type { ScreenPoint } from "./viewport-math";

/**
 * Deterministic label placement for the Hybrid viewport.
 *
 * Coordinates are SVG viewBox units (the Hybrid viewport uses 1200 × 720, +y down). Text boxes are estimated
 * from the monospace advance width instead of measured from the DOM, so layout stays pure, testable, and
 * stable between renders. This is presentation only: it never changes projected geometry, hit targets,
 * accessible names, or acoustic state.
 */

export type LabelAlign = "start" | "middle" | "end";

export type LabelBox = Readonly<{ minX: number; minY: number; maxX: number; maxY: number }>;

/** Offset from the anchor to the text baseline, in viewBox units. */
export type LabelOffset = Readonly<{ dx: number; dy: number; align: LabelAlign }>;

export type ViewportLabelCandidate = Readonly<{
  key: string;
  text: string;
  className: string;
  anchor: ScreenPoint;
  fontSizePx: number;
  letterSpacingEm?: number;
  /** Higher priority labels are placed first and keep contested space. */
  priority: number;
  /** Candidate positions in preference order. */
  offsets: readonly LabelOffset[];
  /** Required labels fall back to their first offset when every offset collides; others are hidden. */
  required?: boolean;
}>;

export type PlacedViewportLabel = Readonly<{
  key: string;
  text: string;
  className: string;
  x: number;
  y: number;
  align: LabelAlign;
  box: LabelBox;
  priority: number;
}>;

/**
 * Advance width of the configured monospace stack (Cascadia Mono, SF Mono, Consolas, DejaVu Sans Mono) is
 * 0.55–0.61 em. Over-estimating slightly keeps the estimated box around the rendered glyphs.
 */
export const MONO_ADVANCE_EM = 0.62;
const ASCENT_EM = 0.8;
const DESCENT_EM = 0.25;
/** Clearance kept around every label box, including the halo stroke. */
export const LABEL_PADDING = 3;

export function estimateLabelBox(
  text: string,
  baseline: ScreenPoint,
  align: LabelAlign,
  fontSizePx: number,
  letterSpacingEm = 0,
): LabelBox {
  const width = text.length * fontSizePx * (MONO_ADVANCE_EM + letterSpacingEm);
  const minX = align === "start" ? baseline.x : align === "end" ? baseline.x - width : baseline.x - width / 2;
  return {
    minX: minX - LABEL_PADDING,
    minY: baseline.y - fontSizePx * ASCENT_EM - LABEL_PADDING,
    maxX: minX + width + LABEL_PADDING,
    maxY: baseline.y + fontSizePx * DESCENT_EM + LABEL_PADDING,
  };
}

export function boxesIntersect(left: LabelBox, right: LabelBox): boolean {
  return left.minX < right.maxX && right.minX < left.maxX && left.minY < right.maxY && right.minY < left.maxY;
}

function insideBounds(box: LabelBox, bounds: LabelBox | undefined): boolean {
  return !bounds || (box.minX >= bounds.minX && box.maxX <= bounds.maxX && box.minY >= bounds.minY && box.maxY <= bounds.maxY);
}

export function boxAround(center: ScreenPoint, halfWidth: number, top: number, bottom = top): LabelBox {
  return { minX: center.x - halfWidth, minY: center.y - top, maxX: center.x + halfWidth, maxY: center.y + bottom };
}

/**
 * Places labels greedily by priority (then key, for determinism). Each label takes the first offset whose box
 * stays inside `bounds` and clears every obstacle and every already placed label. The result is ordered from
 * lowest to highest priority, so rendering it in order draws the most important labels on top.
 */
export function layoutViewportLabels(
  candidates: readonly ViewportLabelCandidate[],
  obstacles: readonly LabelBox[] = [],
  bounds?: LabelBox,
): PlacedViewportLabel[] {
  const ordered = [...candidates].sort((left, right) => right.priority - left.priority || left.key.localeCompare(right.key));
  const placed: PlacedViewportLabel[] = [];
  for (const candidate of ordered) {
    if (!candidate.text || candidate.offsets.length === 0) continue;
    const options = candidate.offsets.map((offset) => {
      const baseline = { x: candidate.anchor.x + offset.dx, y: candidate.anchor.y + offset.dy };
      return {
        baseline,
        align: offset.align,
        box: estimateLabelBox(candidate.text, baseline, offset.align, candidate.fontSizePx, candidate.letterSpacingEm),
      };
    });
    const free = options.find(({ box }) => insideBounds(box, bounds)
      && !obstacles.some((obstacle) => boxesIntersect(box, obstacle))
      && !placed.some((label) => boxesIntersect(box, label.box)));
    const chosen = free ?? (candidate.required ? options[0] : undefined);
    if (!chosen) continue;
    placed.push({
      key: candidate.key,
      text: candidate.text,
      className: candidate.className,
      x: chosen.baseline.x,
      y: chosen.baseline.y,
      align: chosen.align,
      box: chosen.box,
      priority: candidate.priority,
    });
  }
  return placed.reverse();
}
