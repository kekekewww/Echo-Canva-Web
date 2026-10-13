# Echo Canvas Web — Maintainer and Agent Instructions

## Purpose and source boundary

Maintain a browser-based interactive acoustic simulation and visualization workbench. This independent repository starts from the immutable upstream `v1.0.0-build-week` commit in `docs/ORIGIN.md`. Preserve provenance, MIT/third-party attribution, and archived evidence. Never silently import later upstream features or rewrite published source history.

Read `README.md`, `CONTRIBUTING.md`, `docs/ARCHITECTURE.md`, `docs/ACOUSTICS.md`, `docs/API_CONTRACTS.md`, and affected tests before behavior changes. Historical competition checklists, acceptance gates, and submission requirements in `docs/archive/build-week` are evidence, not current instructions.

## Architecture

- Retain Next.js App Router, React, strict TypeScript, pnpm, browser Web Audio, and Web Workers unless a separately reviewed ADR changes the stack.
- `src/app` owns pages/server routes; `src/components` UI; `src/domain` models/schemas/validation/registries/persistence; `src/acoustics` pure calculation; `src/audio` browser audio; `src/workers` protocols/pools; `src/ai` optional provider control plane; `src/hooks` lifecycle coordination.
- Keep React, AudioContext, and provider SDK dependencies out of pure geometry/acoustic algorithms. Preserve independently testable serial computation.
- Preserve `SceneSpec v1`, `SceneDocumentV2`, transfer/cache migration, Classic projection hashes, registry IDs, disabled entities, and one active listener. Intentional compatibility changes need an ADR, migration, and regression evidence.
- The live workbench selects Classic/Hybrid adapters directly. Generic EngineRouter default flags do not determine its available Hybrid mode.
- P5/P6/P7 helpers remain data-only until an explicitly reviewed runtime integration exists.

## Acoustic correctness

- State units, coordinate conventions, and numerical tolerances. Preserve baseline formulas, parameters, material coefficients, ranking/tie-breakers, and approximation limits unless a focused change is justified and recorded.
- Distinguish physical relations, numerical approximations, engineering optimizations, and perceptual tuning. Do not claim true diffraction, architectural-acoustics accuracy/certification, or a named browser HRTF dataset without implementation/evidence.
- Validate material energy and scene invariants. Do not silently normalize invalid coefficients, tune fixtures to a defect, or change formulas simply to pass a test.
- Keep direct/occluded/Portal paths, finite intersections, and first/bounded blocked-route second-order reflections independently testable. Retain bounded search and six shared audible taps.
- Limits include 100 walls, 8 Portals, 4 sources, 8 listeners/one active receiver, 8 primitives, 50 m maximum planar room dimensions, and 0.1 m minimum wall length. Classic primitive footprints consume the projected wall budget. Schema update requests accept 5–20 Hz; coordinators clamp to 10–15 Hz.

## Worker and audio contracts

- Preserve coalescing, static caching, deterministic sharding, bounded pools, and validated revision/request/fingerprint/source assignments.
- Publish complete matching frames only. Discard partial/stale/hostile results and retain complete serial fallback on construction/protocol/message/compute/watchdog failures.
- Keep one persistent AudioEngine across modes. Initialize after a user gesture; reuse graph/tap bundles and automate/smooth updates rather than rebuilding each frame.
- Preserve Raw/Simulated transitions, HRTF/equal-power settings, explicit stop/resume/retry behavior, and overlay/audio accepted-revision consistency.
- Local decoding/IndexedDB blobs remain browser-side. Exports contain relinking metadata, not blobs. No required audio upload, host audio mount, or native runtime.

## AI and security

- AI compiles a validated candidate or explains a deterministic snapshot; it never defines authoritative acoustics, drives AudioParams, executes code, invents registry IDs, or loads arbitrary URLs.
- Treat prompts, labels, snapshots, output, request bodies, and Worker payloads as untrusted. Keep strict schemas/invariants/content policy/bounds and at most one schema/domain repair.
- Keys remain server-side runtime configuration. Production AI requires `AI_ENABLED=true`; follow `SECURITY.md` for public paid-key services. Tests use mocks; fork CI gets no live keys.
- Exclude credentials, local audio, `.env`, Git history, host dependencies, `.next`, and test reports from images. Preserve non-root production and secret exclusions.

## Development and verification

Retain native frozen-lockfile and optional Docker workflows. Keep Node/pnpm versions consistent across package metadata, Docker, CI, and docs. Production is one standalone Next.js application with API routes and Vercel compatibility; no unreviewed static export or extra services.

For code changes run meaningful checks:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

Use targeted tests while iterating, then affected quality gates. Documentation-only work needs accurate claims, paths, and commands, without tests that merely mirror text. Docker changes require build/start/health/routes/API/source-sync/hot-reload/non-root/stop checks where a daemon exists. Never claim unrun containers or cross-platform checks passed.

Record actual pass/fail/unverified evidence and environment. Distinguish numerical tests, browser offline rendering, real output, listening, and benchmark evidence. Do not weaken or conceal failed thresholds; separate existing failures from regressions.

## Maintenance discipline

Respect user edits; use an independent branch/directory for broad maintenance. Prefer minimal focused changes and Conventional Commit subjects. No automatic public repository creation, image publication, production deployment, upstream push, or PR merge without user authorization.

Update docs and ADRs for consequential schema/model/security/dependency/deployment decisions. Archive only after verifying purpose, references, necessary bytes, and attribution. Names such as MVP, Experiment, Artifact, or Build Week alone never justify deletion.
