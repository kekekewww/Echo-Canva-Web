# Origin and immutable source baseline

Echo Canvas Web is an independent extraction of [Echo-Canva](https://github.com/kekekewww/Echo-Canva), prepared for community maintenance. Its remote is `https://github.com/kekekewww/Echo-Canva-Web.git`. The initial extraction was local; after the user supplied the existing remote on 2026-10-13, the completed work branch was pushed there. No repository was created and no deployment or release was made. The [remote handoff record](maintenance/REMOTE_HANDOFF.md) distinguishes that branch publication from the unchanged original source and remote `main`.

| Source fact | Verified value |
| --- | --- |
| Only permitted source tag | `v1.0.0-build-week` |
| Peeled upstream commit | `c8fe24700b67861e2f64fbb8950e9281c0e13a3c` |
| Immutable source tree | `ca4a2543f6f0e8848fe8d8eb57f3ed70faaba294` |
| Published release | [EchoCanvas — OpenAI Build Week 2026](https://github.com/kekekewww/Echo-Canva/releases/tag/v1.0.0-build-week) |
| Release publication time | `2026-07-21T11:42:43Z` (GitHub Release API; not inferred from the commit timestamp) |
| Extraction date | 2026-10-13 |
| Independent root commit | `7c03345925369529a998316670e3fcece896b68c` |
| Extracted tracked files | 291; root Git tree exactly equals the upstream source tree |

## Verification and extraction procedure

The empty workspace contained no existing checkout or user modifications. A separate bare source clone was made at the sibling `.source-baseline.git`; the upstream was never written. These required commands were executed there:

```sh
git fetch origin --tags
git rev-parse 'v1.0.0-build-week^{commit}'
git diff --stat v1.0.0-build-week..origin/main
```

The bare clone initially stores `main` at `refs/heads/main`; a local `refs/remotes/origin/main` pointer was established solely to run the requested comparison. The observed later Main differs in 36 files, with 1,179 insertions and 169 deletions. This comparison is evidence only. None of its code, later UI settings, credential flow or product features was imported.

The source was exported with `git -c core.autocrlf=false archive` using the peeled commit SHA. The explicit setting prevents the host's global Windows newline conversion from changing Git blob identities. All 291 exported blobs were compared with upstream, and the independent repository's first commit has the identical source tree. No upstream Git history, tags, releases or deployment was changed. Maintenance takes place on `chore/open-source-extraction` in this independent repository; the source history remains in the separate mirror only.

The machine-readable [source manifest](maintenance/source-baseline-manifest.json) records original paths, Git blobs and SHA-256 hashes. Run `node scripts/verify-source-baseline.mjs` to verify the independent root tree against the recorded immutable tree. [Baseline results](maintenance/BASELINE_TEST_REPORT.md) distinguish actual reruns from the historical release's claims.

The subsequent user-authorized PR adoption retains the existing destination's
LICENSE-only initializer as a second, precisely verified root. Its LICENSE blob
is identical to the source LICENSE, and the history bridge changes no tracked
file. The independent source root, all 291 original entries and upstream SHA are
unchanged. [ADR 0005](adr/0005-preserve-destination-initializer.md) and
[repository-history.json](maintenance/repository-history.json) record this
destination-history exception; it does not import another product-code source.

## Features verified in the tag

The source contains Classic 2.5D and Hybrid 3D workspaces; independent versioned projects; scene editing, listeners and mono point sources; finite walls and portals; material presets and bounded box/cylinder/sphere geometry; direct paths, occlusion/transmission approximation, portal routing, first-order and bounded blocked-path second-order reflections; Eyring estimates and persistent Schroeder/Web Audio output; browser HRTF panning; deterministic source-sharded Web Workers with serial fallback; validated JSON transfer; browser IndexedDB local audio; and optional server-side AI scene compilation and grounded explanations.

The existing receiver-connection, six-band atmospheric/material and directional late-field helpers are tested data foundations, not newly claimed audible features. Arbitrary room meshes, wave diffraction, desktop/native audio runtimes, Steam Audio, VST hosting and engine plugins are outside this extraction.

## Maintenance differences from the source

All differences are independently authored maintenance changes based on this tag:

- Historical competition instructions, phase plans and delivery evidence are preserved in `docs/archive/build-week/`, with an index and relocation map. Current documentation describes the actual shipped runtime rather than obsolete phase targets.
- Open-source governance, contribution templates, initial community issue drafts, ADRs and maintenance reports are added. MIT copyright and original procedural audio attribution remain intact.
- Dependency security patches retain Next.js, React, TypeScript, pnpm, Web Audio and Workers. Exact versions and unresolved advisories are recorded in the dependency/security reports; they are not later Main feature imports.
- Next.js 16.3.8 native development automatically appends framework-managed instructions to `AGENTS.md` unless disabled. The local `next.config.ts` sets `agentRules: false` to keep this repository's reviewed maintainer guide stable; a native development start verified its hash remained unchanged. This configuration-only maintenance difference adds no acoustic or product feature. See [ADR 0004](adr/0004-versioned-maintainer-instructions.md).
- AI safety fixes bound request bytes, project accepted explanation fields, disable automatic production key use without explicit operator opt-in, cap shared in-flight/rate cost and disable SDK retries. Provider/model contracts and offline editing remain available. Process-local limits do not replace an authenticated public gateway.
- Standalone Next.js output, a health route, separate development/production Compose flows, a multi-stage non-root image, smoke checks and public-PR CI are added. Browser audio and local files remain browser-side. Vercel remains supported.
- Additive deterministic acoustic regression cases fill identified test gaps. Source schemas, formulas, constants, reviewed Classic benchmark oracles and established performance thresholds are preserved.
- The subsequent performance correction preserves a stable visible-primitive array and reuses the existing Direct/Portal calculation without computing unused Classic reflections/RT60 in Hybrid audio mapping. It changes execution work, not formulas or scene/audio/Worker contracts; the measured failures and reruns are recorded in [the follow-up report](maintenance/VERIFICATION_FIXES.md).
- Version-specific, lockfile-hashed local patches bound `braces` recursion and independently replace both client-only markers with project-MIT implementations. Strict runtime notice checks allow no exception. These are independently authored corrections, not code from later upstream Main; see [ADR 0006](adr/0006-local-dependency-patches.md).
- Viewport-only wall projection removes duplicate side polygons for walls without open Portals; existing faces, endpoint caps, Portal holes and solver geometry are preserved. Translucent fill/stroke overdraw intentionally changes. Additional tests derive expected projected area independently. Stress diagnostics are captured after the measurement window, with original inputs, sample counts, pool policy and timing limits retained; CI preserves retry evidence and adds zero-retry macOS repetitions.
- AI request projections and Frame All point collection move from rendering to their existing click handlers. This removes unused work while preserving the original request snapshots, point order and camera function; idle-render and mocked Explain coverage are added.

See [repository audit](maintenance/REPOSITORY_AUDIT.md), [architecture/dependencies](maintenance/ARCHITECTURE_DEPENDENCIES.md), [security/license audit](maintenance/SECURITY_LICENSE.md), [acoustic regression](maintenance/ACOUSTIC_REGRESSION.md) and [final verification](maintenance/FINAL_VERIFICATION.md) for exact outcomes and remaining debt. Historical evidence is not current validation.
