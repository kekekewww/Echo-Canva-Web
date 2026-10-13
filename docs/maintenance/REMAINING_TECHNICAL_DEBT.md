# Remaining Technical Debt

The latest CI diagnosis, bounded visibility fix and exact-head status references
are in [CI_REMEDIATION.md](CI_REMEDIATION.md). Earlier performance failures below
remain part of the evidence; the Windows first-load timeout is not declared fixed.

| Status | Item and bounded follow-up |
| --- | --- |
| Upstream advisory metadata / patch maintenance | Development-only `braces` high advisory still appears by version; registry has no fixed release. A local hashed nesting guard now passes 26 regressions and prevents the reproduced stack exhaustion. Track an upstream fixed release, retain ordinary syntax coverage and review/remove the patch when upgrading. No suppression or fictitious version. See [follow-up](VERIFICATION_FIXES.md). |
| Unverified platform | macOS Docker Desktop and a Linux ARM64 container/runtime were not available for direct testing. Windows Docker Desktop uses Linux amd64 containers; hosted native macOS ARM64 checks have executed and their results are in the follow-up ledger. Neither proves other Docker Desktop hosts or container CPU architectures. |
| Hosted matrix follow-up | CI now covers Ubuntu/Windows application jobs and production Docker. At the maintainer's request, macOS was removed after runner-capacity failures and its final retry was cancelled; this is not a macOS pass. The native-capacity and single-Worker stress repetitions run on Ubuntu. Exact-head results and historical macOS evidence are linked from [CI remediation](CI_REMEDIATION.md). Native matrix checks do not validate all Docker Desktop/audio hardware. |
| Human verification required | Headphone localization, subjective HRTF/listening, actual host audio hardware, external device changes and AudioContext interruptions need representative host-browser checks. Automated OfflineAudioContext tests cannot establish these. |
| Missing specialized acoustic evidence | Existing browser checks do not yet assert direct-versus-occluded spectral-energy response. No physical calibration/measurement certification exists. See [acoustic report](ACOUSTIC_REGRESSION.md). |
| Unresolved performance variability | Demonstrated geometry/projection/panel overhead is reduced and the final native complete suite passes 46/46, but additional original stress repetitions still fail (native p95 12 ms / Long Task 98 ms; macOS hosted failures also remain). Complete metrics and earlier passes/failures are retained in [follow-up](VERIFICATION_FIXES.md). Coarse wall/shard timings do not identify every scheduling stall. Keep the original 12/50 ms limits; do not merge failing CI or replace failures with selected reruns. |
| Operator configuration | Paid AI is production opt-in. An authenticated gateway and provider spending limits remain necessary before exposing a shared key publicly. Process-local limits are not a distributed authorization/quota system. |
| Legacy maintenance | Retire the unreachable legacy workbench shell only after shared component/type/CSS consumers and regression coverage are mapped. No deletion was justified by naming alone. |
| Research foundations | P5 receiver connection, P6 six-band/atmospheric helpers and P7 late-field histograms remain data-only foundations. Any future audio integration needs an independent design and validation. |
| Marker patch maintenance | Both original client-only executable copies are replaced by independently authored project-MIT markers. Collector/runtime guard require zero notice/provenance gaps and reject original identities. Original npm attribution remains historically unavailable, but no runtime exception is allowed. Preserve this boundary and real compiler regressions on upgrades. Other dependency/native licenses remain separate. |
| Image security evidence | Application dependency audits do not scan Debian/Node image packages against all CVE databases. A dedicated image vulnerability scan and periodic base-image maintenance remain separate work. |

Initial documentation, testing and bounded visualization contributions are drafted in [community issues](../community/INITIAL_ISSUES.md). These are prepared drafts, not published GitHub issues.
