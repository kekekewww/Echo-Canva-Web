# Contributor onboarding

## First session

1. Read the [README](../../README.md), [contribution guide](../../CONTRIBUTING.md), and [Code of Conduct](../../CODE_OF_CONDUCT.md).
2. Choose native Node.js 22.23.3/pnpm 11.7.0 or Docker Compose 2.32+. The [Docker guide](../deployment/docker.md) includes hot-reload and platform troubleshooting. Docker is an option, not a contributor requirement.
3. Run `pnpm install --frozen-lockfile && pnpm dev`, or `docker compose -f compose.dev.yaml up --build --watch`.
4. Open http://localhost:3000 in current Chrome or Edge. Try a preset, switch 2.5D/3D, select a source or listener, and inspect a path overlay. Press Play for browser audio.
5. Export the active project JSON, import it again, and confirm the other mode's cached project remains intact. Audio metadata travels in JSON; local blobs require relinking in another browser.
6. Run lint, typecheck, and unit tests. When changing UI/audio/Workers, also run production build and Chromium E2E. Record actual results, including environment limits.

Automated checks use deterministic inputs and mocked AI. No provider account, server database, host sound mount, or personal audio upload is needed. Listening checks need a browser and headphones; they do not run inside the Next.js server container.

## Where to work

| Interest | Starting points |
| --- | --- |
| Documentation | `docs/README.md`, `docs/ACOUSTICS.md`, `docs/deployment/docker.md` |
| Geometry and acoustics | `src/acoustics`, `tests/unit/geometry.test.ts`, `tests/unit/image-source.test.ts`, Hybrid tests |
| Browser sound | `src/audio`, `tests/unit/audio-engine.test.ts`, `tests/e2e/audio-rendering.spec.ts` |
| Editor and accessibility | `src/components/workspace`, `src/hooks`, `tests/e2e/workspace*.spec.ts` |
| Schemas and persistence | `src/domain`, `schemas`, serialization/project tests |
| Background computation | `src/workers`, pool/worker unit tests and failure E2E |

Pick an open issue labeled [`good first issue`](https://github.com/kekekewww/Echo-Canva-Web/labels/good%20first%20issue) or [`help wanted`](https://github.com/kekekewww/Echo-Canva-Web/labels/help%20wanted); the [community issue list](INITIAL_ISSUES.md) explains the starter tasks. Comment on the issue before a substantial change so maintainers can avoid duplicate work. Keep your first pull request focused and use the template to report the problem, change, validation, and remaining limitations.

## Interpreting evidence

Passing tests establish the covered numerical and software contracts. They do not establish architectural-acoustics accuracy, measured material coefficients, personalized HRTF performance, or subjective listening quality. Keep research-only P5/P6/P7 helpers out of audible runtime claims. Read [the acoustic classification](../ACOUSTICS.md) and [research map](../RESEARCH.md) before proposing model changes.

Maintainers apply the [label manifest](../../.github/labels.yml) to GitHub by hand and publish reviewed issues there. No automation publishes labels, issues, images, repositories, or deployments.
