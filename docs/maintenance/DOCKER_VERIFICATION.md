# Docker Development and Production Verification Report

Date: 2026-10-13. Source: `v1.0.0-build-week` at
`c8fe24700b67861e2f64fbb8950e9281c0e13a3c` plus documented maintenance/security
changes. This report records actual final-image results and keeps failures separate
from passing checks. Raw logs and host-browser screenshots are retained outside the
repository in sibling `verification-logs/`.

## Actual environment

Windows host with Docker Desktop's Linux **amd64** engine, Docker Engine 29.8.1,
Docker Compose 5.5.1, and host Chromium via Playwright 1.61.1. Containers use Node
22.23.3 / pnpm 11.7.0, fixed in the Dockerfile and `.nvmrc`. Native checks used
Windows Node 22.17.0 / pnpm 11.7.0. No real provider keys were supplied and no paid
AI requests were made.

The tested configuration uses one application container, ordinary Docker
networking and published HTTP ports. No external database, privileged container,
host network, audio device or desktop environment was used. Production was
tested on loopback port 3002; development used loopback port 3001 to keep both
environments independently testable.

## Development

| Check | Actual result |
| --- | --- |
| Development target build | PASS, final build 182.2392096 s; image `sha256:4f426b9f6812f21cc17ebafe838d744828be1122c6e1c990fd5c8babeaa41a7c`, 1,034,153,724 bytes. Shared BuildKit stages/cache were reused; this is not a cold-network timing. |
| Development startup / HTTP health | PASS, final image started fresh, became healthy, and passed HTTP route/static/public/no-key API smoke. |
| Host browser | PASS on final image: host Chromium switched Classic/Hybrid, edited listener X = 2.25 and observed no page errors; screenshot retained. |
| Host source edit / Compose Watch / Next.js hot reload | PASS, latest final-config run observed the temporary React toolbar probe in **1,173 ms without browser refresh**. Earlier stable run observed 920 ms. Probe source bytes were restored. |
| Browser errors during final HMR test | PASS, none observed. |
| Restart / browser scene persistence | PASS, restarting the application preserved the edited browser scene, including the recorded listener X = 2.25. |
| Non-root execution | PASS, UID 1000 (`node`), no host dependency mount. |
| `docker compose -f compose.dev.yaml exec -T web pnpm lint` | PASS, exit 0 after store fix. |
| `docker compose -f compose.dev.yaml exec -T web pnpm typecheck` | PASS, exit 0 after store fix. |
| `docker compose -f compose.dev.yaml exec -T web pnpm test` | PASS, **70 files / 524 tests**, exit 0; final fresh Linux image also passed all 524 tests in 17.07 s. A separate `docker run --rm --network none` ran typecheck before any development server, then lint and units; no network or host dependency mount was used. |
| Regression oracle availability | PASS, versioned Classic benchmark fixtures were packaged and the regression tests passed. |
| Default watcher mode | PASS with Compose Watch and default Next.js watcher; polling was not needed or enabled. |
| macOS/Linux-host/ARM64 HMR | **NOT VERIFIED** in this workspace. |
| Optional Webpack polling override | Syntax/CLI support reviewed; **NOT EXECUTED**, because the normal watcher worked. |

Evidence includes `docker-development-build-verified.log`,
`docker-development-lint-verified.log`,
`docker-development-typecheck-verified.log`,
`docker-development-unit-verified.log`,
`docker-development-hmr-final-config.log`, and `docker-dev-host-browser.png`.

### Initial development failures and corrections

The first attempts to run all three pnpm quality commands failed with
`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`, exit 1. Installation as root recorded
`/root/.local/share/pnpm/store/v11`, while the non-root development user resolved
its default store under `/home/node`. pnpm 11's dependency verification detected
that mismatch and attempted a modules purge; the non-interactive protection
aborted before removal. The direct Node development server could start, so server
startup alone did not prove the contributor commands worked.

The fix sets the same `/pnpm/store` and local `node_modules/.pnpm` configuration
through the shared Docker base environment for install and development, and
provides a container-owned store writable by UID 1000. Dependency validation and
the frozen-lockfile install remain enabled. The rebuilt image recorded
`/pnpm/store/v11`, matching runtime configuration; actual non-root lint/typecheck/
unit reruns then passed. Original failure logs remain as
`docker-development-lint.log`, `docker-development-typecheck.log`, and
`docker-development-unit.log`.

The first HMR probe timed out while Compose was rebuilding a changed Dockerfile.
A subsequent Windows Watch attempt encountered a transient partial file read;
the host source bytes were restored and the development server restarted after
the file completed. Final checks ran after rebuild/sync settled and passed without
a browser refresh. No acoustic formula, test threshold or persistent application
source change was made to bypass these failures. Deployment documentation includes
the corresponding restart/sync troubleshooting.

## Build-context verification

An initial scratch-image context audit found **75 unwanted archive/documentation
files**: including `!docs/` reopened its contents before the selective license
rules. This was an actual exclusion-policy defect, even though secrets were
excluded and the final runner copied only standalone artifacts.

The corrected policy explicitly excludes `docs/**` before reopening only
`docs/licenses/**`; benchmarks likewise exclude contents before allowing the two
versioned oracle JSON files. A new scratch context audit passed: archive and
maintenance documents, Git history, host `node_modules`, `.next`, test outputs and
local tooling were absent; exact GPL/LGPL notice files and both regression oracles
were present. Temporary environment/key canaries were excluded in the original
and corrected policies and removed after testing.

Evidence: `docker-context-audit.log` retains the initial failed policy;
`docker-context-audit-fixed.log` retains the corrected scratch build. The final
context was also retested with temporary environment/key canaries: all excluded
paths were absent, both oracles and GPL/LGPL originals were present, and probes
were removed. See `docker-context-audit-final.json`. The final production build
uses this corrected policy.

## Prior production observations

| Check | Actual result |
| --- | --- |
| Multi-stage production build | PASS on earlier images; corrected-notice rebuild completed in 86.69 s before the final context-policy change. |
| Startup and Docker HTTP health | PASS on earlier production images. |
| `/`, `/classic`, `/lab`, Next.js static and public assets | PASS through HTTP smoke and browser tests. |
| `POST /api/scene/compile` and `/api/scene/explain` without credentials | PASS, established `503 AI_UNAVAILABLE` responses; presets/manual workbench remained available. |
| Full Chromium suite against a production container | PASS, **45/45 in 47.1 s**, on the earlier image; original timing thresholds retained. Final-image failure is recorded below. |
| Runtime user / port / signal | PASS, `node` user, only `3000/tcp`, `SIGTERM`, direct Node server command and Docker init. |
| Compose runtime isolation | Configuration reviewed: read-only root, bounded writable tmpfs/cache, capabilities dropped, no-new-privileges. Final-image guard passed below. |
| Runtime notices | Corrected-notice image inspected: 21 runtime packages / 19 standalone / all five declared dependencies represented, zero missing license metadata or installed originals; every listed notice file present. |
| Original notice collector | Initial Linux result exposed eight missing notices and five missing installed originals; corrected bundled-dependency mapping and pinned notice supplements replaced that failed inventory. |
| Remaining upstream notice exception | Explicit unresolved `client-only@0.0.1` MIT copyright/permission provenance exception; no attribution invented or compliance certification claimed. |
| Targeted image secret scan | PASS on corrected-notice image: 1,453 text files / 20,655,513 bytes, zero matching credential values/private-key blocks; no `.env`/`.git` or provider-key symbols in client static files. See security report for scope. |
| Real paid-provider calls / subjective headphone listening | **NOT RUN**. |

The corrected-notice inspection above applies to immutable image reference
`sha256:fd3cddcb4a968505a863f05c175c4e3fb92cc71ad1d6305a5672bffeecc5cfc9`,
which is superseded by the final clean rebuild including the maintainer-rule setting. Its build log is
`docker-production-build-verified.log`; earlier browser evidence is
`docker-production-e2e.log`. [SECURITY_LICENSE.md](SECURITY_LICENSE.md) records the
Linux notices and bounded scan evidence. Those scans do not replace a complete
OS-image vulnerability audit or establish absence of every secret encoding.

## Production

| Final check | Actual result |
| --- | --- |
| Immutable image reference | PASS: `sha256:aff89b6ca4e612cdaca8914ab328729d9022bd15727d05e723422e5ce909d313` |
| Clean build | PASS: `docker compose build --no-cache`, 201.5614093 s. No host modules, `.next` or untracked local files were required. Base image was already pulled; timing includes concurrent local build activity. |
| Image size | 386,448,422 bytes (368.55 MiB), inspected locally; no extreme-size optimization attempted. |
| Clean-image startup / health | PASS: force-recreated container became healthy. |
| HTTP / API / static/public smoke | PASS: `/api/health`, `/`, `/classic`, `/lab`, generated JS, procedural WAV and audio attribution; both AI routes return `503 AI_UNAVAILABLE` without keys. |
| Runtime guard / notices | PASS within stated scope: UID 1000, only 3000/tcp, excluded Git/secrets/tests/root source, all listed notices present, all five declared dependencies represented. One known upstream `client-only` notice exception remains unresolved. |
| Runtime isolation | PASS: read-only root; bounded tmpfs/cache; `cap_drop: ALL`, `no-new-privileges`, init; no audio device, privileged mode, database or host network. |
| Image secret scan | PASS within stated patterns: 1,453 text files / 20,655,557 bytes; no matching credential values, private keys, `.env`/`.git` or browser credential symbols. |
| Complete production-container Chromium suite | **FAIL: 44/45 passed**, stress Worker p95 63 ms against unchanged `<12 ms` limit. Earlier 45/45 run in 47.1 s is separate evidence, not the final verdict. |
| SIGTERM stop | PASS: Compose stop 1.1359737 s, exit 143, OOM false. Debug run on the same immutable image took 1.0496091 s and logged cleanup start **and completion**, exit 143/OOM false. |
| Restart after stop | PASS: healthy again and complete HTTP smoke passed. |
| macOS/separate Linux host/ARM64 | NOT VERIFIED. Linux amd64 containers on Windows Desktop do not prove other hosts or architectures. |
| Base OS-image CVE scan | NOT PERFORMED. The clean production application-dependency audit is a separate check. |

Final native full-suite Chromium verification also failed 44/45: Worker p95
18 ms against the unchanged 12 ms budget. A targeted native retry passed the
Worker assertion but observed a 191 ms long task against the independent 50 ms
limit. These failures remain unresolved. Contemporaneous read-only host metrics
showed other browsers/processes/containers active; that observation does not
establish the cause or excuse the failure. No timing threshold was changed.

The first shutdown assertion incorrectly required exit 0. Installed
`next@16.3.8` `dist/server/lib/start-server.js` implements graceful SIGTERM
cleanup and then deliberately exits 143 (`128 + 15`): it closes HTTP, awaits Next
cleanup and flushes traces first. CI now accepts only 0 or this known signal exit,
rejects every other code and requires OOM false. The actual cleanup-finished debug
run corroborates this behavior; it does not test drainage of every possible
long-running provider request. No custom server or signal wrapper was added.

Final evidence: `docker-production-build-final.log`,
`docker-production-start-final.log`, `docker-production-smoke-final.log`,
`docker-production-runtime-final.log`, `docker-production-e2e-final.log`,
`docker-production-shutdown-debug-final.log`/`.json`,
`security-final-no-cache-image-scan.json`, and
`security-final-no-cache-image-config-history.json`. Compact copies are in
[evidence](evidence/README.md).

No Docker image was published and no public deployment was created. Native pnpm
and Vercel remain independent supported workflows. Docker serves the Next.js
server; Web Audio/HRTF, acoustic Workers and local audio storage continue in the
host browser. This verification does not claim Docker improves their computation.

Follow [Docker development/self-hosting](../deployment/docker.md) for exact
commands and [CI_VERIFICATION.md](CI_VERIFICATION.md) for workflow status.
