# Portable verification evidence

Date: 2026-10-13. These are actual local command outputs, converted to UTF-8/LF;
terminal color escapes, trailing display spaces and surplus final blank lines
were removed. Numerical values and failure messages were not changed. PowerShell stderr wrapper messages are
retained and are not command exit status. Pass/fail and exit codes are recorded
in the parent verification reports. Full diagnostic logs, temporary browser
profiles and additional earlier attempts stay outside the repository.

| Evidence | Scope |
| --- | --- |
| `baseline-*` | Original pre-maintenance 508 units, build, initial Chromium long-task failure, unchanged targeted retry and initial audit summary |
| `final-*` | Final native lint/types/524 units/build; full Chromium and targeted stress failures; current full/production audits |
| `docker-development-*` | Final image build/quality/start/smoke/host browser and actual final-config Compose Watch HMR/restart |
| `docker-production-*` | Final clean image build/start/smoke/guard, complete Chromium failure, SIGTERM/cleanup/restart evidence |
| `docker-context-audit-final.json` | Actual scratch context check with temporary fake environment/key canaries, excluded paths and retained licenses/oracles |
| `security-final-no-cache-image-*` | Final immutable Linux image bounded secret/license scan and config/layer-history inspection |
| `source-main-diff.txt`, `upstream-refs-*` | Main inspection-only diff and unchanged original remote refs |
| `*.png` / failure context | Actual browser evidence; procedural/manual test scenes only, no uploaded user assets |
| `MANIFEST.json` | SHA-256 and byte length of each portable evidence file |

The first final native failure's screenshot was not preserved before the next
Playwright run cleared its output directory; its complete failing command log is
preserved. The container failure screenshot/context and final native retry output
were retained separately. This distinction does not change any failure result.

The bounded final-image scan can be rerun against a locally built image:

```sh
docker run --rm -i --network none --entrypoint node echo-canvas-web:local - < docs/maintenance/evidence/security-final-image-scan.cjs.txt
```

PowerShell:

```powershell
Get-Content -Raw docs/maintenance/evidence/security-final-image-scan.cjs.txt | docker run --rm -i --network none --entrypoint node echo-canvas-web:local -
```

These files are evidence rather than performance or measurement certification.
The complete final Chromium verdict is **FAIL: 44/45 for both native and final
production image**. Do not substitute earlier 45/45 evidence, passing mock/unit
checks, or the independently passing HTTP/health checks for that result.
