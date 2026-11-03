"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";

import { MATERIALS } from "@/domain/materials/registry";
import { NumericScrubField } from "@/components/workspace/NumericScrubField";
import { HintCard } from "@/components/workspace/HintCard";
import type { ProjectAction, WorkspaceProject } from "@/domain/workspace/types";
import { constrainPortal3D, constrainWall3D, resizeRoomAndClamp } from "@/domain/workspace/geometry-constraints";
import type { LocalAudioMetadata } from "@/domain/workspace/transfer";
import { AUDIO_ASSETS } from "@/domain/audio-assets/registry";
import { describeEntity, describeEntityType, WORKSPACE_LIMITS } from "@/domain/workspace/entities";

export type InspectorAddKind = "listener" | "source" | "wall";

function materialName(materialId: string): string {
  return MATERIALS.find(({ id }) => id === materialId)?.displayName ?? materialId;
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return <section className="inspector-section"><h3>{title}</h3>{children}</section>;
}

function MaterialSelect({ label, ariaLabel, value, onChange }: Readonly<{
  label: string;
  ariaLabel?: string;
  value: string;
  onChange: (materialId: string) => void;
}>) {
  return (
    <label className="select-field">{label}
      <select aria-label={ariaLabel} onChange={(event) => onChange(event.currentTarget.value)} value={value}>
        {MATERIALS.map((material) => <option key={material.id} value={material.id}>{material.displayName}</option>)}
      </select>
    </label>
  );
}

function NameInput({ label, value, onCommit }: Readonly<{ label: string; value: string; onCommit: (name: string) => void }>) {
  return (
    <input
      aria-label={label}
      className="inspector-name-input"
      defaultValue={value}
      key={value}
      onBlur={(event) => {
        const name = event.currentTarget.value.trim();
        if (name && name !== value) onCommit(name);
        else event.currentTarget.value = value;
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") { event.currentTarget.value = value; event.currentTarget.blur(); }
      }}
    />
  );
}

/**
 * Selection editor. Header: type icon, name (editable for sources and shapes), type and state, then
 * Enable/Disable and a "More actions" disclosure (Move to room centre, Delete). Sections always appear in the
 * same order: Placement → Shape → Acoustics → Notes. With nothing selected it shows a scene summary.
 */
export const ContextInspector = memo(function ContextInspector({ project, dispatch, localAssets = [], onRelinkAudio, onRemoveLocalAudio, mobileOpen = false, onDelete, onAdd, rt60MidS = null }: Readonly<{
  project: WorkspaceProject;
  dispatch: (action: ProjectAction) => void;
  localAssets?: readonly LocalAudioMetadata[];
  onRelinkAudio?: (clipId: string, file: File) => Promise<string>;
  onRemoveLocalAudio?: (clipId: string) => Promise<void>;
  mobileOpen?: boolean;
  /** Deletes the current selection (immediately, with an Undo toast owned by the workspace). */
  onDelete?: () => void;
  onAdd?: (kind: InspectorAddKind) => void;
  /** Mid-band RT60 of the accepted acoustic frame, for the empty-state summary. */
  rt60MidS?: number | null;
}>) {
  const [confirmAudioRemoval, setConfirmAudioRemoval] = useState(false);
  const [audioEditStatus, setAudioEditStatus] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);
  const selection = project.selection;
  const listener = selection?.type === "listener" ? project.listeners.find(({ id }) => id === selection.id) : null;
  const source = selection?.type === "source" ? project.scene.sources.find(({ id }) => id === selection.id) : null;
  const wall = selection?.type === "wall" ? project.scene.walls.find(({ id }) => id === selection.id) : null;
  const portal = selection?.type === "portal" ? project.scene.portals.find(({ id }) => id === selection.id) : null;
  const primitive = selection?.type === "primitive" ? project.primitives.find(({ id }) => id === selection.id) : null;
  const surface = selection?.type === "surface" ? selection.id : null;
  const portalHostWall = portal ? project.scene.walls.find(({ id }) => id === portal.wallId) : null;
  const disabled = selection ? project.disabledEntityIds.includes(selection.id) : false;
  const wallVertical = wall ? project.wall3dById[wall.id] ?? { bottomM: 0, topM: project.room3d.heightM, thicknessM: wall.thicknessM } : null;
  const portalVertical = portal ? project.portal3dById[portal.id] ?? { bottomM: 0, topM: portal.heightM, thicknessM: 0.12 } : null;
  const position = listener?.position ?? primitive?.position ?? (source ? {
    x: source.position.x,
    y: project.sourceHeightsM[source.id] ?? 1.5,
    z: source.position.y,
  } : null);
  const localAsset = source ? localAssets.find(({ id }) => id === source.clipId) : null;
  const builtInAsset = source ? AUDIO_ASSETS.find(({ id }) => id === source.clipId) : null;
  const sourceMissing = source ? project.missingAudioAssetIds.includes(source.clipId) : false;
  const hybrid = project.mode === "hybrid-3d";
  const canToggle = selection !== null && !(surface === "floor" || surface === "room");
  const canDelete = selection !== null && selection.type !== "surface";

  useEffect(() => {
    if (!actionsOpen) return undefined;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setActionsOpen(false);
      actionsButtonRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent): void {
      if (!actionsRef.current?.contains(event.target as Node)) setActionsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [actionsOpen]);

  function updatePosition(axis: "x" | "y" | "z", value: number): void {
    if (!position) return;
    const next = { ...position, [axis]: value };
    if (listener) dispatch({ type: "UPDATE_LISTENER", id: listener.id, changes: { position: next } });
    if (source) dispatch({ type: "MOVE_SOURCE", id: source.id, position: next });
    if (primitive) dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { position: next } });
  }

  function moveToRoomCentre(): void {
    const centre = { x: project.room3d.widthM / 2, y: Math.min(1.5, project.room3d.heightM), z: project.room3d.depthM / 2 };
    if (listener) dispatch({ type: "UPDATE_LISTENER", id: listener.id, changes: { position: centre } });
    if (source) dispatch({ type: "MOVE_SOURCE", id: source.id, position: centre });
    if (primitive) dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { position: centre } });
  }

  function applyConstraint(result: ReturnType<typeof resizeRoomAndClamp>): void {
    if (result.ok) dispatch({ type: "REPLACE_PROJECT", project: result.project });
    else dispatch({ type: "SET_NOTICE", notice: { code: "entity_missing", message: result.message } });
  }

  const portalHostLength = portalHostWall ? Math.hypot(portalHostWall.b.x - portalHostWall.a.x, portalHostWall.b.y - portalHostWall.a.y) : 0;
  const portalOffset = portal && portalHostWall
    ? ((portal.center.x - portalHostWall.a.x) * (portalHostWall.b.x - portalHostWall.a.x) + (portal.center.y - portalHostWall.a.y) * (portalHostWall.b.y - portalHostWall.a.y)) / Math.max(portalHostLength, 0.0001)
    : 0;
  const kindClass = selection?.type === "primitive" ? "primitive" : selection?.type ?? "none";

  const placement = position || portal ? (
    <Section title="Placement">
      {position ? <>
        <NumericScrubField axis="x" fineStep={0.01} label="X position" max={project.room3d.widthM} min={0} onCommit={(value) => updatePosition("x", value)} step={0.1} unit="m" value={position.x} />
        {hybrid ? <NumericScrubField axis="y" fineStep={0.01} label="Y position" max={project.room3d.heightM} min={0.1} onCommit={(value) => updatePosition("y", value)} step={0.1} unit="m" value={position.y} /> : null}
        <NumericScrubField axis="z" fineStep={0.01} label="Z position" max={project.room3d.depthM} min={0} onCommit={(value) => updatePosition("z", value)} step={0.1} unit="m" value={position.z} />
      </> : null}
      {listener ? <NumericScrubField fineStep={0.1} label="Heading" max={360} min={-360} onCommit={(headingDeg) => dispatch({ type: "UPDATE_LISTENER", id: listener.id, changes: { headingDeg } })} step={1} unit="°" value={listener.headingDeg} /> : null}
      {primitive ? <NumericScrubField fineStep={0.1} label="Rotation Y" max={360} min={-360} onCommit={(rotationYDeg) => dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { rotationYDeg } })} step={1} unit="°" value={primitive.rotationYDeg} /> : null}
      {portal && portalHostWall && portalVertical ? <NumericScrubField fineStep={0.01} label="Offset on Wall" max={Math.max(portal.widthM / 2, portalHostLength - portal.widthM / 2)} min={portal.widthM / 2} onCommit={(offsetM) => {
        const ux = (portalHostWall.b.x - portalHostWall.a.x) / Math.max(portalHostLength, 0.0001);
        const uz = (portalHostWall.b.y - portalHostWall.a.y) / Math.max(portalHostLength, 0.0001);
        applyConstraint(constrainPortal3D(project, portal.id, {
          center: { x: portalHostWall.a.x + ux * offsetM, y: portalHostWall.a.y + uz * offsetM },
          widthM: portal.widthM,
          ...portalVertical,
        }));
      }} step={0.1} unit="m" value={portalOffset} /> : null}
    </Section>
  ) : null;

  const shape = primitive || wall || portal || surface === "room" ? (
    <Section title="Shape">
      {primitive?.kind === "box" ? <>
        <NumericScrubField fineStep={0.01} label="Width" max={project.room3d.widthM} min={0.1} onCommit={(x) => dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { dimensions: { ...primitive.dimensions, x } } })} step={0.1} unit="m" value={primitive.dimensions.x} />
        <NumericScrubField fineStep={0.01} label="Height" max={project.room3d.heightM} min={0.1} onCommit={(y) => dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { dimensions: { ...primitive.dimensions, y } } })} step={0.1} unit="m" value={primitive.dimensions.y} />
        <NumericScrubField fineStep={0.01} label="Depth" max={project.room3d.depthM} min={0.1} onCommit={(z) => dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { dimensions: { ...primitive.dimensions, z } } })} step={0.1} unit="m" value={primitive.dimensions.z} />
      </> : null}
      {primitive?.kind === "cylinder" ? <>
        <NumericScrubField fineStep={0.01} label="Diameter" max={Math.min(project.room3d.widthM, project.room3d.depthM)} min={0.1} onCommit={(diameter) => dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { dimensions: { ...primitive.dimensions, x: diameter, z: diameter } } })} step={0.1} unit="m" value={primitive.dimensions.x} />
        <NumericScrubField fineStep={0.01} label="Height" max={project.room3d.heightM} min={0.1} onCommit={(y) => dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { dimensions: { ...primitive.dimensions, y } } })} step={0.1} unit="m" value={primitive.dimensions.y} />
      </> : null}
      {primitive?.kind === "sphere" ? <NumericScrubField fineStep={0.01} label="Diameter" max={Math.min(project.room3d.widthM, project.room3d.depthM, project.room3d.heightM)} min={0.1} onCommit={(diameter) => dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { dimensions: { x: diameter, y: diameter, z: diameter } } })} step={0.1} unit="m" value={primitive.dimensions.x} /> : null}
      {wall && wallVertical ? <>
        <p className="inspector-subhead">Endpoint A</p>
        <NumericScrubField axis="x" fineStep={0.01} label="Endpoint A X" max={project.room3d.widthM} min={0} onCommit={(x) => applyConstraint(constrainWall3D(project, wall.id, { a: { ...wall.a, x }, b: wall.b, ...wallVertical }))} step={0.1} unit="m" value={wall.a.x} />
        <NumericScrubField axis="z" fineStep={0.01} label="Endpoint A Z" max={project.room3d.depthM} min={0} onCommit={(z) => applyConstraint(constrainWall3D(project, wall.id, { a: { ...wall.a, y: z }, b: wall.b, ...wallVertical }))} step={0.1} unit="m" value={wall.a.y} />
        <p className="inspector-subhead">Endpoint B</p>
        <NumericScrubField axis="x" fineStep={0.01} label="Endpoint B X" max={project.room3d.widthM} min={0} onCommit={(x) => applyConstraint(constrainWall3D(project, wall.id, { a: wall.a, b: { ...wall.b, x }, ...wallVertical }))} step={0.1} unit="m" value={wall.b.x} />
        <NumericScrubField axis="z" fineStep={0.01} label="Endpoint B Z" max={project.room3d.depthM} min={0} onCommit={(z) => applyConstraint(constrainWall3D(project, wall.id, { a: wall.a, b: { ...wall.b, y: z }, ...wallVertical }))} step={0.1} unit="m" value={wall.b.y} />
        <NumericScrubField fineStep={0.01} label="Thickness" max={2} min={0.05} onCommit={(thicknessM) => applyConstraint(constrainWall3D(project, wall.id, { a: wall.a, b: wall.b, ...wallVertical, thicknessM }))} step={0.05} unit="m" value={wall.thicknessM} />
        {hybrid ? <>
          <NumericScrubField fineStep={0.01} label="Bottom" max={project.room3d.heightM - 0.1} min={0} onCommit={(bottomM) => applyConstraint(constrainWall3D(project, wall.id, { a: wall.a, b: wall.b, ...wallVertical, bottomM }))} step={0.1} unit="m" value={wallVertical.bottomM} />
          <NumericScrubField fineStep={0.01} label="Top" max={project.room3d.heightM} min={0.1} onCommit={(topM) => applyConstraint(constrainWall3D(project, wall.id, { a: wall.a, b: wall.b, ...wallVertical, topM }))} step={0.1} unit="m" value={wallVertical.topM} />
        </> : null}
      </> : null}
      {portal && portalVertical ? <>
        <NumericScrubField fineStep={0.01} label="Width" max={8} min={0.4} onCommit={(widthM) => applyConstraint(constrainPortal3D(project, portal.id, { center: portal.center, widthM, ...portalVertical }))} step={0.1} unit="m" value={portal.widthM} />
        {hybrid ? <>
          <NumericScrubField fineStep={0.01} label="Bottom" max={project.room3d.heightM - 0.4} min={0} onCommit={(bottomM) => applyConstraint(constrainPortal3D(project, portal.id, { center: portal.center, widthM: portal.widthM, ...portalVertical, bottomM }))} step={0.1} unit="m" value={portalVertical.bottomM} />
          <NumericScrubField fineStep={0.01} label="Top" max={project.room3d.heightM} min={0.4} onCommit={(topM) => applyConstraint(constrainPortal3D(project, portal.id, { center: portal.center, widthM: portal.widthM, ...portalVertical, topM }))} step={0.1} unit="m" value={portalVertical.topM} />
        </> : null}
        <NumericScrubField fineStep={0.01} label="Thickness" max={2} min={0.02} onCommit={(thicknessM) => applyConstraint(constrainPortal3D(project, portal.id, { center: portal.center, widthM: portal.widthM, ...portalVertical, thicknessM }))} step={0.05} unit="m" value={portalVertical.thicknessM} />
      </> : null}
      {surface === "room" ? <>
        <NumericScrubField fineStep={0.01} label="Width" max={50} min={1} onCommit={(widthM) => applyConstraint(resizeRoomAndClamp(project, { ...project.room3d, widthM }))} step={0.1} unit="m" value={project.room3d.widthM} />
        <NumericScrubField fineStep={0.01} label="Depth" max={50} min={1} onCommit={(depthM) => applyConstraint(resizeRoomAndClamp(project, { ...project.room3d, depthM }))} step={0.1} unit="m" value={project.room3d.depthM} />
        {hybrid ? <NumericScrubField fineStep={0.01} label="Height" max={12} min={2} onCommit={(heightM) => applyConstraint(resizeRoomAndClamp(project, { ...project.room3d, heightM }))} step={0.1} unit="m" value={project.room3d.heightM} /> : null}
      </> : null}
    </Section>
  ) : null;

  const acoustics = source || primitive || wall || portal || surface ? (
    <Section title="Acoustics">
      {source ? <>
        <NumericScrubField fineStep={0.1} label="Source gain" max={12} min={-60} onCommit={(gainDb) => dispatch({ type: "UPDATE_SOURCE", id: source.id, changes: { gainDb } })} step={1} unit="dB" value={source.gainDb} />
        <label className="check-field"><input aria-label="Loop source" checked={source.loop} onChange={(event) => dispatch({ type: "UPDATE_SOURCE", id: source.id, changes: { loop: event.currentTarget.checked } })} type="checkbox" />Loop</label>
        <div className={`source-asset-state${sourceMissing ? " is-missing" : ""}`}>
          <span>Audio</span><strong>{localAsset?.name ?? builtInAsset?.label ?? source.clipId}</strong>
          {sourceMissing ? <em>Relink required</em> : null}
        </div>
        {(localAsset || sourceMissing) && onRelinkAudio ? <label className="file-button">Relink audio
          <input accept="audio/wav,audio/mpeg,audio/ogg" aria-label="Relink audio" onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            setAudioEditStatus("Relinking audio…");
            void onRelinkAudio(source.clipId, file)
              .then(() => setAudioEditStatus("Audio relinked."))
              .catch((error: unknown) => setAudioEditStatus(error instanceof Error ? error.message : "Relink failed."));
            event.currentTarget.value = "";
          }} type="file" />
        </label> : null}
        {localAsset && onRemoveLocalAudio ? (
          confirmAudioRemoval
            ? <div className="workspace-confirm-card" role="alert"><strong>Remove local audio?</strong><p>The Source stays in place and becomes silent until relinked. The audio file is deleted from this browser.</p><button className="workspace-button-danger" onClick={() => {
              setAudioEditStatus("Removing audio…");
              void onRemoveLocalAudio(source.clipId).then(() => {
                setConfirmAudioRemoval(false);
                setAudioEditStatus("Local audio removed.");
              });
            }} type="button">Remove audio</button><button onClick={() => setConfirmAudioRemoval(false)} type="button">Cancel</button></div>
            : <button className="inspector-inline-button" onClick={() => setConfirmAudioRemoval(true)} type="button">Remove local audio</button>
        ) : null}
        {audioEditStatus ? <p role="status">{audioEditStatus}</p> : null}
      </> : null}
      {primitive ? <MaterialSelect ariaLabel="Primitive material" label="Material" onChange={(materialId) => dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { materialId } })} value={primitive.materialId} /> : null}
      {wall ? <MaterialSelect label="Material" onChange={(materialId) => dispatch({ type: "UPDATE_WALL", id: wall.id, changes: { materialId } })} value={wall.materialId} /> : null}
      {portal ? <button className="inspector-inline-button" onClick={() => dispatch({ type: "UPDATE_PORTAL", id: portal.id, changes: { open: !portal.open } })} type="button">{portal.open ? "Close" : "Open"} Portal</button> : null}
      {surface === "room" || surface === "floor" ? <MaterialSelect ariaLabel="Floor material" label={surface === "room" ? "Floor material" : "Material"} onChange={(floorMaterialId) => dispatch({ type: "SET_ROOM_3D", changes: { floorMaterialId } })} value={project.room3d.floorMaterialId} /> : null}
      {surface === "room" || surface === "ceiling" ? <MaterialSelect ariaLabel="Ceiling material" label={surface === "room" ? "Ceiling material" : "Material"} onChange={(ceilingMaterialId) => dispatch({ type: "SET_ROOM_3D", changes: { ceilingMaterialId } })} value={project.room3d.ceilingMaterialId} /> : null}
    </Section>
  ) : null;

  const active = listener && listener.id === project.activeListenerId;
  // Totals (disabled entities included), because the limits count them too.
  const counts = {
    listeners: project.listeners.length,
    sources: project.scene.sources.length,
    walls: project.scene.walls.length,
    portals: project.scene.portals.length,
    shapes: project.primitives.length,
  };
  const activeListener = project.listeners.find(({ id }) => id === project.activeListenerId);

  return (
    <aside aria-label="Inspector" aria-modal={mobileOpen || undefined} className={`workspace-inspector${mobileOpen ? " is-mobile-open" : ""}`} role={mobileOpen ? "dialog" : undefined}>
      {selection ? (
        <header className="inspector-header">
          <i aria-hidden="true" className={`inspector-kind kind-${kindClass}`} />
          <div className="inspector-heading">
            {source ? <NameInput label="Source name" onCommit={(name) => dispatch({ type: "UPDATE_SOURCE", id: source.id, changes: { name } })} value={source.name} />
              : primitive ? <NameInput label="Primitive name" onCommit={(name) => dispatch({ type: "UPDATE_PRIMITIVE", id: primitive.id, changes: { name } })} value={primitive.name} />
                : <h2 className="inspector-title">{describeEntity(project, selection)}</h2>}
            <p className="inspector-meta">
              <span className="inspector-type">{describeEntityType(project, selection)}</span>
              {active ? <em className="inspector-chip">Active</em> : null}
              {disabled ? <em className="inspector-chip is-off">Off</em> : null}
            </p>
          </div>
          <div className="inspector-header-actions">
            {canToggle ? <button onClick={() => dispatch({ type: "SET_ENTITY_ENABLED", entity: selection, enabled: disabled })} type="button">{disabled ? "Enable" : "Disable"}</button> : null}
            {canDelete || position ? (
              <div className="inspector-more" ref={actionsRef}>
                <button aria-controls="inspector-more-actions" aria-expanded={actionsOpen} aria-label="More actions" className="inspector-more-button" onClick={() => setActionsOpen((open) => !open)} ref={actionsButtonRef} type="button">⋯</button>
                <div className="inspector-more-panel" hidden={!actionsOpen} id="inspector-more-actions">
                  {position ? <button onClick={() => { moveToRoomCentre(); setActionsOpen(false); }} type="button">Move to room centre</button> : null}
                  {canDelete && onDelete ? <button className="is-danger" onClick={() => { setActionsOpen(false); onDelete(); }} type="button">Delete</button> : null}
                </div>
              </div>
            ) : null}
          </div>
        </header>
      ) : (
        <header className="inspector-header"><div className="inspector-heading"><h2 className="inspector-title">Scene</h2><p className="inspector-meta"><span className="inspector-type">Nothing selected</span></p></div></header>
      )}
      {listener && active ? <p className="inspector-note">Selecting a listener makes it the audible receiver.</p> : null}
      {placement}
      {shape}
      {acoustics}
      {primitive && primitive.kind !== "box" ? <HintCard title="Faceted acoustic approximation">Curved surfaces use bounded planar facets for deterministic obstruction and bounded first- and second-order reflections.</HintCard> : null}
      {!selection ? (
        <>
          <Section title="Room">
            <dl className="inspector-summary">
              <div><dt>Size</dt><dd>{project.room3d.widthM} × {project.room3d.depthM}{hybrid ? ` × ${project.room3d.heightM}` : ""} m</dd></div>
              <div><dt>Floor</dt><dd>{materialName(project.room3d.floorMaterialId)}</dd></div>
              {hybrid ? <div><dt>Ceiling</dt><dd>{materialName(project.room3d.ceilingMaterialId)}</dd></div> : null}
              <div><dt>RT60 (mid)</dt><dd>{rt60MidS === null ? "—" : `${rt60MidS.toFixed(2)} s`} <small>approximation</small></dd></div>
              <div><dt>Listening as</dt><dd>{activeListener?.name ?? "—"}</dd></div>
            </dl>
          </Section>
          <Section title="Objects">
            <dl className="inspector-summary">
              <div><dt>Listeners</dt><dd>{counts.listeners} / {WORKSPACE_LIMITS.listeners}</dd></div>
              <div><dt>Sources</dt><dd>{counts.sources} / {WORKSPACE_LIMITS.sources}</dd></div>
              <div><dt>Walls</dt><dd>{counts.walls} / {WORKSPACE_LIMITS.walls}</dd></div>
              <div><dt>Portals</dt><dd>{counts.portals} / {WORKSPACE_LIMITS.portals}</dd></div>
              <div><dt>Shapes</dt><dd>{counts.shapes} / {WORKSPACE_LIMITS.primitives}</dd></div>
            </dl>
            {onAdd ? (
              <div className="inspector-summary-actions">
                <button onClick={() => onAdd("listener")} type="button">Add listener</button>
                <button onClick={() => onAdd("source")} type="button">Add source</button>
                <button onClick={() => onAdd("wall")} type="button">Add wall</button>
              </div>
            ) : null}
            <p className="inspector-note">Select an item in the Outliner or viewport to edit exact values.</p>
          </Section>
        </>
      ) : null}
      {project.notice ? <div className="workspace-notice" role="status"><span>{project.notice.message}</span><button aria-label="Dismiss notice" onClick={() => dispatch({ type: "CLEAR_NOTICE" })} type="button">×</button></div> : null}
    </aside>
  );
});
