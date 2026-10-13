# Initial sciwork community issue drafts

These drafts are ready for maintainer review and later publication. They have not been created on GitHub. Proposed label definitions live in [the local manifest](../../.github/labels.yml).

## 1. Document a reproducible Classic/Hybrid portal walkthrough

**Labels:** `good first issue`, `documentation`, `acoustics`

**Background:** New contributors can see portal lines without understanding the difference between a direct path, a portal approximation, and a blocked transmission fallback. The model and browser/server boundary are documented, but an annotated user walkthrough would make the workbench easier to learn.

**Scope:** Add `docs/tutorials/portal-walkthrough.md` using the existing Concrete Partition preset. Describe preset selection, Simulated/Raw comparison, listener movement, open/close controls, and the last listener-facing portal direction. Include an exported scene fixture without local audio blobs or credentials and link the guide from `docs/README.md`. Use current UI labels and state that routing is a geometric/perceptual approximation.

**Acceptance:** A newcomer can reproduce the steps in Classic and Hybrid with no API key; the fixture validates and imports; screenshots contain no private data; all links work; neither engine formulas nor scene schema change. Record browser/version and separate visual observation from subjective listening.

## 2. Add a deterministic multi-portal tie-breaking fixture

**Labels:** `good first issue`, `testing`, `acoustics`

**Background:** `findBestPortalRoute` uses a cost with distance, loss, and turn penalties plus deterministic ID ordering. Reproducibility should remain clear when multiple routes have equal cost and scene entity order changes.

**Scope:** Extend `tests/unit/portal.test.ts` with a small validated fixture containing two equal-cost candidate routes. First review existing coverage; add a distinct multi-portal case rather than repeating a one-portal test. Derive expected cost from metric lengths and `edgeCost`, document geometry/units, and assert selected ID order, full source-to-listener polyline, and listener-facing virtual position. Reorder wall/portal input without changing IDs.

**Acceptance:** Both input orders produce the same route and expected numeric result within a stated tolerance; closing the chosen route selects the remaining route or the explicitly expected no-route fallback; tests need no random seed, browser, sound device, or provider call; existing portal tests and lint/types pass. Do not change algorithm constants to obtain the expected result.

## 3. Add accessible arrival-direction labels to the Hybrid path overlay

**Labels:** `help wanted`, `frontend`, `acoustics`, `testing`

**Background:** The Hybrid overlay already displays accepted direct and reflection paths, while arrival directions are represented numerically in the accepted acoustic frame. A compact, accessible annotation can help learners relate world geometry to listener orientation.

**Scope:** Limit the change to `src/components/workspace/HybridPathOverlay.tsx`, nearby presentation helpers, and focused tests. Add an optional textual label for the selected source's direct/blocked arrival azimuth/elevation, using the accepted frame's existing values. Show a clear empty/pending state when the frame does not match the current revision. Avoid calculating a second authoritative path, adding audio nodes, changing Worker protocols, or adding a visualization dependency.

**Acceptance:** Labels use degrees and explain the existing coordinate/heading convention: `solveDirectPath3D` reports the world-aligned direction from listener position to source, without rotating that azimuth by listener heading. Keyboard/screen-reader users can access the same information; stale frames never display a current label; label visibility changes no acoustic revision or sound; a focused unit/browser test covers direct, blocked, and stale states; existing overlay/geometry/browser checks pass. Documentation continues to call the model an approximation.

## Later maintainer work

Keep future research proposals distinct from starter issues. Receiver sampling convergence, measured material calibration, directional late-field audio, and browser device-interruption handling require separate designs and appropriate evidence; their presence in source research helpers does not make them shipped audible features.
