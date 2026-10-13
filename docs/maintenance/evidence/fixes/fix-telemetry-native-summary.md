# Telemetry UI isolation: final native evidence

Reviewed application/test head: `96f3247069a01eac09cf707e90cdc9231f8a4bbe`; final build ID `ts9bLxVDHq2VvhMSK5_jQ`. Read-only verification found no application, tests, dependency or Next configuration diff from that HEAD. This phase covers default React memo boundaries for ContextInspector and SceneOutliner and stable local audio metadata/callback props in UnifiedWorkspace. No Worker, numeric, schema, material or performance-policy changes were made.

Actual native environment: Windows x64 / Node 22.17.0, pnpm declaration 11.7.0, Next 16.3.8, Vitest 4.1.11, Playwright 1.61.1, Chromium 149.0.7827.55. Native Node differs from pinned Docker/CI Node 22.23.3. Exact CLI commands, timestamps, exit status and environment metadata are in each `fix-telemetry-native-*.{log,json}`.

| Gate | Actual result | Process duration | Evidence |
| --- | --- | --- | --- |
| Full unit suite | CLEAN PASS: 572/572 tests, 75/75 files | 5.707 s | `fix-telemetry-native-unit.*` |
| Production build, including TypeScript | PASS | 10.259 s | `fix-telemetry-native-build.*` |
| Immutable source verification | PASS: 291 files / exact extraction and LICENSE initializer roots | 0.192 s | `fix-telemetry-native-source.*` |
| Actual standalone runtime license collection | PASS: 20 packages / all gap counters zero | 1.562 s | `fix-telemetry-native-licenses.*`, `fix-telemetry-native-license-inventory.json` |
| Full production Chromium E2E | CLEAN PASS: 46/46 | 44.370 s | `fix-telemetry-native-e2e.*` |
| Three zero-retry original stress repeats | FAIL overall: first FAIL, next two PASS | 29.562 s | `fix-telemetry-native-stress.*` |

The UI agent separately passed scoped ESLint, full TypeScript and an independent review for the three UI files before this build. Root did not request another full ESLint run for unaffected same-byte files. All tests retained their original inputs and assertions. The preceding phase's real-compiler fixture correction remains in place, with the original five-second assertion timeout. Earlier cold-load failures are retained in their earlier logs.

## Exact stress metrics and remaining failure

One Playwright worker and zero retries; browser hardwareConcurrency 32 and original four-Worker pool policy for every local sample. All four cases below collected 24 distinct accepted sequences (5–28), including raw statuses and timing arrays. No CPU profiler, callback wrapper or diagnostic coverage was used in these acceptance cases.

| Case | p95 | Maximum | Long Tasks | Result |
| --- | --- | --- | --- | --- |
| Stress within complete 46-case suite | 4 ms | 5 ms | none | PASS |
| Isolated repeat 1 | 12 ms | 57 ms | 98 ms | FAIL |
| Isolated repeat 2 | 4 ms | 5 ms | none | PASS |
| Isolated repeat 3 | 4 ms | 8 ms | none | PASS |

The first isolated repeat fails the strict original p95 < 12 ms assertion. Its 98 ms Long Task also exceeds the unchanged 50 ms budget, although the earlier p95 failure stops that assertion from being reached. Neither violation was retried away or reclassified as a pass.

Concrete outlier status rows:

- Sequence 11 / Listener 7 / blocked: pool wall 57 ms, shard maximum 51 ms, shard total 155 ms.
- Sequence 15 / Listener 3 / direct: pool wall 12 ms, shard maximum 8 ms, shard total 28 ms.

The reported shard timestamps are elapsed wall times around Worker calculations. They cannot by themselves distinguish active algorithm CPU from preemption, GC or other scheduling stalls. There is no CPU trace of this failing attempt, and the main 98 ms Long Task has no assigned call stack. No further meaningful runtime overhead is established by this failure, so no additional fix, validator cache or policy change was made. The earlier measured lookup cost remains insufficient to justify that cache.

All stdout, the original first failure, screenshots/error context and raw JSON remain under `fix-telemetry-native-stress-results/`. Complete metrics are aggregated in `fix-telemetry-native-{e2e,stress}-metrics-summary.json`. Full E2E includes the deterministic mocked Explain case, audio graph/rendering assertions, manual authoring, portal geometry, import/export, navigation and persistence. Paid APIs were not used.

## Controlled telemetry-only render evidence

These are sibling-only diagnostics outside application/test source, not performance acceptance tests. The original canonical stress fixture setup and warmup were reused. A native Worker wrapper held the next existing SHARD_RESULT callbacks after a listener selection. Once the project update had rendered and all original responses were queued, precise call coverage started; the same payloads were flushed and the next sequence was accepted. There was no new project command inside that telemetry-only window.

Before build `ZVKzeWXlrEsLWAlmO98dH`, precise coverage reports ContextInspector=1 and SceneOutliner=1 for telemetry sequence 4→5. Exact compiled prop signatures and ranges are in `fix-telemetry-coverage-before-rerun-analysis.json`. The first helper attempt failed only because Debugger.getScriptSource required Debugger activation; its original log/results remain retained. The helper was corrected to enable Debugger after the measured coverage was taken.

After the final build, the identical fixture accepted sequence 4→5, and V8 returned no invoked entries for those memoized component functions. This is **not** an explicit count=0 record. A bounded positive control then changed the actual listener/project (sequence 5→6) and observed each same anonymous component function with count=1. That establishes that the functions remain observable and update for a real project change, while their telemetry-only work is omitted.

Full script source and coverage are saved in `fix-telemetry-coverage-{after,control}-results/`. `fix-telemetry-coverage-positive-control-analysis.json` contains both windows, signatures and exact ranges. The diagnostic supplies direct evidence for the limited UI responsibility isolation; it does not prove the remaining cross-platform timing outliers resolved.

## Completion boundaries

The final owned port 3101 probe returned ECONNREFUSED after diagnostics. No unrelated process or container was stopped. The local CPU slot was explicitly released to root for final Docker verification. No more native profiling, reruns or source fixes are planned without concrete new evidence. Hosted and Docker verification are owned by root and reported separately. The original repeated native/hosted stress failures mean overall performance validation remains incomplete despite the clean 572-unit and 46-E2E runs.
