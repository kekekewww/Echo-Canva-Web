# 03 — Hybrid 3D acoustic model

This section specifies the Hybrid (`hybrid-3d`) acoustic model: how a `SceneDocumentV2` becomes finite 3D patches, how the patch BVH answers visibility queries, how direct paths and first/second-order specular reflections are found, and how the main thread turns them into the audible direct state and the six reflection taps. It also inventories the data-only P5/P6/P7 helpers.

Adjacent sections, referenced by name only:

- **Domain model**: `SceneSpec` v1, `SceneDocumentV2`, the material registry, the workspace projection `projectHybridDocument`, ID rules and validation limits.
- **Classic acoustics**: `computeClassicSourceRoute` and the planar Portal router that the audible Portal route reuses, `estimateRoomAcoustics`.
- **Runtime/worker pipeline**: the Hybrid worker pool, sharding, static-structure install, the result validation, pose-lagging acceptance (ADR 0008), the serial fallback.
- **Audio engine**: `SourceGraph.applySpatialDirect`, `EarlyReflectionBank.applySpatial3d`, Schroeder reverb, tap-slot allocation.
- **Frontend UI**: `HybridViewportAdapter`, `HybridPathOverlay`, rendering of patches.

Everything below describes the code as it is, not the documentation, unless a statement is explicitly about the documentation.

## 0. Overview and classification

### 0.1 Pipeline and where each step runs

| Step | Function | Runs on |
| --- | --- | --- |
| Static compile (patches + BVH + hash) | `createHybridGeometryCompiler().compile` → `compileHybridStaticGeometry` | Main thread (React `useMemo` in the Hybrid viewport adapter). The structure is then cloned to workers. |
| Pose binding | `bindHybridPosesFromValidatedStructure` | Main thread |
| Per-source direct path, first-order, bounded second-order | `computeHybridDirectSources` | Worker shards; the serial fallback `computeHybridDirectFrame` runs the same code on the main thread |
| Frame assembly | `assembleHybridDirectFrame` | Main thread |
| Audible direct/Portal/blocked mapping | `resolveHybridAudibleDirectState` | **Main thread only** (`HybridViewportAdapter.tsx:106`), never in the worker |
| Reflection taps | `renderHybridEarlyReflections` | **Main thread only** (`HybridViewportAdapter.tsx:107-116`, also `HybridPathOverlay`) |

Source: src/components/workspace/HybridViewportAdapter.tsx:97-116, 201-206; src/workers/hybrid-direct.worker.ts:1-40, 67; src/acoustics/hybrid3d/direct.ts:114-212.

### 0.2 Classification of the model parts

| Part | Classification |
| --- | --- |
| Delay `L / 343 m/s`, image-source mirror construction, energy split `r = 1 − α − τ`, `τ = 10^(−TL/10)`, specular share `(1 − s)`, `1/d` amplitude spreading | Physical relations inside a geometric-acoustics model |
| Planar finite patches, faceted Cylinder/Sphere, two-sided patches, wall reflections evaluated on the `:front` plane only, dominant-axis point-in-polygon, all epsilons | Numerical/geometric approximations |
| BVH, any-hit query, static hash and compile cache, second-order pruning (50 m, −36 dB), 24-surface budget, top-6, worker sharding | Engineering optimizations |
| 36 dB direct-loss cap, 0.25 incidence floor, `6·log2` thickness adjustment, 700–20 000 Hz occlusion low-pass mapping, tap low-pass `20000·high/mid` in [800, 20000], six-tap cap, gain-descending tap ranking, Portal virtual source at the listener-facing Portal | Perceptual/engineering tuning |

No diffraction, no wave effects, no phase, no air absorption, no frequency-dependent reflections beyond the mid gain and a single low-pass per path. The data-only P5/P6/P7 helpers (§8) are not part of the audible runtime.

## 1. Coordinates, units, constants, numeric semantics

### 1.1 Coordinate convention

- World axes (`spatial3d.coordinateSystem = "x-right-y-up-z-forward"`): `x` = plan `x`, `y` = elevation (up), `z` = plan `y`. Units: metres, milliseconds for delays, dB for gains/losses, Hz for cut-offs, degrees for angles.
- Plan → world: `planPointToWorld({x, y}, h) = { x: x, y: h, z: y }`.
- Listener world position: `(listener.position.x, spatial3d.listenerHeightM, listener.position.y)`.
- Source world position: `(source.position.x, spatial3d.sourceHeightsM[source.id] ?? spatial3d.listenerHeightM, source.position.y)`. The fallback is the listener height, not 1.5 m (the workspace projection always supplies a height, default 1.5).
- Primitive `position` is already world `{x, y, z}` with `y` = centre height (not base).
- `spatial3d.floorElevationM` offsets every elevation (the workspace projection always emits 0).
- Direction angles (from listener to source, world aligned; listener heading is not applied):
  - `azimuthDeg = atan2(d.x, d.z) · 180 / π`: 0° = +z (plan +y), +90° = +x, range (−180, 180].
  - `elevationDeg = asin(d.y) · 180 / π`: positive above the listener.

Source: src/acoustics/hybrid3d/compile.ts:40-42, 215-235; src/acoustics/hybrid3d/direct.ts:60-62, 84-85; src/domain/scene-document/types.ts:4-13; src/domain/workspace/projections.ts:85-137.

### 1.2 Constants

| Constant | Value | Where | Notes |
| --- | --- | --- | --- |
| `SOUND_SPEED_MPS` | 343 | geometry.ts:1 | All Hybrid delays |
| `EPSILON` (geometry) | 1e-8 | geometry.ts:2 | Normalization, AABB parallel test, plane-parallel test, segment parameter, point-in-polygon, openings, ray distance |
| `EPSILON` (reflections) | 1e-8 | reflections.ts:15 | `imageRayIntersection` |
| Ray-AABB parallel threshold | 1e-8 (literal) | bvh.ts:113 | |
| Ray direction length threshold | 1e-8 (literal) | bvh.ts:137, geometry.ts:237 | |
| BVH leaf size | ≤ 4 patches | bvh.ts:38 | |
| Default patch thickness | 0.1 m | geometry.ts:193 | Used for floor, ceiling, **all wall and Portal-frame patches** |
| `CYLINDER_SEGMENTS` | 12 | primitives.ts:3 | |
| `SPHERE_LONGITUDES` | 8 | primitives.ts:4 | |
| `SPHERE_LATITUDE_BANDS` | 4 | primitives.ts:5 | |
| Second-order runtime `maxCandidates` | 6 (literal) | direct.ts:147 | Equals `DEFAULT_SECOND_ORDER_TOP_K` |
| Second-order runtime `maxRepresentativePatches` | 24 (literal) | direct.ts:147 | Equals `DEFAULT_SECOND_ORDER_SURFACE_BUDGET` |
| Second-order default `maxPathLengthM` | 50 | second-order.ts:179 | Strict `>` prunes |
| Second-order default `minEstimatedGainDb` | −36 | second-order.ts:180 | Strict `<` prunes |
| `MAX_REFERENCE_SECOND_ORDER_PATCHES` | 32 | second-order.ts:21 | Oracle only |
| `MAX_DIRECT_LOSS_DB` | 36 | audible-direct.ts:14 | |
| `MIN_CUTOFF_HZ` / `MAX_CUTOFF_HZ` (direct) | 700 / 20 000 | audible-direct.ts:15-16 | |
| Incidence floor | 0.25 | audible-direct.ts:62, 83 | |
| Thickness adjustment slope | 6 dB per doubling | audible-direct.ts:63, 84 | |
| High-loss normaliser | 36 dB | audible-direct.ts:96 | |
| `MAX_HYBRID_EARLY_REFLECTION_TAPS` | 6 | reflection-rendering.ts:11 | |
| Tap `MIN_LOWPASS_HZ` / `MAX_LOWPASS_HZ` | 800 / 20 000 | reflection-rendering.ts:13-14 | 800 unreachable with the registry (minimum 12 659 Hz) |
| Tap mid-amplitude floor | 1e-8 | reflection-rendering.ts:18 | Returns 800 Hz |

`distanceAttenuation` and `linearToDb` come from `src/audio/math.ts` (Audio engine section) and are used with default options throughout Hybrid:

```text
distanceAttenuation(d) = 1 / (1 + max(clamp(d, 0, 50) − 1, 0))     // ref 1 m, rolloff 1, max 50 m; NaN/±∞ d → 1 m
linearToDb(x)          = 20 · log10(clamp(x, 1e-8, 16))             // non-finite x → 1 → 0 dB
```

Source: src/audio/math.ts:1-39 and the file lines above.

### 1.3 JavaScript semantics that matter for parity

- **`Math.hypot`** (used by `length3`, `distance3`, direct distance, Portal leg lengths, wall length): V8 computes `max = max|xi|`; returns ∞ if max is ∞, NaN if any arg is NaN, 0 if max is 0; otherwise a Kahan-compensated sum of `(|xi|/max)^2` in argument order (`summand = n*n − c; p = sum + summand; c = (p − sum) − summand; sum = p`) and returns `sqrt(sum) · max`. Verified against Node 22.23.4: 0 mismatches in 10^6 random triples, while naive `sqrt(x²+y²+z²)` differed in last bit in about 37 % of cases. Bit-identical ties (for example equal path lengths that are tie-broken by ID) depend on this.
- **`Math.atan2(±0, ±0)`**: `atan2(+0,+0)=0`, `atan2(−0,+0)=−0`, `atan2(+0,−0)=180°`, `atan2(−0,−0)=−180°`. A source directly above/below the listener has `d.x = d.z = ±0`; azimuth then depends on signed zeros (corpus `DH02` records `azimuthDeg 0`, `elevationDeg 90`).
- **`x · (1/x)`** never exceeds 1 for IEEE doubles, so `asin(d.y)` does not return NaN for a vertical direction.
- **−0**: `normal = (−along.z, 0, along.x)` produces `x = −0` for walls along +x. Output files canonicalise −0 to 0; the hash input never contains normals.
- **`String.prototype.localeCompare(other)`** with no locale argument uses the runtime default locale and ICU tertiary collation with punctuation non-ignorable. It is not code-unit order. For the ID alphabet `[A-Za-z0-9_-]` plus `:` and `>` used in derived IDs, the ICU root/en order is `_ < - < : < > < 0…9 < a < A < b < B … z < Z` at the tertiary level, with letters compared case-insensitively first (example order: `a_c, a-c, a:c, a>c, a0, ab, Ab, ac`). Some locales differ: `Intl.Collator("da")` orders `Ab` before `ab` and `aa` after `ac` (verified). All `localeCompare` call sites are listed in §3 and §5.
- **`Array.prototype.sort`** is stable (TimSort). A comparator returning 0 keeps input order.
- **`toSorted()`** with no comparator (static-hash `disabledSurfaceIds`) sorts by UTF-16 code units.
- **`JSON.stringify`** (static hash): own enumerable keys in insertion order (integer-like keys first ascending), `undefined` members dropped, `NaN`/`±∞` → `null`, `−0` → `0`, numbers in ECMAScript shortest round-trip form (`0.1`, `1e-7`, `1e+21`).
- **`for (const ch of string)`** iterates Unicode code points; `ch.charCodeAt(0)` is the high surrogate for astral characters.

Source: src/acoustics/hybrid3d/geometry.ts:67-69; src/acoustics/hybrid3d/direct.ts:84-85; src/acoustics/hybrid3d/compile.ts:31-38, 58; benchmarks/corpus/README.md ("Known limits").

## 2. Geometry primitives

### 2.1 Vectors and AABBs

```text
add3(a,b)      = (a.x+b.x, a.y+b.y, a.z+b.z)
subtract3(a,b) = (a.x−b.x, a.y−b.y, a.z−b.z)
scale3(v,s)    = (v.x·s, v.y·s, v.z·s)
dot3(a,b)      = a.x·b.x + a.y·b.y + a.z·b.z                    // left to right
cross3(a,b)    = (a.y·b.z − a.z·b.y, a.z·b.x − a.x·b.z, a.x·b.y − a.y·b.x)
length3(v)     = Math.hypot(v.x, v.y, v.z)
normalize3(v)  = scale3(v, 1/length3(v)); throws "Cannot normalize a zero-length 3D vector." if length3(v) <= 1e-8
lerp3(s,e,t)   = add3(s, scale3(subtract3(e, s), t))
aabbForPoints(P): min/max per axis via Math.min/Math.max, folded from P[0]; throws "An AABB needs at least one point." if empty
unionAabb3, aabbCentroid3 = ((min+max)·0.5 per axis)
```

Source: src/acoustics/hybrid3d/geometry.ts:43-121.

### 2.2 Patch, opening and hit records

| Type | Fields |
| --- | --- |
| `AcousticPatch3` | `id`, `kind` (`floor`/`ceiling`/`wall`/`primitive`), `materialId`, `wallId?` (present only if truthy), `surfaceId`, `thicknessM`, `vertices` (copied array, ≥ 3), `normal`, `aabb`, `openings: PortalOpening3[]` |
| `PortalOpening3` | `id`, `wallId`, `center` (world), `along` (unit, horizontal), `widthM`, `floorElevationM` (opening bottom, world y), `heightM` (opening height) |
| `SegmentPatchHit` | `patchId`, `wallId?` (only if patch.wallId truthy), `surfaceId`, `materialId`, `thicknessM` (the patch's), `distanceM` (from segment start / ray origin), `point` |

`makePatch3(id, kind, materialId, vertices, {wallId?, surfaceId?, thicknessM?, openings?})`:

1. If `vertices.length < 3` throw `"An acoustic patch needs at least three vertices."`.
2. `normal = normalize3(cross3(v1 − v0, v2 − v0))` (only the first three vertices; collinear → normalize error). No planarity, convexity or duplicate check: non-planar input is accepted (corpus `DK03`).
3. `surfaceId = options.surfaceId ?? options.wallId ?? id`; `thicknessM = options.thicknessM ?? 0.1`; `aabb = aabbForPoints(vertices)`; `openings = options.openings ? copy : []`.

Normal orientation is whatever the vertex winding gives and is not consistent (verified: the floor normal of the default room is (0, −1, 0), out of the room; the ceiling's is (0, 1, 0); all six box face normals point into the box). No computation depends on its sign (`reflectedPoint`, plane intersection and incidence are sign-invariant, dominant-plane projection uses absolute values), but the `normal` field is a corpus output (`hybrid-patch` cases), so the formula must be kept.

Source: src/acoustics/hybrid3d/geometry.ts:8-41, 178-199.

### 2.3 Point in patch

`pointInPatch3(p, patch)`:

1. Dominant-plane projection by `|normal|`: if `|nx| ≥ |ny|` and `|nx| ≥ |nz|` use `(y, z)`; else if `|ny| ≥ |nz|` use `(x, z)`; else `(x, y)`.
2. For each edge, iterating `index = 0..n−1` with `previous = index − 1` (wrapping, so the first edge is `(v0, v(n−1))`), `a = poly[index]`, `b = poly[previous]`:
   - **On-edge test (inclusive):** `cross = (p0 − a0)(b1 − a1) − (p1 − a1)(b0 − a0)`; if `|cross| ≤ 1e-8` and `min(a0,b0) − 1e-8 ≤ p0 ≤ max(a0,b0) + 1e-8` and the same for coordinate 1, return true immediately. The tolerance is on the unnormalised cross product (units m²).
   - **Crossing:** if `(a1 > p1) !== (b1 > p1)`, `xAtY = ((b0 − a0)(p1 − a1)) / (b1 − a1) + a0`; if `p0 < xAtY` toggle `inside`.
3. Return `inside` (even-odd rule; concave polygons work).

Source: src/acoustics/hybrid3d/geometry.ts:145-176.

### 2.4 Segment and ray against an AABB

`segmentIntersectsAabb3(start, end, box)` (slab test on `t ∈ [0, 1]`):

```text
delta = end − start; tMin = 0; tMax = 1
for axis in x, y, z:
  if |delta[axis]| <= 1e-8:
    if start[axis] < box.min[axis] − 1e-8 or start[axis] > box.max[axis] + 1e-8: return false
    continue
  inv = 1/delta[axis]; near = (min − start)·inv; far = (max − start)·inv; swap if near > far
  tMin = max(tMin, near); tMax = min(tMax, far); if tMin > tMax: return false
return true
```

`rayIntersectsAabb3(origin, dir, box, maxT)` is the same with `near = 0`, `far = maxT`, the parallel test **without** the 1e-8 padding (`origin < min || origin > max`), and a final `return far >= 0`.

Source: src/acoustics/hybrid3d/geometry.ts:123-143; src/acoustics/hybrid3d/bvh.ts:104-126.

### 2.5 Segment, ray and image-ray against a finite patch

Three related tests. All use the plane through `vertices[0]` with `normal`.

| Test | Parallel rejection | Parameter accepted | Point | In-polygon | Openings | Distance |
| --- | --- | --- | --- | --- | --- | --- |
| `intersectSegmentPatch(start, end, patch)` | `\|n·delta\| ≤ 1e-8` (delta unnormalised: the angular threshold scales with 1/length) | `1e-8 < t < 1 − 1e-8` (endpoints on the plane never hit) | `lerp3(start, end, t)` | inclusive (§2.3) | point inside any opening → no hit | `length3(delta) · t` |
| `intersectRayPatch(origin, dir, patch, maxD = ∞)` | `length3(dir) ≤ 1e-8` or `\|n·dir\| ≤ 1e-8` | `t > 1e-8` and `t·\|dir\| ≤ maxD + 1e-8` | `origin + dir·t` | inclusive | yes | `t · length3(dir)` |
| `imageRayIntersection(image, listener, patch)` | `\|n·ray\| ≤ 1e-8` | `1e-8 < t < 1 − 1e-8` | `lerp3(image, listener, t)` | inclusive | **not checked** | — |

with `t = dot(n, v0 − start) / dot(n, delta)`. A segment lying in the patch plane is "parallel" and never hits that patch, even when it runs across it (corpus `DK05`). Zero-length segments never hit.

Source: src/acoustics/hybrid3d/geometry.ts:209-256; src/acoustics/hybrid3d/reflections.ts:49-61.

### 2.6 Portal openings

`pointIsInsidePortalOpening(p, o)` (inclusive with 1e-8):

```text
|dot3(p − o.center, o.along)| <= o.widthM·0.5 + 1e-8
and p.y >= o.floorElevationM − 1e-8
and p.y <= o.floorElevationM + o.heightM + 1e-8
```

It ignores the offset along the wall normal; it is only consulted for points already on the wall's `:front` or `:back` plane. A hit on the opening boundary counts as "in the opening" and is discarded, even though the same point is "in the polygon" of the wall face. Openings are attached to both the `:front` and `:back` patches of the host wall for **every** Portal on that wall, open **or closed**; a closed Portal is blocked by its separate slab patches (§3.3). Only segment and ray tests honour openings; specular image-ray intersection does not (Review findings, V2).

Source: src/acoustics/hybrid3d/geometry.ts:201-207; src/acoustics/hybrid3d/compile.ts:80-100, 164-178.

## 3. Compilation: `SceneDocumentV2` → finite patches

### 3.1 Inputs read

From the document: `baseScene.room` (`outerPolygon`, `heightM`, `floorMaterialId`, `ceilingMaterialId`), `baseScene.walls[]` (`id`, `a`, `b`, `thicknessM`, `materialId`), `baseScene.portals[]` (`id`, `wallId`, `center`, `widthM`, `heightM`, `open`; `lossDb` is not read by the 3D geometry), `baseScene.sources[]` and `baseScene.listener` (poses only), `baseScene.revision`, `compatibility.classicProjectionHash`, and `extensions.spatial3d` (`floorElevationM`, `listenerHeightM`, `sourceHeightsM`, `wallVerticalBoundsM[wallId] = {bottomM, topM}`, `portalVerticalBoundsM[portalId] = {bottomM, topM, thicknessM}`, `disabledSurfaceIds`, `primitives`).

Not read by `src/acoustics/hybrid3d`: `extensions.propagation3d` (the workspace projection emits `maxReflectionOrder: 1, receiverConnection: false`, both ignored), `materialBands`, `atmosphericMedia`, `baseScene.settings` (including `maxEarlyReflections`).

The workspace projection (Domain model section) supplies a rectangular room `[0,widthM]×[0,depthM]`, `floorElevationM 0`, vertical bounds for every wall and Portal, `disabledSurfaceIds = ["ceiling"]` when the ceiling is disabled, and only enabled primitives; disabled walls, Portals and sources are already removed. Hybrid itself performs no limit checks beyond the errors in §3.8; the 100-wall / 8-Portal / 8-primitive / 4-source limits come from validation. Worst case patch count: 2 + 6·100 + 10·8 + 32·8 = 938.

Source: src/acoustics/hybrid3d/compile.ts:44-213; src/domain/workspace/projections.ts:85-137.

### 3.2 Patch emission order

`compileHybridStaticGeometry(document)`:

1. If `!("documentVersion" in document)` throw `"Hybrid 3D geometry needs a v2 scene document."`; if `extensions.spatial3d` missing throw `"Hybrid 3D geometry requires a spatial3d extension."`.
2. Emit in this order:
   1. `floor`: `makePatch3("floor", "floor", room.floorMaterialId, outerPolygon.map(p → (p.x, floor, p.y)))`. The floor can never be disabled.
   2. `ceiling` unless `disabledSurfaceIds` contains `"ceiling"`: same polygon at `floor + room.heightM`, **reversed** vertex order, material `room.ceilingMaterialId`. Other `disabledSurfaceIds` values are ignored (but hashed).
   3. For each wall in `baseScene.walls` order: six wall patches (§3.3), then for each Portal in `baseScene.portals` order whose `wallId === wall.id`: four frame patches, plus six slab patches if the Portal is closed (§3.3).
   4. For each primitive in `spatial3d.primitives` order: its patches (§3.4).
3. `bvh = buildPatchBvh(patches)` (§4); `staticGeometryHash = hybridStaticGeometryHash(document)` (§3.6).

Floor/ceiling: `surfaceId` = id, no `wallId`, `thicknessM` 0.1. The ceiling sits at `floor + room.heightM` regardless of wall top bounds.

Source: src/acoustics/hybrid3d/compile.ts:193-213.

### 3.3 Walls, Portal frames and closed slabs

Per wall (`V = wallVerticalBoundsM?.[wall.id]`):

```text
bottomY = floor + (V?.bottomM ?? 0);  topY = floor + (V?.topM ?? room.heightM)
a = (wall.a.x, bottomY, wall.a.y);    b = (wall.b.x, bottomY, wall.b.y)
along  = normalize3((b.x − a.x, 0, b.z − a.z))
normal = (−along.z, 0, along.x)
offset = scale3(normal, wall.thicknessM · 0.5)
frontA = a + offset; frontB = b + offset
backA  = a + scale3(offset, −1); backB = b + scale3(offset, −1)
lift   = (0, topY − bottomY, 0)
openings = [portalOpening(p) for p in portals if p.wallId === wall.id]   // scene Portal order
```

| Patch id | Vertices (in order) | Extra |
| --- | --- | --- |
| `${wall.id}:front` | frontA, frontB, frontB+lift, frontA+lift | openings |
| `${wall.id}:back` | backB, backA, backA+lift, backB+lift | openings |
| `${wall.id}:end-a` | backA, frontA, frontA+lift, backA+lift | |
| `${wall.id}:end-b` | frontB, backB, backB+lift, frontB+lift | |
| `${wall.id}:bottom` | backA, backB, frontB, frontA | |
| `${wall.id}:top` | frontA+lift, frontB+lift, backB+lift, backA+lift | |

All six: `kind "wall"`, `materialId = wall.materialId`, `wallId = surfaceId = wall.id`, **`thicknessM = 0.1`** (the default; the real wall thickness only shapes the geometry). The `:front` normal equals `normal` above, `:back` its negation.

Portal opening (`P = portalVerticalBoundsM?.[portal.id]`): `bottomM = P?.bottomM ?? 0`, `topM = P?.topM ?? portal.heightM`; `center = (portal.center.x, floor + (bottomM + topM)·0.5, portal.center.y)`; `along = normalize3((wall.b.x − wall.a.x, 0, wall.b.y − wall.a.y))`; `widthM = portal.widthM`; `floorElevationM = floor + bottomM`; `heightM = topM − bottomM`.

Portal frame (always emitted, open or closed):

```text
bottomY = floor + (P?.bottomM ?? 0);  topY = floor + (P?.topM ?? portal.heightM)
center = (portal.center.x, bottomY, portal.center.y)
left  = center + along·(−widthM/2);   right = center + along·(widthM/2)
front = normal·(wall.thicknessM/2);    back = normal·(−wall.thicknessM/2)
LF = left+front, LB = left+back, RF = right+front, RB = right+back; lift = (0, topY − bottomY, 0)
```

| Patch id | Vertices |
| --- | --- |
| `${portal.id}:jamb-left` | LB, LF, LF+lift, LB+lift |
| `${portal.id}:jamb-right` | RF, RB, RB+lift, RF+lift |
| `${portal.id}:sill` | LB, RB, RF, LF |
| `${portal.id}:header` | LF+lift, RF+lift, RB+lift, LB+lift |

Closed Portal (`portal.open === false`) adds a slab with `slabHalf = (P?.thicknessM ?? wall.thicknessM)·0.5` and `sLF = left + normal·slabHalf`, `sLB = left − normal·slabHalf` (computed as `scale3(normal, −slabHalf)`), etc.:

| Patch id | Vertices |
| --- | --- |
| `${portal.id}:slab-face-front` | sLF, sRF, sRF+lift, sLF+lift |
| `${portal.id}:slab-face-back` | sRB, sLB, sLB+lift, sRB+lift |
| `${portal.id}:slab-side-left` | sLB, sLF, sLF+lift, sLB+lift |
| `${portal.id}:slab-side-right` | sRF, sRB, sRB+lift, sRF+lift |
| `${portal.id}:slab-bottom` | sLB, sRB, sRF, sLF |
| `${portal.id}:slab-top` | sLF+lift, sRF+lift, sRB+lift, sLB+lift |

All frame and slab patches: `kind "wall"`, host `wall.materialId`, `wallId = surfaceId = wall.id`, `thicknessM` 0.1, no openings. A closed door is therefore acoustically part of the host wall (material and, in the audible occlusion, the wall's thickness). The frame uses the wall thickness; a slab thicker than the wall protrudes.

With `bottomM = 0`, the sill and the wall `:bottom` are coplanar with the floor; with `topM` equal to the wall top, header and wall `:top` are coplanar. Coplanarity is harmless because legs that end on a plane are never hits (`t < 1 − 1e-8`).

Source: src/acoustics/hybrid3d/compile.ts:80-191.

### 3.4 Primitive tessellation

World transform (rotation about +y, `θ = rotationYDeg · π / 180`):

```text
x = position.x + l.x·cos θ − l.z·sin θ
y = position.y + l.y
z = position.z + l.x·sin θ + l.z·cos θ
```

Every primitive patch: id `${primitive.id}:${local}`, `kind "primitive"`, `materialId = primitive.materialId`, `surfaceId = primitive.id`, no `wallId`, `thicknessM = min(dimensions.x, dimensions.y, dimensions.z)`.

| Kind | Patches (order) | Count |
| --- | --- | --- |
| `box` | half = dims/2; bottom ring `b = [(−hx,−hy,−hz), (hx,−hy,−hz), (hx,−hy,hz), (−hx,−hy,hz)]`, top ring `t` the same at `+hy`. `bottom` = [b3, b2, b1, b0]; `top` = [t0, t1, t2, t3]; `side:i` = [b_i, b_(i+1)%4, t_(i+1)%4, t_i] for i = 0..3 | 6 |
| `cylinder` | ring(y) of 12 points, `angle = i/12·π·2`, local `(cos(angle)·dims.x/2, y, sin(angle)·dims.z/2)` (elliptic); `bottom` = reversed ring(−dims.y/2); `top` = ring(+dims.y/2); `side:i` = [b_i, b_(i+1)%12, t_(i+1)%12, t_i] | 14 |
| `sphere` (any other kind) | rows r = 0..4 at `latitude = −1 + r·(2/4)`, 8 points per row at `longitude = j/8`; point = `(cos(lat·π/2)·cos(lon·2π)·dims.x/2, sin(lat·π/2)·dims.y/2, cos(lat·π/2)·sin(lon·2π)·dims.z/2)`. Facet `facet:r:j` for r = 0..3, j = 0..7, `n = (j+1)%8`: r = 0 → [row0_j, row1_n, row1_j]; r = 3 → [row3_j, row3_n, row4_j]; otherwise [row_r_j, row_r_n, row_(r+1)_n, row_(r+1)_j] | 32 |

The sphere's pole "points" are not exactly coincident (`cos(±π/2) ≈ 6.12e-17`). The Hybrid sphere equator is an octagon, whereas the Classic footprint and the validator use a 12-gon (Domain model section).

Source: src/acoustics/hybrid3d/primitives.ts:1-122; tests/unit/hybrid3d-primitives.test.ts:22-40.

### 3.5 Pose binding

`bindHybridPoses(structure, document)` throws `"Hybrid 3D static geometry cannot be reused after a geometry change."` if `structure.staticGeometryHash !== hybridStaticGeometryHash(document)`, then returns `HybridGeometry = { document, staticGeometryHash, patches, bvh, listenerPosition, sourcePositions }` with positions from §1.1 (`sourcePositions` keyed by source ID, in `baseScene.sources` order). `compileHybridGeometry(d) = bindHybridPoses(compileHybridStaticGeometry(d), d)`.

Source: src/acoustics/hybrid3d/compile.ts:16-29, 215-249.

### 3.6 Static geometry hash

`hybridStaticGeometryHash(document) = fnv1a(JSON.stringify(inputs))` with

```js
inputs = {
  room: baseScene.room,                                         // object as authored, its own key order
  floorElevationM: spatial3d.floorElevationM,
  disabledSurfaceIds: [...(spatial3d.disabledSurfaceIds ?? [])].toSorted(),   // UTF-16 order
  walls: baseScene.walls.map(w => ({ ...w, vertical: spatial3d.wallVerticalBoundsM?.[w.id] ?? null })),
  portals: baseScene.portals.map(p => ({ id: p.id, wallId: p.wallId, center: p.center, widthM: p.widthM,
                                         heightM: p.heightM, open: p.open,
                                         vertical: spatial3d.portalVerticalBoundsM?.[p.id] ?? null })),
  primitives: spatial3d.primitives ?? [],                       // objects as authored, includes `name`
}
```

Included: room polygon, height, floor/ceiling materials; floor elevation; disabled surface IDs; every wall field (in the wall object's insertion order) plus its vertical bounds; Portal geometry and open state plus vertical bounds (with thickness); every primitive field. Excluded: poses, listener/source heights, Portal `lossDb`, scene name, settings, revision. Key order follows object construction, so the hash is not canonical (README "Known limits").

```js
function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (const ch of value) {            // code points
    hash ^= ch.charCodeAt(0);          // high surrogate only for astral characters
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");   // 8 lowercase hex digits
}
```

Test vectors (Node 22.23.4): `fnv1a("") = "811c9dc5"`, `fnv1a("a") = "e40c292c"`, `fnv1a("\u{1D11E}") = fnv1a("\u{1D11F}") = fnv1a("\uD834") = "30821a63"`. The default Hybrid project (`createDefaultHybridProject` → `projectHybridDocument`) hashes to `"92a14f2e"` from this 1212-character input:

```json
{"room":{"outerPolygon":[{"x":0,"y":0},{"x":12,"y":0},{"x":12,"y":8},{"x":0,"y":8}],"heightM":3,"floorMaterialId":"concrete_hard","ceilingMaterialId":"concrete_hard"},"floorElevationM":0,"disabledSurfaceIds":[],"walls":[{"id":"boundary_north","a":{"x":0,"y":0},"b":{"x":12,"y":0},"thicknessM":0.2,"materialId":"concrete_hard","kind":"boundary","vertical":{"bottomM":0,"topM":3}},{"id":"boundary_east","a":{"x":12,"y":0},"b":{"x":12,"y":8},"thicknessM":0.2,"materialId":"concrete_hard","kind":"boundary","vertical":{"bottomM":0,"topM":3}},{"id":"boundary_south","a":{"x":12,"y":8},"b":{"x":0,"y":8},"thicknessM":0.2,"materialId":"concrete_hard","kind":"boundary","vertical":{"bottomM":0,"topM":3}},{"id":"boundary_west","a":{"x":0,"y":8},"b":{"x":0,"y":0},"thicknessM":0.2,"materialId":"concrete_hard","kind":"boundary","vertical":{"bottomM":0,"topM":3}},{"id":"partition_center","a":{"x":6,"y":0},"b":{"x":6,"y":8},"thicknessM":0.2,"materialId":"concrete_hard","kind":"partition","vertical":{"bottomM":0,"topM":3}}],"portals":[{"id":"partition_door","wallId":"partition_center","center":{"x":6,"y":4},"widthM":1.2,"heightM":2.1,"open":true,"vertical":{"bottomM":0,"topM":2.1,"thicknessM":0.12}}],"primitives":[]}
```

The hash is also the worker `staticFingerprint` (Runtime/worker pipeline section) and is corpus-pinned (`/value/staticGeometryHash`, tape steps).

Source: src/acoustics/hybrid3d/compile.ts:31-38, 50-78; benchmarks/corpus/README.md.

### 3.7 Compile cache

`createHybridGeometryCompiler(compileStatic = compileHybridStaticGeometry)` keeps one cached structure and the last `inputs` object:

1. `inputs = hybridStaticGeometryInputs(document)` (throws the spatial3d error first if missing).
2. If there is no cache or `!jsonEqual(cachedInputs, inputs)`: compute `hash = fnv1a(JSON.stringify(inputs))`; if no cache or `cached.staticGeometryHash !== hash`, `cached = compileStatic(document)`; set `cachedInputs = inputs`.
3. Return the pose binding of `cached` (no hash re-check).

`jsonEqual` (from `src/acoustics/frame-acceptance.ts`) is key-order-insensitive, uses `Object.is` for primitives (so `0` vs `−0` differ, `NaN` equals `NaN`) and treats a key missing on the left but `undefined` on the right as equal. A pose-only edit therefore neither rehashes nor recompiles (tests: 100 pose updates → 1 compile).

Source: src/acoustics/hybrid3d/compile.ts:251-269; src/acoustics/frame-acceptance.ts:39-65; tests/unit/hybrid3d-compile.test.ts:62-86; tests/unit/static-structure-cache.test.ts:91-123.

### 3.8 Compile-time errors (messages are corpus-compared exactly)

| Condition | Message |
| --- | --- |
| Not a v2 document | `Hybrid 3D geometry needs a v2 scene document.` |
| No `spatial3d` | `Hybrid 3D geometry requires a spatial3d extension.` |
| Patch with < 3 vertices | `An acoustic patch needs at least three vertices.` |
| First three vertices collinear/coincident (also zero-height wall or Portal, zero wall thickness end caps, zero-length wall `along`) | `Cannot normalize a zero-length 3D vector.` |
| Structure reused after a static change | `Hybrid 3D static geometry cannot be reused after a geometry change.` |

## 4. BVH

### 4.1 Build

`buildPatchBvh(patches)` keeps a copy of the patch array and builds `root` (null for zero patches) from all indexes:

1. `bounds` = union of the patches' AABBs.
2. If the node has ≤ 4 indexes: leaf with those indexes (in the order received).
3. Otherwise split on the longest axis of `bounds` (extent `x ≥ y && x ≥ z` → x; else `y ≥ z` → y; else z).
4. Sort indexes (stable) by the patch AABB centroid on that axis ascending; ties by `patches[left].id.localeCompare(patches[right].id)` (**localeCompare site bvh.ts:42**).
5. `middle = floor(n/2)`; left child = first `middle`, right child = the rest; recurse.

Source: src/acoustics/hybrid3d/bvh.ts:22-58.

### 4.2 Queries

| Query | Traversal | Result |
| --- | --- | --- |
| `intersectSegmentBvh(start, end, bvh)` | DFS, left then right; prune nodes failing `segmentIntersectsAabb3`; test every patch of a reached leaf with `intersectSegmentPatch` | All hits, sorted by `distanceM` ascending, ties by `patchId.localeCompare` (**bvh.ts:79**) |
| `hasSegmentBvhHit(start, end, bvh, accept = () => true)` | Same pruning; returns true at the first hit for which `accept(hit)` is true, `visit(left) \|\| visit(right)` | Boolean; false for an empty BVH |
| `intersectRayBvh(origin, dir, bvh, maxD = ∞)` | `|dir| ≤ 1e-8` → []; `maxT = maxD/|dir|`; prune with `rayIntersectsAabb3`; `intersectRayPatch` per leaf patch | All hits sorted by distance, ties `patchId.localeCompare` (**bvh.ts:156**). Used only by P5. |

Each patch lives in exactly one leaf, so a hit list contains each patch at most once. The BVH only prunes; the reference result is the brute-force set of `intersectSegmentPatch` hits (test: `hybrid3d-direct.test.ts:210-229`; 2048 seeded segments compare any-hit with the full list in `hybrid3d-visibility.test.ts:51-66`). Hits exactly on an AABB face could in principle be pruned by rounding in the slab test; UNVERIFIED whether any case depends on that.

Occluder de-duplication is done by callers: `direct.ts` maps sorted hits to `wallId ?? surfaceId` and keeps the first occurrence (`[...new Set(...)]`); so a wall crossed through several of its patches (front, back, caps, Portal frame, closed slab) counts once, and a primitive is reported by its primitive ID.

Source: src/acoustics/hybrid3d/bvh.ts:60-158; src/acoustics/hybrid3d/direct.ts:64-66.

## 5. Direct paths and the Hybrid frame

### 5.1 `solveDirectPath3D(source, listener, bvh)`

1. `toSource = source − listener`; `distanceM = length3(toSource)`; if `distanceM <= 0` throw `"Source and listener positions must be distinct in Hybrid 3D."` (corpus `DH01`). A distance in (0, 1e-8] throws the normalize error instead.
2. `directionToSource = normalize3(toSource)`.
3. `hits = intersectSegmentBvh(source, listener, bvh)` (from source, so `hit.distanceM` is measured from the source). No allowed set: every patch, including floor/ceiling and primitives, occludes.
4. Result fields as in §5.4. There is no per-band transmission here; loss is applied on the main thread (§6.2).

Source: src/acoustics/hybrid3d/direct.ts:68-90.

### 5.2 Per-source computation

`createHybridDirectPoseSnapshot(geometry)` = `{ revision: baseScene.revision, staticFingerprint: geometry.staticGeometryHash, classicProjectionHash: compatibility.classicProjectionHash, listenerPosition, sources: baseScene.sources.map(s → {id, position}) }`.

`computeHybridDirectSources(snapshot, bvh, sourceIds)`, in `sourceIds` order:

1. Duplicate ID → throw `Duplicate Hybrid source ID requested: ${id}`; unknown ID → throw `Unknown Hybrid source ID requested: ${id}`.
2. `path = { sourceId, ...solveDirectPath3D(position, listener, bvh) }`.
3. `firstOrderReflections = findFirstOrderReflections3D(position, listener, bvh)` (always, visible or not).
4. `secondOrderReflections = path.directVisible ? [] : findPrunedSecondOrderReflections3D(position, listener, bvh, { maxCandidates: 6, maxRepresentativePatches: 24 }).paths` (defaults 50 m and −36 dB).
5. Return `{ sourceId, revision, staticFingerprint, classicProjectionHash, path, firstOrderReflections, secondOrderReflections }`.

`computeHybridDirectPaths(geometry)` (direct paths only) is used by tests only.

Source: src/acoustics/hybrid3d/direct.ts:92-151.

### 5.3 Assembly

`assembleHybridDirectFrame(snapshot, results, computedAtMs)` checks each result in input order, then completeness:

| Check | Error |
| --- | --- |
| ID not in snapshot | `Unknown Hybrid source result: ${id}` |
| Second result for an ID | `Duplicate Hybrid source result: ${id}` |
| `revision` differs | `Hybrid source result revision mismatch for ${id}.` |
| `staticFingerprint` differs | `Hybrid source result static fingerprint mismatch for ${id}.` |
| `classicProjectionHash` differs | `Hybrid source result projection hash mismatch for ${id}.` |
| `path.sourceId !== sourceId` | `Hybrid source result payload ID mismatch for ${id}.` |
| Any snapshot source without a result | `Missing Hybrid source results: ${ids.join(", ")}` (snapshot order) |

Output is ordered by `snapshot.sources` (authored source order), independent of result arrival order. `computeHybridDirectFrame(geometry, computedAtMs = 0)` = snapshot → compute all IDs in source order → assemble. The pool's deeper geometric re-validation of worker results is in the Runtime/worker pipeline section.

Source: src/acoustics/hybrid3d/direct.ts:153-212; tests/unit/hybrid3d-direct.test.ts:42-131.

### 5.4 `HybridDirectFrame` shape

| Field | Value |
| --- | --- |
| `revision` | `baseScene.revision` |
| `classicProjectionHash` | `compatibility.classicProjectionHash` |
| `computedAtMs` | caller argument (0 in serial default and corpus) |
| `paths[]` | one `DirectPath3D` per source, source order |
| `firstOrderReflectionsBySource` | `{ [sourceId]: FirstOrderReflection3D[] }`, key insertion in source order |
| `secondOrderReflectionsBySource` | `{ [sourceId]: SecondOrderReflection3D[] }`, `[]` when the direct path is visible |

`DirectPath3D`:

| Field | Rule |
| --- | --- |
| `sourceId` | source ID |
| `routeType` | `"direct"` if `hits.length === 0`, else `"blocked"` (never `"portal"` here) |
| `directVisible` | `hits.length === 0` |
| `distanceM` | `length3(source − listener)` |
| `delayMs` | `(distanceM / 343) · 1000` |
| `directionToSource` | unit listener→source |
| `propagationDirection` | `scale3(directionToSource, −1)` |
| `azimuthDeg` | `atan2(d.x, d.z) · 180 / π` (computed `(r·180)/π`) |
| `elevationDeg` | `asin(d.y) · 180 / π` |
| `occluderWallIds` | unique `hit.wallId ?? hit.surfaceId` in sorted-hit order |
| `hits` | `SegmentPatchHit[]` sorted by distance from the source, ties `localeCompare` |

`FirstOrderReflection3D` and `SecondOrderReflection3D` are in §7.4 and §7.5.

Worked example (default project; listener (3, 1.5, 4); `radio` (9, 1.5, 4); `rain` (10, 1.5, 1.5)): `radio` is direct, `distanceM 6`, `azimuthDeg 90`; `rain` is blocked, `distanceM 7.433034373659253`, `delayMs 21.670654150610066`, `azimuthDeg 109.65382405805332`, hits `partition_center:back` at 4.141262008181584 m then `partition_center:front` at 4.3536344188575615 m, both `thicknessM 0.1`, `occluderWallIds ["partition_center"]`.

Source: src/acoustics/hybrid3d/direct.ts:19-58; probe run against the repository (Node 22.23.4).

## 6. Main-thread audible mapping

### 6.1 Context

`HybridViewportAdapter` computes, on every change of `direct.frame` or `geometry` (React `useMemo`):

- `audible = resolveHybridAudibleDirectState(geometry, direct.frame)`;
- `reflectionState = { listenerPosition: geometry.listenerPosition, reflectionsBySource: { [id]: renderHybridEarlyReflections(frame.firstOrderReflectionsBySource[id] ?? [], frame.secondOrderReflectionsBySource[id] ?? []) } }` for each source of the Classic projection of the same project;
- and pushes both to the `AudioEngine` only while the frame is `accepted` (current or pose-lagging, ADR 0008).

`geometry` is always the current pose, while `direct.frame` may be a pose-lagging frame. The audible state therefore mixes current positions/Classic route with the frame's visibility and hits (Review findings, S3).

Source: src/components/workspace/HybridViewportAdapter.tsx:97-116, 201-206.

### 6.2 `resolveHybridAudibleDirectState(geometry, frame)`

1. For every `baseScene.sources` entry: `projection = computeClassicSourceRoute(source, baseScene.listener, baseScene)` (Classic acoustics section; 2D plan, all walls full height, primitives absent because the Hybrid projection adds no footprint walls). This runs for every source, even ones with a clear 3D path.
2. For each `frame.paths` entry in order: skip it if `path.sourceId` is missing or `geometry.sourcePositions[sourceId]` is missing (stale frame after a source deletion); otherwise `resolvePath`.
3. Output: `{ audioState: { listenerPosition: geometry.listenerPosition, sourceStates: { [sourceId]: { position: virtualPosition, effectiveDistanceM, dryGainDb, lowpassHz, routeType } } }, paths: HybridAudiblePath[] }`. `HybridAudiblePath` = `{ sourceId, routeType ("direct"|"portal"|"blocked"), effectiveDistanceM, dryGainDb, lowpassHz, virtualPosition, portalIds, occluderWallIds }`.

`resolvePath(path, projection, geometry)` with `S = geometry.sourcePositions[sourceId]`, `L = geometry.listenerPosition`:

**A. Direct** (`path.directVisible`): `routeType "direct"`, `effectiveDistanceM = path.distanceM`, `dryGainDb 0`, `lowpassHz 20000`, `virtualPosition = S`, `portalIds []`, `occluderWallIds []`.

**B. Portal** (else, if `projection.routeType === "portal"`):

1. `listenerFacing = projection.portalIds.at(-1)`; `virtualPosition = portalPosition(listenerFacing)` where `portalPosition(id) = (portal.center.x, spatial3d.floorElevationM + portal.heightM · 0.5, portal.center.y)` for the Portal with that ID (open state not checked; `null` if not found or no spatial3d). **The Portal vertical bounds are ignored** (Review findings, V1).
2. `routePoints = projection.routePolyline.map((p, i) → i === 0 ? S : i === last ? L : (open Portal whose center.x === p.x && center.y === p.y, first in scene order) ? portalPosition(that) : (p.x, S.y, p.y))`.
3. Accept only if `virtualPosition` is non-null and every consecutive leg has `intersectSegmentBvh(...).length === 0` (no allowed surfaces).
4. Then: `routeType "portal"`, `effectiveDistanceM = Σ Math.hypot(leg)` (left to right), `dryGainDb = projection.dryGainDb`, `lowpassHz = projection.lowpassHz` (Classic Portal loss and low-pass), `virtualPosition`, `portalIds = projection.portalIds`, `occluderWallIds = unique(path.occluderWallIds)`.

**C. Blocked** (otherwise): `routeType "blocked"`, `effectiveDistanceM = path.distanceM`, `virtualPosition = S`, `portalIds []`, `occluderWallIds = unique(path.occluderWallIds)`, and `dryGainDb`, `lowpassHz` from the finite-patch occlusion estimate:

```text
d = path.directionToSource                                   // unit 3D
wallLosses = {low:0, mid:0, high:0}
for wallId in unique(path.occluderWallIds):                  // first-occurrence order
  wall = baseScene.walls.find(id); if none: skip             // primitives/floor/ceiling are skipped here
  material = MATERIALS.find(wall.materialId); if none: skip
  len = Math.hypot(wall.b.x − wall.a.x, wall.b.y − wall.a.y); if len === 0: skip
  nX = −(wall.b.y − wall.a.y)/len;  nZ = (wall.b.x − wall.a.x)/len
  incidence = |nX·d.x + nZ·d.z|
  tEff = wall.thicknessM / max(incidence, 0.25)              // scene thickness, not the hit's 0.1
  adj  = 6 · log2(tEff / material.referenceThicknessM)
  wallLosses[b] += max(0, material.transmissionLossDb[b] + adj)   for b in low, mid, high
primLosses = {low:0, mid:0, high:0}
hitsBySurface = Map over path.hits with no wallId, key hit.surfaceId → value hit   // later hits overwrite the value; key order = first occurrence
for hit in hitsBySurface.values():
  material = MATERIALS.find(hit.materialId); patch = bvh.patches.find(id === hit.patchId); if either missing: skip
  incidence = |patch.normal · d|
  tEff = hit.thicknessM / max(incidence, 0.25)               // primitive: min(dimensions); floor/ceiling: 0.1
  adj  = 6 · log2(tEff / material.referenceThicknessM)
  primLosses[b] += max(0, TL[b] + adj)
loss[b] = wallLosses[b] + primLosses[b]
dryGainDb = loss.mid === 0 ? 0 : −min(loss.mid, 36)
O = clamp(loss.high / 36, 0, 1)
lowpassHz = 700 · (20000 / 700) ^ (1 − O)                    // exactly 20000 when O = 0, 700 when O = 1
```

The low band is computed and never used. A closed door adds the host wall's loss (its patches carry the wall ID). Each primitive counts once, using the facet of its last (farthest-from-source) hit. Example: a 3D path over an open door through a 0.2 m concrete partition at normal incidence gives `dryGainDb −34`, `lowpassHz 700` (`tests/unit/hybrid3d-audible-direct.test.ts:125-141`).

Worked example (default project, `rain`): Portal route via `partition_door`, `virtualPosition (6, 1.05, 4)`, `effectiveDistanceM 7.771969167702955`, `dryGainDb −3`, `lowpassHz 18500`.

Source: src/acoustics/hybrid3d/audible-direct.ts:14-240; tests/unit/hybrid3d-audible-direct.test.ts:45-189.

### 6.3 Reflection taps: `renderHybridEarlyReflections(first, second = [])`

```text
tapLowpass(material):
  mid = specularReflectionAmplitude(material, "mid")
  if mid <= 1e-8: return 800
  return min(20000, max(800, 20000 · specularReflectionAmplitude(material, "high") / mid))

first-order tap: { id, order: 1, position: reflectionPoint, delayMs: reflection.delayMs,
                   gainDb: linearToDb(specularReflectionAmplitude(mat, "mid") · distanceAttenuation(pathLengthM)),
                   lowpassHz: tapLowpass(mat) }
second-order tap: { id, order: 2, position: reflectionPoints[1], delayMs, gainDb: estimatedMidGainDb,
                    lowpassHz: min(tapLowpass(mat1), tapLowpass(mat2)) }
taps = [...firstOrderTaps, ...secondOrderTaps]
  sorted (stable) by gainDb descending, then delayMs ascending, then id.localeCompare   // localeCompare site reflection-rendering.ts:59
  .slice(0, 6)
```

`delayMs` is the **absolute** path delay `L/343`, not the excess delay over the direct path (Classic uses relative delays; docs/ACOUSTICS.md acknowledges this). There is no early-reflection time window, no minimum-gain rejection, and `settings.maxEarlyReflections` is ignored. Unknown material → `materialForHybridReflection` throws `Unknown Hybrid reflection material: ${id}`. The audio tap bank later clamps each delay to [0, 0.2] s and keys tap slots by `tap.id` (Audio engine section).

Per-material values with the current registry (verified):

| Material | specular mid amplitude | tap low-pass Hz |
| --- | --- | --- |
| `concrete_hard` | 0.939592 | 20000 |
| `soft_foliage` | 0.324037 | 14615.228 |
| `water_like` | 0.952279 | 19947.720 |
| `wood_medium` | 0.806816 | 19296.934 |
| `acoustic_treatment` | 0.220619 | 12659.146 |

Worked example (default project, `radio`): taps `first:floor` (delay 19.557445867345102 ms, gain −17.07333590480626 dB), `first:boundary_east` and `first:boundary_west` (both 34.40233236151604 ms, −21.978850913175336 dB; tie broken by `localeCompare`).

Source: src/acoustics/hybrid3d/reflection-rendering.ts:1-62; src/acoustics/hybrid3d/material-energy.ts:1-24; tests/unit/hybrid3d-reflection-rendering.test.ts:41-94; src/audio/EarlyReflectionBank.ts:150-169, 309.

## 7. Reflections

### 7.1 Material energy helpers

```text
materialForHybridReflection(id) = MATERIALS.find(id) or throw "Unknown Hybrid reflection material: ${id}"
reflectionAmplitude(m, band)          = sqrt(max(0, 1 − m.absorption[band] − 10^(−m.transmissionLossDb[band]/10)))
specularReflectionAmplitude(m, band)  = reflectionAmplitude(m, band) · sqrt(1 − m.scattering)
```

Physical energy bookkeeping (absorbed + transmitted + reflected = 1, specular share `1 − s`) with preset, uncalibrated coefficients. Only `mid` (gain) and `high`/`mid` (tap low-pass) are used audibly.

Source: src/acoustics/hybrid3d/material-energy.ts:5-24.

### 7.2 Physical surfaces and representative patches

- `physicalSurfaceId(patch) = patch.wallId ?? patch.id`. Walls (all their patches, including Portal frames and slabs) map to the wall ID; floor → `"floor"`, ceiling → `"ceiling"`; **each primitive facet is its own physical surface** (`"<primitiveId>:side:0"` etc.), not the primitive ID.
- `representativePatches(bvh)`: iterate `bvh.patches` in compile order; drop any patch with a `wallId` whose id does not end with `":front"`; drop repeats of the same physical surface ID. Result: floor, ceiling (if present), each wall's `:front` patch, every primitive facet. Portal frames and slabs never reflect.
- Wall reflections are therefore always evaluated on the `:front` plane, offset `+thicknessM/2` along the wall normal, for sources on either side (Review findings, V3).

Source: src/acoustics/hybrid3d/reflections.ts:29-42; tests/unit/hybrid3d-primitives.test.ts:33-40.

### 7.3 Image source, image ray and leg visibility

```text
reflectedPoint(s, patch) = s − normal · (2 · dot(s − v0, normal))
imageRayIntersection(image, l, patch): §2.5 (no opening check)
reflectionLegIsVisible(a, b, bvh, allowedSurfaceIds) =
  !hasSegmentBvhHit(a, b, bvh, hit → !allowed.has(hit.wallId ?? "") && !allowed.has(hit.patchId))
```

A hit is ignored when its wall ID or its patch ID is allowed. Allowing a wall ID makes every patch of that wall transparent for the leg (so a back-side reflection leg passes through the wall's interior to reach the `:front` plane); allowing `"floor"` or a primitive facet ID only removes that patch. Hits at the leg endpoints are already excluded by the `t` bounds.

Source: src/acoustics/hybrid3d/reflections.ts:44-73; tests/unit/hybrid3d-visibility.test.ts:38-66.

### 7.4 First-order: `findFirstOrderReflections3D(s, l, bvh)`

```text
direct = length3(s − l)
for patch in representativePatches(bvh):
  sid = physicalSurfaceId(patch)
  q = imageRayIntersection(reflectedPoint(s, patch), l, patch); if null: continue
  if !legVisible(s, q, [sid]) or !legVisible(q, l, [sid]): continue
  L = length3(s − q) + length3(q − l)
  emit { id: "first:" + sid, surfaceId: sid, patchId: patch.id, materialId: patch.materialId,
         reflectionPoint: q, pathLengthM: L, delayMs: L/343·1000,
         excessDelayMs: (L − direct)/343·1000, arrivalDirection: normalize3(q − l) }
sort (stable) by pathLengthM ascending, ties id.localeCompare          // localeCompare site reflections.ts:106
```

No count cap (every representative surface is tested, two any-hit queries each) and no gain threshold; the tap renderer caps at six later. `arrivalDirection` points from the listener to the reflection point.

Worked example (default project, source (9, 1.5, 2), listener (8, 1.5, 6)): `first:ceiling` and `first:floor` both 5.0990195135927845 m (tie → `ceiling` first); `first:partition_center` at q = (5.9, 1.5, 4.384615…), L = 6.560487786742689 m (computed on the west `:front` face although the source is east of the wall).

Source: src/acoustics/hybrid3d/reflections.ts:17-27, 75-108; tests/unit/hybrid3d-reflection.test.ts:11-78.

### 7.5 Second-order pair: `solveSecondOrderReflectionPair(s, l, first, second, bvh)`

```text
s1 = physicalSurfaceId(first); s2 = physicalSurfaceId(second); if s1 === s2: return null
i1 = reflectedPoint(s, first); i2 = reflectedPoint(i1, second)
q2 = imageRayIntersection(i2, l, second);  if null: return null
q1 = imageRayIntersection(i1, q2, first);  if null: return null
require legVisible(s, q1, [s1]) && legVisible(q1, q2, [s1, s2]) && legVisible(q2, l, [s2])
L = length3(s − q1) + length3(q1 − q2) + length3(q2 − l)
return { id: "second:" + s1 + ">" + s2, surfaceIds: [s1, s2], patchIds: [first.id, second.id],
         materialIds: [first.materialId, second.materialId], reflectionPoints: [q1, q2],
         pathLengthM: L, delayMs: L/343·1000, excessDelayMs: (L − length3(s − l))/343·1000,
         estimatedMidGainDb: linearToDb(a(first) · a(second) · distanceAttenuation(L)),
         arrivalDirection: normalize3(q2 − l) }
where a(p) = specularReflectionAmplitude(materialForHybridReflection(p.materialId), "mid")
```

Openings are not checked at either reflection point. Ordered pairs: `A>B` and `B>A` are distinct paths.

Source: src/acoustics/hybrid3d/second-order.ts:25-37, 87-137; tests/unit/hybrid3d-second-order.test.ts:42-62.

### 7.6 Runtime bounded search: `findPrunedSecondOrderReflections3D(s, l, bvh, options)`

1. `all = representativePatches(bvh)`.
2. `patches` = copy of `all` sorted (stable) by `length3(reflectedPoint(s, p) − l)` ascending, ties `physicalSurfaceId(left).localeCompare(physicalSurfaceId(right))` (**localeCompare site second-order.ts:82**), then `.slice(0, Math.max(2, Math.floor(maxRepresentativePatches ?? 24)))`.
3. `maxPathLengthM = options.maxPathLengthM ?? 50`, `minEstimatedGainDb = options.minEstimatedGainDb ?? −36`, `maxCandidates = options.maxCandidates ?? 6`.
4. For `first` in `patches`, for `second` in `patches` (both in sorted order):
   - skip if same physical surface (not counted);
   - `orderedPairs += 1`;
   - `imageLengthM = length3(reflectedPoint(reflectedPoint(s, first), second) − l)`; if `imageLengthM > maxPathLengthM`: `pathLengthPruned += 1`, continue;
   - if `linearToDb(a(first)·a(second)·distanceAttenuation(imageLengthM)) < minEstimatedGainDb`: `energyPruned += 1`, continue;
   - `evaluatedPairs += 1`; solve the pair; collect non-null paths.
5. `ranked` = paths sorted (stable) by `pathLengthM` ascending, ties `id.localeCompare` (**second-order.ts:59**); `selected = ranked.slice(0, Math.max(0, maxCandidates))`.
6. Return `{ paths: selected, stats: { availablePatches: all.length, consideredPatches: patches.length, orderedPairs, pathLengthPruned, energyPruned, evaluatedPairs, validPaths: ranked.length, topKPruned: ranked.length − selected.length } }`.

Bounds: at most 24·23 = 552 ordered pairs per blocked source, three any-hit queries per solved pair. For a valid specular path `imageLengthM` equals the unfolded path length, so pruning is consistent with the final gain. Two concrete reflections never fall below −36 dB (0.939592² · 0.02 at the 50 m attenuation clamp is −35.06 dB), so only the 50 m gate prunes them; two `acoustic_treatment` reflections (0.220619²) are energy-pruned beyond about 3.07 m. The runtime only calls this when the 3D direct path is blocked. Stats are corpus outputs.

Source: src/acoustics/hybrid3d/second-order.ts:49-54, 56-93, 166-224; tests/unit/hybrid3d-second-order.test.ts:64-130.

### 7.7 Oracle and evaluation (tests/benchmarks only)

- `findExhaustiveSecondOrderReflections3D`: every ordered pair of all representative patches, no pruning; throws `Exhaustive second-order reference is limited to 32 physical patches.` above 32 representatives; sorted like §7.6 step 5.
- `evaluateSecondOrderCandidate(reference, candidate)`: matches by `id`; `recall = |TP|/|ref|` (1 if ref empty); `precision = |TP|/|cand|` (if cand empty: 1 when ref empty else 0); `delayRmseMs = sqrt(Σ(Δdelay²)/|TP|)` (0 if none); `retainedMidEnergyRatio = Σ_TP 10^(g_ref/10) / Σ_ref 10^(g/10)` (1 if reference energy ≤ 0).

Source: src/acoustics/hybrid3d/second-order.ts:139-164; src/acoustics/hybrid3d/second-order-evaluation.ts:1-43.

## 8. Room and late field in Hybrid

Hybrid computes no audible room or late-field parameters:

- `estimateRoomAcoustics(scene, { ceilingEnabled })` (Classic acoustics section) is evaluated in the adapter only for the status bar's `rt60MidS`.
- `AudioEngine.applyHybridDirectState` and `applyHybridReflectionState` call `clearClassicFrame()`; the Schroeder reverb's `apply(room)` runs only with an accepted Classic frame. In Hybrid the reverb therefore keeps its last parameters: construction defaults (RT60 0.8 s, comb damping 20 kHz, wet return 0.28) if no Classic frame was applied in this graph, otherwise the last Classic room. The per-source reverb send keeps its last value (initial −12 dB, or the last Classic `reverbSendDb`).
- UNVERIFIED by tests: no unit test asserts reverb parameters while Hybrid state is held.

Source: src/components/workspace/HybridViewportAdapter.tsx:207-225; src/audio/AudioEngine.ts:148-180, 440-449, 479-512; src/audio/SchroederReverb.ts:37-46, 95-150, 184-197; src/audio/SourceGraph.ts:145, 255-299.

## 9. Data-only P5/P6/P7 helpers

None of these modules is imported by anything under `src/` outside `src/acoustics/hybrid3d/`, so none reaches the worker, the audible runtime, or the UI. Verified with `grep -rnE "receiver-connection|six-band-materials|atmosphere|directional-late-field" src` (no hits outside `hybrid3d`); within `hybrid3d` only `directional-late-field.ts` and `receiver-connection-benchmark.ts` import `receiver-connection.ts`. Their only importers are `tests/unit/hybrid3d-*.test.ts`. `second-order-evaluation.ts` is imported by a test and `benchmarks/corpus/harness/ts-serial-adapter.ts` only.

| Phase | Module | Computes | Inputs → outputs |
| --- | --- | --- | --- |
| P5 | `receiver-connection.ts` | Fibonacci-sphere directions; single-bounce "receiver connections"; progressive energy accumulator | `fibonacciSphereDirections(count ∈ 1..8192 integer, rotation = 0)` → unit vectors; `fibonacciProgressiveDirections(count, frameIndex ≥ 0)` (rotation `frameIndex·GOLDEN_ANGLE`); `traceReceiverConnections3D(source, listener, directions, bvh, maxDistanceM = 50)` → `ReceiverConnection3D[]` `{ id "receiver:${i}:${surfaceId}", sampleIndex, surfaceId, point, pathLengthM, delayMs, arrivalDirection, estimatedMidGainDb }`; `ProgressiveReceiverAccumulator.add(signature, sampledCount, connections)` → snapshot `{ sceneSignature, frameCount, sampledDirectionCount, connectionCount, accumulatedMidEnergy }` |
| P5 | `receiver-connection-benchmark.ts` | Stationary convergence metrics over frames and sample budgets | `benchmarkReceiverConnectionStationary({ sceneSignature, source, listener, bvh, sampledDirectionCount, frameCount 1..120, maxDistanceM?, startFrameIndex? })` → `{ frames[], progressive, metrics { frameCount, sampledDirectionCount, totalSampleCount, totalConnectionCount, connectionRate, meanMidEnergyPerDirection, frameEnergyCoefficientOfVariation, p95FrameToFrameEnergyDeltaDb } }`; budgets `[128, 512, 2048, 8192]` |
| P6 | `six-band-materials.ts` | Log-frequency projection of 3-band materials to 125–4000 Hz; per-band energy split and assertion | `projectMaterialToHybridSixBands(material)` → `{ id, displayName, absorption, transmissionLossDb, scattering (constant), referenceThicknessM, source: "v1-log-frequency-projection" }`; `hybridBandEnergy(material, band)` → `{ absorption, transmission, reflection, specular, diffuse, total }` |
| P6 | `atmosphere.ts` | Temperature sound speed, time of flight, ISO 9613-1-style air absorption | `speedOfSoundForAtmosphere({temperatureC, relativeHumidity, pressurePa})` → m/s; `atmosphereTimeOfFlightSeconds(d, atm)`; `segmentedAtmosphereTimeOfFlightSeconds(segments)`; `airAbsorptionDbPerMeter(f, atm)`; `airAbsorptionLossDb(d, f, atm)` |
| P7 | `directional-late-field.ts` | Direction × delay histogram of receiver connections | `buildDirectionalLateFieldHistogram(connections, { directionCount 12\|24 = 12, timeBinMs (0,100] = 10, minimumDelayMs ≥ 0 = 0, maximumDelayMs (min, 2000] = 500 })` → `{ directionCount, timeBinMs, minimumDelayMs, maximumDelayMs, inputConnectionCount, retainedConnectionCount, discardedConnectionCount, inputMidEnergy, retainedMidEnergy, directionalEnergyCentroid (unit or null), cells[] }` |

Key formulas:

- `GOLDEN_ANGLE = π·(3 − √5)`; direction i: `y = 1 − 2(i + 0.5)/count`, `r = sqrt(max(0, 1 − y²))`, `az = GOLDEN_ANGLE·i + rotation`, `(cos az · r, y, sin az · r)`.
- Receiver connection: first ray hit (sorted list `[0]`); `surfaceId = physicalSurfaceId(patch)`; skip if `|listener − point| ≤ 1e-8` or the listener leg is blocked (allowed `[surfaceId]`); `L = hit.distanceM + |listener − point|`; `amplitude = reflectionAmplitude(mat, "mid") · (0.1 + 0.9·scattering) · distanceAttenuation(L)` (heuristic diffuse weight, not a Lambert model); gain `linearToDb(amplitude)`.
- Benchmark: energy `10^(g/10)` summed; per-direction energy divides by emitted directions; CV = population std / mean (0 if mean ≤ 1e-16); p95 = sorted[`max(0, ceil(0.95·n) − 1)`]; frame delta `|10·log10((next + 1e-16)/(prev + 1e-16))|` (0 if both ≤ 1e-16).
- Six-band: anchors low 250, mid 1000, high 4000 Hz; at or below 250 → low, at or above 4000 → high, otherwise linear in `log2 f` between the bracketing anchors (125 Hz = low, 500 Hz = (low+mid)/2, 2000 Hz = (mid+high)/2). Assertion per band: finite total, absorption and transmission and scattering in [0, 1], `|total − 1| ≤ 1e-8`; error `Hybrid six-band material energy is invalid for ${id}.${band}.`.
- Atmosphere: `c = 331.3 + 0.606·T` (343.42 m/s at 20 °C, unlike the 343 used everywhere else); envelope T ∈ [−20, 50] °C, RH ∈ [0, 1], p ∈ [80 000, 110 000] Pa, f ∈ [20, 20 000] Hz, d ∈ [0, 10 000] m (out-of-range throws). Absorption: `T = T°C + 273.15`, `T0 = 293.15`, `T01 = 273.16`, `pr = 101325`, `psat = pr·10^(−6.8346·(T01/T)^1.261 + 4.6151)`, `h = RH·psat/p` (**RH as a fraction, see V4**), `frO = (p/pr)(24 + 40400·h(0.02+h)/(0.391+h))`, `frN = (p/pr)(T/T0)^−0.5 (9 + 280·h·exp(−4.17((T/T0)^(−1/3) − 1)))`, `α = 8.686 f² [1.84e-11 (pr/p) sqrt(T/T0) + (T/T0)^−2.5 (0.01275 e^(−2239.1/T)/(frO + f²/frO) + 0.1068 e^(−3352/T)/(frN + f²/frN))]` dB/m. Default atmosphere 20 °C, 0.5, 101 325 Pa.
- Late field: nearest direction = first index with the strictly largest dot product; retained if `min ≤ delay < max`; bin `floor((delay − min)/timeBinMs)`; cells sorted by time bin then direction index; `endDelayMs = min(start + timeBinMs, max)`; centroid = energy-weighted arrival sum, `null` if its length ≤ 1e-16.

Source: src/acoustics/hybrid3d/receiver-connection.ts:1-141; src/acoustics/hybrid3d/receiver-connection-benchmark.ts:1-162; src/acoustics/hybrid3d/six-band-materials.ts:1-118; src/acoustics/hybrid3d/atmosphere.ts:1-106; src/acoustics/hybrid3d/directional-late-field.ts:1-149; tests/unit/hybrid3d-receiver-connection*.test.ts, hybrid3d-six-band-materials.test.ts, hybrid3d-directional-late-field.test.ts.

## 10. Corpus coverage (what a port is held to)

`benchmarks/corpus/v1` (frozen 2026-11-06) runs these Hybrid kinds through `benchmarks/corpus/harness/ts-serial-adapter.ts`:

| Kind | Output checked |
| --- | --- |
| `hybrid-frame` | `staticGeometryHash`; the full `HybridDirectFrame` (`computeHybridDirectFrame(geometry, 0)`); `audible` (`resolveHybridAudibleDirectState`); `earlyTapsBySource` (`renderHybridEarlyReflections` per source) |
| `hybrid-visibility` | per query `hits` (`intersectSegmentBvh`), `hasHit`, `reverseHasHit`, and with an allowed list `hasHitAccepted` (harness predicate `!allowed.includes(hit.wallId ?? "")`, no patch-ID check) and `legVisible` (`reflectionLegIsVisible`) |
| `hybrid-second-order` | `exhaustive`, `pruned.paths`, `pruned.stats`, `evaluation` |
| `hybrid-patch` | one `makePatch3` result (vertices, normal, AABB, thickness, openings, ids) or its error |
| `hybrid-tape` | per step `staticGeometryHash`, `classicProjectionHash`, frame |

Comparison: IDs, enums, booleans, hashes, integer counts, array order and length, `error.name`/`error.message` exact; every continuous field (distances, delays, points, directions, gains, cut-offs, ratios) within absolute 1e-5; `azimuthDeg` circular with period 360 and 1e-5. Array order is compared by index, so tie-breaks (`localeCompare`, distance ties) must match; `LC02_MIXED_CASE_TIE_HYBRID` pins first- and second-order ties on IDs that differ in case, `-` and `_`. The README lists `bvh.ts:42, 79, 156` and `second-order.ts:82` as `localeCompare` sites no case catches when mutated singly, and `MIN_LOWPASS_HZ` (800) as unreachable.

Source: benchmarks/corpus/README.md; benchmarks/corpus/v1/comparison-rules.json; benchmarks/corpus/harness/ts-serial-adapter.ts:65-122, 220-222, 298-325.

## 11. Comparison with docs/ACOUSTICS.md

| Doc statement | Code | Verdict |
| --- | --- | --- |
| Hybrid loss cap 36 dB (table, line 12) | `MAX_DIRECT_LOSS_DB = 36` | Agrees |
| §7: route loss `TL_route = Σ TL_eff` | Each band term is clamped `max(0, TL + adj)` before summing; Hybrid adds a separate primitive term | Doc omits the clamp |
| §9: "Reject taps with negligible gain or delay above the configured early-reflection window" | Hybrid renderer has no window and no gain floor and ignores `maxEarlyReflections` | Disagrees for Hybrid |
| §9.0.1: 24 surfaces / 552 pairs, 50 m, −36 dB, six candidates, only with blocked direct visibility | Matches `direct.ts:141-148` and `second-order.ts` | Agrees |
| §9.1: "Direct-path hits retain the primitive surface ID, registered material, local thickness estimate, and incidence" | Hits carry surface, material and thickness; incidence is computed later from the facet normal | Wording: incidence is not stored |
| Line 19: "Hybrid Portal sound uses a planar candidate lifted into 3D with each leg checked against the finite BVH" | True, but the lift height ignores Portal vertical bounds | Incomplete (V1) |
| §5 note: Hybrid records use absolute `L/343` delays forwarded to taps | `reflection-rendering.ts:38, 47` | Agrees |
| §574 overlay label: azimuth `atan2(x, z)`, elevation `asin(y)` | `direct.ts:84-85` | Agrees |
| Line 21: P5/P6/P7 are data-only | No runtime importers | Agrees; doc does not mention the humidity-unit defect |

## Review findings

### Verified

- **V1** `src/acoustics/hybrid3d/audible-direct.ts:104-116`: `portalPosition` lifts the Portal to `floor + heightM/2` and ignores `portalVerticalBoundsM`. An elevated opening (probe: bottom 0.9 m, top 2.4 m, so `heightM 1.5`) puts the lifted point at 0.75 m, below the sill. The 3D leg check fails and an open Portal route becomes `blocked` at −34 dB/700 Hz; with bottom 0 and top 1.5 the same scene routes through the Portal. The HRTF virtual height is also wrong.
- **V2** `src/acoustics/hybrid3d/reflections.ts:49-61` (used by `second-order.ts:108-110`): `imageRayIntersection` does not exclude Portal openings. Specular reflections are produced at points inside open doorways. Probe: a reflection at (0, 1, 0) inside a 1 m door was returned.
- **V3** `src/acoustics/hybrid3d/reflections.ts:33-42`: only `:front` patches represent a wall, and its legs ignore the whole wall. Back-side reflections are computed on the far face, `thicknessM` too deep. Probe: source (9, 1.5, 2), listener (8, 1.5, 6), 0.2 m partition at x = 6 gave q.x = 5.9 and L = 6.5605 m, against 6.2482 m on the correct face (x = 6.1). Corpus v1 pins this behaviour.
- **V4** `src/acoustics/hybrid3d/atmosphere.ts:197`: the molar water-vapour concentration is computed with RH as a fraction; ISO 9613-1 uses percent. At 20 °C, 50 %, 101 325 Pa the code gives 3.50 dB/km at 1 kHz and 5.91 dB/km at 4 kHz, against the ISO 4.67 and 29.67. The tests (`hybrid3d-six-band-materials.test.ts:67-76`) check only finiteness and monotonicity. Data-only, not audible.
- **V5** `src/acoustics/hybrid3d/direct.ts:141-148` vs `src/domain/workspace/projections.ts:120-123`: the projected `propagation3d.maxReflectionOrder: 1` and `receiverConnection: false` are ignored; second order always runs for blocked sources. The declared config is misleading.
- **V6** `src/acoustics/hybrid3d/compile.ts:173-184, 126-146` with `geometry.ts:193`: wall and Portal-frame patches use the 0.1 m default thickness, so `SegmentPatchHit.thicknessM` for wall hits is always 0.1 (corpus-pinned). The audible estimate reads `wall.thicknessM` instead, so the field is misleading.
- **V7** `src/acoustics/hybrid3d/compile.ts:133-147` and `audible-direct.ts:51-72`: closed-Portal slabs carry the host wall ID and material. Closed-door transmission equals the host wall's loss at the wall's thickness, and the authored Portal thickness changes geometry only.
- **V8** `src/acoustics/hybrid3d/audible-direct.ts:73-90`: the primitive loss keeps the last (exit) hit per primitive through Map value overwrite and counts each primitive once regardless of chord length. The low-band total (`:66-69`, `:91-95`) is computed and never used.
- **V9** `bvh.ts:42, 79, 156`, `reflections.ts:106`, `second-order.ts:59, 82`, `reflection-rendering.ts:59`: `localeCompare()` without a locale makes tie order depend on the host locale. `Intl.Collator("da")` reorders `Ab`/`ab` and `aa`/`ac`, and `idSchema` allows such IDs.
- **V10** `src/acoustics/hybrid3d/compile.ts:31-38, 52-74`: the static hash depends on `JSON.stringify` key insertion order of authored objects and hashes only `charCodeAt(0)` per code point, so astral siblings collide. Not canonical across implementations.
- **V11** `src/acoustics/hybrid3d/reflection-rendering.ts:27-62`: no early-reflection window, no gain floor, `settings.maxEarlyReflections` ignored, absolute delays. This diverges from Classic and from docs/ACOUSTICS.md §9.
- **V12** Test-only or duplicated code: `computeHybridDirectPaths` (`direct.ts:92`); the oracle `findExhaustiveSecondOrderReflections3D` and `MAX_REFERENCE_SECOND_ORDER_PATCHES`; `intersectRayBvh`/`intersectRayPatch` (P5 only); literals `6`/`24` at `direct.ts:147` duplicate `DEFAULT_SECOND_ORDER_*`; a stale stacked doc comment at `compile.ts:50-51`.
- **V13** Unknown materials are handled two ways: `material-energy.ts:7` throws (second-order pruning, tap rendering), while `audible-direct.ts:55, 77-78` silently skips them, so loss becomes 0 dB.
- **V14** `src/acoustics/hybrid3d/audible-direct.ts:215-218`: the Classic Portal graph search runs on the main thread for every source on every frame or pose change, including sources with a clear path. The pool's re-validation repeats reflection solves on the main thread too (Runtime/worker pipeline section).
- **V15** `src/acoustics/hybrid3d/compile.ts:14`: a pure geometry module imports `jsonEqual` from `frame-acceptance.ts`, an inverted dependency.

### Suspected

- **S1** `src/domain/scene-document/validate.ts:119-128`, `src/domain/workspace/spatial-validation.ts:119-122`: primitive IDs are unique only among primitives. A primitive sharing a wall ID duplicates the patch IDs `${id}:top`/`${id}:bottom`, and `bvh.patches.find` in `audible-direct.ts:78` may then pick the wall's patch. A wall named `floor` or `ceiling` (allowed by `idSchema`) collides with the room surfaces' physical IDs (`reflections.ts:29-41`): its front is dropped from the representatives and allowed sets leak.
- **S2** `src/acoustics/hybrid3d/compile.ts:257-266`: the cache compares inputs with key-order-insensitive `jsonEqual` but hashes key-order-sensitive JSON. A key-order-only change keeps the old hash, so `geometry.staticGeometryHash` can differ from `hybridStaticGeometryHash(document)`. The cache also holds references to document objects, so in-place mutation would go unnoticed.
- **S3** `src/components/workspace/HybridViewportAdapter.tsx:106-116`: a pose-lagging `direct.frame` is combined with the current geometry. Visibility, hits and incidence come from the old pose, while virtual position, Portal legs and Classic route use the new one. UNVERIFIED whether ADR 0008 intends this for the audible direct state.
- **S4** `compile.ts` throws on degenerate geometry (first three room-polygon vertices collinear, zero-height wall or Portal, zero thickness), which fails the whole frame; only upstream validation prevents it.
- **S5** `src/workers/hybrid-direct-pool.ts:279, 351` require `excessDelayMs ≥ 0`; a grazing reflection with a tiny negative excess from rounding would reject the worker result and force the serial path.
- **S6** `src/acoustics/hybrid3d/audible-direct.ts:127-129`: route points match Portals by exact centre equality, so two open Portals with the same centre resolve to the first.
- **S7** Rounding in the BVH slab test (`geometry.ts:123-143`, no padding on non-parallel axes) could prune a hit that brute force finds when a segment touches an AABB face exactly.

### Missing tests

- Elevated Portal audible routing (V1).
- Reflections at points inside openings (V2).
- Back-face reflection plane (V3).
- ISO 9613-1 table values (V4).
- `maxReflectionOrder` handling (V5).
- Multi-facet primitive loss (V8).
- Reverb state while Hybrid state is held (§8).
- Locale-dependent ordering (V9).
- The `localeCompare` sites the corpus leaves unpinned (`bvh:42/79/156`, `second-order:82`).

### Do not copy into a rewrite

Unless v1 corpus parity is required, do not copy V1–V4, V6, V9 or V10. Also drop the 0.1 m placeholder hit thickness, the two-sided `:front`-only reflection plane, and default-locale collation.

## Rewrite notes

**Must be preserved for numerical parity with corpus v1** (continuous values within 1e-5, everything discrete exact):

1. Coordinate mapping (§1.1), `c = 343`, every `1e-8` epsilon at the exact place and comparison direction given (§2.4–2.6), and inclusive polygon edges and opening bounds.
2. Patch emission order, patch IDs, vertex order, normal formula, `surfaceId`/`wallId`/thickness assignment including the 0.1 default (§3.2–3.4). These feed `hits`, `patchIds`, `normal` and the hash.
3. Representative selection and physical-surface IDs (§7.2), leg-allowance semantics (§7.3), first-order and second-order formulas, the pruning order of tests and counting (stats are pinned), top-6, and the two second-order constants passed by the frame path.
4. Sort keys and tie-breaks, with ICU root/en tertiary collation for IDs (`_ < - < : < > < digits < letters`, letters compared case-insensitively before lowercase-first), on all seven `localeCompare` sites. Pin the collator locale instead of using the host default.
5. V8 `Math.hypot` (max-normalised Kahan sum) wherever `length3`/`hypot` is used. Ties such as `first:boundary_north` vs `first:boundary_south` differ in the last bit.
6. `atan2` and `asin` with IEEE signed-zero behaviour (`DH02`, `DH03`).
7. Static hash: identical input object construction and key order, ECMAScript `JSON.stringify` number formatting, UTF-16 `toSorted` for `disabledSurfaceIds`, FNV-1a over code points using the first UTF-16 unit, 8-digit lowercase hex. This needs an insertion-ordered JSON writer with JS number formatting (for example ryu-js) in Rust.
8. Audible mapping (§6.2): Classic route reuse, Portal lift formula (including V1 for parity), loss formula with per-band `max(0, ·)` clamps, the 36 dB cap, `loss.mid === 0 ? 0` (avoids −0), the 700 · (20000/700)^(1−O) mapping, and Map-overwrite primitive semantics.
9. Tap rendering (§6.3): absolute delays, first-order gain formula, second-order gain passthrough, min low-pass of the two materials, sort, cap of 6.
10. Error messages verbatim (`error.message` is compared exactly): §3.8, §5.1, §5.3, §7.1, §7.7.
11. Output ordering by authored source order, record key sets (the optional `wallId` key is absent, not null, when there is no wall), and empty arrays for visible sources' second order.

**Incidental (free to change without affecting outputs):** BVH leaf size and split heuristic, as long as hit sets are identical (sorted output makes traversal order unobservable; see S7); the any-hit early exit; the one-entry compile cache and `jsonEqual` fast path; the worker/serial split; computing first-order reflections for every surface rather than pruning early; the oracle, the evaluation helper, and all P5/P6/P7 modules (not audible; P6 atmosphere should be fixed, V4, before any use); internal object identity and immutability; the exact code layout of `estimateFinitePatchOcclusion` lookups.
