"use client";

import { useEffect, useId, useRef, useState } from "react";

export type ViewportHelpItem = Readonly<{ gesture: string; action: string }>;

/**
 * Gesture help behind a "?" button. It replaces always-visible help chips that looked like buttons.
 * Escape or a pointer outside closes it and returns focus to the button.
 */
export function ViewportHelp({ label, items }: Readonly<{ label: string; items: readonly ViewportHelpItem[] }>) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="viewport-help" ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        ref={buttonRef}
        title={label}
        type="button"
      >
        ?
      </button>
      <div aria-label={label} className="viewport-help-panel" hidden={!open} id={panelId} role="note">
        <dl>
          {items.map(({ gesture, action }) => (
            <div key={gesture}><dt>{gesture}</dt><dd>{action}</dd></div>
          ))}
        </dl>
      </div>
    </div>
  );
}
