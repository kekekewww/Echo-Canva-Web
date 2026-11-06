import { createSample } from "./lib.mjs";

/** Maps TS-S replay records to validated samples. */
export function serialSamples(records, base) {
  return records.map((record) =>
    createSample({
      runId: base.runId,
      variant: "TS-S",
      caseId: base.caseId,
      requestSeq: record.requestSeq,
      mode: base.mode,
      sceneRevision: record.sceneRevision,
      staticFingerprint: record.staticFingerprint,
      phase: record.phase,
      duration: record.duration,
      units: "ms",
      outcome: "ok",
      boundary: base.boundary,
      pass: base.pass,
      warm: record.warm,
      clock: "main-perf-now",
      audio: "not-applicable",
      tapeStep: record.tapeStep,
      jobKind: record.jobKind,
    }),
  );
}
