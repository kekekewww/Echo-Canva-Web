# Final Change Summary

Date: 2026-10-13. This summary describes the independent local Echo Canvas Web extraction. Command-level outcomes belong in [final verification](FINAL_VERIFICATION.md) and [Docker verification](DOCKER_VERIFICATION.md); configuration presence alone is not a passing test.

## Source and scope: completed

The only product-code source is upstream `v1.0.0-build-week`, peeled to `c8fe24700b67861e2f64fbb8950e9281c0e13a3c`. The independent root commit has the same Git tree and all 291 source blobs. The later Main comparison is recorded as evidence only; no later Main feature was merged, cherry-picked, or copied. Original history, tags, release and deployment remain untouched. See [ORIGIN](../ORIGIN.md) and [source extraction](SOURCE_EXTRACTION.md).

Classic 2.5D, Hybrid 3D, source/listener/editor/geometry/materials, direct/occluded/transmitted/Portal/reflection paths, browser Web Audio/HRTF, Worker calculation, local audio storage and optional AI remain. Scene schemas, formulas, coefficients, reviewed benchmark oracles and performance thresholds are preserved. P5/P6/P7 helpers remain data-only. No desktop/native runtime, Steam Audio, VST, game-engine plugin, database, or extra service was added.

## Repository and community: completed

- Audited and classified all original files; retained active/runtime/test/oracle assets and the unconfirmed legacy shell. No deletion was justified by names alone.
- Preserved 66 historical files and seven exact original-document snapshots, with original paths, blob/SHA256 manifest, and [archive navigation](../archive/build-week/INDEX.md).
- Rewrote README/AGENTS and maintained architecture, acoustic classifications, research map, and current API security supplement; obsolete competition duties remain historical.
- Added CONTRIBUTING, community conduct, private security guidance, changelog, four initial ADRs plus the subsequent history-adoption ADR and template, issue/PR templates, nine proposed labels, contributor onboarding and three bounded sciwork issue drafts. Labels/issues remain local drafts.
- Disabled Next.js automatic AGENTS appending with `agentRules: false`; a native start verified the maintainer guide hash stayed unchanged. See [ADR 0004](../adr/0004-versioned-maintainer-instructions.md).

## Dependencies and security: implemented with explicit limits

Same-stack maintenance updates Next.js/ESLint config to 16.3.8 and Vitest to 4.1.11, with reviewed same-major transitive overrides. Frozen installation passed. The production dependency audit passed with zero findings; the full audit still fails on one high development-only `braces` advisory whose advertised fix was not published. No advisory is suppressed. See [dependency report](ARCHITECTURE_DEPENDENCIES.md).

Production AI requires explicit runtime opt-in. Request input is capped at 256 KiB, provider-eligible requests share process rate/concurrency bounds, SDK retries are disabled, explanatory snapshots are projected to documented fields, and responses are no-store. Tests use mocks; no real paid request was made. Public shared-key access still requires an authenticated operator gateway and provider quotas; the application does not implement accounts or distributed authorization. See [security/license report](SECURITY_LICENSE.md).

MIT and procedural-audio attribution remain. Runtime notice collection now preserves actual Linux standalone/bundled dependency notices and pinned upstream supplements. The recorded production image has 21 runtime packages, zero missing metadata/installed originals, and an explicit unresolved `client-only@0.0.1` notice-provenance exception. Targeted image/source/history secret scans found no matching credential values or private keys. These checks are not complete legal compliance certification or an operating-system CVE scan.

## Native, Docker and CI: implemented and locally exercised

Native frozen pnpm development remains. Docker adds optional pinned Node 22.23.3/pnpm 11.7.0 development with Compose Watch, isolated Linux dependencies and visible logs, plus a multi-stage non-root standalone production image. One Next.js application serves main routes, assets, health, and existing API routes. Vercel stays an alternative. Browser audio, HRTF, Workers and IndexedDB remain browser-side without host audio mounts.

Actual Linux container lint/typecheck/full-unit execution passed (524 tests). Host Chromium observed a 1,173 ms final-config development source update and persisted browser data after restart, as recorded in the Docker verification ledger. That report records image build/start/HTTP/no-key API/stop evidence, build timing, image size, initial failures and successful reruns. Read that ledger for the complete container verdict rather than inferring it from this summary.

Public-PR CI has separate application and production-Docker jobs, frozen dependencies, lint/types/Vitest/build/Chromium, production audit, smoke/non-root/secret/notice/shutdown checks, read-only permissions and pinned action revisions. Initial branch publication did not trigger hosted CI. The subsequently authorized PR adoption adds full-history source/initializer verification, and GitHub records the actual PR runs and merge state. See [CI verification](CI_VERIFICATION.md) and [remote handoff](REMOTE_HANDOFF.md).

## Acoustic evidence and remaining verification

Three added numerical fixtures cover an analytic Classic second-order path, Eyring dimensional similarity, and two-face partition accounting; the targeted suite passed 18 tests including the unchanged Classic oracle. The original full baseline Chromium run had 44 passes and one 182 ms stress long task against the retained 50 ms limit; its passing targeted rerun does not erase that failure. Final native and production-container complete browser suites each failed 44/45 on the unchanged performance case. A native targeted retry also failed the long-task limit. Complete outcomes and retained failure evidence are recorded separately in [FINAL_VERIFICATION.md](FINAL_VERIFICATION.md). See [acoustic regression](ACOUSTIC_REGRESSION.md).

macOS Docker Desktop, a separate Linux host/ARM64 runtime, remote GitHub Actions, real paid-provider behavior, subjective headphone localization, actual audio hardware/device interruption, physical room calibration and a comprehensive base-image CVE scan remain unverified or separate follow-up. Passing offline rendering and unit tests do not establish these outcomes. [Remaining debt](REMAINING_TECHNICAL_DEBT.md) gives bounded follow-ups.

The completed work branch was pushed to the existing user-supplied repository. Its LICENSE-only `main` remained unchanged at initial publication. The user then authorized PR creation and automatic merge; the content-neutral bridge preserves both that initializer and the immutable extraction history. No public repository, issue, label, Docker image, release or deployment was created. The [maintenance index](README.md) links every requested report and [onboarding](../community/ONBOARDING.md) supports native or Docker contributors.
