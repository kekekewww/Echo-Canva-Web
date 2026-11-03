import type { WorkspaceMode } from "@/domain/workspace/types";

export type WorkspaceAcousticStatus = Readonly<{
  listenerName: string;
  route: "direct" | "portal" | "blocked" | "none";
  gainDb: number | null;
  rt60MidS: number | null;
  worker: "Worker" | "Fallback" | "Stopped";
  /** Human-readable engine detail from the viewport adapter, e.g. "Fallback · <reason>". */
  engineDetail?: string | null;
  computeMs: number | null;
  acceptedRevision?: number | null;
  requestSequence?: number | null;
  workerCount?: number | null;
  sourceComputeMsMax?: number | null;
  sourceComputeMsTotal?: number | null;
}>;

export function formatAcousticPoolMetrics(metrics: Readonly<{
  workerCount?: number | null;
  sourceComputeMsMax?: number | null;
  sourceComputeMsTotal?: number | null;
}>): string {
  if (
    metrics.workerCount === null || metrics.workerCount === undefined
    || metrics.sourceComputeMsMax === null || metrics.sourceComputeMsMax === undefined
    || metrics.sourceComputeMsTotal === null || metrics.sourceComputeMsTotal === undefined
  ) return "Pool metrics unavailable";
  return `${metrics.workerCount} worker${metrics.workerCount === 1 ? "" : "s"} · shard max ${metrics.sourceComputeMsMax.toFixed(2)} ms · shard total ${metrics.sourceComputeMsTotal.toFixed(2)} ms`;
}

/** One engine label: the Worker pool size while healthy, otherwise the adapter's fallback/stopped detail. */
export function formatEngineState(acoustic: Pick<WorkspaceAcousticStatus, "worker" | "engineDetail" | "workerCount"> | null): string {
  if (!acoustic || acoustic.worker === "Stopped") return acoustic?.engineDetail?.startsWith("Stopped") ? acoustic.engineDetail : "Stopped";
  if (acoustic.worker === "Worker") {
    return acoustic.workerCount ? `Worker × ${acoustic.workerCount}` : "Worker";
  }
  return acoustic.engineDetail?.startsWith("Fallback") ? acoustic.engineDetail : "Fallback";
}

export function WorkspaceStatusBar({ mode, revision, persistence, acoustic }: Readonly<{
  mode: WorkspaceMode;
  revision: number;
  persistence: string;
  acoustic: WorkspaceAcousticStatus | null;
}>) {
  const worker = acoustic?.worker ?? "Stopped";
  return (
    <footer
      aria-live="polite"
      className="workspace-statusbar"
      data-acoustic-revision={acoustic?.acceptedRevision ?? ""}
      data-acoustic-sequence={acoustic?.requestSequence ?? ""}
      data-worker-compute-ms={acoustic?.computeMs ?? ""}
      data-worker-count={acoustic?.workerCount ?? ""}
      data-worker-source={worker}
    >
      <div className="statusbar-engine">
        <span className={`statusbar-engine-state is-${worker.toLowerCase()}`} title="Acoustic engine"><i aria-hidden="true" />{formatEngineState(acoustic)}</span>
        <details><summary>Debug</summary><span>{mode === "hybrid-3d" ? "Hybrid 3D" : "Classic 2.5D"} · Rev {revision} · Accepted {acoustic?.acceptedRevision ?? "—"}/{acoustic?.requestSequence ?? "—"} · Local {persistence} · {acoustic?.computeMs === null || acoustic?.computeMs === undefined ? "No timing" : `${acoustic.computeMs.toFixed(2)} ms`} · {formatAcousticPoolMetrics(acoustic ?? {})} · Interactive acoustic approximation</span></details>
      </div>
      <div aria-label="Acoustic readout" className="statusbar-readout" role="group">
        <span title="Active listener"><i aria-hidden="true" className="statusbar-listener" />{acoustic?.listenerName ?? "—"}</span>
        <span>Route {acoustic?.route ?? "none"}</span>
        <span>Gain {acoustic?.gainDb === null || acoustic?.gainDb === undefined ? "—" : `${acoustic.gainDb.toFixed(1)} dB`}</span>
        <span>RT60 {acoustic?.rt60MidS === null || acoustic?.rt60MidS === undefined ? "—" : `${acoustic.rt60MidS.toFixed(2)} s`}</span>
      </div>
    </footer>
  );
}
