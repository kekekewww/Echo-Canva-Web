# 10 — Build plan, parity strategy and acceptance gates

This is the order of work for the new repository. Each milestone ends with a gate. Do not start a milestone until the previous gate passes, except where "can run in parallel" says otherwise. Record the evidence for each gate (commands run, results, OS, commit) in `docs/evidence/M<n>.md`.

## 1. Milestones at a glance

| # | Milestone | Main output | Depends on | Can run in parallel with |
| --- | --- | --- | --- | --- |
| M0 | Bootstrap | Workspace, toolchains, CI, empty Tauri window, fixtures copied | — | — |
| M1 | Domain | `ec-domain`: schemas, validation, reducer, history, projection, file formats | M0 | M5a (UI design system on mock data) |
| M2 | Classic acoustics | `ec-acoustics::classic`, parity with all Classic corpus cases | M1 (types) | M3 |
| M3 | Hybrid acoustics | `ec-acoustics::hybrid3d`, parity with all Hybrid corpus cases | M1 (types) | M2 |
| M4 | Runtime | `ec-runtime`: scheduler, cache, acceptance, fallback | M2, M3 | M5a |
| M5 | Desktop workspace | Tauri commands/events, layout, outliner, inspector, plan view, files, undo | M1, M4 | — |
| M6 | Audio v1 | `ec-audio` + `ec-assets` (built-ins): native engine, Room/Dry, equal-power, meters, devices | M4 | M7 (3D view part) |
| M7 | 3D view, analysis, HRTF | three.js view, analysis dock, HRTF (license-gated) | M5, M6 | — |
| M8 | User audio library and relink | Import, library, relink, collect files | M6 | M9 |
| M9 | AI (optional) | Key management, compile with preview, explain | M5 | M8 |
| M10 | Release hardening | Accessibility, performance on reference hardware, packaging, signing, updater, docs | all | — |

## 2. Milestone details

### M0 — Bootstrap

Deliverables:
- Repository layout from section 08 §4, `rust-toolchain.toml`, `.nvmrc`, `packageManager`, lockfiles committed.
- `.gitattributes` marks `fixtures/**` as `-text` and `*.wav` as `binary`. The corpus is checked by SHA-256, so a CRLF conversion on Windows would fail every case.
- `AGENTS.md` from `AGENTS.template.md` in this spec pack.
- Fixtures copied (§5 below): `fixtures/corpus/v1`, `fixtures/web-exports`, `assets/audio` with licenses, `LICENSE`, `THIRD_PARTY_NOTICES.md`.
- CI on Windows, macOS and Linux: `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, Tauri build (no signing).
- An empty Tauri window that shows the app version from the `app_info` command through generated bindings.

Gate: CI green on all three OSes. `cargo run -p ec-parity -- verify` checks the corpus file hashes against the manifest.

### M1 — Domain (`ec-domain`)

Build, in this order, from section 01:
1. Units, coordinate types, ID types and the limits table as constants in one module (`limits.rs`).
2. Materials registry (every ID and coefficient) and its invariant checks.
3. SceneSpec v1 and SceneDocumentV2 types with serde, plus their validators (same rules, same error codes and messages).
4. `WorkspaceProject` (Classic and Hybrid), revision counter, acoustic vs presentation-only edits.
5. Reducer: every action in section 01's table, as a Rust `enum ProjectAction`. Rejected actions return errors and change nothing.
6. History (undo/redo), with the same depth and grouping rules, plus gestures (section 08 §6.3).
7. Spatial validation and geometry constraints.
8. Projections: `project_classic_scene`, `project_hybrid_document`, `classic_projection_hash` (JS-compatible canonical JSON; see §4).
9. File formats: web transfer import/export (all versions, the migration chain), `.echocanvas` read/write, and the browser-cache migration if section 01 describes one that a web export can contain.
10. Presets.

Gate:
- Every reducer action, validation rule and limit has a unit test, including the boundary values (for example 100 walls accepted, 101 rejected; 0.1 m wall accepted, 0.0999 m rejected).
- Every file in `fixtures/web-exports` imports, and export → import round-trips to an equal project.
- `classic_projection_hash` matches the value the web app produced for each fixture (the web values are recorded in the corpus or in section 01).

### M2 — Classic acoustics (`ec-acoustics::classic`)

Port order (section 02): geometry primitives → direct path and occlusion → image-source first order → bounded second order → Portal graph → room acoustics (Eyring, three bands) → six-tap selection → frame assembly → static context and fingerprint.

Gate: `cargo run -p ec-parity -- run --mode classic` passes every Classic corpus case under the frozen comparison rules. The web unit tests listed for Classic in section 07 are ported and pass.

### M3 — Hybrid acoustics (`ec-acoustics::hybrid3d`)

Port order (section 03): vector/AABB/patch geometry → compile to finite patches (including primitives) → BVH build and traversal → direct path → first-order reflections → bounded second order → audible Portal routing → reflection tap projection → static geometry hash.

Gate: every Hybrid corpus case passes. Ported Hybrid unit tests pass. P5/P6/P7 helpers are either ported as data-only modules with their tests, or listed as "not ported" in `docs/evidence/M3.md`.

### M4 — Runtime (`ec-runtime`)

Build from section 05: per-mode coalescer (10–15 Hz), latest-pending/one-in-flight, deterministic sharding by source ID, static cache keyed by fingerprint, shard validation, frame assembly, the acceptance rule including pose-lagging frames, watchdog, serial fallback, Hybrid post-processing (audible Portal routing and tap projection, which run on the main thread in the web app).

Gate:
- Tests with a fake clock for: coalescing during a continuous drag, newer job replacing pending, stale frame rejected, pose-lagging frame accepted only under the exact rule, shard panic → serial fallback, shard timeout → serial fallback, non-finite output → serial fallback, recovery to the pool afterwards.
- A bench on the full-limit scene records compute time (section 08 §11).
- A runtime-produced frame equals the serial frame for every corpus case.

### M5 — Desktop workspace

Split into M5a (can start after M0, on a mock backend) and M5b (wired to Rust).
- M5a: design tokens and components from section 09, app shell, layout and docking, outliner, inspector with every field from section 06, plan view drawing and editing, command palette, menus, all on a mock IPC backend generated from the bindings.
- M5b: real commands and events, gestures, undo/redo, file open/save/autosave/recent, web JSON import/export, preferences, Diagnostics panel.

Gate:
- Every function in section 06's inventory is reachable in the new UI (check off the list in `docs/evidence/M5.md`).
- `tauri-driver` e2e on Windows and Linux: create from preset → add wall, source, listener, portal → move by drag and by keyboard → undo/redo → save → close → reopen → identical project.
- The section 09 UX acceptance items for these features pass.
- No UI main-thread task over 50 ms while dragging in the full-limit scene.

### M6 — Audio v1

Build from section 04 and section 08 §7: device output, decoding, built-in loops, per-source chain, six-tap early reflection bank, reverb, Room/Dry crossfade, equal-power panner with the same distance model and listener orientation, parameter mapping and smoothing, start/stop/retry, per-source mute/solo, master gain, meters, device selection.

Gate:
- Offline-render tests: for a set of corpus frames, render 1 s and check per-source gain, delay and filter cutoff against the section 04 formulas within stated tolerances. Check crossfade duration, no NaN, no denormals, and no allocation on the audio thread.
- Underrun budget from section 08 §11 on one machine per OS.
- Manual listening checklist (section 04) signed off by a person.

### M7 — 3D view, analysis and HRTF

- three.js spatial view: camera presets (Top, Front, Home, Frame all), orbit, ceiling toggle, path overlays with line styles, labels that do not overlap, arrival-direction readout.
- Analysis dock: per-source results table, echogram (direct + six taps), RT60 per band, hover-to-highlight paths.
- HRTF via SOFA (section 08 §7.5), only after the dataset license is recorded.

Gate: section 09 acceptance items for these screens. If HRTF ships: listening checklist with headphones, and the license recorded.

### M8 — User audio library and relink

Import files (formats `symphonia` supports: at least WAV, FLAC, MP3, OGG/Vorbis, AAC/M4A where licensed), library list, metadata, removal, missing-file relink dialog, "Collect files into project folder".

Gate: import → assign to source → save → move the file → reopen → relink prompt → relinked; content hash mismatch is reported.

### M9 — AI (optional)

From section 07: key stored in the keychain, `ai_compile` with the same schema, content policy and single repair; the result is shown as a preview (section 09) and applied only on confirmation; `ai_explain` on the current accepted snapshot. Tests use a mock provider; CI never has a live key.

Gate: contract tests for valid output, invalid output repaired once, invalid output after repair rejected, content-policy rejection, network failure, timeout, missing key.

### M10 — Release hardening

Accessibility audit (keyboard-only pass through every flow, screen reader labels, contrast in both themes, reduced motion), performance budgets measured on named reference machines, crash-recovery test (kill during edit → reopen → recovery offered), packaging and signing per OS, updater with signed manifests, user docs.

Gate: every budget in section 08 §11 measured and recorded (pass or fail, with numbers). Every M-gate still green.

## 3. Parity rules for the acoustic port

1. **The corpus is the oracle.** It was produced by the web code. If this spec and the corpus disagree, the corpus wins, and you record the disagreement in `docs/evidence/`.
2. **Port, don't improve.** Keep formulas, constants, clamps, candidate limits, iteration order, ranking and tie-breakers. Do not "fix" an apparent bug during the port. List it, keep the behavior, and change it later in a separate, recorded decision with new expected outputs.
3. **Use `f64` everywhere** in acoustics. No `f32`, no fast-math, no explicit FMA, and do not reorder floating-point operations for speed.
4. **Fix the port, never the fixture.** A failing case means the port is wrong until shown otherwise.
5. **Port tests together with the code.** Each web unit test in section 07 marked "port" becomes a Rust test in the same milestone.

## 4. JavaScript semantics that need special care

| JS behavior | Where it matters | Rust approach |
| --- | --- | --- |
| `String.prototype.localeCompare` (ICU collation, default locale) | Tie-breakers in sorting (sections 02 and 03 list every call site) | Use ICU4X (`icu_collator`) with the root locale and default (tertiary) strength. Add a parity test that runs Node in CI to sort a generated list of IDs (mixed case, digits, `-`, `_`, Unicode) with `Intl.Collator().compare` and compares the order with the Rust collator. Never use byte order (`str::cmp`) where the web used `localeCompare` |
| `JSON.stringify` key order = insertion order | Classic static fingerprint and `classicProjectionHash` input | `serde_json` with the `preserve_order` feature, and struct field order identical to the web object construction order (sections 01–02 give it) |
| JS number to string | Same hashes | `ryu-js` crate (formats `f64` like `Number.prototype.toString`), including `-0` → `"0"` and integers without `.0` |
| String iteration by UTF-16 code unit | FNV-1a over strings | Hash over `str::encode_utf16()`, not bytes or chars |
| `Math.hypot`, `Math.atan2`, `Math.log10`, `Math.exp` | Distances, angles, dB, Eyring | Use Rust's `f64` methods. Expect last-bit differences from V8; the corpus comparison rules have the tolerances. Never compare these fields exactly unless the rules say so |
| `NaN`, `Infinity`, `-0` in JSON | Validation and output | JSON has no NaN/Infinity; validators reject non-finite input. Normalize `-0` exactly where the web code does (sections 02–03) |
| `Array.prototype.sort` is stable | Every sort | Use `sort_by` (stable), never `sort_unstable_by`, where the web used `sort` |

## 5. What to copy from the web repository

The user must copy these into the new repository at M0. Keep each license and attribution file next to what it covers.

| From (web repo) | To (new repo) | Why | License note |
| --- | --- | --- | --- |
| This spec folder | `docs/spec/` | The instructions | Same owner |
| `benchmarks/corpus/v1/` and `benchmarks/corpus/README.md` | `fixtures/corpus/v1/` and `fixtures/corpus/README.md` | Golden parity fixtures | MIT, keep `LICENSE` attribution |
| `docs/tutorials/fixtures/` | `fixtures/web-exports/` | Real web exports for import tests | MIT |
| `public/audio/*` including `LICENSE.md` | `assets/audio/` | Built-in loops | See that `LICENSE.md` (section 04) |
| `schemas/scene-spec.schema.json` | `fixtures/schemas/` | Reference JSON Schema for SceneSpec v1 | MIT |
| `LICENSE` | `LICENSE` (or keep its notice in `THIRD_PARTY_NOTICES.md` if the new repo uses another license) | MIT requires the notice to stay with copied material | — |

Nothing else needs to be copied. Do not copy Next.js, Docker, patches or web CI files.

## 6. Definition of done for version 1

- All gates M0–M10 green, with evidence files.
- Every function listed in section 06 exists in the desktop UI, or is listed as intentionally removed with a reason.
- Corpus parity: 100 % of cases pass.
- The web app can open a file the desktop app exported, and the desktop app can open every web export.
- Budgets measured on reference hardware, results recorded, misses listed.
- Packages for Windows, macOS and Linux built in CI. Signing and notarization done if releasing publicly.
