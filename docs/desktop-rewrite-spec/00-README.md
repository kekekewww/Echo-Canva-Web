# Echo Canvas Desktop — specification pack

This pack specifies a native desktop rebuild of **Echo Canvas Web**, an interactive acoustic simulation and listening workbench. You draw a room as a 2.5D plan or a 3D scene, place sound sources and a listener, and the app calculates direct, blocked, Portal (opening) and reflected sound paths, draws them, and plays what the listener would hear.

It is written for an implementing agent working in a **new, empty repository with no access to the web app's code**, and for the owner who reviews that work. Everything needed to rebuild the app is here, plus a few fixture files the owner copies over (`10-build-plan.md` §5).

- Generated from the web repository at commit `46c61c5` (2026-11-16).
- The golden corpus at that commit verified clean: `corpus ok: 86 cases, manifest sha256 4b4bf901d2fadd8bf8266482739a30bd3b19de6dd1cd047fd80f59c0ee3e1fb6`.
- Companion artifact: "Echo Canvas Desktop Blueprint" (overview, architecture diagrams, interactive UI mockups, build plan, handoff prompt).

## Reading order

| File | Read when | What it gives you |
| --- | --- | --- |
| `00-README.md` | First | This page: how the pack works, glossary, owner decisions |
| `08-target-architecture.md` | First | What to build: stack, threads, crates, IPC, audio design, files, security, budgets |
| `10-build-plan.md` | First | Milestones M0–M10, gates, parity rules, JS behaviors to copy, files to copy |
| `01-domain-model.md` | M1 | Coordinates, entities, limits, IDs, SceneSpec v1, SceneDocumentV2, materials, presets, reducers, history, cache migration, import/export, projections, hashes |
| `02-acoustics-classic.md` | M2 | The 2.5D model, exact enough to reproduce every corpus number |
| `03-acoustics-hybrid.md` | M3 | The 3D model: patches, BVH, direct path, reflections, audible routing, taps, static hash |
| `05-runtime-pipeline.md` | M4 | Coalescing, pools, messages, validation, caching, fallback, frame acceptance |
| `06-frontend-ui.md` | M5 | Every function, control, shortcut and message of the current UI, plus 34 UX problems |
| `09-ux-redesign.md` | M5, M7 | The new layout, behavior, tokens and UX acceptance list |
| `04-audio.md` | M6 | The audio graph node by node, parameter mapping, smoothing, assets, Web Audio semantics to reproduce natively |
| `07-backend-ai-infra-tests.md` | M0, M9, and for tests | AI contracts and rules, test inventory (what to port), golden corpus format, licensing |
| `AGENTS.template.md` | M0 | Copy to `AGENTS.md`: the rules for the new repository |

## How sections 01–07 are written

- They describe what the **web code actually does**, not what its documentation claims. Where the web docs and code disagree, the section says so.
- **`Source:` lines** name files in the web repository. They are there for traceability. You will not have those files, and you don't need them.
- **`UNVERIFIED:`** marks the few things the authors could not determine (20 across all sections). Treat them as open questions: choose the conservative behavior and record the choice in `docs/evidence/`.
- Each section ends with **Review findings** (defects found in the web app, verified or suspected) and **Rewrite notes** (what must be preserved vs what was web-only).
- Sections 02 and 03 were checked against the corpus. The authors re-implemented the Classic model from the text of section 02 alone, and that copy matched all 27 Classic frame cases bit for bit.

## What to do with review findings

| Finding concerns | In version 1 |
| --- | --- |
| Acoustic numbers (formulas, routing, reflections, RT60, taps, hashes that are persisted) | **Keep the behavior** so corpus parity holds. List each one in `docs/evidence/known-differences.md` with its section reference. Fixing them is a later, separate change with new expected outputs, approved by the owner |
| Runtime, UI, storage, undo, audio lifecycle, security, AI contracts | **Fix it** and add a test that would have caught it. Note the fix in the milestone evidence |
| Web-only infrastructure (Next.js routes, Docker, CI, rate limiting by HTTP header) | Not ported |

## Precedence when things disagree

1. The corpus (`fixtures/corpus/v1`), for acoustic numbers.
2. Sections 01–07, for behavior and formats.
3. Sections 08–10, for design and order of work. Section 09 overrides section 06 for layout and interaction, but every function listed in 06 must still exist.
4. ADRs written in the new repository after this pack.

Record every disagreement you find in `docs/evidence/`.

## Owner decisions needed

The implementing agent must ask before acting on these:

| # | Decision | Recommendation |
| --- | --- | --- |
| D1 | License of the new repository | MIT, matching the web app. The copied fixtures and assets are MIT or carry their own license files |
| D2 | Does the assistant (AI) ship in version 1? | Optional milestone M9. Decide before M9 |
| D3 | HRTF dataset for headphone rendering | Choose one whose license allows redistribution in a binary. Until then, the HRTF option stays hidden |
| D4 | Release platforms and code signing | Windows and macOS signed. Linux as an unsigned AppImage/deb if wanted |
| D5 | Shape footprints and the 100-wall limit: the web docs say shape footprints count toward it; the code does not (up to 196 projected walls) | Keep the code's behavior so every existing web file still opens. Show the budget in the UI (section 09) |
| D6 | Update rate: the web docs say 5–20 Hz requested and clamped to 10–15; the code accepts only integers 10–15 | Keep the code's behavior |
| D7 | When to fix the acoustic defects kept for parity (section 02, 03 and 04 findings) | After version 1, one at a time, each with new expected outputs |

## Glossary

| Term | Meaning |
| --- | --- |
| Classic, 2.5D, `classic-2d5d` | The plan-view model: walls are full-height line segments; uses `SceneSpec` v1. UI name in the desktop app: "2.5D Plan" |
| Hybrid, 3D, `hybrid-3d` | The 3D model: finite patches, BVH, height; uses `SceneDocumentV2`. UI name: "3D Spatial" |
| `WorkspaceProject` | The authoring state for one mode. There are always two, independent of each other |
| `SceneSpec` v1, `SceneDocumentV2` | The calculation input formats produced by projection from a project |
| Revision | Counter bumped by acoustic edits. Undo/redo can restore an older value, so it is not a content identity |
| Projection | Pure reduction of a project to calculation input: drops disabled entities, keeps only the active listener |
| Frame | One complete calculation result for all sources at one revision: `AcousticFrame` (Classic) or `HybridDirectFrame` plus audible state (Hybrid) |
| Pose-lagging frame | A frame computed for an earlier pose of the listener or a source, accepted during continuous drags under the rule in section 05 (web ADR 0008) |
| Static geometry, fingerprint | The part of a scene that does not change while dragging, cached by a 32-bit FNV-1a hash |
| Shard | The calculation for one source, run on a worker |
| Portal | An opening in a wall (door, window) that sound can pass through. Has width, height and loss |
| Primitive, shape | Box, cylinder or sphere obstacle. Classic turns its footprint into synthetic walls |
| Patch | A finite planar polygon in the 3D model |
| Tap | One of six shared early-reflection slots in the audio engine |
| Simulated / Raw | Web names for listening to the calculated room vs the unprocessed source. Desktop names: Room / Dry |
| P5 / P6 / P7 helpers | Data-only research code (receiver connection, six-band materials, atmosphere, directional late field). Not used for audio |
| Corpus | The 86 frozen input/output cases with comparison rules, produced by the web code |

## Units and conventions (summary)

Meters, seconds, milliseconds for delays, degrees in the UI (radians where section 02/03 says so), dB for gain and loss, Hz for cutoff. Speed of sound 343 m/s. All acoustic math in IEEE-754 `f64`. Plan coordinates `{x, y}` map to 3D `{x, y: height, z: plan y}`; section 01 §1 gives the exact mapping and floor elevation rules.

## What this pack does not cover

- Real-device audio behavior, listening tests and HRTF perception. Those need people and hardware (section 04 lists the manual checks).
- Windows and macOS WebView behavior. Nothing here was run in a packaged desktop app.
- Performance numbers for the Rust version. Section 08 §11 sets targets; M10 measures them.
