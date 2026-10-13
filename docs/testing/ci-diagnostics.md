# Browser CI diagnostics

The unprofiled Chromium suite and macOS three-repeat stress gate remain the
acceptance checks. The stress fixture still requires 24 distinct completed frames,
p95 below 12 ms, and no observed main-thread task above 50 ms. Do not interpret a
retry or an instrumented run as a replacement for a failed acceptance attempt.

Workspace tests retain bounded browser errors, failed requests, HTTP errors,
navigation milestones and crashes from the **first attempt** when it fails.
`browser-events.json` is collected before page teardown. This helps distinguish
an unhydrated loading page from a failed editor interaction.

For deeper investigation, build once, then run:

```sh
BROWSER_DIAGNOSTICS=1 pnpm exec playwright test tests/e2e/workspace.spec.ts --grep 'survives the full entity-limit project|Hybrid viewport adds pan navigation' --repeat-each=6 --retries=0 --trace=on --output=test-results/diagnostic
```

In PowerShell, set `$env:BROWSER_DIAGNOSTICS='1'` before the `pnpm` command and
remove it afterward with `Remove-Item Env:BROWSER_DIAGNOSTICS`.

This adds a Chromium trace with main-thread and dedicated Worker CPU samples on
every attempt, plus Playwright DOM/network/action traces. CPU/DOM recording changes
timing: these are diagnostic measurements, **not performance acceptance**. Open
`trace.zip` with `pnpm exec playwright show-trace`; load `chromium-cpu-trace.json`
in Chrome DevTools Performance. Correlate dispatch/message tasks, Worker CPU
samples, GC and rendering with `worker-stress-metrics.json` before proposing a fix.

CI runs this supplementary collection on Windows and macOS after acceptance. Its
explicit `continue-on-error` applies only to profiling, not either acceptance
step. Artifacts retain failures and successes for seven days, including after a
failed gate. The test inputs use synthetic scenes and mocked/disabled AI, with no
real keys or local user audio. Do not profile private scenes and publish the trace.
