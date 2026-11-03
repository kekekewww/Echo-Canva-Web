import type { CSSProperties } from "react";

import type { AddableKind, AddAvailability } from "@/domain/workspace/entities";

export type AddObjectKind = AddableKind;
export type { AddAvailability };

const ITEMS: readonly Readonly<{ kind: AddObjectKind; glyph: string; label: string; group: string }>[] = [
  { kind: "listener", glyph: "L", label: "Listener", group: "Scene" },
  { kind: "source", glyph: "S", label: "Source", group: "Scene" },
  { kind: "wall", glyph: "W", label: "Wall", group: "Geometry" },
  { kind: "portal", glyph: "P", label: "Portal", group: "Geometry" },
  { kind: "box", glyph: "□", label: "Box", group: "Basic shapes" },
  { kind: "cylinder", glyph: "○", label: "Cylinder", group: "Basic shapes" },
  { kind: "sphere", glyph: "●", label: "Sphere", group: "Basic shapes" },
];

export const GEOMETRY_ADD_KINDS: readonly AddObjectKind[] = ["wall", "portal", "box", "cylinder", "sphere"];

export function AddObjectMenu({ onAdd, onClose, availability = {}, kinds, title = "Add object", testIdPrefix = "add", style }: Readonly<{
  onAdd: (kind: AddObjectKind) => void;
  onClose: () => void;
  availability?: AddAvailability;
  /** Restrict the menu to these kinds (e.g. the Outliner's Geometry group). */
  kinds?: readonly AddObjectKind[];
  title?: string;
  testIdPrefix?: string;
  style?: CSSProperties;
}>) {
  const items = kinds ? ITEMS.filter(({ kind }) => kinds.includes(kind)) : ITEMS;
  return (
    <div aria-label={title} aria-modal="true" className="add-object-popover" role="dialog" style={style}>
      <header><strong>{title}</strong><button aria-label="Close" onClick={onClose} type="button">×</button></header>
      {items.map(({ kind, glyph, label, group }, index) => {
        const state = availability[kind];
        const showGroup = index === 0 || items[index - 1]?.group !== group;
        return (
          <div className="add-object-item" key={kind}>
            {showGroup ? <p>{group}</p> : null}
            <button autoFocus={index === 0} data-testid={`${testIdPrefix}-${kind}`} disabled={state?.enabled === false} onClick={() => { onAdd(kind); onClose(); }} title={state?.reason} type="button">
              <span aria-hidden="true">{glyph}</span>{label}{state?.reason ? <>{" "}<small>{state.reason}</small></> : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}
