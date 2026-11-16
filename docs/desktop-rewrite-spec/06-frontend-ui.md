# 6. Frontend UI: functional inventory and UX critique

This section lists everything the current web UI lets a user see and do, so the Rust desktop rebuild can redesign the UI without losing any function. It describes the code as it is, including its defects. It is not a target design. The critique, review findings and rewrite notes are at the end.

Related sections, referenced by name: **Domain model** (project, entities, actions, validation, limits, persistence and migration), **Classic acoustics** (2.5D routes, reflections, RT60), **Hybrid 3D acoustics** (3D direct paths, reflections, arrival direction), **Audio engine** (start/stop, Raw/Simulated, HRTF), **Runtime/worker pipeline** (frame acceptance, pose-lagging frames, fallback, metrics) and **Backend, AI, infrastructure and tests** (AI routes, error codes, E2E suite).

Conventions used here:

- **Units.** Metres (m), degrees (°), decibels (dB), seconds (s), milliseconds (ms).
- **Plan axes.** X runs east. Z runs north. The 2D `SceneSpec` stores Z in a field named `y`. Y is height above the floor and exists only in 3D.
- **Screen axes.** The Classic canvas draws +Z upward. The Hybrid viewport has a compass where north is +Z.
- **Coordinate units.** "viewBox units" are SVG user units. The Classic canvas uses a 900 × 600 viewBox and the Hybrid viewport uses 1200 × 720. Both scale uniformly to the panel, with letterboxing.
- **Mode names.** "Classic", "2.5D" and the ID `classic-2d5d` are one mode. "Hybrid", "3D" and `hybrid-3d` are the other.

---

## 6.1 Routes and page metadata

| Route | Page component | Initial mode | Notes |
| --- | --- | --- | --- |
| `/` | `HomePage` | Stored mode from `localStorage["echo-canvas:workspace-ui:v1"]`, else Classic | Same workspace |
| `/classic` | `ClassicPage` | Classic (forced) | Same workspace |
| `/lab` | `HybridLabPage` | Hybrid (forced) | Same workspace |

- All three routes render the same `UnifiedWorkspace`. The only difference is the `initialMode` prop (verified).
- Switching modes in the toolbar does **not** change the URL. `/classic` can show the 3D mode.
- Metadata (`layout.tsx`):
  - Title `Echo Canvas` (`APP_NAME`) on every route. It never includes the scene or mode.
  - Description "Browser-based spatial-audio prototyping and previsualization."
  - `<html lang="en">`.
  - The favicon `src/app/icon.svg` is a 64 × 64 rounded square (#10151d) with a mint (#72e6bd) "D" stroke and an amber (#f7b955) bar.
- There is no viewport or theme-color metadata and no web manifest.
- Before client hydration the page renders an empty `<main class="unified-workspace workspace-loading" aria-label="Loading Echo Canvas">` with no visible content (no spinner).

Source: src/app/page.tsx, src/app/classic/page.tsx, src/app/lab/page.tsx, src/app/layout.tsx, src/app/icon.svg, src/domain/app-meta.ts, src/hooks/useWorkspaceProjects.ts, src/components/workspace/UnifiedWorkspace.tsx

## 6.2 Component tree and state ownership

```
RootLayout                       <html lang=en><body>, globals.css, metadata
└─ UnifiedWorkspace(initialMode?)        <main data-mode data-playing …>
   ├─ WorkspaceToolbar                   <header>
   │  ├─ project trigger ─ projectMenu slot: <div role=dialog #workspace-project-menu hidden?>
   │  │                                   └─ WorkspaceProjectTools (always mounted)
   │  ├─ mode switch (2.5D | 3D)
   │  ├─ mobile toggles (Scene, Inspector; ≤850 px only)
   │  ├─ "＋ Add" ─ addMenu slot: AddObjectMenu | AudioAssetPicker (conditional)
   │  ├─ Undo, Redo
   │  └─ Play/Stop, Simulated|Raw
   ├─ persistence banner | recovery card | clear-all alertdialog   (conditional, fixed)
   ├─ toast region: audio error (Retry) + undo toast (Undo, ×)      (fixed)
   ├─ wall placement card (conditional, fixed)
   ├─ .workspace-grid
   │  ├─ SceneOutliner (memo)   GroupHeader*, OutlinerEntityRow*, AddObjectMenu (geometry kinds)
   │  ├─ ClassicViewportAdapter          (mode = classic)
   │  │  ├─ viewport header: scene name, Home, Frame All, ViewportHelp
   │  │  └─ SceneEditor (SVG floor plan + legend)
   │  │  or HybridViewportAdapter        (mode = hybrid)
   │  │  ├─ viewport header: scene name, Top, Front, Home, Frame All | Paths, Show all paths, Ceiling | ViewportHelp
   │  │  ├─ HybridSpatialViewport (SVG) ─ GeometrySurfaceLayer, HybridPathOverlay, labels, axes, compass, legend
   │  │  └─ HybridArrivalDirectionLabel (when Paths on)
   │  └─ ContextInspector (memo)  Section, NumericScrubField*, NameInput, MaterialSelect, HintCard
   ├─ drawer backdrop button (narrow screens, drawer open)
   └─ WorkspaceStatusBar        <footer aria-live=polite>
(not mounted anywhere) HybridPlanPositionEditor
```

| Component | Responsibility | State it owns (local) | Main inputs |
| --- | --- | --- | --- |
| `UnifiedWorkspace` | Composition, global shortcuts, add flows, wall placement, audio transport, toasts, banners, drawers | `addOpen`, `audioPickerOpen`, `wallPlacement {mode, first}`, `previewMode` (default `simulated`), `playing`, `audioPending` (+ ref), `audioError`, `undoToast`, `projectOpen`, `confirmClearAll`, `mobilePanel` (`outliner`/`inspector`/null), `acousticStatus`, the single `AudioEngine` instance, and an audible-scene projection cache | `useWorkspaceProjects`, `useLocalAudioLibrary`, `useAudioEngine` |
| `useWorkspaceProjects` (hook) | Two per-mode histories, active mode, dispatch, undo/redo, history transactions, reset, clear, persistence status, recovery text | `activeMode`, `histories {classic, hybrid}`, `persistenceStatus`, `restoration` (read once), transaction ref | localStorage |
| `useLocalAudioLibrary` (hook) | IndexedDB audio library wrapper | `records`, `warning` | IndexedDB |
| `useCameraTween` (hook) | Animated preset camera moves; one commit at the end | `displayed` camera during a tween, rAF handle | committed camera |
| `WorkspaceToolbar` | Stateless toolbar | none | props |
| `WorkspaceProjectTools` | Preset, import/export, AI compile/explain, Reset/Clear entry points | `prompt`, `candidate`, `status`, `explanation` (survive menu close and mode switch, because the component is never unmounted) | project, dispatch, local asset metadata |
| `AddObjectMenu` | List of addable kinds with availability | none | `availability`, optional `kinds` filter |
| `AudioAssetPicker` | Built-in and local audio choice, file import | `error` | library records, warning |
| `SceneOutliner` | Grouped entity list, counts, enable toggles, group add buttons | `geometryMenu` position, trigger ref | project, availability |
| `ContextInspector` | Selection editor or scene summary; notice display | `confirmAudioRemoval`, `audioEditStatus`, `actionsOpen` | project, dispatch, audio callbacks, `rt60MidS` |
| `NumericScrubField` | Numeric field with drag-scrub label | `editing`, `draft`, `invalid`, scrub ref | value, min, max, step, fineStep, unit |
| `ClassicViewportAdapter` | Classic projection, Classic acoustic frame, applies the accepted frame to audio, reports status, maps editor actions to project actions | projection cache | project |
| `SceneEditor` | Classic SVG editing and overlays | `dragTarget`, `viewDrag`, click-suppression ref | scene, selection, frame, camera |
| `HybridViewportAdapter` | Hybrid projection, geometry compile, direct-path frames, audio application, status, overlay toggles, constrained drags | compiler and projection caches | project |
| `HybridSpatialViewport` | Orthographic 3D SVG, drags, orbit, pan, zoom, label layout | `dragState` | objects, walls, primitives, paths, camera |
| `HybridPathOverlay` | Path polylines, reflection nodes, tooltip | `activePathId` | display paths, camera |
| `ViewportHelp` | "?" gesture help popover | `open` | items |
| `WorkspaceStatusBar` | Engine state, debug line, acoustic readout | none | status |

Source: src/components/workspace/*.tsx, src/components/workbench/SceneEditor.tsx, src/components/lab/HybridSpatialViewport.tsx, src/components/lab/HybridPlanPositionEditor.tsx, src/hooks/useWorkspaceProjects.ts, src/hooks/useLocalAudioLibrary.ts, src/hooks/useCameraTween.ts, src/hooks/useAudioEngine.ts

## 6.3 Layout regions

**Desktop (viewport width ≥ 851 px).**

- Full-height grid, `100dvh`, no page scroll.
  - Rows: toolbar 3.25rem (52 px), workspace 1fr, status bar 1.7rem (27 px).
  - Workspace columns: Outliner 14rem (224 px), viewport 1fr, Inspector 19rem (304 px).
- The Outliner and Inspector each scroll vertically on their own.
- The viewport panel has 0.6rem padding. Its header row (min 2.45rem) holds the scene name, view buttons and help. The canvas fills the rest and keeps its aspect ratio, centred and letterboxed.

| Region | Contents |
| --- | --- |
| Toolbar, left | Brand "Echo Canvas" with subtitle "Acoustic scene editor". Project trigger (scene name ▾) that opens the project menu (§6.5). |
| Toolbar, centre | Mode switch "2.5D" / "3D". A sliding highlight marks the active mode. |
| Toolbar, right | Edit group: "＋ Add" (opens the Add menu), Undo ↶, Redo ↷. Audio group: Play/Stop (the only filled primary button), segmented Simulated/Raw. |
| Left column | Scene Outliner (§6.7) |
| Centre column | Classic canvas (§6.9) or Hybrid viewport (§6.10), with its header toolbar, legend (bottom-left overlay) and, in 3D, the arrival-direction line under the SVG |
| Right column | Inspector (§6.8). Notices show at its bottom. |
| Footer | Status bar (§6.13) |
| Fixed overlays (z-index) | Add menu and audio picker 30. Help and "More actions" panels 35. Project menu 40. Drawer backdrop 50. Drawers 60. Persistence and recovery banners 70 (top 60 px / 106 px, centred). Toast region 75 (bottom 2.45rem, centred, max 32rem). Wall placement card 80 (top 4.25rem, centred). Clear-all confirmation 100 (top 5rem, centred). |

**Narrow (≤ 850 px).**

- The grid collapses to the viewport only. The brand, the brand subtitle and the status-bar Debug disclosure are hidden.
- The toolbar actions row scrolls horizontally. Add popovers become fixed and centred under the toolbar.
- Two toolbar buttons, "Scene" and "Inspector", open the Outliner (from the left) or the Inspector (from the right) as fixed drawers.
  - Size: `min(21rem, 100vw − 2rem)`, 84vw wide, between toolbar and status bar.
  - The open drawer gets `role="dialog"` and `aria-modal`, over a dimmed backdrop button ("Close panel").
  - Escape or a backdrop click closes it. Selecting a row in the Outliner drawer also closes it.
  - Drawers have no slide animation.
- At ≤ 34rem (544 px) the Hybrid selected-object coordinate label is hidden.

Source: src/app/globals.css:9-17, 19-26, 102-160, 355-379, 856-975, src/components/workspace/UnifiedWorkspace.tsx:395-517, src/components/workspace/WorkspaceToolbar.tsx

## 6.4 Toolbar controls

| Label / glyph | Control | States | Effect |
| --- | --- | --- | --- |
| Scene name ▾ (accessible name "Project: {scene name}") | Button with `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` | Border turns cyan while open | Toggles the project menu. Opening Add closes it. A pointerdown outside it or Escape closes it. Escape returns focus to the trigger. Opening it does **not** move focus into the menu. |
| 2.5D / 3D | Two toggle buttons, `aria-pressed`, group "Editor mode" | Active one highlighted | Flushes the current mode's cache, stores the new mode in localStorage and switches the active project. The incoming viewport fades in over 150 ms. Audio keeps playing. |
| Scene / Inspector | Buttons (≤850 px only) | — | Opens the matching drawer |
| ＋ Add (`data-testid=add-object`) | Button (no `aria-expanded`) | — | Opens the Add menu (§6.6) |
| ↶ (title "Undo (Ctrl+Z)") | Icon button | Disabled when there is no history | Undo one step in the active mode |
| ↷ (title "Redo (Ctrl+Shift+Z)") | Icon button | Disabled when there is no future | Redo one step |
| ▶ Play / ■ Stop | Primary toggle, `aria-pressed=playing`, `aria-busy` while pending | Labels: "Play", "Stop", "Starting…", "Stopping…". 75 % opacity and a progress cursor while pending. When playing, the filled background becomes a tinted outline. | Starts or stops audio (§6.11). Repeated activation while pending is ignored. |
| Simulated / Raw | Segmented pair, `aria-pressed`, group "Preview mode" | Default Simulated. Not persisted. | Sets the engine preview mode. Works while stopped or playing. |

Source: src/components/workspace/WorkspaceToolbar.tsx, src/components/workspace/UnifiedWorkspace.tsx:377-393, 415-462

## 6.5 Project menu (scene-name dropdown)

- The menu is a 22rem panel anchored under the trigger. It scrolls up to `100dvh − 5rem`.
- It stays mounted while hidden, so an unapplied AI prompt or candidate survives closing it.
- The sections appear in this order.

| Section | Control | Details |
| --- | --- | --- |
| Scene | "Preset" `<select>` (aria "Scene preset") | Options: Concrete Partition, Hard Room, Treated Room, "Stress Test — 100 Walls". Shows the preset whose name equals the current scene name; for any other scene it falls back to showing Concrete Partition. Change: dispatches `REPLACE_SCENE` with a clone of the preset and closes the menu. This step is undoable but shows no toast. It replaces the scene, repositions only the active listener, resets heights and wall/Portal vertical bounds, clears primitives, re-enables everything and clears the selection (see *Domain model*). |
| Authoring file | "Export authoring JSON" button | Downloads `{scene-name-slug}.authoring.json` (fallback `echo-canvas.authoring.json`). The file holds the active project plus local-audio relinking metadata, never audio bytes. |
| | "Import authoring JSON" file button (accepts `application/json,.json`) | Parses the file for the active mode against the known local audio IDs and replaces the project (`REPLACE_PROJECT`, undoable, no toast). The status line reads "Authoring project imported." or "Authoring project imported; N audio asset requires relinking." Errors read "Import rejected: {reason}": invalid JSON, unsupported document, invalid 3D geometry, or "3D project cannot be imported into this mode." (and the 2.5D equivalent). The menu stays open. |
| AI scene tools | "Scene description" textarea (aria "Describe a scene", maxLength 2000) | Free text |
| | "Generate scene" | Disabled only while the trimmed prompt is empty. See §6.12. |
| | "Apply {candidate name}" (primary) | Appears after a validated candidate arrives. Applies it and closes the menu. |
| | "Explain selected acoustics" | See §6.12. The result renders inline: bold summary, one line "label: evidence" per factor, limitations in small text. |
| Project | "Reset 2.5D project…" / "Reset 3D project…" (danger style) | Closes the menu and **immediately** resets only the active mode to the default project, as one undoable history step, with an Undo toast "Reset 2.5D project" / "Reset 3D project". The ellipsis suggests a confirmation that does not exist. |
| | "Clear all local data…" (danger style) | Closes the menu and opens the confirmation card (§6.14) |
| Status line | `<p role=status>` at the bottom | Last import, AI or explain message. Persists until the next message. |

Source: src/components/workspace/WorkspaceProjectTools.tsx, src/components/workspace/UnifiedWorkspace.tsx:167-174, 237-246, 429-441, src/domain/presets/index.ts, src/domain/workspace/transfer.ts:40-60, src/domain/workspace/project-reducer.ts (REPLACE_SCENE)

## 6.6 Adding objects

The Add menu has the title "Add object". It is a `role=dialog` popover with `aria-modal="true"`, anchored under "＋ Add", and focus moves to its first item.

- It closes on ×, on Escape, or on choosing an item. It does **not** close on an outside click, and it does not return focus.
- Items are grouped. Each shows a glyph and label, and a disabled item shows its reason in small amber text and in its title.

| Group | Item (glyph) | Availability rule (shared by toolbar, Outliner and the Add menu) |
| --- | --- | --- |
| Scene | Listener (L) | Disabled at 8 listeners: "Limit: 8 listeners" |
| Scene | Source (S) | Disabled at 4 sources: "Limit: 4 sources" |
| Geometry | Wall (W) | Disabled at 100 authored walls: "Limit: 100 walls" |
| Geometry | Portal (P) | Disabled at 8 Portals ("Limit: 8 Portals"), or when the selection is not an enabled wall ("Select an enabled Wall first") |
| Basic shapes | Box (□), Cylinder (○), Sphere (●) | Disabled at 8 shapes: "Limit: 8 shapes" |

Counts include disabled entities. The Outliner geometry "＋" opens the same menu filtered to Wall, Portal, Box, Cylinder and Sphere, titled "Add geometry". That copy is fixed-positioned under its button and kept on screen (assumed height 330 px). It closes on an outside pointerdown and on Escape, and Escape returns focus.

**Defaults of created entities.** W, D and H are the room width, depth and height.

| Kind | ID / name | Initial values | After add |
| --- | --- | --- | --- |
| Listener | `listener_{rev+1}`, "Listener {count+1}" | Position (W/2, 1.5, D/2), heading 0°, enabled | Becomes the **active** listener and is selected |
| Source | `source_{rev+1}`. Name: built-in label (e.g. "Radio loop") or file name without extension | Plan (0.7W, 0.5D), height 1.5 m, gain −6 dB, loop on, point source | Selected |
| Wall | `wall_{rev+1}`. Outliner name "wall {n}" | Two clicked endpoints, thickness 0.15 m, material Hard concrete (`concrete_hard`), kind partition, vertical 0 → H | Selected |
| Portal | `portal_{rev+1}` | Centred on the selected wall's midpoint, width 1 m, height 2.1 m, open, loss 3 dB, 3D bounds 0 → 2.1 m, thickness 0.12 m | Selected |
| Box / Cylinder / Sphere | `{kind}_{rev+1}`, "{Kind} {n}" (n = count of that kind + 1) | Centre (W/2, min(0.75, H/2), D/2), dimensions 1.5 × 1.5 × 1.5 m, rotation 0°, material Medium wood (`wood_medium`), then constrained to the room | Selected |

**Flows.**

1. *Listener.* Choose Add → Listener. The listener is created immediately. No toast appears.
2. *Source.* Choose Add → Source, or the Outliner "Add source" button, or the Inspector summary "Add source". This opens the audio picker under the toolbar Add button (§6.11).
   1. Choose a built-in clip or a device clip, or import a file.
   2. The source is created and the picker closes. Local audio metadata is copied into the project.
3. *Wall* (both modes).
   1. Choose Add → Wall. A placement card appears with "Add Wall · Choose endpoint A" and a Cancel button.
   2. Click a point in the viewport. A marker labelled "A" appears and the card reads "Choose endpoint B".
   3. Click a second point. If the points are less than 0.1 m apart, the Inspector notice "Wall endpoints must be at least 0.1 m apart." appears and placement continues with A kept. Otherwise the wall is created and placement ends.
   - Escape or Cancel aborts at any step. Pan and zoom gestures do not count as clicks.
   - Classic clicks land on the empty room surface only. Existing objects and walls intercept clicks.
   - Hybrid clicks land on the floor plane (Y = 0) at pointerdown. They are clamped to [0.2, W − 0.2] × [0.2, D − 0.2] and rounded to 0.1 m. Wall panels ignore the pointer during placement.
4. *Portal.* Select an enabled wall first, then choose Add → Portal. The Portal is created centred on that wall.
5. *Shapes.* Choose Add → Box, Cylinder or Sphere. The shape is created immediately at the room centre.

Source: src/components/workspace/AddObjectMenu.tsx, src/components/workspace/UnifiedWorkspace.tsx:259-375, 442-457, 476, src/domain/workspace/entities.ts:21-38, src/components/workspace/SceneOutliner.tsx:184-211, src/components/workbench/SceneEditor.tsx:299-318, src/components/lab/HybridSpatialViewport.tsx:522-539, src/domain/workspace/project-reducer.ts (ADD_* cases)

## 6.7 Scene Outliner

- The Outliner is an `<aside aria-label="Scene Outliner">`.
- Its header reads "Scene", with the mode ("2.5D"/"3D") at the right.
- Below the header a `<nav>` lists flat groups. Each group header shows an uppercase label, a count and an optional "＋" button.

| Group | Count shown | ＋ button | Rows |
| --- | --- | --- | --- |
| Listeners | `n / 8` | "Add listener" | One per listener, labelled by name. The active listener has an amber "Active" badge. The row title explains: "Selecting a listener makes it the audible receiver". |
| Sources | `n / 4` | "Add source" (opens the audio picker) | Source name |
| Geometry | Total (walls + Portals + shapes). Tooltip: "Walls n / 100 · Portals n / 8 · Shapes n / 8" | "Add geometry" (filtered menu, `aria-expanded`) | All walls, then all Portals, then all shapes, in one flat list. Walls and Portals show their ID with `_` replaced by a space (e.g. "partition center", "boundary north"). Shapes show their name. Portals are not nested under their host walls. |
| Room | — | — | "Room dimensions" (selects the `surface:room` entity) |
| Surfaces (3D only) | — | — | "Floor" and "Ceiling" |

Row behaviour:

- **Select.** Clicking a row dispatches `SELECT_ENTITY` and closes the mobile drawer. Selecting a listener makes it active, which increments the revision and is undoable (see *Domain model*). The selected row shows a tinted background, a 2 px cyan inset bar and `aria-pressed`.
- **Kind dot.** Listener amber, source cyan, wall coral (square), shape purple (square), surface grey (square).
- **On/off toggle.** An eye icon, shown on row hover or focus and always shown while the entity is off. Every row has one except Room and Floor. Its aria-label is "Turn off {label}" or "Turn on {label}" and its title "Turn off (exclude from acoustics)" or "Turn on". It dispatches `SET_ENTITY_ENABLED` without changing the selection, except that turning off the active listener activates and selects a fallback listener. Off rows are at 50 % opacity, struck through, with an "Off" badge.
- **Group "＋" when disabled.** The button is greyed (35 %), and the reason appears only in its `title`.
- **Missing features.** No search, filter, collapse, rename, drag reordering, multi-select or keyboard arrow navigation. Every row and every toggle is its own Tab stop.

Source: src/components/workspace/SceneOutliner.tsx, src/app/globals.css:92-134, src/domain/workspace/project-reducer.ts:99-178

## 6.8 Context Inspector

### 6.8.1 Header, actions and layout

- The Inspector is an `<aside aria-label="Inspector">`.
- **Header with a selection.** The header holds:
  - A kind dot.
  - The title. For sources and shapes it is an editable name field (§6.8.2). For others it is static text: listener name, wall or Portal ID with spaces, "Room", "Floor" or "Ceiling".
  - A type line: "Listener", "Source", "Wall", "Portal", "Box"/"Cylinder"/"Sphere", "Room" or "Surface". Badges after it: "Active" (amber) and "Off" (grey).
  - Header actions:
    - **Enable / Disable** button. Shown for every selection except Room and Floor.
    - **⋯ "More actions"** disclosure. Shown when the entity has a position or can be deleted. It contains "Move to room centre" and "Delete" (red).
      - "Move to room centre" exists for listeners, sources and shapes. It moves to (W/2, min(1.5, H), D/2).
      - "Delete" exists for everything except surfaces. It deletes immediately, with an Undo toast (§6.14).
      - Escape or an outside pointerdown closes the panel. Escape returns focus to ⋯.
- **Header with nothing selected.** Title "Scene", type line "Nothing selected", and the summary in §6.8.4.
- **Section order.** Sections always appear in this order: Placement → Shape → Acoustics. A section is omitted when it has no fields. A "Faceted acoustic approximation" disclosure follows for cylinders and spheres, with the text "Curved surfaces use bounded planar facets for deterministic obstruction and bounded first- and second-order reflections."
- **Listener note.** For the active listener the Inspector shows "Selecting a listener makes it the audible receiver."
- **Notices.** A domain notice shows as a card at the very bottom of the Inspector (`role=status`), with a dismiss "×" (§6.14).

Source: src/components/workspace/ContextInspector.tsx:59-333

### 6.8.2 Shared field controls

**NumericScrubField.** The field is a three-column row: label button, text input, unit.

- **Label button.** Shows the axis letter (X/Y/Z, coloured coral/amber/cyan) or the field label. Its accessible name is "Drag to adjust {label}" and its title is "{label}: drag horizontally to adjust, or type an exact value".
  - Horizontal pointer drag: `value = start + Δpx × step`. Hold Shift to use `fineStep` per pixel. Hold Ctrl to round the result to a multiple of `step`. The result is clamped to [min, max] and rounded to 6 decimals.
  - Each pointer move commits a value. The whole drag is one undo step, because `UnifiedWorkspace` opens a history transaction on pointerdown over `.numeric-scrub-label` and closes it on pointerup or cancel.
  - The button has no keyboard behaviour.
- **Input** (`aria-label={label}`, `inputMode=decimal`).
  - **Display.** The input shows the value with at most 4 decimals and trailing zeros dropped.
  - **Focus.** Focus starts a draft.
  - **Commit.** Enter or blur commits. The draft is parsed by removing the unit text (case-insensitive) and then `Number()`. The value must be finite and within [min, max].
  - **Invalid input.** Out-of-range or non-numeric input is **rejected, not clamped**. The field gets a red border and `aria-invalid`, an alert line "Enter a value from {min} to {max} {unit}." appears, and the input reverts.
  - **Escape.** Cancels the draft and clears the error.
  - **Arrows.** ArrowUp/ArrowDown commit ±`step`, or ±`fineStep` with Shift, clamped. Each press is one undo step.
- **Domain checks.** After the field accepts a value, the domain may still reject it (Inspector notice) or clamp it silently (shapes, room-resize side effects).

**NameInput.** A borderless title field, shown for sources and shapes only.

- Enter or blur commits the trimmed value.
- An empty or unchanged value reverts. Escape reverts.
- There is no length limit.

**MaterialSelect.** A native `<select>` listing every registered material by display name:

- Hard concrete (`concrete_hard`)
- Soft foliage (`soft_foliage`)
- Water-like surface (`water_like`)
- Medium wood (`wood_medium`)
- Acoustic treatment (`acoustic_treatment`)

Coefficients are defined in *Domain model* and *Classic acoustics*.

Source: src/components/workspace/NumericScrubField.tsx, src/components/workspace/ContextInspector.tsx:16-57, src/components/workspace/UnifiedWorkspace.tsx:405-413, src/domain/materials/registry.ts

### 6.8.3 Editable fields per entity

All numeric fields use NumericScrubField. "3D" in the Mode column means the field shows only in Hybrid. W, D and H are the current room width, depth and height. Defaults are creation defaults (§6.6) or the Concrete Partition preset values (room 12 × 8 × 3 m; Radio at (9, 4), −3 dB; Rain at (10, 1.5), −8 dB; listener at (3, 1.5, 4), heading 0°; Portal `partition_door` 1.2 m wide, 2.1 m high, open).

**Listener** (name and enabled state are not editable here; use the Enable/Disable button)

| Section | Label | Mode | Range | Step / fine | Unit | Effect / validation |
| --- | --- | --- | --- | --- | --- | --- |
| Placement | X position | both | 0 – W | 0.1 / 0.01 | m | `UPDATE_LISTENER` position. Scene validation rejects a position outside the room with a notice. |
| Placement | Y position | 3D | 0.1 – H | 0.1 / 0.01 | m | Height |
| Placement | Z position | both | 0 – D | 0.1 / 0.01 | m | |
| Placement | Heading | both | −360 – 360 | 1 / 0.1 | ° | `headingDeg`. Not visualised in either viewport (§6.9, §6.10). |

**Source**

| Section | Label | Mode | Range | Step / fine | Unit | Effect / validation |
| --- | --- | --- | --- | --- | --- | --- |
| Header | Source name | both | non-empty text | — | — | `UPDATE_SOURCE` name |
| Placement | X / Y / Z position | X, Z both; Y 3D | X 0–W, Y 0.1–H, Z 0–D | 0.1 / 0.01 | m | `MOVE_SOURCE`. Height is kept per source (default 1.5 m). |
| Acoustics | Source gain | both | −60 – 12 | 1 / 0.1 | dB | `UPDATE_SOURCE` gainDb |
| Acoustics | Loop (checkbox, aria "Loop source") | both | on/off | — | — | `UPDATE_SOURCE` loop |
| Acoustics | Audio (read-only row) | both | — | — | — | Shows the local file name, built-in label or raw clip ID. Shows "Relink required" (red) when the asset is missing. |
| Acoustics | Relink audio (file button) | both | WAV / MP3 / Ogg | — | — | Shown for local assets or missing assets. §6.11 |
| Acoustics | Remove local audio | both | — | — | — | Local assets only. Inline confirmation. §6.11 |

There is no control to change a source's clip after creation, to change the source type, or to mute or solo a source.

**Wall** (title is the ID; not renamable; kind boundary/partition not editable)

| Section | Label | Mode | Range | Step / fine | Unit | Effect / validation |
| --- | --- | --- | --- | --- | --- | --- |
| Shape · Endpoint A | Endpoint A X / Endpoint A Z | both | X 0–W, Z 0–D | 0.1 / 0.01 | m | Through `constrainWall3D`, then `REPLACE_PROJECT`. Failure shows a notice: "Walls must be at least 0.10 m long.", or a scene-validation message. |
| Shape · Endpoint B | Endpoint B X / Endpoint B Z | both | same | 0.1 / 0.01 | m | same |
| Shape | Thickness | both | 0.05 – 2 (domain allows 0.02 – 2) | 0.05 / 0.01 | m | "Wall thickness must be 0.02–2 m." |
| Shape | Bottom | 3D | 0 – H − 0.1 | 0.1 / 0.01 | m | "Wall vertical bounds must fit the room and leave at least 0.10 m height." |
| Shape | Top | 3D | 0.1 – H | 0.1 / 0.01 | m | same |
| Acoustics | Material | both | material list | — | — | `UPDATE_WALL` materialId |

**Portal** (title is the ID; `lossDb` and the 2D `heightM` are not editable)

| Section | Label | Mode | Range | Step / fine | Unit | Effect / validation |
| --- | --- | --- | --- | --- | --- | --- |
| Placement | Offset on Wall | both | width/2 – max(width/2, wallLength − width/2) | 0.1 / 0.01 | m | Distance of the centre from endpoint A along the host wall. Through `constrainPortal3D`. Shown only when the host wall exists. |
| Shape | Width | both | 0.4 – 8 | 0.1 / 0.01 | m | Through `constrainPortal3D`. "Portal must stay attached to its host wall." or a validation message |
| Shape | Bottom | 3D | 0 – H − 0.4 | 0.1 / 0.01 | m | Vertical opening |
| Shape | Top | 3D | 0.4 – H | 0.1 / 0.01 | m | |
| Shape | Thickness | both | 0.02 – 2 | 0.05 / 0.01 | m | "Portal thickness must be 0.02–2 m." Shown in Classic too. UNVERIFIED: whether Classic acoustics use it. |
| Acoustics | "Close Portal" / "Open Portal" button | both | toggle | — | — | `UPDATE_PORTAL` open |

**Box / Cylinder / Sphere**

| Section | Label | Kinds | Mode | Range | Step / fine | Unit | Effect / validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Header | Primitive name | all | both | non-empty text | — | — | `UPDATE_PRIMITIVE` name |
| Placement | X / Y / Z position | all | X, Z both; Y 3D | X 0–W, Y 0.1–H, Z 0–D | 0.1 / 0.01 | m | `UPDATE_PRIMITIVE`. The reducer then clamps the centre so the shape stays inside the room, silently. |
| Placement | Rotation Y | all | both | −360 – 360 | 1 / 0.1 | ° | Yaw |
| Shape | Width / Height / Depth | Box | both | 0.1 – W / H / D | 0.1 / 0.01 | m | Dimensions x / y / z (Height also shows in Classic) |
| Shape | Diameter | Cylinder | both | 0.1 – min(W, D) | 0.1 / 0.01 | m | Sets x = z |
| Shape | Height | Cylinder | both | 0.1 – H | 0.1 / 0.01 | m | |
| Shape | Diameter | Sphere | both | 0.1 – min(W, D, H) | 0.1 / 0.01 | m | Sets x = y = z |
| Acoustics | Material (aria "Primitive material") | all | both | material list | — | — | |

**Room** (Outliner "Room dimensions"; no Enable/Disable, no ⋯)

| Section | Label | Mode | Range | Step / fine | Unit | Effect / validation |
| --- | --- | --- | --- | --- | --- | --- |
| Shape | Width | both | 1 – 50 | 0.1 / 0.01 | m | Through `resizeRoomAndClamp`. Boundary walls follow the room. Partitions, sources and Portals are clamped. On success the notice "N object(s) were clamped to the resized room." appears. Rejection: "Room width/depth must be 1–50 m and height must be 2–12 m." |
| Shape | Depth | both | 1 – 50 | 0.1 / 0.01 | m | same |
| Shape | Height | 3D | 2 – 12 | 0.1 / 0.01 | m | same |
| Acoustics | Floor material (aria "Floor material") | both | material list | — | — | `SET_ROOM_3D` floorMaterialId |
| Acoustics | Ceiling material (aria "Ceiling material") | both | material list | — | — | `SET_ROOM_3D` ceilingMaterialId |

**Floor** (3D Outliner only; not toggleable; disabling it is refused with "The floor is required and cannot be disabled.")

| Section | Label | Range | Effect |
| --- | --- | --- | --- |
| Acoustics | Material (aria "Floor material") | material list | floorMaterialId |

**Ceiling** (3D Outliner only)

| Section | Label | Range | Effect |
| --- | --- | --- | --- |
| Header | Enable / Disable | toggle | Disabling turns the ceiling into an acoustic opening: `room3d.ceilingEnabled`, and the ID goes into `disabledEntityIds` |
| Acoustics | Material (aria "Ceiling material") | material list | ceilingMaterialId |

**Scene-level settings that have no UI.** The following can change only through preset, import or AI:

- `scene.name` (shown in the toolbar and the viewport header, but not editable)
- `settings.hrtfEnabled`
- `settings.acousticUpdateHz` (10–15)
- `settings.maxEarlyReflections`
- Portal `lossDb`
- Wall `kind`
- Listener names

Source: src/components/workspace/ContextInspector.tsx:124-251, src/domain/workspace/geometry-constraints.ts:32-228, src/domain/workspace/project-reducer.ts, src/domain/scene/types.ts:12-57, src/domain/scene/validate.ts, src/domain/presets/concrete-partition.ts

### 6.8.4 Nothing-selected summary

Selection becomes empty after a delete, a preset load or an import. No click or key clears it (see the UX critique).

| Section | Row | Value |
| --- | --- | --- |
| Room | Size | `W × D m` (2.5D) or `W × D × H m` (3D) |
| Room | Floor | Material display name |
| Room | Ceiling (3D) | Material display name |
| Room | RT60 (mid) | Mid-band RT60 of the accepted frame, `x.xx s`, or "—", with the suffix "approximation" |
| Room | Listening as | Active listener name |
| Objects | Listeners, Sources, Walls, Portals, Shapes | `n / limit` each, disabled entities included |
| Objects | Buttons | "Add listener", "Add source", "Add wall". These buttons are never disabled at limits, unlike the toolbar and Outliner. |
| Objects | Note | "Select an item in the Outliner or viewport to edit exact values." |

Source: src/components/workspace/ContextInspector.tsx:253-329, src/components/workspace/UnifiedWorkspace.tsx:510

## 6.9 Classic 2.5D canvas (SceneEditor)

### 6.9.1 Geometry and coordinate mapping

- The canvas is an SVG with viewBox 900 × 600, `preserveAspectRatio="xMidYMid meet"`, `role=group` and aria-label "{scene name} editable floor plan in meters".
- The room's bounding box is mapped into the inner rectangle (54, 36, 792 × 528). X and Z are scaled **independently**, so any room whose aspect is not 3:2 is drawn distorted. +Z points up the screen.
- Camera: `zoom` in [0.12, 6] and `panX`/`panY` in viewBox units, applied about the centre of that rectangle. Yaw and pitch are stored but ignored.
- The camera is saved per project in `view.camera` and restored on reload.
- Pointer positions are converted back to world coordinates and clamped to the room bounding box inset by 0.02 m.
- No snapping exists, either to a grid or to other geometry.

Source: src/components/workbench/SceneEditor.tsx:31-152, src/components/workspace/classic-viewport-math.ts, src/domain/editor/coordinates.ts:23-57

### 6.9.2 Drawn layers (bottom to top)

1. Canvas bed, then the room field. The room field is the wall-placement click target and shows a crosshair cursor while placing.
2. Wall placement marker "A": an amber circle, r 9.
3. Grid: lines every 0.5 m. Whole-metre lines are brighter. Axis labels show integer metres: "0 m", "1 m" … along the bottom (y = 586) and "0", "1" … on the left (x = 44). Label density does not adapt to zoom. Nothing is clipped to the room rectangle.
4. Wavefront signature: three rings (r 34, 74, 118) around the *overlay source*, which is the selected source or else the first enabled source. They pulse (3.2 s loop) only while audio plays and are static at 22 % opacity otherwise.
5. Shapes: footprint polygon (purple), with the name 14 units above the centre. Selected, hovered and focused shapes glow.
6. Walls: a 22-unit-wide invisible hit line plus the visible line.
   - Boundary walls are #809092, 5 px. Partitions are #6f8385, 4 px.
   - Walls that occlude the overlay source are red, 7 px.
   - Hovered and selected walls glow cyan.
   - The footprint walls generated for shapes are not drawn as walls.
   - The **selected** wall shows draggable endpoint handles (hit r 12, dot r 5).
7. Overlay for the overlay source's accepted frame (see *Classic acoustics*):
   - Route polyline: cyan-bright, dashed 8 6, 3 px.
   - Early reflections: source → reflection point(s) → listener. Order 1 is amber dotted. Order 2 is purple dashed.
   - "First portal route marker": a ring (r 9) on the last listener-facing Portal of the route.
8. Portals: a 20-unit-tall hit box along the host wall. The line is cyan dashed when open and red dotted when closed. Selection has `aria-pressed` but **no visual selected style**.
9. Sources: hit r 17, core r 10 (cyan outline, filled cyan when selected), a play-triangle glyph and the label "S{index} · {name}".
10. Listener: **only the active listener** is drawn. Hit r 19, amber core r 10, and a triangle fixed pointing up the screen that ignores `headingDeg`. The label is hard-coded "L · Listener". Selection has no visual style.
11. Legend (bottom-left, `aria-hidden`): "Source", "Listener", "Portal".

Disabled entities are not drawn and cannot be picked on the canvas. Only the Outliner reaches them.

Source: src/components/workbench/SceneEditor.tsx:264-643, src/app/globals.css:807-1160

### 6.9.3 Interactions

| Input | Target | Result |
| --- | --- | --- |
| Click | Wall line, Portal, source, listener, shape | Selects it. The listener maps to the active listener. |
| Pointer drag | Source, listener, shape | Selects, then moves on every pointer move: `MOVE_SOURCE`, `UPDATE_LISTENER` or `UPDATE_PRIMITIVE`. The height is kept. Each move is a **separate undo step**. |
| Pointer drag | Endpoint handle of the selected wall | Moves endpoint A or B (`UPDATE_WALL`). An invalid result (e.g. shorter than 0.1 m) is rejected with an Inspector notice. |
| — | Wall body, Portal | Cannot be dragged on the canvas. Use the Inspector. |
| Middle-button drag (anywhere) or Shift + left drag on empty space | Canvas | Pan |
| Wheel | Canvas | Zoom anchored at the pointer, `zoom × exp(−deltaY × 0.0015)`. The page does not scroll. |
| Click on the room field while placing a wall | Canvas | Places endpoint A or B (§6.6). A click that ends a pan is ignored. |
| Click on empty space | Canvas | Nothing. No deselection. |
| Tab | Sources, listener, shapes, walls, Portals, selected-wall endpoints | Focus. Each element is `role=button`, `tabIndex 0`. |
| Enter / Space | Any focused element | Selects it |
| Arrow keys | Focused source, listener, shape or endpoint | Selects it and moves it 0.1 m (Up = +Z, Right = +X). Walls and Portals only select. |
| Header: Home | Camera | Animates to zoom 1, pan 0 |
| Header: Frame All | Camera | Fits the room polygon, wall endpoints, Portal centres, sources and listener with 28 units of padding (shapes are not included) |
| Header: "?" | Help popover | Lists the gestures: "Drag a source, listener or shape — Move it on the floor plan"; "Drag a wall endpoint — Reshape the wall"; "Click a Portal — Select it; open or close it in the Inspector"; "Middle-drag or Shift-drag empty space — Pan"; "Wheel — Zoom at the pointer" |

There is no touch pinch or two-finger pan, no zoom buttons, no keyboard zoom or pan, no rotation handles, no resize handles, no multi-select, no rubber-band selection, no copy or duplicate, and no rulers or measurements.

Source: src/components/workbench/SceneEditor.tsx:154-262, 371-635, src/components/workspace/ClassicViewportAdapter.tsx:33-175, src/components/workspace/ViewportHelp.tsx

## 6.10 Hybrid 3D viewport

### 6.10.1 Camera model

- Orthographic projection (presentation only; never used by the solver).
  - Scale: 48 viewBox units per metre × zoom.
  - The screen centre (600, 360) maps to a **fixed** world pivot (6, 0, 4), regardless of room size.
- Camera fields:
  - `yawDeg`, wrapped to [0, 360)
  - `pitchDeg`, clamped to [−85, 85]
  - `zoom`, clamped to [0.12, 4]
  - `panX`, `panY`, in viewBox units
- The camera is saved per project and restored.
- Depth ordering uses the painter's algorithm: each panel is sorted by its average camera depth. Objects, handles, paths and labels always draw on top.
- Default project camera: yaw 38°, pitch 34°, zoom 1. "Home" goes to yaw −38°, pitch 34°, zoom 1, which differs from the default view.

| Preset button | Camera |
| --- | --- |
| Top | yaw 0, pitch 78, zoom 1, pan 0 |
| Front | yaw 0, pitch 28, zoom 1, pan 0 |
| Home | yaw −38, pitch 34, zoom 1, pan 0 |
| Frame All | Fits the room box corners, enabled listeners and sources, shape facet vertices, and wall and Portal extents with 56 units of padding. Yaw and pitch are kept. |

- Preset moves tween for 280 ms (cubic ease-in-out, yaw along the shortest arc). They commit **once** at the end.
- Reduced-motion users and keyboard-initiated presets get an instant change.
- Any direct orbit, pan or zoom interrupts a tween.

Source: src/components/lab/viewport-math.ts, src/components/lab/HybridSpatialViewport.tsx:293-332, src/hooks/useCameraTween.ts, src/components/workspace/HybridViewportAdapter.tsx:265-296, src/domain/workspace/defaults.ts:50

### 6.10.2 Header controls

| Label | Control | Default | Effect |
| --- | --- | --- | --- |
| (scene name) | Text | — | — |
| Top, Front, Home, Frame All | Buttons, group "Camera views" | — | See the table above |
| Paths | Toggle (`aria-pressed`), group "Overlays" | on | Shows or hides the path overlay and the arrival-direction line. Persisted in `view.overlays.pathsVisible`. |
| Show all paths | Toggle | off | Draws paths for every source instead of only the overlay source (the selected source or the first enabled one) |
| Ceiling | Toggle | on | Shows or hides the ceiling polygon and edges. While it is shown, paths use the "x-ray" style (72 % opacity, dashed). When the ceiling is acoustically disabled, the button shows as not pressed, and clicking it only flips the hidden preference. |
| ? | Help popover | — | "Drag an object — Move it in X and Z"; "Shift-drag an object — Change its height (Y)"; "Drag empty space — Orbit the camera"; "Middle-drag or Shift-drag empty space — Pan"; "Wheel — Zoom at the pointer"; "Compass — North is positive Z" |

Source: src/components/workspace/HybridViewportAdapter.tsx:79-86, 284-325

### 6.10.3 Drawn content

- **Room.** The floor polygon has a teal gradient and outline. Vertical room edges are drawn. The ceiling polygon and ceiling edges are faint dashed lines, shown when the Ceiling overlay is on.
- **Walls** (enabled only).
  - Each wall is drawn as two faces (±thickness/2), split around **open** Portals: above, below and beside each opening. End caps close each end.
  - Panels are grey: rgba(105,125,129,.82) with a #b0c0c0 stroke. A wall with no open Portal is slightly lighter.
  - A selected wall gets a #fff0dc 5 px stroke.
  - Clicking any panel selects the wall. Panels are not focusable.
- **Portals.**
  - The opening outline is cyan dashed and 7 px wide.
  - A square handle at the opening centre (hit r 30) has the label "Portal".
  - Closed Portals are outlined in the same way, and the wall is drawn solid across them.
- **Wall endpoints.** For the selected wall only: coral square handles (hit r 28) at floor level, labelled "A" and "B".
- **Shapes.** Faceted patches in translucent purple, with invisible hit panels on top. Selected, hovered and focused shapes glow.
- **Objects.**
  - Every **enabled** listener is drawn: amber head and shoulders. The label is the name, with " · Active" for the active listener. Hit r 34.
  - Every enabled source is drawn: cyan circle with a play glyph, labelled with its name.
  - No glyph shows the listener heading.
- **Labels.** One top label layer with a dark halo, placed greedily without overlaps.
  - Priority order: selected object 100 (required), listener 80, source 60, Portal 40 (90 when selected), selected-wall A/B 90 (required), shapes 30 (100 when selected).
  - Each label tries several candidate offsets. Labels that are not required are hidden when they collide.
  - The selected object also shows "X n.n · Y n.n · Z n.n".
  - The axis gizmo and the compass are obstacles for label placement.
  - Text sizes, in viewBox units: object 18, values, handles and shapes 15.
- **Axis gizmo** (bottom-left, centred at 94, 610). X is coral, Y amber, Z cyan; each arm is 42 units long, projected from the room centre.
- **Compass** (top-right, centred at 1090, 88). Circle r 42 with a needle pointing to +Z, an "N" above and "+Z north" below.
- **Legend** (`aria-hidden`): Listener (amber), Source (cyan), Portal (cyan ring), Wall (**coral** swatch, though walls render grey).
- **Hidden description.** `aria-describedby` text: "Amber marks the listener, cyan marks sources and Portals, coral marks walls. …"

Source: src/components/lab/HybridSpatialViewport.tsx:163-679, src/components/lab/viewport-labels.ts, src/app/globals.css:2162-2400

### 6.10.4 Interactions

| Input | Target | Result |
| --- | --- | --- |
| Pointer drag | Listener or source | Selects it. The object moves on the plane at its current height, clamped to X and Z in [0.2, W − 0.2] / [0.2, D − 0.2] and Y in [0.2, H], rounded to 0.1 m. One undo step per move. Selecting a non-active listener makes it active. |
| Shift + pointer drag | Listener or source | Changes the height: Δy = −Δscreen / (48 × zoom), clamped and rounded. Releasing Shift during the drag snaps the height back to its value at drag start. |
| Pointer drag | Shape | Moves in X and Z. Shift changes Y. The viewport does not round or clamp; the reducer clamps the shape into the room. |
| Pointer drag | Portal handle | Moves the Portal along its host wall at mid-opening height, through `constrainPortal3D`. Invalid positions are **ignored silently**. |
| Pointer drag | Endpoint handle of the selected wall | Moves the endpoint on the floor plane, through `constrainWall3D`. Invalid positions are ignored silently. |
| Click | Wall panel | Selects the wall |
| Left drag on empty space | Background | Orbit: yaw += 0.35° per viewBox unit horizontally, pitch −= 0.22° per unit vertically |
| Shift + left drag on empty space, or middle drag anywhere | Background | Pan (1:1 in viewBox units) |
| Wheel | Viewport | Zoom at the pointer (same factor as Classic) |
| Pointerdown on empty space while placing a wall | Floor plane | Places endpoint A or B (§6.6) |
| Hover or focus a reflection node | Path overlay | Shows the tooltip card (§6.10.5) |
| Tab | Objects, Portal handles, endpoint handles, shapes, reflection nodes, arrival line | Focus only. **No keyboard selection or movement exists in 3D.** |

Source: src/components/lab/HybridSpatialViewport.tsx:483-664, src/components/workspace/HybridViewportAdapter.tsx:227-281

### 6.10.5 Path overlay and arrival-direction label

The overlay draws only when a frame is accepted **and** its revision equals the current project revision. A pose-lagging frame produces no paths. Paths come from the accepted Hybrid frame and the six audible reflection taps (see *Hybrid 3D acoustics* and *Runtime/worker pipeline*).

| Path kind | Vertices | Style |
| --- | --- | --- |
| Direct | Source → listener | Cyan-bright, 4 px |
| Blocked | Source → listener | Red dashed 4 7 |
| Portal (audible route through a Portal) | Source → virtual position at the listener-facing Portal → listener | Cyan, 6 px |
| First-order reflection | Source → reflection point → listener | Amber dashed 9 8, 3 px. Node r 7. |
| Second-order reflection | Source → point 1 → point 2 → listener | Purple (#aa8ae8) dashed 4 6, 3.5 px. Node r 6. |

- **Reflection nodes.** Each node is focusable (`role=img`, `tabIndex 0`). Its aria-label reads "{First-order|Second-order} reflection; {surface} point {i}; {m} metres; {ms} milliseconds; {dB} decibels".
- **Tooltip.** On hover or focus a tooltip card appears with "1st order · {surface}" or "2nd order · {surfaceA → surfaceB}" and "{length} m · {excess delay} ms · {gain} dB".
- **Arrival line.** Under the SVG (shown when Paths is on; `role=note`, focusable). It reports the **selected or first enabled source**.

| State | Text |
| --- | --- |
| Pending (no current frame, including pose-lagging) | "Arrival direction pending · waiting for matching acoustic frame" |
| Empty | "Arrival direction unavailable · no enabled source in the accepted frame" |
| Ready | "Arrival · {name} · Direct\|Blocked line of sight · az {a.a}° · el {e.e}°", followed by " · audible route via Portal (not this direction)" when the audible route is a Portal route. A second line reads "World-aligned, listener to source; azimuth 0° = +Z (north), 90° = +X; not rotated by listener heading; geometric approximation." |

Source: src/components/workspace/HybridPathOverlay.tsx, src/components/workspace/HybridViewportAdapter.tsx:107-144, 315, 324

### 6.10.6 HybridPlanPositionEditor (dead UI)

- This component is a plan map and elevation map with 0.1 m snapping and keyboard arrows. It is hard-coded to a 12 × 8 m room, one listener and two sources named "Radio" and "Rain".
- No route, test or component imports it. The function does not survive in the live product.
- One idea is worth keeping: its separate elevation track (0.2–2.8 m) is a keyboard-operable way to set height. That is a model for accessible height editing.

Source: src/components/lab/HybridPlanPositionEditor.tsx, src/components/lab/partition-editing.ts

## 6.11 Audio UI

See *Audio engine* for what the engine does. These are the UI behaviours:

1. **Play.** Pressing Play sets the pending state ("Starting…").
   1. It calls `AudioEngine.start(activeScene)`. The AudioContext is created only from this user gesture.
   2. On success the button shows "Stop" and `data-playing="true"`, and the wavefront animation starts.
   3. On failure a red toast (`role=alert`) shows the error message with **Retry**. Retry runs the same toggle again. There is no dismiss.
   - Engine messages include:
     - "Audio can only start in a browser after a user gesture."
     - "Web Audio is not supported by this browser."
     - "Unable to load local audio asset ({status})."
     - "Unknown local audio asset: {id}"
     - "Audio asset {id} must decode as mono."
   - The fallback text is "Audio is unavailable."
2. **Stop.** Pressing Stop shows "Stopping…" and then "Play".
3. **Mode switch while playing.** Audio continues with the other project's scene. There is one persistent engine.
4. **Audible scene.** The audible scene is the Classic projection of the **active project**, minus every source whose clip is marked missing. Hybrid additionally applies its accepted direct and reflection states.
5. **Simulated / Raw.** These switch the engine mode instantly, at any time. The state is not persisted and starts as Simulated.
6. **HRTF / equal-power.** There is no UI control. The engine reads `scene.settings.hrtfEnabled`, which is true in every preset and can change only through import or AI.
7. **No other controls.** There is no master volume, output device choice, mute or solo, per-source preview or level meter.
8. **Per-source sound.** The sound is chosen once, when the source is created, in the audio picker.

   | Picker element | Behaviour |
   | --- | --- |
   | Header "Source audio" with × | Closes it. Escape also closes it. It does not close on an outside click. |
   | "Built-in" list | Radio loop, Rain loop, Voice loop, Water loop. The first one receives focus. |
   | "On this device" list | Files in the IndexedDB library, each with its size in MB (1 decimal) |
   | "Import WAV / MP3 / Ogg" (dashed file button, `accept="audio/wav,audio/mpeg,audio/ogg"`) | Stores the file, then creates the source with it. There is no progress indicator. Errors show in small amber text: "Choose a WAV, MP3, or Ogg audio file.", "Local audio files must be 25 MB or smaller.", "The local audio library is limited to 100 MB.", "This audio file could not be decoded by the browser.", "Local point-source audio must be mono.", or "Import failed." |
   | Storage warning line | "Local audio will last only for this tab.", "IndexedDB is unavailable. Local audio will last only for this tab." or "Local audio storage is unavailable." |
9. **Relink** (Inspector, local or missing sources).
   1. Press "Relink audio" and choose a file.
   2. The status reads "Relinking audio…".
   3. The file replaces the library record under the **same clip ID**. The metadata is updated and the missing flag is cleared.
   4. The status reads "Audio relinked.", or shows the error.
   - The source position and the rest of the project are unchanged.
10. **Remove local audio.**
    1. An inline confirmation card (`role=alert`) appears: "Remove local audio?" — "The Source stays in place and becomes silent until relinked. The audio file is deleted from this browser." It offers "Remove audio" (danger) and "Cancel".
    2. The status reads "Removing audio…" and then "Local audio removed.".
    3. The source shows "Relink required".
11. **Import with missing audio.** Assets not in the local library are flagged missing. Those sources stay silent and show "Relink required" until relinked.

Source: src/components/workspace/UnifiedWorkspace.tsx:76-124, 377-393, 449-455, 467, src/components/workspace/AudioAssetPicker.tsx, src/components/workspace/ContextInspector.tsx:214-243, src/hooks/useAudioEngine.ts, src/hooks/useLocalAudioLibrary.ts, src/domain/audio-assets/registry.ts, src/domain/audio-assets/local-library.ts, src/audio/AudioEngine.ts:30-50, 400-420

## 6.12 AI UI

See *Backend, AI, infrastructure and tests* for the routes, schemas, repair and rate limits. The UI always shows the AI controls. It cannot tell in advance whether AI is enabled. A disabled server answers with a message.

**Compile from prompt.**

1. Open the project menu and type a description (up to 2000 characters).
2. Press "Generate scene". The status reads "Generating…". The button stays enabled, so repeated clicks send concurrent requests.
3. The request carries the prompt, a base scene and the mode. The base scene is the Hybrid `SceneDocumentV2` in 3D or the Classic `SceneSpec` in 2.5D.
4. On success the client re-validates the candidate.
   - The status reads "Validated by {model}", plus " · repaired once" if the server repaired it.
   - The "Apply {scene name}" button appears. Server `warnings` are **not shown**.
5. On failure the status shows the server message, for example:
   - "AI scene generation is unavailable. Load a preset instead."
   - "Too many scene compile requests. Try again shortly."
   - "AI request capacity is busy. Try again shortly."
   - "The scene generator returned an invalid response. Keep editing manually or load a preset."

   `retryAfterMs` and `fallbackSceneId` are ignored.
6. Press "Apply …". This dispatches `REPLACE_SCENE` with the scene, `spatial3d` and primitives (undoable, no toast), clears the candidate and closes the menu.
   - The candidate and prompt persist while the menu is closed **and across mode switches**.

**Explain.**

1. Press "Explain selected acoustics". The client builds a deterministic snapshot of the selected source, or else the first source.
   - The snapshot always comes from the **Classic** projection and the Classic serial frame, even in 3D mode.
   - Fields: route type, effective distance, dry gain, low-pass Hz, Portal count, three-band RT60.
   - With no enabled source, nothing happens and no message appears.
2. The status reads "Explaining…".
3. On success the status reads "Explained by {model}", and the explanation block renders inline in the menu. On failure the server message shows (e.g. "AI explanations are unavailable. Keep editing manually.").

Source: src/components/workspace/WorkspaceProjectTools.tsx:27-146, src/ai/client.ts, src/app/api/scene/compile/route.ts:200-217, src/app/api/scene/explain/route.ts:197-213

## 6.13 Status bar

- The status bar is a `<footer aria-live="polite">`, 11 px mono, one line. It scrolls horizontally on narrow screens.

| Part | Content |
| --- | --- |
| Engine state (left) | A coloured dot and a label, titled "Acoustic engine". Healthy: "Worker" or "Worker × N" (cyan). Fallback: "Fallback" or "Fallback · {reason}" (amber), e.g. "Worker unavailable; using deterministic main-thread acoustic updates." or "Hybrid Worker pool unavailable; using deterministic serial fallback.". Otherwise "Stopped" (grey) or "Stopped · Waiting for matching acoustic frame". |
| Debug (left, `<details>`, hidden ≤850 px) | "{Classic 2.5D\|Hybrid 3D} · Rev {n} · Accepted {rev}/{seq} · Local {persistence status} · {x.xx ms\|No timing} · {N workers · shard max x.xx ms · shard total x.xx ms \| Pool metrics unavailable} · Interactive acoustic approximation" |
| Readout (right, group "Acoustic readout") | Active listener name (amber dot) · "Route {direct\|portal\|blocked\|none}" · "Gain {x.x dB\|—}" · "RT60 {x.xx s\|—}". Values are for the selected source, or else the first source. They come from the accepted frame only (see *Runtime/worker pipeline*). |

- The `data-*` attributes on the footer and the workspace (revision, sequence, compute time, worker count, AudioContext and graph counts) exist for tests.

Source: src/components/workspace/WorkspaceStatusBar.tsx, src/components/workspace/ClassicViewportAdapter.tsx:18-76, src/components/workspace/HybridViewportAdapter.tsx:48-77, 207-225, src/hooks/useAcousticFrame.ts:19, src/workers/hybrid-direct-pool.ts:105

## 6.14 Undo/redo, persistence, import/export and destructive actions

- **History.**
  - Each mode has its own history: at most 50 past and 50 future patches, persisted with the project (see *Domain model*).
  - Recorded: every project action except `SET_VIEW_STATE` (camera and overlays), `SET_LOCAL_AUDIO_METADATA`, `CLEAR_NOTICE`, and `SELECT_ENTITY` for anything other than a listener.
  - Notices from rejected actions and `SET_NOTICE` **are** recorded.
  - A numeric scrub drag is one step. Canvas drags record one step per pointer move.
  - Undo and redo work on the active mode only.
- **Undo toast.**
  - Shown for delete ("Deleted {name}", plus " and N Portal(s)" when a wall's hosted Portals cascade) and for reset ("Reset 2.5D project" / "Reset 3D project").
  - The toast offers "Undo" (cyan outline) and "×" (aria "Dismiss"). It hides after 8 s.
  - It also hides as soon as it is no longer the latest history step in its mode: a different depth or revision, a mode switch, or for deletes, the entity existing again.
  - A refused delete, such as the last listener, shows no toast; the refusal notice shows instead.
- **Persistence.**
  - localStorage keys: `echo-canvas:project:classic:v1`, `echo-canvas:project:hybrid:v1` and `echo-canvas:workspace-ui:v1` (mode).
  - Writes happen 2 s after the last change, immediately on mode switch, and on `pagehide`.
  - The status is "saved" or a warning string (table below). It is visible in the banner and in the Debug line.
- **Cache recovery.**
  - If a stored project cannot be read, a safe default loads and a "Project cache recovery" card appears: "A safe preset is loaded. Download the unread record before replacing it." with the button "Download unread cache".
  - The button saves `echo-canvas-{mode}-unread-cache.txt`.
  - The card has no dismiss.
  - The stored copy is overwritten by the next automatic save, about 2 s later; the downloadable copy exists only in memory for that tab (see Review findings).
- **Export and import.** See §6.5. Import is limited to the mode the file was exported from.
- **Clear all local data.** A fixed card (`role=alertdialog`, `aria-modal`) asks "Clear all local data?" — "This removes both local projects and every local audio file. It cannot be undone."
  - The **destructive "Confirm clear all" button receives autofocus.** The other button is "Cancel". Escape cancels.
  - On confirm, the IndexedDB library is emptied, both histories reset to defaults and the three keys are removed.

Source: src/domain/workspace/history.ts:153-218, src/hooks/useWorkspaceProjects.ts, src/domain/workspace/persistence.ts:14-16, 339-399, src/components/workspace/UnifiedWorkspace.tsx:26-41, 143-196, 248-257, 463-475

## 6.15 Keyboard shortcuts and pointer modifiers (complete)

| Keys / gesture | Scope | Action |
| --- | --- | --- |
| Ctrl/Cmd + Z | Global, including inside text fields (it overrides native text undo) | Undo (active mode) |
| Ctrl/Cmd + Shift + Z | Global | Redo. Ctrl+Y is not supported. |
| Delete or Backspace (no modifiers) | When focus is on `<body>`, in the Outliner or in the viewport panel, and not in an editable field | Delete the selection, with an Undo toast |
| Escape | Global, first match wins | Close the Add menu → the audio picker → the clear-all confirmation → the project menu (focus returns to its trigger) → cancel wall placement → close the mobile drawer |
| Escape | Help popover, ⋯ panel, Outliner geometry menu (capture phase, stops propagation) | Close it and return focus to its trigger |
| Enter / Escape | Numeric input | Commit / cancel the draft. Escape also reaches the global handler. |
| ↑ / ↓ (+ Shift) | Numeric input | ±step (±fine step) |
| Enter / Escape | Name input | Commit / revert |
| Tab, then Enter or Space | Classic canvas elements | Select |
| Arrow keys | Focused Classic source, listener, shape or selected-wall endpoint | Move 0.1 m |
| Drag on the label + Shift / Ctrl | Numeric field label | Fine step / snap to step |
| Middle drag, or Shift + drag on empty space | Both viewports | Pan |
| Drag on empty space | 3D | Orbit |
| Shift + drag on an object | 3D | Change height |
| Wheel | Both viewports | Zoom at the pointer |

A keydown without modifiers sets `html[data-input="keyboard"]` and a pointerdown sets `"pointer"`. Popovers then open without animation and camera presets apply instantly after keyboard input.

Source: src/components/workspace/UnifiedWorkspace.tsx:128-141, 198-235, src/components/workspace/NumericScrubField.tsx:67-87, src/components/workbench/SceneEditor.tsx:225-262, src/components/workspace/ViewportHelp.tsx, src/components/workspace/ContextInspector.tsx:105-122, src/components/workspace/SceneOutliner.tsx:118-136

## 6.16 Empty, loading, error and limit states; notification catalogue

| State | Where | Presentation |
| --- | --- | --- |
| Before hydration | Whole page | Empty dark `<main>` with no content |
| No selection | Inspector | Scene summary (§6.8.4) |
| No sources | Classic canvas | No overlay and no wavefront. Readout "Route none", "Gain —". |
| No sources | 3D arrival line | "Arrival direction unavailable · no enabled source in the accepted frame" |
| Acoustics starting or waiting | Status bar / 3D | "Stopped", or "Stopped · Waiting for matching acoustic frame". The 3D overlay is hidden and the arrival line is pending. |
| Worker failure | Status bar | Amber "Fallback · {reason}". Authoring continues (see *Runtime/worker pipeline*). |
| Limit reached | Add menu, Outliner "＋", Outliner counts, Inspector summary counts | Disabled item with "Limit: …" (Add menu text, Outliner title only). The Inspector summary buttons stay enabled and fall back to a reducer notice. |
| Missing audio | Inspector source | "Relink required" (red). The source is silent. |

**Notices** show in the Inspector's bottom card (`role=status`, × "Dismiss notice"). Most successful actions clear them.

- Limits: "A project can contain at most eight listeners." / "… at most four point sources." / "… at most 100 Walls." / "… at most eight Portals." / "… at most 8 basic shapes."
- Rules: "At least one listener must remain enabled.", "The floor is required and cannot be disabled.", "Select an enabled Wall before adding a Portal.", "Wall endpoints must be at least 0.1 m apart."
- Missing entities: "Listener not found.", "Enabled listener not found.", "Basic shape not found.", "The selected object no longer exists.", "Scene replacement failed validation."
- Geometry constraints (§6.8.3) and the success notice "N object(s) were clamped to the resized room."
- First scene-validation error, for example:
  - "Source position must be inside the room"
  - "Listener position must be inside the room"
  - "Wall length must be at least 0.1 m"
  - "Portal must lie on and fit within its referenced wall"
  - "Portal height must not exceed room height"
  - "Room width and height must not exceed 50 m"
  - "Duplicate entity ID: …"
  - "Unknown material ID: …"

**Banners** are fixed at the top centre and have no dismiss. Their title is "Memory-only warning". The message is the audio-library warning if there is one, otherwise the project status:

- "Local persistence is unavailable."
- "This project could not be saved locally."
- "This project cache could not be restored. A safe default was loaded."
- "A previous scene document was migrated to the current authoring format."
- The audio warnings from §6.11.

The recovery card is in §6.14.

**Toasts** sit at the bottom centre: the undo toast (§6.14) and the audio error with Retry (§6.11).

**Inline statuses** appear in three places:

- The project-menu status line (import, AI).
- Numeric field errors.
- Relink and remove statuses in the Inspector.

**Placement card:** "Add Wall · Choose endpoint A|B" with Cancel. It stays visible even after a mode switch, though clicks then do nothing.

Source: src/domain/workspace/project-reducer.ts, src/domain/workspace/geometry-constraints.ts, src/domain/scene/validate.ts, src/domain/workspace/persistence.ts, src/components/workspace/ContextInspector.tsx:330, src/components/workspace/UnifiedWorkspace.tsx:463-476

## 6.17 Design tokens

**Theme.** Dark only (`color-scheme: dark`). There is no light theme, no `prefers-color-scheme` handling and no high-contrast mode. The body background is a radial teal glow, rgba(75,132,137,.2) at 18 % / −20 %, over `--base`.

**Colour tokens (`:root`)**

| Token | Hex | Use |
| --- | --- | --- |
| `--base` | #0b1113 | Page background, focus-ring gap, label halo |
| `--canvas` | #0e171a | Classic canvas bed |
| `--surface-0` | #060d0f | Viewport well, segmented-control track |
| `--surface-1` | #071013 | Toolbar, status bar, workspace |
| `--surface-2` | #0d181c | Outliner, Inspector, popovers |
| `--surface-3` | #122126 | Toast, hover fills |
| `--surface-field` | #091316 | Field backgrounds |
| `--rule` = `--border-strong` | #304247 | Panel borders |
| `--rule-soft` = `--border-subtle` | #233237 | Dividers |
| `--border-field` | #26383d | Field borders |
| `--border-popover` | #3c5e64 | Popover borders |
| `--ink` = `--text-1` | #eef4f2 | Primary text |
| `--ink-soft` = `--text-2` | #c4d0ce | Secondary text |
| `--muted` = `--text-3` | #829694 | Labels, micro text |
| `--signal` | #67cdd3 | Sources, Portals, selection, primary button, Z axis |
| `--signal-bright` | #a1f2f0 | Pressed text, route overlay, direct path |
| `--listener` | #e7ad5e | Listener, Y axis, first-order reflections, badges |
| `--danger` = `--kind-wall` | #e77f71 | Danger borders, occluders, blocked path, closed Portal, wall kind, X axis |
| `--danger-ink` | #ffb4aa | Danger text |
| `--danger-surface` | #361c1c | Field error background |
| `--kind-primitive` | #a996d8 | Shapes |
| `--kind-surface` | #738489 | Room and surfaces |
| `--focus` | #c4fbf7 | Focus ring |
| `--panel`, `--panel-raised`, `--panel-deep` | #151f22, #192529, #10181b | Legacy pages only (deep also used by the dead plan editor) |

**Hard-coded colours.**

- Selected and pressed fill: rgba(103,205,211,.14). Outliner selection: rgba(103,205,211,.1) with a 2 px inset bar. Row hover: rgba(255,255,255,.035). Menu-item hover: rgba(103,205,211,.08).
- Second-order reflections: #aa8ae8.
- Classic walls: #809092 and #6f8385.
- Hybrid wall panels: rgba(105,125,129,.82), stroke #b0c0c0. Selected stroke: #fff0dc.
- Source core fill: #173539.
- Wall placement marker: #f2b84b (fallback for the undefined `--accent-amber`), text #ffe6a8.
- Cards:
  - Placement: rgba(15,27,33,.96), border rgba(242,184,75,.62).
  - Confirm and notice: rgba(20,34,41,.98), border rgba(241,155,118,.5).
  - Audio error: rgba(41,22,22,.97).
  - Persistence and recovery banners: rgba(35,29,22,.97), border rgba(255,190,90,.55), text #f7ddb0.
  - Reflection tooltip: rgba(13,25,31,.96), border rgba(242,184,75,.65), text #f6f0df, radius 6 px.

**Typography.**

- No web fonts are loaded.
- `--grotesk`: "Aptos", "Segoe UI Variable", "Segoe UI", Arial, sans-serif. Used for UI text.
- `--mono`: "Cascadia Mono", "SFMono-Regular", Consolas, monospace. Used for numbers, units, IDs, the status bar and SVG labels.
- Scale: `--text-xs` 0.6875rem (11 px, documented minimum), `--text-sm` 0.75rem (12 px), `--text-md` 0.8125rem (13 px, base, line-height 1.4), `--text-lg` 0.9375rem (15 px, titles).
- Weights 500 and 600; SVG axis labels 700.
- Micro headings (group labels, section headings, project-menu headings) are uppercase with 0.06em letter-spacing.
- Inputs and the status bar use tabular numerals.
- SVG text sizes are in viewBox units: Classic 11–14, Hybrid 14–18.
- Hybrid label layout assumes a monospace advance width of 0.62em.

**Spacing, radii, shadows.**

- There is no spacing scale. Ad hoc rem values run from 0.12 to 1rem. Common ones: panel padding 0.75rem, field gap 0.32rem, control padding 0.38 × 0.65rem.
- Radius: `--radius` 3px everywhere. Circles for dots and the help button. Tooltip 6px.
- Shadows:
  - Popovers: `0 18px 60px rgba(0,0,0,.5)`.
  - Toast: `0 12px 32px rgba(0,0,0,.4)`.
  - Error and banners: `0 12px 32px rgba(0,0,0,.32)`.
  - Focus ring: `0 0 0 2px var(--base), 0 0 0 4px var(--focus)`.
  - SVG glow filters: Gaussian blur 4 (Classic) and 6 (Hybrid).

**Motion.**

- Easing tokens:
  - `--ease-out` cubic-bezier(0.23, 1, 0.32, 1)
  - `--ease-in-out` (0.77, 0, 0.175, 1)
  - `--ease-drawer` (0.32, 0.72, 0, 1), defined but unused
- Durations and transforms:
  - Press: 120 ms, scale 0.97.
  - Popover: enter 160 ms, exit 120 ms, scale 0.96, using `@starting-style`.
  - Toast: 200 ms, 8 px rise.
  - Mode indicator: 200 ms.
  - Viewport fade-in on mode switch: 150 ms.
  - Camera tween: 280 ms.
  - Wavefront: 3.2 s loop.
- `prefers-reduced-motion`: scale, translate and movement are neutralised, fades stay, the wavefront becomes static and camera presets apply instantly.

**Breakpoints.**

- ≤ 850 px: drawer layout (§6.3).
- ≤ 34rem: Hybrid coordinate label hidden.
- The other breakpoints in the file (74rem, 50rem, 70rem) belong to legacy styles that no component uses.

Source: src/app/globals.css:5-17, 106, 220-232, 297-379, 381-476, 807-1160, 1669-1685, 2162-2400

## 6.18 Accessibility (current)

- **Landmarks.**
  - `<main>` (named only while loading), toolbar `<header>`, two named `<aside>`s, the viewport `<section>` (unnamed) and the status-bar `<footer aria-live=polite>`.
  - No `<h1>` and no skip link. The Inspector title is an `<h2>` and sections are `<h3>`.
- **Toggles and groups.** Toggles use `aria-pressed`. Toolbar groups use `role=group` with labels.
- **Popovers.**
  - The project menu is `role=dialog` (not modal). The Add menu and audio picker are `role=dialog aria-modal=true` without a focus trap; their first item is autofocused.
  - The clear-all card is `role=alertdialog` with the destructive button autofocused.
  - Mobile drawers become `role=dialog aria-modal`, with no focus move or trap.
- **Fields.**
  - Every numeric field has an input labelled with the full field name, `aria-invalid` and a `role=alert` error.
  - The extra "Drag to adjust …" button is focusable but inert from the keyboard.
- **Canvas.**
  - Classic elements are focusable and keyboard-operable (select, nudge 0.1 m), with custom `:focus-visible` styles. The box-shadow focus ring does not render on SVG elements.
  - Hybrid elements are focusable but not keyboard-operable. Walls are not focusable.
  - Hybrid objects carry their coordinates in their accessible names.
  - Hybrid has an `aria-describedby` description. Its colour description is partly wrong (walls).
- **Colour reliance.** Legends are `aria-hidden`. Route kinds are distinguished by colour and dash only.
- **Contrast.** Computed with WCAG 2.x relative luminance:

  | Pair | Ratio |
  | --- | --- |
  | `--text-1` on `--surface-2` | 16.2 |
  | `--text-2` on `--surface-2` | 11.4 |
  | `--text-3` on `--surface-2` | 5.8 |
  | `--signal` on `--surface-2` | 9.7 |
  | `--listener` on `--surface-2` | 9.1 |
  | Play text on `--signal` | 9.7 |
  | Field border `--border-field` on `--surface-2` | **1.47** (non-text minimum is 3:1) |
  | `--border-strong` on `--surface-2` | **1.71** |
  | Disabled text at 40 % opacity | ~1.95 |

- **Motion.** Reduced motion is honoured (§6.17).

Source: src/components/**/*.tsx (aria attributes as cited above), src/app/globals.css:459-472, 1669-1685

---

## UX critique

| # | Area | Problem | Evidence | Sev. | Direction |
| --- | --- | --- | --- | --- | --- |
| 1 | IA | Selecting a listener silently changes the audible receiver. Selection and activation are one action, and the toggle is undoable history. | project-reducer.ts:99-112; SceneOutliner.tsx:20; ContextInspector.tsx:295 | High | Separate "select" from an explicit "Listen from here" control. |
| 2 | Discoverability | No way to deselect: clicking empty canvas and pressing Escape do nothing. The scene summary (RT60, counts, quick add) is practically unreachable. | SceneEditor.tsx:299-313; HybridSpatialViewport.tsx:522-539; no `selection: null` dispatch in src/components | High | Click on empty space or Escape clears the selection; always show a scene panel. |
| 3 | Error recovery | A canvas drag records one undo step per pointer move. One drag can fill the whole 50-step history, and Undo steps back a few pixels at a time. Only the numeric scrub is coalesced. | history.ts:200-203; SceneEditor.tsx:198-216; HybridSpatialViewport.tsx:560-591; UnifiedWorkspace.tsx:405-413 | High | One history transaction per gesture. |
| 4 | Feedback | Domain rejections appear only at the bottom of the Inspector. They are invisible on narrow screens (drawer closed), can sit below the fold, and Hybrid drags that break constraints fail silently. | ContextInspector.tsx:330; globals.css:368-373; HybridViewportAdapter.tsx:249-250, 262 | High | Inline validation at the control or cursor, plus a global notification area. |
| 5 | Accessibility | The 3D viewport is pointer-only. Elements take focus but have no key handling, and walls cannot be focused. | HybridSpatialViewport.tsx:172-185, 617-664 | High | Keyboard select, nudge and height in 3D, matching Classic. |
| 6 | Visual hierarchy | The Classic canvas scales X and Z independently, so rooms whose aspect is not 3:2 (e.g. 20 × 8 m) draw distorted. That is misleading in a geometry editor. | coordinates.ts:23-39; classic-viewport-math.ts:8 | High | Use uniform scaling with a world-space camera. |
| 7 | IA | Project, file, AI and destructive actions all sit in a dropdown on the scene name. AI explanations render inside that menu, away from the source they describe. | WorkspaceToolbar.tsx:44-56; WorkspaceProjectTools.tsx:101-157 | Med | A File menu, plus a dockable AI and analysis panel. |
| 8 | IA | Two independent mode projects with no hint that edits do not carry over. The URL does not follow the mode. | useWorkspaceProjects.ts:105-110; UnifiedWorkspace.tsx:421 | Med | Present the modes as separate documents or tabs, and offer explicit copy or convert. |
| 9 | IA / density | The Geometry group is one flat list: walls, Portals and shapes mixed, Portals not under their host walls, boundary walls looking like partitions, names that are revision IDs ("wall 57"). There is no search or collapse, which matters at 100 walls. | SceneOutliner.tsx:212-220; UnifiedWorkspace.tsx:340 | Med | A hierarchical tree with rename, filter and kind sub-groups. |
| 10 | IA | Scene settings (HRTF, update rate, max early reflections), Portal loss, wall kind, listener names, scene name and a source's clip cannot be edited. | scene/types.ts:53-57; ContextInspector.tsx:270-272; types.ts:136-139 | Med | Scene settings panel and full entity property sets. |
| 11 | Discoverability | Gestures live only in a "?" popover. Shift means pan on empty space but height on objects. There are no zoom buttons and no touch pinch. | ClassicViewportAdapter.tsx:33-39; HybridViewportAdapter.tsx:79-86; HybridSpatialViewport.tsx:522-571 | Med | Visible tool modes, on-canvas zoom controls, touch gestures. |
| 12 | Feedback | Listener heading is drawn nowhere: the Classic triangle is fixed and the 3D glyph has no direction. Classic draws only the active listener, under a hard-coded label. | SceneEditor.tsx:601-633; HybridSpatialViewport.tsx:662 | Med | Rotate the glyph by heading, offer a drag-to-rotate handle, draw every listener consistently. |
| 13 | Feedback | Classic selected listener and selected Portal have no selected style. | SceneEditor.tsx:528-563, 601-631; globals.css (no `.listener-marker.is-selected` or Portal selected rule) | Med | One selection treatment for every entity. |
| 14 | Feedback | The 3D path overlay vanishes whenever the frame lags its pose (typical during drags), while Classic keeps showing lagging paths. | HybridPathOverlay.tsx:34; HybridViewportAdapter.tsx:315; ClassicViewportAdapter.tsx:51-57 | Med | Show lagging overlays dimmed, the same way in both modes. |
| 15 | Feedback | The legends are incomplete (no route, reflection, occluder, closed-Portal or shape keys) and the 3D "Wall" swatch is coral while walls render grey. | SceneEditor.tsx:637-641; HybridSpatialViewport.tsx:596-600, 671-676; globals.css:161, 2269-2276 | Med | A complete legend generated from the same tokens. |
| 16 | Consistency | Terms clash: the status bar's "Stopped" means acoustics, the toolbar's Stop means audio. | WorkspaceStatusBar.tsx:34, 59; WorkspaceToolbar.tsx:36-38 | Med | Name the acoustic engine state separately, e.g. "Acoustics: waiting". |
| 17 | Consistency | Position limits differ by path: Classic drag inset 0.02 m, 3D drag 0.2 m with 0.1 m rounding, Inspector min 0 (Y 0.1), shape drags unrounded. Wall thickness minimum is 0.05 in the UI but 0.02 in the domain. | SceneEditor.tsx:143-147; HybridSpatialViewport.tsx:152-157, 567-580; ContextInspector.tsx:153-155, 190; geometry-constraints.ts:137 | Med | One constraint source used by every input path. |
| 18 | Consistency | Capabilities differ by mode: Portals drag only in 3D, keyboard editing works only in 2.5D, and 3D Home (yaw −38°) differs from the initial view (yaw 38°). | SceneEditor.tsx:528-563; HybridSpatialViewport.tsx:644; defaults.ts:50; viewport-math.ts:15-21 | Med | Same manipulation set in both views. |
| 19 | Error recovery | Room scrubbing is destructive: shrinking and then growing the room in one drag leaves walls and sources clamped. | ContextInspector.tsx:205-207; geometry-constraints.ts:32-90 | Med | Recompute from the gesture's starting state. |
| 20 | Error recovery | The recovery card promises a download "before replacing", but the unread cache is overwritten about 2 s after load. | UnifiedWorkspace.tsx:464; useWorkspaceProjects.ts:92-97; persistence.ts:369-376 | Med | Quarantine the unread file until the user decides. |
| 21 | Error recovery | "Reset … project…" acts without confirmation despite its ellipsis, and Clear-all autofocuses the destructive button. | WorkspaceProjectTools.tsx:151; UnifiedWorkspace.tsx:465 | Med | Confirm reset or drop the ellipsis; focus Cancel by default. |
| 22 | Accessibility | Dialogs claim `aria-modal` but neither trap nor return focus. Mobile drawers do not move focus. | AddObjectMenu.tsx:32; AudioAssetPicker.tsx:17; SceneOutliner.tsx:155; ContextInspector.tsx:265; UnifiedWorkspace.tsx:198-218 | Med | Real modal focus management, or make them non-modal. |
| 23 | Accessibility | The status-bar footer is `aria-live=polite` and changes on every frame (timings), which floods screen readers. | WorkspaceStatusBar.tsx:49-60 | Med | Announce only route or state changes, on demand. |
| 24 | Accessibility | Tab-stop bloat: an inert "Drag to adjust" button per numeric field, and a row button plus toggle per Outliner entity (over 200 stops at 100 walls), with no roving focus. | NumericScrubField.tsx:114; SceneOutliner.tsx:48-76 | Med | Roving tabindex or tree pattern; take the scrub handle out of the tab order. |
| 25 | Accessibility | Ctrl/Cmd+Z is captured even inside text inputs, which breaks native text undo. | UnifiedWorkspace.tsx:226-231 | Med | Leave undo to editable targets. |
| 26 | Density / contrast | Very small type (11–13 px), field borders at 1.47:1 and panel borders at 1.71:1, against the 3:1 non-text minimum. | globals.css:7, 212, 221, 235, 406-409 | Med | Larger base size; field boundaries at 3:1 or more. |
| 27 | Visual hierarchy | Colours are overloaded. Coral means walls, X axis, occluders, blocked paths, closed Portals and danger. Amber means listener, Y axis, reflections and warnings. Cyan means sources, Portals, Z axis, selection, primary and focus. | globals.css:393-417, 1030-1100, 2380-2393 | Med | Give entity, state and axis their own colour channels. |
| 28 | Visual hierarchy | The 3D pivot is fixed at (6, 4), so large or offset rooms orbit off-centre and exceed the view at zoom 1. Classic axis labels are integer metres regardless of zoom and are not clipped. | viewport-math.ts:51-53; SceneEditor.tsx:320-358 | Low | Orbit about the room centre; adaptive and clipped rulers. |
| 29 | Feedback | AI states are thin. Buttons stay active while pending, warnings, retry-after and fallback are not shown, and Explain does nothing silently without a source. In 3D, Explain describes Classic acoustics. | WorkspaceProjectTools.tsx:60-99, 132-143 | Low | Pending, cancel and error states; mode-correct snapshots. |
| 30 | Consistency | Popover dismissal varies. Add and the audio picker ignore outside clicks and do not return focus; the project menu, help and ⋯ do both. Add and the project menu can be open together. Import keeps the menu open, Preset and Apply close it. | UnifiedWorkspace.tsx:198-246; ViewportHelp.tsx:17-34; WorkspaceProjectTools.tsx:44-58, 108-109, 141 | Low | One popover behaviour for all. |
| 31 | Consistency | The Inspector summary's Add buttons ignore limits while the toolbar and Outliner disable at limits. Disabled-reason text is title-only in the Outliner. | ContextInspector.tsx:319-325; SceneOutliner.tsx:100-102 | Low | Shared availability everywhere, with the reason visible. |
| 32 | Feedback | Audio error has Retry but no dismiss. The audio picker shows no import progress. Banners cannot be dismissed, and "Memory-only warning" also labels a migration message. | UnifiedWorkspace.tsx:463-467; AudioAssetPicker.tsx:23-28 | Low | Dismissible, typed notifications with progress. |
| 33 | Perceived performance | Scrub sensitivity is 1 step per pixel (1 dB/px on gain, 0.1 m/px on room size), which overshoots easily. | NumericScrubField.tsx:37-42 | Low | Lower the default rate and add acceleration. |
| 34 | Perceived performance | Every drag move runs the full reducer, a deep-clone history patch and, for 3D walls and Portals, a constraint-validated `REPLACE_PROJECT`. A blank screen shows until hydration. UNVERIFIED as visible jank (the E2E budgets pass). | history.ts:152-168; HybridViewportAdapter.tsx:240-263; UnifiedWorkspace.tsx:395 | Low | Keep transient drag state outside history and persistence; show a skeleton at start-up. |

## Review findings

"Verified" means confirmed by reading the code or by grep. "Suspected" means the runtime effect was not observed.

| # | Finding | Evidence | Status |
| --- | --- | --- | --- |
| R1 | `HybridPlanPositionEditor` is dead UI: nothing imports it. It is hard-coded to a 12 × 8 m room with "Radio"/"Rain". `partition-editing.ts` is used only by it and one unit test. Its `.hybrid-plan-*` CSS is dead. | src/components/lab/HybridPlanPositionEditor.tsx; grep | Verified |
| R2 | About 85 of 319 class selectors in globals.css are unused (legacy workbench and lab styles such as `.app-shell`, `.workstation`, `.masthead`, `.diagnostic-strip`, `.transport-panel`, `.hybrid-workbench-grid`, `.text-field`, `.source-listener-line`). Dynamically built names (`is-worker`, `kind-*`, `order-2`, `wall-partition`) were excluded. | grep of globals.css classes against src/**/*.ts(x) | Verified |
| R3 | `ClassicViewportAdapter.adapt` handles editor actions that `SceneEditor` never dispatches (ADD_WALL, DELETE_WALL, SET_WALL_MATERIAL, TOGGLE_PORTAL, REPLACE_SCENE, LOAD_PRESET, SET_MODE, SET_AUDIO_STATUS). | ClassicViewportAdapter.tsx:129-142; SceneEditor.tsx dispatches only SELECT_OBJECT, MOVE_LISTENER, MOVE_SOURCE, MOVE_WALL_ENDPOINT | Verified |
| R4 | The reducer supports `SET_ACTIVE_LISTENER`, `RELINK_SOURCE` and `UPDATE_LISTENER.name`, but no UI dispatches them. `view.panels.outlinerCollapsed`/`inspectorCollapsed` are persisted but never read. | types.ts:134-139; defaults.ts:52; persistence.ts:45-46; grep | Verified |
| R5 | The Inspector doc comment names a "Notes" section that does not exist. | ContextInspector.tsx:59-63 | Verified |
| R6 | The wall placement card stays visible after a mode switch, but clicks no longer place points, because the viewport receives no handler on a mode mismatch. | UnifiedWorkspace.tsx:476 vs 490, 498 | Verified (code) |
| R7 | The preset select shows "Concrete Partition" for any scene whose name matches no preset. Picking Concrete Partition then fires no `change`, so that preset cannot be loaded from the select in that state. | WorkspaceProjectTools.tsx:107-112 | Verified (code and DOM semantics) |
| R8 | Rejected actions record their notice as an undo step (notices are part of the project and `SET_NOTICE` is not excluded). Undo after a rejection only clears the notice. | history.ts:200-203; project-reducer.ts:25-27 | Verified (code) |
| R9 | Canvas drags create one history entry per pointer move. | history.ts:153-168; SceneEditor.tsx:198-216 | Verified |
| R10 | 3D Shift-drag height snaps back when Shift is released mid-drag. The non-Shift branch unprojects at the drag-start height. | HybridSpatialViewport.tsx:563-565 | Verified (code) |
| R11 | When the ceiling is disabled, the 3D "Ceiling" overlay button shows as unpressed, and clicking it flips a hidden preference with no visible effect. | HybridViewportAdapter.tsx:301 | Verified |
| R12 | The default 3D camera yaw is 38° while Home is −38°. | defaults.ts:50; viewport-math.ts:15-21 | Verified |
| R13 | The 3D projection pivot is hard-coded to (6, 0, 4). | viewport-math.ts:51-53 | Verified |
| R14 | The Classic world-to-SVG mapping is non-uniform for rooms whose aspect is not 3:2. | coordinates.ts:23-39; classic-viewport-math.ts:8 | Verified (code); visual effect not observed |
| R15 | `--accent-amber` and `--font-mono` are undefined; their fallbacks are used. `--ease-drawer` is defined but unused. | globals.css:843, 2394, 426 | Verified |
| R16 | The numeric error text prints unformatted computed bounds (e.g. a Portal offset maximum with many decimals). | NumericScrubField.tsx:119; ContextInspector.tsx:159 | Verified (formatting); example suspected |
| R17 | The import status reads "N audio asset requires relinking" for N > 1. | WorkspaceProjectTools.tsx:52-54 | Verified |
| R18 | Explain always uses the Classic projection and serial frame, even in 3D. | WorkspaceProjectTools.tsx:72-78 | Verified |
| R19 | Generate and Explain have no in-flight guard, so concurrent requests race over `status` and `candidate`. | WorkspaceProjectTools.tsx:60-99, 132 | Verified (code); race outcome suspected |
| R20 | The AI candidate and prompt survive a mode switch, so a candidate compiled for one mode can be applied to the other (the reducer drops or defaults `spatial3d`). | WorkspaceProjectTools.tsx:28, 133-142; project-reducer.ts:457 | Verified (state); acoustic effect suspected |
| R21 | The audio picker's file input is never reset, so choosing the same file again after an error does not fire. The Inspector relink input is reset. | AudioAssetPicker.tsx:23-27 vs ContextInspector.tsx:229 | Verified |
| R22 | Escape in a numeric input also reaches the global handler and closes an open drawer or popover. | NumericScrubField.tsx:73-79; UnifiedWorkspace.tsx:199-218 | Verified (code) |
| R23 | Ctrl/Cmd+Z is intercepted inside text fields. | UnifiedWorkspace.tsx:226-231 | Verified |
| R24 | The unread cache is overwritten in storage by the debounced save about 2 s after load. | useWorkspaceProjects.ts:92-97; persistence.ts:369-376, 380-399 | Verified (code) |
| R25 | Banner precedence `audioLibrary.warning ?? persistenceStatus` hides a project-save failure when an audio warning also exists. | UnifiedWorkspace.tsx:463 | Verified |
| R26 | Wall availability counts only authored walls, while Classic shape footprints add projected walls. Whether the projected scene can exceed 100 walls is UNVERIFIED. | entities.ts:30; projections.ts:66-73 | Suspected |
| R27 | In Classic mode the Inspector shows Portal "Thickness", Box "Height" and Ceiling material. Whether these change Classic acoustics is UNVERIFIED. | ContextInspector.tsx:175, 202, 249 | Suspected |
| R28 | Production code installs test hooks: `window.__echoCanvasRenderGateCValidation` on mount, and honours `window.__echoCanvasSimulateStorageFailure`. | UnifiedWorkspace.tsx:126; gate-c-render-validation.ts:160-170; useWorkspaceProjects.ts:35 | Verified |
| R29 | The Add button and mobile toggles lack `aria-haspopup`/`aria-expanded`. The arrival line is a focusable `role=note` with inline styles instead of tokens or classes. | WorkspaceToolbar.tsx:64-68; HybridPathOverlay.tsx:187-198 | Verified |
| R30 | Classic Frame All ignores shapes. This is harmless today because shapes are clamped inside the room polygon, which is included. | ClassicViewportAdapter.tsx:98-104 | Verified |
| R31 | Hybrid drags that fail constraints are dropped silently, while the same edit in the Inspector shows a notice. | HybridViewportAdapter.tsx:249-250, 262 vs ContextInspector.tsx:139-142 | Verified |

## Rewrite notes

**Functionality that must survive the redesign.**

1. Two independent projects (Classic 2.5D and Hybrid 3D), switched in one window, each with its own selection, camera, overlays and 50-step undo/redo history persisted per mode. The user must be told that edits do not carry over.
2. Every entity type and every editable field in §6.8.3, with the same units, ranges and domain validation: listeners (≤8, one active), sources (≤4), walls (≤100), Portals (≤8, hosted on an enabled wall), shapes (≤8 Box/Cylinder/Sphere), the room (1–50 m plan, 2–12 m height), floor and ceiling materials. The ceiling's acoustic on/off must stay separate from its visibility.
3. Per-entity enable/disable that excludes the entity from acoustics without deleting it, with protection for the last enabled listener and for the floor.
4. Counts against limits, add-availability with the reason, and creation defaults (§6.6). Two-point wall placement with a 0.1 m minimum. Portals placed on a selected wall.
5. Exact numeric entry with units, rejection of out-of-range input, keyboard stepping and fine stepping, and drag-to-scrub coalesced into one undo step.
6. Direct manipulation in both views: move sources, listeners and shapes; move wall endpoints; move Portals along walls; change height in 3D. Also pan, zoom at the pointer, orbit (3D), camera presets (Top, Front, Home, Frame All) and keyboard nudging of 0.1 m (extend it to 3D).
7. Acoustic overlays bound to accepted frames only: route polyline, occluder highlight, listener-facing Portal marker, first- and second-order reflections with per-reflection length, delay and gain; 3D direct, blocked and Portal paths; "Show all paths"; the arrival direction with its stated convention; Paths and Ceiling toggles.
8. Status readout (listener, route, gain, RT60), engine state (worker, fallback with reason, waiting) and the debug metrics.
9. Audio transport: Play/Stop with pending state, error with Retry, Raw/Simulated at any time, one persistent engine across modes. Per-source gain and loop. Local audio import (WAV/MP3/Ogg, mono, 25 MB per file, 100 MB library), relinking that keeps the clip ID, removal with confirmation, missing-asset indication and silence.
10. Authoring JSON export and import (mode-guarded, relinking metadata, no audio bytes), the four presets, reset of the active mode with undo, clear-all with confirmation, recovery of unreadable caches, storage-unavailable warnings.
11. Optional AI: compile a validated candidate that the user previews and applies explicitly, and explain a deterministic snapshot. Both are clearly optional and fail gracefully.
12. Undo toast semantics: Undo is offered only while it reverts exactly that action.
13. Accessibility gains to keep: labelled controls, keyboard canvas editing, reduced motion, units in accessible names.
14. Controls the redesign should add because the model already supports them: listener and scene renaming, HRTF / update rate / reflection count settings, Portal loss, wall kind, changing a source's clip, explicit "set active listener", deselection, multi-select.

**Incidental web-only UI (can be dropped or replaced).**

- The Next.js routes `/`, `/classic`, `/lab`, and the hydration placeholder.
- SVG viewBox letterboxing and painter's-algorithm depth sorting. A native renderer can use real depth testing, but the plan view must stay orthographic with uniform scale.
- The ≤850 px drawer layout and the mobile toggles, unless the desktop app needs narrow windows.
- `title` tooltips, `<details>` Debug, `@starting-style` animations, `html[data-input]` and `data-*` test attributes.
- Browser storage mechanics: localStorage keys, the IndexedDB library, anchor downloads, the `.txt` recovery file, "tab-only" warnings. Replace them with native files: project documents, an asset folder with relinking, autosave and crash recovery.
- Test hooks on `window` (`__echoCanvasRenderGateCValidation`, `__echoCanvasSimulateStorageFailure`).
- About 85 legacy CSS classes, `HybridPlanPositionEditor`, and the dead editor-action branches in `ClassicViewportAdapter`.
- The system font stacks (Aptos/Segoe/Cascadia). Pick a bundled UI font and monospace font, and re-derive the label-width estimate (0.62em) if label layout is ported.
