# Contributing to Echo Canvas Web

Echo Canvas Web welcomes documentation, browser audio, geometry, acoustic-model, accessibility, and testing contributions from sciwork and other open-source communities. Read the [Code of Conduct](CODE_OF_CONDUCT.md) and [model boundaries](docs/ACOUSTICS.md) before making changes.

## Start the application

Choose either workflow. Docker is optional; neither workflow needs an API key or a physical audio device for automated tests.

### Native Node.js

Use Node.js 22.23.3 and pnpm 11.7.0, matching the container and CI toolchain. Install pnpm using the method appropriate for your system, then run:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000 with current desktop Chrome or Edge. Press Play to start browser audio; headphones are useful for listening checks.

### Docker

Install Docker Engine or Docker Desktop with Compose 2.32 or newer. No host Node.js installation is needed.

```sh
docker compose -f compose.dev.yaml up --build --watch
```

Open http://localhost:3000. Compose Watch synchronizes source changes and isolates Linux dependencies from host dependencies. See [Docker development and deployment](docs/deployment/docker.md) for troubleshooting and optional polling.

## Find a first task

The [initial community issue drafts](docs/community/INITIAL_ISSUES.md) include a documentation task, a deterministic test task, and a bounded visualization task. They are drafts for maintainers to publish; no GitHub issue is created by this checkout. See the [onboarding guide](docs/community/ONBOARDING.md) for a complete first contribution walkthrough.

## Change workflow

1. Open an issue for a substantial behavior or acoustic-model change. A small typo or regression fix can go straight to a pull request.
2. Fork the repository and create a focused branch. Keep generated output, credentials, local audio, and unrelated edits out of the change.
3. Read the affected module, existing regression tests, [architecture](docs/ARCHITECTURE.md), and [AGENTS.md](AGENTS.md). Preserve scene compatibility and the distinction between experimental data and audible behavior.
4. Implement the smallest maintainable change. Add a reproducible fixture for a numerical bug and state its units, tolerance, and expected result. Do not tune a formula simply to make a test pass.
5. Run checks appropriate to the change and include their actual results in the pull request. Explain skipped or unavailable checks.
6. Use a Conventional Commit subject, for example `fix(acoustics): reject an overlapping reflection leg` or `docs: clarify local audio transfer`.

## Verification

For code changes:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

Install Playwright Chromium before the first browser run:

```sh
pnpm exec playwright install chromium
```

On Linux, `pnpm exec playwright install --with-deps chromium` also installs the required system libraries. `pnpm e2e` builds and starts its own production server; it does not require paid AI requests.

Inside a running development container:

```sh
docker compose -f compose.dev.yaml exec web pnpm lint
docker compose -f compose.dev.yaml exec web pnpm typecheck
docker compose -f compose.dev.yaml exec web pnpm test
```

The container workflow supports tests that need no sound hardware. Playwright runs in CI; actual listening and device-specific AudioContext behavior still require a host browser. A passing numerical or OfflineAudioContext test does not establish subjective localization accuracy.

Documentation-only changes should verify paths, commands, and claims against the current code. Changes to application behavior should retain passing Classic and Hybrid regression coverage; the pull request CI checks installation, lint, types, Vitest, production build, Chromium E2E, and a Docker production smoke test.

## Acoustic and architectural changes

Keep pure geometry and acoustic functions in `src/acoustics`, schemas and invariants in `src/domain`, browser audio in `src/audio`, and background protocols in `src/workers`. React rendering must not become the authority for acoustic calculations. Preserve accepted-frame revision guards, deterministic ordering, six-tap bounds, static geometry caching, and complete serial fallback.

Record a decision in [docs/adr](docs/adr/README.md) when changing a schema, a numerical model, a significant dependency, a deployment boundary, or an audio/Worker contract. State whether a change is a physical formula, a numerical approximation, an engineering optimization, or a perceptual adjustment. Include migration and regression evidence when compatibility changes are intentional.

AI is optional. Use mocked providers in tests, validate all model output, and keep provider keys server-side. Report credential exposure or other vulnerabilities privately using [SECURITY.md](SECURITY.md).

## Assets and licensing

Contributions are distributed under the repository's [MIT License](LICENSE). Only add audio, graphics, datasets, and code you are allowed to redistribute. Include the original license and attribution for third-party content; do not upload a proprietary HRTF dataset or a personal local-audio file. Existing generated demo WAV files and their generator remain part of the project.

Maintainers review changes for correctness, scope, compatibility, licensing, and reproducibility. There is no requirement to use an AI coding tool, Docker, or a paid API to contribute.
