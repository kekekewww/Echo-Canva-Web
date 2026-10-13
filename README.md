# Echo Canvas Web

**Open-source Interactive Acoustic Simulation and Visualization Workbench**

Echo Canvas Web is a browser-based workbench for interactive acoustic simulation, geometric-acoustics research, spatial-audio preview, and education. Edit a scene, inspect deterministic propagation paths, and compare Raw/Simulated audio with browser HRTF rendering.

This independent repository is extracted from [Echo-Canva](https://github.com/kekekewww/Echo-Canva) tag `v1.0.0-build-week`. [docs/ORIGIN.md](docs/ORIGIN.md) records the exact immutable commit, release evidence, preserved capabilities, and maintenance differences. The repository is intended for long-term community contribution, including sciwork.

**Public demo:** [the original Echo Canvas deployment](https://echo-canva.vercel.app). This is a legacy upstream demo, not a deployment of this extraction; its running version may differ. Repository publication and PR integration are recorded in [the remote handoff](docs/maintenance/REMOTE_HANDOFF.md). No production image, release or deployment was published by this maintenance work.

## Features in the source baseline

- Independent **Classic 2.5D** and **Hybrid 3D** projects, per-mode browser caches, and compact undo/redo history.
- Scene editor, Outliner, Inspector, pan/zoom/Frame All, JSON import/export, four point sources, and eight listeners with one active receiver.
- Walls, open/closed Portals, registered acoustic materials, and bounded Box/Cylinder/Sphere obstacles. Hybrid retains finite wall/portal geometry and source/listener elevation.
- Direct sound, occlusion, transmission-loss approximations, Portal-aware routing, first-order image-source reflections, and bounded second-order search on blocked direct routes.
- Three-band Eyring RT60, persistent six-tap early reflections, Schroeder late reverb, Raw/Simulated comparison, and Web Audio HRTF/equal-power panning.
- One to four persistent browser source Workers, geometry caching, revision guards, diagnostics, and complete deterministic serial fallback.
- Device-local mono WAV/MP3/Ogg assets in browser IndexedDB, with relinking metadata in scene JSON. Blobs stay local; limits are 25 MiB/file and 100 MiB/library.
- Optional server-side AI scene compilation and grounded acoustic explanation with strict validation. Manual editing and presets require no API key.

P5 receiver sampling, P6 six-band/atmospheric helpers, and P7 directional energy histograms are tested **data-only research foundations**. They do not feed audible runtime. They do not imply implemented diffuse late-field audio, a six-band renderer, air-loss audio, diffraction, or a directional FDN.

## Acoustic limits

This is an interactive, perceptually tuned geometric-acoustics approximation. Material presets, wall transmission, Portal routing, faceted curved obstacles, and late reverb include numerical and perceptual simplifications. The workbench does not provide architectural-acoustics measurement/certification, true diffraction, low-frequency wave simulation, arbitrary room meshes, personalized HRTF selection, or third/higher-order reflection rendering. Hybrid authoring uses a rectangular room; only one listener is audible at a time.

Read [formulas, classifications, and boundaries](docs/ACOUSTICS.md). Tests establish covered numerical/software contracts, not measured accuracy or subjective localization quality.

## Native development

Use Node.js **22.23.3** and pnpm **11.7.0**, matching Docker and CI. Current desktop Chrome or Edge is the primary browser target. Install the matching pnpm toolchain, then:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. Press **Play** to start audio; headphones are recommended for panning. No database, account, server audio-device mount, or AI credential is needed.

## Docker development

Docker Engine/Desktop with Compose **2.32+** provides an optional toolchain without host Node.js:

```sh
docker compose -f compose.dev.yaml up --build --watch
```

Open http://localhost:3000. Compose Watch synchronizes source changes while container dependencies and `.next` remain isolated from the host. Logs remain visible. Read [the Docker guide](docs/deployment/docker.md) for synchronization/restart behavior, optional polling, environment variables, and platform verification limits.

```sh
docker compose -f compose.dev.yaml exec web pnpm lint
docker compose -f compose.dev.yaml exec web pnpm typecheck
docker compose -f compose.dev.yaml exec web pnpm test
```

Stop with Ctrl+C or `docker compose -f compose.dev.yaml down`. Browser projects/audio remain in browser storage; clearing browser data removes them.

## Production deployment

Self-host one Next.js application container:

```sh
docker compose up -d --build
docker compose logs -f web
```

Open http://localhost:3000 and inspect http://localhost:3000/api/health. The multi-stage standalone image includes public/static assets, runs as a non-root user, retains API routes, and requires no database. Configure a TLS reverse proxy for remote use. [The Docker guide](docs/deployment/docker.md) covers runtime configuration, health, and stopping.

Vercel remains an alternative: import this repository as a Next.js project, use pinned pnpm/frozen installation, and configure optional provider secrets in the deployment environment. Docker does not replace Vercel support. No deployment is performed by this cleanup.

Docker runs the Next.js server/API routes. Web Audio, HRTF, acoustic Workers, local decoding, and IndexedDB remain in the user's browser. Containerization does not accelerate browser acoustic calculations or require access to headphones/audio interfaces.

## Optional AI configuration

Copy `.env.example` to `.env.local` for native development and provide server-side `OPENAI_API_KEY`, or select the source-baseline OpenRouter compatibility path with `AI_PROVIDER=openrouter` and `OPENROUTER_API_KEY`. Provider model IDs remain as specified in the source provider implementation.

Production provider calls require **`AI_ENABLED=true`**; supplied Compose setups default to `false`. An unset flag in native local development preserves configured-provider use; `AI_ENABLED=false` explicitly disables it. Restart after changing environment configuration.

Operators enabling a public paid-key service must put AI routes behind an authenticated TLS gateway and apply provider spending/request quotas. There is no built-in authentication system. Defensive limits include a 256 KiB request body, 20 incoming requests/minute and two concurrent requests per process, disabled SDK retries, strict explanatory snapshot projection, and no-store route responses. Process limits are not authorization or a distributed quota. Supply secrets at runtime, never Docker build arguments or browser variables. Read [SECURITY.md](SECURITY.md).

## Tests and reproducibility

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm e2e
```

The Chromium suite builds and starts its own production server. On Linux, `pnpm exec playwright install --with-deps chromium` also installs system libraries. Tests cover geometry, Direct Path, occlusion/transmission, first/second-order reflections, Portal routing, material energy, RT60, Hybrid 3D, Workers, audio state, and serialization. AI tests use mocks.

Public-PR CI runs frozen installation, real Next Client/Server boundary checks,
ESLint, TypeScript, Vitest, production build and Chromium E2E on Ubuntu and Windows,
plus a separate Linux production Docker build/start/HTTP smoke job. Ubuntu also
runs three zero-retry stress repetitions each at native and single-Worker capacity.
macOS is excluded from the current CI matrix; its final revision is not verified.
It uses minimal permissions and no paid keys. [Maintenance reports](docs/maintenance/README.md)
distinguish configured checks from actual results. Listening, real output and
subjective localization use the [host-browser checklist](docs/testing/browser-listening.md).

## Contribute and learn

Start with [CONTRIBUTING.md](CONTRIBUTING.md), [onboarding](docs/community/ONBOARDING.md), and [initial sciwork issue drafts](docs/community/INITIAL_ISSUES.md). Documentation, tests, accessibility, visualization, and reproducible research contributions are welcome. Docker and AI tools are optional.

See [documentation](docs/README.md), [architecture](docs/ARCHITECTURE.md), [research](docs/RESEARCH.md), [ADRs](docs/adr/README.md), [Code of Conduct](CODE_OF_CONDUCT.md), [security reporting](SECURITY.md), and [changelog](CHANGELOG.md).

## License and assets

Application code remains under the [MIT License](LICENSE). Preserve license/attribution records and include redistribution evidence for new assets. Demo audio is generated by [scripts/generate-audio-assets.mjs](scripts/generate-audio-assets.mjs) and tracked under `public/audio`. No named external HRTF dataset is shipped. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [the security/license audit](docs/maintenance/SECURITY_LICENSE.md).
