# Docker development and self-hosting

Docker is an optional standard development environment and an optional deployment
target. Native `pnpm install --frozen-lockfile` / `pnpm dev` and Vercel deployment
remain supported. The application needs one Next.js server and no database.

## Prerequisites and versions

- Docker Desktop on Windows/macOS, or a compatible Linux container engine.
- Docker Compose **2.32 or later** for Watch with `initial_sync`.
- Linux containers, Internet access for the first dependency/image download,
  and a browser on the host.

The Dockerfile fixes Node **22.23.3** on Debian Bookworm slim, including the
multi-platform registry digest, and pnpm **11.7.0**. CI uses the same Node patch
from `.nvmrc`; `package.json` and the frozen lockfile define dependency versions.
No Node.js or pnpm installation on the host is required for Docker development.

The Docker CI job installs Compose **5.5.1** from its official Linux release and
verifies a pinned SHA-256 before execution, matching the locally validated
version. Hosted runners' preinstalled Compose may be too old for `initial_sync`;
the contributor minimum remains 2.32.

Check your engine before starting:

```sh
docker version
docker compose version
```

## Development

From the repository root:

```sh
docker compose -f compose.dev.yaml up --build --watch
```

Open <http://localhost:3000>. Logs and compilation errors appear in the terminal.
Use a second terminal for checks:

```sh
docker compose -f compose.dev.yaml exec web pnpm lint
docker compose -f compose.dev.yaml exec web pnpm typecheck
docker compose -f compose.dev.yaml exec web pnpm test
docker compose -f compose.dev.yaml logs -f web
```

Compose Watch synchronizes allowed source, public assets, schemas, scripts, tests,
versioned regression oracles and configuration into the container. Next.js performs hot reload after a source
save. Changes to `next.config.ts` restart the development process; changes to the
manifest, lockfile, workspace policy, Dockerfile or ignore policy rebuild the image.
There is no bind mount for `node_modules`: Linux native dependencies stay inside
the image. `.next`, dependency trees, test output, local environment files and Git
data are excluded from sync and the build context. Commands run as the `node` user.
The build and development targets share a fixed `/pnpm/store` configuration and
local virtual-store layout, so pnpm 11's dependency verification sees the same
installation layout when contributors run checks as non-root. Verification is
retained; the development store is container-owned and never uses a host path.

Save source edits in your host editor. Changes made only through `exec` inside the
container disappear when it is recreated. To add dependencies, change and review
the host manifest and lockfile together; if working exclusively with Docker,
run pnpm in the development container and use `docker compose cp` to copy those
two files back to the host before rebuilding. Never copy container `node_modules`.

Stop with Ctrl+C or:

```sh
docker compose -f compose.dev.yaml down
```

Stopping/recreating containers does not edit host source or delete browser storage.
Presets, scene history and imported audio remain in the browser's localStorage /
IndexedDB, scoped to the site's origin. Changing the host/port creates a different
browser origin; export scenes before changing it. No audio device or privileged
container access is needed.

### Hot reload on Docker Desktop

Watch copies edits into the Linux filesystem, avoiding the usual bind-mount file
event forwarding issue on Windows/macOS. Polling is **off by default**. First
confirm the terminal shows a Compose sync event and a Next.js rebuild. If it does
not, check Docker Desktop sharing permissions, Compose version, the ignored paths,
and whether you edited the host checkout started by Compose.

If files are synchronized but the Next.js watcher still misses changes on your
specific engine/filesystem, save the following optional override outside the
repository as `compose.polling.yaml`, and use its absolute path as the second `-f`:

```yaml
services:
  web:
    environment:
      WATCHPACK_POLLING: "1000"
    command: ["node", "node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "0.0.0.0", "--port", "3000"]
```

```sh
docker compose -f compose.dev.yaml -f /absolute/path/compose.polling.yaml up --build --watch
```

This opts into Webpack's one-second polling only when needed. Remove the override
after resolving the underlying watch issue; polling consumes additional CPU.
Polling cannot repair a missing Compose sync event. Windows PowerShell accepts
a quoted absolute Windows path for the override. Actual tested platforms and
watch results are recorded in the [verification report](../maintenance/DOCKER_VERIFICATION.md).

A transient Windows Watch file read can expose an incomplete TypeScript file
while your editor saves it, producing a parse error. Wait for the completed sync
and save again; if the server does not recover, stop and restart the development
Compose command after the host file is complete. Inspect the container logs and
compare the synchronized source before changing application code. A rebuild
triggered by dependency or Dockerfile edits also temporarily replaces the server;
perform hot-reload checks after that rebuild settles.

An initial container verification found pnpm 11 trying to reinstall dependencies
because installation as root and commands as `node` used different default store
paths. The shared Docker store configuration above resolves that mismatch while
retaining pnpm's dependency checks. The initial failures and successful reruns
remain in the verification report.

## Production

```sh
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

Open <http://localhost:3000> or request <http://localhost:3000/api/health>.
`/`, `/classic` and `/lab` provide the same manual/preset features without AI keys.
The health endpoint returns `{"status":"ok"}` with no credentials, environment
values, external-provider probes or browser audio checks.

The production build uses Next.js `output: "standalone"`. Its final image contains
the traced server dependencies, generated server, Next.js static assets, public
assets, MIT license and third-party runtime notices. It runs as non-root, drops
Linux capabilities, disallows privilege escalation, and uses a read-only root
filesystem with bounded writable temporary/cache directories. Docker's init
forwards signals and reaps children. Node launches directly through exec-form CMD;
Compose allows 30 seconds for SIGTERM shutdown.

Next.js 16.4.2's built-in signal handler stops accepting new connections, awaits
HTTP/server cleanup and trace flushing, then deliberately exits **143** for
SIGTERM (`128 + 15`). CI accepts only 0 or this known signal exit and rejects
other exits, including forced-kill 137, and any OOM indication. An initial
zero-only CI assertion would have rejected the observed normal stop and was
corrected after inspecting the installed server implementation. Cleanup debug
logs and actual stop timing are recorded in the verification report.

No source checkout, Git history, test suite, pnpm store or local secret files are
copied into the final runtime. The Dockerfile uses no credential build arguments.
The `.dockerignore` allowlist excludes local files before any build stage receives
the context. Do not place secrets inside source code or public assets.

For a direct image workflow:

```sh
docker build --target runner -t echo-canvas-web:local .
docker run --rm --init -p 127.0.0.1:3000:3000 echo-canvas-web:local
```

The direct image has the same non-root runtime and HTTP healthcheck. Compose adds
the read-only filesystem and capability restrictions shown in `compose.yaml`.

### Runtime configuration and public access

Both Compose files publish to `127.0.0.1` by default. Set `HOST_PORT` to choose a
different host port, and `HOST_BIND` only when deliberate external access is
required. Next.js listens on `0.0.0.0` **inside** the container. For remote browsers,
use an operator-managed HTTPS reverse proxy: Web Audio/browser capabilities depend
on the browser and secure context. Localhost is suitable for local development.

AI is optional and disabled by default in Compose. Runtime variables are:

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_ENABLED` | `false` | Explicit server-side AI opt-in; production also requires `true`. |
| `AI_PROVIDER` | `openai` | Existing `openai` or `openrouter` provider selection. |
| `OPENAI_API_KEY` | empty | Optional server-side OpenAI credential. |
| `OPENROUTER_API_KEY` | empty | Optional server-side OpenRouter credential. |
| `OPENAI_REASONING_EFFORT` | `medium` | Existing compiler setting. |
| `AI_REQUEST_TIMEOUT_MS` | `30000` | Existing API timeout in milliseconds. |
| `HOST_BIND` | `127.0.0.1` | Host publish interface. |
| `HOST_PORT` | `3000` | Host publish port. |

Pass optional AI credentials through a deployment secret environment or an
operator-owned, untracked runtime environment file using Compose `--env-file`.
Compose does not load Next.js `.env.local` automatically; local env files are
excluded from the image. Environment interpolation happens at container creation,
so changing a credential requires recreation, **not** image rebuild. Values are
visible to administrators through Docker inspection; restrict access to the daemon.
Do not commit credentials, print `docker compose config` when keys are set, use
`NEXT_PUBLIC_*` for provider keys, or provide them as Docker build arguments.

Paid AI endpoints require an authenticated operator gateway and provider spending
limits before public exposure. Application limits bound local process requests;
they do not provide end-user authentication or a distributed cost quota. Review
[SECURITY.md](../../SECURITY.md) before enabling a shared key. No-key requests
return the established `503 AI_UNAVAILABLE` contract and manual scenes keep working.

## Browser/server responsibility

The container serves Next.js and optional server API routes. Geometry Workers,
Web Audio `AudioContext`, HRTF panners, playback and user-imported audio storage
execute in each user's browser. Docker does not accelerate browser ray tracing or
audio rendering. User audio stays local and does not need a server upload, audio
device mount, desktop environment or native audio runtime.

## Repeatable verification

After starting production, hosts with Node available can run the same HTTP smoke
used in CI:

```sh
node scripts/docker-smoke.mjs http://127.0.0.1:3000
```

The smoke expects AI disabled and checks health, all three main routes, a generated
JavaScript asset, the public audio license and both AI API fallback responses.
The standard unit suite uses AI mocks and needs no paid provider or audio device.

To run the existing Chromium suite against a container rather than starting the
native server, install the native development dependencies/Chromium and use:

```sh
pnpm exec playwright install chromium
pnpm exec playwright test --config playwright.container.config.ts
```

`PLAYWRIGHT_BASE_URL` selects another running container URL. The separate config
does not spawn a server; the ordinary `pnpm e2e` production-server behavior stays
unchanged. Automated browser/audio rendering tests do not replace headphone
listening and subjective positioning checks.

CI has separate application and production-Docker jobs. It checks both Compose
configurations, builds a fresh image, starts it, runs HTTP/no-key API smoke, checks
the non-root runtime and absence of local source/secret trees, runs a report-only
image vulnerability scan, and verifies a clean stop. Production dependency advisories fail CI. Development-only braces has a
tested, lockfile-hashed local nesting guard; version-based audit still reports the
upstream advisory without suppression. Both client-only markers are independently
reimplemented under project MIT; runtime notice checks allow no gap or exception.
Patches are copied before frozen installation and patch edits rebuild the Watch
container. These checks are not a complete license compliance audit. CI has
read-only repository permissions and no deployment/API secrets.
Local pass/fail results, image size/build time and unverified platform checks are
in [DOCKER_VERIFICATION.md](../maintenance/DOCKER_VERIFICATION.md); workflow execution
evidence is in [CI_VERIFICATION.md](../maintenance/CI_VERIFICATION.md). The subsequent
fixed-tree results are in [VERIFICATION_FIXES.md](../maintenance/VERIFICATION_FIXES.md).

## Image vulnerability scan

The `docker` CI job scans the freshly built `echo-canvas-web:local` runner image
with [Grype](https://github.com/anchore/grype) **v0.118.0** through
`anchore/scan-action` v7.4.2, pinned by commit SHA. The action's installer is
pinned to the Grype release tag and verifies that release's checksums. Grype reads
the image from the runner's Docker daemon (`docker:` source); nothing is pushed or
pulled from a registry. It downloads its vulnerability database from Anchore at run
time, so results for the same image change as advisories are published. The scan
needs no secrets and runs under the workflow's `contents: read` permission
([ADR 0007](../adr/0007-report-only-image-vulnerability-scan.md)).

The scan is **report-only**. Findings never fail the job, and a scanner or database
download failure is tolerated (`continue-on-error`) and reported as a missing
report. `scripts/summarize-image-scan.mjs` prints severity counts, fix availability
and the Critical/High matches (first 50) to the job log and the run's step summary.
The complete Grype JSON is uploaded as the `image-vulnerability-scan` artifact for
30 days. To scan locally with an installed Grype:

```sh
docker build --target runner -t echo-canvas-web:local .
grype docker:echo-canvas-web:local -o json --file grype-results.json
node scripts/summarize-image-scan.mjs grype-results.json
```

### Triage

Review the summary when a PR changes the Dockerfile, lockfile, Node version or
runtime files, and at each base-image refresh below. For each Critical or High
match:

1. **Locate the layer.** `deb` matches come from the Debian Bookworm base;
   `binary`/Node and npm-bundled matches come from the Node image; `npm` matches
   under `/app` come from the traced application dependencies, which `pnpm audit
   --prod` already gates.
2. **Fix available upstream?** If the base image has a newer patch or rebuilt
   digest with the fix, refresh the digest (below). Do not add `apt-get upgrade`
   or ad hoc package installs to the runner; they make the image unreproducible
   and bypass the pinned base.
3. **No fix, or not reachable?** Record it in a tracking issue with the CVE/GHSA,
   package, layer, and why it is or is not reachable. The runtime is a non-root
   Node server with a read-only root filesystem under Compose and no shell use by
   the application, which lowers but does not remove exposure. Do not suppress
   findings with an ignore file without a reviewed, dated justification per entry.
4. **Application dependency findings** follow the existing audit and patch policy
   ([ADR 0006](../adr/0006-local-dependency-patches.md)).

A follow-up change can make the scan blocking (for example, fixable Critical
findings) once the base-image baseline is triaged; that would change PR
acceptance and should be recorded as an ADR update.

### Refreshing the pinned base-image digest

The Dockerfile pins `node:22.23.3-bookworm-slim` by its multi-platform registry
digest (both the `base` and `runner` stages). Refresh it:

- **Monthly**, and whenever the scan reports a Critical/High base-image match with
  an available fix, or a Node 22 security release is published.
- By resolving the current digest of the same tag (for example
  `docker buildx imagetools inspect node:22.23.3-bookworm-slim`, using the
  top-level multi-platform index digest), updating both `FROM` lines and the
  verification date comment together. A Node patch change also updates `.nvmrc`,
  documentation and CI as described in Maintenance below.
- In a focused `build(docker): refresh Node base-image digest` PR that includes the
  scan summary before and after, and the passing Docker CI job.

## Maintenance

Update the Docker Node tag **and digest**, `.nvmrc`, documentation and CI together
when applying a supported Node 22 patch. Keep pnpm aligned with `packageManager`;
review lockfile/allowBuilds changes and run native plus Docker verification. Third-party
licenses collected during the Linux build cover its actual traced dependencies;
the original MIT license does not replace their redistribution conditions.

Stop production without changing repository or browser data:

```sh
docker compose down
```

Vercel continues using the ordinary Next.js build. Container configuration adds an
independent self-hosting option and does not modify the existing deployment.
