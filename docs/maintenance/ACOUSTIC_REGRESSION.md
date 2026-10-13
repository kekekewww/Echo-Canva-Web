# Acoustic Regression Report

Date: 2026-10-13. Source: `v1.0.0-build-week`, commit `c8fe24700b67861e2f64fbb8950e9281c0e13a3c`.

This maintenance work adds three independent numerical checks. It changes no acoustic runtime formulas, material coefficients, geometry tolerances, search budgets, scene schemas, browser audio behavior, or approved regression artifacts. The application remains an interactive geometric-acoustics approximation rather than a calibrated room-acoustics measurement system.

## Executed verification

| Check | Result | Scope |
| --- | --- | --- |
| Original extracted `pnpm test` | PASS: 69 files / 508 tests | Before maintenance; see [baseline report](BASELINE_TEST_REPORT.md) |
| `pnpm exec vitest run tests/unit/image-source.test.ts tests/unit/room-acoustics.test.ts tests/unit/classic-baseline-capture.test.ts` | PASS: 3 files / 18 tests, exit 0, 413 ms Vitest duration | Three new checks plus existing reflection, room, and exact Classic oracle tests |
| `pnpm exec eslint tests/unit/image-source.test.ts tests/unit/room-acoustics.test.ts --max-warnings=0` | PASS: exit 0 | Modified test files |
| Original production Chromium E2E | FAIL: 44 passed / 1 failed | Stress test observed a 182 ms long task against the existing 50 ms limit; failure retained |
| Final native unit suite | PASS: 70 files / 524 tests, exit 0, 13.44 s | All deterministic units, including 3 new numerical and 13 new AI checks |
| Final native complete Chromium suite | FAIL: 44/45 passed | Stress Worker p95 18 ms versus unchanged <12 ms; targeted retry instead failed on a 191 ms long task versus 50 ms |
| Final production-container Chromium suite | FAIL: 44/45 passed | Stress Worker p95 63 ms versus unchanged <12 ms; earlier image passed 45/45, retained separately |
| Docker deterministic units | PASS: 70 files / 524 tests, exit 0, 17.07 s in final Linux image | Fresh non-root, network-disabled image ran typecheck, lint and units without audio hardware |
| Headphone localization, perceived occlusion, and actual host audio output | Not performed | Require a listening session in a host browser |
| Calibration against measured room impulse responses | Not performed | No scientific measurement-accuracy claim |

No test is skipped and no acceptance threshold was relaxed by this work. Passing isolated numerical tests does not erase the baseline browser performance failure. The integrated suite contains 16 additional tests: these three acoustic checks and 13 AI security checks. Final Chromium performance failures remain unresolved; no repeated pass is presented as erasing them.

## Required coverage map

Paths below are relative to `tests/unit/`. These tests existed at the immutable source tag unless identified as additions in the next section.

| Required area | Tests | Protected behavior |
| --- | --- | --- |
| Direct path | `geometry.test.ts`, `compute-frame.test.ts`, `hybrid3d-direct.test.ts` | Finite visibility, direct-route selection, 3-4-5 distance and propagation delay, 3D elevation |
| Occlusion | `occlusion.test.ts`, `hybrid3d-audible-direct.test.ts`, `compute-frame.test.ts` | Ordered blockers, blocked fallback, gain/filter bounds, finite-height occlusion |
| Transmission | `occlusion.test.ts`, `hybrid3d-audible-direct.test.ts` | Accumulated three-band losses, thin-wall non-amplification, incidence/thickness adjustment, material distinctions |
| Geometry intersection | `geometry.test.ts`, `hybrid3d-direct.test.ts`, `hybrid3d-compile.test.ts`, `hybrid3d-primitives.test.ts` | Endpoints, parallel and collinear cases, zero-length rejection, finite patch containment, BVH versus brute force, wall caps and portal thickness |
| First-order reflection | `image-source.test.ts`, `hybrid3d-reflection.test.ts`, `hybrid3d-reflection-rendering.test.ts` | Analytic reflection points/path lengths/delays, finite surfaces, obstructed legs, specular material gain, deterministic ordering and six-tap cap |
| Second-order reflection | `image-source.test.ts`, `compute-frame.test.ts`, `hybrid3d-second-order.test.ts`, `hybrid3d-reflection-rendering.test.ts` | Ordered two-bounce geometry, visibility of all legs, exhaustive/pruned agreement, search limits, listener-facing rendering |
| Portal routing | `portal.test.ts`, `compute-frame.test.ts`, `hybrid3d-audible-direct.test.ts` | Open/closed portal behavior, minimum-cost deterministic ties, intermediate nodes, final listener-facing portal, obstruction of lifted 3D route |
| Material energy | `material-registry.test.ts`, `hybrid3d-six-band-materials.test.ts`, reflection tests | Absorption/transmission balance, specular/diffuse accounting, immutable presets, exact three-band anchor projection |
| RT60 | `room-acoustics.test.ts`, `schroeder-reverb.test.ts` | Eyring estimate, openings and missing boundaries, clamps, partition faces, dimensional scaling, stable comb feedback and damping |
| Hybrid 3D | `hybrid3d-*.test.ts`, `scene-document.test.ts`, `engine-router.test.ts` | Coordinates, compilation, finite shapes, direct/reflected paths, compatibility envelope, bounded data-only research helpers |
| Acoustic Worker | `acoustic-worker.test.ts`, `classic-source-worker.test.ts`, `classic-source-pool.test.ts`, `hybrid-direct-worker.test.ts`, `hybrid-direct-pool.test.ts`, `use-acoustic-frame.test.ts` | Revision acceptance, cadence, coalescing, cache identity, complete ordered assembly, malformed/stale shard rejection, atomic serial fallback and disposal |
| Audio state | `audio-engine.test.ts`, `early-reflection-bank.test.ts`, `audio-math.test.ts`, `schroeder-reverb.test.ts`, `transport.test.ts` | Explicit activation, idempotent/concurrent startup, persistent HRTF graphs/taps, smoothing, Raw/Simulated separation, transactional failures and disposal |
| Scene serialization | `scene-serialization.test.ts`, `scene-document.test.ts`, `scene-schema.test.ts`, `scene-validation.test.ts`, `workspace-transfer.test.ts`, `workspace-persistence.test.ts` | v1 round trips, v2 Classic projection, compatibility hash, atomic malformed-input rejection, authoring transfer and local-asset metadata |

Production Chromium coverage in `tests/e2e/audio-rendering.spec.ts` renders the actual Schroeder implementation in `OfflineAudioContext`. It asserts finite non-zero stereo output with peak at or below full scale, an equal-band 0.8-second target within +/-20%, and a Raw/Simulated transition whose largest adjacent-sample step is at most 1% of its rendered peak. The extracted baseline run passed this case; a physical audio device is unnecessary for this rendered-signal check.

## Additional reproducible numerical fixtures

### Classic second-order analytic path

`image-source.test.ts` now tests a successful ordered bottom-to-right reflection in a 10 by 10 metre room. Source `(2,5)` and listener `(8,5)` yield first vertex `(7,0)` and second vertex `(10,3)`. Unfolding mirrors the source to `(18,-5)`, giving an independently derived path length `sqrt(10^2 + 10^2) = 14.142135623731 m`.

- Straight reference length: `6 m`.
- Excess delay: `1000 * (10*sqrt(2) - 6) / 343 = 23.738004733909 ms`.
- Two hard-concrete mid-band specular amplitudes multiply to `(1 - 0.04 - 10^(-34/10)) * (1 - 0.08)`.
- Distance-adjusted gain: approximately `-24.092721490745 dB`.

The vertices are checked exactly; length, delay and gain use `toBeCloseTo(..., 10)`. This supplements the existing obstructed-middle-leg rejection and blocked-frame integration tests without regenerating their expected values from the solver.

### Eyring dimensional similarity

`room-acoustics.test.ts` now uses a sealed `10 x 8 x 3 m` room with `wood_medium` on every surface, then scales all dimensions by `k = 0.5`. For unchanged mean absorption, `V` scales by `k^3`, `S` by `k^2`, and Eyring `RT60` by `k`. The room-scale pre-delay also scales by `k` while neither case crosses its clamp.

The unscaled fixture has `V = 240 m^3`, `S = 268 m^2`, and low/mid/high RT60 approximately `1.127867494807 / 0.726522663006 / 0.525363509805 s`. Explicit bounds ensure all six decay values lie strictly inside `(0.12, 4) s`, so a clamp cannot masquerade as correct similarity. Checks use `toBeCloseTo(..., 10)`.

### Internal partition surface accounting

The same wooden room gains a four-metre internal partition spanning `(5,2)` to `(5,6)`. Its two exposed faces add `2 * 4 * 3 = 24 m^2`; volume remains `240 m^3` and total surface becomes `292 m^2`. With uniform mid-band absorption `0.18`, expected RT60 is independently calculated as `0.161 * 240 / [-292 * ln(1 - 0.18)] = 0.666808471526 s`.

This checks the documented full-height partition approximation. It makes no claim that finite wall volume is subtracted or that complex connected rooms are separately solved.

## Immutable regression evidence

Keep `benchmarks/results/mvp-baseline.json` and `benchmarks/results/mvp-baseline-audio.json` under version control. They are reviewed reference evidence rather than expendable build output. `classic-baseline-capture.test.ts` checks the exact six-decimal projection of ten Classic scenarios, including direct visibility, blocked/portal routes, material contrast, reflection metrics, RT60 and a 100-wall scene.

The numerical artifact's existing version and historical provenance remain unchanged. The targeted regression test passed with the three new checks. The historical browser-audio artifact records an earlier run; use freshly executed tests when assessing a new environment.

Do not update an oracle to resolve a failure until a proposed physical, numerical or perceptual change has its own rationale, independent expected result and review. Timing budgets are environment-sensitive measurements; keep failures and environment details even when a later rerun passes.

## Scientific and runtime boundaries

| Category | Implemented treatment |
| --- | --- |
| Physical/formula foundations | Geometric specular image sources, metric path length and `L/c` delay, energy-to-amplitude conversion, Eyring room-scale estimate |
| Numerical approximations | Planar/finite-patch geometry, centralized intersection tolerance, faceted Cylinder/Sphere surfaces, bounded reflection search |
| Engineering budgets | Classic: at most 24 representative second-order surfaces / 552 ordered pairs; Hybrid: retained 36-surface budget and pruning; maximum six ranked early taps per source, bounded Worker update rates, persistent audio graphs |
| Perceptual adjustments | Material presets, incidence/thickness transmission heuristic, 24 dB blocked-loss cap, low-pass mapping, parameter smoothing, browser HRTF and Schroeder late reverberation |
| Research foundations | Receiver-connection sampling, six-band projection, atmospheric helpers and directional energy histogram have deterministic tests; their existence does not establish a production six-band or directional late-field audio renderer |

Classic retains its v1 three-band scene and constant `343 m/s` propagation. Hybrid retains finite 3D direct/reflected geometry and its validated rendering adapters. Portal routing is a geometric approximation, not wave diffraction. Browser HRTF dataset and perceived localization vary with browser, listener and headphones. The acoustic runtime and local audio storage stay in the browser; containers run the Next.js server and API routes.

## Remaining scientific verification debt

- Add a rendered direct-versus-occluded spectral-energy comparison using the real source graph. Historical acceptance text lists this check, but current `audio-rendering.spec.ts` checks reverb/crossfade only; unit filter assertions do not measure a rendered spectrum.
- Broaden geometry and Hybrid reference fixtures with independently derived concave/near-degenerate cases and property checks before changing tolerances or search budgets.
- Measure moving-listener and narrow-portal convergence before enabling any research late-field renderer. Existing stationary helper tests demonstrate determinism and accounting rather than measured physical convergence.
- Perform and record a host-browser headphone session for localization, portal direction, material contrast, and transition continuity. Automated graph/state tests cannot substitute for those judgments.
- Retain the original stress long-task failure and investigate reproducible performance on representative hardware. Do not raise the threshold to produce a passing report.
- Any future scientific accuracy claim needs external measurement/reference validation, source/material calibration and stated uncertainty; none is supplied by this cleanup.

## Reproduction

Native development retains `pnpm install --frozen-lockfile`. Run `pnpm test` for all deterministic units, or the targeted command in the verification table for the new numerical fixtures and preserved Classic oracle. Run production Chromium tests through the repository's documented E2E command for rendered-audio and editor coverage. Docker contributors use the equivalent commands in [Docker development documentation](../deployment/docker.md); deterministic unit tests require no host audio device or paid AI provider.
