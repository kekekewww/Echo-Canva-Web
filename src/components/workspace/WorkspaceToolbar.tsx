import type { ReactNode } from "react";

import type { PreviewMode } from "@/domain/editor/state";
import type { WorkspaceMode } from "@/domain/workspace/types";

type Props = Readonly<{
  mode: WorkspaceMode;
  sceneName: string;
  projectOpen: boolean;
  projectMenu?: ReactNode;
  /** Add menu / audio picker, anchored under the Add button. */
  addMenu?: ReactNode;
  canUndo: boolean;
  canRedo: boolean;
  playing: boolean;
  audioPending: boolean;
  previewMode: PreviewMode;
  onModeChange: (mode: WorkspaceMode) => void;
  onToggleProject: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAdd: () => void;
  onTogglePlaying: () => void;
  onPreviewModeChange: (mode: PreviewMode) => void;
  onShowOutliner: () => void;
  onShowInspector: () => void;
}>;

export const PROJECT_TRIGGER_ID = "workspace-project-trigger";

/**
 * Toolbar groups, left to right: project (brand + scene/project menu), mode, edit (Add, Undo, Redo),
 * session (primary Play + Simulated/Raw). Project-level and destructive actions live in the project menu.
 */
export function WorkspaceToolbar(props: Props) {
  const playLabel = props.audioPending
    ? props.playing ? "Stopping…" : "Starting…"
    : props.playing ? "Stop" : "Play";
  return (
    <header className="workspace-toolbar">
      <div className="workspace-toolbar-start">
        <div className="workspace-brand"><strong>Echo Canvas</strong><span>Acoustic scene editor</span></div>
        <div className="workspace-project-anchor">
          <button
            aria-controls="workspace-project-menu"
            aria-expanded={props.projectOpen}
            aria-haspopup="dialog"
            aria-label={`Project: ${props.sceneName}`}
            className="workspace-project-trigger"
            id={PROJECT_TRIGGER_ID}
            onClick={props.onToggleProject}
            type="button"
          >
            <span>{props.sceneName}</span><span aria-hidden="true">▾</span>
          </button>
          {props.projectMenu}
        </div>
      </div>
      <div className="workspace-mode-switch" role="group" aria-label="Editor mode">
        <button aria-pressed={props.mode === "classic-2d5d"} onClick={() => props.onModeChange("classic-2d5d")} type="button">2.5D</button>
        <button aria-pressed={props.mode === "hybrid-3d"} onClick={() => props.onModeChange("hybrid-3d")} type="button">3D</button>
      </div>
      <div className="workspace-toolbar-actions">
        <button className="mobile-panel-toggle" onClick={props.onShowOutliner} type="button">Scene</button>
        <button className="mobile-panel-toggle" onClick={props.onShowInspector} type="button">Inspector</button>
        <div className="toolbar-group" role="group" aria-label="Edit">
          <div className="toolbar-anchor">
            <button data-testid="add-object" onClick={props.onAdd} type="button">＋ Add</button>
            {props.addMenu}
          </div>
          <button aria-label="Undo" className="toolbar-icon" disabled={!props.canUndo} onClick={props.onUndo} type="button" title="Undo (Ctrl+Z)">↶</button>
          <button aria-label="Redo" className="toolbar-icon" disabled={!props.canRedo} onClick={props.onRedo} type="button" title="Redo (Ctrl+Shift+Z)">↷</button>
        </div>
        <div className="toolbar-group" role="group" aria-label="Audio preview">
          <button
            aria-busy={props.audioPending || undefined}
            aria-pressed={props.playing}
            className="workspace-play"
            onClick={props.onTogglePlaying}
            type="button"
          >
            <span aria-hidden="true">{props.playing ? "■" : "▶"}</span>{playLabel}
          </button>
          <div className="workspace-segmented" role="group" aria-label="Preview mode">
            <button aria-pressed={props.previewMode === "simulated"} onClick={() => props.onPreviewModeChange("simulated")} type="button">Simulated</button>
            <button aria-pressed={props.previewMode === "raw"} onClick={() => props.onPreviewModeChange("raw")} type="button">Raw</button>
          </div>
        </div>
      </div>
    </header>
  );
}
