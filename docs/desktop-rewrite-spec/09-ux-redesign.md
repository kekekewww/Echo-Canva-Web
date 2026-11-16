# 09 — UX redesign for the desktop app

Section 06 lists every function the web UI has today and 34 UX problems (cited here as "06-UX #n"). This section defines the new interface. **Section 06 is the function checklist; this section is the layout and behavior.** Every function in 06 must remain reachable unless this section removes it with a reason.

Interactive mockups of the screens below are in the companion artifact "Echo Canvas Desktop Blueprint" (UI mockups tab). Numbers shown in the mockups are illustrative.

## 1. Design principles

1. **Three questions, three places.** What is in the scene (left: Outliner). What does the selected thing do to the sound (right: Inspector, including "Effect on the listener"). What am I hearing (bottom: Analysis dock and transport).
2. **Selecting never changes the sound.** Selection is for editing. Changing the listening position, muting or soloing is always a separate, explicit control (fixes 06-UX #1).
3. **One gesture, one undo step.** Drags, scrubs and room resizes are transactions (fixes #3, #19).
4. **The same tools in both views.** Anything you can do in the 2.5D plan you can do in the 3D view, with mouse or keyboard (fixes #5, #18).
5. **State in words, not in colors alone.** Every color-coded meaning also has a shape, line style, icon or label (fixes #15, #27).
6. **Desktop conventions.** Native menu bar, standard shortcuts, files on disk, resizable panels, multiple windows not required.

## 2. Screens and windows

| Screen | When | Content |
| --- | --- | --- |
| Start | App launch with no file to open; File → Close | New project, Open, Import web export, Recent (12), presets with thumbnails, optional "Describe a room" (assistant), quick-start tips |
| Workspace | A project is open | Layout in §3 |
| Settings | File → Settings (Ctrl+,) | Tabs: General, Audio, Editing, Assistant, Shortcuts, Diagnostics |
| Dialogs | On demand | Assistant preview, Missing audio, Recover unsaved work, Confirm destructive action, Import report, About |

One project per window. Opening a second project opens a second window (Tauri multi-window). This is optional for v1; if omitted, opening asks to save and replaces the current project.

## 3. Workspace layout

```text
┌ Title bar: menus · document name (● when unsaved) · window controls ───────────────────────┐
├ Toolbar: [2.5D Plan | 3D Spatial] │ tools V H W P S L B M │ Snap ▾ │ … │ ↶ ↷ │ Search Ctrl K │ Assistant ┤
├───────────────┬──────────────────────────────────────────────┬──────────────────────┤
│ Outliner      │ Viewport (plan or 3D)                         │ Inspector             │
│ 252 px        │  floating: view presets · overlay toggles     │ 300 px                │
│ (200–400,     │  floating: legend · cursor readout · scale    │ (260–480, resizable,  │
│  resizable,   ├──────────────────────────────────────────────┤  collapsible: Ctrl+.)│
│  collapsible: │ Dock: Analysis · Mixer · Diagnostics ·        │                       │
│  Ctrl+\)      │       Assistant  (resizable, collapsible: Ctrl+J)                     │
├───────────────┴──────────────────────────────────────────────┴──────────────────────┤
│ Transport: ▶ · Room|Dry · Panning ▾ · Master ── · meters │ Results state · Autosave   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

- Minimum window size 1100 × 680. Below 1280 px wide, the Inspector overlays the viewport as a drawer instead of squeezing it.
- Panel sizes and collapsed states persist per user (preferences), not per project.
- The 2.5D and 3D scenes are two documents in one project file (section 08 §8). The toolbar switch is labeled "2.5D Plan" and "3D Spatial" with keys 1 and 2. The first time a user edits one, a one-line hint says "Edits here don't change the 3D scene" (or 2.5D), with "Copy this scene to 3D…" as an action (fixes #8). Copying uses the web app's projection rules (section 01) and is undoable.

## 4. Menu bar

| Menu | Items (shortcut) |
| --- | --- |
| File | New (Ctrl+N), Open… (Ctrl+O), Open Recent ▸, Save (Ctrl+S), Save As… (Ctrl+Shift+S), Import Web Export…, Export Web Authoring JSON…, Reveal Autosave Folder, Close (Ctrl+W), Settings… (Ctrl+,), Quit |
| Edit | Undo (Ctrl+Z), Redo (Ctrl+Shift+Z and Ctrl+Y), Cut/Copy/Paste/Duplicate (Ctrl+X/C/V/D), Delete (Del), Select All (Ctrl+A), Deselect (Esc), Rename (F2) |
| View | 2.5D Plan (1), 3D Spatial (2), Top/Front/Side/Orbit (T/F/G/O, 3D), Fit All (Home), Zoom In/Out (Ctrl+= / Ctrl+-), Paths ▸ (Direct, Through wall, Via portal, Reflections, All sources / Selected source), Labels (Ctrl+L), Ceiling (3D), Outliner (Ctrl+\), Inspector (Ctrl+.), Dock (Ctrl+J), Theme ▸ |
| Scene | Add ▸ (Wall W, Portal P, Source S, Listener L, Box/Cylinder/Sphere B), Scene Settings…, Copy Scene to Other View…, Reset Scene to Preset… |
| Audio | Play/Stop (Space), Room/Dry (Tab, when the viewport has focus), Panning ▸, Output Device ▸, Mute Selected (M), Solo Selected (Shift+S… see §11), Retry Audio |
| Help | Keyboard Shortcuts (Ctrl+/), Viewport Gestures, Acoustic Model Limits, About |

On macOS use Cmd instead of Ctrl, and place Settings and Quit in the app menu.

## 5. Tools and canvas behavior

| Tool (key) | Behavior |
| --- | --- |
| Select (V) | Click selects; Shift/Ctrl-click adds/toggles; drag on empty space draws a selection box (2.5D) ; click empty space or Esc deselects (fixes #2). Drag moves the selection as one undo step |
| Pan (H, or hold Space) | Drag pans. Middle-drag pans in every tool |
| Wall (W) | Click start, click end; keeps chaining from the last end until Esc or double-click. Shows length and angle while drawing. Shift snaps the angle to 15°. Snaps to grid and existing endpoints. Rejects walls shorter than 0.1 m with an inline message at the cursor |
| Portal (P) | Hover a wall to preview a portal of default size centered at the cursor; click places it. Disabled with the reason shown when no wall is under the cursor or the 8-portal limit is reached |
| Source (S) / Listener (L) | Click places. Limits (4 sources, 8 listeners) are shown on the tool tooltip and enforced with a visible reason |
| Shape (B) | Drop-down for Box, Cylinder, Sphere. Click places. Footprint counts toward the wall budget, shown live |
| Measure (M) | Click two points; shows distance and the straight-line delay at 343 m/s. Not saved |

- **Uniform scale.** The plan view uses one world-space camera with equal X and Z scale (fixes #6). Zoom with the wheel at the cursor, zoom controls on the canvas, and pinch on trackpads. Rulers adapt their spacing to the zoom and are clipped to the canvas (fixes #28).
- **Snapping.** Grid snap with the step from the toolbar (0.01, 0.05, 0.1, 0.25, 0.5, 1 m; default 0.1 m). Hold Alt to disable snapping temporarily.
- **Constraints come from one place.** Every input path (drag, keyboard nudge, inspector field, scrub, assistant, paste) calls the same Rust validation (fixes #17). When a drag hits a limit, the object stops at the limit and a short message appears at the cursor (fixes #4).
- **Keyboard editing (both views).** Arrow keys move the selection by the snap step, Shift+Arrow by 10× the step, Alt+Arrow by 0.01 m. Page Up/Page Down change height in 3D. R/Shift+R rotate the listener heading by 15° (fixes #5, #12).
- **Selection treatment.** Every entity type uses the same selection style: a selection-colored outline plus handles. Listener, Portal and shapes included (fixes #13).
- **Listener heading.** The listener glyph rotates with its heading. A rotation handle appears when it is selected (fixes #12). All listeners are drawn. The listening position has a filled glyph and the others are outlined.

### 3D view specifics

- Orbit around the room's center (not a fixed point), Pan with Shift+drag or middle-drag, Zoom with the wheel. Presets: Top, Front, Side, Orbit, Fit all, plus a clickable view cube (fixes #18, #28). The initial view and Home are the same.
- Shift+drag on an object changes its height, as today. A visible vertical gizmo on the selected object does the same.
- Labels sit on leader lines and are moved apart so they never overlap. Labels can be hidden (Ctrl+L).
- Ceiling toggle; walls nearest the camera fade so the interior stays visible.

## 6. Outliner

- A tree: **Listeners**, **Sources**, **Geometry** (sub-groups: Boundary walls, Walls, with each wall's Portals nested under it, then Shapes), **Room** (fixes #9).
- Each group header shows its count and its limit ("Sources 2 / 4") and a + button, disabled with a visible reason at the limit (fixes #31).
- Row controls are always visible, not only on hover: enable/disable toggle on every row; level meter, Mute and Solo on sources; a "Listen here" radio on listeners (fixes #1).
- Filter box at the top (Ctrl+F when the Outliner has focus). Groups collapse and expand.
- Keyboard: ARIA tree pattern with a roving tabindex (one tab stop for the whole tree; arrows move; Enter selects; Space toggles enabled; F2 renames; Del deletes) (fixes #24).
- Rename inline (F2 or double-click). New entities get readable default names ("Wall 3", "Source 2"), never internal IDs (fixes #9).
- Right-click context menu: Rename, Duplicate, Delete, Enable/Disable, Focus in view, and type-specific actions (Listen here, Add portal to wall).
- A budget footer shows wall budget use (walls plus shape footprints out of 100) and sources.

## 7. Inspector

- **Nothing selected → Scene panel** (fixes #2, #10): scene name, room summary (dimensions, volume, RT60 per band), counts and limits, quick Add buttons, and Scene Settings (HRTF default, calculation update rate 10–15 Hz, maximum early reflections, any other scene-level settings section 01 lists).
- **Header:** type icon, editable name, type and short facts ("Wall · 1 portal"), enabled switch, ⋯ menu (Duplicate, Delete, Move to room center, Copy coordinates).
- **Sections per entity.** All fields from section 06 §6.8, plus those 06-UX #10 says are missing: Portal loss, wall kind (boundary or partition), listener name, source clip, scene name. Group fields as Geometry or Position, Material or Sound, Openings, Listening.
- **Numeric fields:** label on the left (drag the label to scrub), value, unit. Scrub rate 0.25 step per pixel by default, with acceleration; Shift for fine and Ctrl for snapping to the step (fixes #33). Arrow keys step in the field. The scrub handle is not a separate tab stop (fixes #24). Read-only computed values (wall length, room volume) use a dashed outline.
- **Validation:** shown under the field that caused it, in words, with the allowed range ("Thickness must be between 0.02 and 1.00 m"). The field keeps the last valid value (fixes #4).
- **Material picker:** swatch, name, and a three-band table of absorption and transmission loss with small bars, plus scattering and reference thickness, from the registry (section 01).
- **Effect on the listener:** for the selected wall, portal or shape, list what it does in the accepted frame: which source paths it blocks (with transmission loss), which it lets through, which reflections it creates. For a source: each path to the listener with level and delay. Hovering a row highlights the path in the viewport.

## 8. Bottom dock

| Tab | Content |
| --- | --- |
| Analysis | Per-source table at the listening position: route (Direct, Via portal, Through wall), level (dB), delay (ms), low-pass cutoff (Hz), arrival azimuth/elevation (°). Selecting a row selects the source. An echogram for the selected source: direct sound plus the six reflection taps as bars on a dB vs ms chart, with the late-field estimate shaded. RT60 per band (low, mid, high) and room volume. Every value comes from the accepted frame |
| Mixer | One strip per source (level meter, gain, mute, solo) and a master strip. Room/Dry, panning model and output device. Mute and solo affect listening only, never the scene or the file |
| Diagnostics | Today's debug line, expanded: mode, revision, accepted revision, frame age, pose-lagging yes/no, compute ms (last, p95), workers, fallbacks with reason, autosave state. Copy as text for bug reports |
| Assistant | Generate a scene (prompt, preview, apply) and Explain the selection. The explanation names the source and the accepted revision it describes, and is marked "outdated" when the scene changes (fixes #29) |

## 9. Transport and status bar

- Left: Play/Stop (Space), Room/Dry segmented control (Tab with viewport focus; the web app called these Simulated/Raw), panning (Speakers = equal-power, Headphones = HRTF when available), master gain slider with dB readout, stereo output meter.
- Right: calculation state in words: "Results up to date · rev 14 · 6 ms", "Updating…", "Showing previous result while you drag", "Using backup calculation (details)" (fixes #16). Then autosave state.
- Audio and calculation states never share words. Audio: Playing, Stopped, Starting…, "Audio device unavailable: Retry". Calculation: Up to date, Updating, Previous result, Backup calculation, Error.
- Screen readers: only state changes are announced, never per-frame numbers (fixes #23).

## 10. Overlays and legend

| Meaning | Line | Color token | Extra cue |
| --- | --- | --- | --- |
| Direct path | Solid, 2.2 px | `--path-direct` (same hue as sources) | — |
| Via portal | Dotted, 2 px | `--path-portal` | Passes through a portal marker |
| Through wall (occluded) | Dashed, 1.5 px | `--path-blocked` | Shows the TL in dB on hover |
| Reflection | Thin solid, 1.2 px | `--path-reflection` | Diamond at each reflection point |
| Lagging frame (during drags) | Same styles at 50 % opacity | — | "Updating" chip on the viewport (fixes #14) |

The legend is generated from the same tokens and lists only what is visible (fixes #15). Both views keep showing the previous accepted frame during a drag, dimmed, in the same way.

## 11. Keyboard shortcuts

Global: Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+Shift+S, Ctrl+W, Ctrl+, , Ctrl+K (command palette), Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+/ (shortcut list), Space (play/stop, when focus is not in a text field), 1/2 (2.5D/3D).
Viewport: V H W P S L B M (tools), Esc (cancel tool, then deselect), Del (delete), Ctrl+D (duplicate), Ctrl+A (select all), arrows (nudge), Page Up/Down (height, 3D), R/Shift+R (rotate listener), Home (fit all), T/F/G/O (3D presets), Tab (Room/Dry), Ctrl+L (labels).
Outliner: arrows, Enter, Space (enable/disable), F2, Del, Ctrl+F (filter).
Mute and solo the selected source: M and Alt+S (S is the Source tool).

Text fields keep their native undo: Ctrl+Z inside a text input undoes text, not the scene (fixes #25). All shortcuts are listed in Help → Keyboard Shortcuts and Settings → Shortcuts. Rebinding is optional for v1.

## 12. Notifications and errors

- **Inline** for anything tied to a field or the cursor (validation, limits).
- **Toast** (bottom right, auto-dismiss 5 s, pausable on hover, with an action) for completed actions: "Wall deleted · Undo", "Saved", "Imported with 2 changes · View report".
- **Banner** (top of viewport, dismissible) for ongoing conditions: "Audio device unavailable · Retry · Choose device", "Using backup calculation · Details".
- **Dialogs** only for decisions: unsaved changes, destructive actions, missing audio, recovery, assistant preview.
- Every notification can be dismissed (fixes #32). Imports and audio decoding show progress.

## 13. Dialog behavior

- Modal dialogs trap focus, return focus to the control that opened them, and close on Esc (fixes #22). Popovers close on outside click and Esc, return focus, and only one is open at a time (fixes #30).
- Destructive confirmations say exactly what will be lost, put the destructive button on the right in the danger color, and focus Cancel by default (fixes #21).
- **Recovery:** if autosave holds unsaved work from a session that did not close cleanly, the Start screen offers Restore, Save a copy, or Discard. The recovery file is never overwritten before the user chooses (fixes #20).
- **Assistant preview:** the prompt, the checks that ran (schema, limits, known IDs, content policy, repair budget used, 1 at most), a plan thumbnail, a plain summary of what will be replaced, and three actions: Discard, Open as new project, Replace current scene (undoable).
- **Missing audio:** lists each missing file with the source that uses it, size and length. Actions per file: Locate…; for all: Search a folder…, Use built-in sounds, Continue. Matching uses name, size and SHA-256. A hash mismatch is shown before the file is used.

## 14. Visual design tokens

Dark is the default theme; light is fully supported. Both are defined in `ui/src/design/tokens.css`.

### 14.1 Color channels (fixes #26, #27)

Entities, path types, states and axes each get their own hues. Selection has its own color. No hue is reused across channels.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--bg-0` window | `#0A1113` | `#E6ECED` | App background, viewport surround |
| `--bg-1` panel | `#0F181B` | `#F6F8F8` | Panels, bars |
| `--bg-2` raised | `#142024` | `#FFFFFF` | Buttons, cards, popovers |
| `--bg-3` hover/track | `#1B2A2F` | `#EDF2F3` | Hover, slider tracks |
| `--line` | `#21323A` | `#D2DCDF` | Dividers between panels (decorative) |
| `--line-field` | `#4A6670` | `#74878C` | Borders of fields and controls, ≥ 3:1 against their background |
| `--text-1` | `#DDE7E8` | `#142427` | Primary text |
| `--text-2` | `#9AAEB2` | `#4C6065` | Secondary text |
| `--text-3` | `#7A8F94` | `#66797E` | Tertiary text (≥ 4.5:1 on panels for text under 14 px) |
| `--accent` | `#56C8CF` | `#0B848D` | Primary buttons, focus ring, active tab |
| `--select` | `#7AB0FF` | `#2F6FD0` | Selection outline, selected row bar, handles |
| `--entity-source` | `#56C8CF` | `#0B848D` | Sources, direct paths (`--path-direct`) |
| `--entity-listener` | `#F2B35B` | `#B56A00` | Listeners |
| `--entity-wall` | `#8EA3A9` | `#5C7178` | Walls and shapes |
| `--entity-portal` / `--path-portal` | `#7BD8A6` | `#1F8F5A` | Portals and paths through them |
| `--path-blocked` | `#F08A4B` | `#C2560F` | Through-wall paths |
| `--path-reflection` | `#A993FF` | `#6649D4` | Reflections, reflection points, RT60 bars |
| `--state-ok` | `#5BD08A` | `#1C8350` | Status dot "up to date", meters' safe range |
| `--state-warn` | `#E9C84A` | `#8A6D00` | Warnings (always with an icon) |
| `--state-error` | `#EF6B6B` | `#C23B3B` | Errors, destructive buttons (always with an icon or label) |
| `--axis-x` / `--axis-y` / `--axis-z` | `#F0727F` / `#8CCB5E` / `#6FA8FF` | `#C63B4A` / `#4E8F22` / `#2F6FD0` | Axis letters in fields and gizmos only |

Check every text/background pair and every control boundary with a contrast test in CI (WCAG 2.1 AA: 4.5:1 text, 3:1 large text and UI boundaries).

### 14.2 Type

- UI face: IBM Plex Sans (bundled, OFL). Data and code face: IBM Plex Mono (bundled, OFL). No network font loading.
- Scale: 11 (axis labels and units only), 12 (secondary, table cells), 13 (body, default), 14 (inspector titles), 16 (dialog titles), 20 (start screen). Weights 400, 500, 600. Tabular figures for all numbers.
- Uppercase group labels use 10–11 px with 0.08 em letter-spacing. Never smaller than 10 px.

### 14.3 Spacing, shape, motion

- 4 px grid: 4, 8, 12, 16, 24, 32.
- Radius: 4 (small chips), 6 (fields, buttons), 8 (cards), 12 (dialogs).
- Elevation only for floating things (popovers, dialogs, floating viewport toolbars).
- Motion: 120 ms for hover and press, 180 ms for panels and popovers, no motion on value changes. Respect the OS reduced-motion setting by disabling all non-essential animation.

## 15. Terminology

| Web app | Desktop | Note |
| --- | --- | --- |
| Classic, 2.5D | 2.5D Plan | Internal code name stays "classic" |
| Hybrid, 3D | 3D Spatial | Internal code name stays "hybrid" |
| Simulated / Raw | Room / Dry | Same behavior |
| Active listener | Listening position ("Listen here") | Explicit control, not selection |
| Portal | Portal (tooltip: "an opening in a wall, such as a door or window") | Domain term kept |
| Geometry (flat list) | Geometry tree: Boundary walls, Walls → Portals, Shapes | |
| "Stopped" (acoustics status) | "Calculation: …" states (§9) | Avoids clash with audio Stop |
| Project menu on the scene name | File and Scene menus | |
| Debug line | Diagnostics tab | |

## 16. UX acceptance list

Each item is a test (automated where possible, otherwise a manual check recorded in evidence).

1. Selecting a listener does not change what is heard; only "Listen here" does.
2. Esc and clicking empty canvas clear the selection, and the Inspector shows the Scene panel.
3. A drag of any entity is one undo step; a room scrub is one undo step and does not clamp entities while scrubbing.
4. A 20 × 8 m room is drawn with equal X and Z scale.
5. Every entity can be selected, moved and deleted with the keyboard alone in both views.
6. Every validation failure shows a message next to the field or cursor within 100 ms.
7. Every color-coded overlay has a non-color cue; the legend matches what is drawn.
8. During a drag both views show the previous accepted paths, dimmed, never blank.
9. The Outliner is one tab stop; at 100 walls, Tab moves from Outliner to viewport in one press.
10. Ctrl+Z inside a text field undoes text only.
11. Every dialog traps focus and returns it on close; destructive confirmations focus Cancel.
12. Recovery data is never overwritten before the user chooses.
13. The Assistant never changes the scene without the user pressing an apply action; Explain names the revision it describes and marks itself outdated after an edit.
14. Screen readers hear calculation and audio state changes, not per-frame numbers.
15. All text and control boundaries meet WCAG 2.1 AA contrast in both themes.
16. Every function in section 06's inventory is reachable (checklist in evidence).
