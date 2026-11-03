"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { AddObjectMenu } from "@/components/workspace/AddObjectMenu";
import { AudioAssetPicker } from "@/components/workspace/AudioAssetPicker";
import { ClassicViewportAdapter } from "@/components/workspace/ClassicViewportAdapter";
import { ContextInspector, type InspectorAddKind } from "@/components/workspace/ContextInspector";
import { HybridViewportAdapter } from "@/components/workspace/HybridViewportAdapter";
import { SceneOutliner } from "@/components/workspace/SceneOutliner";
import { WorkspaceStatusBar, type WorkspaceAcousticStatus } from "@/components/workspace/WorkspaceStatusBar";
import { PROJECT_TRIGGER_ID, WorkspaceToolbar } from "@/components/workspace/WorkspaceToolbar";
import { WorkspaceProjectTools } from "@/components/workspace/WorkspaceProjectTools";
import type { WorkspaceMode } from "@/domain/workspace/types";
import { cascadedPortalCount, deleteActionFor, describeEntity, entityExists } from "@/domain/workspace/entities";
import { createDefaultClassicProject, createDefaultHybridProject } from "@/domain/workspace/defaults";
import type { EntityRef } from "@/domain/workspace/types";
import type { PrimitiveKind } from "@/domain/workspace/types";
import { MAX_PRIMITIVES } from "@/domain/workspace/primitives";
import { useWorkspaceProjects } from "@/hooks/useWorkspaceProjects";
import { useLocalAudioLibrary } from "@/hooks/useLocalAudioLibrary";
import { installGateCAudioRenderValidation } from "@/audio/gate-c-render-validation";
import { AudioEngine } from "@/audio/AudioEngine";
import type { PreviewMode } from "@/domain/editor/state";
import { createProjectProjectionCache, projectClassicScene } from "@/domain/workspace/projections";
import { useAudioEngine } from "@/hooks/useAudioEngine";

/**
 * Feedback for an undoable action, with an Undo button. It stays visible only while the action is the latest
 * history step in its mode (same depth and revision, and for deletes the entity is still gone), so its Undo can
 * never revert a different edit.
 */
type UndoToast = Readonly<{
  id: number;
  message: string;
  mode: WorkspaceMode;
  depthAfter: number;
  revisionAfter: number;
  deleted?: EntityRef;
}>;

const UNDO_TOAST_MS = 8000;
const HISTORY_LIMIT = 50;

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest?.("input, textarea, select, [contenteditable='true']"));
}

export function UnifiedWorkspace({ initialMode }: Readonly<{ initialMode?: WorkspaceMode }>) {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const workspace = useWorkspaceProjects(initialMode);
  const dispatchWorkspace = workspace.dispatch;
  const audioLibrary = useLocalAudioLibrary();
  const relinkLocalAudio = audioLibrary.relink;
  const removeLocalAudio = audioLibrary.remove;
  const [addOpen, setAddOpen] = useState(false);
  const [audioPickerOpen, setAudioPickerOpen] = useState(false);
  const [wallPlacement, setWallPlacement] = useState<Readonly<{
    mode: WorkspaceMode;
    first: Readonly<{ x: number; z: number }> | null;
  }> | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("simulated");
  const [playing, setPlaying] = useState(false);
  const [audioPending, setAudioPending] = useState(false);
  const audioPendingRef = useRef(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<UndoToast | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"outliner" | "inspector" | null>(null);
  const [acousticStatus, setAcousticStatus] = useState<WorkspaceAcousticStatus | null>(null);
  const reportAcousticStatus = useCallback((status: WorkspaceAcousticStatus) => setAcousticStatus(status), []);
  const [audioEngine] = useState(() => new AudioEngine({ resolveAudioAsset: audioLibrary.resolveAudioAsset }));
  const [projectAudibleScene] = useState(() => createProjectProjectionCache((project) => {
    const scene = projectClassicScene(project);
    const missing = new Set(project.missingAudioAssetIds);
    return { ...scene, sources: scene.sources.filter(({ clipId }) => !missing.has(clipId)) };
  }));
  const activeScene = useMemo(
    () => projectAudibleScene(workspace.activeProject),
    [projectAudibleScene, workspace.activeProject],
  );
  const audio = useAudioEngine(
    activeScene,
    previewMode,
    null,
    null,
    audioLibrary.resolveAudioAsset,
    audioEngine,
    true,
  );
  const selectOutlinerEntity = useCallback((selection: EntityRef) => {
    dispatchWorkspace({ type: "SELECT_ENTITY", selection });
    setMobilePanel(null);
  }, [dispatchWorkspace]);
  const localAssets = useMemo(() => Object.values({
    ...workspace.activeProject.localAudioMetadata,
    ...Object.fromEntries(audioLibrary.records.map((record) => [record.id, {
      id: record.id,
      name: record.name,
      mimeType: record.mimeType,
      size: record.size,
      createdAt: record.createdAt,
    }])),
  }), [workspace.activeProject.localAudioMetadata, audioLibrary.records]);
  const relinkAudio = useCallback(async (clipId: string, file: File) => {
    const record = await relinkLocalAudio(clipId, file);
    dispatchWorkspace({ type: "SET_LOCAL_AUDIO_METADATA", metadata: {
      id: record.id,
      name: record.name,
      mimeType: record.mimeType,
      size: record.size,
      createdAt: record.createdAt,
    } });
    dispatchWorkspace({ type: "SET_AUDIO_ASSET_MISSING", clipId, missing: false });
    return record.id;
  }, [dispatchWorkspace, relinkLocalAudio]);
  const removeAudio = useCallback(async (clipId: string) => {
    await removeLocalAudio(clipId);
    dispatchWorkspace({ type: "SET_AUDIO_ASSET_MISSING", clipId, missing: true });
  }, [dispatchWorkspace, removeLocalAudio]);

  useEffect(() => installGateCAudioRenderValidation(), []);

  const showUndoToast = useCallback((toast: Omit<UndoToast, "id" | "mode" | "depthAfter">) => {
    setUndoToast({
      ...toast,
      id: Date.now(),
      mode: workspace.activeMode,
      depthAfter: Math.min(workspace.historyDepth + 1, HISTORY_LIMIT),
    });
  }, [workspace.activeMode, workspace.historyDepth]);

  const deleteSelection = useCallback(() => {
    const project = workspace.activeProject;
    const selection = project.selection;
    const action = selection ? deleteActionFor(selection) : null;
    if (!selection || !action) return;
    const portals = cascadedPortalCount(project, selection);
    const label = describeEntity(project, selection);
    dispatchWorkspace(action);
    showUndoToast({
      message: `Deleted ${label}${portals ? ` and ${portals} Portal${portals === 1 ? "" : "s"}` : ""}`,
      revisionAfter: project.revision + 1,
      deleted: selection,
    });
  }, [dispatchWorkspace, showUndoToast, workspace.activeProject]);

  const resetActiveProject = useCallback(() => {
    const mode = workspace.activeMode;
    workspace.resetActiveProject();
    showUndoToast({
      message: `Reset ${mode === "hybrid-3d" ? "3D" : "2.5D"} project`,
      revisionAfter: (mode === "hybrid-3d" ? createDefaultHybridProject() : createDefaultClassicProject()).revision,
    });
  }, [showUndoToast, workspace]);

  // Stable callback for the memoised Inspector; addObject itself reads the latest project on each call.
  const addObjectRef = useRef(addObject);
  useEffect(() => { addObjectRef.current = addObject; });
  const addFromInspector = useCallback((kind: InspectorAddKind) => addObjectRef.current(kind), []);

  const toastVisible = undoToast !== null
    && undoToast.mode === workspace.activeMode
    && workspace.historyDepth === undoToast.depthAfter
    && workspace.activeProject.revision === undoToast.revisionAfter
    && (!undoToast.deleted || !entityExists(workspace.activeProject, undoToast.deleted));

  useEffect(() => {
    if (!undoToast) return undefined;
    const timer = window.setTimeout(() => setUndoToast((current) => current?.id === undoToast.id ? null : current), UNDO_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [undoToast]);

  useEffect(() => {
    function shortcuts(event: KeyboardEvent): void {
      if (event.key === "Escape" && addOpen) { setAddOpen(false); return; }
      if (event.key === "Escape" && audioPickerOpen) { setAudioPickerOpen(false); return; }
      if (event.key === "Escape" && confirmClearAll) {
        setConfirmClearAll(false);
        return;
      }
      if (event.key === "Escape" && projectOpen) {
        setProjectOpen(false);
        document.getElementById(PROJECT_TRIGGER_ID)?.focus();
        return;
      }
      if (event.key === "Escape" && wallPlacement) {
        setWallPlacement(null);
        return;
      }
      if (event.key === "Escape" && mobilePanel) {
        setMobilePanel(null);
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && !event.ctrlKey && !event.metaKey && !event.altKey
        && !isEditableTarget(event.target)
        && (event.target === document.body || (event.target as Element | null)?.closest?.(".workspace-outliner, .workspace-viewport-panel"))) {
        event.preventDefault();
        deleteSelection();
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) workspace.redo();
        else workspace.undo();
      }
    }
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [addOpen, audioPickerOpen, confirmClearAll, deleteSelection, mobilePanel, projectOpen, wallPlacement, workspace]);

  useEffect(() => {
    if (!projectOpen) return undefined;
    function closeOnOutsidePointer(event: PointerEvent): void {
      const target = event.target as Element | null;
      if (target?.closest?.(`#${PROJECT_TRIGGER_ID}, #workspace-project-menu`)) return;
      setProjectOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [projectOpen]);

  function downloadRecoveryRecord(): void {
    if (!workspace.recoveryRaw) return;
    const blob = new Blob([workspace.recoveryRaw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `echo-canvas-${workspace.activeMode}-unread-cache.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function addObject(kind: "listener" | "source" | "wall" | "portal" | PrimitiveKind): void {
    const project = workspace.activeProject;
    const suffix = `${project.revision + 1}`;
    if (kind === "listener") {
      workspace.dispatch({
        type: "ADD_LISTENER",
        listener: {
          id: `listener_${suffix}`,
          name: `Listener ${project.listeners.length + 1}`,
          position: { x: project.room3d.widthM / 2, y: 1.5, z: project.room3d.depthM / 2 },
          headingDeg: 0,
          enabled: true,
        },
      });
      return;
    }
    if (kind === "source") {
      setAudioPickerOpen(true);
      return;
    }
    if (kind === "wall") {
      setWallPlacement({ mode: project.mode, first: null });
      return;
    }
    if (kind === "box" || kind === "cylinder" || kind === "sphere") {
      const count = project.primitives.filter((primitive) => primitive.kind === kind).length + 1;
      const label = kind[0]!.toUpperCase() + kind.slice(1);
      workspace.dispatch({
        type: "ADD_PRIMITIVE",
        primitive: {
          id: `${kind}_${suffix}`,
          name: `${label} ${count}`,
          kind,
          position: {
            x: project.room3d.widthM / 2,
            y: Math.min(0.75, project.room3d.heightM / 2),
            z: project.room3d.depthM / 2,
          },
          dimensions: { x: 1.5, y: 1.5, z: 1.5 },
          rotationYDeg: 0,
          materialId: "wood_medium",
        },
      });
      return;
    }
    const selectedWall = project.selection?.type === "wall"
      ? project.scene.walls.find(({ id }) => id === project.selection?.id)
      : null;
    if (!selectedWall || project.disabledEntityIds.includes(selectedWall.id)) {
      workspace.dispatch({ type: "SET_NOTICE", notice: { code: "host_wall_required", message: "Select an enabled Wall before adding a Portal." } });
      return;
    }
    workspace.dispatch({
      type: "ADD_PORTAL",
      portal: {
        id: `portal_${suffix}`,
        wallId: selectedWall.id,
        center: { x: (selectedWall.a.x + selectedWall.b.x) / 2, y: (selectedWall.a.y + selectedWall.b.y) / 2 },
        widthM: 1,
        heightM: 2.1,
        open: true,
        lossDb: 3,
      },
    });
  }

  function placeWallPoint(point: Readonly<{ x: number; z: number }>): void {
    const placement = wallPlacement;
    if (!placement || placement.mode !== workspace.activeMode) return;
    if (!placement.first) {
      setWallPlacement({ ...placement, first: point });
      return;
    }
    if (Math.hypot(point.x - placement.first.x, point.z - placement.first.z) < 0.1) {
      workspace.dispatch({ type: "SET_NOTICE", notice: { code: "entity_missing", message: "Wall endpoints must be at least 0.1 m apart." } });
      return;
    }
    const project = workspace.activeProject;
    workspace.dispatch({
      type: "ADD_WALL",
      wall: {
        id: `wall_${project.revision + 1}`,
        a: { x: placement.first.x, y: placement.first.z },
        b: { x: point.x, y: point.z },
        thicknessM: 0.15,
        materialId: "concrete_hard",
        kind: "partition",
      },
    });
    setWallPlacement(null);
  }

  function addSource(clipId: string, assetName: string): void {
    const project = workspace.activeProject;
    workspace.dispatch({
      type: "ADD_SOURCE",
      heightM: 1.5,
      source: {
        id: `source_${project.revision + 1}`,
        name: assetName.replace(/\.[^.]+$/, ""),
        clipId,
        sourceType: "point",
        position: { x: project.room3d.widthM * 0.7, y: project.room3d.depthM * 0.5 },
        gainDb: -6,
        loop: true,
      },
    });
    const metadata = audioLibrary.records.find(({ id }) => id === clipId);
    if (metadata) workspace.dispatch({ type: "SET_LOCAL_AUDIO_METADATA", metadata: {
      id: metadata.id,
      name: metadata.name,
      mimeType: metadata.mimeType,
      size: metadata.size,
      createdAt: metadata.createdAt,
    } });
    setAudioPickerOpen(false);
  }

  async function togglePlaying(): Promise<void> {
    // Ignore repeated activation while the AudioContext starts or stops; the button shows the pending state.
    if (audioPendingRef.current) return;
    audioPendingRef.current = true;
    setAudioPending(true);
    setAudioError(null);
    try {
      if (playing) await audio.stopAudio();
      else await audio.startAudio();
      setPlaying(!playing);
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : "Audio is unavailable.");
    } finally {
      audioPendingRef.current = false;
      setAudioPending(false);
    }
  }

  if (!hydrated) return <main className="unified-workspace workspace-loading" aria-label="Loading Echo Canvas" />;

  return (
    <main
      className="unified-workspace"
      data-audio-contexts={audio.diagnostics.contextCreations}
      data-audio-graphs={audio.diagnostics.graphCount}
      data-testid="unified-workspace"
      data-mode={workspace.activeMode}
      onPointerCancelCapture={(event) => {
        if ((event.target as Element).closest?.(".numeric-scrub-label")) workspace.endHistoryTransaction();
      }}
      onPointerDownCapture={(event) => {
        if ((event.target as Element).closest?.(".numeric-scrub-label")) workspace.beginHistoryTransaction();
      }}
      onPointerUpCapture={(event) => {
        if ((event.target as Element).closest?.(".numeric-scrub-label")) workspace.endHistoryTransaction();
      }}
    >
      <WorkspaceToolbar
        audioPending={audioPending}
        canRedo={workspace.canRedo}
        canUndo={workspace.canUndo}
        mode={workspace.activeMode}
        onAdd={() => { setProjectOpen(false); setAddOpen(true); }}
        onModeChange={workspace.setActiveMode}
        onPreviewModeChange={setPreviewMode}
        onRedo={workspace.redo}
        onToggleProject={() => setProjectOpen((open) => !open)}
        onUndo={workspace.undo}
        onTogglePlaying={() => void togglePlaying()}
        playing={playing}
        previewMode={previewMode}
        projectMenu={(
          // Kept mounted while closed so an unapplied AI candidate or prompt survives closing the menu.
          <div aria-label="Project" className="workspace-project-menu" hidden={!projectOpen} id="workspace-project-menu" role="dialog">
            <WorkspaceProjectTools
              dispatch={workspace.dispatch}
              localAssets={localAssets}
              onDone={() => setProjectOpen(false)}
              onRequestClearAll={() => { setProjectOpen(false); setConfirmClearAll(true); }}
              onRequestReset={() => { setProjectOpen(false); resetActiveProject(); }}
              project={workspace.activeProject}
            />
          </div>
        )}
        projectOpen={projectOpen}
        sceneName={workspace.activeProject.scene.name}
        onShowInspector={() => setMobilePanel("inspector")}
        onShowOutliner={() => setMobilePanel("outliner")}
      />
      {(workspace.persistenceStatus !== "saved" || audioLibrary.warning) ? <div className="workspace-persistence-warning" role="status"><strong>Memory-only warning</strong><span>{audioLibrary.warning ?? workspace.persistenceStatus}</span></div> : null}
      {workspace.recoveryRaw ? <div className="workspace-confirm-card workspace-recovery-card" role="status"><strong>Project cache recovery</strong><p>A safe preset is loaded. Download the unread record before replacing it.</p><button className="workspace-button-primary" onClick={downloadRecoveryRecord} type="button">Download unread cache</button></div> : null}
      {confirmClearAll ? <div aria-label="Clear all local data" aria-modal="true" className="workspace-confirm-card workspace-floating-card" role="alertdialog"><strong>Clear all local data?</strong><p>This removes both local projects and every local audio file. It cannot be undone.</p><button autoFocus className="workspace-button-danger" onClick={() => void audioLibrary.clear().then(() => { workspace.clearAllProjects(); setConfirmClearAll(false); })} type="button">Confirm clear all</button><button onClick={() => setConfirmClearAll(false)} type="button">Cancel</button></div> : null}
      <div className="workspace-toast-region">
        {audioError ? <div className="workspace-error" role="alert"><span>{audioError}</span><button onClick={() => void togglePlaying()} type="button">Retry</button></div> : null}
        {toastVisible && undoToast ? (
          <div className="workspace-toast" key={undoToast.id} role="status">
            <span>{undoToast.message}</span>
            <button className="workspace-toast-undo" onClick={() => { workspace.undo(); setUndoToast(null); }} type="button">Undo</button>
            <button aria-label="Dismiss" className="workspace-toast-dismiss" onClick={() => setUndoToast(null)} type="button">×</button>
          </div>
        ) : null}
      </div>
      {addOpen ? <AddObjectMenu
        availability={{
          listener: { enabled: workspace.activeProject.listeners.length < 8, reason: workspace.activeProject.listeners.length >= 8 ? "Limit: 8 listeners" : undefined },
          source: { enabled: workspace.activeProject.scene.sources.length < 4, reason: workspace.activeProject.scene.sources.length >= 4 ? "Limit: 4 sources" : undefined },
          wall: { enabled: workspace.activeProject.scene.walls.length < 100, reason: workspace.activeProject.scene.walls.length >= 100 ? "Limit: 100 walls" : undefined },
          box: { enabled: workspace.activeProject.primitives.length < MAX_PRIMITIVES, reason: workspace.activeProject.primitives.length >= MAX_PRIMITIVES ? `Limit: ${MAX_PRIMITIVES} shapes` : undefined },
          cylinder: { enabled: workspace.activeProject.primitives.length < MAX_PRIMITIVES, reason: workspace.activeProject.primitives.length >= MAX_PRIMITIVES ? `Limit: ${MAX_PRIMITIVES} shapes` : undefined },
          sphere: { enabled: workspace.activeProject.primitives.length < MAX_PRIMITIVES, reason: workspace.activeProject.primitives.length >= MAX_PRIMITIVES ? `Limit: ${MAX_PRIMITIVES} shapes` : undefined },
          portal: {
            enabled: workspace.activeProject.scene.portals.length < 8 && workspace.activeProject.selection?.type === "wall" && !workspace.activeProject.disabledEntityIds.includes(workspace.activeProject.selection.id),
            reason: workspace.activeProject.scene.portals.length >= 8
              ? "Limit: 8 Portals"
              : workspace.activeProject.selection?.type === "wall" && !workspace.activeProject.disabledEntityIds.includes(workspace.activeProject.selection.id)
                ? undefined
                : "Select an enabled Wall first",
          },
        }}
        onAdd={addObject}
        onClose={() => setAddOpen(false)}
      /> : null}
      {wallPlacement ? <div className="workspace-placement-card" role="status"><strong>Add Wall</strong><span>{wallPlacement.first ? "Choose endpoint B" : "Choose endpoint A"}</span><button onClick={() => setWallPlacement(null)} type="button">Cancel</button></div> : null}
      {audioPickerOpen ? <AudioAssetPicker
        onChoose={addSource}
        onClose={() => setAudioPickerOpen(false)}
        onUpload={audioLibrary.add}
        records={audioLibrary.records}
        warning={audioLibrary.warning}
      /> : null}
      <div className="workspace-grid">
        <SceneOutliner mobileOpen={mobilePanel === "outliner"} project={workspace.activeProject} onSelect={selectOutlinerEntity} />
        {workspace.activeMode === "classic-2d5d"
          ? <ClassicViewportAdapter
            audioEngine={audioEngine}
            dispatch={workspace.dispatch}
            onWallPlacementPoint={wallPlacement?.mode === "classic-2d5d" ? (point) => placeWallPoint({ x: point.x, z: point.y }) : undefined}
            onAcousticStatus={reportAcousticStatus}
            project={workspace.activeProject}
            wallPlacementFirst={wallPlacement?.mode === "classic-2d5d" && wallPlacement.first ? { x: wallPlacement.first.x, y: wallPlacement.first.z } : null}
          />
          : <HybridViewportAdapter
            audioEngine={audioEngine}
            dispatch={workspace.dispatch}
            onWallPlacementPoint={wallPlacement?.mode === "hybrid-3d" ? placeWallPoint : undefined}
            onAcousticStatus={reportAcousticStatus}
            project={workspace.activeProject}
            wallPlacementFirst={wallPlacement?.mode === "hybrid-3d" ? wallPlacement.first : null}
          />}
        <ContextInspector
          dispatch={workspace.dispatch}
          localAssets={localAssets}
          onRelinkAudio={relinkAudio}
          onRemoveLocalAudio={removeAudio}
          onAdd={addFromInspector}
          onDelete={deleteSelection}
          rt60MidS={workspace.activeProject.selection ? null : acousticStatus?.rt60MidS ?? null}
          mobileOpen={mobilePanel === "inspector"}
          project={workspace.activeProject}
        />
      </div>
      {mobilePanel ? <button aria-label="Close panel" className="workspace-drawer-backdrop" onClick={() => setMobilePanel(null)} type="button" /> : null}
      <WorkspaceStatusBar acoustic={acousticStatus} mode={workspace.activeMode} persistence={workspace.persistenceStatus} revision={workspace.activeProject.revision} />
    </main>
  );
}
