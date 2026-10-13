# Verification follow-up: performance, dependency safety and runtime notices

Date: 2026-10-13. Branch: `fix/verification-debt`, based on the history-preserving
merge of [PR #1](https://github.com/kekekewww/Echo-Canva-Web/pull/1), commit
`3b2a6b5d6f7b9518e2a8ac9f488cabb0a568a648`.

This report records the subsequent authorized fixes and new verification. The
initial extraction's 44/45 failures and original audit/notice gaps remain in
[the initial ledger](FINAL_VERIFICATION.md) and its hashed evidence. A later pass
does not change those historical outcomes. No later upstream Main feature is
imported, no scientific expected values are regenerated, and no timing gate is
relaxed.

## Why the checks previously failed

| Finding | Demonstrated cause and correction |
| --- | --- |
| Native/container browser stress | Both servers were exercised by the Windows host browser. Listener updates repeatedly invalidated static projection/render caches because the primitive array was recreated each render. Hybrid audible mapping also calculated a complete Classic frame, including unused reflections and room decay. CPU profiling identified both costs; stable primitive identity and an exact extraction of the existing Direct/Portal routing remove that work. Docker does not run the browser solver. |
| Reported Worker p95 | The pool metric is dispatch-to-complete, validated response wall time, including scheduling and main-thread response handling. It is not isolated Worker CPU time. UI blocking can therefore breach this gate. |
| `braces` high advisory | The actual development dependency chain is Next ESLint → fast-glob → micromatch → braces. Deep braces/parentheses within the original input-length cap cause native stack exhaustion. The registry still publishes only through 3.0.3. |
| Missing client-only notice | The exact original npm archive contains only two marker modules and package metadata, with an MIT declaration but no copyright/permission notice or source revision. Neither React's homepage nor Next's wholesale vendoring supplies authentic original attribution. Both executable copies now use an independently authored, project-MIT marker; historical metadata is retained. |
| Hosted CI marked unverified | That statement described the initial branch publication, before PR adoption. Real subsequent PR/main runs exist and passed. This follow-up additionally expands application checks to Ubuntu, Windows and macOS; native OS results do not prove Docker Desktop or headphones on those hosts. |

The acoustic changes preserve Classic frame fields, direct/blocked/Portal
decisions, ranking, material values, reflection/RT60 formulas and all Worker
validation/fallback contracts. The existing stress input still requires 24 unique
complete frames, p95 <12 ms and every Long Task ≤50 ms.

## Focused causal verification

| Check | Actual result |
| --- | --- |
| Instrumented unchanged stress | Recorded p95 13 ms and Long Tasks up to 243 ms; CPU profiler evidence identified the repeated geometry and unused Classic work. Instrumentation affects timings and is not acceptance evidence. |
| Primitive memo alone | First original stress pass, then repeat 2/3 passed and one failed with a 101 ms Long Task. This incomplete correction is retained as failed evidence. |
| Both focused acoustic corrections | Original stress 3/3 passed, test durations 8.2 / 8.3 / 8.2 s. |
| Separate unprofiled numeric capture | 24 complete-frame timings; p95 3 ms; no Long Tasks. The diagnostic test was removed from the E2E directory. |
| Acoustic regression subset | PASS: 5 files / 121 tests, including exact Classic golden oracle and both Worker pools; affected lint, typecheck and production build also passed. |
| New braces regressions before patch | FAIL: 16 failed / 10 passed; real transitive installed package, not a mock. |
| New braces regressions after patch | PASS: 26/26, 391 ms. Ordinary syntax, escaping, ranges, quoted/bracket literals, brace/parenthesis depth 128/129 and direct AST walker entry points are covered. |
| Exact pnpm 11.7 install and frozen reinstall | PASS: three local patches installed, 1 min 45.1 s; frozen reinstall 90 ms. Other dependency versions unchanged. |
| Full dependency audit after patches | FAIL at registry-version level: one high development-only braces finding, exit 1. No suppression. |
| Production dependency audit after patches | PASS: zero advisories, exit 0, 99 production/optional records. |

Native causal tests used Windows Node 22.17.0, Next 16.3.8, Playwright 1.61.1
Chromium, 1280×720, one worker/no retries and production server port 3101.
Containers and hosted CI pin Node 22.23.3 / pnpm 11.7.0.

## First integrated correction (head 48a2f668)

| Check | Status |
| --- | --- |
| Native full lint/typecheck/unit/build/source verification | PASS: lint 20.69 s, TypeScript 7.65 s, 73 files / 567 units (5.94 s process), production build 20.10 s and immutable 291-file source verifier. |
| Native full Chromium suite | PASS: 45/45, 49.6 s (process 50.47 s), one worker / zero retries; original stress 8.7 s at unchanged 12/50 ms gates. |
| Real Next Client/Server compiler boundary | PASS: four actual default Turbopack / Webpack positive and negative fixtures, 46.21 s; valid Client builds and forbidden Server imports reject for the boundary reason. |
| Strict marker/notice collector/runtime guard regressions | PASS in full suite: 16 new marker/collector/guard cases, including original identity with borrowed LICENSE and falsely clean summary. Earlier 15-case run passed separately. Actual Windows collector also passed: 20 packages, all five gap counters zero, 3.38 s. |
| Updated development image, quality checks, Watch/HMR/restart | PASS: non-root lint/typecheck and 73 files / 567 units (Vitest 4.29 s); actual Watch HMR 1,011 ms without refresh. Source restored exactly. Two stop/start cycles preserve Classic X=2.25, Hybrid X=4.5 and the same 192,044-byte local WAV ID/SHA-256 in IndexedDB; zero POST uploads or page errors. A helper's initial incorrect assumption that `/` forces Classic was retained, then corrected to explicitly select the persisted mode; the same existing profile/blob passed without resetting data. |
| Updated production image, runtime contents, health/API/shutdown | No-cache build/start/health/routes/assets/no-key APIs and strict runtime guard PASS; UID 1000, read-only root, capabilities dropped, no host devices. 21 packages / 19 standalone / all five declared; every gap and exception counter zero. Bounded network-disabled secret/notice scan PASS: 1,489 text files / 20,930,230 bytes, six explicit binary skips, zero matching credentials or client-key symbols. Actual SIGTERM PASS: 1.380 s, exit 143 / OOM false, cleanup-start and cleanup-finished logs; restart smoke PASS. |
| Full Chromium against updated production container | PASS: 45/45, 46.2 s, one worker / zero retries; original stress 8.0 s at unchanged limits. |
| Ubuntu / Windows / macOS hosted application matrix | [Run 38355473899](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38355473899) succeeded at head `48a2f668de12a3efc0305e0aef71eec60ccc91bd`. Each OS passed four real compiler fixtures, lint/type/build/source/prod audit and 73 files / 567 units. Ubuntu CLEAN 45/45 (38.1 s), Windows CLEAN 45/45 (46.9 s). macOS ARM64: 44 clean / one flaky stress, first p95 18 ms failed <12 ms, retry #1 passed (49.9 s). This is not a clean macOS full pass; further investigation is in progress. |
| Updated hosted production Docker job | PASS in [PR run 38355473899](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38355473899): fresh build/start/health/HTTP/API/runtime/shutdown assertions, UID 1000 and zero notice/provenance gaps. Image `sha256:531f1f53ce6fc1c5e9457d12faa5dffdbd5d1b22af773ae2e747a4e4df9b1382`, 267,766,572 bytes. |

Portable follow-up evidence lives separately from the initial hashed outputs;
full local diagnostics remain in sibling `verification-logs/`.

Local production image: `sha256:c33e6183a468ca013b66c041806e5ae15248c71c39d1c0c878272500a74b237d`,
386,464,321 bytes. Local development image: `sha256:fa9724e0474e8a65ec251b5b2f12c09d3841350e39dd2bd6c777ca9ca99cc4ac`,
1,037,614,927 bytes; development build 89.33 s, production no-cache build 76.53 s. These are measured local Docker
image sizes, not registry download sizes or a claim that every platform's layers
are identical.

## Additional wall overdraw correction and final checks

The macOS first-attempt failure above is retained; a retry does not establish
clean cross-platform timing. Further inspection confirms a separate, concrete
viewport defect: a wall without an open Portal adds the full side rectangle
twice. Its six rendered polygons contain two identical duplicates; the intended
existing coverage is two side faces and two endpoint caps, four unique panels.
The scoped correction removes that redundant insertion only. It preserves open
Portal holes, the existing caps and acoustic geometry. Closed walls intentionally
lose duplicate translucent fill/stroke overdraw; this small visual difference is
documented rather than presented as identical pixels.

Three independent projected-geometry regressions were first run against the
duplicate: two failed and the open-aperture case passed. They check unique faces,
analytically projected area, closed-Portal equivalence and open-Portal coverage.
This demonstrates the defect; it does not establish the cause of the macOS 18 ms
sample, whose CPU/shard diagnostics were absent in that hosted run.

The stress test now attaches browser hardware concurrency, all 24 complete-frame
timings/sequences, p95, Long Tasks and existing Worker status text **after** closing
the measured window. Its input, sample count, pool policy, expected values and
12/50 ms gates are unchanged. CI retains failed/retried screenshots/traces and
metrics even when a retry makes a job green. macOS additionally repeats the same
original case three times with zero retries; evidence directories stay separate.

| Final corrected-tree check | Status |
| --- | --- |
| Wall geometry regressions / full native gates / full Chromium | Geometry PASS: 16 focused tests including three new cases. Native lint/type/build/source/collector PASS. First full unit FAIL: 569 passed / one existing marker-test timeout; unchanged isolated 7/7 and full rerun 74 files / 570 tests PASS. Full Chromium FAIL: 43 passed / two timing failures (100-wall selection 81.2 ms >50, stress p95 20 ms >12). Subsequent no-retry diagnostics pending; neither failure is erased. |
| Rebuilt final production image / zero-gap runtime / complete Chromium | Pending actual run |
| Updated final development image / quality / Watch persistence | Pending actual run |
| Wall-fix three-OS hosted matrix / macOS zero-retry repetitions / Docker | [Run 38358717111](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38358717111), head `9494d03a260dbdfe11c247a8260cdf1d62e9889a`: FAIL. All OS unit gates PASS (74 files / 570 tests). Ubuntu CLEAN 45/45; Windows 44 passed / stress failed all three attempts, p95 13 / 13 / 14 ms; macOS full suite CLEAN 45/45, extra no-retry repetitions 2 passed / one failed, p95 7 / 10 / 16 ms. Docker PASS, all notice/provenance gaps zero. |

These pending rows are not passes. Phase-one logs and the macOS first failure
remain unchanged; final wall-fix outputs use separate `fix-wall-*` names.

Actual browser concurrency is captured in that run: Ubuntu/Windows report four
logical cores and use two Workers; macOS reports three and uses one under the
original pool policy. All eight captured stress attempts completed 24 unique
frames and recorded no Long Tasks. The failed macOS repetition reports shard p95
9 ms versus complete-pool p95 16 ms; the last Windows attempt includes a 16 ms
pool sample with shard maximum 2 ms. The difference includes dispatch, transport,
scheduling, main-thread handling and validation; these measurements do not isolate
which phase accounts for every delay, and do not justify changing the pool policy.

Further native profiling uses the same stress input with diagnostic-only CDP
hardware concurrency three, asserted before execution. The CPU profiler perturbs
timing and is not acceptance evidence. Across 24 frames it records 61.164 ms
inclusive in scene projection and 21.934 ms in source-result validation; the
first-reflection patch lookup contributes only 1.052 ms total. Those observations
support removing unused render-time scene work; they do not support weakening
validation or adding a lookup cache to fix the unexplained scheduling gap.

## Request-only UI calculation correction

`WorkspaceProjectTools` projected the entire Classic scene on every render even
though only Generate/Explain consumed it. Worker status updates rerender those
controls with the same project; Hybrid Generate also discarded that Classic
projection. Projection now runs in the appropriate existing click handler.
Similarly, the viewport collected every Frame All point when listener labels
changed, despite using those points only when Frame All was clicked. Its unchanged
point sequence and camera function now run in that handler. No Worker algorithm,
pool policy, reflection/RT60 formula or expected numerical value is changed.

Two real-component idle-render regressions failed before the correction and pass
after it; scoped lint and full TypeScript pass. Existing Classic/Hybrid Generate
and Frame All browser cases plus a new mock Explain selected-source case protect
the handlers. The integrated 46-case browser suite and rebuilt images are pending
actual execution; the preceding CI failures remain above.

A separate native HC3 boundary diagnostic before this correction passed p95 7 ms
with 24 complete frames and no Long Tasks. Native message handling (validation,
assembly and synchronous result callback) measured p95 1.8 ms; dispatch-to-handler
time minus rounded shard duration measured p95 0.9 ms, with approximately 1 ms
rounding uncertainty. This faster Windows host did not reproduce the hosted
scheduling gap and cannot establish its cause. No validation cache is added.

The subsequent native unit run also exposed a test-fixture issue: the real Next
compiler alias module was cold-loaded inside an assertion test, exceeding its
default five-second timeout twice (6.245 s and 18.141 s). Both failed runs remain
recorded. Its actual compiler load now belongs to module fixture initialization;
the same alias/rejection assertions retain the same default timeout, without a
mock. Marker regressions pass 7/7 and the full suite passes 75 files / 572 tests
(6.047 s process). Compiler import time remains part of total execution/import
reporting; this changes no application timing gate.

## Already verified remote adoption

These runs tested the previous tree, not the new local fixes:

| Hosted run | Actual result |
| --- | --- |
| [Initial PR run 38349805880](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38349805880) | Application PASS, 524 units / Chromium 45/45. Docker FAIL before build because the preinstalled Compose rejected `initial_sync`. |
| [Corrected PR run 38350110304](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38350110304) | Application and Docker PASS; 524 units / Chromium 45/45. Verified Compose 5.5.1 installation fixed the actual runner problem. |
| [Merged-main run 38350389651](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38350389651) | Application and Docker PASS at exact main SHA above; 70 files / 524 units, 7.92 s; Chromium 45/45, 42.1 s, clean rather than flaky. Health, routes, static/public assets, no-key API, UID 1000 and shutdown assertions passed. Image `sha256:ad11b98b464f7d2f57d2f5613e7fdf33ffb2d7721f617fd6922002ba01436b75`, 267,762,733 bytes. That older image still had the then-documented notice exception. |

## Dependency and licensing maintenance

[ADR 0006](../adr/0006-local-dependency-patches.md) records the tradeoffs and
upgrade requirements. All three exact-version patches are lockfile-hashed and
copied before Docker's frozen dependency install; Watch rebuilds when patches
change. The marker preserves canonical import paths, conditional exports and
Next's compiler aliases. Original marker identities, absent metadata/notices,
escaped paths and provenance exceptions fail the collector/runtime guard.

The braces guard bounds structural nesting at 128; it does not claim to solve
every glob expansion or regex resource limit. Upstream audit databases cannot
recognize this local code correction, so the advisory remains a tracked metadata
finding until an authentic fixed release is available. Neither a clean production
audit nor these regressions establish comprehensive base-image CVE clearance.

## Verification that still requires a real environment

Subjective HRTF/headphone localization and physical device interruption require
host-browser listening. Automated OfflineAudioContext/state/persistence tests
remain useful but cannot substitute for those judgments. macOS Docker Desktop,
separate Linux desktop audio and ARM64 are distinct from native hosted CI.
Use the [browser/listening checklist](../testing/browser-listening.md) and record
actual browser, hardware, image/commit and outcomes. No real key or paid provider
call is needed for the manual/preloaded scenes used in these checks.
