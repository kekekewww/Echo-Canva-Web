# Architecture and Dependency Report

Date: 2026-10-13. This is maintenance of the exact Build Week tag, with security
changes recorded separately from product capabilities.

## Module responsibilities

| Module | Responsibility and observed boundary |
| --- | --- |
| `src/app` | Next.js entry routes (`/`, `/classic`, `/lab`) and Node.js AI API routes. All three pages select the unified workbench. |
| `src/components` | Editor, Inspector, Outliner, viewport adapters and accepted-frame overlays. |
| `src/domain` | SceneSpec v1, scene document/workspace schemas, registry, reducers, projections, validation, serialization and browser-library records. No React or Web Audio imports. |
| `src/acoustics` | Pure geometric and bounded acoustic calculations, Classic frame computation, Hybrid BVH/direct/reflection paths and data-only research helpers. No React imports. |
| `src/audio` | Persistent browser AudioContext graph, source/tap banks, smoothing, HRTF/equal-power rendering and Schroeder reverb. |
| `src/workers` | Persistent source pools, protocol validation, static geometry installation, atomic frame merge, watchdog and complete serial fallback. |
| `src/ai` | Optional server provider/compiler/explainer and validated client contracts; AI never becomes authoritative acoustics. |
| `src/hooks` | React lifecycle, Worker coordination, project persistence and audio library integration. |
| `src/benchmarks` / `benchmarks/results` | Classic deterministic capture and reviewed regression reference JSON. |

Authoring validation and projection feed deterministic Workers; one accepted
revision drives both overlays and persistent audio parameters. Camera changes
remain presentation state. Two independent mode caches, 50-command reversible
history, SceneSpec compatibility and browser-local audio metadata/blob behavior
are retained. Numerical formulas and tuning constants were not changed during
cleanup. Docker runs Next.js and its server routes; user audio, HRTF, Worker
computation and IndexedDB remain in the user's browser.

## Coupling and duplication

A static graph of literal TypeScript imports across 117 original TS/TSX modules
(119 source files including CSS/SVG) found zero multi-file strongly connected
components. The final graph of 119 TS/TSX modules also has zero such components.
It covers relative and `@/` literal imports; computed imports and Worker URL
edges are outside its scope, so this is not a complete runtime-cycle proof.
No import cycle was rewritten.

Hybrid `second-order`, `reflection-rendering` and `receiver-connection` use pure
`src/audio/math` distance/dB helpers; audible-direct also imports audio contracts
as types. Reverse AudioEngine/SourceGraph/tap-bank/reverb dependencies on
acoustics are type-only. This is a layer naming concern, not an observed runtime
cycle. Moving shared numerical helpers would add compatibility churn without
being necessary for this extraction; it is deferred.

Validation geometry and acoustic geometry intentionally have different
intersection/collinearity policies. Similar names are not evidence that they
are interchangeable. No formula or numerical tolerance was consolidated just
to make the tree look simpler. Shared UI remains under its existing directory
where active adapters depend on it; the legacy shell is retained and reported.

## Dependency use and security maintenance

All five original runtime dependencies have a current role: Next.js server and
build, React and React DOM browser rendering, OpenAI's server Responses adapter,
and Zod external-boundary schemas. Existing test/build/lint dependencies support
documented commands. No unnecessary dependency was identified with sufficient
evidence to delete it. The framework, React, TypeScript, pnpm and Web Audio/
Worker architecture remain unchanged.

The fresh source-lock audit reported **44 advisory findings**: three critical,
25 high, 15 moderate and one low. Several findings concern the same package or
its nested versions; they are not 44 distinct runtime components.

| Direct dependency | Source tag | Maintenance pin | Reason |
| --- | --- | --- | --- |
| `next` | 16.2.10 | 16.3.8 | Minimum same-major version covering all reported Next.js patched floors. |
| `eslint-config-next` | 16.2.10 | 16.3.8 | Keep Next.js lint rules aligned with the server/build version. |
| `vitest` | 4.1.10 | 4.1.11 | Same-major security fix for redirect mock traversal. |

Later same-major refresh (issue #13): `next` and `eslint-config-next` are now
16.4.2, `react`/`react-dom` 19.3.1, `zod` 4.6.7, `@playwright/test` 1.64.1,
`@types/node` 26.6.5 and `@types/react`/`@types/react-dom` 19.3.0. The table
above and the dated results below describe the earlier 16.3.8 maintenance and
are retained as history. The Next.js client-only patch is now
`patches/next@16.4.2.patch`; its replacement content is unchanged.

On hosted Windows CI, 16.4.2's webpack build worker rejected the forbidden
Server Component marker every time but intermittently reported the failure
with empty error text (2 of 3 diagnostic builds; Linux 0 of 3). The same build
compiled in-process (`experimental.webpackBuildWorker: false`) reported the
`client-only` boundary message in 3 of 3. The boundary check therefore builds
its webpack fixtures in-process and keeps its exact message assertion; the
application build still uses Next's default worker.

Other direct dependencies retain their original exact versions. Registry
manifests confirm Next.js 16.3.8 requires Node >=20.9 and Vitest 4.1.11 supports
Node 22; both use MIT. Docker/CI use the explicitly pinned Node 22 runtime from
`.nvmrc`, while packageManager remains `pnpm@11.7.0`.

Same-major exact overrides in `pnpm-workspace.yaml` make the reviewed security
resolution explicit: PostCSS 8.5.23, sharp 0.35.5, source-map-js 1.2.2, js-yaml
4.3.2, nanoid 3.3.18, browserslist 4.28.7, baseline-browser-mapping 2.11.0,
brace-expansion 1.1.21 and 5.0.12. Next.js 16.3.8 already specifies PostCSS
8.5.23 and permits sharp ^0.35.4. No provider model, acoustic feature or
post-Build-Week source code is taken from the upstream main branch.

Primary evidence:

- [Next.js Windows-hosted RCE advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36)
  gives 16.3.3 as the fixed floor and no Windows-hosted workaround.
- [Next.js AVIF image-optimization RCE advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
  gives 16.3.3; [next/og advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j)
  gives 16.3.6. This application does not use `ImageResponse` or remote image patterns.
- [Next.js image SSRF advisory](https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4)
  gives 16.3.8. Patched floors are checked against registry manifests, not inferred from latest tags.
- [Vitest mock traversal advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9)
  gives 4.1.11. These tests use unit mode, not a public mocker development server.
- [npm Next.js 16.3.8 manifest](https://registry.npmjs.org/next/16.3.8)
  and [Vitest 4.1.11 manifest](https://registry.npmjs.org/vitest/4.1.11)
  document the selected runtime, dependency and license compatibility.

## Development advisory and reproducible local correction

[`braces` GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
is a high-severity stack-exhaustion issue from deeply nested patterns.
The fresh npm audit response suggests >=3.0.4, but the primary advisory states
there is no patched release and the [npm registry](https://registry.npmjs.org/braces)
publishes only through 3.0.3; `/braces/3.0.4` returned HTTP 404 during this audit.
The initial extraction did not apply a local correction. The subsequent reviewed
pnpm patch bounds parser and AST traversal nesting at 128; the real dependency's
26 regressions passed after 16/26 failed before the patch. Its exact version
remains 3.0.3, so registry-based audit still reports the high advisory. No fictitious
version or suppression is used. See [ADR 0006](../adr/0006-local-dependency-patches.md)
and [current verification](VERIFICATION_FIXES.md).

The retained path is development-only `eslint-config-next` -> Next ESLint plugin
-> `fast-glob` -> `micromatch` -> `braces`. The application does not accept user
glob patterns. Keep lint inputs repository-controlled and keep development
tooling out of the production runtime. Revisit an upstream fix. A clean
production dependency audit and all-dependency audit must be reported separately.
The same version-specific patch mechanism replaces both client-only marker copies
with an independently authored MIT implementation; it does not assign another
project's copyright to the unpatched npm release. Patches are copied before frozen
Docker installs and cause Compose Watch rebuilds. Other package versions and
integrities are unchanged by this follow-up.

## License and verification boundaries

Application MIT and procedural-audio attribution are preserved. Dependency
licenses remain separate: sharp and baseline mapping use Apache-2.0,
source-map-js uses BSD-3-Clause, and native libvips bundles carry their own
notices and LGPL obligations. Windows installed-package inventory is not a
complete Linux production-image audit; preserve bundled notices/source links
in redistributed images. See [SECURITY_LICENSE.md](SECURITY_LICENSE.md).

Retained initial local results after the extraction's security updates:

| Check | Result |
| --- | --- |
| Lock regeneration and install | PASS, 1 min 29.8 s; 27 packages replaced; 464 audited graph entries. |
| `pnpm install --frozen-lockfile` | PASS, exit 0, 94 ms; updated lockfile matches the manifests. |
| `pnpm audit --prod --json` | PASS, exit 0; zero low/moderate/high/critical findings across 99 production/optional entries. |
| `pnpm audit --json` | FAIL, exit 1; one development-only high `braces` finding, zero critical/moderate/low findings. No suppression. |

Fresh JSON outputs are retained in sibling verification logs as `final-audit.json`
and `final-audit-production.json`. The reported findings decreased from 44 to
one; this does not establish that every package or application path is safe.
Lint, typecheck, unit tests, production build, Chromium and container execution
are reported in the final verification report. Dependency version selection and
audit results alone do not establish application compatibility or Docker success.
