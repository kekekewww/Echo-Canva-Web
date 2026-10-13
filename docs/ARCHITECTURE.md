# Architecture

Echo Canvas Web retains the source baseline's Next.js/React/TypeScript architecture. This document describes the live workbench and distinguishes experimental foundations. See [ORIGIN.md](ORIGIN.md) and [ADRs](adr/README.md).

## Runtime boundaries

```text
Browser: UnifiedWorkspace
  WorkspaceProject (independent per mode)
    Classic projection → source Worker pool → accepted AcousticFrame
    Hybrid document → patches/BVH → Hybrid source Worker pool
  complete accepted frame → overlays + persistent Web Audio graph
  localStorage projects/history + IndexedDB local audio

Optional server: bounded prompt/snapshot → validated AI provider control plane
Docker or Vercel runs Next.js server/API routes; sound runs in the browser
```

No database, account service, message queue, host sound device, desktop runtime, or audio-upload service is required. Health confirms server liveness, not acoustic or sound-output correctness.

## Modules

| Path | Responsibility | Boundary |
| --- | --- | --- |
| `src/app` | Pages and server API/health routes | No server audio runtime |
| `src/components` | Editor, viewports, Inspector, Outliner, overlays, transport | Display accepted calculation results |
| `src/domain` | Models, schemas, invariants, registries, serialization, persistence | Core models avoid React/Web Audio/provider dependencies |
| `src/acoustics` | Pure geometry, propagation, room estimates, Hybrid patches/BVH | Independently testable deterministic functions |
| `src/audio` | AudioEngine, source graphs, taps, Schroeder reverb, smoothing | Browser AudioContext after user gesture |
| `src/workers` | Sharded workers, pools, install/pose protocol, validation/fallback | Complete valid frames only |
| `src/ai` | Optional compiler/explainer/provider and policy | Untrusted output never drives sound/acoustics directly |
| `src/hooks` | Project, pool, audio and React lifecycles | Coordinates calculation rather than defines formulas |
| `schemas`, `tests`, `src/benchmarks` | Contracts, regressions, benchmark helpers | Evidence limited to tested fixtures/environment |

## Authoring and compatibility

`WorkspaceProject` owns room dimensions/materials, listeners/active receiver, sources, finite wall/Portal records, up to eight primitives, enabled state, local-audio metadata, selection, and presentation. Projectors emit narrower `SceneSpec` or `SceneDocumentV2`, omit disabled geometry/dependent Portals, and expose one active receiver.

Classic converts enabled primitive footprints to synthetic full-height walls. Hybrid retains elevations and finite patches. Box/Cylinder/Sphere are bounded faceted approximations, not arbitrary room meshes. External import, AI, and migration boundaries validate schemas/invariants. Hot internal projection relies on reducer invariants; external validation remains required.

Root, `/classic`, and `/lab` render `UnifiedWorkspace`, with the latter routes selecting initial modes. The live Hybrid adapter uses `useHybridDirectPaths` and its pool directly. Generic `EngineRouter`/default-false extension flags are a separate compatibility foundation, not the workbench mode switch.

## Calculation lifecycle

1. Validated acoustic edits increment revision. Presentation changes do not; active-listener changes do.
2. UI renders authoring state immediately; coordinators coalesce effective calculation updates to 10–15 Hz. Stored schema requests accept 5–20 Hz.
3. Stable source-ID shards use persistent browser Workers. Capacity is `min(4, max(1, floor(hardwareConcurrency) - 2))`; completed-frame active count is `min(sourceCount, capacity)`.
4. Classic calculates direct/occluded/Portal paths and first/bounded second-order reflections per source; room RT60 is frame-level. Hybrid uses finite patches/BVH and validates lifted planar Portal candidates against 3D visibility.
5. Validation checks request/revision, source assignments, fingerprints, compatibility hashes where applicable, bounds, and path semantics. Static installs require exactly one acknowledgement per worker; default job watchdog is 2,000 ms.
6. All valid shards merge atomically in stable source order. Pool failure discards partial results, terminates workers, and publishes complete serial fallback with visible `Fallback` status.
7. Matching accepted frames drive overlays and smoothed audio. Stale results cannot satisfy a current scene/listener revision.

Hybrid workers cache cloned BVHs. Static fingerprints include room/wall/Portal/primitive/material/vertical geometry; poses and presentation do not invalidate them. Pose messages remain compact; static edits reinstall before computation. This is bounded CPU sharding, not GPU acceleration.

## Browser audio

One AudioEngine persists across workspace mode changes. A user gesture creates AudioContext and persistent source graphs. Each source has Raw/Simulated buses, manual distance gain, obstruction filtering, HRTF/equal-power panning, six ranked reflection taps, and a send to Schroeder late reverb. Automation smooths changes; mode transitions crossfade without graph reconstruction.

First/second-order paths share six audible taps. HRTF uses browser `PannerNode`; no CIPIC/MIT/KEMAR/custom dataset is loaded. True diffraction, FDN rendering, and arbitrary binaural dry-source recovery are not implemented.

## Browser persistence

Keys are `echo-canvas:project:classic:v1`, `echo-canvas:project:hybrid:v1`, and `echo-canvas:workspace-ui:v1`. Cache version `3.0` retains at most 50 compact reversible commands per history direction. Saving waits for 2 seconds idle, with immediate mode-switch/`pagehide` flush. Pure legacy migration preserves unread data for recovery/download on failure and opens a safe preset.

Presentation is independent per mode; continuous scrubbing coalesces into one history transaction. JSON includes authoring and relinking metadata, not audio blobs. Missing local assets stay silent until relinked.

Mono local audio uses IndexedDB database `echo-canvas-audio`, store `assets`, with 25 MiB/file and 100 MiB/library limits. Unavailable IndexedDB gives an explicitly memory-only library. Audio never crosses a server route. Stopping a container preserves browser data; clearing browser storage removes it.

## Optional AI server

`POST /api/scene/compile` compiles bounded intent to validated Classic `SceneSpec` or Hybrid `{scene, spatial3d}`. Hybrid maps world X/Z into planar x/y and preserves world Y in ID-bound heights/vertical records. An accepted candidate replaces only the active mode in one history command. Strict registries/object counts and at most one schema/domain repair apply.

`POST /api/scene/explain` returns a grounded structured explanation of a finite projected snapshot. Inputs/output remain untrusted; content policy rejects arbitrary URLs/markup/instructions and unsupported numeric evidence. AI never calculates authoritative paths/RT60 or sets AudioParams.

Manual/presets work without keys. Production calls need `AI_ENABLED=true`; Compose defaults false. Public keyed services need an authenticated TLS gateway and provider quotas. Input/process limits are defensive bounds, not authorization or distributed quotas. See [SECURITY.md](../SECURITY.md).

## Research versus audible runtime

| Source foundation | Implemented data | Audible boundary |
| --- | --- | --- |
| P5 receiver connection | Fibonacci samples, visible connections, accumulator, stationary benchmark | No live late-field control or renderer |
| P6 materials/media | Six-band projection/energy, bounded atmosphere/travel-time helpers | Live three-band/343 m/s; no audible air-loss control |
| P7 late histogram | Direction × delay mid-energy bins | No directional FDN, Ambisonics, multi-band decay or virtual-source allocation |

Historical P6 notes mention a calculation-only Lab preview. The extracted `/lab` now uses the shared workbench; that old preview is absent from live UI. Helpers/tests remain, with original phase records in [the archived 3D extension docs](archive/build-week/docs/3d-extension/P0_BASELINE.md).

## Deployment and evidence

Native and optional Docker development share pinned Node/pnpm/frozen installs. Compose Watch isolates host dependencies. Production is a non-root multi-stage standalone Next.js server with required assets, health, and stop behavior. Vercel remains supported; no static export removes API routes. See [Docker docs](deployment/docker.md) and [maintenance reports](maintenance/README.md) for actual run evidence and unverified platforms.

Pure tests cover deterministic algorithms; pool tests cover hostile/stale/failure/ordering/equivalence; browser tests cover authoring/storage/overlays/responsiveness/offline rendering. Performance thresholds apply to measured environments. Real output, listening, and device interruption need a host browser.

See [acoustics](ACOUSTICS.md), [research](RESEARCH.md), [API contracts](API_CONTRACTS.md), and [the original architecture](archive/build-week/docs/ARCHITECTURE.md).
