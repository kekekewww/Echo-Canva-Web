// Turns the raw log of one browser-pool run (benchmarks/perf/harness/replay-pool.ts, type RawLog)
// into samples. Pure: no I/O, so it is unit tested with a synthetic log.
import { NOT_APPLICABLE, createSample } from "./lib.mjs";

const WARM_JOBS = 100;
const WARM_MS = 5000;

/** Same rule as isWarm in replay-serial.ts: both 100 units and 5 s into the process. */
export function warmAt(ordinal, elapsedMs) {
  return ordinal >= WARM_JOBS && elapsedMs >= WARM_MS;
}

const SHARD_TYPES = new Set(["INSTALL_STATIC", "COMPUTE_SHARD"]);

function groupBy(items, keyOf) {
  const map = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

/** Groups posts and handlers by pool request id and attaches the timer and the worker records. */
export function buildJobs(log) {
  const posts = log.posts.filter((post) => SHARD_TYPES.has(post.type));
  const byRequest = groupBy(posts, (post) => post.requestId);
  const recordsByWorker = new Map(log.flushes.map((flush) => [flush.worker, flush.records]));
  const jobs = [];
  for (const [requestId, jobPosts] of [...byRequest].sort(([a], [b]) => a - b)) {
    const handlers = log.handlers.filter((handler) => handler.requestId === requestId);
    const shardPosts = jobPosts.filter((post) => post.type === "COMPUTE_SHARD");
    const timer = jobPosts[0].timerIdx >= 0 ? log.timers[jobPosts[0].timerIdx] : null;
    const workers = [...new Set(jobPosts.map((post) => post.worker))].sort((a, b) => a - b);
    const perWorker = workers.map((worker) => {
      const install = jobPosts.find((post) => post.worker === worker && post.type === "INSTALL_STATIC") ?? null;
      const shard = jobPosts.find((post) => post.worker === worker && post.type === "COMPUTE_SHARD") ?? null;
      const ack = handlers.find((handler) => handler.worker === worker && handler.type === "STATIC_INSTALLED") ?? null;
      const result = handlers.find((handler) => handler.worker === worker && handler.type === "SHARD_RESULT") ?? null;
      const records = recordsByWorker.get(worker) ?? [];
      const record = (type) => records.find((entry) => entry.requestId === requestId && entry.type === type) ?? null;
      return { worker, install, shard, ack, result, installRecord: record("INSTALL_STATIC"), shardRecord: record("COMPUTE_SHARD") };
    });
    const resultLog = log.results.find((entry) => entry.source === "worker" && entry.requestSeq === requestId) ?? null;
    const lastHandler = handlers.filter((handler) => handler.type === "SHARD_RESULT").sort((a, b) => b.h0 - a.h0)[0] ?? null;
    const assemble = lastHandler
      ? log.assembles.find((entry) => entry.t0 >= lastHandler.h1 && entry.t0 <= lastHandler.h2) ?? null
      : null;
    jobs.push({
      requestId,
      revision: shardPosts[0]?.revision ?? null,
      firstPostAt: Math.min(...jobPosts.map((post) => post.t0)),
      timer,
      perWorker,
      resultLog,
      lastHandler,
      assemble,
    });
  }
  return jobs;
}

/** Checks that each request reached each worker once and was answered once. */
export function checkIntegrity(log, jobs) {
  const anomalies = [];
  let installPosts = 0;
  let installAcks = 0;
  let shardPosts = 0;
  let shardResults = 0;
  let workerRecords = 0;
  for (const flush of log.flushes) {
    workerRecords += flush.records.length;
    if (flush.error) anomalies.push(`worker ${flush.worker}: flush failed: ${flush.error}`);
  }
  for (const job of jobs) {
    for (const entry of job.perWorker) {
      const where = `request ${job.requestId} worker ${entry.worker}`;
      const handlersOf = (type) => log.handlers.filter((h) => h.requestId === job.requestId && h.worker === entry.worker && h.type === type);
      const recordsOf = (type) => (log.flushes.find((f) => f.worker === entry.worker)?.records ?? []).filter((r) => r.requestId === job.requestId && r.type === type);
      if (entry.install) {
        installPosts += 1;
        installAcks += handlersOf("STATIC_INSTALLED").length;
        if (handlersOf("STATIC_INSTALLED").length !== 1) anomalies.push(`${where}: ${handlersOf("STATIC_INSTALLED").length} STATIC_INSTALLED replies for one install`);
        if (recordsOf("INSTALL_STATIC").length !== 1) anomalies.push(`${where}: INSTALL_STATIC handled ${recordsOf("INSTALL_STATIC").length} times in the worker`);
      } else if (handlersOf("STATIC_INSTALLED").length > 0) {
        anomalies.push(`${where}: STATIC_INSTALLED without an install post`);
      }
      if (entry.shard) {
        shardPosts += 1;
        shardResults += handlersOf("SHARD_RESULT").length;
        if (handlersOf("SHARD_RESULT").length !== 1) anomalies.push(`${where}: ${handlersOf("SHARD_RESULT").length} SHARD_RESULT replies for one shard (answered ok only when the run completed)`);
        if (recordsOf("COMPUTE_SHARD").length !== 1) anomalies.push(`${where}: COMPUTE_SHARD handled ${recordsOf("COMPUTE_SHARD").length} times in the worker`);
      }
    }
  }
  const expectedRecords = installPosts + shardPosts;
  if (log.flushes.length > 0 && workerRecords !== expectedRecords) {
    anomalies.push(`worker records ${workerRecords} differ from posts ${expectedRecords}`);
  }
  return { ok: anomalies.length === 0, installPosts, installAcks, shardPosts, shardResults, workerRecords, anomalies };
}

export function deriveSamples(log, context) {
  const samples = [];
  const probe = log.config.kind === "probe";
  const open = log.config.replay === "open";
  const jobs = probe || log.config.variant === "TS-W" ? buildJobs(log) : [];
  const firstSubmit = log.steps.length > 0 ? log.steps[0].submitAt : 0;
  const stepByRevision = new Map();
  for (const step of log.steps) if (!stepByRevision.has(step.revision)) stepByRevision.set(step.revision, step);
  const firstJobAt = jobs.length > 0 ? Math.min(...jobs.map((job) => job.timer?.firedAt ?? job.firstPostAt)) : 0;

  const add = (fields) => {
    samples.push(
      createSample({
        runId: context.runId,
        variant: context.variant,
        caseId: context.caseId,
        mode: context.mode,
        boundary: "browser-pool",
        pass: context.pass,
        workers: context.workers,
        audio: "not-applicable",
        units: "ms",
        outcome: "ok",
        ...fields,
      }),
    );
  };
  const jobFields = (job, jobOrdinal, extra) => ({
    requestSeq: job.requestId,
    sceneRevision: job.revision ?? undefined,
    staticFingerprint: job.resultLog?.staticFingerprint !== NOT_APPLICABLE ? job.resultLog?.staticFingerprint : undefined,
    tapeStep: stepByRevision.get(job.revision)?.tapeStep,
    warm: warmAt(jobOrdinal, (job.timer?.firedAt ?? job.firstPostAt) - firstJobAt),
    ...extra,
  });
  const stepFields = (step, extra) => ({
    sceneRevision: step.revision,
    tapeStep: step.tapeStep,
    warm: warmAt(step.index, step.submitAt - firstSubmit),
    ...extra,
  });
  const resultFields = (result, extra) => {
    const step = stepByRevision.get(result.revision);
    return {
      requestSeq: result.requestSeq > 0 ? result.requestSeq : undefined,
      sceneRevision: result.revision,
      staticFingerprint: result.staticFingerprint !== NOT_APPLICABLE ? result.staticFingerprint : undefined,
      tapeStep: step?.tapeStep,
      warm: step ? warmAt(step.index, step.submitAt - firstSubmit) : false,
      ...extra,
    };
  };

  // Phases measured on the harness's own steps and on the pool's results (both pass kinds).
  for (const result of log.results) {
    const clock = "main-perf-now";
    add({ phase: "pool.compute-metric", duration: result.computeMs, clock, ...resultFields(result) });
    if (!probe) continue;
    if (result.source === "worker") {
      add({ phase: "pool.shard-max", duration: result.shardMax, clock: "worker-perf-now", ...resultFields(result) });
      add({ phase: "pool.shard-total", duration: result.shardTotal, clock: "worker-perf-now", ...resultFields(result) });
    }
    if (typeof result.decideMs === "number") add({ phase: "accept.decide", duration: result.decideMs, clock, ...resultFields(result) });
    if (typeof result.deriveMs === "number") add({ phase: "display.derive", duration: result.deriveMs, clock, ...resultFields(result) });
  }

  const acceptedRevisions = new Set();
  for (const result of log.results) {
    if (!result.accepted || acceptedRevisions.has(result.revision)) continue;
    acceptedRevisions.add(result.revision);
    const step = stepByRevision.get(result.revision);
    if (!step) continue;
    add({ phase: "job.submit-to-accepted", duration: result.acceptedAt - step.submitAt, clock: "main-perf-now", ...resultFields(result) });
    if (probe && open) {
      const latest = [...log.steps].reverse().find((entry) => entry.submitAt <= result.acceptedAt) ?? step;
      add({ phase: "pose.age-at-accept", duration: latest.submitAt - step.submitAt, clock: "main-perf-now", ...resultFields(result) });
    }
  }
  for (const step of log.steps) {
    if (step.outcome === "timeout") {
      add({ phase: "job.submit-to-accepted", duration: log.endAt - step.submitAt, outcome: "timeout", clock: "main-perf-now", ...stepFields(step) });
    }
  }

  if (!probe) return finish(samples, log, jobs, stepByRevision);

  // Probe-only phases from here on.
  if (open) {
    for (const step of log.steps) {
      if (log.originAt !== NOT_APPLICABLE && step.plannedMs !== null) {
        add({ phase: "input.lateness", duration: step.tickAt - (log.originAt + step.plannedMs), clock: "main-perf-now", ...stepFields(step) });
      }
      const accepted = log.results.filter((r) => r.accepted && r.revision >= step.revision && r.acceptedAt >= step.submitAt)
        .sort((a, b) => a.acceptedAt - b.acceptedAt)[0];
      if (accepted) add({ phase: "pose.latest-wait", duration: accepted.acceptedAt - step.submitAt, clock: "main-perf-now", ...stepFields(step) });
      else add({ phase: "pose.latest-wait", duration: log.endAt - step.submitAt, outcome: "censored", clock: "main-perf-now", ...stepFields(step) });
    }
  }
  for (const step of log.steps) {
    if (typeof step.projectMs === "number") add({ phase: "input.project", duration: step.projectMs, clock: "main-perf-now", ...stepFields(step) });
  }
  for (const post of log.clientPosts) {
    const step = stepByRevision.get(post.revision);
    if (step) add({ phase: "queue.client", duration: post.t - step.submitAt, clock: "main-perf-now", ...stepFields(step) });
  }
  // Fallback results: no timer is involved, so the wait is the compute start minus the submit.
  for (const result of log.results.filter((entry) => entry.source === "fallback")) {
    const step = stepByRevision.get(result.revision);
    if (step) add({ phase: "queue.wait", duration: result.t0 - result.computeMs - step.poolSubmitAt, clock: "main-perf-now", ...resultFields(result) });
  }

  const residuals = [];
  jobs.forEach((job, ordinal) => {
    const fire = job.timer?.firedAt ?? null;
    if (job.timer && fire !== null) {
      add({ phase: "queue.rate-limit", duration: job.timer.delayMs, clock: "main-perf-now", ...jobFields(job, ordinal) });
      add({ phase: "queue.timer-lateness", duration: fire - (job.timer.scheduledAt + job.timer.delayMs), clock: "main-perf-now", ...jobFields(job, ordinal) });
      const step = stepByRevision.get(job.revision);
      if (step) add({ phase: "queue.wait", duration: fire - step.poolSubmitAt, clock: "main-perf-now", ...jobFields(job, ordinal) });
      add({ phase: "dispatch.prepare", duration: job.firstPostAt - fire, clock: "main-perf-now", ...jobFields(job, ordinal) });
    }
    for (const w of job.perWorker) {
      const at = (phase, duration, clock, outcome) => add({ phase, duration, clock, workerIndex: w.worker, ...(outcome ? { outcome } : {}), ...jobFields(job, ordinal) });
      if (w.install) {
        at("install.post", w.install.t1 - w.install.t0, "main-perf-now");
        if (w.installRecord) at("install.worker-deserialize", w.installRecord.deserializeMs, "worker-perf-now");
        if (w.ack) at("install.ack-roundtrip", w.ack.h0 - w.install.t0, "main-perf-now");
      }
      if (w.shard) {
        at("shard.post", w.shard.t1 - w.shard.t0, "main-perf-now");
        if (w.shardRecord) at("shard.worker-deserialize", w.shardRecord.deserializeMs, "worker-perf-now");
        if (w.result) {
          const roundtrip = w.result.h0 - w.shard.t0;
          at("shard.roundtrip", roundtrip, "main-perf-now");
          if (w.result.computeMs !== null) at("shard.compute", w.result.computeMs, context.pass === "bare" ? "worker-date-now" : "worker-perf-now");
          if (w.shardRecord && w.result.computeMs !== null) {
            at("shard.reply-post", w.shardRecord.replyPostMs, "worker-perf-now");
            at("shard.transport", roundtrip - w.shardRecord.deserializeMs - w.result.computeMs - w.shardRecord.replyPostMs, "computed");
          }
          at("merge.reply-deserialize", w.result.h1 - w.result.h0, "main-perf-now");
          const containsAssemble = job.lastHandler === w.result && job.assemble !== null;
          const publish = job.resultLog ? job.resultLog.tEnd - job.resultLog.t0 : 0;
          const assembleMs = containsAssemble ? job.assemble.t1 - job.assemble.t0 : 0;
          at("merge.validate", w.result.h2 - w.result.h1 - (containsAssemble ? assembleMs + publish : 0), "main-perf-now");
        }
      }
    }
    if (job.assemble) add({ phase: "merge.assemble", duration: job.assemble.t1 - job.assemble.t0, clock: "main-perf-now", ...jobFields(job, ordinal) });
    if (job.resultLog && job.assemble && job.lastHandler && job.timer && job.timer.firedAt !== null) {
      // Prepare, then the slowest worker's posts and round trip (with the posts to earlier workers
      // that delayed it), then the merge up to the pool's completion stamp. What is left over is
      // reported as is and is never forced to zero.
      const completedAt = job.assemble.completedAt;
      // The timer callback is where the pool takes its start stamp, so this is an independent check of its metric.
      const startedAt = job.timer.firedAt;
      let before = 0;
      let slowest = 0;
      for (const w of job.perWorker) {
        if (w.shard && w.result) {
          slowest = Math.max(slowest, before + (w.install ? w.install.t1 - w.install.t0 : 0) + (w.result.h0 - w.shard.t0));
        }
        before += (w.install ? w.install.t1 - w.install.t0 : 0) + (w.shard ? w.shard.t1 - w.shard.t0 : 0);
      }
      const prepare = job.firstPostAt - startedAt;
      const mergeTail = completedAt - job.lastHandler.h0;
      const residual = job.resultLog.computeMs - (prepare + slowest + mergeTail);
      residuals.push(residual);
      add({ phase: "job.phase-residual", duration: residual, clock: "computed", ...jobFields(job, ordinal) });
    }
  });
  return finish(samples, log, jobs, stepByRevision, residuals);
}

function finish(samples, log, jobs, stepByRevision, residuals = []) {
  const workerResults = log.results.filter((entry) => entry.source === "worker");
  const dispatchedRevisions = new Set(jobs.map((job) => job.revision));
  const computedRevisions = new Set(log.results.map((entry) => entry.revision));
  const fallbackResults = log.results.filter((entry) => entry.source === "fallback");
  const isPool = log.config.variant === "TS-W";
  const poolPosts = log.config.kind === "probe" && isPool;
  const denominators = {
    submitted: log.steps.length,
    coalesced: log.steps.filter((step) => !(poolPosts ? dispatchedRevisions : computedRevisions).has(step.revision)).length,
    dispatched: poolPosts ? jobs.length : NOT_APPLICABLE,
    completed: log.results.length,
    accepted: log.results.filter((entry) => entry.accepted).length,
    stale: Math.max(0, log.assembles.length - workerResults.length) + log.results.filter((entry) => !entry.accepted).length,
    fallback: fallbackResults.length,
    error: log.errors.length,
    timeout: log.steps.filter((step) => step.outcome === "timeout").length,
  };
  const workerCounts = [...new Set(workerResults.map((entry) => entry.workerCount))];
  const shardCompute = samples.filter((sample) => sample.phase === "shard.compute").map((sample) => sample.duration);
  return {
    samples,
    denominators,
    jobs: jobs.length,
    workerCounts,
    integrity: log.config.kind === "probe" && isPool ? checkIntegrity(log, jobs) : NOT_APPLICABLE,
    shardCompute: {
      count: shardCompute.length,
      nonInteger: shardCompute.filter((value) => !Number.isInteger(value)).length,
    },
    phaseResidualCount: residuals.length,
    revisionsSeen: stepByRevision.size,
  };
}
