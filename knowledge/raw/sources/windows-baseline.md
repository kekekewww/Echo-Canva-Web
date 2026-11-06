# Windows Web baseline run · 2026-11-06

**Evidence date** 2026-11-06 Asia/Taipei. **Runtime baseline** `98a4374fa839aa5dee7c6c35e575b8003f7f1a31`, GitHub `main` as fetched for this research. Run in branch `research/agent-memory-cross-platform-architecture` before any tracked product code or test changes. See the [repository snapshot](repository.md) and [existing acceptance criteria](../../../docs/ACCEPTANCE_TESTS.md).

The linked JSON files are the unedited Playwright result artifacts. Terminal logs retain their content with normalized line endings and trailing whitespace removed. One later change is recorded under [Corrections](#corrections).

## Environment

- Windows x64 `10.0.26200`, Intel Core i9-13980HX, 32 logical processors, 33,959,825,408 bytes of physical memory reported by Node. Power state, thermal behavior, background load, and physical audio device behavior were uncontrolled or unmeasured.
- Node.js `22.23.3` for every successful run, pnpm `11.7.0`, Vitest `4.1.11`, Next.js `16.4.2` production Turbopack build, Playwright `1.64.1`, bundled Chromium Headless Shell revision `1248` (`156.0.8078.4` per Playwright manifest). The standalone Windows Node binary was downloaded into ignored dependencies and checked against the SHA-256 listed in the [official Node release](https://nodejs.org/en/blog/release/v22.23.3#shasums).
- `pnpm install --frozen-lockfile --offline` exited 0 using the local store (376 reused, 0 downloaded) under the previously installed Node `22.23.2`. The lockfile SHA-256 of the tested checkout bytes was `3a541426792e2299935b5dbf1868efd46553ca06bb41a77ca52e6293044291af`. pnpm warned that it could not create the Windows `next` launcher while the installed `next/dist/bin/next` was present. The subsequent browser run used an ignored PATH launcher calling that exact installed CLI with Node `22.23.3`. The repository configuration, fixtures and assertions were used as checked out.
- Test processes used worktree-local `TMP`, `TEMP` and `TMPDIR`. Build/browser commands were scoped to the worktree and ran outside the filesystem sandbox after its prerender write restriction. Browser server bound `127.0.0.1:3000`. `AI_ENABLED=false` and `NEXT_TELEMETRY_DISABLED=1` were set for the measured browser runs.

## Deterministic tests and build

| Run | Exit and observation | Evidence |
| --- | --- | --- |
| `node node_modules/vitest/vitest.mjs run tests/unit/classic-baseline-capture.test.ts tests/unit/hybrid3d-receiver-connection-benchmark.test.ts tests/unit/classic-source-pool.test.ts tests/unit/hybrid-direct-pool.test.ts tests/unit/frame-acceptance.test.ts` | Exit 0, 119 tests in 5 files. Exact deep comparison against the approved Classic ten-scenario oracle, plus Hybrid data-only receiver connection metric checks, Classic/Hybrid pool behavior and frame acceptance. | [Targeted stdout](windows-2026-11-06/targeted-unit.log) |
| `node node_modules/vitest/vitest.mjs run` | Exit 0, 699 tests in 82 files. Vitest duration 20.69 s is runner time, so it cannot serve as solver latency. | [Full unit stdout](windows-2026-11-06/unit.log) |
| `node node_modules/next/dist/bin/next build` | Exit 0 on retry. Next compiled, type-checked, generated 8/8 pages and listed both mode routes and all three API routes. The retry reused build cache. | [Production build stdout](windows-2026-11-06/build.log) |

Initial targeted run failed before running tests with `EPERM` during Vite SSR rename in the sandbox default temporary directory. The worktree-local temp rerun passed. Initial build compiled and passed its TypeScript stage, then failed with `EPERM` creating `.next/server/app/classic.segments/classic` during prerender. The scoped local retry passed. Initial Chromium invocation was interrupted while waiting for its local web server with the missing pnpm shim. No browser measurement was produced by that attempt.

The checked-out [Classic regression oracle](../../../benchmarks/results/mvp-baseline.json) and [archived audio baseline](../../../benchmarks/results/mvp-baseline-audio.json) were left intact. The latter was historical input, not measured again by the Classic regression test.

## Chromium measurements

Two independent targeted invocations ran sequentially with the checked-in Chromium config, one worker and zero retries. The cached Chrome Headless Shell executable was used, with `navigator.hardwareConcurrency = 32`. Next printed its existing `next start` / standalone configuration warning. The checked-in Playwright server successfully served the cases. These runs do not validate the standalone entry point or Docker.

```powershell
node node_modules/@playwright/test/cli.js test tests/e2e/workspace.spec.ts --grep 'survives the full entity-limit project' --project chromium --retries 0 --output test-results/windows-2026-11-06-stress
$env:ECHO_AUDIO_BENCHMARK = '1'
node node_modules/@playwright/test/cli.js test tests/e2e/audio-render-capacity.spec.ts --project chromium --retries 0 --output test-results/windows-2026-11-06-audio
```

| Run | Exit and observation | Evidence |
| --- | --- | --- |
| [Hybrid full entity-limit gate](../../../tests/e2e/workspace.spec.ts) | Exit 0, 1/1. Four source Workers, 24 finite samples and 24 distinct completion sequences. Reported Worker timing p50/p95/p99/max **2/5/6/6 ms**, with p50/p99 calculated by nearest rank from the captured array. The original p95 gate is `<12 ms`. The observer emitted no Long Task entry during the 24 switches and the original `≤50 ms` gate passed. | [JSON](windows-2026-11-06/worker-stress-metrics.json) · [stdout](windows-2026-11-06/worker-stress.log) |
| [Classic opt-in CDP render-capacity fixture](../../../tests/e2e/audio-render-capacity.spec.ts) | Exit 0, 1/1. The 2 s idle phase returned 8 samples. A 10 s drag produced 273 moves, 39 samples and 39 distinct accepted revisions sampled. Drag `renderCapacity` mean/p50/p95/max **0.07491/0.06663/0.12506/0.20483**, a fraction of the render budget. Mean of sampled callback-interval means was **10.008 ms**. This optional fixture only asserts that drag samples are present and their capacity is finite. | [JSON](windows-2026-11-06/audio-render-capacity.json) · [stdout](windows-2026-11-06/audio-render-capacity.log) |

The Hybrid timing is the fixture's reported Worker metric and excludes input-to-overlay/audio latency. An empty Long Task array does not quantify occupancy or sub-threshold stalls. In the CDP fixture, 39/39 counts distinct revisions among sampled snapshots, so it does not quantify every accepted or dropped result. These are observations from one Windows run per fixture with headless output. Comparisons against [older interleaved runs](../../../docs/maintenance/evidence/audio-render-capacity/README.md) require an aligned environment, and the test does not establish actual output, underruns or listening quality.

## Coverage gaps

This run did not measure p99 over a representative workload distribution, throughput, CPU/memory/GC, IPC, energy/thermal or physical audio continuity. Complete Playwright, Docker, macOS/Linux, Native Rust, WASM and device/listening checks were outside the executed commands. Future comparative work uses the [benchmark and numerical validation plan](../../wiki/performance/benchmark-plan.md).

## Corrections

**2026-11-06 更正記錄**：維護者決定，因儲存庫公開，移除 `windows-2026-11-06/unit.log` 與 `targeted-unit.log` 第 2 行（Vitest `RUN` 行）末尾的本機絕對 checkout 路徑，改為文字 `<local checkout path removed>`。兩個檔案沒有其他變更，測試結果不受影響。原始位元組仍在 git 歷史的提交 `2a68438`，該歷史未被改寫。
