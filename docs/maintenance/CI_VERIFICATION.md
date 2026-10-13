# CI Verification Report

Date: 2026-10-13. Workflow: [`.github/workflows/ci.yaml`](../../.github/workflows/ci.yaml).

## Implemented checks

Every pull request, push to the extracted repository's `main`, and manual dispatch
runs two independent jobs:

| Job | Checks |
| --- | --- |
| Application | Full-history checkout, immutable source/initializer verification, Node from `.nvmrc`, pnpm 11.7.0, frozen dependency install, ESLint, production dependency advisory audit, TypeScript, Vitest, production build, Chromium installation and all existing Playwright tests. |
| Docker | Both Compose configurations, clean production image build/start/health, three application routes, packaged static/public assets, both no-key AI API contracts, non-root runtime, excluded source/secret paths, actual runtime notice files/provenance and graceful shutdown. |

The application job builds once and invokes Playwright directly against its usual
production server. The separate `playwright.container.config.ts` can run that
same suite against an already running container; the original config still never
reuses an existing native server. Docker's required CI smoke is HTTP-based, while
the full browser suite runs in the application job.

## Security and reproducibility review

- `permissions: contents: read`; no deployment, package publication or issue-write permissions.
- Uses `pull_request`, not `pull_request_target`; fork contributions receive no deployment/API credentials.
- Checkout disables persisted Git credentials. No workflow step publishes images, repositories or deployments.
- `AI_ENABLED=false`; unit tests inject/mock providers. CI needs no paid API or real key.
- Node 22.23.3 and pnpm 11.7.0 match Docker. Lockfile installation is frozen.
- `pnpm audit --prod --audit-level=low` rejects production advisories. The unresolved
  development-only `braces` high advisory remains documented and unsuppressed;
  the production audit does not imply all development dependencies are clear.
- The runtime guard rejects missing license metadata, installed originals, notice
  files and unreviewed provenance gaps. It retains the exact documented
  `client-only@0.0.1` exception: upstream lacks an original notice. An exception
  is not a resolved copyright audit; see [SECURITY_LICENSE.md](SECURITY_LICENSE.md).
- Action references are immutable upstream commit SHAs, verified using `git ls-remote` on 2026-10-13:

The Docker job also installs official Compose 5.5.1 with Linux x86_64 SHA-256
`db1889184726840f75c4f9c001048430d4f25b3be3cb084d3ddd762bc0aed576`
and checks it before execution. The release asset digest and separately fetched
official `.sha256` asset matched. See the
[official release](https://github.com/docker/compose/releases/tag/v5.5.1).

| Upstream action | Release | Verified commit |
| --- | --- | --- |
| [`actions/checkout`](https://github.com/actions/checkout/releases/tag/v7.0.1) | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [`actions/setup-node`](https://github.com/actions/setup-node/releases/tag/v7.0.0) | v7.0.0 | `820762786026740c76f36085b0efc47a31fe5020` |
| [`actions/upload-artifact`](https://github.com/actions/upload-artifact/tree/cf430e030ddbb5b0abf93d22962f4752f3646cd9) | v7 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |

## Actual verification status

The following hosted-CI entry records the initial publication stage. The user
subsequently authorized a history-preserving PR adoption; its actual hosted runs
and merge state are recorded by GitHub on the PR. See
[remote handoff](REMOTE_HANDOFF.md) and [ADR 0005](../adr/0005-preserve-destination-initializer.md).

| Verification | Result |
| --- | --- |
| `docker compose config --quiet` | PASS, local Docker Compose 5.5.1 accepted production configuration. |
| `docker compose -f compose.dev.yaml config --quiet` | PASS, same local engine accepted Watch/development configuration. |
| Native ESLint / TypeScript / production build | PASS, exit 0 on Windows Node 22.17.0 / pnpm 11.7.0; final reruns are recorded in the final report. |
| Native Vitest | PASS, 70 files / 524 tests, exit 0. |
| Linux development-container ESLint / TypeScript / Vitest | PASS, non-root container; 70 files / 524 unit tests after resolving the recorded pnpm store mismatch. Final rebuilt image also passed all three checks in a fresh network-disabled container, 17.07 s. |
| Final production image health / HTTP/API smoke / runtime guard / restart | PASS on immutable final image `sha256:aff89b6ca4e612cdaca8914ab328729d9022bd15727d05e723422e5ce909d313`; runtime and secret/notice inspections passed within their documented scope. |
| Earlier production-container Chromium suite | PASS, 45/45 in 47.1 s on an earlier image; this does not supersede the final failures below. |
| Final native full Chromium suite | FAIL, 44/45 passed; existing entity-limit stress measured Worker p95 18 ms against the unchanged 12 ms limit. |
| Final production-image full Chromium suite | FAIL, 44/45 passed; same stress gate measured Worker p95 63 ms against the unchanged 12 ms limit. |
| Native targeted stress retry | FAIL, 191 ms long task against the unchanged 50 ms limit; Worker timing gate passed in this retry. |
| Production dependency audit | PASS, zero low/moderate/high/critical findings across 99 production/optional entries. |
| All-dependency advisory audit | FAIL, one development-only high `braces` advisory; upstream published patch unavailable. No suppression. |
| `node --check` for smoke/runtime guard/runtime-license scripts | PASS. |
| Git whitespace check | PASS at current review. |
| Docker/Compose/workflow review | Initial shutdown exit assertion defect found through actual stopping: zero-only rejected Next's deliberate SIGTERM 143; corrected to allow only 0/143 and reject other exits/OOM. Fork-secret, runtime-guard and watch review found no further actionable defects. |
| Actual final production stop | PASS handling: Compose stop 1.1359737 s, exit 143, OOM false; same immutable image debug rerun 1.0496091 s, exit 143, OOM false, both cleanup-start and cleanup-finished logs observed. Restart health/HTTP smoke passed. |
| GitHub-hosted workflow execution | **NOT EXECUTED**: the completed work branch was subsequently pushed to the user-supplied remote, but `push` only watches `main`. The default branch still contains only its initial LICENSE, and GitHub lists zero workflows/runs. See [remote handoff](REMOTE_HANDOFF.md). Local checks do not prove GitHub runner results. |
| Docker runtime/integration evidence | See [DOCKER_VERIFICATION.md](DOCKER_VERIFICATION.md), which records actual local image/start/smoke/shutdown results. |
| Final native/Chromium regression evidence | See [FINAL_VERIFICATION.md](FINAL_VERIFICATION.md) and [ACOUSTIC_REGRESSION.md](ACOUSTIC_REGRESSION.md). |

Initial publication could not create a normal PR because the LICENSE-only
`main` and extraction branch had no common ancestor. The subsequent authorized
content-neutral bridge retains both roots and enables the normal PR, without
rewriting published history or changing the default branch. Linux
runner scheduling and browser timing can differ from the Windows host; preserve
any failures rather than weakening the existing scientific/performance thresholds.
The original baseline browser failure remains documented separately in
[BASELINE_TEST_REPORT.md](BASELINE_TEST_REPORT.md).

The final Chromium failures are unresolved performance-gate failures, even though
an earlier full run passed. No threshold was loosened, test skipped or failure
converted to a pass. The application CI job will retain those assertions and may
fail on a runner until the underlying timing behavior is understood and addressed.

The installed `next@16.3.8` implementation in
`dist/server/lib/start-server.js` (lines 319-389) awaits HTTP close, Next server
cleanup and trace flushing before explicitly calling `process.exit(143)` for
SIGTERM. CI's shutdown case accepts only 0 or 143, and still fails for other exit
codes or OOM. Exit 143 alone is not proof every in-flight request was drained;
root verification observed cleanup-start/cleanup-finished debug evidence on the
same immutable final image. Evidence is retained in
`docker-production-shutdown-debug-final.log` and its JSON result beside other logs.

Local review confirmed assertion failures and rejected fetches exit the Node
smoke/runtime scripts nonzero; the workflow shell propagates failing commands.
Health checks return failure on HTTP/body/network errors. Runtime guard code is
sent on stdin to Node in the runner, so it does not require copying maintenance
scripts into the final image. Its narrow reviewed provenance exception is
reported as unresolved, with no general license-gap suppression. Watch ignores
dependency/build/secret trees, uses image-owned modules and rebuilds dependency
inputs; source HMR and restart persistence were observed on the Windows host.

These are local reviews and actual local runs. Neither Docker Engine results nor
the verified upstream action pins prove that the GitHub-hosted workflow has run.

## Subsequent hosted PR verification

[PR #1](https://github.com/kekekewww/Echo-Canva-Web/pull/1) was created after the
user explicitly authorized creation, push and automatic merge. Its first real
[hosted run](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38349805880)
tested head `e90ed3b24f07b0a6dea0ab4edec6eeb3b6679d21`.

The Docker job **FAILED** during development Compose validation: the runner's
preinstalled version rejected `initial_sync`. It did not build or start an image.
The separate application job **PASSED** installation, source/initializer
verification, ESLint, production advisory audit, TypeScript, 70 files / 524 units
(7.95 s), production build and all **45 Chromium tests** (42.3 s), with no test
threshold changes. This hosted result is independent of the earlier local
44/45 failures and does not erase them.

The correction pins and checksum-verifies Compose 5.5.1 in CI before validating
either configuration; it retains the development initial sync behavior and all
existing test thresholds. Subsequent run outcomes remain visible in the PR's
checks. The first failed run is not erased or treated as a passing Docker run.
