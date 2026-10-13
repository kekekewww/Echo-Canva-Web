# Repository Audit Report

Date: 2026-10-13. Source: `v1.0.0-build-week`, commit
`c8fe24700b67861e2f64fbb8950e9281c0e13a3c`.

The audit read the original AGENTS, README, package and workspace configuration,
architecture, acoustic formulas, research references, API contracts, acceptance
tests, unit/E2E tests, schemas, Workers, audio code, asset provenance and release
records before maintenance changes. The immutable initial extraction has the
same Git tree as the upstream tag; no later `main` functionality was imported.
See [ORIGIN.md](../ORIGIN.md) and [BASELINE_TEST_REPORT.md](BASELINE_TEST_REPORT.md).

## Original inventory and disposition

[REPOSITORY_INVENTORY.json](REPOSITORY_INVENTORY.json) classifies all 291 original
tracked files, with original Git blob, SHA256, size, current path and rationale.
Generated dependency/build/test directories are absent from that source tree.

| Classification | Files | Disposition |
| --- | ---: | --- |
| Active | 220 | Retained runtime, domain, research helpers, tests, reviewed benchmark oracles, configuration and maintenance contracts. Original versions remain in extraction history. |
| Historical | 66 | Moved, byte for byte, into `docs/archive/build-week/` with original relative paths. |
| Generated | 4 | Procedural WAVs can be reproduced with `scripts/generate-audio-assets.mjs`; retained because the browser and clean-checkout tests require them. |
| Redundant | 0 | No removal justified. Text/source/JSON byte-hash comparison found no exact duplicates; older submission copies are historical variants. |
| Unknown | 1 | `src/components/workbench/EchoWorkbench.tsx` has no static inbound source/test import. Retained pending a deliberate retirement analysis; shared workbench children are active. |

Original tree counts: 119 source files, 78 test files (69 unit, eight Chromium
E2E specifications, one AI fixture), 32 documentation files, 20 submission-pack
files, 12 release/evidence artifacts, five audio files including provenance,
four historical agent reports, two benchmark artifacts, two bootstrap prompts,
one schema, one asset generator and 15 root files.

The archive also preserves seven exact snapshots of active documents: original
README, AGENTS, architecture, acoustic reference, research map, API contracts
and acceptance plan. [The archive manifest](../archive/build-week/MANIFEST.json)
verifies all 73 archived originals against their source Git blobs. File names
such as MVP, Artifact, Experiment or Build Week were never deletion criteria.

## Findings and treatment

| Finding | Evidence | Treatment / status |
| --- | --- | --- |
| Competition instructions no longer fit community maintenance | Original AGENTS acceptance gates, submission session and bootstrap requirements | Current AGENTS and contributor governance rewritten; original retained. |
| Documentation contains stale runtime descriptions | Architecture says both 2 s and 150 ms persistence; hook uses 2,000 ms. Worker request sketch differs from actual facade. Phase records predate the tag's second-order integration. | Current architecture corrected; historical snapshots are explicitly historical. |
| No original CI or Docker configuration | No `.github/workflows/` or Docker files in source tag | Added separate native, Chromium, development Docker and production Docker verification paths. Execution results belong to their verification reports. |
| Original dependency audit is obsolete | Fresh baseline: three critical, 25 high, 15 moderate, one low advisory finding | Same-stack security updates applied. Final production audit passes with zero findings; all-dependency audit retains one development-only high finding. See [ARCHITECTURE_DEPENDENCIES.md](ARCHITECTURE_DEPENDENCIES.md). |
| Public shared AI quota requires stronger protection | Original routes trust forwarded address/user-agent for per-process limits and require only a configured provider key | Separate access/security maintenance; see [SECURITY_LICENSE.md](SECURITY_LICENSE.md). |
| Local audio and licensed fixtures must survive cleanup | IndexedDB library, metadata-only export, local `/audio/` registry and procedural attribution | Retained with their tests and MIT/procedural provenance. |
| Runtime and research foundations need distinct claims | Receiver connections, six-band/atmosphere helpers and directional histogram exist but are data-only | Maintained and tested; no claim of corresponding audible renderer, wave diffraction or physical calibration. |

## Baseline and risk evidence

Baseline frozen install, lint, typecheck, 508 unit tests and production build
passed. Initial production Chromium run had 44 passes and one stress-budget
failure (182 ms long task against an unchanged 50 ms limit). The isolated
unchanged stress rerun passed; both outcomes are retained. A rerun does not
erase the first failure. Headphone localization and physical acoustic
calibration have not been performed in this extraction.

Existing direct tests cover high-risk geometry, transmission/occlusion,
reflections, Portal routing, material energy, RT60, Hybrid calculations, Worker
protocol/fallback, AudioEngine lifecycle and scene serialization. The Classic
ten-scenario JSON artifact is a reviewed exact regression oracle, not disposable
build output. Unit tests and browser tests use deterministic fixtures and mocks
for AI; paid API access is not required.

The read-only scan found no skipped/only/TODO test declaration in the scanned
test tree, and no source-level `dangerouslySetInnerHTML`. These targeted checks
are evidence, not a formal proof of security or complete branch coverage.

## Remaining debt and verification limits

- Resolve or safely retire the unreachable legacy workbench shell after its
  consumers, types, CSS and tests are mapped explicitly.
- Revisit the original ESLint 9 support warning through an independent tooling
  change; this extraction does not change the linter's major version.
- Track the development-only `braces` recursion advisory while the upstream
  package has no published fix. Do not invent a patched version or hide it.
- Keep browser stress failures and unchanged budgets visible; wall-clock
  performance requires representative, uncontended machines.
- Validate real device changes, browser audio interruption and subjective
  headphone localization on supported host browsers.
- Static source/import/asset review is not a penetration test, mathematical
  proof or exhaustive software-bill-of-materials audit of a Linux image.

Final command outcomes, container execution limitations and CI execution status
are recorded in the linked maintenance verification reports. Unexecuted checks
must remain explicitly unverified.
