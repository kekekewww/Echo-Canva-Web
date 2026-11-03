import { describe, expect, it } from "vitest";

import {
  formatAcousticPoolMetrics,
  formatEngineState,
  type WorkspaceAcousticStatus,
} from "@/components/workspace/WorkspaceStatusBar";

const hybridCompatibleStatus: WorkspaceAcousticStatus = {
  listenerName: "Listener",
  route: "direct",
  gainDb: 0,
  rt60MidS: 1,
  worker: "Worker",
  computeMs: 2,
};

describe("workspace acoustic pool metrics", () => {
  it("formats active Worker and shard timing metrics", () => {
    expect(formatAcousticPoolMetrics({
      workerCount: 3,
      sourceComputeMsMax: 2.5,
      sourceComputeMsTotal: 5.75,
    })).toBe("3 workers · shard max 2.50 ms · shard total 5.75 ms");
  });

  it("keeps old-shape metrics compatible", () => {
    expect(hybridCompatibleStatus.worker).toBe("Worker");
    expect(formatAcousticPoolMetrics({})).toBe("Pool metrics unavailable");
  });
});

describe("workspace engine state label", () => {
  it("shows the Worker pool size while the Worker path is accepted", () => {
    expect(formatEngineState({ worker: "Worker", workerCount: 2, engineDetail: "Worker" })).toBe("Worker × 2");
    expect(formatEngineState({ worker: "Worker", workerCount: null })).toBe("Worker");
  });

  it("keeps the adapter's fallback reason and stopped detail", () => {
    expect(formatEngineState({ worker: "Fallback", engineDetail: "Fallback · Worker unavailable" })).toBe("Fallback · Worker unavailable");
    expect(formatEngineState({ worker: "Fallback", engineDetail: null })).toBe("Fallback");
    expect(formatEngineState({ worker: "Stopped", engineDetail: "Stopped · Waiting for matching acoustic frame" }))
      .toBe("Stopped · Waiting for matching acoustic frame");
    expect(formatEngineState({ worker: "Stopped", engineDetail: "Starting" })).toBe("Stopped");
    expect(formatEngineState(null)).toBe("Stopped");
  });
});
