// Turns the in-app probe dump of one browser-app run (scripts/perf/app-probes.js) into samples.
// Pure, so it is unit tested with a synthetic dump.
import { NOT_APPLICABLE, createSample, makeDenominators } from "./lib.mjs";
import { warmAt } from "./derive-pool.mjs";

const INPUT_TYPES = new Set(["pointerdown", "click", "input", "keydown"]);

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

/** Reported per-worker compute times of each job, for the trace comparison. Whole milliseconds: production workers read Date.now(). */
export function computeCheckFromDump(dump) {
  const jobs = [...groupJobs(dump).values()]
    .map((job) => ({
      seq: job.requestId,
      entries: job.handlers
        .filter((handler) => handler.type === "SHARD_RESULT" && handler.computeMs !== null)
        .map((handler) => ({ worker: handler.worker, reportedMs: handler.computeMs, recvEpochMs: null })),
    }))
    .filter((job) => job.entries.length > 0);
  return { wholeMilliseconds: true, jobs };
}

export function deriveAppSamples(dump, context) {
  const samples = [];
  const jobs = groupJobs(dump);
  const commits = dump.commits.filter((commit) => commit.sequence !== null && commit.sequence !== "");
  const inputs = dump.inputs.filter((input) => INPUT_TYPES.has(input.type));
  const firstCommitAt = commits.length > 0 ? commits[0].t : 0;

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
    }
    if (Number.isFinite(Number(commit.computeMs)) && commit.computeMs !== "") {
      add({ phase: "app.worker-compute-metric", duration: Number(commit.computeMs), clock: "main-date-now", ...base });
    }
    if (job) {
      const workers = [...new Set(job.posts.map((post) => post.worker))].sort((a, b) => a - b);
      let lastHandlerEnd = -Infinity;
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
          lastHandlerEnd = Math.max(lastHandlerEnd, result.h2);
        }
      }
      if (Number.isFinite(lastHandlerEnd)) add({ phase: "accept.to-commit", duration: commit.t - lastHandlerEnd, ...base });
    }
    if (commit.raf !== null) add({ phase: "display.commit-to-raf", duration: commit.raf - commit.t, ...base });
    if (commit.frameEnd !== null) add({ phase: "display.commit-to-frame-end", duration: commit.frameEnd - commit.t, ...base });

    const until = commits[ordinal + 1]?.t ?? Infinity;
    const calls = dump.params.filter((call) => call.t0 >= commit.t && call.t0 < until);
    if (context.audio === "on" || calls.length > 0) {
      add({ phase: "audio.param-ops", duration: calls.length, units: "count", ...base });
      for (const call of calls) add({ phase: "audio.param-call-ms", duration: call.ms, ...base });
      if (calls.length > 0) add({ phase: "audio.commit-to-first-param", duration: calls[0].t0 - commit.t, ...base });
    }
  });

  dump.longTasks.forEach((task, index) => {
    add({ phase: "app.long-task", duration: task.duration, warm: warmAt(index, task.start - firstCommitAt) });
  });
  for (const [index, sample] of (context.audioSamples ?? []).entries()) {
    add({ phase: "audio.render-capacity", duration: sample.renderCapacity, units: "ratio", clock: "cdp", warm: warmAt(index, 0) });
    add({ phase: "audio.callback-interval-mean", duration: sample.callbackIntervalMean, units: "s", clock: "cdp", warm: warmAt(index, 0) });
  }

  const sources = commits.map((commit) => commit.source);
  const counts = (predicate) => sources.filter(predicate).length;
  return {
    samples,
    denominators: makeDenominators({
      submitted: context.submitted ?? commits.length,
      dispatched: jobs.size,
      completed: commits.length,
      accepted: commits.length,
      fallback: counts((value) => value === "Fallback"),
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
    },
  };
}
