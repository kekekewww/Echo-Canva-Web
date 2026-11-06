# EC-102 Windows evidence, 2026-11-06

Sanitised evidence from the EC-102 profiling runs on one Windows 11 x64 machine. It reports numbers; it sets no pass/fail limit. The interpretation, labels and limits are in `knowledge/raw/sources/ec-102-windows-profiling.md`. The harness is described in `benchmarks/perf/README.md`. macOS was not run.

## Files

| File | What it is |
| --- | --- |
| `runs-index.jsonl` | One line per run (109 unique run ids), including failed ones. The interrupted `r1-node-th01` run is local only and is not indexed. |
| `stock-gate.jsonl` | Every stock gate run (12, including the 2 pilot runs). Failed gate runs stay failed. |
| `tables.md` | Summary tables per group, warm and cold apart. Lists the runs that were rebuilt with `rederive`. |
| `comparisons.json` | Comparisons between groups. |
| `groups.json.gz` | The raw numbers behind `tables.md`, gzip-compressed. |
| `selected/` | Per-run summaries and environment records for the runs the findings use. |
| `runs.tar.gz` | The kept run directories (summaries, environment records and other per-run files). It holds no `samples.jsonl`, so historical percentiles cannot be recomputed from committed files. |
| `exemplar-slices.tar.gz` | Short slices of traces for the cases the findings describe. |
| `raw-cpu-alloc-gc.tar.gz` | Raw CPU profiles, allocation profiles and GC records. |
| `artifacts.sha256` | SHA-256 of the files kept in git. It catalogs pre-pack paths (for example `groups.json`), not the packed archives. |
| `archives.sha256` | SHA-256 of the three `.tar.gz` archives and of the files under `selected/`. |
| `corrections-after-verification.md` | Old and new values after the harness fixes in `08f8227`, from `summary.json` before and after `rederive`. Nothing was re-measured. |
| `verification/` | Reports of the first independent verification at `63a50c6` (NOT_VERIFIED). |
| `large-artifacts.sha256` | SHA-256 of the large traces that are not in git. |

## Privacy scan

`runs.tar.gz`, `exemplar-slices.tar.gz` and `raw-cpu-alloc-gc.tar.gz` were scanned before they were packed. To scan them again after unpacking, unpack each into its own empty folder and run:

```text
node scripts/perf/cli.mjs scan <dir>
```

The command prints `file:line:rule` for each hit and exits 1 on a hit.

## Large traces

Large traces are not in git. Their checksums are in `large-artifacts.sha256`. They were kept locally in `.perf-runs/ec102-win-1`, which is git-ignored and has no guaranteed retention. The way to get them back is to run the plans again.

## Plans

The plans are in `benchmarks/perf/plans/ec-102/`:

- [plan-r1.json](../../plans/ec-102/plan-r1.json)
- [plan-q.json](../../plans/ec-102/plan-q.json)
- [plan-sched.json](../../plans/ec-102/plan-sched.json)
- [plan-attr.json](../../plans/ec-102/plan-attr.json)
- [plan-inv.json](../../plans/ec-102/plan-inv.json)

## Regenerate

Use Bash. Set `TEMP`, `TMP` and `TMPDIR` to a folder inside the worktree first, and read `benchmarks/perf/README.md` for the rest of the setup. Check the frozen corpus first:

```text
node scripts/corpus/cli.mjs verify --require-frozen
```

For each plan, run it, then summarise the output:

```text
node scripts/perf/cli.mjs run --plan <plan> --out .perf-runs/<id>
node scripts/perf/cli.mjs summarize --out .perf-runs/<id> --to <evidence dir>
```

Then pack the evidence:

```text
node scripts/perf/pack-evidence.mjs
```

A new run will not give the same numbers. The timings are from a loaded desktop with large run-to-run spread, and Round 1 and the quiet window are different conditions. Compare new results with these as separate runs, not as a replacement.
