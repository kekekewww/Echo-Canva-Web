// Turns the in-app probe dump of one browser-app run (scripts/perf/app-probes.js) into samples.
// Pure, so it is unit tested with a synthetic dump.
//
// One accepted frame runs: the last shard handler calls setState, React commits the viewport
// (commit 1), passive effects then call the audio engine and onAcousticStatus, and the parent's
// setState commits the status bar attributes (commit 2). So the chain measured per job is
//   last handler end -> first viewport mutation -> AudioParam calls -> status bar mutation.
import { NOT_APPLICABLE, createSample, makeDenominators } from "./lib.mjs";
import { WARM_JOBS, WARM_MS, warmAt } from "./derive-pool.mjs";

export const AUDIO_SAMPLE_INTERVAL_MS = 250;
const INPUT_TYPES = new Set(["pointerdown", "click", "input", "keydown"]);
const MIN_UPDATE_HZ = 10;
const MAX_UPDATE_HZ = 15;

function groupJobs(dump) {
  const jobs = new Map();
  for (const post of dump.posts) {
    if (post.requestId <= 0 || (post.type !== "INSTALL_STATIC" && post.type !== "COMPUTE_SHARD")) continue;
    if (!jobs.has(post.requestId)) jobs.set(post.requestId, { requestId: post.requestId, posts: [], handlers: [] });
    jobs.get(post.requestId).posts.push(post);
  }
  for (const handler of dump.handlers) {
    const job = jobs.get(handler.requestId);
    if (job) job.handlers.push(handler);
  }
  return jobs;
}

function lastHandlerEnd(job) {
  const ends = job.handlers.filter((handler) => handler.type === "SHARD_RESULT").map((handler) => handler.h2);
  return ends.length > 0 ? Math.max(...ends) : null;
}

/**
 * Reported per-worker compute times of each job, for the trace comparison. Whole milliseconds:
 * production workers read Date.now(). The job's metric is the status bar's data-worker-compute-ms.
 */
export function computeCheckFromDump(dump) {
  const commitBySequence = new Map(dump.commits.filter((commit) => commit.sequence !== "").map((commit) => [Number(commit.sequence), commit]));
  const jobs = [...groupJobs(dump).values()]
    .map((job) => {
      const metric = Number(commitBySequence.get(job.requestId)?.computeMs);
      const results = job.handlers.filter((handler) => handler.type === "SHARD_RESULT");
      const lastHandler = results.length > 0 ? results.reduce((best, handler) => (handler.h0 > best.h0 ? handler : best)) : null;
      return {
        seq: job.requestId,
        jobKind: job.posts.some((post) => post.type === "INSTALL_STATIC") ? "static-install" : "pose-only",
        firstPostStartMs: Math.min(...job.posts.map((post) => post.t0)),
        lastHandlerStartMs: lastHandler ? lastHandler.h0 : null,
        lastHandlerEndMs: lastHandler ? lastHandler.h2 : null,
        metricMs: Number.isFinite(metric) ? metric : null,
        entries: job.handlers
          .filter((handler) => handler.type === "SHARD_RESULT" && handler.computeMs !== null)
          .map((handler) => {
            const post = job.posts.find((entry) => entry.worker === handler.worker && entry.type === "COMPUTE_SHARD");
            return { worker: handler.worker, reportedMs: handler.computeMs, recvEpochMs: null, postEndMs: post ? post.t1 : null, handlerStartMs: handler.h0 };
          }),
      };
    })
    .filter((job) => job.entries.length > 0);
  return { wholeMilliseconds: true, metricName: "app.worker-compute-metric", jobs };
}

/** What the runner checks after deriving: the worker source and count the status bar showed. Pushes to result.errors. */
export function assertSources(result, config, observed, expectedCount) {
  if (observed.commits === 0) {
    result.errors.push("no accepted frame was observed during the window");
    return;
  }
  if (config.variant === "TS-S") {
    if (observed.workerSources.length !== 1 || observed.workerSources[0] !== "Fallback") {
      result.errors.push(`fallback did not activate cleanly: data-worker-source values ${JSON.stringify(observed.workerSources)}`);
    }
    if (observed.workersCreated !== 0) result.errors.push(`a worker was created during a forced-serial run (${observed.workersCreated})`);
  } else {
    if (observed.workerSources.length !== 1 || observed.workerSources[0] !== "Worker") {
      result.errors.push(`data-worker-source values ${JSON.stringify(observed.workerSources)}, expected Worker only`);
    }
    if (observed.workerCounts.length !== 1 || observed.workerCounts[0] !== String(expectedCount)) {
      result.errors.push(`data-worker-count values ${JSON.stringify(observed.workerCounts)}, expected ${expectedCount}`);
    }
  }
}

export function deriveAppSamples(dump, context) {
  const samples = [];
  const jobs = groupJobs(dump);
  const commits = dump.commits.filter((commit) => commit.sequence !== null && commit.sequence !== "");
  const inputs = dump.inputs.filter((input) => INPUT_TYPES.has(input.type));
  const overlay = dump.overlay ?? { found: false, hasCanvas: false, mutations: [] };
  const firstCommitAt = commits.length > 0 ? commits[0].t : 0;
  // Events with no job ordinal (long tasks, frames, audio samples) are warm once the run is past the
  // job-count threshold and the time threshold together: the time of the WARM_JOBS-th commit, or
  // WARM_MS after the first commit if that is later. A run with no more than WARM_JOBS commits has none.
  const warmFromMs = commits.length > WARM_JOBS ? Math.max(WARM_MS, commits[WARM_JOBS].t - firstCommitAt) : Number.POSITIVE_INFINITY;
  const warmByTime = (elapsedMs) => elapsedMs >= warmFromMs;
  const intervalMs = context.updateHz ? 1000 / Math.min(Math.max(context.updateHz, MIN_UPDATE_HZ), MAX_UPDATE_HZ) : null;

  const add = (fields) =>
    samples.push(
      createSample({
        runId: context.runId,
        variant: context.variant,
        caseId: context.caseId,
        mode: context.mode,
        boundary: "browser-app",
        pass: context.pass,
        workers: context.workers,
        audio: context.audio,
        units: "ms",
        outcome: "ok",
        clock: "main-perf-now",
        ...fields,
      }),
    );

  const chain = {
    jobsWithChain: 0,
    jobsWithoutOverlayMutation: 0,
    jobsWithoutParamCalls: 0,
    order: { jobsWithOverlayAndParam: 0, overlayBeforeFirstParam: 0, firstParamBeforeStatus: 0, fullOrder: 0 },
  };
  let previousLast = null;

  commits.forEach((commit, ordinal) => {
    const requestId = Number(commit.sequence);
    const job = jobs.get(requestId) ?? null;
    const jobKind = job ? (job.posts.some((post) => post.type === "INSTALL_STATIC") ? "static-install" : "pose-only") : NOT_APPLICABLE;
    const base = {
      requestSeq: Number.isInteger(requestId) && requestId > 0 ? requestId : undefined,
      sceneRevision: Number(commit.revision) > 0 ? Number(commit.revision) : undefined,
      warm: warmAt(ordinal, commit.t - firstCommitAt),
      jobKind,
    };
    const firstPost = job ? Math.min(...job.posts.map((post) => post.t0)) : null;
    const reference = firstPost ?? commit.t;
    const input = [...inputs].reverse().find((entry) => entry.ts <= reference);
    if (input) {
      if (firstPost !== null) add({ phase: "app.input-to-dispatch", duration: firstPost - input.ts, ...base });
      add({ phase: "app.input-to-commit", duration: commit.t - input.ts, ...base });
      if (firstPost !== null && previousLast !== null && intervalMs !== null) {
        // The pool starts a job no sooner than one update interval after the previous job finished.
        // The estimate takes the previous job's last handler end as that finish time.
        const estimate = Math.max(0, previousLast + intervalMs - input.ts);
        add({ phase: "queue.rate-limit-estimate", duration: estimate, clock: "computed", ...base });
        add({ phase: "app.input-to-dispatch-minus-rate-limit", duration: firstPost - input.ts - estimate, clock: "computed", ...base });
      }
    }
    if (Number.isFinite(Number(commit.computeMs)) && commit.computeMs !== "") {
      add({ phase: "app.worker-compute-metric", duration: Number(commit.computeMs), clock: "main-date-now", ...base });
    }
    if (commit.frameEnd !== null) add({ phase: "display.status-commit-to-frame-end", duration: commit.frameEnd - commit.t, ...base });

    if (!job) return;
    const workers = [...new Set(job.posts.map((post) => post.worker))].sort((a, b) => a - b);
    for (const worker of workers) {
      const at = (phase, duration, clock = "main-perf-now") => add({ phase, duration, clock, workerIndex: worker, ...base });
      const install = job.posts.find((post) => post.worker === worker && post.type === "INSTALL_STATIC");
      const shard = job.posts.find((post) => post.worker === worker && post.type === "COMPUTE_SHARD");
      const ack = job.handlers.find((handler) => handler.worker === worker && handler.type === "STATIC_INSTALLED");
      const result = job.handlers.find((handler) => handler.worker === worker && handler.type === "SHARD_RESULT");
      if (install) {
        at("install.post", install.t1 - install.t0);
        if (ack) at("install.ack-roundtrip", ack.h0 - install.t0);
      }
      if (shard) at("shard.post", shard.t1 - shard.t0);
      if (shard && result) at("shard.roundtrip", result.h0 - shard.t0);
      if (result) {
        if (result.computeMs !== null) at("shard.compute-reported", result.computeMs, "worker-date-now");
        at("merge.reply-deserialize", result.h1 - result.h0);
        at("merge.handler", result.h2 - result.h1);
      }
    }

    const last = lastHandlerEnd(job);
    if (last === null) return;
    chain.jobsWithChain += 1;
    add({ phase: "accept.to-status-commit", duration: commit.t - last, ...base });
    const first = overlay.mutations.find((mutation) => mutation.t >= last);
    const hasOverlay = first !== undefined && first.t <= commit.t;
    if (overlay.mutations.length > 0) {
      if (hasOverlay) {
        add({ phase: "accept.to-overlay-commit", duration: first.t - last, ...base });
        if (first.frameEnd !== null) add({ phase: "display.overlay-commit-to-frame-end", duration: first.frameEnd - first.t, ...base });
      } else {
        chain.jobsWithoutOverlayMutation += 1;
      }
    }
    // AudioParam calls made by this job's effects lie after its last handler and up to its status commit.
    const calls = dump.params.filter((call) => call.t0 > last && call.t0 <= commit.t);
    if (context.audio === "on") {
      add({ phase: "audio.param-ops", duration: calls.length, units: "count", ...base });
      add({ phase: "audio.param-call-total-ms", duration: calls.reduce((sum, call) => sum + call.ms, 0), ...base });
      if (calls.length > 0) {
        const lastCall = calls[calls.length - 1];
        add({ phase: "accept.to-first-param", duration: calls[0].t0 - last, ...base });
        add({ phase: "audio.apply-window", duration: lastCall.t0 + lastCall.ms - calls[0].t0, ...base });
      } else {
        chain.jobsWithoutParamCalls += 1;
      }
    }
    if (hasOverlay && calls.length > 0) {
      chain.order.jobsWithOverlayAndParam += 1;
      const overlayFirst = first.t < calls[0].t0;
      const paramFirst = calls[0].t0 < commit.t;
      if (overlayFirst) chain.order.overlayBeforeFirstParam += 1;
      if (paramFirst) chain.order.firstParamBeforeStatus += 1;
      if (overlayFirst && paramFirst) chain.order.fullOrder += 1;
    }
    previousLast = last;
  });

  // Long tasks and long animation frames: in-window means starting inside the measured window the
  // stock spec uses (after the warm-up clicks, through the last switch). Out-of-window ones are kept
  // under their own phase names so the two never mix.
  const window = dump.window && dump.window.end !== null ? dump.window : null;
  const inWindow = (start) => window !== null && start >= window.start && start <= window.end;
  const counts = { longTasks: { inWindow: 0, outsideWindow: 0 }, longAnimationFrames: { inWindow: 0, outsideWindow: 0 } };
  const suffix = (flag) => (flag ? "" : ".out-of-window");
  dump.longTasks.forEach((task) => {
    const flag = inWindow(task.start);
    counts.longTasks[flag ? "inWindow" : "outsideWindow"] += 1;
    add({ phase: `app.long-task${suffix(flag)}`, duration: task.duration, warm: flag && warmByTime(task.start - firstCommitAt) });
  });
  (dump.loafs ?? []).forEach((frame) => {
    const flag = inWindow(frame.start);
    counts.longAnimationFrames[flag ? "inWindow" : "outsideWindow"] += 1;
    add({ phase: `app.long-animation-frame${suffix(flag)}`, duration: frame.duration, warm: flag && warmByTime(frame.start - firstCommitAt) });
    add({ phase: `app.long-animation-frame.blocking${suffix(flag)}`, duration: frame.blocking, warm: flag && warmByTime(frame.start - firstCommitAt) });
  });
  // Audio samples are taken every AUDIO_SAMPLE_INTERVAL_MS by the runner. elapsedMs is the sample's time
  // since the window start; samples kept without it (older runs) are placed at index * interval, an estimate.
  const audioOffset = window !== null && commits.length > 0 ? commits[0].t - window.start : 0;
  for (const [index, sample] of (context.audioSamples ?? []).entries()) {
    const elapsed = (typeof sample.elapsedMs === "number" ? sample.elapsedMs : index * AUDIO_SAMPLE_INTERVAL_MS) - audioOffset;
    const warm = warmByTime(elapsed);
    add({ phase: "audio.render-capacity", duration: sample.renderCapacity, units: "ratio", clock: "cdp", warm });
    add({ phase: "audio.callback-interval-mean", duration: sample.callbackIntervalMean, units: "s", clock: "cdp", warm });
  }

  const sources = commits.map((commit) => commit.source);
  const countSources = (predicate) => sources.filter(predicate).length;
  return {
    samples,
    denominators: makeDenominators({
      submitted: context.submitted ?? commits.length,
      dispatched: jobs.size,
      completed: commits.length,
      accepted: commits.length,
      fallback: countSources((value) => value === "Fallback"),
      error: 0,
      timeout: context.timeouts ?? 0,
    }),
    observed: {
      workerSources: [...new Set(sources)],
      workerCounts: [...new Set(commits.map((commit) => commit.workerCount))],
      jobs: jobs.size,
      commits: commits.length,
      workersCreated: dump.workersCreated,
      support: dump.support,
      contexts: dump.contexts,
      chain: {
        ...chain,
        overlayRoot: {
          selector: overlay.selector ?? NOT_APPLICABLE,
          found: overlay.found,
          containsCanvas: overlay.hasCanvas,
          mutationsObserved: overlay.mutations.length,
          note: overlay.mutations.length === 0
            ? "no viewport DOM mutation was observed; accept.to-overlay-commit is not-applicable"
            : "accept.to-overlay-commit is the first viewport mutation after the job's last handler",
        },
        updateHz: context.updateHz ?? NOT_APPLICABLE,
        updateIntervalMs: intervalMs ?? NOT_APPLICABLE,
      },
      measuredWindow: window ?? NOT_APPLICABLE,
      ...counts,
    },
  };
}
