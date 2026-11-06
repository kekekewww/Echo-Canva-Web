// In-app probes, installed with page.addInitScript before the application runs. The production
// code is not changed: Worker, AudioParam and AudioContext are wrapped, and the status bar is
// observed from outside. window.__EC102_CONFIG is set by an earlier init script.
(() => {
  const config = window.__EC102_CONFIG || {};
  const pn = () => performance.now();
  const marked = new Set();
  let clockMarks = 0;
  // Traced passes only: a mark carrying performance.now() and the epoch at every post and commit,
  // so the main-thread clock fit spans the whole run.
  const clockMark = () => {
    if (!config.traced) return;
    const now = pn();
    performance.mark(`ec102:clk:main:${clockMarks}:${now}:${performance.timeOrigin + now}`);
    clockMarks += 1;
  };
  const log = {
    posts: [],
    handlers: [],
    params: [],
    inputs: [],
    commits: [],
    longTasks: [],
    loafs: [],
    contexts: [],
    workersCreated: 0,
    support: {
      longtask: false,
      longAnimationFrame: false,
    },
  };

  if (config.forceSerial) {
    // Reaches the production fallback: the pools treat a throwing Worker constructor as unavailable.
    window.Worker = function ec102RefusedWorker() {
      throw new Error("ec102 forced serial: Worker construction refused");
    };
  } else {
    const RealWorker = window.Worker;
    class ProbedWorker extends RealWorker {
      constructor(...args) {
        super(...args);
        this.__ec102Index = log.workersCreated;
        log.workersCreated += 1;
        this.__ec102Handler = null;
      }

      postMessage(message, ...rest) {
        const t0 = pn();
        super.postMessage(message, ...rest);
        const t1 = pn();
        const requestId = message && typeof message.requestId === "number" ? message.requestId : -1;
        clockMark();
        log.posts.push({
          worker: this.__ec102Index,
          type: message && message.type,
          requestId,
          revision: message && message.snapshot ? message.snapshot.revision : null,
          t0,
          t1,
        });
        if (config.traced && requestId > 0 && !marked.has(requestId)) {
          marked.add(requestId);
          performance.mark(`ec102:job:${requestId}:dispatch`);
        }
      }

      get onmessage() {
        return this.__ec102Handler;
      }

      set onmessage(handler) {
        this.__ec102Handler = handler;
        if (typeof handler !== "function") {
          super.onmessage = handler;
          return;
        }
        super.onmessage = (event) => {
          const h0 = pn();
          const data = event.data;
          const h1 = pn();
          handler.call(this, event);
          const h2 = pn();
          log.handlers.push({
            worker: this.__ec102Index,
            type: data && data.type,
            requestId: data && typeof data.requestId === "number" ? data.requestId : -1,
            computeMs: data && typeof data.computeMs === "number" ? data.computeMs : null,
            h0,
            h1,
            h2,
          });
        };
      }
    }
    window.Worker = ProbedWorker;
  }

  for (const name of ["setTargetAtTime", "setValueAtTime", "linearRampToValueAtTime", "cancelScheduledValues", "exponentialRampToValueAtTime"]) {
    const original = AudioParam.prototype[name];
    if (typeof original !== "function") continue;
    AudioParam.prototype[name] = function ec102Param(...args) {
      const t0 = pn();
      const result = original.apply(this, args);
      log.params.push({ name, t0, ms: pn() - t0 });
      return result;
    };
  }

  const RealAudioContext = window.AudioContext;
  if (typeof RealAudioContext === "function") {
    window.AudioContext = class extends RealAudioContext {
      constructor(...args) {
        super(...args);
        log.contexts.push(this);
      }
    };
  }

  for (const type of ["pointerdown", "click", "input", "keydown"]) {
    window.addEventListener(type, (event) => log.inputs.push({ type, ts: event.timeStamp }), { capture: true, passive: true });
  }

  const channel = new MessageChannel();
  const pendingFrames = [];
  channel.port1.onmessage = () => {
    const entry = pendingFrames.shift();
    if (entry) entry.frameEnd = pn();
  };
  const observeStatusbar = () => {
    const bar = document.querySelector(".workspace-statusbar");
    if (!bar) return false;
    new MutationObserver(() => {
      const commit = {
        t: pn(),
        sequence: bar.getAttribute("data-acoustic-sequence"),
        revision: bar.getAttribute("data-acoustic-revision"),
        computeMs: bar.getAttribute("data-worker-compute-ms"),
        source: bar.getAttribute("data-worker-source"),
        workerCount: bar.getAttribute("data-worker-count"),
        raf: null,
        frameEnd: null,
      };
      log.commits.push(commit);
      clockMark();
      if (config.traced) performance.mark(`ec102:app:commit:${commit.sequence}`);
      requestAnimationFrame(() => {
        commit.raf = pn();
        pendingFrames.push(commit);
        channel.port2.postMessage(0);
      });
      if (config.traced && commit.sequence !== null && commit.sequence !== "") performance.mark(`ec102:job:${commit.sequence}:complete`);
    }).observe(bar, { attributes: true, attributeFilter: ["data-acoustic-sequence", "data-acoustic-revision"] });
    return true;
  };
  const waitForBar = new MutationObserver(() => {
    if (observeStatusbar()) waitForBar.disconnect();
  });
  waitForBar.observe(document, { childList: true, subtree: true });

  try {
    log.support.longtask = PerformanceObserver.supportedEntryTypes.includes("longtask");
    log.support.longAnimationFrame = PerformanceObserver.supportedEntryTypes.includes("long-animation-frame");
    if (log.support.longtask) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) log.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }).observe({ type: "longtask", buffered: true });
    }
    if (log.support.longAnimationFrame) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) log.loafs.push({ start: entry.startTime, duration: entry.duration, blocking: entry.blockingDuration });
      }).observe({ type: "long-animation-frame", buffered: true });
    }
  } catch {
    // Support flags above already say what was available.
  }

  window.__ec102 = {
    reset() {
      log.posts.length = 0;
      log.handlers.length = 0;
      log.params.length = 0;
      log.inputs.length = 0;
      log.commits.length = 0;
      log.longTasks.length = 0;
      log.loafs.length = 0;
      marked.clear();
    },
    mark(name) {
      performance.mark(name);
    },
    dump() {
      return {
        timeOrigin: performance.timeOrigin,
        now: pn(),
        posts: log.posts,
        handlers: log.handlers,
        params: log.params,
        inputs: log.inputs,
        commits: log.commits,
        longTasks: log.longTasks,
        loafs: log.loafs,
        support: log.support,
        workersCreated: log.workersCreated,
        contexts: log.contexts.map((context) => ({
          sampleRate: context.sampleRate,
          baseLatency: context.baseLatency,
          outputLatency: context.outputLatency,
          state: context.state,
        })),
      };
    },
  };
})();
