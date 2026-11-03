"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SceneEditor } from "@/components/workbench/SceneEditor";
import { CLASSIC_VIEWPORT, frameClassicBounds } from "@/components/workspace/classic-viewport-math";
import type { Rect } from "@/domain/editor/coordinates";
import type { EditorAction } from "@/domain/editor/reducer";
import type { EditorSelection } from "@/domain/editor/state";
import { createProjectProjectionCache, projectClassicScene } from "@/domain/workspace/projections";
import type { ProjectAction, WorkspaceProject } from "@/domain/workspace/types";
import { useAcousticFrame, type AcousticFrameResult } from "@/hooks/useAcousticFrame";
import type { AudioEngine } from "@/audio/AudioEngine";
import type { WorkspaceAcousticStatus } from "@/components/workspace/WorkspaceStatusBar";
import { ViewportHelp, type ViewportHelpItem } from "@/components/workspace/ViewportHelp";
import { useCameraTween } from "@/hooks/useCameraTween";

export function resolveClassicAcousticPresentation(acoustic: AcousticFrameResult): Readonly<{
  frame: AcousticFrameResult["frame"];
  worker: WorkspaceAcousticStatus["worker"];
  headerStatus: string;
}> {
  const fallback = acoustic.metrics?.source === "fallback" || acoustic.fallbackNotice !== null;
  return {
    frame: acoustic.frame,
    worker: acoustic.frame ? fallback ? "Fallback" : "Worker" : "Stopped",
    headerStatus: acoustic.fallbackNotice
      ? `Fallback · ${acoustic.fallbackNotice}`
      : acoustic.frame ? "Worker" : "Starting",
  };
}

const CLASSIC_HELP: readonly ViewportHelpItem[] = [
  { gesture: "Drag a source, listener or shape", action: "Move it on the floor plan" },
  { gesture: "Drag a wall endpoint", action: "Reshape the wall" },
  { gesture: "Click a Portal", action: "Select it; open or close it in the Inspector" },
  { gesture: "Middle-drag or Shift-drag empty space", action: "Pan" },
  { gesture: "Wheel", action: "Zoom at the pointer" },
];

export function ClassicViewportAdapter({ project, dispatch, audioEngine, wallPlacementFirst, onWallPlacementPoint, onAcousticStatus }: Readonly<{
  project: WorkspaceProject;
  dispatch: (action: ProjectAction) => void;
  audioEngine: AudioEngine;
  wallPlacementFirst?: Readonly<{ x: number; y: number }> | null;
  onWallPlacementPoint?: (point: Readonly<{ x: number; y: number }>) => void;
  onAcousticStatus?: (status: WorkspaceAcousticStatus) => void;
}>) {
  const [projectScene] = useState(() => createProjectProjectionCache(projectClassicScene));
  const scene = useMemo(() => projectScene(project), [project, projectScene]);
  const acoustic = useAcousticFrame(scene);
  const presentation = resolveClassicAcousticPresentation(acoustic);
  const acceptedFrame = presentation.frame;
  useEffect(() => {
    if (acceptedFrame) audioEngine.applyAcousticFrame(acceptedFrame);
  }, [acceptedFrame, audioEngine]);
  useEffect(() => {
    const active = project.listeners.find(({ id }) => id === project.activeListenerId);
    const sourceId = project.selection?.type === "source" ? project.selection.id : scene.sources[0]?.id;
    const source = acceptedFrame?.sources.find(({ sourceId: id }) => id === sourceId);
    onAcousticStatus?.({
      listenerName: active?.name ?? "Listener",
      route: source?.routeType ?? "none",
      gainDb: source?.dryGainDb ?? null,
      rt60MidS: acceptedFrame?.room.rt60S.mid ?? null,
      worker: acceptedFrame ? presentation.worker : "Stopped",
      engineDetail: presentation.headerStatus,
      computeMs: acceptedFrame ? acoustic.metrics?.computeMs ?? null : null,
      acceptedRevision: acceptedFrame?.revision ?? null,
      requestSequence: acceptedFrame ? acoustic.metrics?.requestSequence ?? null : null,
      workerCount: acceptedFrame ? acoustic.metrics?.workerCount ?? null : null,
      sourceComputeMsMax: acceptedFrame ? acoustic.metrics?.sourceComputeMsMax ?? null : null,
      sourceComputeMsTotal: acceptedFrame ? acoustic.metrics?.sourceComputeMsTotal ?? null : null,
    });
  }, [acceptedFrame, acoustic.metrics, onAcousticStatus, presentation.headerStatus, presentation.worker, project.activeListenerId, project.listeners, project.selection, scene.sources]);
  const selection: EditorSelection = project.selection?.type === "listener"
    ? { type: "listener" }
    : project.selection?.type === "source" || project.selection?.type === "wall" || project.selection?.type === "portal"
      ? { type: project.selection.type, id: project.selection.id }
      : null;

  const onCameraChange = useCallback((camera: WorkspaceProject["view"]["camera"]) => {
    dispatch({ type: "SET_VIEW_STATE", changes: { camera } });
  }, [dispatch]);
  // Home / Frame All animate locally and commit once; canvas pan/zoom stays direct (#37).
  const cameraTween = useCameraTween(project.view.camera, onCameraChange);

  function frameAll(): void {
    const xs = scene.room.outerPolygon.map(({ x }) => x);
    const ys = scene.room.outerPolygon.map(({ y }) => y);
    const worldBounds: Rect = {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
    const points = [
      ...scene.room.outerPolygon,
      ...scene.walls.flatMap(({ a, b }) => [a, b]),
      ...scene.portals.map(({ center }) => center),
      ...scene.sources.map(({ position }) => position),
      scene.listener.position,
    ];
    cameraTween.animateTo(frameClassicBounds(points, worldBounds, CLASSIC_VIEWPORT, cameraTween.camera));
  }

  function adapt(action: EditorAction): void {
    switch (action.type) {
      case "SELECT_OBJECT":
        dispatch({ type: "SELECT_ENTITY", selection: action.selection?.type === "listener"
          ? { type: "listener", id: project.activeListenerId }
          : action.selection });
        break;
      case "MOVE_LISTENER": {
        const listener = project.listeners.find(({ id }) => id === project.activeListenerId)!;
        dispatch({ type: "UPDATE_LISTENER", id: listener.id, changes: {
          position: { ...listener.position, x: action.position.x, z: action.position.y },
        } });
        break;
      }
      case "MOVE_SOURCE":
        dispatch({ type: "MOVE_SOURCE", id: action.sourceId, position: {
          x: action.position.x,
          y: project.sourceHeightsM[action.sourceId] ?? 1.5,
          z: action.position.y,
        } });
        break;
      case "ADD_WALL": dispatch({ type: "ADD_WALL", wall: action.wall }); break;
      case "MOVE_WALL_ENDPOINT": dispatch({ type: "UPDATE_WALL", id: action.wallId, changes: { [action.endpoint]: action.position } }); break;
      case "DELETE_WALL": dispatch({ type: "DELETE_WALL", id: action.wallId }); break;
      case "SET_WALL_MATERIAL": dispatch({ type: "UPDATE_WALL", id: action.wallId, changes: { materialId: action.materialId } }); break;
      case "TOGGLE_PORTAL": {
        const portal = project.scene.portals.find(({ id }) => id === action.portalId);
        if (portal) dispatch({ type: "UPDATE_PORTAL", id: portal.id, changes: { open: !portal.open } });
        break;
      }
      case "REPLACE_SCENE": dispatch({ type: "REPLACE_SCENE", scene: action.scene }); break;
      case "LOAD_PRESET":
      case "SET_MODE":
      case "SET_AUDIO_STATUS":
        break;
    }
  }

  return (
    <section className="workspace-viewport-panel" data-camera-animating={cameraTween.animating ? "true" : "false"} data-testid="classic-workspace-viewport">
      <header className="viewport-tools">
        <span>{scene.name}</span>
        <div aria-label="Camera views" className="viewport-tools-group" role="group">
          <button onClick={() => cameraTween.animateTo({ ...cameraTween.camera, zoom: 1, panX: 0, panY: 0 })} type="button">Home</button>
          <button onClick={frameAll} type="button">Frame All</button>
        </div>
        <ViewportHelp items={CLASSIC_HELP} label="2.5D viewport help" />
      </header>
      <SceneEditor
        acousticFrame={acceptedFrame}
        camera={cameraTween.camera}
        dispatch={adapt}
        onCameraChange={cameraTween.change}
        onMovePrimitive={(id, position) => {
          const primitive = project.primitives.find((candidate) => candidate.id === id);
          if (primitive) dispatch({ type: "UPDATE_PRIMITIVE", id, changes: { position: { ...primitive.position, x: position.x, z: position.y } } });
        }}
        onSelectPrimitive={(id) => dispatch({ type: "SELECT_ENTITY", selection: { type: "primitive", id } })}
        onWallPlacementPoint={onWallPlacementPoint}
        primitives={project.primitives.filter(({ id }) => !project.disabledEntityIds.includes(id))}
        scene={scene}
        selectedPrimitiveId={project.selection?.type === "primitive" ? project.selection.id : null}
        selection={selection}
        wallPlacementFirst={wallPlacementFirst}
      />
    </section>
  );
}
