# Final native verification — 2026-10-13

All seven final stages passed on the integrated working tree. No source, test-threshold, or checked-in Playwright configuration edits were made during this verification.

Environment: Windows x64, actual host Node **v22.17.0**, installed Next **16.3.8**, Vitest **4.1.11**, TypeScript **5.9.3**, Playwright **1.61.1**, Chromium revision **1228** / **149.0.7827.55**. Repository package manager declaration is pnpm **11.7.0**. Commands use the installed direct Node CLIs because the host global pnpm manager previously could not open its SQLite database. This run does not claim host Node equals the container/CI pin.

| Stage | Actual command after `node` | Exit | Process duration |
| --- | --- | --- | --- |
| ESLint | `node_modules/eslint/bin/eslint.js . --max-warnings=0` | 0 | 20.69 s |
| TypeScript | `node_modules/typescript/bin/tsc --noEmit` | 0 | 7.65 s |
| Complete unit suite | `node_modules/vitest/vitest.mjs run` | 0 | 5.94 s |
| Production build | `node_modules/next/dist/bin/next build` | 0 | 20.10 s |
| Immutable source verifier | `scripts/verify-source-baseline.mjs` | 0 | 0.22 s |
| Actual runtime notice collector | `scripts/collect-runtime-licenses.mjs` | 0 | 3.38 s |
| Complete Chromium suite | `node_modules/@playwright/test/cli.js test --config ../verification-logs/fix-native-playwright.config.cjs` | 0 | 50.47 s |

Full unit results: **73 files / 567 tests passed**, including the ninth runtime-license identity guard. Vitest-reported duration 5.36 s. The fixed Classic fixture, worker validation, acoustic and audio contracts remain included.

Production build ID: `iBG2MNPmUD5MHDyG2Hicc`. Routes `/`, `/classic`, `/lab`, `/api/health`, `/api/scene/compile`, and `/api/scene/explain` remain present. Build includes TypeScript validation.

Source verifier checks all **291 immutable baseline records**, the exact extraction root tree `ca4a2543f6f0e8848fe8d8eb57f3ed70faaba294`, upstream SHA `c8fe24700b67861e2f64fbb8950e9281c0e13a3c`, and the exact LICENSE-only initializer; no additional history roots were found.

Actual Windows standalone notice inventory: **20 runtime packages**, 18 standalone packages, 5 declared production dependencies, 2 supplemental packages. All unresolved counters are zero. The generated inventory is preserved in `fix-native-license-inventory.json`. This is notice preservation evidence, not a complete legal audit; Linux/container inventory is verified separately.

Full E2E results: **45 / 45 passed**, Playwright duration 49.6 s, workers **1**, retries **0**, Desktop Chrome device profile, no profiler or diagnostic test in the repository test directory. The external configuration only sets port 3101, a direct Node server command, and workspace-contained output/temp paths for this environment. The entire checked-in E2E directory and original Playwright configuration have an empty Git diff (exit 0). The original full-entity stress case passed in 8.7 s with its original **p95 < 12 ms** and **all long tasks <= 50 ms** gates. Exact per-frame numerical metrics are not printed by the unchanged test; the earlier isolated uninstrumented diagnostic captures are separate evidence.

Playwright started its own production test server with `next start` on `127.0.0.1:3101`; after the suite a local HTTP check returned `ECONNREFUSED`, confirming that owned server stopped. The preserved native `next start` path emits Next's standalone-output warning. Container verification uses the standalone entry point separately.

The first TypeScript invocation under restricted sandbox visibility failed with missing linked Playwright/Vitest exports (child exit 2). The identical command with normal Windows filesystem visibility passed; both original failed log/JSON are retained as `fix-native-typecheck-sandbox.*`. Read-only localhost probing also required scoped network visibility. These are environment restrictions and are not hidden as application test failures. No approval rejection occurred.

Each `fix-native-<stage>.log` and `.json` records actual command, timestamps, duration, platform, versions, child exit code, and signal. Docker build/runtime and container-served browser tests remain the next independent stage owned by the parent task.
