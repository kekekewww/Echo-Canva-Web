# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project rules

The reviewed maintainer rules in `AGENTS.md` apply in full. They are imported here rather than copied, so there is one source of truth:

@AGENTS.md

`AGENTS.md` is versioned governance (ADR 0004): `next.config.ts` sets `agentRules: false` so Next.js never appends to it. Change it only deliberately.

For sustained work, start at the [project memory index](knowledge/wiki/index.md) and follow the [shared schema](knowledge/schema.md) for task claims, evidence and handoffs. After changing anything under `knowledge/` or these entry links, run `node scripts/lint-knowledge.mjs`; CI does not run it.

## Commands

The toolchain is pinned: Node 22.23.3 (`.nvmrc`) and pnpm 11.7.0 (`packageManager`). Install with `pnpm install --frozen-lockfile`.

| Task | Command |
| --- | --- |
| Dev server on http://localhost:3000 | `pnpm dev` |
| Lint (zero warnings allowed) | `pnpm lint` |
| Type-check | `pnpm typecheck` |
| Unit tests (Vitest, `tests/unit/**/*.test.{ts,tsx}`) | `pnpm test` |
| One unit test file | `pnpm test tests/unit/occlusion.test.ts` |
| Unit tests by name | `pnpm test tests/unit/occlusion.test.ts -t "<test name>"` |
| Production build | `pnpm build` |
| Full E2E (builds first, then Playwright Chromium) | `pnpm e2e` |
| One E2E spec, after `pnpm build` | `pnpm exec playwright test tests/e2e/workspace-paths.spec.ts -g "<title>"` |
| Install the E2E browser once | `pnpm exec playwright install chromium` |
| Lint, typecheck, unit and E2E in sequence | `pnpm verify` |
| Docker dev environment (optional) | `docker compose -f compose.dev.yaml up --build --watch` |

AI features are optional and nothing else needs a key. To use them locally, copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`.

E2E specifics:

- Playwright's `webServer` runs `pnpm start` on 127.0.0.1:3000 with `reuseExistingServer: false`, which `tests/unit/playwright-config.test.ts` enforces. It needs a current `pnpm build` and a free port 3000, so stop `pnpm dev` first. `pnpm e2e` builds for you; `pnpm exec playwright test` does not.
- The suite runs with one worker and no parallelism on purpose: the budgets in the stress test (`workspace.spec.ts`, "survives the full entity-limit project": p95 below 12 ms, no main-thread task above 50 ms) are timing measurements. Do not parallelize the suite or loosen those budgets to get a pass.
- CI retries twice, so a green job can hide a first-attempt failure. `docs/testing/ci-diagnostics.md` covers the failure evidence and how to profile locally.
- `playwright.container.config.ts` targets an already running server (`PLAYWRIGHT_BASE_URL`, default http://127.0.0.1:3000) without starting one.

CI (`.github/workflows/ci.yaml`, Ubuntu and Windows; macOS is excluded) also runs these gates, which `pnpm verify` does not:

- `node scripts/verify-source-baseline.mjs` checks git history against the immutable upstream tag and destination initializer. It needs full history, not a shallow clone.
- `node scripts/verify-client-marker-boundary.mjs` builds temporary `.tmp-client-marker-*` fixtures in the repo root with the real Next compiler to prove the patched `client-only` marker still rejects Server Component imports. It is slow.
- `pnpm audit --prod --audit-level=low`
- A Linux production Docker job: `docker compose up -d --build --wait`, then `node scripts/docker-smoke.mjs http://127.0.0.1:3000` and `scripts/docker-runtime-check.mjs` inside the container.

CI sets `AI_ENABLED=false`. Unit tests mock the AI providers.

## Dependencies

`pnpm-workspace.yaml` applies lockfile-hashed patches from `patches/` to `next@16.4.2`, `braces@3.0.3` and `client-only@0.0.1`, and pins security `overrides` (ADR 0006). Patches are keyed to exact versions, so bumping one of those packages requires reworking its patch. Read `docs/maintenance/ARCHITECTURE_DEPENDENCIES.md` first, and after a patch change rerun `verify-client-marker-boundary.mjs` and rebuild the production image.

`.dockerignore` is an allow-list. A new top-level file that the build needs stays out of the image until it is added there.

## Architecture

Imports use `@/` for `src/` (tsconfig paths and the Vitest alias). `AGENTS.md` defines module ownership and `docs/ARCHITECTURE.md` documents the full calculation lifecycle. The data flow that spans many files:

1. **Authoring state.** `src/hooks/useWorkspaceProjects.ts` holds two independent `WorkspaceProject`s, Classic (`classic-2d5d`) and Hybrid (`hybrid-3d`), driven by `projectReducer` in `src/domain/workspace/project-reducer.ts`. The same folder has undo/redo (`history.ts`), the localStorage cache and migration (`persistence.ts`) and the checks run at import and cache boundaries (`spatial-validation.ts`). Acoustic edits increment a revision; presentation-only edits do not.
2. **Projection.** `src/domain/workspace/projections.ts` reduces a project to calculation input. `projectClassicScene` emits `SceneSpec` v1 (`src/domain/scene`), turning primitives into synthetic full-height walls. `projectHybridDocument` emits `SceneDocumentV2` (`src/domain/scene-document`). Both drop disabled entities and expose only the active listener.
3. **Calculation.** Classic: `useAcousticFrame` uses `src/workers/classic-source-pool.ts` (`classic-source.worker.ts`); `computeAcousticFrame` in `src/acoustics/compute-frame.ts` is the serial path. Hybrid: `useHybridDirectPaths` uses `hybrid-direct-pool.ts` (`hybrid-direct.worker.ts`); `computeHybridDirectFrame` in `src/acoustics/hybrid3d/direct.ts` is the serial path. Pools shard by source ID and cache static geometry by fingerprint, and updates coalesce to 10–15 Hz. Any worker failure falls back to the complete serial result.
4. **Output.** Only complete frames are accepted: one for the current revision or, during continuous edits, a pose-lagging frame whose scene differs from the current one only in listener or source pose (ADR 0008, `src/acoustics/frame-acceptance.ts`). Accepted frames drive the viewport overlays and, through `useAudioEngine`, the single persistent `AudioEngine` in `src/audio`.

Easy-to-miss facts:

- All routes (`/`, `/classic`, `/lab`) render `src/components/workspace/UnifiedWorkspace.tsx` and differ only in initial mode.
- Directory names look legacy but are live: `src/components/workbench/SceneEditor.tsx` is the Classic canvas inside `ClassicViewportAdapter`, and `src/components/lab` holds the Hybrid viewport inside `HybridViewportAdapter`.
- `src/workers/acoustics.worker.ts` is never spawned despite its name. The pools start only `classic-source.worker.ts` and `hybrid-direct.worker.ts`; live code imports its protocol exports.
- `src/acoustics/runtime/engine-router.ts` and its feature flags are imported only by tests. The workspace selects the Classic and Hybrid adapters directly.
- The data-only P5/P6/P7 helpers are `receiver-connection*`, `six-band-materials`, `atmosphere` and `directional-late-field` in `src/acoustics/hybrid3d`. Nothing in the audible runtime imports them.
- `src/ai` spans both sides of the server boundary, and only import convention separates them; there is no `server-only` guard. Browser code imports only `client.ts` (the fetch wrapper for the routes) and `contracts.ts`, plus `hybrid-scene.ts` and `content-policy.ts` through `client.ts`. `provider.ts` reads keys from the server environment. It, `scene-compiler.ts`, `acoustic-explainer.ts`, `rate-limit.ts` and `request-security.ts` are reached only from `src/app/api/scene/{compile,explain}/route.ts`, and should stay that way.
- `tests/unit/portal-walkthrough-fixture.test.ts` reads `docs/tutorials/fixtures`, so editing those files can fail unit tests.

## Reference docs

`docs/README.md` indexes the maintained docs. Beyond those `AGENTS.md` names:

- `docs/adr/`: recorded decisions. New ones start from `template.md`.
- `docs/deployment/docker.md`: native-versus-Docker workflows and runtime configuration.
- `docs/testing/browser-listening.md`: manual checks that automation cannot cover (real output, HRTF, device lifecycle).
- `docs/maintenance/README.md`: index of maintenance evidence. Reports are dated records that keep their original failures, so check the later follow-ups (`VERIFICATION_FIXES.md`, `CI_REMEDIATION.md`) before citing a result as current.
