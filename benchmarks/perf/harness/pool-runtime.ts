import { replayTapeSerial, type SerialReplayOptions, type SerialReplayResult } from "./replay-serial";
import {
  calibrateProbeWorkers,
  clockStep,
  runPoolReplay,
  type Calibration,
  type PoolEnv,
  type PoolRunConfig,
  type RawLog,
} from "./replay-pool";

export type SerialRunConfig = Omit<SerialReplayOptions, "now" | "sleep" | "compileStatic">;

export type PerfApi = {
  info: () => {
    userAgent: string;
    hardwareConcurrency: number;
    crossOriginIsolated: boolean;
    timeOrigin: number;
    mainClockResolutionMs: number;
  };
  runPool: (config: PoolRunConfig) => Promise<RawLog>;
  runSerial: (config: SerialRunConfig) => Promise<SerialReplayResult>;
  calibrate: (
    mode: "classic" | "hybrid",
    workerCount: number,
    pings: number,
  ) => Promise<{ calibrations: Calibration[]; mainClockResolutionMs: number }>;
};

export function installPerf(env: PoolEnv): void {
  const api: PerfApi = {
    info: () => ({
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      crossOriginIsolated: self.crossOriginIsolated,
      timeOrigin: performance.timeOrigin,
      mainClockResolutionMs: clockStep(),
    }),
    runPool: (config) => runPoolReplay(config, env),
    runSerial: (config) => replayTapeSerial({
      ...config,
      now: () => performance.now(),
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    }),
    calibrate: (mode, workerCount, pings) => calibrateProbeWorkers(env, mode, workerCount, pings),
  };
  (window as unknown as { __perf: PerfApi }).__perf = api;
}
