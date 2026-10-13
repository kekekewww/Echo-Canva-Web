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

## Integrated verification of the corrected tree

| Check | Status |
| --- | --- |
| Native full lint/typecheck/unit/build/source verification | PASS: lint 20.69 s, TypeScript 7.65 s, 73 files / 567 units (5.94 s process), production build 20.10 s and immutable 291-file source verifier. |
| Native full Chromium suite | PASS: 45/45, 49.6 s (process 50.47 s), one worker / zero retries; original stress 8.7 s at unchanged 12/50 ms gates. |
| Real Next Client/Server compiler boundary | PASS: four actual default Turbopack / Webpack positive and negative fixtures, 46.21 s; valid Client builds and forbidden Server imports reject for the boundary reason. |
| Strict marker/notice collector/runtime guard regressions | PASS in full suite: 16 new marker/collector/guard cases, including original identity with borrowed LICENSE and falsely clean summary. Earlier 15-case run passed separately. Actual Windows collector also passed: 20 packages, all five gap counters zero, 3.38 s. |
| Updated development image, quality checks, Watch/HMR/restart | Pending actual run |
| Updated production image, runtime contents, health/API/shutdown | Pending actual run |
| Full Chromium against updated production container | Pending actual run |
| Ubuntu / Windows / macOS hosted application matrix | Configured; pending new PR execution |
| Updated hosted production Docker job | Configured; pending new PR execution |

Pending rows are not passes. Update them with actual evidence before completion.
Portable follow-up evidence lives separately from the initial hashed outputs;
full local diagnostics remain in sibling `verification-logs/`.

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
