# Changelog

Changes use Conventional Commit subjects. Releases should record compatibility changes, scientific-model changes, dependency/security fixes, and validation limits separately.

## Unreleased — independent Echo Canvas Web extraction

### Repository and community

- Extracted the immutable `v1.0.0-build-week` baseline from `kekekewww/Echo-Canva`; the exact commit and release evidence are recorded in [docs/ORIGIN.md](docs/ORIGIN.md).
- Established long-term contributor instructions, security reporting, community conduct, issue/PR templates, proposed labels, and sciwork issue drafts.
- Preserved Build Week delivery documents and original active documentation in [docs/archive/build-week](docs/archive/build-week/INDEX.md).
- Clarified live Classic/Hybrid behavior and data-only P5/P6/P7 research foundations without enabling additional acoustic features.

### Development and deployment

- Added optional reproducible Docker development with Compose Watch and a separate non-root standalone production image.
- Added public-PR quality checks and production container build/start/HTTP smoke checks; native pnpm and Vercel workflows remain available.
- Limited hosted application CI to Ubuntu and Windows at the maintainer's request, removing the macOS job and its dedicated repeat steps. The original complete E2E suite, including its acoustic stress case, remains mandatory. macOS and extra Ubuntu repetition failures remain documented as unresolved performance variability.
- Added a server health endpoint. Container execution evidence and unavailable checks are recorded in the [maintenance reports](docs/maintenance/README.md).

### Security maintenance

- Made production AI provider use an explicit opt-in and bounded route input, process request usage, concurrency, and provider retries.
- Updated affected dependencies as a separate maintenance change; the lockfile and [security report](docs/maintenance/SECURITY_LICENSE.md) contain the resolved versions and audit results.
- Added a reproducible local `braces@3.0.3` nesting guard; version-based audits still report the upstream advisory until a fixed release exists.
- Replaced both client-only markers with independently authored project-MIT implementations and made runtime notice gaps fail collection/inspection. Real Next compiler checks protect Client/Server boundaries.
- Refreshed dependencies within their current majors (closes #13): Next.js and `eslint-config-next` 16.3.8 to 16.4.2, React and React DOM 19.2.7 to 19.3.1, Zod 4.4.3 to 4.6.7, Playwright 1.61.1 to 1.64.1, `@types/node` 26.1.1 to 26.6.5, `@types/react` and `@types/react-dom` to 19.3.0. The Next.js client-only marker patch was ported to `patches/next@16.4.2.patch` with identical replacement content (ADR 0006); the braces and client-only patches and the security overrides are unchanged. Node, pnpm and the ESLint, TypeScript, Vitest and OpenAI majors are not changed.

### Acoustic compatibility

- Retained baseline schema versions, material presets, geometry/acoustic algorithms, browser audio, and local audio storage behavior.
- Additional regression fixtures and actual results are recorded in [docs/maintenance/ACOUSTIC_REGRESSION.md](docs/maintenance/ACOUSTIC_REGRESSION.md).
- Reduced Hybrid listener-update work by retaining static primitive identity and computing only the needed Classic Direct/Portal projection; numerical oracles, formulas and performance budgets are unchanged. See [follow-up verification](docs/maintenance/VERIFICATION_FIXES.md).
- Removed duplicate coincident side polygons for walls without open Portals; this preserves the existing surface coverage and removes translucent fill/stroke overdraw. Added independent projected-geometry regressions and post-measurement stress diagnostics; CI preserves retry evidence.
- Compute AI request projections and Frame All points when their buttons are used, avoiding unused scene work during listener/Worker status renders. Existing acoustic and camera calculations remain unchanged; mock Explain and idle-render regressions cover the UI boundaries.
- Keep Inspector/Outliner inputs stable during acoustic status updates, avoiding unnecessary panel rerenders while preserving project, local-audio and panel-state updates.
- Stop Hybrid reflection visibility searches at the first non-allowed blocker, preserving intersection formulas and full direct/transmission hit lists. Add first-attempt CI diagnostics, seeded equivalence tests and a separate single-Worker stress check; see [CI remediation](docs/maintenance/CI_REMEDIATION.md).

### Browser audio

- Removed interaction clicks and bursts tracked in #18. Formulas, ranking, tie-breakers, the six-tap limit, Worker protocols and frame acceptance rules are unchanged:
  - between accepted frames, simulation parameters now hold their accepted occlusion/Portal state instead of a free-field estimate that jumped by more than 20 dB for blocked sources during drags (#19);
  - Hybrid audio state no longer suppresses source-gain and HRTF updates or outlives Hybrid mode (#22);
  - source graphs fade in on start and out before stop/disconnect, and the master output fades around suspend, resume and disposal (#20). A production-Chromium `OfflineAudioContext` check renders the real SourceGraph start/retire;
  - reflection taps keep their path while it stays audible and retune silently when reassigned, so delay lines no longer glide between unrelated paths (#21).
- Skipped re-scheduling identical automation targets, kept workspace projections stable across camera/selection/notice changes so they no longer re-run acoustic jobs or audio reconciles, and built the Classic static context once per Worker dispatch (#24, #25, partial). Frame delivery under continuous edits (#23), `latencyHint`, and Worker capacity are not changed.
- Kept acoustic frames flowing during continuous drags (#23, [ADR 0007](docs/adr/0007-adopt-pose-lagging-frames.md)). A complete frame is now adopted as *pose-lagging* when the current scene differs from its input only in listener/source pose. Before this, the Worker pools discarded every in-flight frame that a newer pointer event overtook, so overlays and audio froze until the pointer paused (0 frames in 3 s at 20 ms jobs in a fake-clock simulation; now at least 20). Frames for a different static structure or source set are still never adopted.
- Stopped re-serializing and hashing the static scene for pose-only updates (#24). The Classic pool reuses its static context while the static structure is unchanged, and the Hybrid geometry compiler skips its hash when the static inputs are structurally equal. 100 pose-only updates now make no `JSON.stringify` call (unit-tested). On the 100-wall preset in Node, a structural check takes about 0.1 ms, against about 0.33 ms for the Classic fingerprint and about 0.25 ms for the Hybrid hash. Fingerprint and hash values are unchanged.
- Added an opt-in Chromium benchmark, `tests/e2e/audio-render-capacity.spec.ts` (`ECHO_AUDIO_BENCHMARK=1`). It records DevTools Web Audio render capacity and accepted acoustic frames during a scripted drag (#25). In a headless 4-core container ([evidence](docs/maintenance/evidence/audio-render-capacity/README.md)), mean drag render capacity fell from about 0.21 before PR #40 to about 0.15–0.18 after it. During a 10 s drag, sampled accepted frames went from 0/39 before #23 to 39/39 after. `latencyHint` and the Worker capacity formula are unchanged, pending real-device measurement.

## Source release — v1.0.0-build-week

This upstream tag is a source provenance label, not a new release of this repository. See [ORIGIN.md](docs/ORIGIN.md) for its original date, commit, capabilities, and extraction differences. No release or deployment is published by the local cleanup.
