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
