# 02 — Classic 2.5D acoustic model

This section specifies the Classic ("classic-2d5d") acoustic calculation: plan-view geometry, direct-path occlusion, Portal routing, first-order and bounded second-order image-source reflections, the six shared early-reflection taps, the three-band Eyring room estimate, the per-source frame assembly, and the static-context fingerprint. It is a pure, synchronous, deterministic function of a `SceneSpec` v1 (plus the host collation locale, see §1.3).

Neighbouring sections:

- **Domain model**: full `SceneSpec` v1 schema, validation, material registry, projections (`projectClassicScene`), primitive footprint walls, key order of produced scenes.
- **Runtime/worker pipeline**: source Worker pool, sharding, coalescing, result validation, serial fallback, frame acceptance (ADR 0008 pose-lagging frames).
- **Audio engine**: how `AcousticFrame` drives gains, filters, panners, the six-tap bank and the Schroeder reverb.
- **Hybrid 3D acoustics**: reuses `computeClassicSourceRoute` (§7) for its Portal candidate and `estimateRoomAcoustics` (§10) with `ceilingEnabled`.
- **Frontend UI**: overlays that draw `routePolyline`, reflection points and room values.
- **Backend/AI/infra/tests**: corpus harness and CI.

Everything here was checked two ways. I read the source. I also wrote an independent re-implementation of the algorithm exactly as specified below (in the authoring scratchpad, not in the repository) and compared it with all 27 frozen `classic-frame` corpus cases (`benchmarks/corpus/v1`). It matched every number bit for bit (max abs difference 0), every id, every array order, and every `staticFingerprint`.

---

## 1. Conventions

### 1.1 Units and coordinates

| Quantity | Unit | Notes |
| --- | --- | --- |
| Plan coordinates `x`, `y` | m | Top-down plan. Walls are zero-thickness, full-height line segments. Classic has no source or listener height. |
| Room height, portal height | m | Used only for areas and volume in §10 |
| Delay | ms | Always `L / 343 m/s · 1000` |
| Gain, loss | dB | Gains ≤ 0 in this model |
| Cutoff | Hz | Low-pass corner frequency handed to the audio engine |
| Turn angle | rad | Portal routing only |

"2.5D" means that plan geometry is 2D and the third dimension enters only through room height (volume, wall and ceiling areas) and portal height (opening area). The floor and ceiling produce no reflections in Classic; they enter only the RT60 estimate.

No azimuth or elevation is computed in Classic. `listener.headingDeg` is **not read** by any Classic acoustic function. The audio engine turns `virtualPosition` and `reflectionPoint` into panner coordinates: `X = p.x − listener.x`, `Y = 0`, `Z = −(p.y − listener.y)`. The Audio engine section owns that mapping and the heading handling.

### 1.2 Numeric semantics that matter for parity (JavaScript, V8)

All arithmetic is IEEE-754 binary64. The reference implementation runs on V8 (Node 22 / Chromium).

| Construct | Exact semantics required |
| --- | --- |
| `Math.hypot(dx, dy)` | V8 algorithm, **not** `sqrt(dx²+dy²)` and not C `hypot`. Let `ax = abs(dx)`, `ay = abs(dy)`, `m = max(ax, ay)`. If `m = +∞` → `+∞`; if either is NaN → NaN; if `m = 0` → `0`. Otherwise Kahan-sum over `[ax, ay]` in argument order, starting `sum = 0, comp = 0`: `n = v/m; summand = n·n − comp; pre = sum + summand; comp = (pre − sum) − summand; sum = pre`. Result `sqrt(sum) · m`. I confirmed empirically that this matches `Math.hypot` on 200 000 random pairs (0 mismatches). Naive `sqrt(x²+y²)` differs in about 36 % of cases by 1 ulp. |
| `Math.sqrt` | Correctly rounded (same in any IEEE language). |
| `Math.log`, `Math.log2`, `Math.log10`, `Math.acos`, `x ** y` | V8 uses fdlibm-derived implementations. UNVERIFIED: whether a given Rust libm (`std` or the `libm` crate) is bit-identical. Last-ulp differences are inside the corpus tolerances (§16), but they can flip exact-tie orderings (§9). |
| `Math.max/min` | NaN propagates. `Math.max(0, −0) = +0`. `Math.max(a, b)` with `a = −0, b = +0` → `+0`. |
| `a − b \|\| tiebreak` | The tiebreak runs only when the difference is exactly ±0 or NaN (both are falsy). |
| `Array.prototype.sort` | Stable. A comparator result of NaN counts as 0. |
| String `<`, `>` | Lexicographic over UTF-16 code units ("code-unit order"). |
| `localeCompare` | ICU collation with the host default locale (§1.3). |
| `-0` | Can appear in outputs (§6.4). `JSON.stringify(-0)` is `"0"`. |
| `JSON.stringify` | Used for the fingerprint (§12). Requires exact ECMAScript formatting. |

### 1.3 Two collation regimes

The Classic model mixes two string orderings. A port must reproduce both.

- **Code-unit order** (`<`/`>` on UTF-16 code units, equal to byte order for ASCII): crossing ties (§3.6), Portal ordering and tie-breaks (§6).
- **`localeCompare`** (no locale argument, so the host default; reference: Node v22.23.4, ICU 78.3, `en-US`, `sensitivity: "variant"`, `ignorePunctuation: false`, `numeric: false`, `caseFirst: "false"`): reflection ranking ties (§8.3, §8.5, §9), the second-order surface pre-sort (§8.5), and boundary-wall selection for RT60 (§10).

`localeCompare` call sites in scope, each called as `a.localeCompare(b)` with no further arguments:

| Site | Left operand | Right operand |
| --- | --- | --- |
| `src/acoustics/image-source.ts:151` | `a.wallId` | `b.wallId` |
| `src/acoustics/image-source.ts:225` | `left.id` | `right.id` |
| `src/acoustics/image-source.ts:238` | `left.wallIds?.join(">") ?? left.wallId` | same for `right` |
| `src/acoustics/compute-frame.ts:158` | `left.wallIds?.join(">") ?? left.wallId` | same for `right` |
| `src/acoustics/room-acoustics.ts:62` | `left.id` | `right.id` |

IDs that reach these sites use the validated alphabet `[A-Za-z0-9_-]` (Domain model). Classic primitive footprint walls also add `:` (ids `primitive:<id>:<index>`), and second-order keys add `>`. For these characters, ICU root/en collation gives this order. I verified it by probing `localeCompare` in Node with the strings listed under the algorithm.

1. Compare the **primary** sequence left to right, case-insensitive, with this order: `_` < `-` < `:` < `>` < `0` < … < `9` < `a`/`A` < … < `z`/`Z`. A string that is a proper prefix of the other sorts first.
2. Only if all primaries are equal, compare **tertiary** (case) left to right: lowercase < uppercase. Non-letters have equal tertiary weight.
3. Otherwise the strings are equal, which in this alphabet means identical.

Probe results (ICU order): `_x  -x  >x  0x  a  a_  a_c>d  a-  a-b  a-B  A-b  a>b  a0  a9  az  aZ  edge_1  edge_a  Edge_b  edge-1  wall-10  wall-9` and `p  p_a  p-a  p:a  p>a  p0  pa  pA  primitive_box  primitive:box:0  primitive:box:10  primitive:box:2`. Code-unit order of the first list is `-x  0x  >x  A-b  Edge_b  _x  a  a-  a-B  a-b  a0  a9  a>b  aZ  a_  a_c>d  az  edge-1  edge_1  edge_a  wall-10  wall-9`.

The corpus README records that outputs did not change under collation locales en, zh-TW, de, sv, cs, et, lt, da and tr. UNVERIFIED for other locales.

### 1.4 Classification of model parts

| Class | Parts |
| --- | --- |
| Physical relation, within model assumptions | Delay `L/c`, `c = 343 m/s`. Specular image-source geometry. Spherical-spreading amplitude `1/L` for reflections. Energy bookkeeping `ρ = 1 − α − τ`, `τ = 10^(−TL/10)`. dB↔amplitude `20·log10`. Eyring `RT60 = 0.161·V / (−S·ln(1−ᾱ))` (statistical, diffuse-field). Shoelace area. |
| Numerical approximation | Zero-thickness full-height walls. Planar ε tolerances with t/u clamping. Volume = floor area × height (partitions and primitives not subtracted). `ᾱ` clamped below 1. RT60 clamp [0.12, 4] s. dB floor at amplitude 1e-8. |
| Engineering optimization or bound | Six taps. 24-surface second-order budget. Second-order only when direct is blocked. 50 m second-order path limit. −36 dB second-order floor. −60 dB first-order floor. 80 ms early window. Static context plus fingerprint. Per-source independent computation. |
| Perceptual tuning or heuristic | Thickness adjustment `6·log2(t_eff/t_ref)`. Incidence floor 0.25. 24 dB direct cap. High-band loss/36 mapped to a log-frequency cutoff 700–20 000 Hz. Reflection cutoff from the high/mid amplitude ratio. Scattering removed from specular energy. Portal cost weights 0.08 and 0.25. Portal low-pass −1500 Hz per portal. Additive portal loss. Virtual source at the last portal. Near-field clamp `1/max(1,L)`. Pre-delay `√(floor area)/c`. Openings and missing surfaces fully absorbing. |

Source: `src/acoustics/geometry.ts`, `src/acoustics/occlusion.ts`, `src/acoustics/image-source.ts`, `src/acoustics/portal.ts`, `src/acoustics/room-acoustics.ts`, `src/acoustics/compute-frame.ts`; `docs/ACOUSTICS.md` (table at lines 7-17).

---

## 2. Constants

| Name | Value | Where used | Kind |
| --- | --- | --- | --- |
| `ACOUSTIC_EPSILON` (ε) | `1e-8` | Everywhere. Its unit depends on the comparison (dimensionless parameter, m, m², ms); each use is stated below. | numerical |
| Speed of sound | `343` m/s | `image-source.ts:6`, `room-acoustics.ts:6`, literal `343` in `compute-frame.ts:165` | physical |
| `MAX_DIRECT_LOSS_DB` | `24` dB | direct mid-band loss cap | perceptual |
| `MIN_CUTOFF_HZ` | `700` Hz | direct and reflection low-pass floor (defined in both `occlusion.ts:8` and `image-source.ts:10`) | perceptual |
| `MAX_CUTOFF_HZ` | `20000` Hz | direct and reflection low-pass ceiling (`occlusion.ts:9`, `image-source.ts:11`) | perceptual |
| High-band obstruction divisor | `36` dB | `occlusion.ts:82` | perceptual |
| Incidence floor | `0.25` | `occlusion.ts:38` | perceptual |
| Thickness slope | `6` dB per doubling | `occlusion.ts:40` | perceptual |
| `MAX_TAPS` | `6` | reflection tap cap (`image-source.ts:7`, literal `6` in `compute-frame.ts:137`) | engineering |
| `MAX_EARLY_DELAY_MS` | `80` ms | reflection window, relative to straight-line distance | engineering |
| `MIN_REFLECTION_GAIN_DB` | `−60` dB | first-order floor (unreachable for valid scenes, §8.3) | engineering |
| `DEFAULT_SECOND_ORDER_SURFACE_BUDGET` | `24` walls | second-order pre-selection | engineering |
| `MAX_SECOND_ORDER_PATH_M` | `50` m | second-order path limit | engineering |
| `MIN_SECOND_ORDER_GAIN_DB` | `−36` dB | second-order floor | engineering |
| dB amplitude floor | `1e-8` (→ −160 dB) | `linearToDb` in `image-source.ts:37` | numerical |
| Portal cost loss weight | `0.08` per dB | `edgeCost` | perceptual |
| Portal cost turn weight | `0.25` per rad² | `edgeCost` | perceptual |
| `PORTAL_LOWPASS_PENALTY_HZ` | `1500` Hz per portal | | perceptual |
| `MIN_PORTAL_LOWPASS_HZ` | `1200` Hz | unreachable: at most 8 portals gives ≥ 8000 Hz | perceptual |
| `MAX_PORTAL_LOWPASS_HZ` | `20000` Hz | | perceptual |
| Eyring constant | `0.161` s/m | | physical (SI approximation of 24·ln10/c) |
| `MIN_RT60_S`, `MAX_RT60_S` | `0.12`, `4` s | | numerical clamp |
| `MIN_PRE_DELAY_MS`, `MAX_PRE_DELAY_MS` | `5`, `80` ms | | numerical clamp |
| `MIN_ACOUSTIC_UPDATE_HZ`, `MAX_ACOUSTIC_UPDATE_HZ` | `10`, `15` Hz | `update-rate.ts` (§13) | engineering |
| `reverbSendDb` | constant `0` dB | `compute-frame.ts:170` | (placeholder) |

Source: `src/acoustics/geometry.ts:5`, `src/acoustics/occlusion.ts:7-9,38-40,82`, `src/acoustics/image-source.ts:6-14,37`, `src/acoustics/portal.ts:13-15,103-104`, `src/acoustics/room-acoustics.ts:6-10,109`, `src/acoustics/compute-frame.ts:136-139,165,170`, `src/acoustics/update-rate.ts:1-2`.

---

## 3. Inputs consumed

### 3.1 SceneSpec v1 fields read by Classic acoustics

The Domain model section has the full schema and validation. Classic reads:

| Field | Used by |
| --- | --- |
| `schemaVersion`, `units`, `name` | fingerprint only (§12) |
| `revision` | copied to the frame |
| `room.outerPolygon: Vec2[]` (3–32 vertices) | §10 area, perimeter, volume, pre-delay |
| `room.heightM` (2–12) | §10 |
| `room.floorMaterialId`, `room.ceilingMaterialId` | §10 |
| `walls[]: {id, a, b, thicknessM (0.02–2), materialId, kind: "boundary"\|"partition"}` (≤ 100) | everything. Array order matters (§10 summation order; §8 candidate order before sorting). |
| `portals[]: {id, wallId, center, widthM (0.4–8), heightM (1–6), open, lossDb (0–24)}` (≤ 8) | §3.5, §6, §10 |
| `sources[]: {id, position}` (1–4) | per-source computation, output order |
| `listener.position` | per-source computation |
| `settings.maxEarlyReflections` (integer 0–6) | tap limit |
| `settings.acousticUpdateHz`, `settings.hrtfEnabled` | fingerprint only (§12); update rate is used by the runtime |

Validation is **not** re-run inside the Classic functions. They assume a validated scene. The corpus case `DC05_WALL_EXACTLY_MIN_LENGTH` calls `computeAcousticFrame` without `validateScene`.

### 3.2 Material fields consumed

Materials are looked up by `materialId` with a linear `find` over the registry. An unknown id throws `Error("Unknown acoustic material: <id>")`. Fields used: `absorption{low,mid,high}` (α), `transmissionLossDb{low,mid,high}` (TL), `scattering` (s), `referenceThicknessM` (t_ref). The Domain model section owns the authoritative registry. For convenience, these are its values at the baseline:

| id | α low/mid/high | TL low/mid/high (dB) | s | t_ref (m) |
| --- | --- | --- | --- | --- |
| `concrete_hard` | 0.05 / 0.04 / 0.03 | 28 / 34 / 40 | 0.08 | 0.2 |
| `soft_foliage` | 0.25 / 0.55 / 0.75 | 8 / 10 / 12 | 0.7 | 0.4 |
| `water_like` | 0.02 / 0.04 / 0.06 | 12 / 16 / 20 | 0.03 | 0.1 |
| `wood_medium` | 0.12 / 0.18 / 0.24 | 18 / 22 / 26 | 0.2 | 0.12 |
| `acoustic_treatment` | 0.55 / 0.9 / 0.96 | 12 / 16 / 20 | 0.35 | 0.1 |

Derived reflection constants (§8.1), computed with V8, to 12 significant digits:

| id | `r_mid` | 20·log10(`r_mid`) dB | `r_high` | `r_high/r_mid` | reflection cutoff Hz |
| --- | --- | --- | --- | --- | --- |
| `concrete_hard` | 0.939592327237 | −0.541211 | 0.944620558743 | 1.00535150337 (→ 1) | 20000 |
| `soft_foliage` | 0.324037034920 | −9.788107 | 0.236793749211 | 0.730761375068 | 8110.29923189 |
| `water_like` | 0.952278689048 | −0.424719 | 0.949789450352 | 0.997386018689 | 19825.5030900 |
| `wood_medium` | 0.806816175621 | −1.864508 | 0.778453910553 | 0.964846682645 | 17776.6187193 |
| `acoustic_treatment` | 0.220618988746 | −13.127142 | 0.139642400438 | 0.632957304499 | 5843.06619254 |

Source: `src/domain/scene/types.ts`, `src/domain/scene/schema.ts:3-84`, `src/domain/materials/registry.ts:38-79`, `benchmarks/corpus/harness/ts-serial-adapter.ts:58-63`.

---

## 4. Geometry primitives

### 4.1 Vector operations

```text
cross(a,b)    = a.x*b.y − a.y*b.x
dot(a,b)      = a.x*b.x + a.y*b.y
subtract(a,b) = (a.x−b.x, a.y−b.y)
distance(a,b) = Math.hypot(a.x−b.x, a.y−b.y)      // V8 hypot, §1.2
clampUnit(v)  = v<0 ? 0 : v>1 ? 1 : v              // NaN passes through unchanged
```

Evaluation order matters for bit parity. Each expression must be computed exactly as written. Do not fuse operations into FMA.

Source: `src/acoustics/geometry.ts:7-33`.

### 4.2 `segmentIntersection(a, b, c, d)` — finite segment/segment hit

The first segment is `a→b` (parameter `t`). The second is `c→d` (parameter `u`).

1. `r = b − a`, `s = d − c`, `den = cross(r, s)`.
2. If `|den| ≤ ε`, return **null**. Parallel, collinear and zero-length cases all land here. Note that `den` has units of m², so this threshold depends on scale (Review finding S1).
3. `o = c − a`; `t = cross(o, s)/den`; `u = cross(o, r)/den`.
4. If `t < −ε` or `t > 1+ε` or `u < −ε` or `u > 1+ε`, return **null**. Tolerances are dimensionless and inclusive of the ε band.
5. `t' = clampUnit(t)`, `u' = clampUnit(u)`.
6. Return `{ point: (a.x + r.x*t', a.y + r.y*t'), t: t', u: u' }`. The point is always computed on the first segment.

Endpoint contact is a hit (e.g. `(0,0)→(2,0)` against `(2,0)→(2,3)` gives `t=1, u=0, point (2,0)`).

Source: `src/acoustics/geometry.ts:35-68`; `tests/unit/geometry.test.ts:123-156`.

### 4.3 `collinearInteriorOverlap(a, b, c, d)` — collinear wall lying along a route

1. `r = b − a`, `L2 = dot(r,r)`. If `L2 ≤ ε`, return **null**. This compares a squared length, so any route shorter than 1e-4 m never overlaps.
2. `st = c − a`, `en = d − a`, `L = sqrt(L2)`.
3. If `|cross(r, st)| > ε·L` or `|cross(r, en)| > ε·L`, return **null**. Both wall endpoints must lie within 1e-8 m of the route's infinite line.
4. `t0 = dot(st, r)/L2`, `t1 = dot(en, r)/L2`.
5. `os = max(ε, min(t0,t1))`, `oe = min(1−ε, max(t0,t1))`.
6. If `oe − os ≤ ε`, return **null**. The overlap must cover more than ε of the route's interior. Touching only at a route endpoint is excluded.
7. `t = (os + oe)/2` (midpoint of the interior overlap); `point = (a.x + r.x*t, a.y + r.y*t)`.
8. `w = d − c`, `W2 = dot(w,w)`; `u = W2 ≤ ε ? 0 : clampUnit(dot(point − c, w)/W2)`.
9. Return `{point, t, u}`. Here `t ∈ (ε, 1−ε)` always holds.

Source: `src/acoustics/geometry.ts:70-102`; `tests/unit/geometry.test.ts:108-121`.

### 4.4 `intersectSegmentWithWalls(source, listener, walls)`

For each wall, in input order:

1. `hit = segmentIntersection(source, listener, wall.a, wall.b)`, and if that is null, `hit = collinearInteriorOverlap(source, listener, wall.a, wall.b)`.
2. Keep the hit only if it is non-null **and interior**: `hit.t > ε && hit.t < 1 − ε`. Contacts at the source or listener end are not occluders, so a source or listener may sit exactly on a wall.
3. The result is a crossing `{point, t, u, wallId: wall.id, wall}`.

Sort crossings by `t` ascending. On an exact `t` tie, sort by `wallId` in **code-unit** order (`a < b ? −1 : a > b ? 1 : 0`). Each wall yields at most one crossing.

Source: `src/acoustics/geometry.ts:104-133`; `tests/unit/geometry.test.ts:91-106`.

### 4.5 Open-portal gap test used by the direct trace

`liesStrictlyInsideOpenPortal(point, wall, scene)`:

1. `v = wall.b − wall.a`, `Lw = Math.hypot(v.x, v.y)`. If `Lw ≤ ε`, return false.
2. `dir = (v.x/Lw, v.y/Lw)`. The components are divided first.
3. Return true if **any** portal in `scene.portals` (in array order, `some`) satisfies: `portal.open`, `portal.wallId === wall.id`, `portal.widthM > ε`, and `−w/2 < dot(point − portal.center, dir) < w/2` with `w = widthM`. The bounds are strict, so a hit exactly on a door edge is **not** a gap.

The perpendicular offset of `portal.center` from the wall is ignored.

Source: `src/acoustics/geometry.ts:135-165`; `tests/unit/geometry.test.ts:26-89`; corpus `DC04_ROUTE_GRAZES_PORTAL_EDGE`.

### 4.6 `traceDirectPath(source, listener, scene)` → `DirectTrace`

1. `crossings = intersectSegmentWithWalls(source, listener, scene.walls)` filtered by `!liesStrictlyInsideOpenPortal(c.point, c.wall, scene)`.
2. `visible = crossings.length === 0`.
3. `polyline = [source, ...crossings.map(c => c.point), listener]`. A visible trace has exactly two points, and points inside open portals are not included.

A closed portal is not a gap: its host wall blocks. A portal on a different wall is not a gap for this wall.

Source: `src/acoustics/geometry.ts:167-177`; `src/acoustics/types.ts:5-22`.

### 4.7 Endpoint, collinear and degenerate summary

| Situation | `segmentIntersection` | Direct trace | Reflection leg (§8.2) | Portal edge (§6.2) |
| --- | --- | --- | --- | --- |
| Crossing strictly inside both segments | hit | occluder | blocks unless at the reflection point on the reflecting wall | blocks |
| Route endpoint touches a wall (t≈0 or 1) | hit | ignored | ignored by the trace. In the per-wall loop it blocks only if within 1e-8 m of the reflection point on a different wall. | blocks unless waived (endpoint portal on that wall, strictly inside) |
| Wall endpoint touches route interior | hit (u≈0/1) | occluder | blocks | blocks |
| Parallel, not collinear | null | no crossing | — | — (unless a route endpoint lies on the wall: blocks) |
| Collinear interior overlap | null → overlap hit | occluder at the overlap midpoint, incidence 0 → floor 0.25 | blocks | blocks |
| Collinear touching only at an endpoint | null / null | no crossing | — | blocks via `isPointOnWall` |
| Zero-length route | null / null | visible | visible | visible unless an endpoint lies on a wall |
| Zero-length wall | null / null | ignored | ignored, no reflection | ignored |
| Point exactly on an open door edge | — | **not** a gap (strict) | same | not waived (strict) |

Source: `src/acoustics/geometry.ts`, `src/acoustics/image-source.ts:61-81`, `src/acoustics/portal.ts:182-253`; corpus `DC02`, `DC03`, `DC04`.

---

## 5. Direct-path occlusion — `estimateDirectOcclusion(trace)` → `OcclusionEstimate`

If `trace.visible`, return `{dryGainDb: 0, lowpassHz: 20000, occluderWallIds: [], transmissionLossDb: {0,0,0}}`.

Otherwise:

1. `S = polyline[0]`, `Lp = polyline[last]`, `len = distance(S, Lp)`. `dir = len === 0 ? (0,0) : ((Lp.x−S.x)/len, (Lp.y−S.y)/len)`.
2. For each crossing, in sorted crossing order:
   1. Look up the material (throws on an unknown id).
   2. Wall normal: `v = b − a`, `lw = distance(a, b)`, `n = (−v.y/lw, v.x/lw)`.
   3. `incidence = |dot(dir, n)|`.
   4. `t_eff = wall.thicknessM / max(incidence, 0.25)`.
   5. `adj = 6 · log2(t_eff / material.referenceThicknessM)`.
   6. Per band `b ∈ {low, mid, high}`: `loss_b = max(0, TL_b + adj)`.
3. `TL_b = Σ loss_b`, summed in crossing order starting from 0 (uncapped).
4. `O = clamp(TL_high / 36, 0, 1)` with `clamp(v, lo, hi) = min(max(v, lo), hi)`.
5. `lowpassHz = 700 · (20000/700) ** (1 − O)`. This gives 20000 Hz at `TL_high = 0` and 700 Hz when `TL_high ≥ 36`.
6. `capped = min(TL_mid, 24)`; `dryGainDb = capped === 0 ? 0 : −capped`. This explicitly avoids −0.
7. `occluderWallIds = crossings.map(c => c.wallId)` in crossing order.
8. `transmissionLossDb = TL` (all three bands). This value is **not** copied into the frame, and the low band influences nothing downstream.

Formulas:

```text
t_eff        = t_wall / max(|d·n|, 0.25)
TL_eff,b     = max(0, TL_preset,b + 6·log2(t_eff / t_ref))
TL_route,b   = Σ_j TL_eff,b,j
dryGainDb    = −min(TL_route,mid, 24)          (0 if TL_route,mid = 0)
lowpassHz    = 700 · (20000/700)^(1 − clamp(TL_route,high/36, 0, 1))
```

Distance attenuation is **not** part of the direct result. The audio engine multiplies `dbToLinear(dryGainDb)` by its own inverse-distance law at `effectiveDistanceM`: `1/(1 + max(d−1, 0))` with `d` clamped to [0, 50] m, which equals `1/max(1,d)` for d ≤ 50 m. The Audio engine section owns that law. The Classic frame has no direct-path delay; time of flight is not modelled for the direct sound.

Examples (tests):

- Concrete 0.2 m at normal incidence: `adj = 0`, `TL = {28, 34, 40}`, `dryGainDb = −24`, `lowpassHz = 700`.
- Foliage 0.02 m: `adj = 6·log2(0.05) ≈ −25.93`, all bands 0, so `dryGainDb = 0` and `lowpassHz = 20000`. The route still counts as non-visible.
- Wood 0.12 m plus foliage 0.4 m: `TL = {26, 32, 38}`, `dryGainDb = −24`.
- Oblique concrete from (9,6) to (1,2) across x=6: `adj = 6·log2(√5/2)`.
- Collinear overlap (incidence 0 → 0.25): `t_eff = 4·t`, `adj = +12 dB` (corpus `DC02`).

Source: `src/acoustics/occlusion.ts:1-93`; `tests/unit/occlusion.test.ts`; `src/audio/math.ts:29-39` and `src/audio/SourceGraph.ts:256-268` (consumer only).

---

## 6. Portal graph routing — `findBestPortalRoute(source, listener, scene)` → `PortalRoute | null`

This runs only when the direct trace is not visible (§7).

### 6.1 Nodes

1. `openPortals = scene.portals.filter(p => p.open)`, sorted by `id` in **code-unit** order. `portalBit` is the index in this sorted list.
2. `nodes = [{id: "__listener", kind: listener, position: listener}, {id: "__source", kind: source, position: source}, ...openPortals.map(p => ({id: p.id, kind: portal, position: p.center, portal: p, portalBit}))]`.
3. Sort `nodes` by `id` in **code-unit** order. `"__listener" < "__source"`. Portal ids that begin with a digit or an uppercase letter sort before them, because `_` is 0x5F. Node indices below refer to this sorted array.

Closed portals are not nodes, and their host walls block like any wall.

### 6.2 Edge visibility — `isPortalEdgeVisible(from, to, scene)`

For each wall, in `scene.walls` order:

1. If `collinearInteriorOverlap(from.pos, to.pos, wall.a, wall.b)` is non-null, the edge is **not visible**.
2. `hit = segmentIntersection(from.pos, to.pos, wall.a, wall.b)`.
   - If `hit` is non-null: `fromEnd = hit.t ≤ ε`, `toEnd = hit.t ≥ 1 − ε`. If `(fromEnd && waived(hit.point, wall, from.portal)) || (toEnd && waived(hit.point, wall, to.portal))`, skip this wall. Otherwise the edge is **not visible**. Any interior crossing blocks, including a crossing through **another** open portal's opening, so routes must pass through such portals as nodes. Any endpoint contact blocks unless waived, so a listener or source standing on a wall blocks all its Portal edges.
   - If `hit` is null: if `isPointOnWall(from.pos, wall) || isPointOnWall(to.pos, wall)`, the edge is **not visible**. This covers parallel or collinear contact.
3. If no wall blocks, the edge is visible.

`waived(point, wall, p)` is true iff `p` is defined, `p.open`, `p.wallId === wall.id`, and `liesStrictlyInsidePortal(point, p, wall)`.

`liesStrictlyInsidePortal(point, p, wall)`:

```text
v = wall.b − wall.a; Lw = Math.hypot(v.x, v.y)
if Lw ≤ ε or p.widthM ≤ ε: false
d = dot(point − p.center, v) / Lw        // dot first, then divide (differs from §4.5)
return −p.widthM/2 < d < p.widthM/2      // strict
```

`isPointOnWall(point, wall)`:

```text
v = wall.b − wall.a; Lw = Math.hypot(v.x, v.y); if Lw ≤ ε: false
o = point − wall.a; along = dot(o, v)                 // m², not normalized
return |cross(o, v)| ≤ ε·Lw  &&  along ≥ −ε  &&  along ≤ Lw·Lw + ε
```

Only the endpoint's **own** portal is waived, and only for its host wall. A second closed wall coincident with the host wall therefore blocks (test "waives only the selected portal host wall").

The waiver requires `t ≤ 1e-8` (or `≥ 1 − 1e-8`), so the portal center must lie on the host wall line to about 1e-8 relative precision. Validation allows centers up to 0.01 m off the line (Review finding V1).

`buildVisibleGraph`: for every node `i`, `neighbors[i]` is every `j ≠ i` (ascending `j`) with `isPortalEdgeVisible(nodes[i], nodes[j])`. All ordered pairs are tested.

### 6.3 Search

The state is `{prev, cur, mask, portalIds, polyline, effectiveDistanceM, portalLossDb, cost}`. Its key string is `` `${prev}:${cur}:${mask}` ``. `prev = −1` for the initial state.

```text
edgeCost(d, lossDb, turn) = d + 0.08·lossDb + 0.25·turn²
turn(prev, cur, next):
  if prev undefined → 0
  in = cur − prev; out = next − cur; li = hypot(in); lo = hypot(out)
  if li === 0 or lo === 0 → 0
  acos(clamp(dot(in,out)/(li·lo), −1, 1))            // radians, [0, π]
```

The comparator `compareRouteStates(a, b)` defines a total order over live states:

1. `a.cost − b.cost` if the costs differ (exact `!==`).
2. `portalIds` sequences, elementwise in **code-unit** order. At the first difference return −1/1. If one is a prefix of the other, the shorter sorts first (`a.length − b.length`).
3. The current node `id` in code-unit order.
4. The previous node `id` in code-unit order (`""` when `prev = −1`).

Algorithm (label-setting Dijkstra over (prev, current, visited-mask) states):

1. `init = {prev: −1, cur: sourceIndex, mask: 0, portalIds: [], polyline: [source], effectiveDistanceM: 0, portalLossDb: 0, cost: 0}`. Set `best[key(init)] = init` and push `init`.
2. While the queue is non-empty, pop the minimum state `st`.
   1. If `best[key(st)] !== st` (object identity), skip it as stale.
   2. If `st.cur === listenerIndex && st.portalIds.length > 0`, **return** the route (§6.4).
   3. For each `ni` in `neighbors[st.cur]`, in ascending order, with `next = nodes[ni]`:
      - Skip if `next` is the source; or if `next` is the listener and `st.portalIds.length === 0` (direct source→listener is never a Portal route); or if `next` is a portal whose bit is already in `st.mask`.
      - `loss = next.portal?.lossDb ?? 0` (loss is charged on **entering** a portal; 0 for the listener).
      - `d = distance(cur.pos, next.pos)`.
      - `θ = turn(nodes[st.prev]?.pos, cur.pos, next.pos)`.
      - `cand = {prev: st.cur, cur: ni, mask: next is portal ? st.mask | (1 << bit) : st.mask, portalIds: next is portal ? [...st.portalIds, next.portal.id] : st.portalIds, polyline: [...st.polyline, next.pos], effectiveDistanceM: st.effectiveDistanceM + d, portalLossDb: st.portalLossDb + loss, cost: st.cost + edgeCost(d, loss, θ)}`.
      - If `best[key(cand)]` is undefined or `compare(cand, best[key(cand)]) < 0`, set `best[key(cand)] = cand` and push.
3. If the queue empties, return **null**.

Consequences:

- `cost = Σ leg lengths + 0.08·Σ portal lossDb + 0.25·Σ θ²`, where θ is the turn at each intermediate portal. There is no turn at the source and none at the listener.
- Each portal is visited at most once, so a route has at most (number of open portals) ≤ 8 portals. There is no other portal limit.
- The returned route is the minimum under the total comparator, so exact cost ties go to the lexicographically smaller portal-id sequence. Input order of walls and portals does not affect the result (test "breaks an exact second-portal tie identically for reordered walls and portals").

Priority queue: the reference uses a binary min-heap (sift-up stops when `compare(parent, v) ≤ 0`; sift-down picks the right child only if strictly smaller than the left and stops when `compare(last, child) ≤ 0`). Because the comparator is total over distinct keys and stale entries are skipped by identity, any correct min-priority queue with this comparator yields the same result. My re-implementation used a sort-based queue and matched the corpus exactly.

### 6.4 Output

```text
portalIds        = st.portalIds                      // source→listener order
polyline         = [source, portal centers…, listener]
effectiveDistanceM = Σ leg lengths (left-to-right sum from 0)
cost             = st.cost                            // not copied to the frame
virtualPosition  = center of the portal whose id = last portalIds entry
                   (first match in openPortals; the "listener-facing" portal)
dryGainDb        = −st.portalLossDb                   // −0 when all losses are 0 (V7)
lowpassHz        = clamp(20000 − 1500·n, 1200, 20000), n = portalIds.length
```

`portalLowpassHz(n)` for n = 0…8 gives 20000, 18500, 17000, 15500, 14000, 12500, 11000, 9500, 8000.

Test vector (`tests/unit/portal.test.ts:75-107`): source (10,4), listener (2,4), east_door (8,4) with 3 dB, west doors (4,6) and (4,2) with 2 dB each. Expected route `["east_door","west_door_a"]`, cost `edgeCost(2,3,0) + edgeCost(√20,2,atan 0.5) + edgeCost(√8,0,π/4+atan 0.5)`, `dryGainDb −5`, `lowpassHz 17000`, `virtualPosition (4,6)`.

Corpus C001 `rain` (10,1.5) → door (6,4) → listener (3,4): `effectiveDistanceM = hypot(4,2.5) + 3 = 7.716990566028302`, `dryGainDb −3`, `lowpassHz 18500`.

Source: `src/acoustics/portal.ts:1-390`; `src/acoustics/types.ts:31-39`; `tests/unit/portal.test.ts`; `docs/ACOUSTICS.md:282-320`.

---

## 7. Route selection — `computeClassicSourceRoute(source, listener, scene)` → `AcousticSourceRoute`

1. `trace = traceDirectPath(source.position, listener.position, scene)`.
2. `occ = estimateDirectOcclusion(trace)`.
3. `portal = trace.visible ? null : findBestPortalRoute(source.position, listener.position, scene)`.
4. `physicalDistanceM = distance(source.position, listener.position)`.
5. `effectiveDistanceM = portal?.effectiveDistanceM ?? physicalDistanceM`.
6. Assemble:

| Field | direct (`trace.visible`) | portal (`portal ≠ null`) | blocked |
| --- | --- | --- | --- |
| `routeType` | `"direct"` | `"portal"` | `"blocked"` |
| `directVisible` | true | false | false |
| `dryGainDb` | 0 | `portal.dryGainDb` (−Σ lossDb) | `occ.dryGainDb` |
| `lowpassHz` | 20000 | `portalLowpassHz(n)` | `occ.lowpassHz` |
| `virtualPosition` | `source.position` | last portal center | `source.position` |
| `occluderWallIds` | `[]` | `occ.occluderWallIds` (direct-line occluders) | `occ.occluderWallIds` |
| `portalIds` | `[]` | `portal.portalIds` | `[]` |
| `routePolyline` | `[source, listener]` | `portal.polyline` | `trace.polyline` (with crossing points) |
| `effectiveDistanceM` | physical | Portal route length | physical |

**How Portal and occluded paths combine: they don't.** If any Portal route exists, it replaces the transmitted direct path completely. Transmission loss through the occluders is ignored even when it would be quieter than the portal loss. For example, a 0.02 m foliage partition with transmitted 0 dB plus a 24 dB door yields `portal, −24 dB`. There is no energy summation of transmitted and portal paths (Review finding V5).

Hybrid 3D calls this function for its Portal candidate (Hybrid 3D section).

Source: `src/acoustics/compute-frame.ts:96-123`; `tests/unit/compute-frame.test.ts:153-207`; `src/acoustics/hybrid3d/audible-direct.ts:210-218`.

---

## 8. Image-source reflections

### 8.1 Helpers

```text
reflectAcrossWallLine(p, wall):
  v = b − a; L2 = dot(v,v); if L2 ≤ ε → null          // walls < 1e-4 m have no image
  k = dot(p − a, v) / L2
  proj = (a.x + v.x·k, a.y + v.y·k)
  image = (2·proj.x − p.x, 2·proj.y − p.y)

reflectionAmplitude(m, band ∈ {mid, high}):
  τ = 10 ** (−m.TL[band] / 10)
  ρ = max(0, 1 − m.α[band] − τ)
  r = sqrt(ρ · (1 − m.scattering))                    // specular share only

distanceAttenuation(L) = 1 / max(1, L)
linearToDb(x)          = 20 · Math.log10(max(x, 1e-8))

lowpassForReflection(m):
  rm = r(m, mid); if rm ≤ ε → 700
  ratio = min(1, r(m, high) / rm)
  → 700 · (20000/700) ** ratio                        // ratio 1 → 20000 Hz
```

Note that the reflection cutoff exponent is `ratio`, whereas the direct cutoff exponent is `1 − O`. The low band is never used for reflections. Walls have no facing side: both faces of every segment reflect, and no normal-orientation test is applied. Wall thickness is ignored.

Source: `src/acoustics/image-source.ts:16-59,93-101`; `docs/ACOUSTICS.md:136-176`.

### 8.2 Reflection-leg visibility — `reflectionLegIsVisible2D(start, end, reflectionPoint, reflectingWallId, scene)`

1. For each wall in `scene.walls` order:
   1. If `collinearInteriorOverlap(start, end, wall.a, wall.b)` is non-null, return **false**. This applies to every wall, including the reflecting wall.
   2. `hit = segmentIntersection(start, end, wall.a, wall.b)`. If `hit` is null, or `distance(hit.point, reflectionPoint) > ε` (1e-8 m absolute), continue.
   3. The hit is at the reflection point. If `wall.id !== reflectingWallId`, return **false**. Any other wall touching the reflection point blocks, which includes a second wall sharing a corner with the reflecting wall.
2. Return `traceDirectPath(start, end, scene).visible`. Crossings strictly inside the leg (t ∈ (ε, 1−ε)) block unless they are inside an open portal (§4.5), so a leg **may pass through an open doorway**. Contacts at the leg ends are ignored here.

No origin offset ("nudge") is used. Self-intersection at the reflection point is handled by step 1.3 together with the endpoint exclusion of the trace.

Source: `src/acoustics/image-source.ts:61-81`; `tests/unit/image-source.test.ts:84-124`.

### 8.3 First order — `findFirstOrderReflections(source, listener, scene, maxTaps)`

1. `ref = distance(source, listener)`; `limit = min(6, max(0, floor(maxTaps)))`.
2. If `limit === 0` or `ref ≤ ε`, return `[]`. A source exactly on the listener gets no reflections (corpus `DC01`).
3. For each wall in `scene.walls` order:
   1. `img = reflectAcrossWallLine(source, wall)`. If null, skip.
   2. `q = segmentIntersection(img, listener, wall.a, wall.b)?.point`. If null, skip. The point is on the image→listener line at clamped t. `u ∈ [−ε, 1+ε]` is accepted, which includes wall endpoints. If source and listener are on opposite sides of the wall line, there is no hit.
   3. Require `reflectionLegIsVisible2D(source, q, q, wall.id)` and `reflectionLegIsVisible2D(q, listener, q, wall.id)`. Otherwise skip.
   4. `L = distance(source, q) + distance(q, listener)`.
   5. `delay = ((L − ref)/343)·1000`.
   6. Look up `m` (throws on an unknown id; this happens only after visibility passes).
   7. `gain = linearToDb(r(m, mid) · 1/max(1, L))`.
   8. Reject if `delay < −ε` (ε in ms), `delay > 80`, or `gain < −60`.
   9. Emit `{order: 1, wallId, wallIds: [wallId], reflectionPoint: q, reflectionPoints: [q], pathLengthM: L, delayMs: max(0, delay), gainDb: gain, lowpassHz: lowpassForReflection(m)}`.
4. Sort by `gainDb` descending; on an exact tie, by `a.wallId.localeCompare(b.wallId)`.
5. `slice(0, limit)`.

The 80 ms window is measured against the **straight-line** distance, even for Portal or blocked routes (Review finding V12). The −60 dB floor cannot be reached by a valid scene. The worst case is about −52.97 dB: `acoustic_treatment` (`r_mid` 0.2206) over the longest path that fits the 80 ms window in a 50 m room, as recorded in `benchmarks/corpus/README.md`.

Degenerate case: if the listener or source lies on a wall's line within the segment, then `q` equals that endpoint. The tap has `L = ref`, delay 0, and the full mid amplitude at the direct distance. This is a "ghost" tap coincident with the direct sound, pinned by corpus `DC03`: `stub_wall` at −16.10 dB, 0 ms (Review finding V2).

Example (C001 `radio` (9,4) → listener (3,4), `boundary_east` x=12): image (15,4), `q` (12,4), `L = 12`, delay `= 6/343·1000 = 17.49271137026239` ms, `gain = 20·log10(0.939592327237/12) = −22.124835688005323` dB, cutoff 20000 Hz. The north and south boundary reflections at (6,0) and (6,8) are dropped because `partition_center`'s endpoints coincide with them (§8.2 step 1.3).

Source: `src/acoustics/image-source.ts:83-153`; `tests/unit/image-source.test.ts:42-188`; corpus `C001`, `CL05_EARLY_DELAY_CAP`, `DC01`, `DC03`.

### 8.4 Second-order pair — `solveSecondOrderReflectionPair2D(source, listener, first, second, scene)`

1. If `first.id === second.id`, return null.
2. `i1 = reflect(source, first)`, then `i2 = reflect(i1, second)`. If either is null, return null.
3. `q2 = segmentIntersection(i2, listener, second.a, second.b)?.point`. If null, return null.
4. `q1 = segmentIntersection(i1, q2, first.a, first.b)?.point`. If null, return null.
5. All four checks must pass, otherwise return null:
   `leg(source, q1, q1, first.id)`, `leg(q1, q2, q1, first.id)`, `leg(q1, q2, q2, second.id)`, `leg(q2, listener, q2, second.id)`. Here `leg` is §8.2.
6. `L = distance(source,q1) + distance(q1,q2) + distance(q2,listener)` (summed in this order); `delay = ((L − distance(source,listener))/343)·1000`.
7. `gain = linearToDb(r(m1,mid) · r(m2,mid) · 1/max(1,L))`. Material lookup happens after visibility.
8. Reject if `L > 50`, `delay < −ε`, `delay > 80`, or `gain < −36` (checked in that order).
9. Emit `{order: 2, wallId: second.id, wallIds: [first.id, second.id], reflectionPoint: q2, reflectionPoints: [q1, q2], pathLengthM: L, delayMs: max(0, delay), gainDb: gain, lowpassHz: min(lowpassForReflection(m1), lowpassForReflection(m2))}`.

`q2` (the listener-side point) is the panner position used by the audio engine.

Test vector: 10×10 concrete square, source (2,5), listener (8,5), bottom then right. Gives `q1 = (7,0)`, `q2 = (10,3)`, `L = 10√2`, `delay = 1000·(10√2 − 6)/343`, `gain = 20·log10(ρ'_mid / (10√2))` with `ρ'_mid = (1 − 0.04 − 10^−3.4)(1 − 0.08)`.

Source: `src/acoustics/image-source.ts:155-207`; `tests/unit/image-source.test.ts:190-235`; corpus `CL06_SECOND_ORDER_PATH_LIMIT`.

### 8.5 Bounded second-order search — `findSecondOrderReflections(source, listener, scene, maxTaps, surfaceBudget = 24)`

1. `limit = min(6, max(0, floor(maxTaps)))`. If `limit === 0` or `distance(source, listener) ≤ ε`, return `[]`.
2. Representative walls: copy `scene.walls` and sort by `key(w) = reflect(source, w) ? distance(reflect(source, w), listener) : +∞` ascending. On a tie (including ∞ vs ∞, where `∞ − ∞ = NaN` is falsy), sort by `left.id.localeCompare(right.id)`. Take `slice(0, max(2, floor(surfaceBudget)))`, which is 24 by default. The key is the first-order **image path length over the infinite wall line**, so walls whose reflection point falls off the segment still rank.
3. For each `first` of the representative list (in order), and for each `second` of the list (in order), call §8.4 and keep the non-null results. That is at most 24·23 = 552 ordered pairs.
4. Sort by `gainDb` descending; on an exact tie, by `left.wallIds.join(">").localeCompare(right.wallIds.join(">"))`.
5. `slice(0, limit)`.

Second-order search runs **only** when the direct path is not visible (both `portal` and `blocked` routes), see §9. Raising the 24-wall budget to 100 changes only corpus `C013_STRESS_4_SOURCES`. Lowering it to 10 changes no frame case (mutation evidence, §16).

Source: `src/acoustics/image-source.ts:209-241`; `docs/ACOUSTICS.md:361-379`.

---

## 9. The six shared audible taps — `computeClassicSourceFrame(source, listener, context)`

1. Build `scene = {...context.scene, revision: 0, listener, sources: [source]}`. Only walls, portals and settings are read.
2. `limit = min(6, max(0, floor(scene.settings.maxEarlyReflections)))`.
3. `route = computeClassicSourceRoute(source, listener, scene)` (§7).
4. `F1 = findFirstOrderReflections(source.position, listener.position, scene, limit)`, which is already sorted and capped at `limit`.
5. `F2 = route.directVisible ? [] : findSecondOrderReflections(source.position, listener.position, scene, limit)`, also sorted and capped.
6. `merged = [...F1, ...F2]` sorted by `gainDb` descending; on an exact tie, by `key(left).localeCompare(key(right))` with `key(t) = t.wallIds?.join(">") ?? t.wallId`. First-order keys equal the wall id. `slice(0, limit)`. The result is the top-`limit` of the union, because each input list was truncated with a consistent comparator.
7. Re-reference every kept tap: `delayMs = max(0, ((pathLengthM − route.effectiveDistanceM)/343)·1000)`. All other fields are unchanged. For Portal routes `effectiveDistanceM ≥ physicalDistanceM`, so delays can only shrink, and reflections shorter than the Portal route get 0 ms. Final delays are within [0, 80] ms.
8. Return `{...route, reverbSendDb: 0, earlyReflections: merged}`.

Each tap (`ReflectionTap`) carries:

| Field | Type, unit | Meaning |
| --- | --- | --- |
| `order` | 1 \| 2 | reflection order (always present in Classic) |
| `wallId` | string | order 1: the wall. Order 2: the **second** (listener-side) wall |
| `wallIds` | string[1] \| string[2] | full wall sequence; `wallIds.join(">")` is the tap identity key the audio slot allocator uses |
| `reflectionPoint` | Vec2, m | order 1: `q`. Order 2: `q2`. Drives the tap panner |
| `reflectionPoints` | Vec2[1] \| Vec2[2] | `[q]` or `[q1, q2]` |
| `pathLengthM` | m | full reflected path length (absolute time of flight = `L/343`) |
| `delayMs` | ms, [0, 80] | delay relative to `effectiveDistanceM`, clamped at 0 |
| `gainDb` | dB | mid-band specular amplitude including `1/max(1,L)` |
| `lowpassHz` | Hz | per-material cutoff (minimum over both walls for order 2) |

First- and second-order taps compete for the same at most 6 slots. The audio engine holds a persistent bank of six taps (`MAX_EARLY_REFLECTION_TAPS = 6`) and allocates slots by the key `wallIds.join(">") ?? wallId` (Audio engine section).

Exact-tie ordering is part of the output contract. Symmetric scenes produce exact gain ties, so a port must reproduce `localeCompare` (§1.3) and bit-exact gains (§1.2) or the array order flips. Corpus `LC01_MIXED_CASE_TIE_CLASSIC` pins this. Walls `edge-1` (west), `Edge_b` (north), `edge_1` (east), `edge_a` (south); source (3,4), listener (5,4), 8×8 room. Expected order: `edge_1`, `edge-1` (both 8 m, −18.603010506891696 dB), then `edge_a`, `Edge_b` (8.246211251235321 m, −18.86629989411519 dB). Code-unit order would give `edge-1` before `edge_1`.

Source: `src/acoustics/compute-frame.ts:125-173`; `src/acoustics/types.ts:41-51`; `src/audio/reflection-slots.ts:55-58`; `src/audio/EarlyReflectionBank.ts:20`; `tests/unit/compute-frame.test.ts:209-273`; corpus `LC01`, `DC06_REFLECTIONS_LIMIT_ZERO`.

---

## 10. Room acoustics — `estimateRoomAcoustics(scene, options = {})` → `RoomAcousticFrame`

The code uses no band centre frequencies. `low`, `mid` and `high` are labels; `docs/ACOUSTICS.md` describes them as "near 250 Hz / 1 kHz / 4 kHz" (representative only). There is no air absorption.

Steps, in this exact order. Summation order matters for bits.

1. `A = polygonArea(room.outerPolygon)`: shoelace `Σ_{i=0}^{n−1} (p_i.x·p_{i+1}.y − p_{i+1}.x·p_i.y)` accumulated from 0, cyclic, then `|sum|·0.5`. Fewer than 3 vertices gives 0.
2. `H = max(0, room.heightM)`; `V = A·H`.
3. `floor = material(floorMaterialId)`, then `ceiling = material(ceilingMaterialId)`. Both throw on an unknown id, the ceiling lookup even when the ceiling is disabled.
4. `surfaces = [{area: A, material: floor}, {area: A, material: options.ceilingEnabled === false ? null : ceiling}]`.
5. Exterior surfaces. For each polygon vertex `i` (in order), edge `p_i → p_{(i+1) mod n}`:
   - `area = distance(p_i, p_{i+1})·H`. If `area ≤ ε`, skip.
   - Boundary wall for the edge: among walls with `kind === "boundary"`, those whose endpoints match the edge in either orientation, with each endpoint pair within `distance ≤ ε` (1e-8 m). Sort the matches by `id.localeCompare` and take the first.
   - Push `{area, material: wall ? material(wall.materialId) : null, wallId: wall?.id}`.
6. Partitions. For each wall with `kind === "partition"`, in `scene.walls` order: `area = distance(a,b)·H·2` (both faces). If `area > ε`, push `{area, material, wallId}`. Classic primitive footprint walls are partitions, so they add surface too (Domain model).
7. `S = Σ area`, accumulated from 0 in `surfaces` order.
8. For each surface in order, compute the opening area, then for each band in order low, mid, high add to `Aabs[band]`:
   - `wall = surface.wallId === undefined ? undefined : scene.walls.find(w => w.id === surface.wallId)`.
   - `opening = wall ? clamp(Σ_{portals p: p.open && p.wallId === wall.id} p.widthM · min(p.heightM, scene.room.heightM) · faces, 0, surface.area) : 0`, with `faces = partition ? 2 : 1`. The portal sum runs in portal array order from 0. `scene.room.heightM` is the unclamped value.
   - `Aabs[band] += material === null ? area : (area − opening)·material.α[band] + opening`.
9. Per band `b` (low, mid, high): `rt60S[b] = eyring(V, S, Aabs[b]/S)`.
10. `preDelayMs = clamp(sqrt(A)/343·1000, 5, 80)`.

```text
eyring(V, S, ᾱ):
  a   = clamp(ᾱ, 0, 1 − 1e-8)                 // clamp(v,lo,hi) = min(hi, max(lo, v)); NaN stays NaN
  den = −S · Math.log(1 − a)
  if !isFinite(den) or den ≤ 1e-8 or V ≤ 0 → 4
  → clamp(0.161·V / den, 0.12, 4)
```

Consequences to preserve:

- A surface with no material is **fully absorbing** (α = 1) over its whole area. This covers polygon edges with no exactly matching boundary wall and a disabled ceiling.
- Open portal area is fully absorbing, counted once on a boundary and twice on a partition, and capped at the surface's area.
- Boundary walls that do not match a polygon edge exactly are ignored, along with their portals. A 1 µm endpoint mismatch on one C001 boundary wall drops mid RT60 from 2.345 s to 0.796 s (reproduced with the re-implementation; Review finding V19).
- Partitions anywhere are counted, and room volume is not reduced by partitions or primitives.
- `ᾱ = 0` gives `den = −S·ln 1 = −0`, which is ≤ ε, so RT60 = 4. If `S = 0`, `ᾱ` is NaN and RT60 = 4.
- `options.ceilingEnabled` is only ever passed by the Hybrid viewport adapter. `computeAcousticFrame` and the Classic pool use the default (ceiling present).

Worked example (C001, 12×8×3 concrete with a concrete partition at x=6 and a 1.2×2.1 m open door):

| Quantity | Value |
| --- | --- |
| A, V | 96 m², 288 m³ |
| S | 96 + 96 + (36+24+36+24) + 48 = 360 m² |
| A_mid | 3.84 + 3.84 + 4.8 + ((48 − 5.04)·0.04 + 5.04) = 19.2384 m² |
| rt60S | low 1.9696533078167364, mid 2.345190185821351, high 2.8906059255921006 s |
| preDelayMs | √96/343·1000 = 28.565478049949593 ms |

Source: `src/acoustics/room-acoustics.ts:1-157`; `tests/unit/room-acoustics.test.ts`; `src/components/workspace/HybridViewportAdapter.tsx:210`; `src/workers/classic-source-pool.ts:572`; corpus `C001`, `CL01_PRE_DELAY_FLOOR`, `CL02_PRE_DELAY_CEILING`, `CL06`.

---

## 11. Frame assembly

### 11.1 `computeAcousticFrame(scene, generatedAtMs = 0)` — serial path

1. `context = createClassicStaticContext(scene)` (§12; one `JSON.stringify` plus FNV).
2. `snapshot = createClassicPoseSnapshot(scene, context)`.
3. `room = estimateRoomAcoustics(scene)` (§10, default options).
4. `results = computeClassicSourceResults(context, snapshot, scene.sources.map(s => s.id))`.
5. Return `assembleAcousticFrame(snapshot, room, results, generatedAtMs)`.

Throw order, which decides which error surfaces first: room materials (floor, ceiling, boundary walls by edge order, partitions by wall order), then per source in scene order (crossing materials, then reflection materials for candidates that pass visibility). Every material error has the message `Unknown acoustic material: <id>`. Validated scenes never throw. No Classic corpus case has `outcome: "error"`, so no error text is pinned by the corpus.

The runtime calls this as the complete serial fallback with `generatedAtMs` defaulted to 0 (Runtime section).

### 11.2 Worker-shaped decomposition

These must produce output deep-equal to §11.1 (`tests/unit/compute-frame.test.ts:48-102`).

`createClassicPoseSnapshot(scene, context = createClassicStaticContext(scene))` returns `{revision: scene.revision, staticFingerprint: context.fingerprint, listener: scene.listener, sources: scene.sources}`. It does not check that `context` belongs to `scene`; a supplied fingerprint passes through unchanged.

`computeClassicSourceResults(context, snapshot, sourceIds)`:

1. If `snapshot.staticFingerprint !== context.fingerprint`, throw `Classic pose snapshot static fingerprint does not match the installed context.`
2. For each requested id in the given order: if it was already requested, throw `Duplicate Classic source ID requested: <id>`. Look it up in a map built from `snapshot.sources` (on duplicate source ids the last one wins). If missing, throw `Unknown Classic source ID requested: <id>`. Otherwise emit `{sourceId, revision: snapshot.revision, staticFingerprint: context.fingerprint, frame: computeClassicSourceFrame(source, snapshot.listener, context)}`.

`assembleAcousticFrame(snapshot, room, results, generatedAtMs)` checks each result in order:

| Check | Error message |
| --- | --- |
| id not in snapshot | `Unknown Classic source result: <id>` |
| id already seen | `Duplicate Classic source result: <id>` |
| `revision !== snapshot.revision` | `Classic source result revision mismatch for <id>.` |
| `staticFingerprint !== snapshot.staticFingerprint` | `Classic source result static fingerprint mismatch for <id>.` |
| `frame.sourceId !== sourceId` | `Classic source result payload ID mismatch for <id>.` |
| after the loop, any snapshot source missing | `Missing Classic source results: <ids joined by ", ">` (snapshot order) |

It then returns `{revision: snapshot.revision, generatedAtMs, room, sources: snapshot.sources.map(s => byId[s.id])}`, which is authored source order regardless of result order. All errors are plain `Error`.

### 11.3 `AcousticFrame` output shape

| Path | Type | Unit | Value or range |
| --- | --- | --- | --- |
| `revision` | integer | — | `scene.revision` |
| `generatedAtMs` | number | ms | caller-supplied, default 0 |
| `room.volumeM3` | number | m³ | `A·H` |
| `room.totalSurfaceM2` | number | m² | §10 `S` |
| `room.rt60S.{low,mid,high}` | number | s | [0.12, 4] |
| `room.preDelayMs` | number | ms | [5, 80] |
| `sources[]` | array | — | authored `scene.sources` order, one per source |
| `.sourceId` | string | — | |
| `.routeType` | `"direct"\|"portal"\|"blocked"` | — | §7 |
| `.directVisible` | boolean | — | |
| `.physicalDistanceM` | number | m | straight line, ≥ 0 |
| `.effectiveDistanceM` | number | m | Portal route length or physical |
| `.dryGainDb` | number | dB | 0; or −min(TL_mid,24); or −Σ portal lossDb (≥ −192); may be −0 for zero-loss portals |
| `.lowpassHz` | number | Hz | [700, 20000] direct/blocked; 20000−1500n Portal |
| `.reverbSendDb` | number | dB | always 0 |
| `.virtualPosition` | Vec2 | m | |
| `.occluderWallIds` | string[] | — | crossing order; empty iff `directVisible` |
| `.portalIds` | string[] | — | source→listener order |
| `.routePolyline` | Vec2[] (≥ 2) | m | §7 |
| `.earlyReflections` | ReflectionTap[] (0..`limit` ≤ 6) | — | §9 order |

Object key order is incidental (the corpus canonicalises keys). The reference emits keys in the order listed in `compute-frame.ts:9-23` and `types.ts:41-51`. `virtualPosition` and polyline endpoints alias the input `position` objects (incidental).

Source: `src/acoustics/compute-frame.ts:9-53,175-252`; `src/acoustics/types.ts:53-58`; `src/hooks/useAcousticFrame.ts:174-189`; `docs/API_CONTRACTS.md:93-127`.

---

## 12. Static context and fingerprint

### 12.1 Static versus pose split

| Static (`ClassicStaticContext.scene`, fingerprinted) | Pose (`ClassicPoseSnapshot`, not fingerprinted) |
| --- | --- |
| `schemaVersion`, `units`, `name`, `room`, `walls`, `portals`, `settings` (including the non-acoustic `acousticUpdateHz` and `hrtfEnabled`) | `revision`, `listener` (position and `headingDeg`), `sources` (all fields, including `gainDb`, `clipId` and `name`) |

`createClassicStaticContext(scene)` returns `{fingerprint, scene: staticScene}`, where `staticScene = {schemaVersion, units, name, room, walls, portals, settings}` in **exactly this top-level key order**. Nested values are the same objects as in the input, not copies, so their key order is whatever the producer used.

### 12.2 Fingerprint algorithm

```text
json = JSON.stringify(staticScene)              // no whitespace
hash = 0x811c9dc5                               // 2166136261
for each Unicode code point cp of json (string iterator):
    unit = cp ≤ 0xFFFF ? cp : 0xD800 + ((cp − 0x10000) >> 10)   // charCodeAt(0): HIGH surrogate only
    hash = hash XOR unit                         // 32-bit
    hash = (hash × 0x01000193) mod 2^32          // Math.imul; bit-identical to u32 wrapping_mul
fingerprint = lowercase hex of hash (as u32), left-padded with "0" to 8 chars
```

This is standard 32-bit FNV-1a with one exception. Characters outside the BMP contribute only their high surrogate, so the low surrogate is lost, and characters sharing a high surrogate collide. Example: U+1D11E and U+1D11F, pinned by corpus `LC03_UNICODE_NAME_CLASSIC` and `LC05_NONBMP_SIBLING_CLASSIC`, which have equal `staticFingerprint`. Lone surrogates never reach the hash raw, because `JSON.stringify` escapes them as `\udXXX` text.

`JSON.stringify` rules a port must reproduce:

- Object members appear in insertion order. Integer-like keys would come first, but SceneSpec has none. Members whose value is `undefined` are omitted (a validated SceneSpec has none). Arrays use `[a,b]`. No spaces anywhere.
- Strings: `"` → `\"`, `\` → `\\`, U+0008 `\b`, U+0009 `\t`, U+000A `\n`, U+000C `\f`, U+000D `\r`. Other code units < 0x20 → `\u00xx` (lowercase hex). Lone surrogates → `\udxxx` (lowercase). Everything else is literal, including `/`, U+007F, U+2028 and U+2029.
- Numbers use ECMAScript `Number::toString(10)`. Shortest round-trip digits `d1…dk` with decimal exponent `n` (value = 0.d1…dk × 10^n):
  - if `k ≤ n ≤ 21`: digits followed by `n−k` zeros (`3`, not `3.0`);
  - if `0 < n ≤ 21`: point after `n` digits (`1.5`);
  - if `−6 < n ≤ 0`: `0.` + `−n` zeros + digits (`0.000001`);
  - else exponential `d1[.d2…dk]e±(n−1)` (`1e-7`, `1e+21`).
  - `−0` → `0`; NaN and ±∞ → `null` (unreachable for valid scenes).
- Booleans are `true`/`false`.

Input key order is part of the fingerprint. The corpus inputs keep authored order, and JSON parsing must preserve object key order (e.g. `serde_json` with `preserve_order`). In the app, scenes come from `projectClassicScene` and the validators. The Domain model section must define the canonical nested key order: `room {outerPolygon, heightM, floorMaterialId, ceilingMaterialId}`, wall `{id, a{x,y}, b{x,y}, thicknessM, materialId, kind}`, portal `{id, wallId, center{x,y}, widthM, heightM, open, lossDb}`, settings `{acousticUpdateHz, maxEarlyReflections, hrtfEnabled}`. These are the orders observed in corpus inputs and `primitiveFootprintWalls`. UNVERIFIED for every producer path.

Test vectors:

| Input string | FNV result |
| --- | --- |
| `""` | `811c9dc5` |
| `"a"` | `e40c292c` |
| `"\u{1D11E}"` (one code point) | `30821a63` (same as `"\uD834"` and `"\u{1D11F}"`) |
| CL01 static JSON (833 chars, below) | `6f64ee7f` |

```text
{"schemaVersion":"1.0","units":"m","name":"Pre-delay floor","room":{"outerPolygon":[{"x":0,"y":0},{"x":1.5,"y":0},{"x":1.5,"y":1.5},{"x":0,"y":1.5}],"heightM":2.5,"floorMaterialId":"concrete_hard","ceilingMaterialId":"concrete_hard"},"walls":[{"id":"floor_west","a":{"x":0,"y":1.5},"b":{"x":0,"y":0},"thicknessM":0.2,"materialId":"concrete_hard","kind":"boundary"},{"id":"floor_north","a":{"x":0,"y":0},"b":{"x":1.5,"y":0},"thicknessM":0.2,"materialId":"concrete_hard","kind":"boundary"},{"id":"floor_east","a":{"x":1.5,"y":0},"b":{"x":1.5,"y":1.5},"thicknessM":0.2,"materialId":"concrete_hard","kind":"boundary"},{"id":"floor_south","a":{"x":1.5,"y":1.5},"b":{"x":0,"y":1.5},"thicknessM":0.2,"materialId":"concrete_hard","kind":"boundary"}],"portals":[],"settings":{"acousticUpdateHz":12,"maxEarlyReflections":6,"hrtfEnabled":true}}
```

Other corpus fingerprints: C001 `4a0e1c7b`, DC06 `21c1272d`, CL05 `14905f39`, CL06 `3ac1350b`, LC01 `57caa710`.

The fingerprint is used by the worker static install, by result validation (§11.2) and by pose-lagging frame acceptance (`isPoseLaggingClassicFrame` recomputes it; Runtime section). The Domain model section's `classicProjectionHash` uses the same `charCodeAt(0)`-per-code-point FNV pattern (corpus README).

Source: `src/acoustics/compute-frame.ts:36-94`; `src/acoustics/frame-acceptance.ts:88-96`; `tests/unit/compute-frame.test.ts:276-285`; `tests/unit/static-structure-cache.test.ts:56-89`; `benchmarks/corpus/README.md` (Known limits).

---

## 13. Update-rate helper

`acousticUpdateIntervalMs(requestedHz) = 1000 / min(max(requestedHz, 10), 15)`. A schema value of 5–20 Hz therefore gives an interval of 66.67–100 ms. NaN in gives NaN out. The runtime coalescers use it (Runtime section).

Source: `src/acoustics/update-rate.ts:1-7`; `src/workers/classic-source-pool.ts:434`; `src/hooks/useAcousticFrame.ts:197`.

---

## 14. `src/acoustics/runtime/**` (test-only)

`engine-router.ts`, `feature-flags.ts` and `frame-envelope.ts` are imported only by `tests/unit/engine-router.test.ts`. The live workspace selects the Classic and Hybrid adapters directly.

- `Hybrid3DFlags`: ten booleans (`spatial3d`, `verticalReflections`, `secondOrderReflections`, `receiverConnection`, `sixBandMaterials`, `airAbsorption`, `diffuseScattering`, `directionalLateReverb`, `edgeDiffraction`, `lowFrequencyWaveBranch`), all `false` by default (frozen).
- `createHybrid3DFlags(overrides)` merges overrides, validates and freezes. It throws one `Error` whose message joins all issues with a space. Issues are `"<flag> requires spatial3d to be enabled."` for each of the nine dependents set without `spatial3d`, and `"secondOrderReflections requires verticalReflections to be enabled."`.
- `EngineRouter`:
  - It is constructed with Classic active (`compute = computeAcousticFrame`).
  - `select("hybrid-3d")` with `!flags.spatial3d` returns `{requestedMode, activeMode, fallbackReason: "Hybrid 3D is disabled by feature flags."}`. With no `createHybrid` it returns `"Hybrid 3D is not installed in this build."`. Selecting the active mode clears the reason. Otherwise it creates the new engine, disposes the old one, and clears the reason.
  - `compute(scene, t)` returns `{engine, frame, flags, fallbackReason?}`.
  - The envelope's `frame` is typed as the Classic `AcousticFrame` even for a Hybrid engine.

Do not port this as live behaviour (Review finding V16).

`frame-acceptance.ts` (pose-lagging acceptance, `sameClassicStaticStructure`, `jsonEqual`) is specified in the Runtime/worker pipeline section. It depends on §12.

Source: `src/acoustics/runtime/engine-router.ts:1-94`, `src/acoustics/runtime/feature-flags.ts:1-67`, `src/acoustics/runtime/frame-envelope.ts:1-11`; `tests/unit/engine-router.test.ts`.

---

## 15. Clamps and limits used in calculation

| Limit | Value | Location | Reachable with valid scenes? |
| --- | --- | --- | --- |
| Segment parameter tolerance | t,u ∈ [−1e-8, 1+1e-8], then clamped to [0,1] | §4.2 | yes |
| Parallel threshold | \|r×s\| ≤ 1e-8 m² | §4.2 | yes (scale-dependent) |
| Collinear distance | ≤ 1e-8 m from the route line; overlap > 1e-8 of route | §4.3 | yes |
| Interior crossing | t ∈ (1e-8, 1−1e-8) | §4.4 | yes |
| Reflection-point coincidence | ≤ 1e-8 m | §8.2 | yes |
| Boundary edge match | endpoints ≤ 1e-8 m | §10 | yes |
| Incidence floor | `max(\|d·n\|, 0.25)` | §5 | yes (angles > 75.5° from the normal) |
| Per-wall loss floor | `max(0, TL + adj)` | §5 | yes |
| Direct mid loss cap | 24 dB | §5 | yes |
| High obstruction | `clamp(TL_high/36, 0, 1)` | §5 | yes |
| Direct cutoff | [700, 20000] Hz | §5 | yes |
| Portal cutoff | `clamp(20000−1500n, 1200, 20000)` | §6.4 | lower clamp no (n ≤ 8 → ≥ 8000) |
| Portal turn cosine | `clamp(·, −1, 1)` before `acos` | §6.3 | yes (rounding) |
| Max portals per route | distinct open portals (≤ 8) | §6.3 | yes |
| Taps | `min(6, max(0, floor(maxEarlyReflections)))` | §9 | yes |
| Early window | 0 ≤ delay ≤ 80 ms (vs straight line, ε in ms) | §8.3, §8.4 | yes |
| Output delay | `max(0, ·)` vs `effectiveDistanceM` | §9 | yes |
| First-order gain floor | −60 dB | §8.3 | no (worst about −52.97 dB) |
| Second-order gain floor | −36 dB | §8.4 | yes |
| Second-order path | ≤ 50 m | §8.4 | yes (CL06) |
| Second-order surfaces | `max(2, floor(24))` = 24 | §8.5 | yes (C013) |
| Distance attenuation | `1/max(1, L)` | §8.1 | yes |
| dB floor | amplitude ≥ 1e-8 | §8.1 | no for registry materials (only a zero-specular-energy material would hit it) |
| Reflection cutoff | ratio ≤ 1; `r_mid ≤ 1e-8` → 700 Hz | §8.1 | ratio cap yes (concrete); 700 branch no |
| Opening area | `clamp(Σ, 0, surface area)` | §10 | yes |
| Mean absorption | `clamp(ᾱ, 0, 1−1e-8)` | §10 | upper no for registry materials |
| RT60 | [0.12, 4] s; degenerate → 4 | §10 | yes (C008 0.12, C002 4) |
| Pre-delay | [5, 80] ms | §10 | yes (CL01, CL02) |
| Height | `max(0, heightM)` | §10 | no (schema ≥ 2) |
| Update rate | [10, 15] Hz | §13 | yes |

---

## 16. Corpus coverage (what a port is checked against)

`benchmarks/corpus/v1` holds 27 frozen `classic-frame` cases (`C001`–`C014`, `CL01`, `CL02`, `CL05`, `CL06`, `DC01`–`DC06`, `LC01`, `LC03`, `LC05`) and 2 `classic-tape` cases (`TC01`, `TC02`). Each frame case runs `computeAcousticFrame(scene, 0)` plus `createClassicStaticContext(scene).fingerprint`. All expected outcomes are `ok`.

| Output path (under `/value/frame` or `/value/steps/*/frame`) | Comparison |
| --- | --- |
| `revision`, `generatedAtMs`, `sources/*/{sourceId, routeType, directVisible}`, `occluderWallIds` (+ order), `portalIds` (+ order), `earlyReflections` length and order, `earlyReflections/*/{order, wallId, wallIds/*}`, `/value/staticFingerprint` | exact |
| `room/rt60S/*`, `room/volumeM3`, `physicalDistanceM`, `effectiveDistanceM`, `virtualPosition/*`, `dryGainDb`, `lowpassHz`, `earlyReflections/*/{pathLengthM, delayMs, gainDb}` | `toFixed(6)` equality (can fail on noise at a rounding boundary) |
| `room/preDelayMs`, `room/totalSurfaceM2`, `reverbSendDb`, `routePolyline/*/*`, `earlyReflections/*/{lowpassHz, reflectionPoint/*, reflectionPoints/*/*}` | \|Δ\| ≤ 1e-6 absolute |

Output files cannot hold `-0` (written as `0`). In-memory `-0` vs `0` compares equal in continuous classes. Arrays are compared by index, so tie order is contract.

The unit-level ten-scenario oracle `benchmarks/results/mvp-baseline.json` (`tests/unit/classic-baseline-capture.test.ts`) pins a 6-decimal projection of C001–C010. Note that its `earlyReflections[].wallId` for second-order taps is the **second** wall.

Mutation evidence. I applied single-constant mutations to my re-implementation and checked which of the 27 frame cases (not the tapes or unit tests) detect them:

- **Detected**: loss cap 24; portal low-pass penalty 1500; RT60 floor 0.12; open-portal full absorption; null-surface full absorption (CL06); partition ×2 faces; Eyring vs Sabine; scattering in specular amplitude; reflection-cutoff ratio cap; second-order only-when-blocked; delay re-reference to `effectiveDistanceM`; pre-delay floor 5; second-order 50 m (CL06); surface budget 24→100 (C013 only); merge `localeCompare` (LC01 only); first-order 80 ms→70 ms (CL02 only).
- **Not detected (unpinned)**: Portal turn weight 0.25→0.5; Portal loss weight 0.08→0.5; incidence floor 0.25→0.2; high-band divisor 36→40; second-order gain floor −36→−40 or →−30; second-order 80 ms→70 ms; first-order −60→−40; surface budget 24→10; `localeCompare`→code-unit at the first-order, second-order wall pre-sort and room-boundary sites; RT60 degenerate value 4→5; V8 `hypot` vs naive `sqrt(dx²+dy²)`.

The portal unit tests compute expected costs with the exported `edgeCost`, so they cannot detect weight changes either.

Source: `benchmarks/corpus/README.md`; `benchmarks/corpus/v1/comparison-rules.json`; `benchmarks/corpus/harness/ts-serial-adapter.ts:58-63,277-296`; `benchmarks/corpus/harness/definitions/{limits,degenerate}.ts`; `src/benchmarks/classic-baseline.ts`.

---

## 17. Disagreements with `docs/ACOUSTICS.md`

| Doc claim | Code behaviour |
| --- | --- |
| §1: "offset reflection origins by epsilon to avoid immediate self-intersection"; "require both parameters in [0,1]" | No offset. Parameters accepted in [−ε, 1+ε] and clamped. Self-hits are handled by endpoint exclusion (t ∉ (ε, 1−ε)) and a 1e-8 m reflection-point allowance (§8.2). |
| §5: "retain absolute path delays internally … a negative transport value is rejected" | Taps store only the relative `delayMs`, clamped with `max(0, ·)`; nothing is rejected in `compute-frame.ts`. Absolute time is derivable from `pathLengthM`. A blocked route without a portal uses the straight-line distance as reference. |
| §6: distance law "clamp d to a practical maximum" | Reflection gain uses `1/max(1,L)` with no maximum. The direct-path distance law is not in the Classic frame; the audio engine applies it with a 50 m clamp. |
| §7: "These constants must be centralized and exposed in debug information" | 700/20000 Hz are defined twice, 343 three times (one literal), `materialFor` is duplicated, and none of these are exposed in the frame. |
| §8: "Select the minimum-cost valid path using Dijkstra" | Label-setting search over (previous, current, visited-mask) states with a total tie-break comparator (§6.3). Intermediate open portals in the way block a leg; they are not waived. |
| §9: "Reject taps with negligible gain or delay above the configured early-reflection window" | Window fixed at 80 ms, measured against the straight-line distance, not configurable. First-order floor −60 dB (unreachable). Second-order floor −36 dB. |
| §9.0.1: "prunes pairs whose image path exceeds 50 m" | Checked on the summed three-leg length after all visibility checks. "Representative" means the 24 walls with the smallest first-order image distance (undocumented). |
| §10: `A_b = Σ S_i α_i,b` | Open-portal area, polygon edges without an exactly matching boundary wall, and (Hybrid only) a disabled ceiling are counted with α = 1. Boundary walls off the polygon are ignored. |
| "Three frequency bands … near 250 Hz / 1 kHz / 4 kHz" | No frequencies exist in the code. The low band affects only `RT60.low` (and an unused transmission value). |
| Table row "full absorption for open-portal area", "Classic loss cap 24 dB", "Bounded second-order search only with blocked direct visibility" | Agree. |

---

## Review findings

### Verified

I verified these by reading the code. Where marked "repro", I also reproduced them with the corpus-exact re-implementation.

- **V1** `src/acoustics/portal.ts:228-245`: an open portal whose center is more than about 1e-8 relative off its host wall line disables Portal routing, because the host-wall hit is only waived at `t ≤ 1e-8`. Validation accepts offsets up to 0.01 m (`src/domain/scene/geometry-validation.ts:6,141`). Repro: moving C003's door center by 1e-6 m turns both sources from `portal` to `blocked`. Hybrid inherits this through `computeClassicSourceRoute`.
- **V2** `src/acoustics/image-source.ts:83-91,117-149`: a source or listener lying on a wall line within the segment yields a "ghost" first-order tap at that point, with 0 ms excess delay and near-direct gain. This is pinned by corpus `DC03` (`stub_wall` −16.10 dB, 0 ms). Parity requires it, but it is acoustically wrong.
- **V3** `src/acoustics/image-source.ts:61-91`: reflection points inside an open portal aperture are accepted, so sound reflects off an open doorway. Repro: a tap at the door center (5,4).
- **V4** `src/acoustics/geometry.ts:135-165` vs `src/acoustics/portal.ts:200-213`: two "strictly inside portal" tests compute the along-wall distance in different floating-point orders (normalise then dot, vs dot then divide), and have different scope (any portal on the wall vs the endpoint's own portal). Results can differ at the door edge.
- **V5** `src/acoustics/compute-frame.ts:104-121`: any Portal route replaces direct transmission. Repro: a transparent (0 dB) foliage partition with a 24 dB door yields −24 dB. `transmissionLossDb` (all bands, `occlusion.ts:78-91`) never reaches the frame, so the low band is dead.
- **V6** `src/acoustics/compute-frame.ts:170`: `reverbSendDb` is the constant 0. It is a contract field with no model behind it.
- **V7** `src/acoustics/portal.ts:340`: `dryGainDb = −portalLossDb` emits `-0` for zero-loss portals (repro). `occlusion.ts:88` guards this case; portal does not.
- **V8** `src/acoustics/compute-frame.ts:55-62`: FNV hashes `charCodeAt(0)` per code point (high surrogate only), which causes collisions (corpus LC03/LC05). The hashed text depends on key order and includes `name`, `acousticUpdateHz` and `hrtfEnabled`, which do not affect Classic acoustics. Renaming the scene or toggling HRTF forces a static reinstall (`compute-frame.ts:64-78`).
- **V9** `image-source.ts:151,225,238`, `compute-frame.ts:158`, `room-acoustics.ts:62`: `localeCompare` without a locale makes output order host-locale dependent. The same model uses code-unit order at `geometry.ts:131` and `portal.ts:118-161,289-304`, so it runs two collation regimes.
- **V10** `src/acoustics/image-source.ts:68-78`: a reflection point that exactly coincides with another wall's endpoint (corner or junction) is dropped. In C001 the radio's north and south boundary taps vanish at the partition junctions. This gives a discontinuity as a listener moves through such positions.
- **V11** `src/acoustics/image-source.ts:9`, `src/acoustics/portal.ts:14`, `src/acoustics/image-source.ts:95-97`: `MIN_REFLECTION_GAIN_DB`, `MIN_PORTAL_LOWPASS_HZ` and the `r_mid ≤ ε` branch cannot be reached with valid scenes (dead guards).
- **V12** `src/acoustics/image-source.ts:131-135,182-194` vs `src/acoustics/compute-frame.ts:163-166`: the 80 ms window is checked against the straight-line distance, but output delays are re-referenced to the Portal route. Taps are dropped that would fall inside the window relative to the audible route.
- **V13** `compute-frame.ts:165` (literal 343), `occlusion.ts:8-9` and `image-source.ts:10-11` (duplicate cutoffs), and `image-source.ts:16`, `room-acoustics.ts:23`, `occlusion.ts:31` (triplicated material lookup with linear `find`): duplicated constants and lookups.
- **V14** `tests/unit/portal.test.ts:102-105`: weights in expected costs come from the production `edgeCost`, so the tests cannot catch weight drift. The corpus also leaves turn and loss weights, the incidence floor 0.25, the /36 divisor, the second-order −36 dB and 80 ms checks, and three of the five `localeCompare` sites unpinned (§16). These are missing tests.
- **V15** `src/acoustics/room-acoustics.ts:51-81`: a boundary wall must match a polygon edge exactly (1e-8 m) and cover the whole edge. Otherwise the edge becomes a fully absorbing opening. Repro: a 1 µm mismatch changes C001 mid RT60 from 2.345 s to 0.796 s. Split or shortened boundary walls are treated as missing.
- **V16** `src/acoustics/runtime/engine-router.ts:1-94`, `feature-flags.ts`, `frame-envelope.ts`: test-only code. The envelope types Hybrid frames as the Classic `AcousticFrame`. `PortalRoute.cost` (`types.ts:35`) and `OcclusionEstimate.transmissionLossDb` are never consumed by the frame. Do not copy as live behaviour.
- **V17** `src/acoustics/compute-frame.ts:84-94`: `createClassicPoseSnapshot` trusts a supplied context without checking it belongs to the scene (`tests/unit/compute-frame.test.ts:283-284`), which is a latent mismatch path.
- **V18** `src/acoustics/image-source.ts:219-227`: the comparator recomputes two reflections per comparison during the 24-wall pre-sort. This is harmless but wasteful.

### Suspected (not reproduced)

- **S1** `src/acoustics/geometry.ts:40`: the parallel threshold `|r×s| ≤ 1e-8` is in m². For short legs and walls, a genuine near-grazing crossing (sin θ below about 1e-8/(|r||s|)) whose endpoints lie more than 1e-8 m off the line is missed by both tests, so a leak through the wall is possible.
- **S2** `src/acoustics/geometry.ts:78`, `src/acoustics/image-source.ts:44`, `src/acoustics/portal.ts:191-196`: ε is compared against squared lengths or un-normalised dot products. The tolerances are effectively 1e-4 m or `1e-8/L` m rather than 1e-8 m. This is harmless with a 0.1 m minimum wall length, but it is a unit inconsistency.
- **S3** `src/acoustics/portal.ts:354,365-368`: the `1 << portalBit` mask overflows past 31 open portals. The schema caps portals at 8.
- **S4** `src/acoustics/compute-frame.ts:158` and others: hosts whose default locale tailors `_ - : >` or case could reorder ties. Probes covered only the locales listed in the corpus README.
- **S5** `src/acoustics/compute-frame.ts:97-123` together with `src/audio/math.ts:29-39`: direct distance attenuation (audio, clamped at 50 m) and reflection attenuation (`1/max(1,L)`, unclamped) diverge for Portal routes longer than 50 m, which changes the reflection-to-direct balance.

---

## Rewrite notes

### Must be preserved for numerical parity with the corpus and oracle

1. Every constant in §2, and every ε use with its exact comparison (`≤` vs `<`, inclusive tolerance bands, clamping of t/u, strict door-edge tests).
2. The evaluation order of all formulas, including left-to-right summations (crossing losses, leg lengths, surfaces, absorption per surface then band, portal openings). Use no FMA. Use V8 `Math.hypot` exactly (§1.2). Use fdlibm-equivalent `log`, `log2`, `log10`, `acos`, `pow` where possible.
3. The candidate pipeline: first-order over walls in input order; second-order over the 24 walls pre-sorted by image distance; ordered pairs `first × second`; the reject checks in their stated order; both lists sorted and capped before the merge; the merge sort; the cap at `min(6, floor(maxEarlyReflections))`; delay re-referencing to `effectiveDistanceM` with `max(0, ·)`.
4. Both collation regimes (§1.3). Code-unit order for crossings, portal and node sorting and route tie-breaks. ICU `localeCompare` semantics for the five listed sites, at least for the alphabet `[A-Za-z0-9_\-:>]`.
5. Route selection semantics (§7): Portal replaces transmission; occluders are reported for Portal routes; `virtualPosition` is the last portal center; the Portal cost function and total comparator.
6. Room model details (§10): exact-edge boundary matching with `localeCompare` tie-break; full absorption for openings and unmatched edges; partitions on both faces; volume without subtraction; the clamps.
7. The fingerprint (§12): top-level key order, nested input key order, ECMAScript `JSON.stringify` number and string formatting, and FNV-1a over code points with the high-surrogate quirk. Corpus `LC03` and `LC05` require the collision.
8. Output shape and array orders (§11.3), including `reverbSendDb = 0`, `order`, `wallIds` and `reflectionPoints` on every tap, and authored source order.
9. The degenerate behaviours the corpus pins: ghost tap (`DC03`), collinear-overlap blocking with +12 dB (`DC02`), strict door edge (`DC04`), no reflections when source equals listener (`DC01`), zero taps (`DC06`).

### Incidental (free to change without affecting outputs)

- The binary-heap implementation (any min-priority queue with the §6.3 comparator), the string state keys, and object identity for stale detection.
- Object key order of output records, aliasing of input `Vec2` objects, the internal `revision: 0` scene rebuild, and recomputing reflections inside the sort comparator.
- The worker-shaped decomposition (`ClassicPoseSnapshot`, `ClassicSourceResult`, `assembleAcousticFrame` checks), as long as the frame is identical. Its error texts are not corpus-pinned.
- `src/acoustics/runtime/**` (EngineRouter, feature flags, envelope): test-only.
- `PortalRoute.cost`, `OcclusionEstimate.transmissionLossDb`, `estimateRoomAcoustics` `ceilingEnabled` (needed only by Hybrid).

### Should not be copied blindly

These need an ADR plus a new corpus version if changed (`AGENTS.md`, `benchmarks/corpus/README.md`):

- V1 off-line portal center, V2 ghost taps, V3 doorway reflections, V5 transmission discarded, V6 constant reverb send, V12 window reference mismatch, V15 exact-edge boundary matching. Changing any of these alters frozen outputs, so a parity port must first reproduce them and record each as a known defect.
- V8 key-order-dependent, surrogate-lossy hash over non-acoustic fields. A port needs it for parity, but should keep any new internal cache key separate from the compatibility fingerprint.
- V9 host-locale-dependent ordering. Implement the fixed collation table from §1.3 instead of calling the platform locale, so results do not depend on the host.
