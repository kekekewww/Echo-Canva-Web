# EC-102 performance harness

This directory holds the tools that measure the current TypeScript acoustic pipeline in Echo Canvas Web, one phase at a time, on one machine. It changes no product code and sets no pass/fail limit anywhere. It reports numbers; it never judges them.

The design is in `knowledge/wiki/performance/benchmark-plan.md` (sections 2 to 5) and the task notes for EC-102. This file covers how to run the harness and what its numbers mean and do not mean.

## Layout

```text
benchmarks/perf/
  harness/      TypeScript that runs in Node or in a page: tape replay, pools, probes, controls
  workloads/v1/ generated long workloads, frozen by hash, with their own manifest
  results/      sanitised evidence committed by hand after review
scripts/perf/   Node side: CLI, runners, derivation of samples, trace analysis, summaries
.perf-runs/     git-ignored raw runs, bundles and traces
```

## Commands

Run everything with `corepack pnpm perf <command>` or `node scripts/perf/cli.mjs <command>`. Use Bash. Set `TEMP`, `TMP` and `TMPDIR` to a folder inside the worktree, and prepend `.claude/ec102-bin` to `PATH` when something spawns a bare `pnpm` (Playwright's web server does).

```text
verify-corpus [--corpus-manifest <path>]
generate-workloads [--check]                 needs ECHO_PERF_UPDATE=1 unless --check
run --variant TS-S|TS-W --case <id> --run-id <id> --out <dir>
    [--boundary node-core|browser-pool|browser-app] [--pass stock|bare|clean|traced|alloc]
    [--repeat <n>] [--parity] [--audio on|off] [--driver poll|immediate] [--browser-channel default|chromium] [--samples <n>] [--hardware-concurrency <n>]
    [--ts-s-path decomposed|fallback] [--max-duration-ms <n>] [--step-timeout-ms <n>]
    [--corpus-manifest <path>] [--order-index <n>]
run --plan <plan.json> --out <dir>           entries in file order, each in its own processes
summarize --out <dir> --to <evidenceDir> [--with-slices]
rederive <runDir>                        rebuilds samples.jsonl, summary.json and (traced) the trace analysis from the kept raw files; nothing is measured
analyze <runDir> [--out <dir>] [--top <k>]   re-derives the trace analysis of a traced run from its raw files into <runDir>/reanalysis
scan <paths...>                              privacy scan; prints file:line:rule, exits 1 on a hit
```

`run` verifies the frozen corpus and the workloads first and refuses on a mismatch. A run is never retried and never deleted; a failed or crashed run stays on disk and in `runs-index.jsonl` with its error. In-app runs need `corepack pnpm build` first (`NEXT_TELEMETRY_DISABLED=1`).

### Cases

| Case | Replay | What it is |
| --- | --- | --- |
| `TC01_LISTENER_TAPE_SEEDED`, `TC02_STATIC_EDIT_TAPE`, `TH01_LISTENER_TAPE_SEEDED`, `TH02_STATIC_EDIT_TAPE` | closed loop | frozen corpus tapes; submit a step, wait for its accepted frame, submit the next |
| `W01_H100_POSE_60HZ_60S`, `W02_H100_STATIC_5HZ_30S`, `W03_C100_POSE_60HZ_60S`, `W04_C100_STATIC_5HZ_30S` | open loop | generated 100-wall workloads; events fire on a drift-corrected timer, no waiting for frames |
| `APP_H100_SWITCH` | in-app | the 100-wall fixture of `tests/e2e/workspace.spec.ts`, listener switching by real clicks |
| `APP_C_DRAG` | in-app | Classic source figure-of-eight drag, as in `tests/e2e/audio-render-capacity.spec.ts` |
| `CONTROLS` | either | positive controls: known blocks, clock marks, GC pressure, clock resolution, audio |

`--max-duration-ms` truncates an open-loop tape (or sets the length of `APP_C_DRAG`) and is recorded in the run. Smoke runs use it; real runs should not.

## Boundaries

- `node-core`: a plain Node process, core check only (TS-S). Reported in its own column.
- `browser-pool`: a harness page served from `127.0.0.1` with no COOP or COEP headers, running the production pools and the production solver without React. TS-W uses the real `AcousticFrameClient` with the real Classic pool, or the real Hybrid pool, with injected `now`, `schedule`, `assembleFrame` and workers. TS-S is the decomposed serial path (closed loop) or the production fallback (a pool whose workers cannot start; open loop).
- `browser-app`: the real production build behind `next start`, driven through the real UI. Probes are installed with an init script; no product code changes. `--audio on` clicks Play as the fixture does; `off` asserts no audio graph exists.
  - `--driver poll` (the default) waits for each switch the way the stock spec does: `expect.poll` with its default intervals (a check at once, then after 100, 250, 500 and 1000 ms, then every 1000 ms), the same condition and the same follow-up read of the status attributes. `--driver immediate` clicks again as soon as a commit is seen, a back-to-back burst that is a different workload. The driver is recorded in `runs-index.jsonl`, `summary.json` and the group key, so runs with different drivers are never pooled. Pass `stock` is labelled `stock-poll`.
  - `--browser-channel` (plan key `browser-channel`, at `browser-app` and `browser-pool`) is a control group that changes only the browser build. `default` is the usual launch (the headless shell). `chromium` passes `channel: "chromium"` to `chromium.launch`: the new headless mode of the full build that is already installed. Nothing is installed, `PLAYWRIGHT_BROWSERS_PATH` is not set, no GPU flag is passed, and a missing full build fails the run with a message saying so. The option is in the index, `summary.json` and the group key (runs from before the option count as `default`), and is refused with `--pass stock`. Every browser run records, in `environment.json` under `browser`: the version, the build launched (`executableKind`) and its SHA-256, the WebGL unmasked vendor and renderer (from a throwaway canvas made before the measured window; `unavailable` without a context), and `gpuRasterization` with `gpuFeatureStatus` from `SystemInfo.getInfo` (`unavailable` when the route fails). Runs written before this option recorded the SHA-256 of the full build while launching the headless shell.
  - One accepted frame runs: the last shard handler calls setState, React commits the viewport (commit 1), passive effects call the audio engine and then `onAcousticStatus`, and the parent's setState commits the status bar attributes (commit 2). The probes observe the Hybrid viewport root (`.workspace-viewport-panel`, subtree, attributes and child list) and the status bar separately, and attribute AudioParam calls to the job whose last handler precedes them and whose status commit follows them: `accept.to-overlay-commit` (last handler end to the first viewport mutation), `accept.to-status-commit`, `accept.to-first-param` (omitted for a job with no calls; the summary counts those jobs), `audio.apply-window`, `audio.param-ops` (a count, may be 0), `audio.param-call-total-ms`, `display.overlay-commit-to-frame-end`, `display.status-commit-to-frame-end`. A mode that draws to a canvas without a DOM mutation has no overlay commit and the phase is `not-applicable`. Per-call AudioParam data stays in `probe-dump.json`. `observed.chain.order` counts, per run, the jobs where the overlay commit precedes the first param call and the first param call precedes the status commit.
  - `app.long-task` and `app.long-animation-frame` (with `.blocking`, the blocking duration) cover the measured window the stock spec uses: after the three warm-up clicks, through the last switch. Entries outside it carry the suffix `.out-of-window`. Counts are in `observed`.
  - `queue.rate-limit-estimate` and `app.input-to-dispatch-minus-rate-limit` are estimates (clock `computed`): the pool dispatches no sooner than 1000 / `settings.acousticUpdateHz` (clamped to 10-15 Hz by the product) after the previous job, so the estimate is max(0, previous job's last handler end + interval - input time). It hides the rate limit from `app.input-to-dispatch`; it is not a measurement.

## Passes

- `stock`: the existing Playwright spec, unmodified, run as `corepack pnpm exec playwright test <spec> --workers=1 --retries=0 --trace=off`. Stdout, stderr, exit status and the spec's own metrics file are kept. A failing gate is data and stays a failed run.
- `bare`: browser-pool only. The production pool with only `now` (and the worker-count option) injected, no worker wrapper, no preamble. Exists to measure what the probes cost.
- `clean`: probes, no tracing, no profiler.
- `traced`: probes plus Chromium tracing with CPU sampling. Diagnostic only. At browser-pool the probes also emit `performance.mark("ec102:job:<seq>:dispatch")` and `...:complete` on main, and clock marks on main and on every worker.
- `alloc`: probes plus the V8 sampling heap profiler, without CPU sampling. Diagnostic only.

`clean` and `traced` runs are separate browser processes. Every run is a fresh browser process and a fresh page.

## Sample schema `ec102.sample.v1`

`samples.jsonl` has one object per measured value.

```json
{"schema":"ec102.sample.v1","runId":"","variant":"TS-W","caseId":"","requestSeq":12,"mode":"hybrid","sceneRevision":40,"staticFingerprint":"","phase":"shard.compute","duration":1.7,"units":"ms","outcome":"ok","boundary":"browser-pool","pass":"clean","workers":4,"workerIndex":2,"warm":true,"clock":"worker-perf-now","audio":"off","tapeStep":3,"jobKind":"pose-only"}
```

- Missing values are the strings `not-applicable` or `unavailable`, never 0. `requestSeq` and `sceneRevision` start at 1, `workers` is the observed worker count (`not-applicable` for TS-S), `workerIndex` and `tapeStep` start at 0.
- `outcome` is one of `ok, error, timeout, stale, coalesced, fallback, censored`. Statistics use `ok` samples; every outcome is counted.
- `warm` is false until both 100 jobs and 5 s have passed in that process. Cold samples stay in the file and are summarised apart.
- `clock` is one of `main-perf-now, worker-perf-now, main-date-now, worker-date-now, trace, computed, cdp`.
- `jobKind` is `pose-only`, `static-install` or `not-applicable`. A job is `static-install` when the static fingerprint changed from the previous job in this process, or for the first job; at the pool and in-app, when it posted `INSTALL_STATIC`. On such a job `COMPUTE_SHARD` queues behind `INSTALL_STATIC` on the same worker, so `shard.roundtrip`, `shard.transport`, `pool.compute-metric` and `merge.*` for those jobs are not comparable with pose-only jobs. Summaries report warm statistics per phase split by `jobKind` next to the combined figures.
- A few computed or timer-difference phases may be negative (`job.phase-residual`, `shard.transport`, `merge.validate`, `queue.timer-lateness`, `input.lateness`, `queue.wait`): they are remainders or differences of two clock readings, and a small negative value is data.

Per run directory `<out>/<runId>/`: `run-status.json` (written `started` before anything else), `environment.json`, `input-manifest.json`, `samples.jsonl`, `summary.json`, `parity-diffs.jsonl` (empty when parity ran and nothing differed; the text `not-applicable` when it did not run), `stdout.log`, `stderr.log`, `artifacts.sha256`, and pass-specific files (trace, analysis, heap profiles, calibration). `<out>/runs-index.jsonl` gets one line per run, failures included.

`pose.latest-wait` carries `censoredCount` and an `includingCensored` block over ok plus censored samples. A censored value is the time a submit had waited when the run ended, so the true wait is at least that long.

## Parity

`--parity` replays one frozen tape and compares the frames with `benchmarks/corpus/v1/expected`, bit for bit through `canonicalize` and then with the corpus comparison rules. It runs on four paths: node-core serial, browser serial, the production fallback, and the real pools (TS-W). Every differing leaf and every rule violation goes to `parity-diffs.jsonl`; nothing is normalised away. `summarize` prints bit-exact and rule-violation counts as separate columns.

## Environment fingerprint

`environment.json` holds the date, time zone offset, CPU model, core counts, RAM, OS name and build, power scheme, AC or battery state, Node, pnpm and Playwright versions, git SHA and dirty flag, browser facts for browser runs, and `otherActivity` sampled for 3 s before and after each run, outside any measured window (machine CPU percent, the top 8 process names by CPU with write MB/s, drive free space in GB by letter). `otherActivity.method` says whether the values came from performance counters (`get-counter`, tried twice) or from two `Win32_Process` snapshots (`win32-process`); it is `unavailable` only if both failed. It holds no host name, user name, command line or path.

`acpiThermalZoneC` is the reading of `MSAcpi_ThermalZoneTemperature`, an ACPI thermal zone. It is not the CPU package or core temperature, and on many machines it is a motherboard or chassis sensor that barely moves. It says nothing about thermal throttling. It is `unavailable` when the query is not allowed.

## Trace analysis

`traced` runs write `chromium-trace.json` and these files from `scripts/perf/trace-analyze.mjs`:

- `thread-map.json`: process and thread names, with roles (renderer main, worker, compositor, audio) and worker labels.
- `clock-alignment.json`: per thread, a least-squares fit of trace time against `performance.now()` and against `timeOrigin + performance.now()`, with `n`, `baselineMs` (the span of the marks, so a reader can tell whether a drift value means anything), offset, drift in ppm and the maximum residual. Marks are emitted on main before the window, at every submit, commit or post inside it, and after it; on workers, one mark per request handled once `__perf_trace_on` has been sent (traced passes only, so clean runs pay nothing). A drift value from a baseline of tens of milliseconds says nothing about a run. `crossThread` is the disagreement, in microseconds, between the worker's and main's fitted epoch clocks at a common instant.
- `gc.jsonl`: real collections only on JavaScript threads: `MinorGC`, `MajorGC`, and incremental-marking steps as their own kind, each with duration and heap before and after where V8 gives them. The nested `V8.GC_*` sub-events overlap their parent and stay in the raw trace only; counting them would count one collection many times. `gc-summary.json` has per-thread counts and pause totals. `gc-concurrent.json` aggregates background and parallel scavenge work on thread-pool threads, labelled concurrent and not a pause; its durations overlap each other across threads.
- `busy.json`: per thread, the outermost tasks in the window counted once each (RunTask and ThreadControllerImpl::RunTask nest; a nested task is absorbed by its parent), with wall time (`wallUs`, equal to `busyUs`), thread CPU time from the event's `tdur` (`cpuUs`, `unavailable` when no task carries it; `tasksWithoutCpuTime` counts the rest), `offCpuUs` (wall minus CPU, only when every task has a CPU time) and the five longest tasks with an exclusive-time breakdown by nested event name (a parent's time minus its direct children's, so the parts sum to the task; time no nested event covers is `(no child event)`).
- `job-decomposition.jsonl` and `job-decomposition-summary.json`: one line per job and worker on the trace clock: `dispatchToWorkerStartUs` (post end, mapped onto trace time with the main clock fit, to the matched worker task start), `workerTaskWallUs`, `workerTaskCpuUs`, `workerEndToMainHandlerUs`, `mainBusyDuringReplyWaitUs` (main-thread task time that overlaps that wait, with the tasks listed: wall, cpu, top exclusive names) and `reportedMetric`. The summary has N, p50, p95, p99 and max per field, overall and for the slowest 10 percent of jobs by reported metric. Browser-pool matches the worker task by thread and receive time; in-app the match is by rank and approximate, so a worker task paired with a line may belong to another worker (negative gaps are possible and are reported as found). Values are signed. `analyze <runDir>` regenerates these from the raw trace of an existing run.
- `job-decomposition-jobs.jsonl` and `job-decomposition-jobs-summary.json`: one line per job, with no worker pairing, at both boundaries. The window runs from the job's first post to the start of its last reply handler on main; worker tasks are the top-level tasks on `DedicatedWorker thread` threads that start at or after the first post (a task that straddles the first post is counted in `lateStartWorkers`, not in the timings). Fields: `requestSeq`, `jobKind`, `reportedMetric`, `firstPostToFirstWorkerStartUs`, `firstPostToLastWorkerEndUs`, `slowestWorkerWallUs` with its `slowestWorkerCpuUs` and `slowestWorkerOffCpuUs` (`unavailable` without `tdur`), `lastWorkerEndToLastHandlerStartUs` (may be negative), `mainBusyWallUs` (main top-level task time overlapping the wait from the latest worker task end to the last handler start), `mainBusyCpuUs` (the thread CPU time of those whole tasks, so it can exceed the overlapping wall time), the top three overlapping main tasks with wall, cpu and exclusive names, `lastHandlerUs` (clock resolution 0.1 ms), and `gcOnMainInWindowUs` and `gcOnWorkersInWindowUs` (real collections only). Three more fields describe the reply wait (the time between the latest worker task end and the last handler start): `mainOffCpuDuringWaitUs` (for each overlapping main task, the overlap minus the task's `tdur` scaled by overlap / wall, so an estimate because CPU inside a task is not uniform; `unavailable` without `tdur`), `rasterWallDuringWaitUs` with `rasterThreadsDuringWait` (the overlap of `RasterTask` events on `ThreadPoolForegroundWorker` threads of the renderer process with the wait, and the number of distinct threads), and `mainTaskHasFrameChildren` with `mainTaskFrameChildren` (which of `Commit`, `PrePaint`, `Layerize`, `Paint` occur inside an overlapping main task). The summary has a `counts` block, for all jobs and for jobs whose `reportedMetric` is at or above 8, 12, 25 and 50 ms: the number of jobs, the number where the reply wait exceeds the slowest worker task, and the number with frame children in the wait. The levels are rows of a report table, parameters of the report, not budgets or thresholds on anything; the block reports counts only. The summary has N, p50, p95, p99 and max per numeric field over all jobs, over the slowest 10 percent by `reportedMetric`, and per `jobKind`.
- `cpu-top.json` (self time by function, URL and line; in-app names are minified), `exemplars.json` and `exemplar-<seq>.trace.json` (sanitised slices of at most 300,000 bytes, loadable in DevTools, without CPU profile chunks).
- `compute-vs-trace.json`: for each job and worker, the reported compute time, the matching top-level task on the worker thread (searched between the job's dispatch and complete marks), the difference, and an explicit count of unmatched entries. At browser-pool the worker thread is known and the task containing the worker's receive time is chosen. In-app the worker threads cannot be told apart, so a job's largest worker tasks are paired with its reported values by rank, and the reported values are whole milliseconds. The task also holds deserialisation and the reply post, so it is expected to be at least the reported value; differences of about 0.1 ms are within the clock resolution.

A trace slice is sanitised by the same rules `scan` enforces: no absolute path, file URL, user name, host name or `command_line` metadata.

## Safety rules

- `--out` and `--to` must resolve inside the repository root; the command refuses otherwise.
- On Windows the harness refuses to start unless TEMP, TMP and TMPDIR are all set inside the worktree. They are passed explicitly to every process it starts, so temporary files, browser profiles and bundler caches stay off the system drive.
- No process is started through a shell or from a command line built by string concatenation; every spawn takes an argument array. The stock pass runs `corepack.js` with node and an argument list.

## Evidence

`summarize` is pure and can be re-run. It writes, into the evidence directory: `runs-index.jsonl`, `groups.json`, `comparisons.json`, `tables.md` (pooled and per-run statistics, warm and cold apart, dispersion across runs, per `jobKind`, plus parity per path, paired TS-S and TS-W differences by order index, and traced-against-clean and clean-against-bare overhead), `large-artifacts.sha256` (checksum and size of the raw files that stay in `.perf-runs`) and `artifacts.sha256`. Per run it copies only small sanitised files. Raw traces, `samples.jsonl` and probe dumps stay out; `--with-slices` adds the first exemplar slice of each run.

## Re-deriving a run

`rederive <runDir>` rebuilds `samples.jsonl` and `summary.json` of an in-app run from `probe-dump.json` and `runner-result.json`, and for a traced run redoes the trace analysis from `chromium-trace.json` with the job-window inputs of the new samples. Nothing is re-measured and no browser is started. `run-status.json` keeps `originalStatus` and `originalError` and gains `rederivedAt` and `rederivedByCommit`; `status` is then set from the run's own result, so a run whose measurement really failed (a timed-out switch, a wrong worker source or count) stays failed. One line with `rederivedFrom` is appended to `runs-index.jsonl`; `summarize` uses the last line per run id and lists rederived runs in its output and in `tables.md`. Audio render-capacity samples are rebuilt only when `audio-samples.json` was kept (newer runs); older runs that failed before writing samples lost them, and `rederive` says so in `run-status.json` (`rederivedAudio`).

Events with no job ordinal (long tasks, long animation frames, audio samples) are warm once the run is past the job-count threshold (100 commits) and the time threshold (5 s after the first commit) together; a run with no more than 100 commits has none. Audio samples without a kept timestamp are placed by index at the sampling interval, which is an estimate.

## Known limits

- **Clock resolution.** Without cross-origin isolation Chromium coarsens `performance.now()` to 0.1 ms on main and on workers (measured: 0.0999999 ms on both). A value below about 0.1 ms is a difference of two coarse readings. Calibration pings (64 per worker, at the start on short-lived probe workers and at the end on the pool's own workers) give round-trip bounds, not an exact offset. In-app, worker durations come from the production workers' `Date.now()` and are whole milliseconds.
- **Vite bundle against the production Turbopack bundle.** The browser-pool page and its workers are built by Vite (resolved through vitest, which is where Vite 8 and Rolldown come from) with minification off. The product ships a Next.js Turbopack bundle. The solver source is the same, but code generation, chunking and worker bootstrap differ, so browser-pool and browser-app numbers are separate columns and are not interchangeable. The worker preamble is added only at browser-pool; in-app workers are production code, unmodified.
- **Hybrid acceptance is reimplemented.** `resolveHybridAcousticPresentation` lives in `HybridViewportAdapter.tsx`, which cannot be imported without the UI tree. `replay-pool.ts` copies its decision (current frame, or pose-lagging frame with the same static fingerprint and ordered sources). `accept.decide` is therefore `not-applicable` for Hybrid at browser-pool; the in-app runs measure the real one.
- **1-ulp parity differences.** In Chromium the same code gives a few last-digit differences from Node (for example `108.43494882292202` against `108.43494882292201` in an azimuth). They are the same on every browser path and sit inside the corpus comparison rules, so bit-exact is false and rule violations are zero. They are reported as found.
- **Headless audio is not hardware output evidence.** `audio.render-capacity` and `audio.callback-interval-mean` come from Chromium's `WebAudio.getRealtimeData` in a headless browser. They are browser load indicators. `baseLatency` and `outputLatency` are what the headless context reports, not a measured output path.
- **Pool workers are created lazily.** The first job of a process includes worker creation, as in the product, and is a cold sample. The `alloc` pass attaches to a worker when Chromium announces it, so allocations before that moment are not sampled.
- **Pose, copy and projection.** Hybrid `input.project` uses `createSceneDocumentV2` plus the compiler, as the design says; the app itself uses `projectHybridDocument`.
- **One machine, one browser build.** Results describe the machine and browser recorded in `environment.json`. macOS was not run; the non-Windows branch of `env.mjs` only marks Windows-only fields `unavailable`.
- **No thresholds.** Nothing here compares a number with a budget. The 12 ms and 50 ms budgets belong to the existing gate and the `stock` pass reports what that gate saw.
