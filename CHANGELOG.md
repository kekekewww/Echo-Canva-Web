# Changelog

Changes use Conventional Commit subjects. Releases should record compatibility changes, scientific-model changes, dependency/security fixes, and validation limits separately.

## Unreleased — independent Echo Canvas Web extraction

### Repository and community

- Extracted the immutable `v1.0.0-build-week` baseline from `kekekewww/Echo-Canva`; the exact commit and release evidence are recorded in [docs/ORIGIN.md](docs/ORIGIN.md).
- Established long-term contributor instructions, security reporting, community conduct, issue/PR templates, proposed labels, and sciwork issue drafts.
- Preserved Build Week delivery documents and original active documentation in [docs/archive/build-week](docs/archive/build-week/INDEX.md).
- Clarified live Classic/Hybrid behavior and data-only P5/P6/P7 research foundations without enabling additional acoustic features.

### Development and deployment

- Added optional reproducible Docker development with Compose Watch and a separate non-root standalone production image.
- Added public-PR quality checks and production container build/start/HTTP smoke checks; native pnpm and Vercel workflows remain available.
- Added a server health endpoint. Container execution evidence and unavailable checks are recorded in the [maintenance reports](docs/maintenance/README.md).

### Security maintenance

- Made production AI provider use an explicit opt-in and bounded route input, process request usage, concurrency, and provider retries.
- Updated affected dependencies as a separate maintenance change; the lockfile and [security report](docs/maintenance/SECURITY_LICENSE.md) contain the resolved versions and audit results.
- Added a reproducible local `braces@3.0.3` nesting guard; version-based audits still report the upstream advisory until a fixed release exists.
- Replaced both client-only markers with independently authored project-MIT implementations and made runtime notice gaps fail collection/inspection. Real Next compiler checks protect Client/Server boundaries.

### Acoustic compatibility

- Retained baseline schema versions, material presets, geometry/acoustic algorithms, browser audio, and local audio storage behavior.
- Additional regression fixtures and actual results are recorded in [docs/maintenance/ACOUSTIC_REGRESSION.md](docs/maintenance/ACOUSTIC_REGRESSION.md).
- Reduced Hybrid listener-update work by retaining static primitive identity and computing only the needed Classic Direct/Portal projection; numerical oracles, formulas and performance budgets are unchanged. See [follow-up verification](docs/maintenance/VERIFICATION_FIXES.md).
- Removed duplicate coincident side polygons for walls without open Portals; this preserves the existing surface coverage and removes translucent fill/stroke overdraw. Added independent projected-geometry regressions and post-measurement stress diagnostics; CI preserves retry evidence and repeats the original macOS stress gate without retries.

## Source release — v1.0.0-build-week

This upstream tag is a source provenance label, not a new release of this repository. See [ORIGIN.md](docs/ORIGIN.md) for its original date, commit, capabilities, and extraction differences. No release or deployment is published by the local cleanup.
