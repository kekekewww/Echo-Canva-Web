# Response validation investigation before lazy UI changes

Actual before production build: `2ny829QrRqlazPRczRblE` (wall projection fix). Windows x64 / Node 22.17.0 / Chromium 149.0.7827.55. The current source already contains separate UI edits, but these diagnostics used the existing production output and did not rebuild it.

No Worker source, validation rules, pool capacity/assignment, physical formulas, safety checks, coefficients or acceptance thresholds were changed. The proposed lookup cache was **not implemented**, because measured lookup costs do not establish it as the cause of the hosted outliers.

## Canonical-fixture CPU diagnostic

`fix-validator-generate-profile.cjs` copied the original last stress case from `tests/e2e/workspace.spec.ts` into sibling `fix-validator-profile.spec.ts` outside the repository test directory. It used the same scene, 24 listener changes, policy and assertions. Diagnostic additions were Chrome CDP `Emulation.setHardwareConcurrencyOverride` to 3 and main-target `Profiler` sampling at 250 microseconds around the 24 measured changes. HC3 was asserted before fixture setup and the status showed one Worker.

This is a Windows low-core-count diagnostic, not an ARM performance acceptance run. The CPU profiler adds overhead. It observed p95 14 ms, no Long Tasks, and failed the unchanged 12 ms assertion. The profile spans 3,702.826 ms / 4,937 samples. The metric JSON collected browser hardwareConcurrency after the CDP session had detached, so that particular field reverted to the host's 32; the asserted override and actual Worker count remain 3 and 1 during sampling. Preserve this limitation when reading the artifact.

Sampled main-target cumulative costs across the 24-frame window:

| Stack / operation | Inclusive time | Self time / interpretation |
| --- | --- | --- |
| Native `onmessage` wrapper / handler | 28.842 ms | Includes validation and later completion work |
| `isSourceResult` path | 21.934 ms | Complete hostile-payload validation |
| First-order reflection validation | 16.110 ms | Mainly retained geometry visibility checks and ray/BVH work |
| First-order patch `.find` callback | 1.052 ms | About 0.044 ms/frame; sampling estimate |
| Direct validation including Set/numeric/hits | 5.824 ms | Does not isolate Set construction from other inlined work |
| `projectClassicScene` (`uY`) | 61.164 ms | 55.263 ms self, including structuredClone |
| `projectHybridDocument` (`uQ`) | 42.381 ms | Includes another `projectClassicScene` call; do not add overlapping inclusive times |
| `ProjectTools` (`cs`) render | 33.337 ms | Eager Classic projection while tools are closed is visible in source and stack |
| `HybridSpatialViewport` (`cX`) render | 18.333 ms | Inlined FrameAll work was not separately resolved |
| Garbage collection | 16.344 ms | Across full window; no per-job attribution |

The sampled `.find` cost does not support a lookup cache as the explanation for an eight- or fourteen-millisecond hosted gap. Direct Set allocation cannot be precisely isolated by this minified sampled profile. No BVH visibility rechecking or second-order re-solving is removed.

Files: `fix-validator-profile.{log,json}`, `fix-validator-profile-results/*/validator-main-profile.cpuprofile`, and `fix-validator-profile-analysis.json`. Analysis retains source snippets and all sampled application frames, allowing verification against the exact built chunk.

## Bounded handler/dispatch boundary diagnostic

`fix-validator-generate-boundary.cjs` copied the same canonical case and used the same HC3 override. It did **not** enable the CPU profiler. A diagnostic native Worker subclass recorded `performance.now()` immediately before each unchanged `COMPUTE_SHARD` postMessage, then immediately before and after the installed native `onmessage` callback. It recorded the existing shard timings and identities. Record writing occurs after the callback, and output files are written after the measured window. This wrapper is diagnostic only and never enters application source or CI acceptance cases.

Actual result: PASS one original case, 24 sequences (5–28), HC3/one Worker, p95 7 ms, maximum 8 ms, no Long Tasks. The original audio/graph/reload checks also passed.

| Boundary | Mean | p95 | Maximum |
| --- | --- | --- | --- |
| Complete installed native callback | 0.817 ms | 1.800 ms | 2.500 ms |
| PostMessage to callback start | 4.592 ms | 7.100 ms | 7.200 ms |
| Worker rounded shard computation | 4.125 ms | 7.000 ms | 7.000 ms |
| PostMessage-to-start minus rounded shard computation | 0.467 ms | 0.900 ms | 1.100 ms |

The callback duration is an upper bound for validation alone: it also includes frame assembly and synchronous completion/onresult work. Pool completion timestamps are taken before that later work. The mixed Date.now / performance.now comparison has approximately one-millisecond rounding uncertainty; a -0.5 ms result is therefore not evidence of negative queue latency. Input cloning, Worker scheduling, output cloning and main callback queue wait remain grouped together by this boundary.

This successful local diagnostic did not reproduce the hosted 8–14 ms gap and therefore cannot assign that gap to a particular phase. The newly observed hosted macOS HC3/pool1 and Windows HC4/pool2 failures remain authoritative cross-platform failures; Windows HC3 emulation is not a replacement for them.

Files: `fix-validator-boundary.log`, `fix-validator-boundary-results/*/{validator-worker-boundaries,worker-stress-metrics}.json`, and `fix-validator-boundary-analysis.json`. The exact commands are in the sibling config/generator scripts; the accepted command ran the installed Playwright CLI with `--config ../verification-logs/fix-validator-boundary.config.cjs`, workers1/retries0. Native application files were unchanged by this investigation.

## Decision and next verification

Do not add validator caching without stronger evidence. The already-demonstrated eager tools projection and FrameAll collection can be made lazy by the assigned UI agent without weakening validation. After those small UI changes pass focused regressions, root authorized fresh native unit/build/full E2E, three zero-retry original stress repeats, and the identical HC3 boundary diagnostic with separate after artifacts. Hosted confirmation remains necessary before claiming cross-platform performance resolved.
