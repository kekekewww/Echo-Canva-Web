# Browser CI diagnostics

The unprofiled Chromium suites on Ubuntu and Windows remain the
acceptance checks. The stress fixture still requires 24 distinct completed frames,
p95 below 12 ms, and no observed main-thread task above 50 ms. Do not interpret a
retry or an instrumented run as a replacement for a failed acceptance attempt.

Workspace tests retain bounded browser errors, failed requests, HTTP errors,
navigation milestones and crashes from the **first attempt** when it fails.
`browser-events.json` is collected before page teardown. This helps distinguish
an unhydrated loading page from a failed editor interaction.

For deeper investigation, build once, then run:

```sh
BROWSER_DIAGNOSTICS=1 pnpm exec playwright test tests/e2e/workspace.spec.ts --grep 'survives the full entity-limit project|Hybrid viewport adds pan navigation' --repeat-each=6 --retries=0 --trace=off --output=test-results/diagnostic
```

In PowerShell, set `$env:BROWSER_DIAGNOSTICS='1'` before the `pnpm` command and
remove it afterward with `Remove-Item Env:BROWSER_DIAGNOSTICS`.

This adds a Chromium trace with main-thread and dedicated Worker CPU samples on
every attempt. CPU recording changes timing: these are diagnostic measurements,
**not performance acceptance**. For a loading/interaction failure, also use
`--trace=on` and open `trace.zip` with `pnpm exec playwright show-trace`.
DOM snapshot recording adds substantial work during stress interactions, so leave
it off when profiling computation. Load `chromium-cpu-trace.json`
in Chrome DevTools Performance. Correlate dispatch/message tasks, Worker CPU
samples, GC and rendering with `worker-stress-metrics.json` before proposing a fix.

CI runs this supplementary collection on Windows after a failed gate. Its
explicit `continue-on-error` applies only to profiling, not the acceptance
suite. Artifacts retain failures and successes for seven days, including after a
failed gate. The test inputs use synthetic scenes and mocked/disabled AI, with no
real keys or local user audio. Do not profile private scenes and publish the trace.

For a local single-Worker check, set `E2E_SINGLE_ACOUSTIC_WORKER=1` and run the
stress test with `--repeat-each=3 --retries=0`, leaving `BROWSER_DIAGNOSTICS` unset.
Chromium reports three cores, so the unchanged
application capacity rule selects one acoustic Worker. This prevents a runner
upgrade from silently dropping coverage of that branch. It does **not** emulate
physical CPU speed, scheduling, or a three-core machine. This check uses the
original fixture and thresholds without profiling.

At the maintainer's request on 2026-10-14 (Asia/Taipei), macOS was removed from the
CI matrix after hosted ARM64 runner capacity prevented the first final-revision
job from starting. Its retry was cancelled after it began executing and failed the
native-capacity stress repeat. The macOS-specific extra repeat steps were also
removed. An initial attempt to move them to Ubuntu passed its full 46-test suite
but failed one of three extra stress repetitions (p95 12 ms against `<12`). That
outcome is retained in [CI remediation](../maintenance/CI_REMEDIATION.md); removing
these platform-specific steps does not establish a performance fix.
