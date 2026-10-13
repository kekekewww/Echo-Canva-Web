# Lazy tools and FrameAll phase: native evidence

This phase follows the earlier `fix-native-*` and `fix-wall-native-*` phases. Their original failures, reruns and successful observations remain preserved. It covers the reviewed lazy ProjectTools projection and click-only FrameAll collection, plus a test-fixture initialization correction. Further hosted results are still inconsistent, so these local passes do not establish clean cross-platform performance.

Actual runtime: Windows x64, Node 22.17.0, pnpm declaration 11.7.0, Next 16.3.8, Vitest 4.1.11, Playwright 1.61.1, Chromium 149.0.7827.55. All commands and process durations are captured in `fix-lazy-native-*.{log,json}`. Docker/CI use Node 22.23.3, so local equivalence to their runtime version is not asserted.

| Gate | Result | Process duration | Evidence |
| --- | --- | --- | --- |
| First full unit run | FAIL: 571/572 tests, 74/75 files | 24.000 s | `fix-lazy-native-unit.*` |
| Identical marker file, unchanged defaults | PASS: 7/7 | 1.334 s | `fix-lazy-native-unit-marker.*` |
| Marker after fixture correction | PASS: 7/7 | 1.784 s | `fix-lazy-native-unit-marker-fixed.*` |
| Full suite after fixture correction | PASS: 572/572, 75/75 files | 6.047 s | `fix-lazy-native-unit-rerun.*` |
| Scoped lint of corrected fixture | PASS | 6.995 s | `fix-lazy-native-lint-marker-fixed.*` |
| Production build, including TypeScript | PASS; ID `ZVKzeWXlrEsLWAlmO98dH` | 18.005 s | `fix-lazy-native-build.*` |
| Immutable source verification | PASS: 291 source files and exact roots | 0.265 s | `fix-lazy-native-source.*` |
| Actual Windows standalone runtime license collection | PASS: 20 packages, all gap counters zero | 5.851 s | `fix-lazy-native-licenses.*`, `fix-lazy-native-license-inventory.json` |
| Full production Chromium E2E | CLEAN PASS: 46/46 | 46.601 s | `fix-lazy-native-e2e.*` |
| Original stress repeated three times | CLEAN PASS: 3/3 | 29.247 s | `fix-lazy-native-stress.*` |

The UI agent separately passed its two focused SSR regressions, scoped lint and full TypeScript before this run; those checks are reported by that agent. Root instructed against repeating the entire ESLint run because unaffected files retain their previously tested bytes. The newly changed fixture received its own scoped lint, and the final production build includes TypeScript.

## Repeated cold compiler fixture timeout

The initial full suite again failed only `preserves Next's actual server/client alias targets and rejection behavior`: the synchronous `require(next/dist/build/create-compiler-aliases)` inside the test took the assertion past its unchanged five-second timeout. It took 18.141 s under the full run, following the earlier wall-phase 6.245 s failure. The same unchanged file passed in isolation with 45 ms import / 732 ms tests (963 ms Vitest total). These results remain logged; no timeout was increased.

With root authorization, the actual compiler `require` was moved to the module-level fixture initialization next to the existing `createRequire` fixtures. Actual compiler alias creation, server/client target resolution and real server rejection assertions remain in the original `it`. No compiler mock was introduced. The fixed isolated run reports 781 ms import / 302 ms tests / 1.33 s Vitest total; the full final run reports 60.12 s aggregated parallel import time / 5.47 s wall duration. Compiler loading is still represented in run duration and import reporting.

## Exact original stress observations

One Playwright worker, zero retries; original scene, capacity policy, 24-frame sample count and strict p95 < 12 ms / Long Task <= 50 ms gates are unchanged. These are ordinary production E2E runs without the diagnostic Worker wrapper or CPU profiler.

| Run | Actual hardwareConcurrency / pool | p95 | Maximum sample | Samples / unique sequences | Long Tasks |
| --- | --- | --- | --- | --- | --- |
| Complete 46-test suite | 32 / 4 | 4 ms | 4 ms | 24 / 24 | none |
| Isolated repeat 1 | 32 / 4 | 4 ms | 5 ms | 24 / 24 | none |
| Isolated repeat 2 | 32 / 4 | 4 ms | 4 ms | 24 / 24 | none |
| Isolated repeat 3 | 32 / 4 | 3 ms | 4 ms | 24 / 24 | none |

All original end-of-test browser audio graph, mode-switch and reload assertions passed. Raw metrics and statuses are retained under `fix-lazy-native-{e2e,stress}-results/`; aggregated copies are `fix-lazy-native-{e2e,stress}-metrics-summary.json`. The new deterministic mocked AI Explain case also passed in the full suite. No paid API was used.

## Diagnostic limitation and remaining hosted failures

`fix-validator-investigation.md` and `fix-validator-profile-analysis.json` separately preserve the before-build diagnostic and why it did not justify changing validators. The latter explicitly distinguishes asserted/measurement CDP HC3 from the post-detach canonical metric capture HC32. The low-overhead HC3 boundary-before run kept its CDP session attached and captured actual HC3; it passed at p95 7 ms. This is Windows emulation and cannot replace actual ARM acceptance.

An exact same-fixture boundary-after helper/config was prepared, but root instructed against running it while the source finalization is being reconsidered. Therefore **boundary-after was not executed** in this phase. No validator cache, pool policy or safety-check changes were made.

Hosted run 38361274523 has clean macOS full-suite 46/46 but only two of three zero-retry original stress repeats passed: the first has p95 13 ms / maximum 29 ms, including a direct sample with wall 29 ms and shard 2 ms. All hosted Long Task arrays were empty. Earlier hosted sources had one clean set of three repeats, but the later failure means performance is not consistently resolved. Neither the local 46/46 result nor the local three repeats erase these hosted failures. Root is investigating a further bounded UI responsibility isolation; no such later changes are covered by this summary.
