# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project rules

The reviewed maintainer rules in `AGENTS.md` apply in full. They are imported here rather than copied, so there is one source of truth:

@AGENTS.md

`AGENTS.md` is versioned governance (ADR 0004): `next.config.ts` sets `agentRules: false` so Next.js never appends to it. Change it only deliberately.

## Commands

The toolchain is pinned: Node 22.23.3 (`.nvmrc`) and pnpm 11.7.0 (`packageManager`). Install with `pnpm install --frozen-lockfile`.

| Task | Command |
| --- | --- |
| Dev server on http://localhost:3000 | `pnpm dev` |
| Lint (zero warnings allowed) | `pnpm lint` |
| Type-check | `pnpm typecheck` |
| Unit tests (Vitest, `tests/unit/**/*.test.{ts,tsx}`) | `pnpm test` |
| One unit test file | `pnpm test tests/unit/occlusion.test.ts` |
| Unit tests by name | `pnpm test tests/unit/portal.test.ts -t "<test name>"` |
| Production build | `pnpm build` |
| Full E2E (builds first, then Playwright Chromium) | `pnpm e2e` |
| One E2E spec, after `pnpm build` | `pnpm exec playwright test tests/e2e/workspace-paths.spec.ts -g "<title>"` |
| Install the E2E browser once | `pnpm exec playwright install chromium` |
| Lint, typecheck, unit and E2E in sequence | `pnpm verify` |

E2E specifics:

- Playwright's `webServer` runs `pnpm start` on 127.0.0.1:3000 with `reuseExistingServer: false`. It needs a current `pnpm build` and a free port 3000, so stop `pnpm dev` first.
- The suite runs with one worker and no parallelism on purpose: the 100-wall stress and interaction budgets are timing measurements. Do not parallelize it or loosen those budgets to get a pass.
- `playwright.container.config.ts` targets an already running server (`PLAYWRIGHT_BASE_URL`, default http://127.0.0.1:3000) without starting one.

CI (`.github/workflows/ci.yaml`, Ubuntu and Windows) also runs these gates, which the package scripts do not:

- `node scripts/verify-source-baseline.mjs` checks git history against the immutable upstream tag and destination initializer. It needs full history, not a shallow clone.
- `node scripts/verify-client-marker-boundary.mjs` builds temporary fixtures with the real Next compiler to prove the patched `client-only` marker still rejects Server Component imports. It is slow.
- `pnpm audit --prod --audit-level=low`
- A Linux production Docker smoke: `docker compose up -d --build --wait`, then `node scripts/docker-smoke.mjs http://127.0.0.1:3000`.

CI sets `AI_ENABLED=false`. Unit tests mock the AI providers and never need keys.

## Dependencies

`pnpm-workspace.yaml` applies lockfile-hashed patches from `patches/` to `next@16.3.8`, `braces@3.0.3` and `client-only@0.0.1`, and pins security `overrides` (ADR 0006). Bumping any of those packages orphans its patch. Read `docs/maintenance/ARCHITECTURE_DEPENDENCIES.md` first, and keep Node/pnpm versions identical across `package.json`, `.nvmrc`, `Dockerfile`, CI and docs.

## Architecture

Imports use `@/` for `src/` (tsconfig paths and the Vitest alias). AGENTS.md defines module ownership; `docs/ARCHITECTURE.md` documents the full calculation lifecycle. The data flow that spans many files:

1. **Authoring state.** `src/hooks/useWorkspaceProjects.ts` holds two independent `WorkspaceProject`s, Classic (`classic-2d5d`) and Hybrid (`hybrid-3d`), driven by `projectReducer` in `src/domain/workspace/project-reducer.ts`. Undo/redo lives in `history.ts` and localStorage caching and migration in `persistence.ts` (same folder). Acoustic edits increment a revision; presentation-only edits do not.
2. **Projection.** `src/domain/workspace/projections.ts` reduces a project to calculation input. `projectClassicScene` emits `SceneSpec` v1 (`src/domain/scene`), turning primitives into synthetic full-height walls. `projectHybridDocument` emits `SceneDocumentV2` (`src/domain/scene-document`). Both drop disabled entities and expose only the active listener.
3. **Calculation.** Classic: `useAcousticFrame` uses `src/workers/classic-source-pool.ts` (`classic-source.worker.ts`); `computeAcousticFrame` in `src/acoustics/compute-frame.ts` is the serial path. Hybrid: `useHybridDirectPaths` uses `hybrid-direct-pool.ts` (`hybrid-direct.worker.ts`); `computeHybridDirectFrame` in `src/acoustics/hybrid3d/direct.ts` is the serial path. Pools shard by source ID and cache static geometry by fingerprint. The hooks coalesce updates to 10–15 Hz. Any worker failure falls back to the complete serial result.
4. **Output.** Only a complete frame matching the current revision is accepted. It drives the viewport overlays and, through `useAudioEngine`, the single persistent `AudioEngine` in `src/audio`.

Easy-to-miss facts:

- All routes (`/`, `/classic`, `/lab`) render `src/components/workspace/UnifiedWorkspace.tsx` and differ only in initial mode.
- `src/components/workbench/EchoWorkbench.tsx` is the unreferenced source-baseline shell. Other `workbench` files are still live, though: `workbench/SceneEditor.tsx` is the Classic canvas inside `ClassicViewportAdapter`, and `src/domain/editor` types are still imported.
- `src/acoustics/runtime/engine-router.ts` and its feature flags are a compatibility foundation, not the mode switch. The workspace selects the Classic/Hybrid adapters directly.
- The P5/P6/P7 research helpers under `src/acoustics/hybrid3d` (`receiver-connection*`, `six-band-materials`, `atmosphere`, `directional-late-field`) are tested data, not audible runtime.
- `src/ai` spans both sides, and only import convention separates them; there is no `server-only` guard. Browser code imports only `client.ts` (the fetch wrapper for the routes) and the shared `contracts.ts`, `hybrid-scene.ts` and `content-policy.ts`. `provider.ts` reads keys from the server environment. It, `scene-compiler.ts`, `acoustic-explainer.ts`, `rate-limit.ts` and `request-security.ts` are imported only by `src/app/api/scene/{compile,explain}/route.ts`, and should stay that way. `/api/health` reports liveness only.

## Reference docs

- `docs/ACOUSTICS.md`: formulas, units, tolerances and approximation boundaries.
- `docs/API_CONTRACTS.md`: AI route request and response contracts.
- `docs/adr/`: recorded decisions. New ones start from `template.md`.
- `docs/deployment/docker.md`: native-versus-Docker workflows and runtime configuration.
- `docs/testing/browser-listening.md`: manual checks that automation cannot cover (real output, HRTF, device lifecycle).
