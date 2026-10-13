# Baseline Test Report

Date: 2026-10-13 (Asia/Taipei). Immutable upstream commit: `c8fe24700b67861e2f64fbb8950e9281c0e13a3c` / `v1.0.0-build-week`.

The extracted initial Git tree is byte-for-byte identical to upstream: `ca4a2543f6f0e8848fe8d8eb57f3ed70faaba294` (291 tracked files). Git archive initially inherited global Windows CRLF conversion; extraction was corrected using `git -c core.autocrlf=false archive` before maintenance edits. All 291 archive blob hashes were verified against upstream. Baseline checks ran before application changes.

Environment: Windows host, Node 22.17.0, pnpm 11.7.0 (packageManager), Chromium via Playwright 1.61.1. No credentials supplied; no paid API calls.

| Check | Actual result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS, 376 packages installed, unchanged lockfile |
| `pnpm lint` | PASS, exit 0, no warnings |
| `pnpm typecheck` | PASS, exit 0 |
| `pnpm test` | PASS, 69 files / 508 tests |
| `pnpm build` | PASS, Classic/Hybrid pages and both dynamic AI routes present |
| `pnpm exec playwright test` | FAIL: 44 passed / 1 failed in 50.7 seconds. Existing full-entity stress case observed a 182 ms long task against its unchanged 50 ms limit. No threshold relaxed. |
| Fresh dependency audit | FAIL, 3 critical / 25 high / 15 moderate / 1 low advisory findings in the original lockfile; security maintenance required. Counts include multiple advisories against the same package. |
| Targeted stress rerun | PASS on targeted rerun, 1/1 in 12.9 seconds with unchanged thresholds. Initial full-suite failure retained. |
| Docker | Not present in source tag; not tested at baseline. |

Raw command logs were retained in sibling `verification-logs/`. Historical release's 45/45 report is provenance, not a substitute for this run. Browser timing budgets are sensitive to host contention; any rerun must retain the failure evidence and unchanged thresholds. Listening/HRTF localization and physical calibration have not been performed.
