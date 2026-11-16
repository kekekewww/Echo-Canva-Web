# Echo Canvas Desktop — Agent and Maintainer Rules

Copy this file to `AGENTS.md` at the repository root. It applies to every change in this repository.

## Purpose and sources of truth

This repository rebuilds Echo Canvas (an interactive acoustic simulation and listening workbench, originally a Next.js web app) as a native desktop application in Rust. The web app's code is not available here. These are the sources of truth, in order of precedence:

1. `fixtures/corpus/v1`: golden acoustic inputs and outputs produced by the web app, with frozen comparison rules. For acoustic numbers this wins over everything else.
2. `docs/spec/01`–`07`: what the web app does (behavior, formats, limits, contracts).
3. `docs/spec/08`–`10`: what to build here and in what order.
4. ADRs in `docs/adr/`: decisions made after the spec.

If two sources disagree, follow the higher one and record the disagreement in `docs/evidence/`.

## Stack

Tauri 2, Rust (pinned in `rust-toolchain.toml`), React + strict TypeScript + Vite for the UI, pnpm (pinned in `packageManager`), native audio through `cpal`. Changing any part of the stack needs an ADR in `docs/adr/` approved by the owner.

## Ownership and boundaries

- `crates/ec-acoustics`: pure `f64` geometry and acoustics. No I/O, threads, clocks, randomness, logging, Tauri, audio or UI dependencies.
- `crates/ec-domain`: scene types, limits, materials, presets, validation, reducer, history, projections, file formats and migrations.
- `crates/ec-runtime`: scheduling, coalescing, static caches, sharding, frame acceptance, serial fallback.
- `crates/ec-audio`: native DSP graph and device I/O. `crates/ec-assets`: audio files and the library.
- `crates/ec-ai`: optional assistant. `crates/ec-parity`: the corpus runner.
- `apps/desktop/src-tauri`: commands, events, menus, dialogs, capabilities.
- `apps/desktop/ui`: rendering and user input only. It holds no authoritative state, no acoustics, no file access.
- Never import against the dependency direction in `docs/spec/08-target-architecture.md` §4.
- TypeScript types for IPC are generated from Rust. Never hand-edit `bindings.ts`.

## Acoustic correctness

- Port formulas, constants, coefficients, limits, candidate caps, iteration order, ranking and tie-breakers exactly as `docs/spec/02` and `03` describe. Use `f64`. No fast-math, no reordering of floating-point operations, no `f32`.
- Reproduce the JavaScript behaviors listed in `docs/spec/10-build-plan.md` §4 (`localeCompare`, `JSON.stringify` order, number printing, UTF-16 hashing, stable sort).
- Never edit a fixture, a tolerance or an expected output to make a test pass. A failing case means the port is wrong until shown otherwise.
- Do not "fix" acoustic behavior during the port. If you find a defect that changes numbers, keep the behavior, add it to `docs/evidence/known-differences.md`, and raise it with the owner.
- State units and coordinate conventions in code docs. Meters, seconds, milliseconds, degrees, dB, Hz; speed of sound 343 m/s unless the spec says otherwise.
- Do not claim true diffraction, certified architectural-acoustics accuracy, or a named HRTF dataset unless it is actually implemented and bundled.
- Scene limits: 100 walls, 8 Portals, 4 sources, 8 listeners with exactly one active, 8 primitives, 50 m maximum planar room dimension, 0.1 m minimum wall length. Follow the exact rules in `docs/spec/01`, which notes where the web app's documentation and code disagree (update rate: the code accepts only integers 10–15 Hz; primitive footprints are not counted toward the 100-wall budget in code). Where `docs/spec/00-README.md` lists an owner decision for one of these, wait for it.
- The P5/P6/P7 helpers (receiver connection, six-band materials, atmosphere, directional late field) stay data-only. Never wire them into audio without an approved ADR.

## Runtime and audio

- Publish only complete frames that pass the acceptance rule (`docs/spec/05`). Discard partial, stale or invalid results.
- On panic, timeout or non-finite output, recompute the whole frame serially, publish that, and recover to the pool later. Never leave the app in permanent fallback without retrying.
- Use a monotonic generation counter, not the revision alone, to identify scene content (undo/redo reuses revisions).
- Audio callback: no allocation, no locks, no I/O, no logging, no panics. Parameters arrive through a triple buffer; structural changes through bounded SPSC queues.
- One persistent audio engine for the app's lifetime, started only by a user action. Smooth every parameter change; never rebuild the graph per frame.
- Overlays and audio use the same accepted frame.

## Security and privacy

- Treat every IPC payload as untrusted: strict types, bounded sizes, IDs checked against the current project, finite numbers in range.
- The UI gets no file system, shell, process or HTTP permissions. Rust shows every file dialog. The UI never sends a file path.
- Strict CSP. No remote content in the WebView.
- The app makes no network requests unless the user turns on the assistant. The API key lives in the OS keychain only.
- AI output is validated with the same rules as files, repaired at most once, previewed, and applied only after the user confirms. It never sets audio parameters directly and never invents asset or registry IDs.
- Projects store audio references and hashes, never audio bytes.

## Development and verification

Run before every push:

```sh
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo run -p ec-parity -- run --all
pnpm -C apps/desktop/ui lint
pnpm -C apps/desktop/ui typecheck
pnpm -C apps/desktop/ui test
```

- Work milestone by milestone (`docs/spec/10-build-plan.md`). Record each gate in `docs/evidence/M<n>.md`: commands, results, OS, hardware for timing, commit.
- Report what actually happened. Never claim a check passed that you did not run. Never hide or loosen a failed budget; record the numbers.
- Keep numerical tests, offline audio renders, real-device playback and listening checks separate in evidence.
- Port each web unit test that `docs/spec/07` marks "port" in the same milestone as the code it covers.

## Git and change discipline

- Small commits with Conventional Commit subjects (`feat(acoustics): …`, `fix(runtime): …`, `test(parity): …`).
- Never rewrite published history. Never force-push a shared branch.
- Ask the owner before: choosing or changing the license, bundling an HRTF dataset or any third-party audio, adding a dependency with a non-permissive license, changing a performance budget, publishing a release, or enabling network features by default.
- Keep `LICENSE`, `THIRD_PARTY_NOTICES.md` and every asset license file next to what it covers.
