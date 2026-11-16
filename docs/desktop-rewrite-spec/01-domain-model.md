# 01 — Domain model, authoring state, validation, persistence, projections

This section specifies the data model and every rule that creates, edits, validates, stores, imports, exports and projects it. Calculation, audio, the worker pipeline and UI rendering are specified elsewhere ("Classic acoustics", "Hybrid 3D acoustics", "Audio engine", "Runtime/worker pipeline", "Frontend UI", "Backend/AI/infra/tests"). Where behavior here depends on JavaScript semantics, the JS rule is stated so a Rust implementation can reproduce it.

Terminology used throughout:

| Term | Meaning |
| --- | --- |
| Plan frame | The 2D frame of `SceneSpec` (`Vec2 {x, y}`). |
| Authoring frame | The 3D frame of `WorkspaceProject` and `SceneDocumentV2` (`Vec3 {x, y, z}`, y up). |
| Project | One `WorkspaceProject`. There are exactly two at a time: Classic (`classic-2d5d`) and Hybrid (`hybrid-3d`). |
| Accepted edit | A reducer result that changed acoustic content and incremented `revision`. |
| Rejection | A reducer result that changed only `notice` (the rest of the project is the same object). |
| Projection | The pure function that reduces a project to calculation input (`SceneSpec` or `SceneDocumentV2`). |
| `clamp(v, lo, hi)` | Always `min(hi, max(lo, v))` with JS `Math.min`/`Math.max` semantics: when `lo > hi` the result is `hi`; NaN propagates. |
| "ID" | A string matching `^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$` unless stated otherwise (§3). |

---

## 1. Coordinate systems and units

| Quantity | Unit | Notes |
| --- | --- | --- |
| Length, position, dimension, thickness | metre | `units: "m"` is the only allowed value in `SceneSpec`. |
| Gain, loss | dB | `gainDb` (source), `lossDb` (Portal), `transmissionLossDb` (material). |
| Angles | degrees | `headingDeg`, `rotationYDeg`, camera `yawDeg`/`pitchDeg`. Converted with `rad = deg * Math.PI / 180` (evaluate as `(deg * π) / 180`). |
| Update rate | Hz | `settings.acousticUpdateHz`. |
| File size | bytes | local audio metadata `size`. |
| Timestamps | ms since Unix epoch (`Date.now()`) | local audio metadata `createdAt`. |

**Plan frame (Classic, `SceneSpec`).** `Vec2 {x, y}`; each coordinate finite and in `[-50, 50]`. The room is any simple polygon of 3–32 vertices; it need not be convex, origin-anchored or wound in a particular direction (only `|signed area| > 1e-8` is required). The Classic canvas draws +y upward (screen y is flipped, §11.3).

**Authoring frame (Hybrid, `WorkspaceProject`, `SceneDocumentV2`).** `Vec3 {x, y, z}`: x right, y up, z forward; `SceneDocumentV2` names it `"x-right-y-up-z-forward"`. The Hybrid UI help text says "North is positive Z".

**Mapping between frames.** `plan.x = authoring.x`, `plan.y = authoring.z`. The authoring y (height) is not in `SceneSpec`; it is stored beside it:

| Entity | Plan data (in `scene`) | Height data (outside `scene`) |
| --- | --- | --- |
| Listener | (only the active listener is projected) | `listeners[i].position.y` |
| Source | `scene.sources[i].position {x, y}` | `sourceHeightsM[sourceId]` |
| Wall | `scene.walls[i].a`, `.b`, `.thicknessM` | `wall3dById[wallId] {bottomM, topM, thicknessM}` |
| Portal | `scene.portals[i].center`, `.widthM`, `.heightM` | `portal3dById[portalId] {bottomM, topM, thicknessM}` |
| Primitive | none (whole record lives in `primitives`) | `primitives[i].position.y` |

**Floor elevation.** In authoring state the floor is always at y = 0 and heights are measured from it. `SceneDocumentV2.extensions.spatial3d.floorElevationM` may be any value in `[-10, 10]`; its heights are absolute (`ceiling = floorElevationM + room.heightM`). Projections always emit `floorElevationM: 0`. Migration from a V2 document ignores `floorElevationM` and copies heights unchanged (see Review findings).

**Rectangular room convention.** `room3d.widthM` spans x and `room3d.depthM` spans z from the origin corner. Every rectangle the domain generates (Hybrid projection, room resize) is `[(0,0), (w,0), (w,d), (0,d)]` in that vertex order.

**Primitive yaw.** A plan point `(x, y=z)` is rotated by `rotationYDeg = θ` as `x' = x·cos θ − y·sin θ`, `y' = x·sin θ + y·cos θ`, then translated by `(position.x, position.z)`. This formula is the only interpretation of `rotationYDeg` in the domain.

**Listener heading.** The domain only stores and range-checks `headingDeg`; it never interprets it. The forward-vector convention is defined in the Audio engine section.

There are no levels, storeys or multiple rooms. A project has exactly one room, one floor and one optional ceiling. The pseudo-entities `room`, `floor` and `ceiling` exist only as `surface` selections and disable targets (§6.4).

Source: `src/domain/scene/types.ts`, `src/domain/scene/schema.ts`, `src/domain/workspace/types.ts`, `src/domain/workspace/primitives.ts`, `src/domain/workspace/projections.ts`, `src/domain/scene-document/schema.ts`, `src/domain/scene-document/validate.ts`, `src/domain/editor/coordinates.ts`, `src/domain/workspace/spatial-validation.ts` (header comment), `src/components/lab/HybridSpatialViewport.tsx` (help text), `src/audio/AudioEngine.ts` (heading use only).

---

## 2. Registries

### 2.1 Materials

Five materials, in this order (the order is observable: it is the order of `MATERIALS` and of the `z.enum` for V2 primitive `materialId`). All values are perceptually tuned, not measured.

| id | displayName | absorption low / mid / high | transmissionLossDb low / mid / high | scattering | referenceThicknessM |
| --- | --- | --- | --- | --- | --- |
| `concrete_hard` | Hard concrete | 0.05 / 0.04 / 0.03 | 28 / 34 / 40 | 0.08 | 0.2 |
| `soft_foliage` | Soft foliage | 0.25 / 0.55 / 0.75 | 8 / 10 / 12 | 0.7 | 0.4 |
| `water_like` | Water-like surface | 0.02 / 0.04 / 0.06 | 12 / 16 / 20 | 0.03 | 0.1 |
| `wood_medium` | Medium wood | 0.12 / 0.18 / 0.24 | 18 / 22 / 26 | 0.2 | 0.12 |
| `acoustic_treatment` | Acoustic treatment | 0.55 / 0.9 / 0.96 | 12 / 16 / 20 | 0.35 | 0.1 |

Type: `AcousticMaterial = {id: string, displayName: string, absorption: Band3, transmissionLossDb: Band3, scattering: number, referenceThicknessM: number}`, `Band3 = {low, mid, high}`.

**Energy invariant (checked at module load; violation throws `Invalid material energy for <id>.<band>`).** For each band b:

```
τ_b = 10^(−transmissionLossDb_b / 10)          // transmitted energy fraction
0 ≤ absorption_b ≤ 1
transmissionLossDb_b ≥ 0
absorption_b + τ_b ≤ 1 + 1e-8
```

`scattering` and `referenceThicknessM` are not validated. The reflected energy `R_b = 1 − absorption_b − τ_b` is not stored; it is derived by the acoustics code. Reference values (4 significant digits) for checking a port:

| id | τ low / mid / high | R low / mid / high |
| --- | --- | --- |
| `concrete_hard` | 0.001585 / 0.0003981 / 0.0001000 | 0.9484 / 0.9596 / 0.9699 |
| `soft_foliage` | 0.1585 / 0.1000 / 0.06310 | 0.5915 / 0.3500 / 0.1869 |
| `water_like` | 0.06310 / 0.02512 / 0.01000 | 0.9169 / 0.9349 / 0.9300 |
| `wood_medium` | 0.01585 / 0.006310 / 0.002512 | 0.8642 / 0.8137 / 0.7575 |
| `acoustic_treatment` | 0.06310 / 0.02512 / 0.01000 | 0.3869 / 0.07488 / 0.03000 |

A unit test also requires the `acoustic_treatment` specular energy `R_b · (1 − scattering)` to be ≤ 0.05 (mid) and ≤ 0.02 (high). The registry and every material object are deeply immutable.

Source: `src/domain/materials/registry.ts`, `tests/unit/material-registry.test.ts`.

### 2.2 Built-in audio assets

`AudioAsset = {id, label, url, channels: 1, loop: boolean, license: string, attribution?: string}`. Registration throws `Audio asset <id> must use a local URL` unless `url` starts with `/audio/` and does not contain `://`.

| id | label | url | channels | loop | license | attribution |
| --- | --- | --- | --- | --- | --- | --- |
| `radio_loop` | Radio loop | `/audio/radio-loop.wav` | 1 | true | Self-authored procedural audio | Echo Canvas procedural generator, 2026 |
| `rain_loop` | Rain loop | `/audio/rain-loop.wav` | 1 | true | same | same |
| `voice_loop` | Voice loop | `/audio/voice-loop.wav` | 1 | true | same | same |
| `water_loop` | Water loop | `/audio/water-loop.wav` | 1 | true | same | same |

Source: `src/domain/audio-assets/registry.ts`.

### 2.3 Local audio asset references (as they appear in project files)

A source `clipId` is either a built-in ID (§2.2) or a local ID. Local IDs are generated as `"local_" + crypto.randomUUID()` with every `-` replaced by `_` (42 characters). Scene validation accepts a local clip ID when it matches `^local_[a-zA-Z0-9_]{1,57}$` (it must also match the general ID regex, §3).

`LocalAudioAssetMetadata` (stored in `WorkspaceProject.localAudioMetadata` and in the transfer file's `localAssets`):

| Field | Type | Validation at import/cache boundary | Producer value |
| --- | --- | --- | --- |
| `id` | string | non-empty (no format check) | the local clip ID |
| `name` | string | 1–120 code points | file name truncated to the first 120 UTF-16 units |
| `mimeType` | string | non-empty | the file's MIME type as reported (accepted types are checked case-insensitively against `audio/wav`, `audio/x-wav`, `audio/mpeg`, `audio/mp3`, `audio/ogg`, but stored unchanged) |
| `size` | integer ≥ 0 | integer, non-negative | byte length |
| `createdAt` | number | finite | `Date.now()` at first add; preserved on relink |

Audio blobs are never stored in projects, caches or exports. Storage, size limits (25 MiB per file, 100 MiB per library), mono decoding and relinking mechanics belong to the Audio engine section.

Source: `src/domain/audio-assets/local-library.ts` (ID generation, metadata production only), `src/domain/workspace/types.ts`, `src/domain/workspace/transfer.ts`, `src/domain/workspace/persistence.ts`, `src/domain/scene/validate.ts`.

---

## 3. IDs and namespaces

| Rule | Detail |
| --- | --- |
| General ID regex | `^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$`: 1–64 ASCII characters, first alphanumeric, then alphanumerics, `_` or `-`. JS regex without flags: `$` matches only at end of input (a trailing `\n` is rejected). |
| Where the regex applies | Every `SceneSpec` `id`, `wallId`, `clipId`, `floorMaterialId`, `ceilingMaterialId`, `materialId`; V2 primitive `id`; V2 `sourceHeightsM` keys. |
| Where it does not apply | Listener IDs, authoring primitive IDs, selection IDs, record keys in `wall3dById`/`portal3dById`/`sourceHeightsM` of the authoring envelope, `disabledEntityIds` entries: only "non-empty string". V2 `wallVerticalBoundsM`/`portalVerticalBoundsM` keys: any string. |
| Shared uniqueness namespace | Wall, Portal and source IDs must be unique together within a `SceneSpec` (one set). |
| Separate namespaces | Listener IDs are unique among listeners; primitive IDs among primitives (checked only at import/cache boundaries and in V2 documents, not by the reducer). |
| Disabled set | `disabledEntityIds` is one flat set of strings across walls, Portals, sources, primitives and the surface `ceiling` (and any other surface ID). Type is not recorded. |
| Synthetic IDs | Classic projection emits `primitive:<primitiveId>:<segmentIndex>` wall IDs. These violate the general ID regex (see Review findings). `primitiveIdFromFootprintWall(id)` returns the middle part when `id` starts with `primitive:` and splits into exactly 3 `:`-separated parts, else null. |
| Reserved surface IDs | `room`, `floor`, `ceiling` (entity type `surface`). |

IDs created by the UI (Frontend UI section owns the gestures) are `"<prefix>_" + (project.revision + 1)`: `listener_N`, `source_N`, `wall_N`, `portal_N`, `box_N`, `cylinder_N`, `sphere_N`. The default listener ID is `listener_primary`.

Source: `src/domain/scene/schema.ts`, `src/domain/scene/validate.ts`, `src/domain/scene-document/schema.ts`, `src/domain/workspace/persistence.ts`, `src/domain/workspace/primitives.ts`, `src/components/workspace/UnifiedWorkspace.tsx` (ID creation).

---

## 4. SceneSpec v1

### 4.1 Fields

All objects are strict: an unknown key is an error (`unrecognized_keys`). All numbers must be finite (NaN, ±Infinity rejected with `invalid_type`). String lengths are counted in Unicode code points (a surrogate pair counts once). "int" means a JS safe integer (|n| ≤ 9007199254740991).

| Path | Type | Schema bound | Semantic rule (§4.3) |
| --- | --- | --- | --- |
| `schemaVersion` | `"1.0"` | literal | |
| `revision` | int | ≥ 0 | |
| `units` | `"m"` | literal | |
| `name` | string | 1–80 | |
| `room.outerPolygon` | Vec2[] | 3–32 items | simple polygon; bounding box width and height ≤ 50 m |
| `room.heightM` | number | 2–12 | |
| `room.floorMaterialId` | ID | | registered material |
| `room.ceilingMaterialId` | ID | | registered material |
| `walls` | array | ≤ 100 items (may be empty) | |
| `walls[].id` | ID | | unique (walls ∪ Portals ∪ sources) |
| `walls[].a`, `walls[].b` | Vec2 | | `distance(a, b) ≥ 0.1` |
| `walls[].thicknessM` | number | 0.02–2 | |
| `walls[].materialId` | ID | | registered material |
| `walls[].kind` | `"boundary"` \| `"partition"` | enum | |
| `portals` | array | ≤ 8 items | |
| `portals[].id` | ID | | unique |
| `portals[].wallId` | ID | | must name a wall |
| `portals[].center` | Vec2 | | lies on and fits within the host wall |
| `portals[].widthM` | number | 0.4–8 | |
| `portals[].heightM` | number | 1–6 | ≤ `room.heightM` |
| `portals[].open` | boolean | | |
| `portals[].lossDb` | number | 0–24 | |
| `sources` | array | 1–4 items | |
| `sources[].id` | ID | | unique |
| `sources[].name` | string | 1–60 | |
| `sources[].clipId` | ID | | built-in asset ID or `^local_[a-zA-Z0-9_]{1,57}$` |
| `sources[].sourceType` | `"point"` | literal | |
| `sources[].position` | Vec2 | | inside the room polygon (boundary counts as inside) |
| `sources[].gainDb` | number | −36–6 | |
| `sources[].loop` | boolean | | |
| `listener.position` | Vec2 | | inside the room polygon |
| `listener.headingDeg` | number | −360–360 | |
| `settings.acousticUpdateHz` | int | 5–20 | **must be 10–15** |
| `settings.maxEarlyReflections` | int | 0–6 | |
| `settings.hrtfEnabled` | boolean | | |
| `Vec2.x`, `Vec2.y` | number | −50–50 | |

The effective accepted range of `acousticUpdateHz` is the integers 10–15. Docs (`AGENTS.md`, `docs/ARCHITECTURE.md`) say "schema accepts 5–20 Hz; coordinators clamp to 10–15 Hz"; the code rejects 5–9 and 16–20 in `validateScene` (code `acoustic_update_rate_out_of_range`). The JSON Schema file and the Zod schema express only 5–20.

`SceneSpec.listener` is a single listener. Inside a `WorkspaceProject` it is a stale copy that only `REPLACE_SCENE` and migration set; projections overwrite it with the active listener (§17.1).

Source: `src/domain/scene/types.ts`, `src/domain/scene/schema.ts`, `src/domain/scene/validate.ts`, `schemas/scene-spec.schema.json`, `node_modules/zod` 4.6.7 (`checks.js` length counting).

### 4.2 Validation pipeline (`validateScene(input) → {ok: true, scene} | {ok: false, errors}`)

1. Parse with the Zod schema. On any schema issue, return `ok: false` with **only** the schema issues; semantic checks do not run. Each issue becomes `{path, code, message}` where `path` is the Zod path joined with `.` (array indices as decimal, root is `""`), and `code`/`message` are Zod 4's. Issues are reported in schema key order; an object's `unrecognized_keys` issue follows its field issues.
2. On success the parsed copy (`scene`, keys in schema order) is checked, appending errors in this order:
   1. registry IDs (room floor, room ceiling, each wall material, each source clip);
   2. unique IDs;
   3. update rate;
   4. geometry.
3. Return `{ok: true, scene: parsedCopy}` if no errors, else `{ok: false, errors}`.

Zod 4.6.7 issue codes and message formats that reach the UI verbatim (notice text is `errors[0].message`):

| Situation | code | message example |
| --- | --- | --- |
| String too short / long | `too_small` / `too_big` | `Too small: expected string to have >=1 characters` |
| Number out of range | `too_small` / `too_big` | `Too big: expected number to be <=50` |
| Array too short / long | `too_small` / `too_big` | `Too big: expected array to have <=100 items`, `Too small: expected array to have >=1 items` |
| Int above safe range | `too_big` | `Too big: expected int to be <=9007199254740991` |
| Regex mismatch | `invalid_format` | `Invalid string: must match pattern /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/` |
| Wrong type / missing key | `invalid_type` | `Invalid input: expected number, received undefined` (also `received NaN`, `received Infinity`, `expected int, received number`, `expected object, received null`, `expected object, received array`) |
| Literal mismatch | `invalid_value` | `Invalid input: expected "m"` |
| Enum mismatch | `invalid_value` | `Invalid option: expected one of "boundary"\|"partition"` |
| Unknown keys | `unrecognized_keys` | `Unrecognized key: "extra"`; several: `Unrecognized keys: "extra", "extra2"` |

Semantic errors:

| Check | path | code | message |
| --- | --- | --- | --- |
| Unregistered floor/ceiling material | `room.floorMaterialId` / `room.ceilingMaterialId` | `unknown_material_id` | `Unknown material ID: <id>` |
| Unregistered wall material | `walls.<i>.materialId` | `unknown_material_id` | `Unknown material ID: <id>` |
| Unknown clip | `sources.<i>.clipId` | `unknown_audio_asset_id` | `Unknown audio asset ID: <id>` |
| Duplicate ID (walls, then Portals, then sources; first occurrence wins, each later one reported) | `walls.<i>.id` / `portals.<i>.id` / `sources.<i>.id` | `duplicate_id` | `Duplicate entity ID: <id>` |
| Rate not in [10, 15] | `settings.acousticUpdateHz` | `acoustic_update_rate_out_of_range` | `Acoustic update rate must be between 10 and 15 Hz` |
| Polygon not simple | `room.outerPolygon` | `polygon_self_intersection` | `Room outer polygon must be simple and non-self-intersecting` |
| Bounding box width or height > 50 | `room.outerPolygon` | `room_dimension_exceeded` | `Room width and height must not exceed 50 m` |
| Wall shorter than 0.1 m (strict `<`) | `walls.<i>` | `wall_too_short` | `Wall length must be at least 0.1 m` |
| Portal host missing (then skip that Portal's other checks) | `portals.<i>.wallId` | `unknown_wall_id` | `Unknown portal wall ID: <wallId>` |
| Portal off or too wide for host | `portals.<i>.center` | `portal_detached` | `Portal must lie on and fit within its referenced wall` |
| Portal taller than room | `portals.<i>.heightM` | `portal_too_tall` | `Portal height must not exceed room height` |
| Listener outside polygon (only if polygon simple) | `listener.position` | `position_out_of_bounds` | `Listener position must be inside the room` |
| Source outside polygon (only if polygon simple) | `sources.<i>.position` | `position_out_of_bounds` | `Source position must be inside the room` |

Walls are not required to be inside the room polygon. Portals have no material.

Source: `src/domain/scene/validate.ts`, `src/domain/scene/schema.ts`.

### 4.3 Geometry algorithms

Constants: `EPSILON = 1e-8`, `MIN_WALL_LENGTH_M = 0.1`, `MAX_ROOM_DIMENSION_M = 50`, `PORTAL_ATTACHMENT_TOLERANCE_M = 0.01`. `distance(a, b) = Math.hypot(b.x − a.x, b.y − a.y)`. `cross(a, b, c) = (b.x − a.x)(c.y − a.y) − (b.y − a.y)(c.x − a.x)`.

```
pointOnSegment(p, a, b, tol = EPSILON):
  L = distance(a, b)
  if L <= EPSILON: return distance(p, a) <= tol
  perp = |cross(a, b, p)| / L
  dot  = (p.x − a.x)(p.x − b.x) + (p.y − a.y)(p.y − b.y)
  return perp <= tol && dot <= tol * L

segmentsIntersect(a, b, c, d):
  abC = cross(a,b,c); abD = cross(a,b,d); cdA = cross(c,d,a); cdB = cross(c,d,b)
  if ((abC > E && abD < −E) || (abC < −E && abD > E)) &&
     ((cdA > E && cdB < −E) || (cdA < −E && cdB > E)): return true
  return (|abC| <= E && pointOnSegment(c,a,b)) || (|abD| <= E && pointOnSegment(d,a,b)) ||
         (|cdA| <= E && pointOnSegment(a,c,d)) || (|cdB| <= E && pointOnSegment(b,c,d))

isSimplePolygon(P):                       // n = |P|
  if n < 3: return false
  for i in 0..n-1:
    a = P[i]; b = P[(i+1) % n]
    if distance(a, b) <= EPSILON: return false
    for j in i+1..n-1:
      if j == i+1 or (i == 0 and j == n−1): continue        // adjacent edges
      if segmentsIntersect(a, b, P[j], P[(j+1) % n]): return false
  twiceArea = Σ_i (P[i].x·P[i+1].y − P[i+1].x·P[i].y)       // indices mod n
  return |twiceArea| > EPSILON

pointInPolygon(p, P):                      // boundary counts as inside
  inside = false
  for i in 0..n-1 with prev = (i == 0 ? n−1 : i−1):
    a = P[prev]; b = P[i]
    if pointOnSegment(p, a, b): return true
    if (a.y > p.y) != (b.y > p.y) and p.x < (b.x − a.x)(p.y − a.y)/(b.y − a.y) + a.x: inside = !inside
  return inside

roomDimensions(P) = {width: max x − min x, height: max y − min y}

portalFitsWall(center, widthM, A, B):
  L = distance(A, B); if L <= EPSILON: return false
  t = ((center − A)·(B − A)) / L²
  proj = A + t·(B − A)
  if distance(center, proj) > 0.01 + EPSILON: return false
  fromA = t·L; fromB = L − fromA; half = widthM / 2
  return fromA + EPSILON >= half && fromB + EPSILON >= half && widthM <= L + EPSILON
```

Source: `src/domain/scene/geometry-validation.ts`.

### 4.4 SceneSpec serialization functions

These are library functions; the live UI does not call them (tests and the Hybrid pool tests do). They define the standalone `SceneSpec` file format.

| Function | Behavior |
| --- | --- |
| `serializeScene(scene)` | `validateScene`; on failure throw `SceneSerializationError("Scene validation failed", errors)`; else `JSON.stringify(parsedCopy, null, 2)`. |
| `parseScene(json)` | `JSON.parse` failure → `SceneSerializationError("Scene JSON must be valid JSON")`. If the value is a non-null object with a `schemaVersion` key: value ≠ `"1.0"` → `Unsupported scene schema version: <String(value)>`; else validate as v1 (same error as above). Otherwise parse as a scene document (§5.4) and return a deep copy of its `baseScene` (a V2 document is down-converted); document errors are rethrown as `SceneSerializationError(message, issues)`. |

Source: `src/domain/scene/serialize.ts`.

### 4.5 JSON Schema file

`schemas/scene-spec.schema.json` (draft 2020-12, `$id` `https://example.invalid/schemas/scene-spec.schema.json`, title "Spatial Audio SceneSpec") mirrors only the structural part of §4.1 (required keys, `additionalProperties: false`, numeric/array/string bounds, ID pattern, `acousticUpdateHz` 5–20). It contains none of the semantic rules. No code or test reads it.

Source: `schemas/scene-spec.schema.json`.

---

## 5. SceneDocumentV2

### 5.1 Fields

`SceneDocument = SceneSpec | SceneDocumentV2`. All objects strict.

| Path | Type | Bound / rule |
| --- | --- | --- |
| `documentVersion` | `"2.0"` | literal |
| `baseScene` | SceneSpec | full §4 validation (paths re-prefixed `baseScene.`) |
| `extensions` | object | strict; every member optional |
| `extensions.spatial3d.coordinateSystem` | `"x-right-y-up-z-forward"` | literal |
| `extensions.spatial3d.floorElevationM` | number | −10–10 |
| `extensions.spatial3d.listenerHeightM` | number | 0.1–12; strictly between floor and ceiling |
| `extensions.spatial3d.sourceHeightsM` | record ID → number | values 0.1–12; keys must be base-scene source IDs; values strictly between floor and ceiling; missing sources allowed |
| `extensions.spatial3d.wallVerticalBoundsM?` | record string → `{bottomM 0–12, topM 0.1–12}` | keys and `bottomM < topM` not checked |
| `extensions.spatial3d.portalVerticalBoundsM?` | record string → `{bottomM 0–12, topM 0.1–12, thicknessM 0.02–2}` | keys and ordering not checked |
| `extensions.spatial3d.disabledSurfaceIds?` | string[] | any strings |
| `extensions.spatial3d.primitives?` | primitive[] | ≤ 8; unique IDs; extents inside room |
| primitive `id` | ID | |
| primitive `name` | string 1–80 | |
| primitive `kind` | `"box"` \| `"cylinder"` \| `"sphere"` | |
| primitive `position` | `{x, y, z}` finite | y is absolute elevation |
| primitive `dimensions` | `{x 0.1–50, y 0.1–12, z 0.1–50}` | |
| primitive `rotationYDeg` | finite number | |
| primitive `materialId` | registered material (enum) | |
| `extensions.propagation3d?` | `{maxReflectionOrder: 1 \| 2, receiverConnection: boolean}` | order 2 requires `spatial3d` |
| `extensions.materialBands?` | `{bandCount: 6}` | data only |
| `extensions.atmosphericMedia?` | `{temperatureC −20–50, relativeHumidity 0–1}` | data only |
| `compatibility.migratedFrom?` | `"1.0"` | |
| `compatibility.classicProjectionHash` | string `^[a-f0-9]{8}$` | must equal `classicProjectionHash(validated baseScene)` |

Source: `src/domain/scene-document/types.ts`, `src/domain/scene-document/schema.ts`, `src/domain/scene-document/validate.ts`.

### 5.2 Validation (`validateSceneDocument(input)`)

1. If `input` is not a non-null object (arrays count as objects): `[{path: "", code: "invalid_type", message: "Scene document must be an object."}]`.
2. If `input` has a `schemaVersion` key (any value): return `validateScene(input)`; success yields the v1 scene as the document. A `documentVersion` key is then irrelevant.
3. Otherwise parse with the V2 Zod schema; schema issues are returned alone (path joined with `.`).
4. Semantic checks, in order:
   1. `validateScene(baseScene)`; on failure return its errors with paths prefixed `baseScene.` and stop.
   2. Hash mismatch → `compatibility.classicProjectionHash` / `classic_projection_hash_mismatch` / `Classic projection hash does not match the validated base scene.` (continue).
   3. If `spatial3d` is absent: if `propagation3d.maxReflectionOrder === 2` → `extensions.propagation3d.maxReflectionOrder` / `requires_spatial_3d` / `Second-order 3D propagation requires a spatial3d extension.`; stop.
   4. `ceiling = floorElevationM + baseScene.room.heightM`. Listener height must satisfy `floor < h < ceiling` else `extensions.spatial3d.listenerHeightM` / `listener_height_out_of_room` / `Listener height must be strictly between the configured floor and room ceiling.`
   5. For each `[sourceId, h]` of `sourceHeightsM` (JS `Object.entries` order): unknown ID → `extensions.spatial3d.sourceHeightsM.<id>` / `unknown_source_id` / `3D source height refers to unknown source: <id>` (skip the height check); else `floor < h < ceiling` or `source_height_out_of_room` / `Source height must be strictly between the configured floor and room ceiling.`
   6. Room plan bounds = bounding box of `baseScene.room.outerPolygon` (`minX, maxX, minZ = min y, maxZ = max y`). For each primitive i: duplicate ID → `extensions.spatial3d.primitives.<i>.id` / `duplicate_primitive_id` / `Basic shape ID must be unique: <id>` (skip remaining checks). Else compute its footprint (§8.1); `outsidePlan` = any footprint point with `x < minX || x > maxX || z < minZ || z > maxZ` (inclusive bounds); `outsideHeight = position.y − dims.y/2 < floor || position.y + dims.y/2 > ceiling`; either → `extensions.spatial3d.primitives.<i>` / `primitive_out_of_room` / `Basic shape extents must remain inside the room.`
5. Return `{ok: true, document}` if no errors.

`isSceneDocumentV2(doc)` is `"documentVersion" in doc`.

Source: `src/domain/scene-document/validate.ts`.

### 5.3 `classicProjectionHash(scene)` (exact)

A non-cryptographic FNV-1a 32-bit fingerprint of a canonical JSON string. The input object includes `revision`, so the hash changes on every revision.

```
stableJson(v):
  if v is null or typeof v != "object": return JSON.stringify(v)
  if v is an array: return "[" + join(",", [stableJson(e) for e in v]) + "]"
  keys = Object.keys(v) sorted by UTF-16 code-unit order (JS default sort)
  return "{" + join(",", [JSON.stringify(k) + ":" + stableJson(v[k]) for k in keys]) + "}"

classicProjectionHash(scene):
  h = 0x811c9dc5                                   // u32
  for each Unicode code point cp of stableJson(scene) (JS for…of iteration):
    u = cp <= 0xFFFF ? cp : 0xD800 + ((cp − 0x10000) >> 10)    // only the FIRST UTF-16 unit
    h = ((h XOR u) * 0x01000193) mod 2^32
  return lowercase hex of h, left-padded with "0" to 8 characters
```

JS-specific rules a port must reproduce:

- Numbers use ECMAScript `Number::toString`: shortest round-trip digits; integral values print without a decimal point (`12`, not `12.0`); exponent form when the decimal exponent is ≥ 21 or ≤ −7 (`1e+21`, `1e-7`, while `0.0000015` and `123456789012345680000` stay positional); `-0` prints `0`; NaN/±Infinity print `null` (they cannot occur in a validated scene).
- Strings use `JSON.stringify` escaping: `"` → `\"`, `\` → `\\`, U+0008 `\b`, U+0009 `\t`, U+000A `\n`, U+000C `\f`, U+000D `\r`, other U+0000–U+001F → `\u00xx` (lowercase hex), lone surrogates → `\udxxx` (lowercase); everything else literal (including `/`, U+007F, U+2028, U+2029 and all non-ASCII).
- A key whose value is `undefined` produces the literal text `undefined` (`{"k":undefined}`); this does not arise for validated scenes.
- Astral characters (e.g. emoji) contribute only their high surrogate, so names that differ only in the low surrogate collide.

Test vectors (computed by running the repository code):

| Input | Hash |
| --- | --- |
| `{}` | `5465b825` |
| `[]` | `741638a5` |
| `{b: [1, {d: -0, c: "xé\n"}], a: null}` (canonical string `{"a":null,"b":[1,{"c":"xé\n","d":0}]}`, where `\n` is the two-character escape) | `06e3efd6` |
| Preset `concrete-partition` (revision 0) | `c6f656f7` |
| Preset `hard-room` | `2df2aa89` |
| Preset `treated-room` | `c0f6d1d1` |
| Preset `stress-100-walls` | `1aa0a444` |
| `concrete-partition` with `name` `"Room 😀"` or `"Room 😁"` | `771ff050` (both) |
| `projectClassicScene` of the default Classic project after `ADD_PRIMITIVE` of box `box_1` at (6, 0.75, 4), dims 1.5³, rotation 0, `wood_medium` (revision 1, 9 walls) | `46bf90d4` |

Canonical string of `concrete-partition` begins: `{"listener":{"headingDeg":0,"position":{"x":3,"y":4}},"name":"Concrete Partition","portals":[{"center":{"x":6,"y":4},"heightM":2.1,"id":"partition_door","lossDb…`

Source: `src/domain/scene-document/validate.ts`.

### 5.4 Document serialization functions

| Function | Behavior |
| --- | --- |
| `createSceneDocumentV2(baseScene, extensions = {})` | `validateScene(baseScene)`; failure → throw `SceneDocumentSerializationError("Scene document validation failed", errors)`. Build `{documentVersion: "2.0", baseScene: deepCopy(parsed), extensions: deepCopy(extensions), compatibility: {migratedFrom: "1.0", classicProjectionHash: hash(parsed)}}` and validate it as a document. |
| `serializeSceneDocument(doc)` | Validate; `JSON.stringify(doc, null, 2)`. |
| `parseSceneDocument(json)` | `JSON.parse` failure → `Scene document JSON must be valid JSON`; then validate. |
| validation failure in the two above | `SceneDocumentSerializationError("Scene document validation failed: <errors[0].message>", errors)`; without a first message, `"Scene document validation failed"`. |
| `toClassicScene(doc)` | Deep copy of `doc.baseScene` for V2, of `doc` for v1. |

Source: `src/domain/scene-document/serialize.ts`.

---

## 6. WorkspaceProject (authoring state)

### 6.1 Fields

`WorkspaceProject.schemaVersion` is `"2.0"`. It is versioned independently of `SceneSpec` (`"1.0"`), the cache envelope (`"3.0"`) and the transfer file (`"1.0"`).

| Field | Type | Meaning / invariant (as maintained by the reducer) |
| --- | --- | --- |
| `schemaVersion` | `"2.0"` | |
| `mode` | `"classic-2d5d"` \| `"hybrid-3d"` | fixed for the life of the project |
| `revision` | int ≥ 0 | +1 per accepted acoustic edit (§9.3); undo/redo restore older values, so one revision number can name different content |
| `scene` | SceneSpec | authoritative plan geometry: room polygon/height/materials, walls, Portals, sources, settings, name. `scene.listener` is stale (§4.1). `scene.revision` is set to the new project revision only by scene-touching actions, so it can lag `revision`. |
| `listeners` | AuthoringListener[] 1–8 | at least one enabled |
| `activeListenerId` | string | names an enabled listener |
| `disabledEntityIds` | string[] | insertion-ordered set; disabling never deletes data |
| `selection` | EntityRef \| null | not validated against existence |
| `room3d` | Room3D | rectangular authoring room |
| `sourceHeightsM` | record sourceId → metres | one per scene source |
| `wall3dById` | record wallId → Wall3DSettings | one per scene wall |
| `portal3dById` | record portalId → Portal3DSettings | one per scene Portal |
| `primitives` | AcousticPrimitive[] ≤ 8 | |
| `missingAudioAssetIds` | string[] | clip IDs whose audio is unavailable (silent until relinked) |
| `localAudioMetadata` | record id → LocalAudioAssetMetadata | relinking metadata |
| `view` | WorkspaceViewState | presentation only |
| `notice` | WorkspaceNotice \| null | last rejection/info message |

Sub-types:

| Type | Fields |
| --- | --- |
| `Vec3` | `x, y, z: number` |
| `AuthoringListener` | `id: string, name: string, position: Vec3, headingDeg: number, enabled: boolean` |
| `EntityRef` | `type: "listener" \| "source" \| "wall" \| "portal" \| "primitive" \| "surface", id: string` |
| `Room3D` | `widthM, depthM, heightM: number, floorMaterialId, ceilingMaterialId: string, ceilingEnabled: boolean` |
| `Wall3DSettings` | `bottomM, topM, thicknessM: number` (heights above floor) |
| `Portal3DSettings` | `bottomM, topM, thicknessM: number` |
| `AcousticPrimitive` | `id, name: string, kind: "box" \| "cylinder" \| "sphere", position: Vec3 (centre), dimensions: Vec3 (full extents), rotationYDeg: number, materialId: string` |
| `WorkspaceNotice` | `code: "listener_required" \| "floor_required" \| "entity_missing" \| "limit_reached" \| "geometry_clamped" \| "host_wall_required", message: string` |
| `WorkspaceCamera` | `yawDeg, pitchDeg, zoom, panX, panY: number` |
| `WorkspaceViewState` | `camera: WorkspaceCamera, overlays: {pathsVisible, showAllPaths, ceilingVisible: boolean}, panels: {outlinerCollapsed, inspectorCollapsed: boolean}` |
| `GeneratedSpatial3D` (AI input to `REPLACE_SCENE`) | `listenerHeightM: number, sourceHeights: {sourceId, heightM}[], wallVerticalBounds: {wallId, bottomM, topM}[], portalVerticalBounds: {portalId, bottomM, topM, thicknessM}[], primitives: AcousticPrimitive[]` |

Duplicated state: room height and floor/ceiling materials exist in both `room3d` and `scene.room`; ceiling state exists in both `room3d.ceilingEnabled` and `"ceiling" ∈ disabledEntityIds`; Portal height exists as `scene.portals[].heightM` and `portal3dById[].topM − bottomM`; wall thickness exists as `scene.walls[].thicknessM` and `wall3dById[].thicknessM`. Projections read `scene` thickness, `room3d.heightM` (Hybrid) and `room3d.ceilingEnabled` (Hybrid). The Hybrid runtime reads `"ceiling" ∈ disabledEntityIds` for room acoustics (see Hybrid 3D acoustics section).

Source: `src/domain/workspace/types.ts`, `src/domain/workspace/projections.ts`, `src/components/workspace/HybridViewportAdapter.tsx` (ceiling read).

### 6.2 Default project

Both defaults are built from a deep copy of the `concrete-partition` preset (§18) and differ only in `mode`.

| Field | Default |
| --- | --- |
| `revision` | 0 (preset revision) |
| `scene` | copy of `concrete-partition` |
| `listeners` | `[{id: "listener_primary", name: "Listener", position: {x: 3, y: 1.5, z: 4}, headingDeg: 0, enabled: true}]` (x, z from the preset listener) |
| `activeListenerId` | `listener_primary` |
| `disabledEntityIds` | `[]` |
| `selection` | `{type: "listener", id: "listener_primary"}` |
| `room3d` | `{widthM: 12, depthM: 8, heightM: 3, floorMaterialId: "concrete_hard", ceilingMaterialId: "concrete_hard", ceilingEnabled: true}` (width/depth are literals, not derived) |
| `sourceHeightsM` | `{radio: 1.5, rain: 1.5}` |
| `wall3dById` | each wall `{bottomM: 0, topM: 3, thicknessM: <wall thickness 0.2>}` |
| `portal3dById` | `{partition_door: {bottomM: 0, topM: 2.1, thicknessM: 0.12}}` |
| `primitives`, `missingAudioAssetIds` | `[]` |
| `localAudioMetadata` | `{}` |
| `view` | `camera {yawDeg: 38, pitchDeg: 34, zoom: 1, panX: 0, panY: 0}`, `overlays {pathsVisible: true, showAllPaths: false, ceilingVisible: true}`, `panels {outlinerCollapsed: false, inspectorCollapsed: false}` |
| `notice` | null |

Writer key order (observable only in JSON bytes): `schemaVersion, mode, revision, scene, listeners, activeListenerId, disabledEntityIds, selection, room3d, sourceHeightsM, wall3dById, portal3dById, primitives, missingAudioAssetIds, localAudioMetadata, view, notice`.

Source: `src/domain/workspace/defaults.ts`.

### 6.3 Independence of the two projects

- State is `WorkspaceHistories = {classic: HistoryState, hybrid: HistoryState}`; each project has its own history, storage key and view state.
- Every action, undo, redo, reset and transaction applies only to the active mode's project.
- `REPLACE_PROJECT` is ignored when `action.project.mode` differs from the target project's mode. Import requires the file's project to migrate into the active mode (§16). A v1 `SceneSpec` migrates only into Classic and a `SceneDocumentV2` only into Hybrid.
- Projects never share entities or IDs; editing one never changes the other.
- Domain behavior that differs by mode: Classic projection adds primitive footprint walls (Hybrid does not); `REPLACE_SCENE` applies `spatial3d` only in Hybrid; the Hybrid projection substitutes the `room3d` rectangle for the scene polygon. The UI offers room height and ceiling toggling only in Hybrid.

Source: `src/domain/workspace/history.ts`, `src/hooks/useWorkspaceProjects.ts`, `src/domain/workspace/project-reducer.ts`, `src/domain/workspace/persistence.ts`, `src/domain/workspace/projections.ts`, `src/components/workspace/SceneOutliner.tsx`, `src/components/workspace/ContextInspector.tsx`.

### 6.4 Enabled/disabled semantics and the active listener

- Walls, Portals, sources and primitives are disabled by adding their ID to `disabledEntityIds`. Disabled entities remain in the project, count toward limits and are omitted by projections.
- A Portal whose host wall is disabled is omitted by projections ("suspended") even if its own ID is not disabled. A Portal cannot be added to a disabled wall.
- Listeners use their own `enabled` flag, never `disabledEntityIds`.
- The floor cannot be disabled (`floor_required`). Disabling the ceiling adds `"ceiling"` to `disabledEntityIds` and sets `room3d.ceilingEnabled = false`.
- **Single active listener.** Exactly one listener is projected: the listener whose ID is `activeListenerId` and that is enabled; if none, the first enabled listener (by array order). The reducer keeps `activeListenerId` pointing to an enabled listener: adding a listener activates it; selecting an enabled listener activates it; disabling or deleting the active listener activates the fallback `first enabled listener, else listeners[0]`; the last enabled listener cannot be disabled or deleted (`listener_required`).

Source: `src/domain/workspace/project-reducer.ts`, `src/domain/workspace/projections.ts`.

---

## 7. Limits and entity helpers

### 7.1 Limits (verified against code)

| Limit | Value | Where enforced |
| --- | --- | --- |
| Listeners | 8 (min 1, ≥ 1 enabled) | reducer `ADD_LISTENER`; cache/import envelope `listeners` 1–8 |
| Sources | 4 (min 1) | `SceneSpec` schema 1–4; reducer `ADD_SOURCE` |
| Walls | 100 | `SceneSpec` schema; reducer `ADD_WALL` |
| Portals | 8 | `SceneSpec` schema; reducer `ADD_PORTAL` |
| Primitives | 8 (`MAX_PRIMITIVES`) | reducer `ADD_PRIMITIVE`; V2 schema; envelope schema |
| Primitive footprints in the Classic wall budget | **not enforced** | Classic projection can emit up to 100 + 8 × 12 = 196 walls (docs claim footprints consume the budget) |
| Room plan extent | bounding box ≤ 50 m each axis; `Vec2` coordinates in [−50, 50] | `validateScene` |
| `room3d` width/depth | 1–50 m | resize; spatial validation; `REPLACE_SCENE` clamps derived dims to [1, 50] |
| Room height | 2–12 m (`SceneSpec`); `room3d.heightM` 0.1–12 in the envelope schema but must equal the scene height within 1e-6 | schema; resize; spatial validation |
| Wall length | ≥ 0.1 m (strict `<` rejects) | `validateScene`; `constrainWall3D`; resize |
| Wall/Portal thickness | 0.02–2 m | `SceneSpec`; `constrainWall3D`/`constrainPortal3D`; spatial validation |
| Wall vertical extent | `topM − bottomM ≥ 0.1` m, within `[0, room height]` | `constrainWall3D`; resize; spatial validation (±1e-6) |
| Portal vertical extent | ≥ 0.4 m, within host wall bounds (editor) / room (validation) | `constrainPortal3D`/`constrainWall3D`; resize; spatial validation (±1e-6) |
| Portal width | 0.4–8 m; ≤ host length (editor uses host length − 0.02) | schema; constraint helpers |
| Portal height | 1–6 m and ≤ room height | schema; `validateScene` |
| Primitive dimension | ≥ 0.1 m per axis, ≤ room per axis | `constrainPrimitiveToRoom`; spatial validation |
| Polygon vertices | 3–32 | schema |
| Update rate | integers 10–15 effective (schema 5–20) | schema + `validateScene` |
| Tolerances | `EPSILON = 1e-8` (plan geometry); `SPATIAL_TOLERANCE_M = 1e-6` (authoring spatial checks); Portal attachment 0.01 m | |

Source: `src/domain/workspace/entities.ts`, `src/domain/workspace/project-reducer.ts`, `src/domain/workspace/primitives.ts`, `src/domain/scene/schema.ts`, `src/domain/scene/validate.ts`, `src/domain/scene/geometry-validation.ts`, `src/domain/workspace/spatial-validation.ts`, `src/domain/workspace/geometry-constraints.ts`, `src/domain/workspace/persistence.ts`, `src/domain/workspace/projections.ts`.

### 7.2 Entity helpers

| Function | Behavior |
| --- | --- |
| `WORKSPACE_LIMITS` | `{listeners: 8, sources: 4, walls: 100, portals: 8, primitives: 8}` |
| `addAvailabilityFor(project)` | Per addable kind `{enabled, reason?}`; counts include disabled entities. listener/source/wall/box/cylinder/sphere: enabled iff count < limit, else reasons `Limit: 8 listeners`, `Limit: 4 sources`, `Limit: 100 walls`, `Limit: 8 shapes`. portal: `Limit: 8 Portals` when full; else enabled iff the selection is a wall whose ID is not disabled, else `Select an enabled Wall first`. |
| `describeEntity(project, ref)` | listener/source/primitive: its `name`, falling back to `Listener`/`Source`/`Shape`; wall/Portal: ID with every `_` replaced by a space; surface: `room` → `Room`, `floor` → `Floor`, anything else → `Ceiling`. |
| `describeEntityType(project, ref)` | primitive: its kind capitalized (`Box`), fallback `Shape`; surface: `Room` for `room`, else `Surface`; others: type capitalized. |
| `entityExists(project, ref)` | membership by ID in the matching collection; surfaces always true. |
| `deleteActionFor(ref)` | `DELETE_LISTENER/SOURCE/WALL/PORTAL/PRIMITIVE`; surfaces → null (not deletable). |
| `cascadedPortalCount(project, ref)` | for a wall, the number of Portals whose `wallId` is it; else 0. |

Source: `src/domain/workspace/entities.ts`.

---

## 8. Primitives

Constants: `MAX_PRIMITIVES = 8`, `PRIMITIVE_RADIAL_SEGMENTS = 12`, `MIN_PRIMITIVE_DIMENSION_M = 0.1`.

### 8.1 Footprint (`primitiveFootprint(p) → Vec2[]`)

```
w = p.dimensions.x; d = p.dimensions.z
local = (kind == "box")
  ? [(−w/2, −d/2), (w/2, −d/2), (w/2, d/2), (−w/2, d/2)]
  : for i in 0..11: angle = ((i / 12) * Math.PI) * 2           // evaluate in this order
                    (cos(angle) * w / 2, sin(angle) * d / 2)     // (cos·w)/2, (sin·d)/2
θ = (p.rotationYDeg * Math.PI) / 180
each local (x, y) → (p.position.x + x·cos θ − y·sin θ, p.position.z + x·sin θ + y·cos θ)
```

Cylinders and spheres share the 12-point ellipse; height (`dimensions.y`, `position.y`) does not affect the footprint.

### 8.2 Footprint walls (Classic only)

For footprint points `F[0..n−1]` (n = 4 or 12), wall i is `{id: "primitive:<p.id>:<i>", a: F[i], b: F[(i+1) % n], thicknessM: 0.1, materialId: p.materialId, kind: "partition"}`. In a `SceneSpec` every wall is implicitly full room height, so footprints become full-height walls.

### 8.3 `constrainPrimitiveToRoom(p, room {widthM W, depthM D, heightM H})`

```
rot  = isFinite(p.rotationYDeg) ? p.rotationYDeg : 0
dims = {x: clamp(p.dims.x, 0.1, W), y: clamp(p.dims.y, 0.1, H), z: clamp(p.dims.z, 0.1, D)}
F    = footprint({...p, dims, rotationYDeg: rot, position: (0,0,0)})
hx   = max |F.x|;  hz = max |F.y|
s    = min(1, W / (2·hx), D / (2·hz))
if s < 1:
  dims.x = max(0.1, dims.x · s); dims.z = max(0.1, dims.z · s)
  F = footprint(... same with new dims ...); hx, hz recomputed
hy = dims.y / 2
position = {x: clamp(p.x, hx, W − hx), y: clamp(p.y, hy, H − hy), z: clamp(p.z, hz, D − hz)}
return {...p, dimensions: dims, rotationYDeg: rot, position}
```

The function assumes the room spans `[0, W] × [0, H] × [0, D]`. Example: box dims (20, 20, 20), rotation 45°, position (−5, −5, 100) in a 12 × 3 × 8 room → dims (6.788225099390856, 3, 4.525483399593904), position (4, 1.5, 4).

Source: `src/domain/workspace/primitives.ts`.

---

## 9. projectReducer

### 9.1 Shared mechanics

- `withNotice(p, n)` returns `{...p, notice: n}`: a **rejection**. Revision and all other fields are unchanged, but the result is a new object (it is recorded by history, §12).
- `commitScene(p, mutate)`:
  1. `scene = deepCopy(p.scene)`; run `mutate(scene)`.
  2. If `mutate` returned `false` (target missing): rejection `entity_missing` / `The selected object no longer exists.`
  3. `scene.revision = p.revision + 1`; `validateScene(scene)`.
  4. Invalid: rejection `entity_missing` / `errors[0].message` (fallback `Edit rejected.`). Every validation failure uses code `entity_missing` regardless of cause.
  5. Valid: `{...p, revision: scene.revision, scene: parsedCopy, notice: null}`.
- `chooseFallback(listeners)` = first enabled listener, else `listeners[0]`.
- Callers detect commit failure by `next.scene === p.scene`.

### 9.2 Action table

"Rev" = whether `revision` increments on success. "Rec" = recorded in undo history by default (§12.3); every rejection that changes `notice` is also recorded.

| Action | Payload | Effect on success | Validation / rejection (code: message) | Rev | Rec |
| --- | --- | --- | --- | --- | --- |
| `ADD_LISTENER` | `listener: AuthoringListener` | append `{...listener, enabled: true}`; `activeListenerId = id`; selection = that listener; notice null | count ≥ 8 → `limit_reached`: `A project can contain at most eight listeners.` No ID uniqueness, name or position check. | yes | yes |
| `DELETE_LISTENER` | `id` | remove; if it was active, activate `chooseFallback(remaining)` and select it; otherwise selection unchanged (may dangle) | not found → `entity_missing`: `Listener not found.`; `listeners.length === 1` or (target enabled and it is the only enabled one) → `listener_required`: `At least one listener must remain enabled.` | yes | yes |
| `SELECT_ENTITY` | `selection: EntityRef \| null` | if `selection.type === "listener"` and that listener exists and is enabled: activate it and select it (rev +1 only if it was not already active). Otherwise just set selection (no existence check). notice null. | none | only on activation change | only listener selections |
| `SET_ACTIVE_LISTENER` | `id` | activate and select | not found, empty ID or disabled → `entity_missing`: `Enabled listener not found.` | only if changed | yes |
| `SET_ENTITY_ENABLED` | `entity: EntityRef, enabled` | listener: set its `enabled`; disabling the active one activates and selects the fallback. Others: add/remove `entity.id` in `disabledEntityIds` (JS Set semantics: re-adding keeps original position; delete then add moves to end); for `surface`/`ceiling` also set `room3d.ceilingEnabled = enabled`. notice null. | surface `floor` with `enabled=false` → `floor_required`: `The floor is required and cannot be disabled.`; listener not found → `entity_missing`: `Listener not found.`; disabling the last enabled listener → `listener_required`. No existence check for non-listeners. | yes (even when nothing changes) | yes |
| `UPDATE_LISTENER` | `id, changes: Partial<{name, position, headingDeg}>` | shallow merge into that listener | not found → `entity_missing`: `Listener not found.` No bounds/finite/room checks; `scene.listener` is not updated. | yes (always) | yes |
| `MOVE_SOURCE` | `id, position: Vec3` | commit: `source.position = {x: position.x, y: position.z}`; then `sourceHeightsM[id] = position.y` | commit rules (missing source; validation e.g. outside room) | yes | yes |
| `UPDATE_SOURCE` | `id, changes: Partial<{name, gainDb, loop}>` | commit: `Object.assign(source, changes)` | commit rules | yes | yes |
| `RELINK_SOURCE` | `id, clipId` | commit: `source.clipId = clipId`; then remove both the previous clip ID and `clipId` from `missingAudioAssetIds` | commit rules (unknown clip format) | yes | yes |
| `SET_AUDIO_ASSET_MISSING` | `clipId, missing` | add/remove `clipId` in `missingAudioAssetIds` (set semantics); notice null | none | yes (always) | yes |
| `SET_LOCAL_AUDIO_METADATA` | `metadata` | `localAudioMetadata[metadata.id] = metadata`; notice untouched | none | no | no |
| `ADD_SOURCE` | `source, heightM` | commit: push deep copy; then `sourceHeightsM[id] = heightM`; selection = source | count ≥ 4 → `limit_reached`: `A project can contain at most four point sources.`; commit rules (duplicate ID, out of room, name length…) | yes | yes |
| `DELETE_SOURCE` | `id` | commit: remove; then delete `sourceHeightsM[id]`; selection null. `disabledEntityIds` is **not** cleaned. | commit rules; deleting the last source fails schema (`Too small: expected array to have >=1 items`) | yes | yes |
| `ADD_WALL` | `wall, vertical?: Wall3DSettings` | commit: push deep copy; then `wall3dById[id] = vertical ?? {bottomM: 0, topM: room3d.heightM, thicknessM: wall.thicknessM}`; selection = wall | count ≥ 100 → `limit_reached`: `A project can contain at most 100 Walls.`; commit rules | yes | yes |
| `UPDATE_WALL` | `id, changes: Partial<Wall>, vertical?: Partial<Wall3DSettings>` | commit: `Object.assign(wall, deepCopy(changes))` (hosted Portals are not moved); if `vertical`: `wall3dById[id] = {...wall3dById[id], ...vertical}` | commit rules (e.g. moving an endpoint so a hosted Portal detaches → `Portal must lie on and fit within its referenced wall`). `vertical` unchecked. | yes | yes |
| `DELETE_WALL` | `id` | commit: remove wall and every Portal hosted on it; then delete their `wall3dById`/`portal3dById` entries and remove the wall and hosted Portal IDs from `disabledEntityIds`; selection null | commit rules | yes | yes |
| `ADD_PORTAL` | `portal, vertical?: Portal3DSettings` | commit: push deep copy; then `portal3dById[id] = vertical ?? {bottomM: 0, topM: portal.heightM, thicknessM: 0.12}`; selection = Portal | count ≥ 8 → `limit_reached`: `A project can contain at most eight Portals.`; host missing or disabled → `host_wall_required`: `Select an enabled Wall before adding a Portal.`; commit rules | yes | yes |
| `UPDATE_PORTAL` | `id, changes: Partial<Portal>, vertical?` | commit: `Object.assign(portal, deepCopy(changes))`; if `vertical`: merge into `portal3dById[id]` | commit rules | yes | yes |
| `DELETE_PORTAL` | `id` | commit: remove; delete `portal3dById[id]`; remove from `disabledEntityIds`; selection null | commit rules | yes | yes |
| `ADD_PRIMITIVE` | `primitive` | append `constrainPrimitiveToRoom(primitive, room3d)`; selection = primitive; notice null | count ≥ 8 → `limit_reached`: `A project can contain at most 8 basic shapes.` No ID, name or material check. | yes | yes |
| `UPDATE_PRIMITIVE` | `id, changes: Partial<Omit<AcousticPrimitive, "id" \| "kind">>` | replace with `constrainPrimitiveToRoom({...p, ...changes}, room3d)`; notice null | not found → `entity_missing`: `Basic shape not found.` | yes | yes |
| `DELETE_PRIMITIVE` | `id` | remove; remove from `disabledEntityIds`; selection null; notice null | not found → `entity_missing`: `Basic shape not found.` | yes | yes |
| `SET_ROOM_3D` | `changes: Partial<Room3D>` | `room3d = {...room3d, ...changes}`; `scene = {...scene, revision: rev+1, room: {...scene.room, heightM, floorMaterialId, ceilingMaterialId from room3d}}` (polygon untouched); `disabledEntityIds`: remove `"ceiling"` if `ceilingEnabled`, else add it; notice null | **none** (height, materials, width/depth not checked; width/depth do not move the polygon). The UI uses it only for floor/ceiling material changes. | yes | yes |
| `SET_VIEW_STATE` | `changes: Partial<WorkspaceViewState>` | `view = {...view, ...changes, camera: {...view.camera, ...changes.camera}, overlays: {...}, panels: {...}}`; notice untouched | none | no | no |
| `SET_NOTICE` | `notice` | set notice | none | no | **yes** |
| `REPLACE_SCENE` | `scene, spatial3d?: GeneratedSpatial3D, primitives?` | see below | invalid scene → `entity_missing`: `Scene replacement failed validation.` | yes | yes |
| `REPLACE_PROJECT` | `project` | return `action.project` verbatim if its mode equals the current mode, else the unchanged current project (no notice) | **none** | as given | yes |
| `CLEAR_NOTICE` | — | notice null | none | no | no |

`REPLACE_SCENE` on a valid scene, step by step:

1. `scene = deepCopy(parsed)`; `scene.revision = project.revision + 1`.
2. `dims = {widthM: max(1, min(50, maxX − minX)), depthM: max(1, min(50, maxY − minY))}` of the polygon.
3. `spatial = mode === "hybrid-3d" ? action.spatial3d : undefined`; build lookup maps for its source heights, wall bounds, Portal bounds.
4. `defaultObjectHeight = min(1.5, scene.room.heightM − 0.1)`.
5. Active listener: `position = {x: scene.listener.x, y: spatial?.listenerHeightM ?? min(listener.y, heightM − 0.1), z: scene.listener.y}`, `headingDeg = scene.listener.headingDeg`. Other listeners are unchanged (their positions are not re-checked).
6. `room3d = {...room3d, ...dims, heightM, floorMaterialId, ceilingMaterialId from scene.room, ceilingEnabled: true}`.
7. `sourceHeightsM` = for each scene source: `spatial height ?? defaultObjectHeight`.
8. `wall3dById` = for each scene wall: `{bottomM: bounds?.bottomM ?? 0, topM: bounds?.topM ?? heightM, thicknessM: wall.thicknessM}`.
9. `portal3dById` = for each scene Portal: `bounds (bottomM, topM, thicknessM) ?? {0, portal.heightM, 0.12}`.
10. `primitives = (action.primitives ?? spatial?.primitives ?? [])` each passed through `constrainPrimitiveToRoom(…, {...room3d, ...dims, heightM})`. `action.primitives` applies in both modes.
11. `disabledEntityIds = []`, `selection = null`, `notice = null`. `missingAudioAssetIds`, `localAudioMetadata`, `view`, non-active listeners kept. `spatial3d` values are not validated here (the AI layer validates them; see Backend/AI section).

The UI dispatches `REPLACE_SCENE` for preset selection (a deep copy of the preset) and for applying an AI candidate (`{scene, spatial3d, primitives: spatial3d?.primitives}`).

### 9.3 Acoustic versus presentation-only changes

- Increment `revision`: listener add/delete/update/enable, active-listener change, every scene-touching action, primitive add/update/delete, entity enable/disable, `SET_ROOM_3D`, `SET_AUDIO_ASSET_MISSING`, `REPLACE_SCENE`; `REPLACE_PROJECT` installs whatever revision the incoming project carries (constraint helpers set `+1`; imports keep the file's value).
- Do not increment: `SELECT_ENTITY` without activation, `SET_VIEW_STATE`, `SET_NOTICE`, `CLEAR_NOTICE`, `SET_LOCAL_AUDIO_METADATA`, every rejection.
- The projection cache treats `selection`, `view`, `notice` and `localAudioMetadata` as presentation-only (§17.3).

Source: `src/domain/workspace/project-reducer.ts`, `src/domain/workspace/history.ts`, `src/components/workspace/WorkspaceProjectTools.tsx`, `src/components/workspace/ContextInspector.tsx` (SET_ROOM_3D usage).

---

## 10. Geometry-constraint helpers

These functions return `{ok: true, project} | {ok: false, message}`. The UI dispatches `REPLACE_PROJECT` with the returned project (Hybrid drag also overrides `selection` with the edited wall/Portal). They are the only code paths that keep Portals attached when walls move or the room resizes.

`fitVertical(bottom, top, hostBottom, hostTop, minH)`: `bottomM = clamp(bottom, hostBottom, hostTop − minH)`; `topM = clamp(top, bottomM + minH, hostTop)`.

### 10.1 `resizeRoomAndClamp(project, dims: Room3D)`

1. Reject unless `1 ≤ widthM ≤ 50`, `1 ≤ depthM ≤ 50`, `2 ≤ heightM ≤ 12`: `Room width/depth must be 1–50 m and height must be 2–12 m.`
2. `scene = deepCopy(project.scene)`; `corners = [(0,0), (w,0), (w,d), (0,d)]`; `scene.room.outerPolygon = corners`; `scene.room.heightM = h`.
3. Boundary walls, in scene order, index k: `a = corners[k % 4]`, `b = corners[(k+1) % 4]`.
4. Partition walls: clamp both endpoints into `[0, w] × [0, d]`. If the length is then `< 0.1`: `b = (clamp(a.x + 0.1, 0, w), a.y)` (the `w ≥ 0.1` branch always applies because `w ≥ 1`); if still `< 0.1`: `a = (0, 0)`, `b = (min(w, 0.1), 0)`. Count the wall as clamped if any endpoint coordinate changed.
5. Each Portal: old host from `project.scene`, new host from `scene`; `t = ((center − oldA)·oldD) / |oldD|²` (0.5 if `|oldD|² = 0`); `L = |newD|`; `widthM = clamp(widthM, 0.4, max(0.4, L − 0.02))`; `half = widthM / (2L)`; `center = newA + newD · clamp(t, half, 1 − half)`. Portals are not counted.
6. Each source: clamp position into `[0, w] × [0, d]`; count if changed.
7. `wall3dById`: every entry `fitVertical(bottom, top, 0, h, 0.1)` (thickness kept).
8. `portal3dById`: every entry with host `wall3dById'[portal.wallId]`: `fitVertical(bottom, top, host.bottomM ?? 0, host.topM ?? h, 0.4)`; set the scene Portal `heightM = topM − bottomM`.
9. `scene.revision = revision + 1`; `validateScene(scene)`; failure → `errors[0].message` (fallback `Room resize rejected.`). The stale `scene.listener` takes part in this validation.
10. Success: `revision + 1`, `room3d = dims` (the caller passes the whole `Room3D`), new `scene`; every listener position clamped to `x ∈ [0, w]`, `y ∈ [0.1, h]`, `z ∈ [0, d]`; every `sourceHeightsM` value clamped to `[0.1, h]`; new vertical maps; every primitive passed through `constrainPrimitiveToRoom(…, dims)`; `notice = clamped > 0 ? {code: "geometry_clamped", message: "<n> object was clamped to the resized room." | "<n> objects were clamped to the resized room."} : null`.

Example: default Hybrid project, width 12 → 5: partition moves to x = 5 (coincident with the east boundary), both sources move to x = 5, notice `3 objects were clamped to the resized room.`

### 10.2 `constrainWall3D(project, wallId, candidate {a, b, bottomM, topM, thicknessM})`

1. `distance(a, b) < 0.1` → `Walls must be at least 0.10 m long.`
2. Thickness outside `[0.02, 2]` → `Wall thickness must be 0.02–2 m.`
3. `bottomM < 0` or `topM > room3d.heightM` or `topM − bottomM < 0.1` → `Wall vertical bounds must fit the room and leave at least 0.10 m height.`
4. Wall not found → `Wall not found.`
5. Deep-copy the scene; set the wall's `a`, `b`, `thicknessM`.
6. For each hosted Portal: `t` as in §10.1 against the old wall (0.5 if degenerate); `widthM = clamp(widthM, 0.4, max(0.4, newL − 0.02))`; `center = a + (b − a) · clamp(t, half, 1 − half)`; `previous = portal3dById[id] ?? {0, portal.heightM, 0.12}`; `vertical = fitVertical(previous.bottomM, previous.topM, candidate.bottomM, candidate.topM, 0.4)`; scene Portal `heightM = topM − bottomM`; `portal3dById[id] = {...previous, ...vertical}`.
7. `scene.revision = revision + 1`; validate; failure → first message (fallback `Wall edit rejected.`).
8. Success: `revision + 1`, scene, `wall3dById[wallId] = {bottomM, topM, thicknessM}` from the candidate, updated `portal3dById`, notice null. Endpoints are not clamped to the room (the UI clamps).

### 10.3 `constrainPortal3D(project, portalId, candidate {center, widthM, bottomM, topM, thicknessM})`

1. Portal or host wall missing → `Portal or host wall not found.`
2. Thickness outside `[0.02, 2]` → `Portal thickness must be 0.02–2 m.`
3. `hostV = wall3dById[wallId] ?? {0, room3d.heightM, wall.thicknessM}`.
4. `L = |b − a|`, `u = (b − a) / L`; `widthM = clamp(candidate.widthM, 0.4, max(0.4, L − 0.02))`; `offset = clamp((center − a)·u, widthM/2, L − widthM/2)`; `center = a + u · offset` (perpendicular offset discarded).
5. `vertical = fitVertical(candidate.bottomM, candidate.topM, hostV.bottomM, hostV.topM, 0.4)`.
6. Deep-copy scene; set Portal `center`, `widthM`, `heightM = topM − bottomM`; `scene.revision = revision + 1`; validate.
7. Failure, or `!portalFitsWall(center, widthM, a, b)` → `Portal must stay attached to its host wall.` when validation passed, else the first validation message (fallback `Portal edit rejected.`).
8. Success: `revision + 1`, scene, `portal3dById[id] = {bottomM, topM, thicknessM: candidate.thicknessM}`, notice null.

The UI's "offset along host" is `offsetM = (center − a)·u`; the stored, authoritative value is `center`.

### 10.4 `toggleEntityEnabled(project, ref, enabled)`

Runs `SET_ENTITY_ENABLED`; returns `{ok: false, message: notice.message}` if the result has a notice, else `{ok: true, project}`. Used only by tests.

Source: `src/domain/workspace/geometry-constraints.ts`, `src/components/workspace/ContextInspector.tsx`, `src/components/workspace/HybridViewportAdapter.tsx`.

---

## 11. Editor reducer (legacy, test-only) and Classic action mapping

### 11.1 EditorState and editorReducer

`editorReducer` and `createEditorState` are imported only by `tests/unit/editor-reducer.test.ts`. Live code imports only the types `EditorAction`, `EditorSelection` and `PreviewMode` and the coordinate helpers.

`EditorState = {scene: SceneSpec, selectedObject: EditorSelection, mode: "raw" | "simulated", audioStatus: "idle" | "ready", editNotice: {kind: "rejection", message} | null}`. `EditorSelection = {type: "listener"} | {type: "source" | "wall" | "portal", id} | null`. `createEditorState(scene = PRESETS["concrete-partition"])`: deep copy; selection = first source, else listener; mode `raw`; audio `idle`; no notice.

Commit rule: deep copy, mutate (`false` → rejection `Edit rejected. The selected object no longer exists; select it again.`), `revision = scene.revision + 1`, `validateScene`, failure → rejection with `rejectionMessage(errors)`:

1. any `too_big` at path `walls` → `Wall limit reached (100). Delete a wall before adding another.`
2. any `unknown_material_id` → `Material change rejected. Choose a built-in material preset.`
3. any `wall_too_short` → `Wall edit rejected. Walls must be at least 0.10 m long.`
4. any `portal_detached` → `Wall edit rejected. Its hosted portal would become detached or no longer fit; keep the portal on the wall.`
5. any `position_out_of_bounds`, or `too_big`/`too_small` on a path starting `sources.` or `listener.position` → `Move rejected. Keep sources and the listener inside the room.`
6. else `Edit rejected. <errors[0].message>` (fallback text `Keep the scene within its documented limits.`).

| Action | Payload | Effect |
| --- | --- | --- |
| `LOAD_PRESET` | `presetId` | scene = copy of preset with `revision = old + 1` (not validated); selection reset; notice cleared |
| `REPLACE_SCENE` | `scene` | validate (rejection via `rejectionMessage`); copy with `revision = old + 1`; selection reset |
| `SELECT_OBJECT` | `selection` | set if null/listener or the ID exists, else state unchanged |
| `MOVE_LISTENER` | `position: Vec2` | commit `listener.position` |
| `MOVE_SOURCE` | `sourceId, position` | commit |
| `ADD_WALL` | `wall` | commit push; select the wall |
| `MOVE_WALL_ENDPOINT` | `wallId, endpoint "a" \| "b", position` | commit; hosted Portals keep their unclamped projection parameter `t` (computed on the old wall) and move to `a + t(b − a)`; width not adjusted |
| `DELETE_WALL` | `wallId` | commit removing the wall and hosted Portals; keep selection only if it still exists |
| `SET_WALL_MATERIAL` | `wallId, materialId` | commit |
| `TOGGLE_PORTAL` | `portalId` | commit `open = !open` |
| `SET_MODE` | `mode` | set preview mode |
| `SET_AUDIO_STATUS` | `status` | set |

Source: `src/domain/editor/state.ts`, `src/domain/editor/reducer.ts`, `tests/unit/editor-reducer.test.ts`.

### 11.2 Live Classic mapping of EditorActions to ProjectActions

The Classic canvas emits `EditorAction`s; the Classic adapter translates them:

| EditorAction | Dispatched ProjectAction |
| --- | --- |
| `SELECT_OBJECT {type: "listener"}` | `SELECT_ENTITY {type: "listener", id: activeListenerId}` |
| `SELECT_OBJECT` other / null | `SELECT_ENTITY` with the same ref / null |
| `MOVE_LISTENER (x, y)` | `UPDATE_LISTENER` on the active listener, `position = {x, y: unchanged, z: y}` |
| `MOVE_SOURCE (x, y)` | `MOVE_SOURCE {x, y: sourceHeightsM[id] ?? 1.5, z: y}` |
| `ADD_WALL` | `ADD_WALL` |
| `MOVE_WALL_ENDPOINT` | `UPDATE_WALL {changes: {[endpoint]: position}}` (hosted Portals are not carried; see Review findings) |
| `DELETE_WALL` | `DELETE_WALL` |
| `SET_WALL_MATERIAL` | `UPDATE_WALL {changes: {materialId}}` |
| `TOGGLE_PORTAL` | `UPDATE_PORTAL {changes: {open: !open}}` (only if the Portal exists) |
| `REPLACE_SCENE` | `REPLACE_SCENE {scene}` |
| `LOAD_PRESET`, `SET_MODE`, `SET_AUDIO_STATUS` | ignored |

Primitive drags in the Classic canvas dispatch `UPDATE_PRIMITIVE {position: {...position, x, z}}`.

Source: `src/components/workspace/ClassicViewportAdapter.tsx`.

### 11.3 Plan-to-screen coordinate helpers

`Rect = {minX, minY, width, height}`. Every function first asserts both rects are finite with positive width and height, else throws `RangeError("<label> must be finite with positive dimensions")` (labels: `World bounds`, `SVG viewport`, `Rendered SVG bounds`, `SVG viewBox`).

```
worldToSvg(p, W, V) = (V.minX + (p.x − W.minX)/W.width · V.width,
                       V.minY + (1 − (p.y − W.minY)/W.height) · V.height)     // y flipped
svgToWorld(p, W, V) = (W.minX + (p.x − V.minX)/V.width · W.width,
                       W.minY + (1 − (p.y − V.minY)/V.height) · W.height)
clientPointToSvg(p, R, VB):                                   // "xMidYMid meet"
  s = min(R.width/VB.width, R.height/VB.height)
  off = ((R.width − VB.width·s)/2, (R.height − VB.height·s)/2)
  return (VB.minX + (p.x − R.minX − off.x)/s, VB.minY + (p.y − R.minY − off.y)/s)
```

Source: `src/domain/editor/coordinates.ts`.

---

## 12. Undo/redo history

### 12.1 Data structures

```
HistoryState<T> = {past: HistoryPatch[], present: T, future: HistoryPatch[]}
HistoryPatch    = {operations: HistoryOperation[]}
HistoryOperation =
  | {kind: "value",  path: (string | int)[], beforeExists: bool, before: any, afterExists: bool, after: any}
  | {kind: "splice", path: (string | int)[], index: int, beforeItems: any[], afterItems: any[]}
```

In a value op, a side that does not exist stores `null`. `HISTORY_LIMIT = 50`. Path parts are object keys (strings) or array indices (numbers); the distinction survives JSON.

### 12.2 Diff and apply

```
diff(before, after, path, ops):
  if Object.is(before, after): return                 // reference/primitive identity; NaN==NaN, 0 != -0
  if both arrays:
    if equal length: for i: diff(before[i], after[i], path+[i]); return
    prefix = longest k with Object.is(before[j], after[j]) for all j < k
    suffix = longest k with k < len(before)−prefix, k < len(after)−prefix and
             Object.is(before[len(before)−1−j], after[len(after)−1−j]) for all j < k
    push splice{path, index: prefix, beforeItems: copy(before[prefix : len(before)−suffix]),
                                     afterItems:  copy(after[prefix : len(after)−suffix])}
    return
  if both plain objects (non-null, non-array):
    for key in keys(before) then keys(after) not already seen:
      bE = hasOwn(before, key); aE = hasOwn(after, key)
      if bE and aE: diff(before[key], after[key], path+[key])
      else push value{path+[key], bE, bE ? copy(before[key]) : null, aE, aE ? copy(after[key]) : null}
    return
  push value{path, true, copy(before), true, copy(after)}

apply(value, patch, direction):
  result = deepCopy(value)
  for op in (direction == forward ? ops : reversed(ops)):
    splice: target = get(result, op.path); not an array → throw "History splice target is not an array."
            removed = forward ? beforeItems : afterItems; inserted = forward ? afterItems : beforeItems
            target.splice(op.index, len(removed), ...copy(inserted))
    value:  exists = forward ? afterExists : beforeExists; next = forward ? after : before
            if path empty: exists ? result = copy(next) : throw "History cannot remove its root value."
            parent = get(result, path[:-1]); key = path[-1]
            array parent and numeric key: exists ? parent[key] = copy(next) : parent.splice(key, 1)
            plain-object parent and string key: exists ? parent[key] = copy(next) : delete parent[key]
            otherwise throw "History value target is invalid."
```

`get` follows the path by property access; a missing intermediate throws.

Because diff compares by reference, and `commitScene` deep-copies the whole scene, adding or deleting one wall produces one splice holding the entire old and new wall arrays, while same-length edits reduce to leaf value ops. Example: `ADD_WALL` on the default project yields ops at `revision`, `scene.revision`, splice `scene.walls` (index 0, 5 → 6 items), `selection.type`, `selection.id`, `wall3dById.wall_1`. A value-equality diff produces fewer ops with identical undo results; persisted caches contain the reference-based form.

### 12.3 Operations

| Operation | Behavior |
| --- | --- |
| `reduceWithHistory(h, action, reducer, record)` | `present = reducer(h.present, action)`. If `!record` or `present` is the same object: `{...h, present}` (**past and future kept**). Else `patch = diff(h.present, present)`; empty → `{...h, present}`; else `{past: (past + [patch]).last(50), present, future: []}`. |
| `recordHistoryTransition(h, before)` | `patch = diff(before, h.present)`; empty → `h` unchanged; else append to past (last 50) and clear future. |
| `undoHistory(h)` | no past → unchanged; else pop last patch, `present = apply(present, patch, backward)`, `future = [patch] + future`. |
| `redoHistory(h)` | no future → unchanged; else take `future[0]`, `present = apply(present, patch, forward)`, `past = (past + [patch]).last(50)`, `future = future[1:]`. |
| `shouldRecordProjectAction(a)` | `SELECT_ENTITY` → recorded iff `selection.type === "listener"`; `SET_VIEW_STATE`, `SET_LOCAL_AUDIO_METADATA`, `CLEAR_NOTICE` → not recorded; every other action → recorded. A rejection changes `notice`, so it is recorded as an undo step whose only effect is the notice, and it clears the redo stack; `SET_NOTICE` likewise. |
| `resetActiveMode(ws, mode)` | Replace that mode's present with a fresh default; push `diff(present, default)` **without** an empty check; clear future. Reset is undoable. |

Undo restores the earlier `revision` value, so revisions repeat (projection caching therefore compares by reference, §17.3). Unrecorded actions do not clear `future`, so a redo can follow a selection or camera change.

### 12.4 Transactions and coalescing

The coordinator (§13) supports one transaction per session: `beginHistoryTransaction()` (ignored if one is open) stores `{mode, before: present}`; while it is open, dispatches in that mode are applied with `record = false`; `endHistoryTransaction()` clears it and, if the mode still matches, calls `recordHistoryTransition(current, before)`, producing one undo step. The UI opens/closes a transaction only for pointer down/up/cancel on numeric scrub labels. Viewport drags (Classic canvas and Hybrid viewport) dispatch one recorded action per pointer move with no transaction, so each move is its own undo step and a long drag can push all earlier steps out of the 50-step window.

Source: `src/domain/workspace/history.ts`, `src/hooks/useWorkspaceProjects.ts`, `src/components/workspace/UnifiedWorkspace.tsx`, `src/components/workbench/SceneEditor.tsx`, `src/components/lab/HybridSpatialViewport.tsx`.

---

## 13. Coordinator (`useWorkspaceProjects`)

| Concern | Behavior |
| --- | --- |
| Initial mode | the route's `initialMode` (`/classic` → Classic, `/lab` → Hybrid, `/` → none); else the value stored under `echo-canvas:workspace-ui:v1` if it is exactly `classic-2d5d` or `hybrid-3d`; else `classic-2d5d`. |
| Initial state | `loadWorkspaceCache` for both modes (§14.3). The loader runs twice per mode at startup (once for state, once for the restoration report). The status shown is the first non-null warning (Classic first), else `saved`. `recoveryRaw` per mode is kept in memory. |
| Storage handle | null when there is no `window`, when `window.__echoCanvasSimulateStorageFailure` is truthy, or when reading `window.localStorage` throws. |
| `dispatch(action)` | `reduceWithHistory(active, action, projectReducer, shouldRecordProjectAction(action) && no open transaction for the active mode)`. |
| `undo` / `redo` | active mode only. `canUndo = past.length > 0`, `historyDepth = past.length`, `canRedo = future.length > 0`. |
| `resetActiveProject` | `resetActiveMode(histories, activeMode)`. |
| `clearAllProjects` | both histories become fresh defaults (not undoable); remove the Classic, Hybrid and UI keys; status `saved` (or `Local persistence is unavailable.` if removal throws). The debounced save then writes the defaults again. |
| Save timing | 2,000 ms after the last change to the histories (each change restarts the timer; also armed on mount), save the **active** mode only. Also save the active mode immediately on `pagehide` and the outgoing mode immediately on a mode switch. Status becomes `saved` or the save warning. |
| Mode switch | if different: save the outgoing mode, write the new mode string to the UI key (failure → status `Local persistence is unavailable.`), switch. |

Source: `src/hooks/useWorkspaceProjects.ts`, `src/app/page.tsx`, `src/app/classic/page.tsx`, `src/app/lab/page.tsx`.

---

## 14. Persistence (local cache)

### 14.1 Keys and versions

| Key | Content |
| --- | --- |
| `echo-canvas:project:classic:v1` | Classic cache document (JSON) |
| `echo-canvas:project:hybrid:v1` | Hybrid cache document (JSON) |
| `echo-canvas:workspace-ui:v1` | raw string `classic-2d5d` or `hybrid-3d` (not JSON) |

Current cache document (`WORKSPACE_CACHE_VERSION = "3.0"`), written compactly (`JSON.stringify` without indentation), key order as listed:

```
{"cacheVersion": "3.0", "mode": <mode>, "present": <WorkspaceProject>,
 "past": <HistoryPatch[]>, "future": <HistoryPatch[]>}
```

Reader schema (strict): `cacheVersion` literal `"3.0"`; `mode` enum; `present` any; `past` and `future` arrays of at most 50 patches; a patch is strict `{operations: op[]}` with **at least one** op; ops are strict and match §12.1 with path parts `string | int ≥ 0` and `index` int ≥ 0.

Legacy cache (`"2.0"`, strict): `{cacheVersion: "2.0", mode, present: any, past: any[] ≤ 50, future: any[] ≤ 50}` where past/future items are full project snapshots.

Source: `src/domain/workspace/persistence.ts`.

### 14.2 Authoring envelope schema (cache `present`, transfer `project`, bare legacy record)

Strict object; every listed field required unless marked optional.

| Field | Rule |
| --- | --- |
| `schemaVersion` | `"1.0"` or `"2.0"` |
| `mode` | enum; must equal the target mode |
| `revision` | int ≥ 0 |
| `scene` | any; then must pass `validateScene` |
| `listeners` | 1–8 strict `{id: non-empty, name: non-empty, position: finite Vec3 (strict), headingDeg: finite, enabled: bool}` |
| `activeListenerId` | non-empty; must name an enabled listener |
| `disabledEntityIds` | string[] |
| `selection` | null or strict `{type: enum, id: non-empty}` |
| `room3d` | strict `{widthM 0.1–50, depthM 0.1–50, heightM 0.1–12, floorMaterialId?: string, ceilingMaterialId?: string, ceilingEnabled?: bool}` |
| `sourceHeightsM` | record string → finite number |
| `wall3dById`, `portal3dById` | record string → strict `{bottomM, topM, thicknessM}` finite |
| `primitives?` | ≤ 8 strict `{id: non-empty, name: 1–80, kind: enum, position: finite Vec3, dimensions: finite Vec3, rotationYDeg: finite, materialId: non-empty}` |
| `missingAudioAssetIds?` | string[] |
| `localAudioMetadata?` | record string → strict metadata (§2.3) |
| `view?` | strict `{camera {yawDeg, pitchDeg finite, zoom finite > 0, panX?, panY? finite}, overlays {3 bools}, panels {2 bools}}` |
| `notice` | null or `{code: string, message: string}` (non-strict) |

Source: `src/domain/workspace/persistence.ts`.

### 14.3 Migration of one candidate (`migrateWorkspaceProject(input, mode)`)

1. `candidate = input.present` if `input` parses as a 3.0 or 2.0 cache document (the wrapper's `mode` is not compared here), else `input`.
2. **Envelope branch.** If `candidate` parses as an envelope and `envelope.mode === mode`:
   1. `validateScene(envelope.scene)` must pass; the active listener must exist and be enabled; otherwise the result is `unsupported`.
   2. Build `{...envelope, schemaVersion: "2.0", scene: parsed, room3d: {...room3d, floorMaterialId: ?? scene.room.floorMaterialId, ceilingMaterialId: ?? scene.room.ceilingMaterialId, ceilingEnabled: ?? !disabledEntityIds.includes("ceiling")}, view: migrateView(view), missingAudioAssetIds: ?? [], localAudioMetadata: ?? {}, primitives: ?? [], notice: null}`. `migrateView(undefined)` = default view; otherwise the view with `panX ?? 0`, `panY ?? 0`.
   3. Run spatial validation (§15); any issue → `{ok: false, reason: "invalid_spatial_state", message: issues[0].message}`.
3. **Scene-document branch** (an envelope of the wrong mode falls through here and fails, since its `schemaVersion` key routes it to v1 validation). `validateSceneDocument(candidate)` must pass.
   - V2 document: requires `mode === "hybrid-3d"`. `project = projectFromScene(baseScene, mode)`. If `spatial3d` exists: first listener `y = listenerHeightM`; `sourceHeightsM = {...1.5 for each source, ...spatial.sourceHeightsM}`; `wall3dById` per wall `{bottomM: bounds?.bottomM ?? 0, topM: bounds?.topM ?? project.room3d.heightM, thicknessM: wall.thicknessM}`; `portal3dById` per Portal `{bottomM ?? 0, topM ?? portal.heightM, thicknessM ?? 0.12}`; `disabledEntityIds = disabledSurfaceIds ?? []`; `primitives = spatial.primitives ?? []`. `floorElevationM`, `propagation3d`, `materialBands` and `atmosphericMedia` are dropped.
   - v1 `SceneSpec`: requires `mode === "classic-2d5d"`; `projectFromScene(scene, mode)`.
   - Spatial validation is **not** run on this branch.
4. Any other failure → `{ok: false, reason: "unsupported"}`.

`projectFromScene(scene, mode)` = default project for the mode with `revision = scene.revision`, `scene = copy`, `listeners = [{listener_primary, "Listener", position (scene.listener.x, 1.5, scene.listener.y), heading from scene, enabled}]`, `sourceHeightsM` 1.5 each, `wall3dById` `{0, scene.room.heightM, thickness}`, `portal3dById` `{0, portal.heightM, 0.12}`. `room3d`, `selection` and `view` stay at the defaults (12 × 8 × 3, concrete materials, ceiling enabled) whatever the scene's polygon, height and materials.

`migrateWorkspaceCache(input, mode)` returns the migrated project or null; nothing calls it.

Source: `src/domain/workspace/persistence.ts`.

### 14.4 Loading (`loadWorkspaceCache(storage, mode)`)

1. No storage → default history, warning `Local persistence is unavailable.`, `persistenceAvailable: false`, `recoveryRaw: null`.
2. `raw = storage.getItem(key)`; null → default history, no warning.
3. `JSON.parse(raw)`, then `migrateHistory(parsed, mode)`:
   1. Parses as a 3.0 cache **and** its mode matches: `present = migrate(cache.present)` (null → fail). Replay every past patch backward from `present` (last first) and every future patch forward from `present`; after each application the state must have no spatial-validation issues; any throw → fail. On success the stored patches are kept unchanged.
   2. Else parses as a 2.0 cache with matching mode: migrate `present` (null → fail); migrate each past and future snapshot, **silently dropping** failures, keep the last 50 of each; past patches are `diff(s[k], s[k+1])` over `[...past, present]`; future patches chain `present → f[0] → f[1] …`.
   3. Else: migrate `parsed` itself as a single candidate; success → history with empty past/future.
4. Failure or any exception (including `getItem`/parse errors) → default history, warning `This project cache could not be restored. A safe default was loaded.`, `recoveryRaw = raw` (null if `getItem` threw).
5. Success → warning null when `parsed` is a valid 3.0 cache document, else `A previous scene document was migrated to the current authoring format.`

Replay checks only spatial invariants; it does not re-run `validateScene` on replayed states.

Source: `src/domain/workspace/persistence.ts`.

### 14.5 Saving (`saveWorkspaceCache(storage, mode, value)`)

`value` is a history (detected by a `present` key) or a bare project (wrapped with empty past/future). Writes `{cacheVersion: "3.0", mode, present, past: past.last(50), future: future.first(50)}`. No storage → `{ok: false, warning: "Local persistence is unavailable."}`. Any `setItem` exception (including quota) → `{ok: false, warning: "This project could not be saved locally."}`; there is no retry, trimming or fallback.

The corrupted-record path: the raw text stays available in memory for a "Download unread cache" action (file name `echo-canvas-<mode>-unread-cache.txt`), but the debounced save fires 2 s after mount and overwrites the stored record of the active mode with the default (see Review findings).

Source: `src/domain/workspace/persistence.ts`, `src/hooks/useWorkspaceProjects.ts`, `src/components/workspace/UnifiedWorkspace.tsx`.

---

## 15. Spatial validation (`validateWorkspaceSpatialState(project)`)

Runs only at import and cache boundaries (envelope branch and history replay), never on edits. It assumes `project.scene` has already passed `validateScene`. Constants: `SPATIAL_TOLERANCE_M = 1e-6`, `MIN_WALL_VERTICAL_EXTENT_M = 0.1`, `MIN_PORTAL_VERTICAL_EXTENT_M = 0.4`, `MIN_THICKNESS_M = 0.02`, `MAX_THICKNESS_M = 2`, `MIN_ROOM_PLAN_M = 1`, `MAX_ROOM_PLAN_M = 50`. `near(a, b) = |a − b| ≤ 1e-6`. Issues are `{path, message}` (no code), collected in this order:

| # | Rule | path | message |
| --- | --- | --- | --- |
| 1 | `room3d.widthM` and `depthM` in [1, 50] | `room3d` | `Room width/depth must be 1–50 m.` |
| 2 | `near(room3d.heightM, scene.room.heightM)` | `room3d.heightM` | `Room height must match the base scene room height.` |
| 3 | floor, then ceiling material registered | `room3d.floorMaterialId` / `room3d.ceilingMaterialId` | `Unknown material ID: <id>.` |
| 4 | listener IDs unique (each later duplicate) | `listeners.<i>.id` | `Listener ID must be unique: <id>.` |
| 5 | `sourceHeightsM` keys equal the scene source IDs: each extra key (in key order), then each missing ID (in scene order) | `sourceHeightsM.<id>` | `Source settings refer to unknown Source: <id>.` / `Source <id> is missing its 3D settings.` |
| 6 | `wall3dById` key set, same two messages with `Wall` | `wall3dById.<id>` | |
| 7 | per scene wall with a record: thickness in [0.02, 2] | `wall3dById.<id>.thicknessM` | `Wall thickness must be 0.02–2 m.` |
| 8 | per scene wall: `bottomM ≥ −1e-6`, `topM ≤ room3d.heightM + 1e-6`, `topM − bottomM ≥ 0.1 − 1e-6` | `wall3dById.<id>` | `Wall vertical bounds must fit the <h> m room with bottom below top by at least 0.10 m.` (`<h>` is `room3d.heightM` in JS number format) |
| 9–11 | same as 6–8 for `portal3dById` with label `Portal` and minimum 0.4 (`0.40`) | `portal3dById…` | |
| 12 | primitive IDs unique | `primitives.<i>.id` | `Basic shape ID must be unique: <id>.` |
| 13 | primitive material registered | `primitives.<i>.materialId` | `Unknown material ID: <id>.` |
| 14 | each dimension ≥ 0.1 and `x ≤ widthM`, `y ≤ heightM`, `z ≤ depthM` (on failure skip rule 15) | `primitives.<i>.dimensions` | `Basic shape dimensions must be at least 0.10 m and fit the room.` |
| 15 | fixed point: `constrainPrimitiveToRoom(p, room3d)` equals `p` within 1e-6 on every position and dimension axis | `primitives.<i>` | `Basic shape extents must remain inside the room.` |

Not checked: source height values, listener positions/headings/heights, scene polygon versus `room3d` width/depth, Portal vertical bounds versus the host wall's bounds, `scene.portals[].heightM` versus `portal3dById` extent, `wall3dById.thicknessM` versus scene thickness, `disabledEntityIds`, `selection`, `missingAudioAssetIds`.

Source: `src/domain/workspace/spatial-validation.ts`.

---

## 16. Transfer (authoring file import/export)

### 16.1 File envelope

Written with `JSON.stringify(value, null, 2)`:

```
{
  "format": "echo-canvas-authoring-project",
  "version": "1.0",
  "project": <WorkspaceProject as held in memory, including selection, view, notice>,
  "localAssets": [ {"id", "name", "mimeType", "size", "createdAt"}, … ]
}
```

Reader schema is strict: `format` and `version` literals, `project` any, `localAssets` an array of strict metadata (§2.3). The exporter builds `localAssets` from the project's `localAudioMetadata` values, then adds or overrides entries with every record of the local audio library (by ID). The UI names the download `<slug>.authoring.json` with `slug = scene.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")` (leading/trailing hyphens kept), or `echo-canvas` if empty. Blobs are never included.

### 16.2 Import (`parseWorkspaceProject(json, expectedMode, availableAudioIds)`)

1. `JSON.parse` failure → `Authoring project JSON must be valid JSON.`
2. Envelope schema failure → `This is not a supported Echo Canvas authoring project.`
3. `migrateWorkspaceProject(project, expectedMode)` (§14.3). `project` may therefore be an envelope, a cache document, a legacy cache, a v1 `SceneSpec` (Classic only) or a V2 document (Hybrid only).
   - `invalid_spatial_state` → `This authoring project has invalid 3D geometry: <first issue message>`
   - `unsupported` → `3D project cannot be imported into this mode.` when `String(project.mode) === "hybrid-3d"`, else `2.5D project cannot be imported into this mode.` (also used when the mode matches but the scene or active listener is invalid).
4. `missing` = clip IDs of the migrated scene's sources that are neither built-in nor in `availableAudioIds` (the IDs present in the local library), de-duplicated, in first-occurrence order.
5. Return `project` with `missingAudioAssetIds = missing` (replaces any stored list) and `localAudioMetadata = {...project.localAudioMetadata, ...localAssets by id}`, plus the `localAssets` array.

The UI then dispatches `REPLACE_PROJECT` (recorded, undoable) and reports `Authoring project imported.` or `Authoring project imported; <n> audio asset requires relinking.`; any thrown error is shown as `Import rejected: <message>`. A rejected import changes nothing.

### 16.3 Relinking semantics

A source whose clip is missing keeps its ID, transform and `clipId` and is silent. Relinking supplies a new file for the **same** ID (the library keeps `id` and `createdAt`), then dispatches `SET_LOCAL_AUDIO_METADATA` and `SET_AUDIO_ASSET_MISSING {missing: false}`. Removing a local file dispatches `SET_AUDIO_ASSET_MISSING {missing: true}`. `RELINK_SOURCE` (re-pointing a source to a different clip) exists in the reducer but no UI dispatches it.

Source: `src/domain/workspace/transfer.ts`, `src/components/workspace/WorkspaceProjectTools.tsx`, `src/components/workspace/UnifiedWorkspace.tsx`, `src/domain/audio-assets/local-library.ts`.

---

## 17. Projections

Projections are not validated: they rely on reducer invariants. Both return fresh objects (deep copy of `project.scene`).

### 17.1 `projectClassicScene(project) → SceneSpec`

1. `scene = deepCopy(project.scene)`; `disabled = set(disabledEntityIds)`.
2. `L` = enabled listener with ID `activeListenerId`, else the first enabled listener.
3. `walls = scene.walls` without disabled IDs (scene order); `wallIds` = their IDs.
4. `primitiveWalls` = Classic mode only: for each non-disabled primitive in array order, its footprint walls (§8.2) in segment order; Hybrid: `[]`.
5. Return `{...scene, revision: project.revision, walls: [...walls, ...primitiveWalls], portals: scene.portals filtered to (ID not disabled and wallId ∈ wallIds), sources: scene.sources without disabled IDs, listener: {position: {x: L.position.x, y: L.position.z}, headingDeg: L.headingDeg}}`.

`room`, `settings`, `name`, `units`, `schemaVersion` come from the scene unchanged. `revision` is the project revision, not `scene.revision`. With every source disabled the result has zero sources, and with any enabled primitive it contains synthetic wall IDs that fail `validateScene` (see Review findings). The default Classic projection is valid and hashes to `c6f656f7`.

### 17.2 `projectHybridDocument(project) → SceneDocumentV2`

1. `L` = active listener (as above); `base = projectClassicScene(project)` (no primitive walls in Hybrid).
2. `base.room = {...base.room, heightM: room3d.heightM, outerPolygon: [(0,0), (w,0), (w,d), (0,d)]}` with `w = room3d.widthM`, `d = room3d.depthM`. Floor/ceiling materials stay those of `scene.room`.
3. `extensions.spatial3d`:
   - `coordinateSystem: "x-right-y-up-z-forward"`, `floorElevationM: 0`, `listenerHeightM: L.position.y`;
   - `sourceHeightsM`: for each projected source, `project.sourceHeightsM[id] ?? 1.5`;
   - `wallVerticalBoundsM`: for each projected wall, `{bottomM: wall3dById[id]?.bottomM ?? 0, topM: wall3dById[id]?.topM ?? room3d.heightM}`;
   - `portalVerticalBoundsM`: for each projected Portal, `{bottomM: ?? 0, topM: ?? portal.heightM, thicknessM: ?? 0.12}` from `portal3dById`;
   - `disabledSurfaceIds: room3d.ceilingEnabled ? [] : ["ceiling"]`;
   - `primitives`: `project.primitives` without disabled IDs, records unchanged.
4. `extensions.propagation3d = {maxReflectionOrder: 1, receiverConnection: false}`; no `materialBands`, no `atmosphericMedia`.
5. `compatibility = {migratedFrom: "1.0", classicProjectionHash: classicProjectionHash(base)}`.

`??` substitutes only for null/undefined (0 is kept). Record key order follows entity order (JS places canonical integer-like keys first; this affects only JSON bytes). The default Hybrid projection validates and its hash is `c6f656f7` (identical to the preset because the default `room3d` rectangle equals the preset polygon).

### 17.3 Projection cache (`createProjectProjectionCache(fn)`)

A cache of one entry. On each call with project `p`: if a previous input `q` exists and, for every key of `p` ∪ `q` except `selection`, `view`, `notice`, `localAudioMetadata`, `Object.is(p[key], q[key])`, return the previous output (and remember `p` as the input); otherwise compute `fn(p)` and cache it. The comparison is by reference, never by revision. Callers rely on the returned object identity to avoid recomputation (see Runtime/worker pipeline section).

Source: `src/domain/workspace/projections.ts`, `src/domain/workspace/primitives.ts`, `src/domain/scene-document/validate.ts`.

---

## 18. Presets

`PRESETS` (deeply immutable), `DEFAULT_PRESET_ID = "concrete-partition"`. Every preset: `schemaVersion "1.0"`, `revision 0`, `units "m"`, `room.heightM 3`, `settings {acousticUpdateHz: 12, maxEarlyReflections: 6, hrtfEnabled: true}`, listener heading 0, all sources `sourceType "point"`, `loop true`. The UI preset menu shows `name` and identifies the current preset by matching `scene.name`. All four pass `validateScene`.

Boundary walls in every preset run (0,0)→(W,0) `*_north`, (W,0)→(W,D) `*_east`, (W,D)→(0,D) `*_south`, (0,D)→(0,0) `*_west`, `kind "boundary"`. (In the plan, `north` is the y = 0 edge.)

| id | name | Polygon (W × D) | Floor / ceiling | Walls | Portals | Sources | Listener |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `concrete-partition` | Concrete Partition | 12 × 8 | `concrete_hard` / `concrete_hard` | 4 boundary `boundary_{north,east,south,west}` (0.2 m, `concrete_hard`) + `partition_center` (6,0)→(6,8), 0.2 m, `concrete_hard`, partition | `partition_door` on `partition_center`, center (6,4), width 1.2, height 2.1, open, lossDb 3 | `radio` "Radio" `radio_loop` at (9,4), −3 dB; `rain` "Rain" `rain_loop` at (10,1.5), −8 dB | (3,4) |
| `hard-room` | Hard Room | 10 × 8 | `concrete_hard` / `concrete_hard` | 4 boundary `hard_*` (0.2 m, `concrete_hard`) | none | `hard_radio` "Radio" `radio_loop` at (7.5,4), −3 dB | (3,4) |
| `treated-room` | Treated Room | 10 × 8 | `wood_medium` / `acoustic_treatment` | 4 boundary `treated_*` (0.12 m, `acoustic_treatment`) | none | `treated_voice` "Voice" `voice_loop` at (7.5,4), −3 dB | (3,4) |
| `stress-100-walls` | Stress Test — 100 Walls (em dash) | 12 × 8 | `concrete_hard` / `acoustic_treatment` | 4 boundary `stress_boundary_*` (0.2 m, `concrete_hard`) + 96 partitions (below) = 100 | none | `stress_radio` "Stress radio" `radio_loop` at (10.8,7.2), −6 dB | (1.2,0.8) |

Stress partitions, for `index` 0…95 (evaluate in IEEE double exactly as written):

```
column = index % 12; row = floor(index / 12)
x = 0.45 + column * 0.94;  y = 0.55 + row * 0.92
wall = {id: "stress_" + index, a: (x, y), b: (x + 0.42, y + 0.18), thicknessM: 0.08,
        materialId: index % 3 == 0 ? "wood_medium" : "concrete_hard", kind: "partition"}
```

Hashes: §5.3. The authoring-file fixtures `docs/tutorials/fixtures/concrete-partition-{classic,hybrid}.authoring.json` are transfer files equal to the default projects except `revision: 1`, `scene.revision: 1` and `selection: null`, with an empty `localAssets`; a unit test reads them.

Source: `src/domain/presets/index.ts`, `src/domain/presets/concrete-partition.ts`, `src/domain/presets/hard-room.ts`, `src/domain/presets/treated-room.ts`, `src/domain/presets/stress-100-walls.ts`, `src/domain/deep-freeze.ts`, `src/components/workspace/WorkspaceProjectTools.tsx`.

---

## Review findings

### Verified (by running repository code in a scratch harness, or by direct reading where noted)

1. `src/domain/workspace/primitives.ts:46` with `src/domain/scene/schema.ts:3`: synthetic wall IDs `primitive:<id>:<n>` fail the ID regex, so `projectClassicScene` of any Classic project with an enabled primitive fails `validateScene` (`invalid_format` at `walls.5.id`). The AI compile route then answers `INVALID_BASE_SCENE` for such projects (`src/app/api/scene/compile/route.ts:187-192`; by reading).
2. `src/domain/workspace/projections.ts:66-73`, `src/domain/workspace/entities.ts:21-37`, `src/domain/workspace/project-reducer.ts:275,376`: no code counts footprint walls against the 100-wall budget; a projected Classic scene can hold 196 walls. `AGENTS.md` claims the budget is consumed (by reading).
3. `src/domain/workspace/project-reducer.ts:180-191` with `src/domain/workspace/geometry-constraints.ts:105-106`: `UPDATE_LISTENER` never updates `scene.listener`, yet every scene commit validates it. Resizing the default room to 2 m width fails with `Listener position must be inside the room` even after the real listener was moved to x = 1.
4. `src/domain/scene/validate.ts:80-93`: `acousticUpdateHz` outside 10–15 is rejected (5 Hz → `acoustic_update_rate_out_of_range`). `docs/ARCHITECTURE.md:46` and `AGENTS.md` say requests of 5–20 Hz are accepted and clamped.
5. `src/domain/workspace/history.ts:205-217` with `src/domain/workspace/persistence.ts:115`: resetting a project that equals the default pushes a patch with 0 operations. The saved cache then fails the `min(1)` schema and the next load discards project and history (`This project cache could not be restored…`).
6. `src/hooks/useWorkspaceProjects.ts:92-97`: the debounced save is armed on mount with no recovery guard, so 2 s after loading a corrupted cache the default overwrites the unread record of the active mode. This contradicts `docs/API_CONTRACTS.md:30` ("does not overwrite the unread input"). The e2e test checks only the in-memory download (by reading).
7. `src/domain/workspace/history.ts:200-203`, `src/domain/workspace/project-reducer.ts:25-27`: rejections and `SET_NOTICE` are recorded as undo steps whose only effect is the notice, and they clear the redo stack.
8. `src/components/workbench/SceneEditor.tsx:198-216`, `src/components/lab/HybridSpatialViewport.tsx:559-571`: viewport drags record one undo step per pointer move. Only numeric scrub fields coalesce (`src/components/workspace/UnifiedWorkspace.tsx:405-413`), and the 50-step cap lets one drag evict all earlier history (by reading).
9. `src/components/workspace/ClassicViewportAdapter.tsx:130` with `src/domain/workspace/project-reducer.ts:292-306`: a Classic endpoint drag maps to `UPDATE_WALL`, which does not carry hosted Portals, so dragging the default partition's endpoint is rejected (`Portal must lie on and fit within its referenced wall`). The dead editor reducer (`src/domain/editor/reducer.ts:145-172`) and the Hybrid path (`constrainWall3D`) both move Portals.
10. `src/domain/workspace/persistence.ts:171-195,256-289`: v1/V2 migration keeps the default `room3d` (12 × 8 × 3) whatever the scene. A V2 document with a 20 × 10 × 5 room produces `room3d.heightM 3` and wall tops of 3, and `disabledSurfaceIds ["ceiling"]` yields `disabledEntityIds ["ceiling"]` with `ceilingEnabled: true`. Spatial validation is skipped on this branch (line 214) and would have flagged the height. `floorElevationM` is ignored.
11. `src/domain/scene-document/validate.ts:34-35`: `for…of` plus `charCodeAt(0)` hashes only the high surrogate of astral characters (`Room 😀` and `Room 😁` both give `771ff050`).
12. `src/domain/workspace/geometry-constraints.ts:118,122` with `src/domain/scene-document/validate.ts:78,100`: resize clamps listener y and source heights to `[0.1, h]` inclusive, while V2 requires strictly below the ceiling. A listener at 2.9 m after a resize to 2 m gives an invalid Hybrid document (`listener_height_out_of_room`).
13. `src/domain/workspace/transfer.ts:53-58`: a same-mode file with an invalid scene is reported as `2.5D project cannot be imported into this mode.`
14. `src/domain/workspace/project-reducer.ts:262-272`: `DELETE_SOURCE` leaves the ID in `disabledEntityIds` (verified `["rain"]` remains). The other deletes clean up.
15. `src/domain/workspace/project-reducer.ts:416-433`: `SET_ROOM_3D` performs no validation (`heightM: 1` accepted into both `room3d` and `scene.room`).
16. `src/domain/workspace/project-reducer.ts:54-70,375-414`: `ADD_LISTENER` accepts duplicate IDs (verified) and `ADD_PRIMITIVE`/`UPDATE_PRIMITIVE` do not check ID uniqueness or material registration.
17. `src/domain/workspace/project-reducer.ts:39,44,452`: every validation failure is reported with notice code `entity_missing`.
18. `src/domain/workspace/project-reducer.ts:85-87`: deleting a non-active listener leaves `selection` pointing at it (by reading).
19. `src/domain/workspace/project-reducer.ts:505-506`: `REPLACE_PROJECT` installs any same-mode project without validation. Constraint helpers and import are trusted (by reading).
20. Dead or test-only code: `editorReducer`/`createEditorState` (`src/domain/editor/reducer.ts:96`, `src/domain/editor/state.ts:29`), `RELINK_SOURCE` and `SET_ACTIVE_LISTENER` (no UI dispatch), `toggleEntityEnabled` (`src/domain/workspace/geometry-constraints.ts:226`), `migrateWorkspaceCache` (`src/domain/workspace/persistence.ts:292`, no callers), `serializeScene`/`parseScene`/`serializeSceneDocument`/`parseSceneDocument` (no live callers), and `schemas/scene-spec.schema.json` (no code or test reads it, so it can drift from Zod).
21. `src/domain/workspace/projections.ts:77`: with every source disabled, the Classic projection has 0 sources, violating `SceneSpec` `min(1)`. Projections are never validated (by reading; downstream effect: see Runtime/worker pipeline).

### Suspected (plausible from reading; not exercised end to end)

1. `src/domain/workspace/project-reducer.ts:166-177`: `disabledEntityIds` is one flat namespace. A primitive may share an ID with a wall, and a wall may be named `ceiling`, so disabling one affects the other, and `SET_ROOM_3D` can re-enable a wall named `ceiling`.
2. `src/domain/workspace/geometry-constraints.ts:44-48`: boundary walls are reassigned to rectangle corners by index modulo 4, which is wrong for scenes whose boundary is not exactly four walls in N/E/S/W order (AI or imported Classic polygons). Lines 54-62 teleport a partition collapsed at the +x edge to (0,0)–(0.1,0).
3. `src/domain/workspace/persistence.ts:302-309`: history replay checks only spatial invariants, so a tampered cache can make undo reach a scene that fails `validateScene`.
4. `src/domain/workspace/project-reducer.ts:450-503`: `REPLACE_SCENE` keeps non-active listeners (possibly outside the new room) and the old `missingAudioAssetIds`.
5. `src/domain/workspace/spatial-validation.ts:81-144`: several invariants are unchecked (§15 list), for example a Portal's vertical bounds outside its host wall, or `room3d` width/depth different from the scene polygon.
6. UI/domain range mismatches surface raw Zod messages: source gain field −60…12 versus −36…6 (`src/components/workspace/ContextInspector.tsx:215`); a file name longer than 60 code points, or one that is empty after its extension is stripped, makes `ADD_SOURCE` fail (`src/components/workspace/UnifiedWorkspace.tsx:356`).
7. An import keeps the file's `revision`, which can equal or be lower than the current revision. Any revision-keyed acceptance downstream must not assume monotonic revisions (see Runtime/worker pipeline).
8. Performance: `src/domain/workspace/history.ts:118` deep-copies the whole project per undo/redo, and the reference diff stores full wall arrays for every add/delete (lines 61-75). Startup runs both cache migrations twice (`src/hooks/useWorkspaceProjects.ts:39-71`).
9. Cosmetic: preset `*_north` walls lie on y = 0, while the Hybrid UI says north is +Z (`src/components/lab/HybridSpatialViewport.tsx:598`).
10. `src/domain/workspace/project-reducer.ts:129-178,180-191,227-237`: `SET_ENTITY_ENABLED`, `UPDATE_LISTENER` and `SET_AUDIO_ASSET_MISSING` bump the revision even when they change nothing, which forces recomputation.

Missing tests: projected-Classic-with-primitive validity; reset, save and reload; corrupted cache surviving the debounce; non-ASCII hash vectors; V2 migration of room dimensions/ceiling/floor elevation; resize after moving the listener; drag-history coalescing; JSON Schema versus Zod parity.

---

## Rewrite notes

### Preserve for behavior and file-format parity

- **SceneSpec v1**: exact field names, strictness, bounds, ID regex, string length in code points, finite-number rule, semantic checks and their order, error codes and the effective 10–15 Hz rule (or record a deliberate change). Keep the geometry algorithms of §4.3 with `EPSILON = 1e-8`.
- **SceneDocumentV2**: structure, validation order, and `classicProjectionHash` bit for bit, including JS number formatting, JSON string escaping, key sorting by UTF-16 units, FNV-1a with wrapping u32 multiply, and the high-surrogate-only quirk. Check the port against the vectors in §5.3; files written by the web app carry these hashes.
- **Transfer file** `echo-canvas-authoring-project` / `1.0` with the authoring envelope (accept `schemaVersion` `"1.0"` and `"2.0"` and the optional fields with their defaults), the full migration ladder of §14.3 (envelope, cache wrappers, bare `SceneSpec`, bare V2 document), the spatial validation rules and messages, and the `missingAudioAssetIds` recomputation on import.
- **Projection semantics**: disabled filtering, host-suspended Portals, one active listener with its fallback, `revision = project.revision`, primitive footprints (12 segments, exact float evaluation order) and the Hybrid rectangle, defaults (`1.5`, `0.12`, room height) and `propagation3d {1, false}`.
- **Reducer semantics** that downstream consumers observe: which actions bump `revision`, rejection-as-notice, limits and messages, cascading deletes, constraint helpers (Portal re-fitting with the 0.02 m margin and 0.4 m minimum).
- **Undo semantics**: 50-step window, what is recorded, the transaction model, and revision reuse on undo. The patch encoding only needs to be preserved if browser caches are imported.
- **Registries and presets**: material and asset IDs, coefficients and order; the preset content including stress-wall float arithmetic (hashes depend on it).

### JS semantics to emulate deliberately

- `clamp` uses `min(hi, max(lo, v))`. Rust `f64::clamp` panics when `lo > hi` and `f64::max`/`min` drop NaN; reproduce the JS results (`hi` when `lo > hi`, NaN propagates).
- Numbers are written with `Number::toString` (`-0` → `0`, exponent thresholds 1e21 and 1e-7). Rust `Display` differs for exponents and prints `-0`.
- Set and object insertion order drives the order of `disabledEntityIds` and `missingAudioAssetIds` and record key order. Canonical integer-like object keys are ordered first in JS objects (bytes only).
- `JSON.parse` permits duplicate keys (last wins); there is no BigInt and numbers are IEEE doubles. Ints must be safe integers.
- `??` substitutes only null/undefined; `structuredClone` preserves `-0`, JSON does not.

### Incidental to the web platform (may differ in Rust)

- localStorage keys, the compact cache envelope, 2 s debounce, `pagehide` flush and the UI-mode key. A desktop app can use files or a database, but must keep "never silently lose an unreadable record" (do **not** copy finding 6).
- React state, `useMemo` projection identity (replace with explicit dirty tracking or value comparison), `structuredClone`, deep-freeze of constants, Zod as the validator (keep codes and messages where they reach users or tests).
- SVG coordinate helpers (§11.3) and the legacy editor reducer (§11.1); the latter is test-only and need not be ported beyond its Portal-carrying endpoint rule, which the live Classic path should adopt.
- IndexedDB and object URLs for local audio (Audio engine section); only the metadata fields of §2.3 are part of the file format.

### Do not copy

Findings 1, 3, 5, 6, 7, 9, 10, 12, 13, 14 and the flat disabled-ID namespace. Give footprint walls valid IDs and count them against a budget, or validate the projection; keep one source of truth for ceiling state, room height and Portal height; validate every reducer path that touches geometry (`SET_ROOM_3D`, `UPDATE_LISTENER`, `ADD_PRIMITIVE`, `REPLACE_PROJECT`); use distinct notice codes; drop or update the stale `scene.listener`.
