"use client";

import type { EntityRef, WorkspaceProject } from "@/domain/workspace/types";
import { memo, useEffect, useRef, useState } from "react";

import { AddObjectMenu, GEOMETRY_ADD_KINDS, type AddAvailability, type AddObjectKind } from "@/components/workspace/AddObjectMenu";
import { WORKSPACE_LIMITS } from "@/domain/workspace/entities";

type Props = Readonly<{
  project: WorkspaceProject;
  onSelect: (selection: EntityRef) => void;
  mobileOpen?: boolean;
  /** Adds an object from a group header ("＋"); the same rules as the toolbar Add menu apply. */
  onAdd?: (kind: AddObjectKind) => void;
  addAvailability?: AddAvailability;
  /** Turns an entity on or off for acoustics in one action from its row. */
  onToggleEnabled?: (entity: EntityRef, enabled: boolean) => void;
}>;

const LISTENER_HINT = "Selecting a listener makes it the audible receiver";
/** Approximate height of the five-item geometry menu, used only to keep it on screen. */
const GEOMETRY_MENU_HEIGHT_PX = 330;

const OutlinerEntityRow = memo(function OutlinerEntityRow({
  type,
  id,
  label,
  kind,
  active,
  enabled,
  selected,
  toggleable,
  onSelect,
  onToggleEnabled,
}: Readonly<{
  type: EntityRef["type"];
  id: string;
  label: string;
  kind: string;
  active: boolean;
  enabled: boolean;
  selected: boolean;
  toggleable: boolean;
  onSelect: (selection: EntityRef) => void;
  onToggleEnabled?: (entity: EntityRef, enabled: boolean) => void;
}>) {
  return (
    <div className={`outliner-item${enabled ? "" : " is-disabled"}`}>
      <button
        aria-pressed={selected}
        className={`outliner-row kind-${kind}${enabled ? "" : " is-disabled"}`}
        onClick={() => onSelect({ type, id })}
        title={type === "listener" ? LISTENER_HINT : undefined}
        type="button"
      >
        <i aria-hidden="true" />
        <span>{label}</span>
        {active ? <em>Active</em> : null}
        {!enabled ? <em>Off</em> : null}
      </button>
      {toggleable && onToggleEnabled ? (
        <button
          aria-label={`${enabled ? "Turn off" : "Turn on"} ${label}`}
          className="outliner-toggle"
          onClick={() => onToggleEnabled({ type, id }, !enabled)}
          title={enabled ? "Turn off (exclude from acoustics)" : "Turn on"}
          type="button"
        >
          <svg aria-hidden="true" height="14" viewBox="0 0 16 16" width="14">
            <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
            {enabled ? <circle cx="8" cy="8" fill="currentColor" r="2" /> : <path d="M2.5 13.5 13.5 2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />}
          </svg>
        </button>
      ) : null}
    </div>
  );
});

function GroupHeader({ label, count, limit, countTitle, addLabel, addDisabledReason, onAdd, expanded, controls }: Readonly<{
  label: string;
  count: number;
  limit?: number;
  countTitle?: string;
  addLabel?: string;
  addDisabledReason?: string;
  onAdd?: (button: HTMLButtonElement) => void;
  expanded?: boolean;
  controls?: string;
}>) {
  return (
    <div className="outliner-group">
      <p>{label}</p>
      <span className="outliner-count" title={countTitle}>{limit === undefined ? count : `${count} / ${limit}`}</span>
      {addLabel && onAdd ? (
        <button
          aria-controls={controls}
          aria-expanded={expanded}
          aria-label={addLabel}
          className="outliner-add"
          disabled={Boolean(addDisabledReason)}
          onClick={(event) => onAdd(event.currentTarget)}
          title={addDisabledReason ?? addLabel}
          type="button"
        >
          ＋
        </button>
      ) : null}
    </div>
  );
}

export const SceneOutliner = memo(function SceneOutliner({ project, onSelect, mobileOpen = false, onAdd, addAvailability = {}, onToggleEnabled }: Props) {
  const [geometryMenu, setGeometryMenu] = useState<Readonly<{ top: number; left: number }> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const geometryTriggerRef = useRef<HTMLButtonElement | null>(null);
  const disabled = new Set(project.disabledEntityIds);

  useEffect(() => {
    if (!geometryMenu) return undefined;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setGeometryMenu(null);
      geometryTriggerRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent): void {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !geometryTriggerRef.current?.contains(target)) setGeometryMenu(null);
    }
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [geometryMenu]);

  const row = (entity: EntityRef, label: string, kind: string, active = false, enabled = true, toggleable = true) => (
    <OutlinerEntityRow
      active={active}
      enabled={enabled}
      id={entity.id}
      key={`${entity.type}-${entity.id}`}
      kind={kind}
      label={label}
      onSelect={onSelect}
      onToggleEnabled={onToggleEnabled}
      selected={project.selection?.type === entity.type && project.selection.id === entity.id}
      toggleable={toggleable}
      type={entity.type}
    />
  );
  const geometryCount = project.scene.walls.length + project.scene.portals.length + project.primitives.length;
  return (
    <aside aria-label="Scene Outliner" aria-modal={mobileOpen || undefined} className={`workspace-outliner${mobileOpen ? " is-mobile-open" : ""}`} role={mobileOpen ? "dialog" : undefined}>
      <header><span>Scene</span><small>{project.mode === "hybrid-3d" ? "3D" : "2.5D"}</small></header>
      <nav>
        <GroupHeader
          addDisabledReason={addAvailability.listener?.reason}
          addLabel="Add listener"
          count={project.listeners.length}
          label="Listeners"
          limit={WORKSPACE_LIMITS.listeners}
          onAdd={onAdd ? () => onAdd("listener") : undefined}
        />
        {project.listeners.map((listener) => row(
          { type: "listener", id: listener.id },
          listener.name,
          "listener",
          listener.id === project.activeListenerId,
          listener.enabled,
        ))}
        <GroupHeader
          addDisabledReason={addAvailability.source?.reason}
          addLabel="Add source"
          count={project.scene.sources.length}
          label="Sources"
          limit={WORKSPACE_LIMITS.sources}
          onAdd={onAdd ? () => onAdd("source") : undefined}
        />
        {project.scene.sources.map((source) => row(
          { type: "source", id: source.id }, source.name, "source", false, !disabled.has(source.id),
        ))}
        <GroupHeader
          addLabel="Add geometry"
          controls="outliner-geometry-menu"
          count={geometryCount}
          countTitle={`Walls ${project.scene.walls.length} / ${WORKSPACE_LIMITS.walls} · Portals ${project.scene.portals.length} / ${WORKSPACE_LIMITS.portals} · Shapes ${project.primitives.length} / ${WORKSPACE_LIMITS.primitives}`}
          expanded={geometryMenu !== null}
          label="Geometry"
          onAdd={onAdd ? (button) => {
            geometryTriggerRef.current = button;
            const rect = button.getBoundingClientRect();
            // Open under the button, kept on screen on short windows.
            const top = Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - GEOMETRY_MENU_HEIGHT_PX));
            setGeometryMenu((open) => open ? null : { top, left: rect.left });
          } : undefined}
        />
        {geometryMenu && onAdd ? (
          <div id="outliner-geometry-menu" ref={menuRef}>
            <AddObjectMenu
              availability={addAvailability}
              kinds={GEOMETRY_ADD_KINDS}
              onAdd={onAdd}
              onClose={() => setGeometryMenu(null)}
              style={{ left: geometryMenu.left, position: "fixed", top: geometryMenu.top }}
              testIdPrefix="outliner-add"
              title="Add geometry"
            />
          </div>
        ) : null}
        {project.scene.walls.map((wall) => row(
          { type: "wall", id: wall.id }, wall.id.replaceAll("_", " "), "wall", false, !disabled.has(wall.id),
        ))}
        {project.scene.portals.map((portal) => row(
          { type: "portal", id: portal.id }, portal.id.replaceAll("_", " "), "portal", false, !disabled.has(portal.id),
        ))}
        {project.primitives.map((primitive) => row(
          { type: "primitive", id: primitive.id }, primitive.name, "primitive", false, !disabled.has(primitive.id),
        ))}
        <div className="outliner-group"><p>Room</p></div>
        {row({ type: "surface", id: "room" }, "Room dimensions", "surface", false, true, false)}
        {project.mode === "hybrid-3d" ? (
          <>
            <div className="outliner-group"><p>Surfaces</p></div>
            {row({ type: "surface", id: "floor" }, "Floor", "surface", false, true, false)}
            {row({ type: "surface", id: "ceiling" }, "Ceiling", "surface", false, !disabled.has("ceiling"))}
          </>
        ) : null}
      </nav>
    </aside>
  );
});
