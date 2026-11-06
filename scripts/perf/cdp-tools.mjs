// Chrome DevTools Protocol helpers shared by the browser runners: tracing to a file, and the
// V8 sampling heap profiler on the page and on every worker.
import { open, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const TRACE_CATEGORIES = [
  "toplevel",
  "devtools.timeline",
  "v8",
  "v8.execute",
  "blink.user_timing",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
  "disabled-by-default-v8.cpu_profiler",
  "disabled-by-default-v8.gc",
].join(",");

/** Starts tracing on the browser session. `stop(file)` streams the trace to `file`. */
export async function startTracing(session) {
  await session.send("Tracing.start", { categories: TRACE_CATEGORIES, transferMode: "ReturnAsStream" });
  return {
    async stop(file) {
      const completed = new Promise((resolve) => session.once("Tracing.tracingComplete", resolve));
      await session.send("Tracing.end");
      const { stream } = await completed;
      if (!stream) throw new Error("Chromium did not return the trace stream");
      const handle = await open(file, "w");
      let bytes = 0;
      try {
        let eof = false;
        while (!eof) {
          const chunk = await session.send("IO.read", { handle: stream });
          const buffer = Buffer.from(chunk.data, chunk.base64Encoded ? "base64" : "utf8");
          await handle.write(buffer);
          bytes += buffer.length;
          eof = chunk.eof;
        }
      } finally {
        await handle.close();
        await session.send("IO.close", { handle: stream });
      }
      return { file, bytes };
    },
  };
}

const SAMPLING = { samplingInterval: 32768, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true };

/**
 * Allocation sampling without CPU sampling. The page is profiled through its own session. Workers
 * are reached from the browser session: Target.setDiscoverTargets, then Target.attachToTarget with
 * flatten false and Target.sendMessageToTarget, answers arriving in Target.receivedMessageFromTarget.
 * A worker is attached when it is announced, so allocations before that moment are not sampled.
 */
export async function startAllocation(browserSession, pageSession) {
  await pageSession.send("HeapProfiler.enable");
  await pageSession.send("HeapProfiler.startSampling", SAMPLING);

  const workers = new Map();
  const pending = new Map();
  let nextId = 1;
  const notes = { route: "Target.attachToTarget flatten:false with Target.sendMessageToTarget", attachErrors: [] };

  const sendToTarget = (sessionId, method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject, sessionId });
      browserSession
        .send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id, method, params }) })
        .catch((error) => {
          pending.delete(id);
          reject(error);
        });
    });

  browserSession.on("Target.receivedMessageFromTarget", ({ sessionId, message }) => {
    const parsed = JSON.parse(message);
    const waiter = pending.get(parsed.id);
    if (!waiter || waiter.sessionId !== sessionId) return;
    pending.delete(parsed.id);
    if (parsed.error) waiter.reject(new Error(parsed.error.message));
    else waiter.resolve(parsed.result);
  });

  const attach = async (info) => {
    if (info.type !== "worker" || workers.has(info.targetId)) return;
    const entry = { targetId: info.targetId, url: info.url, sessionId: null, started: false };
    workers.set(info.targetId, entry);
    try {
      const { sessionId } = await browserSession.send("Target.attachToTarget", { targetId: info.targetId, flatten: false });
      entry.sessionId = sessionId;
      await sendToTarget(sessionId, "HeapProfiler.enable");
      await sendToTarget(sessionId, "HeapProfiler.startSampling", SAMPLING);
      entry.started = true;
    } catch (error) {
      notes.attachErrors.push(error instanceof Error ? error.message.split("\n")[0] : String(error));
    }
  };
  browserSession.on("Target.targetCreated", ({ targetInfo }) => void attach(targetInfo));
  await browserSession.send("Target.setDiscoverTargets", { discover: true });
  const { targetInfos } = await browserSession.send("Target.getTargets");
  await Promise.all(targetInfos.map(attach));

  const files = [];
  let workersStopped = false;
  return {
    notes,
    /** Worker profiles must be read while the workers are alive, so this can run before a pool is disposed. */
    async stopWorkers(dir) {
      if (workersStopped) return;
      workersStopped = true;
      let index = 0;
      for (const entry of workers.values()) {
        if (!entry.started) continue;
        try {
          const result = await sendToTarget(entry.sessionId, "HeapProfiler.stopSampling");
          const name = `alloc-worker-${index}.heapprofile.json`;
          await writeFile(join(dir, name), JSON.stringify(result.profile), "utf8");
          files.push(name);
          index += 1;
        } catch (error) {
          notes.attachErrors.push(`stop: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`);
        }
      }
    },
    async stop(dir) {
      const main = await pageSession.send("HeapProfiler.stopSampling");
      await writeFile(join(dir, "alloc-main.heapprofile.json"), JSON.stringify(main.profile), "utf8");
      files.unshift("alloc-main.heapprofile.json");
      await this.stopWorkers(dir);
      return { files, workersAttached: [...workers.values()].filter((entry) => entry.started).length, notes };
    },
  };
}
