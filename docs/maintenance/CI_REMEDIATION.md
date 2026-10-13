# CI diagnosis and visibility remediation — 2026-10-13

This follow-up supersedes current-status claims, not historical measurements, in
[VERIFICATION_FIXES.md](VERIFICATION_FIXES.md). Later exact-head hosted results
belong in [PR #2](https://github.com/kekekewww/Echo-Canva-Web/pull/2) to avoid a
documentation-only commit repeatedly invalidating the tested head.

## CI platform policy update — 2026-10-14 (Asia/Taipei)

The maintainer requested removal of macOS CI, cancellation of the temporary
ten-minute PR monitor, and merging PR #2. The monitor is paused and its pending
macOS retry was cancelled. CI now requires Ubuntu and Windows application checks
and the separate production Docker job. Both three-repeat, zero-retry stress
gates (native capacity and single Worker) move to Ubuntu with unchanged assertions.

At `f7ee10e79aca5d68fb647fd61f73c0bb28b7b354`, Ubuntu and Windows each passed
575 unit tests and a clean 46/46 Chromium suite; production Docker integration also
passed. In [run 38426347157](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38426347157),
the first macOS job never executed: GitHub reported that no hosted runner acquired
the job and cited macOS ARM64 capacity constraints. Its one authorized retry was
cancelled at the maintainer's request. This final revision therefore has **no
macOS acceptance result**. Earlier executed macOS results below remain historical
evidence. The new workflow commit must pass its retained checks before merging;
consult PR #2 for those exact-head results.

## Confirmed failures and limits

At `e9e70424`, [run 38366312003](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38366312003)
failed the extra macOS repeat: p95 values were 10, **12**, 7 ms against the original
strict `<12 ms` gate. The failing attempt included a 69 ms pool / 15 ms shard
sample. Worker elapsed time is not pure CPU time; callback scheduling and result
validation also contribute to pool time. There is no CPU trace of that historical
attempt, so no claim that one function explains the entire stall.

Windows passed with one loading-page timeout on the pan test's first attempt; its
retry passed. This happened before pan interaction, at the source locator while
the page still showed `Loading Echo Canvas`. No first-attempt console/CPU evidence
was available. We have not established a hydration defect or changed pan behavior.

## Investigation and changes

- First-attempt workspace failures now save bounded page errors, failed requests,
  HTTP errors, navigation milestones and crashes before teardown.
- Opt-in Chromium tracing records main-thread and Worker CPU samples. A local
  instrumented stress attempt reproduced p95 12 ms. The traces show BVH traversal,
  segment/patch intersection and allocation/GC work, as well as substantial
  Playwright DOM snapshot overhead. Profiling is not acceptance evidence.
- Reflection visibility previously collected and sorted every intersection,
  although only the existence of a non-allowed blocker matters. A boolean BVH
  query now stops at the first accepted hit. Direct/transmission paths retain the
  full sorted-hit query. The intersection math, tolerances, Portal aperture checks,
  allowed-reflector rule, reflection budgets, Worker policy and validation remain
  unchanged.
- Three new tests cover apertures/finite edges/endpoints, allowed reflectors with
  subsequent blockers, and 2,048 seeded oblique/parallel/zero-length segments
  against the retained full-intersection oracle. The new-query assertions failed
  before implementation; all tests pass afterward.

The diagnostic [run 38423939099](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38423939099)
tested `926fb962` **before** the visibility optimization. Its four jobs passed,
including macOS native repeats 3/3. However, Chromium reported five cores / three
Workers, versus three cores / one Worker in the previous failing run. The YAML
runner label was unchanged. This is not proof that low-core behavior was fixed.
Windows' supplementary DOM/CPU-profiled stress attempts failed 6/6, while its six
pan attempts passed; these instrumented attempts did not replace acceptance.

The visibility-change commit retained the native macOS repeats and added an unprofiled
single-Worker check. It overrides only Chromium's reported core count to three;
it does not emulate a physical three-core CPU. Expensive diagnostic collection
runs only after a failed gate, with DOM tracing off to reduce observer overhead.
All acceptance assertions and zero-retry repetition remain unchanged. See
[diagnostic commands](../testing/ci-diagnostics.md).
The subsequent platform policy update above moves both checks to Ubuntu.

## Fresh local verification of the visibility change

Windows host, Node 22.17.0, Chromium 149.0.7827.55; pinned CI/Docker Node remains
22.23.3. Synthetic scenes and disabled/mocked AI only.

| Check | Actual result |
| --- | --- |
| Lint, TypeScript, immutable source | PASS; 291 source files and exact two-root provenance |
| Full unit suite | PASS: 76 files, 575 tests |
| Production build | PASS; Next server/API routes retained |
| Full unprofiled Chromium suite, zero retries | PASS: 46/46, 43.2 s |
| Single-Worker unprofiled stress, zero retries | PASS: 5/5, p95 4 / 4 / 4 / 8 / 4 ms; no observed Long Tasks |
| Serial acoustic microbenchmark | Mean 3.483 → 3.178 ms/frame across ten batches of 80 frames, approximately 9% lower; noisy host-specific measurement, not an E2E latency guarantee |
| Exact numerical output comparison | Eight complete 100-wall/four-source/eight-Portal listener-pose frames retain SHA-256 `b5a5734f6db33234998715ac7d7e3fce121962279d585ae16d421674c79f991a` |
| Hosted CI/Docker for the final visibility commit | Pending at document creation; consult the exact-head PR checks |

Small raw metrics, red/green logs and the reproducible benchmark source are in
[the evidence directory](evidence/ci-remediation/MANIFEST.json). CPU traces and
Playwright archives remain local diagnostic artifacts or the linked workflow's
seven-day artifacts; they are not shipped in the application/image.

To repeat the microbenchmark, copy the two `.ts.txt` evidence files into
`test-results/visibility-benchmark.test.ts` and
`test-results/visibility-benchmark.config.ts`, create `../verification-logs`, set
`BENCH_LABEL` to a fresh output label, and run
`pnpm exec vitest run --config test-results/visibility-benchmark.config.ts`.
The helper writes results outside the repository; it does not modify thresholds.

## Remaining uncertainty

The earlier Windows loading timeout has not reproduced in the new six-attempt
diagnostic run or fresh full local suite; it is monitored, not declared fixed.
Passing finite repeats cannot guarantee every hosted scheduling condition. No
test threshold, formula, pool capacity or retry policy was relaxed. The existing
development-only braces advisory metadata, manual listening and untested Docker
host/architecture limitations remain as described in the debt ledger.
