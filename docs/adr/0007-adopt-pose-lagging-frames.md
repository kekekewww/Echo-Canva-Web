# 0007 — Adopt pose-lagging complete frames during continuous edits

- Date: 2026-11-03
- Status: Proposed
- Related issue or pull request: [#23](https://github.com/kekekewww/Echo-Canva-Web/issues/23), tracking [#18](https://github.com/kekekewww/Echo-Canva-Web/issues/18)

## Context

Each pointermove during a drag dispatches `MOVE_SOURCE` or `UPDATE_LISTENER` and increments the scene revision, at roughly 60 Hz. Both Worker pools coalesce to the latest scene, at 10–15 Hz. Before this decision, three checks also discarded any frame that was not for the newest revision:

1. The pools dropped a complete in-flight frame whenever any newer scene arrived while it was computing (`obsolete = pendingScene !== null`).
2. `useAcousticFrame` rejected a frame whose revision differed from the latest scene.
3. `AudioEngine.applyAcousticFrame` repeated that rejection.

Once the end-to-end job latency approached the pointer interval, no frame survived a continuous drag. A fake-clock simulation of the real Classic pool and Worker controller, with 62.5 Hz pose updates for 3 s at 12 Hz, measured:

| Job latency | Frames published |
| --- | --- |
| 2 ms | 31 |
| 5 ms | 26 |
| 10 ms | 14 |
| 20 ms | 0 |

In the browser, the main-thread hops before posting and the work a reply waits behind add further latency. During a drag the overlay showed no frame, and audio held its last accepted state (see #19) until the pointer paused. Audio then jumped to the new state.

The earlier rule ("stale results cannot satisfy a current scene/listener revision") protects against applying results computed for different geometry. It does not distinguish such results from results computed for the same geometry at a slightly older pose.

## Decision

A complete frame computed for revision R may be adopted while the scene is at a newer revision R+k only when the newer scene differs **in pose alone**:

- **Same static structure.** Classic uses the Worker static fingerprint (`createClassicStaticContext`: room, walls, Portals, materials, settings). Hybrid uses `staticGeometryHash` (room, walls with vertical bounds, Portals, primitives, disabled surfaces).
- **Same ordered source IDs.**

Such a frame is *pose-lagging*: complete, validated, computed against the current structure, and describing listener/source positions from an earlier coalesced update. A frame computed against a different structure or source set is never adopted.

Affected modules:

- **Classic and Hybrid pools** (`classic-source-pool.ts`, `hybrid-direct-pool.ts`): a completed frame is discarded only when the pending scene changes structure or source set. Pooled frames carry `staticFingerprint`. Classic computes the pending scene's fingerprint once per completed job (at most 15 Hz); Hybrid reuses the compiler's hash.
- **`src/acoustics/frame-acceptance.ts`:** a pure, shared acceptance rule.
- **`useAcousticFrame`:** adopts a pose-lagging frame after one fingerprint check on arrival. While the scene keeps changing, it keeps showing that frame only while a cheap structural comparison and the source order still match, so it never re-hashes the static scene per pointer event (about 0.24 ms for 100 walls in Node). The hook returns `lagging`.
- **`resolveHybridAcousticPresentation`:** accepts a pose-lagging Hybrid frame and returns `lagging`.
- **`AudioEngine.applyAcousticFrame(frame, { lagging })`:** still rejects a revision mismatch by default. It admits one only when the caller passes `lagging: true` after verifying it. Directions of a lagging frame are applied relative to the current listener pose; gains and filters are the frame's.

Overlay and audio adopt the same accepted frame, so they stay consistent with each other. The status bar's accepted revision may then trail the editor revision by the coalescing window.

## Alternatives

- **Keep exact-revision acceptance.** This is correct but starves under continuous edits, as shown above.
- **Throttle pose edits to the acoustic rate in the editor.** This changes authoring responsiveness and history, and still drops a frame whenever an edit lands mid-job.
- **Interpolate or extrapolate between frames.** This would invent acoustic states that no Worker computed; out of scope.
- **Accept any older frame.** This could apply results for walls, Portals or materials that no longer exist; rejected.

## Consequences and compatibility

- No schema, formula, material, ranking or tie-breaker change.
- The Worker `FRAME` response gains an optional `staticFingerprint`. `HybridDirectPoolResult` and `HybridDirectPathsState` gain `staticFingerprint`. `AcousticFrameResult` gains `lagging`. `resolveHybridAcousticPresentation` takes the current `staticGeometryHash`.
- Complete serial fallback, watchdog, hostile/partial rejection, static install acknowledgements, bounded pools, deterministic sharding and the 10–15 Hz clamp are unchanged.
- During a drag, overlays and audio advance at the coalesced rate, trailing the pointer by about one update. This is an engineering/perceptual trade-off, not a physical claim.
- A structural edit (wall, Portal, material, primitive, settings, enabling/disabling or reordering sources) behaves as before. The previous frame is not shown for the new structure, and audio holds until a matching frame arrives.

## Verification

- Unit (Classic pool, fake timers): a pose-only pending scene publishes the in-flight frame with its fingerprint, then the newest scene. Wall material, Portal, settings, source removal and reordering still discard it. With 62.5 Hz pose updates and 20 ms jobs for 3 s, at least 20 frames are published (0 before), each trailing the latest pose by at most 2 pointer events.
- Unit (Hybrid pool): pose-only updates publish the in-flight frame as lagging. A closed Portal or a removed source discards it.
- Unit (acceptance): `sameClassicStaticStructure` agrees with the Worker fingerprint for pose and structure edits on Concrete Partition and Stress — 100 Walls. `acceptsClassicWorkerFrame`, `holdsClassicFrame`, `resolveHybridAcousticPresentation` and `AudioEngine` lagging behave as described.
- Browser: no listening or real-device evidence. The e2e suite exercises Worker frames during listener changes; rates during a pointer drag were not measured in a browser.
