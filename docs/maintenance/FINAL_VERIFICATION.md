# Initial Extraction Verification Report

Date: 2026-10-13, Asia/Taipei. This is the initial extraction's retained ledger.
The subsequent performance/dependency/notice fixes and new integrated outcomes
are in [VERIFICATION_FIXES.md](VERIFICATION_FIXES.md). The failures below describe
the earlier tree and are not rewritten by later passes.
**At this initial stage full browser acceptance was not passing:** the unchanged entity-limit performance
case failed in both final complete Chromium runs and in a targeted native retry.
This report preserves those results rather than treating earlier passing runs as
the final verdict. All other checks below have their own scope and status.

## Source and compatibility

| Check | Actual result |
| --- | --- |
| Permitted upstream tag | `v1.0.0-build-week`, commit `c8fe24700b67861e2f64fbb8950e9281c0e13a3c` |
| Independent extraction root | PASS: `7c03345925369529a998316670e3fcece896b68c`, tree `ca4a2543f6f0e8848fe8d8eb57f3ed70faaba294`, all 291 source paths/blobs identical |
| Source verifier | PASS: `node scripts/verify-source-baseline.mjs` |
| Archive integrity | PASS: all 73 original snapshots/relocations match original Git blobs and SHA-256 |
| Protected runtime | PASS: zero diff from extraction root in `src/acoustics`, `src/audio`, `src/workers`, `src/domain`, `src/hooks`, `src/components`, `schemas`, `benchmarks`, `public` |
| Other application source changes | Only existing AI provider/compile/explain safety changes and new request-security/health modules; independently authored and listed in ORIGIN |
| Original remote refs | PASS: read-only `git ls-remote` before/after snapshots identical |
| Later Main product features | None copied, merged or cherry-picked; Main diff was inspection only |
| Browser audio/local assets | Original Web Audio/HRTF/Worker/IndexedDB code unchanged; offline rendered-audio, persistence and editor cases passed |
| Schema/formula/oracle/timing thresholds | Unchanged; three independent numerical fixtures added, no expected-value regeneration to conceal a failure |

The original repository, its history/tags/release and deployment were not written
to. The independent work branch is `chore/open-source-extraction`. Following the
local verification, it was pushed to the existing user-supplied new repository;
that repository's LICENSE-only `main` remained unchanged at initial publication. See
[source extraction](SOURCE_EXTRACTION.md) and [remote handoff](REMOTE_HANDOFF.md).

The user subsequently authorized PR creation and automatic merge. The destination
initializer was bridged into the work branch without changing its tree; the
source verifier now requires exactly that initializer and the unchanged
extraction root. This changes the reviewed Git ancestry, not any acoustic model
or the local check outcomes below. [ADR 0005](../adr/0005-preserve-destination-initializer.md)
records the decision; GitHub records the later PR checks and merge outcome.

## Executed checks

| Check | Actual result |
| --- | --- |
| Native frozen dependency install | PASS, updated manifest/lock consistency verified |
| Final native ESLint | PASS, exit 0, no warnings |
| Final native TypeScript | PASS, exit 0 |
| Final native Vitest | PASS: 70 files / 524 tests, exit 0, 13.44 s |
| Final native production build | PASS, exit 0; `/`, `/classic`, `/lab`, dynamic health and both AI API routes |
| Native `pnpm dev` | PASS: actual host browser switched Classic/Hybrid, edited listener and observed no page errors |
| Maintainer instructions | PASS: Next auto-appending disabled; AGENTS SHA-256 remained `007460aed8256f15556b74efa00b404fbf12d2b18fd6961e020e1ec99b852e93` after native development restart |
| Final native complete Chromium | **FAIL: 44 passed / 1 failed**. Stress Worker p95 18 ms, required <12 ms |
| Final native targeted stress retry | **FAIL**. Worker assertion passed, then 191 ms long task exceeded 50 ms |
| Final Linux development image build/start/HTTP | PASS; host browser Classic/Hybrid/manual editing also passed |
| Windows Compose Watch/HMR/restart | PASS: final-config source probe appeared in 1,173 ms without refresh; scene X=2.25 persisted after restart; source bytes restored |
| Final fresh development image quality checks | PASS: non-root, network-disabled typecheck before server startup, then lint and 70 files / 524 units, 17.07 s |
| Final production no-cache image build | PASS: 201.5614093 s; no host dependency/generated input required |
| Final production start/health/routes/assets/API smoke | PASS; both AI APIs use established no-key 503 fallback; manual authoring remains usable |
| Final production complete Chromium | **FAIL: 44 passed / 1 failed**. Stress Worker p95 63 ms, required <12 ms |
| Production isolation/runtime guard | PASS within scope: UID 1000, read-only root, dropped capabilities, no-new-privileges, only application port, retained notices and excluded source/tests/secret paths |
| Production SIGTERM/restart | PASS: cleanup-finished debug log, 1.0496091 s, exit 143/OOM false; Compose stop/restart and HTTP smoke passed |
| Production dependency audit | PASS: zero advisories in recorded production/optional graph |
| Full dependency audit | **FAIL: one high development-only `braces` advisory**, published patch unavailable at verification time; no suppression |
| Targeted final-image secret scan | PASS within documented patterns: 1,453 text files / 20,655,557 bytes, zero matching credentials/private keys/forbidden paths/client credential symbols |
| Runtime license inventory | 21 packages, all five declared dependencies represented; every listed notice exists; **one unresolved upstream `client-only@0.0.1` notice exception** |
| Compose/workflow static review | Both Compose configurations accepted; minimal-permission CI and pinned actions reviewed; local corrected shutdown acceptance passed |
| Markdown/provenance/whitespace checks | Maintained links and archive/root integrity checked; `git diff --check` passed |

Full command logs are retained in sibling `verification-logs/`. Selected portable
evidence is in [evidence](evidence/README.md). Native tests used Windows Node
22.17.0/pnpm 11.7.0; Linux containers use pinned Node 22.23.3/pnpm 11.7.0 under
Docker Desktop, Engine 29.8.1, Compose 5.5.1, amd64. Chromium is supplied by Playwright
1.61.1. No real API key or paid provider call was used.

Final production image: `sha256:aff89b6ca4e612cdaca8914ab328729d9022bd15727d05e723422e5ce909d313`,
386,448,422 bytes (368.55 MiB). [Docker verification](DOCKER_VERIFICATION.md)
records both environments, image timing/size, actual initial failures and fixes.

## Failures retained and interpretations

The original extracted baseline passed 508 units but failed its full Chromium
run, 44/45, on a 182 ms long task; its targeted retry passed. An earlier production
image passed all 45 Chromium tests in 47.1 s. Final complete native/container
runs and the final native retry failed as recorded above. None was hidden,
skipped, relabeled as a pass or resolved by changing thresholds. All 44 other
cases passed, including actual OfflineAudioContext rendering, editor modes,
geometry, serialization/persistence, failure fallbacks and local-asset handling.

Other host browser/process/container activity was observed during investigation.
That is an environment observation, not a demonstrated causal explanation or
proof that performance is acceptable. Reproduce the unchanged case on a controlled
machine/GitHub runner and investigate before claiming complete browser acceptance.

Initial pnpm dev commands failed because install/runtime store paths differed;
the shared container-owned store fixed the mismatch and actual reruns passed.
Initial context auditing exposed unwanted historical documentation; explicit
selective exclusions fixed it and canary retesting passed. Initial Linux notice
collection missed bundled/native notices; actual inventory and pinned originals
were corrected. The initial stop assertion accepted only zero; Next 16.3.8's
built-in completed SIGTERM cleanup intentionally returns 143. CI now accepts
only 0/143 and still rejects all other codes/OOM; debug evidence confirms completion.

## Not executed or unresolved

- At initial publication, hosted Actions and PR merge were not performed; the
  branch push did not trigger CI. The later user-authorized PR adoption and
  actual GitHub outcomes are separate from these completed local tests; see the
  remote handoff and PR. No repository/labels/issues, images, releases or
  deployment were created, and no published history was rewritten.
- macOS Docker Desktop, a separate Linux host, ARM64 and optional polling fallback
  were not exercised. Default Compose Watch worked on Windows without polling.
- No subjective headphone/HRTF evaluation, physical audio-device interruption,
  physical calibration or room-measurement accuracy validation was performed.
- No paid API integration or comprehensive Debian/Node-image CVE scan was run.
- Full-browser performance, the `braces` advisory and `client-only` original-notice
  provenance remain unresolved; public shared-key AI also needs operator access
  control and spending limits.

The maintained [report index](README.md) links every requested deliverable.
[Remaining debt](REMAINING_TECHNICAL_DEBT.md) and [contributor onboarding](../community/ONBOARDING.md)
give follow-up scopes. Native pnpm and Docker are supported alternatives; existing
Vercel deployment configuration is retained. There is no added desktop/native
runtime, database, queue or microservice.
