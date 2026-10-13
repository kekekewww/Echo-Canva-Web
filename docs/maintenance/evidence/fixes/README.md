# Follow-up verification evidence

These outputs belong to the subsequent performance, dependency and licensing
corrections, not the initial extraction. [The follow-up ledger](../../VERIFICATION_FIXES.md)
records exact results, environment and remaining unverified checks. The parent
manifest and all initial failure evidence are retained unchanged.

- `braces-*`: real dependency regressions before and after the nesting patch.
- `local-patches-*`, `repaired-audit*`: exact/frozen installation and separate full
  versus production audit results. The version-based high advisory is retained.
- `client-marker-*`: actual compiler and marker/notice regression execution.
- `stress-native-optimized-metrics.json`: separate unprofiled numeric capture;
  the full original stress assertion is also in the complete Chromium log.
- `fix-native-*`: first integrated correction's native metadata, exit codes, logs and actual
  runtime inventory. The restricted-sandbox typecheck failure is explicitly
  separated from the identical successful scoped execution.
- `fix-docker-*`: updated image and container execution evidence.
- `fix-wall-*`: the subsequent wall overdraw correction and strict validation;
  first failures and unchanged-configuration reruns remain separate files.
- `ui-lazy-projections-*`, `fix-lazy-*`: idle-render regressions before/after
  moving unused work to click handlers, and the integrated lazy UI validation.
- `fix-validator-*`: separately identified native profiling/boundary diagnostics;
  instrumentation and emulated core count are not acceptance measurements.
- `ui-stable-props-*`, `fix-telemetry-*`: the final panel-input correction,
  diagnostic render coverage and independent acceptance results. Coverage
  instrumentation is not performance acceptance evidence.
- `fix-hosted-*`, `fix-preceding-main-ci.json`: actual GitHub results, separately
  identified by run/head SHA; previous-tree passes do not prove current fixes.
- `MANIFEST.json`: byte sizes and SHA-256 hashes for these portable outputs.

The latest source-tree results are in `fix-telemetry-native-summary.md`,
`fix-lazy-docker-summary.json` and `fix-hosted-38364078147-summary.json`.
The complete native/container suites pass 46/46, but additional native repeats
and macOS hosted stress fail; the overall performance verdict remains unresolved.
`ui-stable-props-tool-results.json` is explicitly retrospective tool-result
metadata for silent successful commands, not a fabricated raw stdout log.

Output normalization removes terminal colors, BOMs and trailing display spaces,
and uses UTF-8/LF. It changes no numerical values or failure messages. Larger CPU
profiles, temporary configurations and local test helpers remain in sibling
`verification-logs/` and are excluded from images. No paid API or physical
headphone listening is asserted by these outputs.
