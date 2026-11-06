VERDICT: NOT_VERIFIED

Windows only. The remeasurement reproduces the main commit-wait and Hybrid static-install mechanisms, but the stated Windows acceptance is not met: open-loop warm labels are wrong, merge samples are lost on timestamp ties, and per-worker trace summaries overwrite distinct workers. All requested quality gates pass and the branch-scoped privacy scan has no in-scope hits. The honestly retained published stock failures are not a reason for this verdict. macOS remains an open limit and is not a reason for this verdict. No product code, formulas, parameters, corpus, thresholds, Git history or published state was changed.

Environment and execution

HEAD: 63a50c6828a903c101b53b8e6f13c52cec5ac56f. Merge base with origin/main: 46c61c5df7b6d2270c3469dcf240496dc1c2ac0a. Fresh clone initially clean and still clean after verification. Windows 11 Home build26200 x64; i9-13980HX,24 physical/32 logical cores,31.63GB RAM; Turbo power, AC online,80% battery. Node22.23.3/V8 12.4.254.21-node.57; pnpm11.7.0; Playwright1.64.1; Chromium headless shell156.0.8078.4, executable hash prefix f77d8e27c8db1e4a. Default1280x720/DPR1. GPU rasterization and compositing report disabled_software; WebGL reports SwiftShader. Headless AudioContext48000Hz, reported base/output latency0.01/0.04s. These are not measured hardware output latencies. ACPI27.9C is not CPU package temperature.

The 54 component-driven runs span 2026-11-06T16:46:15.379Z to 2026-11-06T17:47:59.981Z, 61.74 minutes including setup, analysis and activity collection. Stock runs preceded them. Measurements ran one at a time. No build, test or independent analysis ran during a measured window. Before/after3-second machine CPU observations range3.011–28.669%; they are not continuous scheduling evidence. Active names included Defender, service hosts, browsers/chat clients and installers. Monitoring/driver Node and PowerShell names also occur. Other programs were left alone. Drive free space changed substantially during the session; snapshots are retained. No causal claim about a particular outside program is justified.

TEMP/TMP/TMPDIR and all tool caches, profiles, generated files and reports were directed into the verification parent. No global reinstall or outside-area cleanup was performed. Large raw traces peaked at approximately665MB retained at once, were independently parsed, checksummed and removed before the next capture. Small trace summaries and exemplars remain.

The standard perf CLI refuses the mandated sibling TEMP. Its guard was never relaxed. Independent orchestration reused unchanged production pools/solvers, replay functions, UI fixture helpers, probes, reducers and trace analyzer, with the same Vite build options in a separate output directory. This is a material reproducibility departure from the requested CLI. The build remained the production Next build. The known-input tests and raw-sample recomputation check the reused instruments. Component preparation and exact executed entries are in evidence/driver-components.json and evidence/executed-plan.json.

Commands (Bash; VERIFY_ROOT denotes the absolute verification parent, deliberately omitted for privacy):

```sh
export TEMP="$VERIFY_ROOT/tmp" TMP="$VERIFY_ROOT/tmp" TMPDIR="$VERIFY_ROOT/tmp"
export COREPACK_HOME="$VERIFY_ROOT/cache/corepack" npm_config_cache="$VERIFY_ROOT/cache/npm" XDG_CACHE_HOME="$VERIFY_ROOT/cache" PNPM_HOME="$VERIFY_ROOT/bin" NEXT_TELEMETRY_DISABLED=1
corepack enable --install-directory "$VERIFY_ROOT/bin" pnpm
export PATH="$(cygpath -u "$VERIFY_ROOT/bin"):$PATH"
corepack pnpm install --frozen-lockfile --store-dir "$VERIFY_ROOT/cache/pnpm-store"
corepack pnpm build
node ../tools/prepare.mjs
node ../tools/instrument-assertions.mjs
node ../tools/live-instrument.mjs
corepack pnpm exec playwright test tests/e2e/workspace.spec.ts --grep 'survives the full entity-limit' --workers=1 --retries=0 --trace=off --output=.perf-runs/verify-direct/<run-id>
node ../tools/direct-stock.mjs
node ../tools/measure.mjs ../report/evidence/plan-instruments.json
node ../tools/measure.mjs ../report/evidence/plan-app.json
node ../tools/measure.mjs ../report/evidence/plan-pool.json
node ../tools/measure.mjs ../report/evidence/plan-open.json
node ../tools/measure.mjs ../report/evidence/plan-trace-0.json
node ../tools/measure.mjs ../report/evidence/plan-trace-1.json
node ../tools/measure.mjs ../report/evidence/plan-trace-2.json
node ../tools/measure.mjs ../report/evidence/plan-parity.json
node ../tools/measure.mjs ../report/evidence/plan-extra.json
node ../tools/measure.mjs ../report/evidence/plan-instrument-controls.json
node --max-old-space-size=6144 ../tools/recompute.mjs
node ../tools/fault-audit.mjs
```

The live instrument test initially failed to start a module worker on about:blank; serving its unchanged test on loopback produced the successful37ms/73ms control. The first stock attempt v-stock-a failed before measurement because the verification shim was not first in the effective Windows PATH; it is retained. v-stock-b passed without a complete activity record. v-stock-c through v-stock-g are the five fully recorded stock runs; all pass. There was no retry of a failed performance sample under the same run ID. The original stock spec and budgets remained unchanged.

The prewritten plan used 500 switches per application run, two independent clean TS-W audio-on runs, audio off and forced fallback; two pairs of every small tape with448/432 jobs (348/332 warm); complete W01–W04 tapes in both variants; parity on Node/browser serial/fallback/Worker; controls at both boundaries; bare and allocation diagnostics. Adaptive extensions were recorded: an immediate-driver trace and a CPU-sampling-off trace, each500 switches; and an allocation rerun with the original calibration/attachment order. The first allocation run saved5 production profiles but included2 closed-calibration-target stop errors, retained in its notes. The second has4 production workers,5 profiles and no attachment errors. No committed plan was read or reused before the blind answers.

Independent checks cover1446 warm/cold phase-statistic sets with no numerical mismatches. This agreement does not validate the original warm labels: their semantic error is separately demonstrated below. Worker bundle checks show the preamble before one production listener per module; all measured probe-pool requests have one corresponding worker record/reply. A chosen37ms calculation lands in worker computation/handling, not transport; a separate73ms main block lands in the long-task observer. Synthetic nested task/GC/thread inputs expose the distinct reducer defects.

Blind answers, unchanged

The following is the exact content of blind-answers.md, frozen before findings were opened; its SHA-256 is in evidence/blind-answers.sha256.

# Blind answers — Windows EC-102

Written before opening the candidate findings, task acceptance page, committed plans/results, or dated EC-102 handoffs/sessions. All numbers below come from this verification. Times are milliseconds unless stated otherwise. Percentiles use nearest rank. Values near 0.1 ms are quantized; zero does not mean no work. Percentiles from different phases must not be added.

The candidate HEAD and merge base match the requested commits. Production build and frozen installation completed. The standard perf CLI rejects the required sibling TEMP directory. I did not change its guard. I used independent orchestration of unchanged replay functions, production solver/pools, UI fixture helpers, probes and reducers. This departure from the requested CLI is recorded in the executed plan. Every measured browser run had a fresh browser/page. Runs were serial, with no simultaneous build, test or analysis. Before/after machine activity was recorded. The six completed direct stock runs used the unmodified spec; five have full activity records. A preceding stock startup failure is retained separately.

Q1. What determines the slowest 1–2% of the in-app worker metric?

There is not one demonstrated cause for the entire slowest 1–2%. The clean TS-W audio-on runs have 400 warm samples each: p50/p95/p99/max are 2/5/9/154 and 2/4/6/193. Audio off is 2/4/6/84. These large clean outliers were not captured concurrently with a trace, so I cannot assign each of them a cause.

The two CPU-traced, poll-driven runs show concrete browser commit waits among their largest jobs. In trace A, job 39 reports 53 ms. The first post is at trace time 102537475002.367 us, all worker tasks end by 102537480465 us, and the last reply handler starts at 102537526502.365 us. Thus first post to last worker end is 5.463 ms, followed by 46.037 ms waiting for the last main-thread handler. The slowest worker task is 3.308 ms wall / 2.655 ms CPU. The overlapping main task is 41.770 ms wall / 4.697 ms CPU and contains 40.853 ms in LayerTreeHost::WaitForCommitCompletion. The remaining difference includes preparation/validation and whole-millisecond metric quantization. This is a browser frame/commit wait, not 53 ms of acoustic calculation.

Trace A job 119 reports 41 ms, with a 2.524 ms slowest worker task and 36.899 ms reply wait. Trace B job 99 reports 45 ms, with a 4.742 ms slowest worker task and 39.331 ms reply wait; its main task contains a 38.486 ms commit-completion wait. These examples occur among the first 100 measured switches, which the harness calls cold even though the UI fixture already had three warm-up clicks. The warm traced maxima are 41 and 6 ms, respectively. Most other top-percentile jobs are only a few milliseconds and include ordinary worker work and shorter reply delays. It would be too strong to attribute every top-percentile sample to one mechanism.

The browser reports software rasterization/compositing and SwiftShader. Raster activity overlaps the waits. This supports a browser rendering/commit explanation for these examples, but does not prove the ultimate scheduling or GPU-process cause. I cannot name an outside process responsible without OS scheduling evidence.

Q2. How often does the stock spec fail, and why?

Zero of the five fully activity-recorded stock executions failed. Their p95 values are 5, 4, 5, 3 and 4 ms; all five have no long tasks. An additional completed stock execution passed. The earlier startup attempt failed before measurement and is not a performance-gate failure.

I did not reproduce an actual stock budget failure. The unchanged assertions require p95 <12 ms over 24 samples and every observed long task <=50 ms. For 24 samples, nearest-rank p95 is rank 23: two samples at or above 12 ms can fail the compute assertion. One long task above 50 ms can fail the other assertion. The clean 500-switch runs contain such large elapsed values and long tasks, while the same candidate also passes short stock runs. Timing-dependent pass/fail on unchanged code is therefore plausible, but these are different windows and this is not an observed failed stock execution. The traced commit waits explain particular slow metrics; I cannot prove the cause of stock failures I did not observe.

Q3. What are the long tasks made of? Is all of it product code?

Cannot tell for the clean-run long tasks. The clean audio-on/off/fallback/on runs record 9/5/8/3 long tasks in their measured windows. None of the four application diagnostic traces (two CPU sampled, immediate driver, and timeline-only) contains a >=50 ms main task in the measured window. Removing CPU sampling did not recover those events. I therefore have no simultaneous raw trace with which to classify the clean long tasks.

The positive controls prove that the observer also records harness work: the requested 60 ms injected main block is observed. Browser rendering/commit work is present in application traces, and automation is part of these executions, but that does not classify the untraced clean long tasks. I cannot say all of those tasks are product code, nor that they are all automation.

Q4. Where do the separate phases stand?

For clean application run v-app-on-a, the following independently recomputed warm statistics describe the probes, not physical display or audio output:

| Phase | N | p50 | p95 | p99 |
| --- | ---: | ---: | ---: | ---: |
| Input to dispatch | 400 | 18.0 | 40.1 | 70.2 |
| Rate-limit estimate (computed) | 400 | 0 | 36.43 | 50.63 |
| Per-worker shard post | 1600 | 0 | 0.1 | 0.2 |
| Per-worker reported compute | 1600 | 1 | 2 | 4 |
| Per-worker round trip | 1600 | 1.8 | 3.6 | 6.7 |
| Main reply-data access | 1600 | 0 | 0.1 | 0.1 |
| Main reply handler | 1600 | 0.1 | 0.4 | 0.7 |
| Last handler to viewport observer | 400 | 0.9 | 3.4 | 4.6 |
| Last handler to first AudioParam call | 400 | 1.1 | 9.4 | 62.8 |
| Last handler to status observer | 400 | 2.5 | 13.5 | 65.6 |
| AudioParam apply span | 400 | 0.1 | 0.4 | 0.6 |
| Sum of timed AudioParam calls | 400 | 0 | 0.2 | 0.5 |
| Viewport observer to frame-end proxy | 400 | 12.9 | 22.9 | 58.7 |
| Status observer to frame-end proxy | 400 | 11.6 | 16.8 | 35.3 |
| Input to status observer | 400 | 24.6 | 70.0 | 180.8 |

The frame-end proxy is a requestAnimationFrame followed by a MessageChannel task. MutationObserver delivery is a commit proxy, not a React instrumentation point. Hybrid's pure acceptance predicate is not isolated by an application timer; the handler-to-observer spans include other work. In browser-pool it is explicitly not-applicable. Actual AudioParam call time is small, while waiting to reach the effects/commit can be much larger. The worker metric excludes the earlier rate-limit queue and the later UI/audio handoff, so these must not be conflated with its tail.

The measured application switches are pose-only, so their install phase is not applicable. In full Hybrid static-edit replay, per-worker install post is 3.3/3.7/3.8 ms and receiver event-data access is 5.9/6.6/7.0 ms; ACK round trip is 11.2/17.2/18.3 ms. Classic equivalents are about 0.1/0.2/0.3, 0.3/0.4/0.5 and 0.6/0.9/1.2 ms. These are concurrent/nested phases, not additive independent costs. Receiver event-data access is not a measurement of all structured-clone work.

On the closed tapes, intentional queue waits are roughly 90 ms at the fixture's 12 Hz setting, including timer lateness. In the Hybrid open static run, queue wait is 5.4/12.2/13.3 ms; the complete raw assembly series after 100 dispatched jobs is 0/0.1/0.1 ms. Merge validation is sub-millisecond in the recorded rows. However, the reducer drops some assembly rows when handler timestamps tie, so the original merge summaries are incomplete. Open-loop result phases also mark samples warm before 100 jobs. Both faults are documented in reducer-fault-audit.json. Queueing and UI/effect scheduling matter to interaction latency; install/clone matters to static-edit latency; the demonstrated large worker-metric examples are main-thread reply waits.

Q5. Which workloads favor Workers, and how stable is that?

Closed-tape job/compute boundaries, p50/p95/p99, with two independent runs per variant:

| Tape | Serial A; B | Worker A; B |
| --- | --- | --- |
| TC01 | 0.3/0.5/0.6; 0.3/0.5/0.6 | 0.6/0.9/6.1; 0.6/0.8/1.4 |
| TC02 | 0.3/0.6/0.9; 0.4/0.6/0.7 | 0.6/0.9/1.1; 0.7/1.0/1.9 |
| TH01 | 0.5/0.9/1.4; 0.5/0.9/1.1 | 0.8/1.3/1.6; 0.8/1.5/2.1 |
| TH02 | 1.2/3.2/3.6; 1.4/3.4/3.7 | 1.7/2.8/3.4; 1.8/3.1/3.7 |

Listener runs have 348 warm jobs; edit tapes 332. Worker overhead dominates these small cases. Hybrid edits change ordering by percentile, with a slightly better Worker p95 but no stable p99 advantage. Extreme tails vary substantially even when medians repeat. These sample counts make p99 exploratory.

For full-length large workloads, I independently excluded the first 100 actual dispatched/computed jobs, rather than accepting the reducer's open-loop warm flags:

| Workload | Serial p50/p95/p99 (N) | Worker p50/p95/p99 (N) |
| --- | --- | --- |
| W01 Hybrid pose | 4.2/5.9/6.5 (573) | 2.3/5.4/6.1 (586) |
| W02 Hybrid static | 3.5/5.9/6.6 (239) | 12.8/22.6/24.4 (203) |
| W03 Classic pose | 3.7/5.3/5.6 (502) | 1.6/2.8/3.5 (604) |
| W04 Classic static | 3.3/5.0/5.7 (202) | 2.3/3.6/4.3 (248) |

Workers help the large pose cases and Classic static workload. Hybrid frequent static installation is much worse. Only one clean full-length run per variant was taken for these cases, so between-run stability of W01–W04 is not established. The original W02 Worker warm summary is 6.4/23.0/24.6 (N=249); correcting the warm definition changes its median to 12.8 because this is a bimodal pose/install mixture. Preserve the split by job kind.

Q6. What does a static edit cost, and where?

On TH02 serial, static-install jobs are 1.9/3.3/4.5 ms versus pose-only 0.6/2.5/2.9. Static compilation itself is 0.6/0.8/1.3. TC02 serial static building is at/below 0.1 ms at p95, and complete static-install jobs are 0.3/0.6/0.9. Small-tape Worker install ACK round trips are 0.9/1.1/1.3 ms for Hybrid and 0.2/0.4/0.4 for Classic.

For the full 100-wall workload after the first 100 actual jobs, Hybrid Worker static-install jobs are 20.8/23.4/24.6 ms (N=102), versus its pose-only jobs at 2.7/5.0/6.0 (N=101). Hybrid fallback static jobs are 3.1/6.0/6.6 (N=105). The large Worker installation/post/data-access cost in Q4 is consistent with that gap, while shard calculation remains much smaller. Classic Worker static-install jobs are 2.7/3.7/4.3 (N=107), versus pose-only 2.0/3.3/4.2 (N=141). Classic fallback does not provide a usable static fingerprint in these logs, so I cannot give its exact static/pose split from that field. These are different Classic/Hybrid algorithms and boundaries, not interchangeable physical models.

Q7. Does replay match the frozen corpus exactly?

Node is bit exact on all four tapes, 176 steps total. Chromium is not bit exact. Browser serial, production fallback and Worker each have the same differing-leaf counts: TC01 29, TC02 19, TH01 21, TH02 4. All three browser paths have zero corpus-rule violations and all expected steps, totaling 528 browser steps. All differences remain recorded; none were normalized away.

Q8. How do clocks align?

Independent least-squares fits over the two production CPU traces use 2540 main-thread marks each, over 81.244 and 81.567 seconds. Drift estimates are -0.0287 and +0.0378 ppm, with maximum residuals 168.6 and 224.1 us. Immediate-driver and timeline-only fits span 45.295 and 67.990 seconds, with residuals 213.5 and 101.4 us. These support sub-millisecond alignment of main timestamps to the trace over those baselines, not exact cross-thread one-way latency.

Pool controls measure about 0.1 ms clock resolution on main and workers. Their 200 marks span only about 0.919 s; cross-thread epoch-fit disagreement is about 200 us and the apparent roughly +/-20 ppm worker drift is not a useful long-run drift estimate over that short span. The pool audit spans about 2.220 s. In-app workers remain unmodified Date.now clocks with integer-ms durations and no per-worker clock-mark fit. Their individual task matching by rank is approximate; the job-level trace comparison avoids that pairing. I cannot claim a calibrated in-app absolute worker clock or hardware audio clock.

Instrument/evidence checks: a chosen 37 ms worker calculation produced exactly one reply and one worker record, with a 37 ms metric / 37.2 ms handler, while separate main blocking produced a 73 ms long task. Nearest-rank statistics independently match 1446 phase/temperature summaries. A synthetic nested-task test counts a 73 ms task once. It also proves that same-named worker entries overwrite each other in busy summaries (11 ms retained instead of 18 ms across two workers), and that GC summaries include events outside the declared window. Real trace A has four worker threads totaling 1609.010 ms of task wall time, while its single retained worker entry is only 374.521 ms. Production listener/bundle and per-message record checks show single handling of requests. No product fix, formula change or budget change was made.

Limits: Windows headless browser only; no macOS, ETW scheduling trace, physical audio output/listening, hardware loopback, or long-session stability experiment. The immediate-driver and timeline-only controls do not establish why rare clean-run spikes occurred. Large raw traces were independently read, checksummed and removed serially to respect storage limits; their small summaries and exemplars remain.


After reading the candidate claims

The source’s measured static-install cost is close to the independently observed per-install cost (20.4ms historical quiet median versus20.8ms here), and its main-thread commit-wait mechanism is corroborated by direct WaitForCommitCompletion events. The claim is narrower than “all slow jobs are workers”: the source also records an exceptional slow worker, which I did not reproduce. The viewport, browser/GPU-flag, invalidation and no-mangling experiments were not independently repeated. Their causal/specific numerical claims remain NOT RECHECKED.

The source explicitly calls its aggregate GC counts overall-run counts. The blind synthetic result establishes a window-scope distinction, not proof of nested-GC double counting. The same-named worker-key loss remains a defect. Hybrid acceptance and display timings also remain documented proxies rather than pure-predicate or physical presentation measurements.

My clean runs had25 long tasks across four500-switch runs, but none of the four new diagnostic traces captured a >=50ms main task in-window. The published A/B/C long-task classification is therefore NOT CONFIRMED by my remeasurement. The source appropriately leaves the114ms stock task unattributed; I have not reclassified it. All seven explicit hypotheses have disproof methods. No page recommends changing12ms or50ms. Pages describe prior harness bug corrections; none claims a product performance fix. The p95 generalization and acceptance-completeness wording are stronger than the data.

Timing differs with machine state. CONFIRMED below denotes reproduced shape/mechanism or comparable order of cost, not identical historical values. NOT CONFIRMED is not an assertion that a historical run could not have happened. Archival number agreement is distinguished from new measurement. The table and full numeric-line coverage preserve untested claims rather than silently treating them as verified.

Claim table. CONFIRMED means the mechanism or order of cost reproduced; it does not require identical timing on a changing desktop. Historical file agreement is distinguished from fresh measurement.

| Claim (source lines) | Status | Independent result / limit |
| --- | --- | --- |
| Environment, versions and production worker counts (11–17) | CONFIRMED | Same i9-13980HX, 24/32 cores, 31.63 GB, Windows build 26200; Node 22.23.3; Chromium 156.0.8078.4; 4/2 workers, 0.1 ms clocks, 48000 Hz audio context. |
| Source unchanged and frozen workloads (18,59) | CONFIRMED | Protected diff empty; package change is only the perf script; 5 regenerated files byte-identical; fixture hashes 6dc9f361 / 2483580d. Historical build ID not re-created. |
| Historical load, memory charge, disk intervention and harness commits (19,21,27–31) | NOT RECHECKED | New before/after CPU range 3.011–28.669%; no continuous memory-charge or scheduling record. Historical actions were not repeated. |
| 109 indexed runs including 12 stock runs (51) | CONTRADICTED | 109 unique main-index IDs, 115 history lines; 11 stock rows include one drag case and 10 H100 cases. The 12 H100 rows are in stock-gate.jsonl and include two additional pilot IDs. |
| Six rederived failures preserve history (53) | CONFIRMED | 6 original failed rows and 6 appended rederive rows; all 6 run statuses retain originalStatus=failed and originalError. |
| Node/browser parity and 2-ulp maximum (61,63) | CONFIRMED | Own 176 Node steps bit exact; browser differences 29/19/21/4, fields {"gainDb":33,"lowpassHz":15,"azimuthDeg":21,"estimatedMidGainDb":4}, max 2 ulp, 0 rule violations on all three browser paths. |
| V8 Math-version explanation (65) | NOT CONFIRMED | Same differences recur, but an operator-by-operator disproof experiment was not performed. |
| Clock scale/alignment (69) | CONFIRMED | Own main fits over 81.244/81.567 s: residual 168.6/224.1 us, drift -0.0287/+0.0378 ppm. Historical worker long-baseline fit not rechecked. |
| Historical per-worker matching counts/ranges (71) | NOT RECHECKED | Own independent job-level matches 497/500 and 496/500; rank pairing remains approximate. |
| Positive controls (73) | CONFIRMED | 60.2 ms main and 40 ms worker blocks; own live 73/37 ms independent input; audio move 203 parameter operations. |
| Clean in-app central distribution and rare large maxima (85–88) | CONFIRMED | Own warm A 2/5/9/max154 and B 2/4/6/max193, N400 each; per-shard p99 4 ms in A. Historic summary values cross-referenced exactly. |
| Large in-app metrics can be main commit-completion waits (79,90,92) | CONFIRMED | CPU traces: metrics 53/41/45 ms; reply waits 46.04/36.90/39.33 ms; slowest worker 3.31/2.52/4.74 ms. Direct WaitForCommitCompletion events. Ultimate raster/scheduling cause not isolated. |
| Viewport causal numbers, layer-specific totals and full-browser/GPU switches (94–107,111) | NOT RECHECKED | Only 1280x720 default shell remeasured. Own cadence and CPU-sampling controls did not reproduce rare stalls; they do not test viewport scaling. |
| 400-sample p99 called fourth-largest (105) | CONTRADICTED | ceil(0.99*400)=396; the 396th ascending value is the fifth-largest. The harness implementation itself uses the correct rank. |
| True GPU raster would reduce waits (109) | NOT CONFIRMED | Own shell still has disabled_software compositing; no GPU-enabled or headed run. |
| Stock 3/12 failure frequency (117) | NOT CONFIRMED | Fresh 0/5 fully activity-recorded failures, plus one extra pass. Archived 9 passes/3 failures and budget-specific failures are retained and cross-referenced. |
| 24-sample nearest-rank arithmetic (115) | CONFIRMED | ceil(0.95*24)=23, second largest. Two >=12 ms values or one >50 ms long task can fail their respective unchanged assertions. |
| Rare-spike rate and independence calculation (119) | CONFIRMED | Own >=12 ms warm counts 4/400, 4/400. Archived 20/2600=0.769%; independent binomial >=2 of 24 is about 1.5%. Independence itself is unproven. |
| Load sensitivity/clustering explanation (113,121) | NOT CONFIRMED | No controlled-load experiment or independence test; machine state differs. |
| Long-task A/B/C taxonomy and timings (123–135) | NOT CONFIRMED | Clean 9/5/8/3 long tasks; 0 >=50 ms main tasks in all four new application diagnostic traces. No simultaneous raw trace classifies the clean long tasks. No-mangling build not repeated. |
| All listed C helper names have zero product occurrences (131) | CONTRADICTED | Distinctive elementSafeTagName/getExplicitAriaRole/computeBox have 22/4/5 Playwright occurrences and0 product occurrences. Generic query has1 source/29 production occurrences; querySelectorAll has5 production occurrences. This is text occurrence, not function-definition or CPU-callsite attribution; the taxonomy itself remains unconfirmed. |
| Hybrid static installation dominates Worker cost (137–143) | CONFIRMED | Corrected warm static jobs W02 20.8/23.4/24.6 ms versus fallback 3.1/6.0/6.6. Per-worker post 3.3 ms, data access 5.9 ms, ACK 11.2 ms medians. Classic post 0.1 ms, ACK 0.6 ms. |
| Pose latency dominated by queue/rate limit (145–158) | CONFIRMED | 12 Hz =83.33 ms. Own pose-wait W01 Worker 48.50/89.60/94.70 ms, serial 50.40/89.90/94.00 ms; W03 Worker 49.90/88.40/91.90 ms. Timer lateness near 8–9 ms on closed tapes. |
| Windows idle-timer coalescing mechanism (160) | NOT CONFIRMED | No active-timer or OS high-resolution-timer control performed. |
| Large-workload p50/p95 benefit, p99 variability (168–171) | NOT CONFIRMED | New W01/W03 medians favor Worker, but W03 p99 also favors Worker (3.5 vs5.6), unlike the two historical runs. One fresh run per variant cannot establish run-to-run stability. |
| Workers lower p95 in both workloads/rounds (171) | CONTRADICTED | The source’s own W01 Round1 table says Worker p95=10.9 ms and serial p95=7.2 ms. New quieter W01 is5.4 vs5.9; that does not repair the historical generalization. |
| Small tape serial advantage (173) | CONFIRMED | All 8 paired comparisons have lower serial medians. TH02 p95 sometimes favors Worker; not a universal percentile claim. Node-core timing figures were not remeasured. |
| 1/2/4 worker scaling numbers (175) | NOT RECHECKED | Production default only: 2 workers on small tapes, 4 on large workloads and app. |
| Merge/GC/audio call costs not explaining demonstrated commit waits (177–185) | CONFIRMED | App merge handler0.1/0.4/0.7; AudioParam summed call time0/0.2/0.5 ms. Demonstrated waits are36.9–46.0 ms. Whole-trace GC totals have a different window; merge samples have omissions. |
| Audio-on/off/render-capacity historical figures (185) | NOT RECHECKED | Own worker metric on p99 9/6, off6; audio apply p950.4. Only one off run; no comparable device-output measurement. |
| Hybrid projection/validation >100 ms outliers (187–189) | NOT CONFIRMED | Same validation code path executes, but no new W01 CPU trace reproduces103/110 ms tasks. |
| W01/W03 allocation amounts/functions (191) | NOT RECHECKED | Those raw heap profiles are absent from all three archives; checksums only. New allocation case is W02, not W01/W03. |
| Browser-pool/app projection boundary differs (193) | CONFIRMED | Source inspection: pool creates SceneDocumentV2; app uses projectHybridDocument. Numbers are separate boundaries. |
| Scheduling/page-fault explanation for validation stalls (195) | NOT CONFIRMED | No ETW/WPR context-switch or hard-fault counters. |
| Windows phase/percentile acceptance fully satisfied (202–204) | CONTRADICTED | Early warm labels, missing merge assembly rows and overwritten same-named worker summaries prevent complete phase/worker evidence. |
| Every attempted success/failure preserved (201,222–223) | NOT CONFIRMED | Main and stock histories inspected, but the source itself documents unindexed lost smoke output and an interrupted started run not present in the archives. |
| All bottleneck explanations labelled or traced (205) | CONFIRMED | Mechanism sections point to diagnostics; seven hypotheses each have a disproof method. The p95 generalization and completeness assertions are stronger than their evidence. |
| No product fix/budget change; macOS and other goals open (5,206,208,212) | CONFIRMED | Source/e2e/budgets unchanged; only scripts added. Docs record instrument corrections, not a product fix. macOS not independently run and not a reason for the Windows verdict. |
| Historical corrections and external-write incident (216–223) | NOT RECHECKED | Six rederive histories verified; historical binary selection, pilot attribution and outside-area incident were not reconstructed. No outside-area files inspected. |


Findings, ranked

1. Medium — Open-loop warm/cold labels count input events instead of completed/dispatched jobs. scripts/perf/derive-pool.mjs:205 calls warmAt(step.index,...). In W01 Worker, the first warm result is request59, with42 result samples warm before100 dispatched jobs. W02 has46 such premature warm rows. Its published-style warm median changes from6.4ms (N249) to12.8ms (N203) when the100-job rule is applied independently; the install/pose mixture is bimodal. Reproduce with the full W02 raw log and ../tools/fault-audit.mjs. Evidence: reducer-fault-audit.json, independent-statistics.jsonl. This invalidates an unqualified claim that warm and cold evidence meet the specified rule.

2. Medium — Equal timestamps cause missing merge assembly samples. scripts/perf/derive-pool.mjs:82 selects the last handler by h0 alone. Coarsened timestamps tie; stable sorting can select the earlier handler, whose h1–h2 interval excludes assembly. TC01 Worker A/B have448 raw assemblies each but54/74 assemblies are not attached by the reducer; all are recovered by actual logged handler order. TH02 A misses22/432. This is data omission, not missing product frames. Reproduce from those raw logs or the independent fault audit. Full raw assembly after100 W02 jobs is0/0.1/0.1ms, but the existing reducer’s sample population is incomplete.

3. Medium — Per-worker trace summaries overwrite threads with identical names. scripts/perf/trace-analyze.mjs:811 and:844 key busy and CPU tables by label(key). In-app workers are all named DedicatedWorker thread. Independent trace A totals1609.010ms worker task wall time over4 workers, but busy.json retains only374.521ms under one key. The deterministic two-worker synthetic input retains11ms instead of18ms. GC per-thread labels also collapse worker identities, and its summaries are whole-trace rather than measured-window filtered (line742). This does not invalidate the independent job-level reply-wait example, but it defeats complete per-worker occupancy/CPU evidence. Reproduce with ../tools/instrument-assertions.mjs; inspect synthetic-audit.json and the independent trace summaries.

4. Medium — Some published allocation claims lack the expected packed raw backing. The raw-profile archive has1 Node CPU profile and6 heap profiles (5 application,1 Node). W01/W03 main/worker heap profiles supporting the499/375/342MB and1094MB figures are not in any archive; their hashes occur only in large-artifacts.sha256. Their absence is distinct from the expected absence of large raw browser traces. Those allocation figures cannot be independently derived from the kept files. Reproduce by listing raw-cpu-alloc-gc.tar.gz and comparing to source line191 and large-artifacts.sha256. This is a limitation of evidence availability, not evidence of fabricated values.

5. Low — Two prose conclusions contain numerical errors. Source line171 says Workers lower p95 in both workloads, while its own W01 Round1 table has10.9ms Worker versus7.2ms serial. Source line105 calls N400 nearest-rank p99 the fourth-largest value; it is rank396, the fifth-largest. The implementation’s nearest-rank formula is correct. Reproduce by reading the table and evaluating ceil(.99*400).

6. Low — Literal helper-provenance wording is too broad. Source line131 says the listed C function names have zero product occurrences. The distinctive Playwright helpers have22/4/5 occurrences in Playwright and0 in product code, which supports their provenance. However, whole-token query occurs1 time in source and29 in the production bundle; querySelectorAll occurs5 times in the bundle. These are text counts, not function-definition or CPU-callsite attribution. They qualify the literal zero-occurrence statement without disproving the source’s callsite-based C taxonomy. Reproduce with ../tools/helper-provenance.mjs; see helper-name-provenance.json.

7. Low — Packaging/catalog descriptions overstate what is directly kept. runs.tar.gz contains1251 files but no samples.jsonl, despite its README saying it keeps samples. Original raw samples are checksum-only, so historical quantiles cannot be recomputed from committed raw samples. All1256 logical checksum entries validate after mapping runs/ to the unpacked archive and groups.json to its gzip payload, but the catalog lists neither the3 archive bytes nor the selected/ copies. The source’s109-run inventory also conflates a main index containing10 H100 stock runs plus1 drag stock with a separate12-row H100 stock file that adds2 pilots. Earlier lost smoke output and an interrupted started run are acknowledged historically, not preserved as complete archived runs. These gaps should qualify “every run/artifact retained.”

Windows acceptance and gates

| Item | Actual result |
| --- | --- |
| Preserve measured successes/failures | Main index115 lines/109 unique IDs; latest107 passed/2 failed;6 original failed rederive rows remain. H100 stock file12 rows,9 passed/3 failed. Early/interrupted gaps disclosed. |
| Separate phases | Timers/proxies exist, but merge sample omission, Hybrid pure acceptance not isolated, and worker identity loss make completeness partial. |
| p50/p95/p99, warm/cold | Numerical reducers agree with raw values; open-loop warm assignment violates100-job rule. p99 remains exploratory in my shorter runs. |
| Environment and raw artifacts | Environment/activity snapshots present; CPU/GC/app/Node allocation artifacts present; W01/W03 heap backing absent. |
| Traces/hypotheses/labels | Most labels are explicit and seven hypotheses have disproof methods. Long-task taxonomy not freshly reproduced; the two numerical overstatements remain. |
| pnpm lint | PASS, exit0 |
| pnpm typecheck | PASS, exit0 |
| pnpm test | PASS,93 files/898 tests, exit0 |
| node scripts/lint-knowledge.mjs | PASS,41 pages/4 entry points, exit0 |
| node scripts/verify-source-baseline.mjs | PASS,291 source files and immutable provenance, exit0 |
| Production build | PASS, exit0 |
| Frozen corpus verification | PASS, exit0 |
| Protected diff vs46c61c5 | Empty for src,lock/workspace,patches,corpus,e2e and Playwright config. package.json adds only the perf script. No new performance threshold in added tests; synthetic arithmetic assertions are not elapsed-time gates. |
| generate-workloads --check | BLOCKED, exit1 because sibling TEMP is outside the repo guard. Independent unchanged generator produced5 byte-identical files. Standard checker was not made to pass by changing its guard. |
| Privacy | PASS: independent patterns across234 changed files, decompressed groups and all archive content/member metadata;0 in-scope hits. Unchanged main content excluded. |
| macOS | Not run; open limit, excluded from the Windows negative verdict. |

The exact required gate commands were corepack pnpm lint, corepack pnpm typecheck, corepack pnpm test, node scripts/lint-knowledge.mjs and node scripts/verify-source-baseline.mjs. Own scratch was moved out of the clone before lint, with both resolved move endpoints checked inside the verification parent. No code was fixed after a gate result. Full e2e was not run; the unchanged target stock spec was run six times. Frozen checks and independent workload generation are recorded in evidence/gates.json and their logs.

Evidence integrity and privacy

The three archives were safely unpacked into separate verification-owned directories after checking member targets and rejecting links/escape paths. 1256/1256 logical catalog hashes match. Archives contain1251 run files,39 exemplar files,38 raw-profile/GC/decomposition files. The661-line large-artifact catalog is retained; unavailable raw traces are expected and cannot be checked against absent bytes. Twenty selected published numbers trace exactly to summary/stock files (20/20), with JSON pointers and source lines in evidence/twenty-number-trace.json. This traces the claims; it is not a substitute for recomputing unavailable original raw samples. Six rederive statuses preserve originalStatus and originalError.

The privacy audit used independent patterns for absolute Windows/user/temp paths, file URLs, runtime user/host identities and email addresses, including gzip content and tar metadata. It did not rely on scripts/perf/cli.mjs scan. Package-version notation was not treated as an email, and unchanged main lines were excluded from this branch’s own scope. There are no reportable file:line:rule hits. See evidence/archive-and-privacy-audit.json and the empty evidence/privacy-hits.txt.

What could not be checked

No macOS/headed/GPU-enabled/physical audio/loopback/listening/ETW-WPR/long-session test; no controlled background-load experiment; no independent viewport/no-mangling/1-2-worker-scaling rerun; no cause assigned to untraced clean long tasks or an outside process; no historical machine-memory/intervention reconstruction. Missing W01/W03 heap profiles prevent their specific allocation derivation. The standard CLI/storage incompatibility required independent orchestration and leaves its exact generate-workloads command blocked. New full raw traces were removed only after independent inspection/checksum to satisfy storage constraints. The blind answers remain unchanged.

Exact component run IDs and plan

| Run ID | Boundary | Variant | Pass | Case | Repeat/switches | Control |
| --- | --- | --- | --- | --- | --- | --- |
| v-alloc-w02 | browser-pool | TS-W | alloc | W02_H100_STATIC_5HZ_30S | 1 |  |
| v-alloc-w02-b-original-order | browser-pool | TS-W | alloc | W02_H100_STATIC_5HZ_30S | 1 |  |
| v-app-immediate-trace | browser-app | TS-W | traced | APP_H100_SWITCH | 500 | audio on; immediate; extra trace cc |
| v-app-off-a | browser-app | TS-W | clean | APP_H100_SWITCH | 500 |  |
| v-app-on-a | browser-app | TS-W | clean | APP_H100_SWITCH | 500 | audio on;  |
| v-app-on-b | browser-app | TS-W | clean | APP_H100_SWITCH | 500 | audio on;  |
| v-app-serial-a | browser-app | TS-S | clean | APP_H100_SWITCH | 500 | audio on;  |
| v-app-timeline-only | browser-app | TS-W | traced | APP_H100_SWITCH | 500 | audio on; CPU sampling off; extra trace cc |
| v-app-trace-a | browser-app | TS-W | traced | APP_H100_SWITCH | 500 | audio on; extra trace cc |
| v-app-trace-b | browser-app | TS-W | traced | APP_H100_SWITCH | 500 | audio on; extra trace cc |
| v-audit-th02 | browser-pool | TS-W | traced | TH02_STATIC_EDIT_TAPE | 1 | extra trace cc |
| v-bare-th01 | browser-pool | TS-W | bare | TH01_LISTENER_TAPE_SEEDED | 7 |  |
| v-control-app | browser-app | TS-W | traced | CONTROLS | control sequence | audio on; extra trace cc |
| v-control-pool | browser-pool | TS-W | traced | CONTROLS | control sequence | extra trace cc |
| v-parity-tc01-fallback | browser-pool | TS-S | clean | TC01_LISTENER_TAPE_SEEDED | 1 | parity;  |
| v-parity-tc01-node | node-core | TS-S | clean | TC01_LISTENER_TAPE_SEEDED | 1 | parity;  |
| v-parity-tc01-serial | browser-pool | TS-S | clean | TC01_LISTENER_TAPE_SEEDED | 1 | parity;  |
| v-parity-tc01-worker | browser-pool | TS-W | clean | TC01_LISTENER_TAPE_SEEDED | 1 | parity;  |
| v-parity-tc02-fallback | browser-pool | TS-S | clean | TC02_STATIC_EDIT_TAPE | 1 | parity;  |
| v-parity-tc02-node | node-core | TS-S | clean | TC02_STATIC_EDIT_TAPE | 1 | parity;  |
| v-parity-tc02-serial | browser-pool | TS-S | clean | TC02_STATIC_EDIT_TAPE | 1 | parity;  |
| v-parity-tc02-worker | browser-pool | TS-W | clean | TC02_STATIC_EDIT_TAPE | 1 | parity;  |
| v-parity-th01-fallback | browser-pool | TS-S | clean | TH01_LISTENER_TAPE_SEEDED | 1 | parity;  |
| v-parity-th01-node | node-core | TS-S | clean | TH01_LISTENER_TAPE_SEEDED | 1 | parity;  |
| v-parity-th01-serial | browser-pool | TS-S | clean | TH01_LISTENER_TAPE_SEEDED | 1 | parity;  |
| v-parity-th01-worker | browser-pool | TS-W | clean | TH01_LISTENER_TAPE_SEEDED | 1 | parity;  |
| v-parity-th02-fallback | browser-pool | TS-S | clean | TH02_STATIC_EDIT_TAPE | 1 | parity;  |
| v-parity-th02-node | node-core | TS-S | clean | TH02_STATIC_EDIT_TAPE | 1 | parity;  |
| v-parity-th02-serial | browser-pool | TS-S | clean | TH02_STATIC_EDIT_TAPE | 1 | parity;  |
| v-parity-th02-worker | browser-pool | TS-W | clean | TH02_STATIC_EDIT_TAPE | 1 | parity;  |
| v-tc01-ts-s-a | browser-pool | TS-S | clean | TC01_LISTENER_TAPE_SEEDED | 7 |  |
| v-tc01-ts-s-b | browser-pool | TS-S | clean | TC01_LISTENER_TAPE_SEEDED | 7 |  |
| v-tc01-ts-w-a | browser-pool | TS-W | clean | TC01_LISTENER_TAPE_SEEDED | 7 |  |
| v-tc01-ts-w-b | browser-pool | TS-W | clean | TC01_LISTENER_TAPE_SEEDED | 7 |  |
| v-tc02-ts-s-a | browser-pool | TS-S | clean | TC02_STATIC_EDIT_TAPE | 18 |  |
| v-tc02-ts-s-b | browser-pool | TS-S | clean | TC02_STATIC_EDIT_TAPE | 18 |  |
| v-tc02-ts-w-a | browser-pool | TS-W | clean | TC02_STATIC_EDIT_TAPE | 18 |  |
| v-tc02-ts-w-b | browser-pool | TS-W | clean | TC02_STATIC_EDIT_TAPE | 18 |  |
| v-th01-ts-s-a | browser-pool | TS-S | clean | TH01_LISTENER_TAPE_SEEDED | 7 |  |
| v-th01-ts-s-b | browser-pool | TS-S | clean | TH01_LISTENER_TAPE_SEEDED | 7 |  |
| v-th01-ts-w-a | browser-pool | TS-W | clean | TH01_LISTENER_TAPE_SEEDED | 7 |  |
| v-th01-ts-w-b | browser-pool | TS-W | clean | TH01_LISTENER_TAPE_SEEDED | 7 |  |
| v-th02-ts-s-a | browser-pool | TS-S | clean | TH02_STATIC_EDIT_TAPE | 18 |  |
| v-th02-ts-s-b | browser-pool | TS-S | clean | TH02_STATIC_EDIT_TAPE | 18 |  |
| v-th02-ts-w-a | browser-pool | TS-W | clean | TH02_STATIC_EDIT_TAPE | 18 |  |
| v-th02-ts-w-b | browser-pool | TS-W | clean | TH02_STATIC_EDIT_TAPE | 18 |  |
| v-w01-ts-s | browser-pool | TS-S | clean | W01_H100_POSE_60HZ_60S | 1 |  |
| v-w01-ts-w | browser-pool | TS-W | clean | W01_H100_POSE_60HZ_60S | 1 |  |
| v-w02-ts-s | browser-pool | TS-S | clean | W02_H100_STATIC_5HZ_30S | 1 |  |
| v-w02-ts-w | browser-pool | TS-W | clean | W02_H100_STATIC_5HZ_30S | 1 |  |
| v-w03-ts-s | browser-pool | TS-S | clean | W03_C100_POSE_60HZ_60S | 1 |  |
| v-w03-ts-w | browser-pool | TS-W | clean | W03_C100_POSE_60HZ_60S | 1 |  |
| v-w04-ts-s | browser-pool | TS-S | clean | W04_C100_STATIC_5HZ_30S | 1 |  |
| v-w04-ts-w | browser-pool | TS-W | clean | W04_C100_STATIC_5HZ_30S | 1 |  |

Numerical claim coverage

Numerical coverage appendix. Every source line containing Arabic or Chinese numeral tokens is listed, including identifiers, dates and table headings; hypothesis/bottleneck headings are also included. Tokens reproduce source numbers (Chinese numerals transliterated), not new estimates. Mixed historical lines are conservatively NOT RECHECKED where not all constituent claims were repeated. The main claim table resolves the substantive mechanisms.

| Source line | English context | Source numeric tokens | Status | Own number / scope |
| ---: | --- | --- | --- | --- |
| 1 | Environment and provenance | -102, 2026, -11, -06 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 3 | Environment and provenance | 2026, -11, -06, 2026, -11, -07, 5.5, -102, 46, 61, 5, -102, -2026, -11, -06, -102, -2026, -11, -06, 1, 1, -256, 9, 42, 02286054, 4321, 791, 39, 07, 1266804, 9300165, 3614, 9, 89, 78, 3, -102, -102 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 5 | Environment and provenance | -102, -102, -102, 1 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 11 | Environment and provenance | 11, 26200, 64, 1, 9, -13980, 24, 32, 31.63, 80 | CONFIRMED | 24/32 cores,31.63GB,build26200,80% AC Turbo |
| 12 | Environment and provenance | 22.23, 3, 11.7, 0, 1.64, 1 | CONFIRMED | 22.23.3 /11.7.0 /1.64.1 |
| 13 | Environment and provenance | 156.0, 8078.4, -256, 77, 8, 27, 8, 1, 4 | CONFIRMED | 156.0.8078.4,f77d8e27c8db1e4a |
| 14 | Environment and provenance | 32, 4, 4, 2 | CONFIRMED | 32 reported logical cores;4/2 production workers |
| 15 | Environment and provenance | 0.1 | CONFIRMED | ~0.1ms main/worker resolution |
| 17 | Environment and provenance | 48000, 0.01, 0.04 | CONFIRMED | 48000Hz;0.01/0.04s reported latencies |
| 18 | Environment and provenance | 46, 61, 5, 6, 1, 9, -256, 476, 881934, 395989, 2, 070, 7, 174, 3, 62, 896, 1995592, 26, 2952, 9 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 19 | Environment and provenance | 1, 973, 2, 507, 1, 3 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 21 | Environment and provenance | 1, 22, 1 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 25 | Historical machine state / commands | 4.6 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 27 | Historical machine state / commands | 1, 10, 54, 3, 4, 1, 1 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 28 | Historical machine state / commands | 5, 18 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 29 | Historical machine state / commands | 2 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 30 | Historical machine state / commands | 41, 43, 37, 41, 10, 12, 400, 3.7, 1 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 31 | Historical machine state / commands | 15, 1, 73, 51, 1, 01, 1 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 33 | Historical machine state / commands | 1, 1 | CONFIRMED | TC01 Worker p99 varies6.1 to1.4; app maxima154/193 |
| 41 | Historical machine state / commands | -102, -2026, -11, -06 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 47 | Historical machine state / commands | 5, -102, -102, 1 | CONFIRMED | 5 plans:73/54/1/2/1 entries |
| 51 | Run and artifact inventory | 109, 12, 2, -102, -2026, -11, -06 | CONTRADICTED | 109 unique main IDs;115 lines;11 stock including1 drag;12 H100 rows in separate stock file |
| 53 | Run and artifact inventory | 6, -102, -2026, -11, -06, 2 | CONFIRMED | 6 rederive histories preserved |
| 54 | Run and artifact inventory | -102, -2026, -11, -06, -102, -2026, -11, -06, -102, -2026, -11, -06, 256, -102, -2026, -11, -06, 256, 256, -102, -2026, -11, -06, 256, 256, 102, -1 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 55 | Run and artifact inventory | 3 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 57 | Run and artifact inventory | 1 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 59 | Workloads and parity | 01, 02, 01, 02, 1, 1, 01, 02, 100, 8, 4, 8, 03, 04, 60, 60, 5, 30, 6, 9, 361, 2483580 | CONFIRMED | 5 workload files byte-equal; hashes6dc9f361/2483580d |
| 61 | Workloads and parity | 1, 4, 7145, 2357, 10472, 3443, 0, 29, 19, 21, 4, 0, 64, 24, 64, 24, 2, 33, 21, 15, 4, 3 | CONFIRMED | 29/19/21/4 differing leaves;0 violations;max2ulp;fields{"gainDb":33,"lowpassHz":15,"azimuthDeg":21,"estimatedMidGainDb":4} |
| 63 | Workloads and parity | -101 | CONFIRMED | 176 Node steps exact;528 browser steps within rules |
| 65 | Workloads and parity | 8, 12.4, 156, 8, 2 | NOT CONFIRMED | Node V8 12.4.254.21; browser156; operator cause not tested |
| 69 | Clock alignment and controls | 01, 1251, 23.2, -0.34, 132, 264, -0.94, +0.06, 95, 411, 1040, 31.2, 0.04, 223 | NOT RECHECKED | Own main2540marks over81.244/81.567s; residual168.6/224.1us; no W01 worker long-baseline trace |
| 71 | Clock alignment and controls | 01, 928, 928, -0.09, 0.12, 5.08, 01, 384, 384, -0.06, 0.14, 3.27, 800, 800, -0.83, 0.23, 2.27 | NOT RECHECKED | Own job-level497/500,496/500; historical per-worker ranges not reproduced |
| 73 | Clock alignment and controls | 60, 60.3, 40, 40.5, 197 | CONFIRMED | main60.2ms;worker40ms; independent73/37ms; audio move203ops |
| 79 | In-app metric / rendering controls | 1 | CONFIRMED | 53ms metric:46.037ms reply wait,3.308ms slowest worker |
| 81 | In-app metric / rendering controls | 100, 100, 8, 4, 8, 4 | CONFIRMED | 100/8/4/8 entities;4 workers;500 switches/run |
| 83 | In-app metric / rendering controls | 50, 95, 99 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 85 | In-app metric / rendering controls | 1, 900, 2, 4, 9, 128 | CONFIRMED | N400,2/5/9/max154 |
| 86 | In-app metric / rendering controls | 2, 900, 2, 3, 6, 74 | CONFIRMED | N400,2/4/6/max193 |
| 88 | In-app metric / rendering controls | 2, 99, 3, 19, 7, 99, 7.3, 4.7, 128, 73.9, 95, 0.3, 0.4, 2.4 | CONFIRMED | Shard p991–4ms; main handler p950.4ms; large roundtrip outliers |
| 90 | In-app metric / rendering controls | 1280, 720, 1, -1, -2, 200, 11, 12, 11, 1, 4, 104, 12.6, 90.9, 78.7, 196.5, 1, 273, 201, 1 | CONFIRMED | 3 CPU-traced >=12ms jobs; each reply wait exceeds slowest worker; further timeline-only job12ms |
| 92 | In-app metric / rendering controls | 155, 149.4, 12.6, 1, +155, 48, 47.1, 2.1, +46, +46, 30, 29.6, 1.3, +29, +29, 21, 15156, 556, 16 | CONFIRMED | Direct wait40.853ms/3.971ms CPU; second38.486ms/1.159ms CPU; historical layer totals unmeasured |
| 94 | In-app metric / rendering controls | 1, 500, 1280, 1920, 1920, 1280, 400 | NOT RECHECKED | Own viewport1280x720 only;1920/full-browser/GPU-flag comparisons not rerun. |
| 96 | In-app metric / rendering controls | 1280, 720, 1, 2, 1920, 1080, 1, 2 | NOT RECHECKED | Own viewport1280x720 only;1920/full-browser/GPU-flag comparisons not rerun. |
| 98 | In-app metric / rendering controls | 99, 40, 4, 73, 67 | NOT RECHECKED | Own viewport1280x720 only;1920/full-browser/GPU-flag comparisons not rerun. |
| 99 | In-app metric / rendering controls | 119, 7, 220, 243 | NOT RECHECKED | Own viewport1280x720 only;1920/full-browser/GPU-flag comparisons not rerun. |
| 100 | In-app metric / rendering controls | 99, 5, 3, 7, 4 | NOT RECHECKED | Own viewport1280x720 only;1920/full-browser/GPU-flag comparisons not rerun. |
| 101 | In-app metric / rendering controls | 99, 39.4, 3.5, 71.8, 66.5 | NOT RECHECKED | Own viewport1280x720 only;1920/full-browser/GPU-flag comparisons not rerun. |
| 102 | In-app metric / rendering controls | 6, 1, 20, 32 | NOT RECHECKED | Own viewport1280x720 only;1920/full-browser/GPU-flag comparisons not rerun. |
| 103 | In-app metric / rendering controls | 95, 18.8, 17.8, 48.3, 50.6 | NOT RECHECKED | Own viewport1280x720 only;1920/full-browser/GPU-flag comparisons not rerun. |
| 105 | In-app metric / rendering controls | 100, 1280, 720, 3696, 14.0, 1920, 1080, 7924, 40.6, 2.25, 2.9, 2, 1280, 720, 99, 10, 400, 99, 4 | CONTRADICTED | ceil(0.99*400)=396, fifth-largest; viewport measurements not repeated. |
| 107 | In-app metric / rendering controls | 3, 11, 3638, 3657, 3696 | NOT RECHECKED | Own viewport1280x720 only;1920/full-browser/GPU-flag comparisons not rerun. |
| 109 | In-app metric / rendering controls | 1, 1, 1 | NOT CONFIRMED | disabled_software compositor only; no enabled-GPU experiment |
| 111 | In-app metric / rendering controls | 21, 50, 505, 385, 1853, 1, 1 | NOT CONFIRMED | No invalidation-isolation control; own3/3 CPU-traced large examples show main commit waits only. |
| 113 | Stock gate | 2 | NOT CONFIRMED | 0/5 fresh fully recorded stock failures; no controlled-load experiment |
| 115 | Stock gate | 24, 95, 23, 2, 1, 95, 2 | CONFIRMED | rank23 of24; unchanged12/50ms assertions |
| 117 | Stock gate | 12, 9, 3, 21, 95, 29, 1, -4, 95, 49, 1, -2, 95, 6, 114, 1, -1, 1, 101, 95, 7, 1, 5, 2, 5, 0, 2, 95, 49, 114 | NOT CONFIRMED | 0/5 fresh; archived9/12 passes and3/12 failures retained |
| 119 | Stock gate | 12, 1280, 720, 9, 900, 5, 900, 6, 400, 0, 400, 20, 2600, 0.77, 24, 2, 1.5, 12, 95, 2 | CONFIRMED | 4/400, 4/400 new >=12ms rates; archived arithmetic20/2600=0.769% |
| 121 | Stock gate | 12, 50 | NOT CONFIRMED | No controlled-load independence experiment;12/50ms unchanged |
| 123 | Long tasks | 3, 3, 1 | NOT CONFIRMED | 0 long main tasks in4 diagnostic app traces;25 in4 untraced app runs |
| 125 | Long tasks | 50, 2, 14, 17 | NOT CONFIRMED | 0 traced; clean9/5/8/3 |
| 127 | Long tasks | 234, 22, 102, 24, 88, 6, 87, 5 | NOT CONFIRMED | Commit waits40.85/38.49ms reproduced; >=50ms classes not reproduced |
| 128 | Long tasks | 215, 131, 161, 35, 190, 98, 179, 107, 167, 101 | NOT CONFIRMED | No traced >=50ms product-input task reproduced |
| 129 | Long tasks | 189, 90, 129, 62, 76, 41, 63, 28 | NOT CONFIRMED | No traced >=50ms automation task reproduced |
| 131 | Long tasks | 0 | CONTRADICTED | Distinctive helpers:0 product; generic query:1 source/29 production,querySelectorAll:5 production occurrences. Text counts do not classify CPU callsites. |
| 133 | Long tasks | 1, -2, 114, 1 | NOT CONFIRMED | Stock not traced; immediate control still uses role queries |
| 135 | Long tasks | 1171, 130, 118, 50, 45, 41, 32, 27, 101, 447, 17, 1 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 137 | Static installation | 4 | CONFIRMED | W02 static Worker20.8/23.4/24.6 vs serial3.1/6.0/6.6 |
| 139 | Static installation | 02, 100, 1, 50, 15.8, 95, 23.7, 99, 51.2, 215, 50, 20.4, 95, 24.0, 99, 43.9, 53.1, 02, 50, 4.7, 95, 6.1, 99, 7.0, 9.4, 50, 3.3, 95, 3.8, 9.1, 4, 50, 11.2, 95, 17.7, 50, 7.5, 1, 50, 34.8, 15.9 | CONFIRMED | W02 static20.8/23.4/24.6; post3.3; ACK11.2; historic215ms maximum not reproduced |
| 141 | Static installation | 04, 50, 0.1, 50, 0.6, 50, 2.2 | CONFIRMED | Classic post0.1;ACK0.6; static compute2.7 median |
| 143 | Static installation | 705, -716 | CONFIRMED | 4 clones of BVH/patch structure; static per-job cost20.8ms vs serial3.1ms |
| 145 | Queue and pose latency | 5 | CONFIRMED | Pose waits tens of ms vs compute1.6–4.2ms; 12Hz limit |
| 149 | Queue and pose latency | 50, 95, 99 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 151 | Queue and pose latency | 01, 48.9, 91.2, 95.1 | CONFIRMED | Own w01 ts-w: 48.5/89.6/94.7 ms; queue-scale shape, not identical timings |
| 152 | Queue and pose latency | 01, 51.5, 91.5, 95.4 | CONFIRMED | Own w01 ts-s: 50.4/89.9/94.0 ms; queue-scale shape, not identical timings |
| 153 | Queue and pose latency | 03, 50.5, 89.3, 93.5 | CONFIRMED | Own w03 ts-w: 49.9/88.4/91.9 ms; queue-scale shape, not identical timings |
| 154 | Queue and pose latency | 03, 49.6, 87.8, 89.2 | CONFIRMED | Own w03 ts-s: 40.3/87.8/89.1 ms; queue-scale shape, not identical timings |
| 156 | Queue and pose latency | 12, 83.3, 1, 01, 3600, 2920, 680, 10, 15 | CONFIRMED | 12Hz/83.33ms; own W01 submitted3600, completed686 Worker/673 serial; stale/censored retained |
| 158 | Queue and pose latency | 50, 9, 95, 11, 83, 03, 50, 0.3 | CONFIRMED | Closed timer lateness about8–9ms median,10–11ms p95 |
| 160 | Queue and pose latency | 1 | NOT CONFIRMED | No OS timer-coalescing disproof control |
| 162 | Worker versus serial | 6 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 164 | Worker versus serial | 99 | CONFIRMED | TC01 Worker p99 changes6.1 to1.4ms between fresh runs |
| 166 | Worker versus serial | 1, 1 | NOT RECHECKED | No corresponding independent measurement; metadata/control/historical figure retained as unverified. |
| 168 | Worker versus serial | 01, 50, 95, 99, 1.9, 10.9, 40.0, 60.2, 2.3, 5.5, 7.6, 19.1, 2.2, 7.2, 23.3, 58.2, 4.5, 6.6, 12.1, 54.3 | CONFIRMED | W01 serial4.2/5.9/6.5,Worker2.3/5.4/6.1 (corrected warm) |
| 169 | Worker versus serial | 03, 50, 95, 99, 1.2, 2.5, 9.1, 33.6, 1.7, 3.7, 15.0, 33.5, 3.1, 4.9, 6.5, 10.0, 3.7, 5.3, 7.5, 37.1 | NOT CONFIRMED | Fresh W03 Worker p993.5ms is better than serial5.6ms, unlike historical ordering |
| 171 | Worker versus serial | 2, 50, 95, 99, 03, 2, 01, 2, 50, 2, 95, 3, 4, 99, 6, 9, 50, 3, 95, 6, 7, 99, 11, 14, 11, 15, 14, 7 | CONTRADICTED | Historical W01 p95 Worker10.9 > serial7.2 in its own table; fresh Worker5.4 < serial5.9 |
| 173 | Worker versus serial | 1, 01, 50, 0.6, 95, 1.8, 99, 7.8, 0.3, 0.6, 2.1, 01, 0.6, 1.3, 2.8, 0.4, 0.9, 1.0, 02, 0.6, 1.0, 1.9, 0.3, 0.5, 0.7, 02, 1.2, 3.7, 9.3, 1.1, 3.3, 3.9, 01, 0.34, 0.66, 1.13, 02, 0.41, 0.80, 1.06, 01, 0.51, 1.04, 1.12, 02, 1.88, 4.44, 4.89 | NOT RECHECKED | Small-tape central serial advantage reproduced; Node timing column not remeasured |
| 175 | Worker versus serial | 01, 1, 50, 6.1, 95, 12.6, 99, 87.2, 99, 53.9, 2, 3.7, 10.2, 19.7, 4, 2.4, 6.5, 16.9, 2.3, 5.5, 7.6, 1, 50, 6, 95, 7, 99, 12, 64 | NOT RECHECKED | Only default2/4-worker policies measured |
| 177 | Merge, GC and audio | 7 | CONFIRMED | Demonstrated large waits dominate measured merge and AudioParam costs; clean outliers unclassified |
| 181 | Merge, GC and audio | 01, 95, 0.4, 0.6, 99, 0.7, 2.1, 95, 0.3, 0.4 | CONFIRMED | App handler0.1/0.4/0.7ms; full raw assemblies0/0.1/0.1ms; reducer omissions qualify this |
| 182 | Merge, GC and audio | 1, -1, 200, 99, 1.6, 2.1, 99, 3.2, 43, 64, 3, 40, 317, 143, 30, 2, 11, 1, 50, 1, -2, 11.6 | NOT RECHECKED | Job-level small GC seen; historic collection totals include whole trace and cannot be treated as window-only |
| 183 | Merge, GC and audio | 95, 0.4, 1.1, 50, 21, 95, 139, 95, 0.2, 50, 0.9, 95, 6.5, 7.6, 99, 14.9, 30.8, 66, 164 | CONFIRMED | apply p950.4ms; ops21/139; call sum p950.2; wait p9962.8ms |
| 185 | Merge, GC and audio | 99, 6, 9, 5, 95, 9.1, 10.9, 5.2, 7.3, 99, 32.3, 54.6, 12.7, 22.3, 14, 7, 3, 4, 2, 50, 0.11, 95, 0.43, 99, 0.99, 1.00, 50, 0.12, 95, 0.80, 99, 0.99, 1.00, 1, 50, 0.10, 95, 0.26, 99, 0.47, 0.63, 478, 477, 251 | NOT RECHECKED | Own on p999/6,off6; one off run; historical render-capacity groups not reproduced |
| 187 | Hybrid validation and allocation | 8 | NOT CONFIRMED | No W01 CPU trace reproducing >100ms validation stalls |
| 189 | Hybrid validation and allocation | 01, 50, 3.0, 95, 4.0, 99, 7.1, 16.9, 60, 01, 2, 103, 110, 50, 2, 2, 01, 1, 99, 113, 2.0, 82.2, 99.7 | NOT CONFIRMED | Input projection measured;103/110ms task attribution not reproduced |
| 191 | Hybrid validation and allocation | 01, 20, 499, 375, 342, 194, 185, 120, 2, 68, 64, 0, 158, 3, 41, 28, 3, 24, 03, 1094, 229, 177, 94 | NOT RECHECKED | W01/W03 raw allocation profiles are checksum-only, absent from archives; new allocation caseW02 |
| 193 | Hybrid validation and allocation | 2, 3 | CONFIRMED | Different pool createSceneDocumentV2 and app projectHybridDocument boundaries inspected |
| 195 | Hybrid validation and allocation | 3, 50, 100 | NOT CONFIRMED | No hard-fault/context-switch counters; no >100ms validation trace |
| 201 | Acceptance and limits | -102, -2026, -11, -06, -102, -2026, -11, -06 | NOT CONFIRMED | Bounded main/stock histories retained; documented unindexed smoke/interrupted output not in archives |
| 202 | Acceptance and limits | none | CONTRADICTED | 54–74 missing assemblies in TC01 runs; per-thread worker summaries overwrite entries |
| 203 | Acceptance and limits | 50, 95, 99, 1000, 900, 1000, 600, 99 | CONTRADICTED | Warm starts at request59, not101 in W01; W02 median6.4 becomes12.8 after correction |
| 204 | Acceptance and limits | -256, 256 | NOT CONFIRMED | 1 Node CPU profile,6 heap profiles,GC present; W01/W03 allocation backing absent |
| 205 | Acceptance and limits | none | CONFIRMED | 7 hypotheses each supply a disproof method; acceptance/p95 wording still overstated |
| 206 | Acceptance and limits | none | NOT RECHECKED | Windows only; macOS explicitly open, excluded from negative verdict |
| 208 | Acceptance and limits | 5, 2, 3, 1, 10, 1, 1, 8, 10 | CONFIRMED | Open limits disclosed; own2 tape pairs,1 large-workload pair, no physical output/ETW |
| 212 | Acceptance and limits | 1, 21 | CONFIRMED | Single changing desktop; before/after CPU3.011–28.669%; no GPU/hardware audio/macOS test |
| 216 | Historical corrections | 1, 7, 08161, 2, 77, 8, 27, 8, 507 | NOT RECHECKED | Actual fresh shell hashf77d8e27c8db1e4a; historical binary selection not reconstructed |
| 217 | Historical corrections | 6 | CONFIRMED | 6 rederived failed histories retain original status and error. |
| 218 | Historical corrections | 01, 21, 1 | NOT RECHECKED | Pilot attribution history not rederived; pilot stock files retained |
| 219 | Historical corrections | none | CONFIRMED | Synthetic nested73ms task counted once; new thread-key fault is distinct from fixed nesting bug |
| 220 | Historical corrections | 1 | NOT RECHECKED | Fresh git working tree clean; historical dirty causes not reconstructed |
| 221 | Historical corrections | none | CONFIRMED | Protected source diff empty; historical unavailable metadata is not proof by itself |
| 222 | Historical corrections | 1, 7, 261, 1, 95, 114 | NOT RECHECKED | No outside-area incident reconstruction; unindexed114ms smoke remains a disclosed gap |
| 223 | Historical corrections | 2 | NOT RECHECKED | Earlier2 smoke outcomes only documented historically |
