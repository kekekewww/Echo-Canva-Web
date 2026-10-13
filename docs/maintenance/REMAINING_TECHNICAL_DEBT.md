# Remaining Technical Debt

| Status | Item and bounded follow-up |
| --- | --- |
| Known unresolved dependency finding | Development-only `braces` recursion/stack-exhaustion advisory, high severity. Registry has no published fixed version at audit time. Keep patterns trusted, follow upstream, rerun full and production audits. No advisory suppression or fictitious version is used. |
| Unverified platform | macOS Docker Desktop and a separate Linux host/ARM64 runtime were not available for direct testing. Windows Docker Desktop uses Linux amd64 containers; this does not prove every other host or CPU architecture. |
| Unexecuted remote automation | GitHub-hosted Actions has not run because no repository was published/pushed. The first public PR must establish that evidence. |
| Human verification required | Headphone localization, subjective HRTF/listening, actual host audio hardware, external device changes and AudioContext interruptions need representative host-browser checks. Automated OfflineAudioContext tests cannot establish these. |
| Missing specialized acoustic evidence | Existing browser checks do not yet assert direct-versus-occluded spectral-energy response. No physical calibration/measurement certification exists. See [acoustic report](ACOUSTIC_REGRESSION.md). |
| Performance follow-up | Original baseline had a 182 ms long task. Final native/container suites each failed 44/45 with Worker p95 18/63 ms against <12 ms; final native targeted retry had a 191 ms long task against 50 ms. Preserve all failure evidence and compare representative, uncontended machines rather than weakening budgets. |
| Operator configuration | Paid AI is production opt-in. An authenticated gateway and provider spending limits remain necessary before exposing a shared key publicly. Process-local limits are not a distributed authorization/quota system. |
| Legacy maintenance | Retire the unreachable legacy workbench shell only after shared component/type/CSS consumers and regression coverage are mapped. No deletion was justified by naming alone. |
| Research foundations | P5 receiver connection, P6 six-band/atmospheric helpers and P7 late-field histograms remain data-only foundations. Any future audio integration needs an independent design and validation. |
| Unresolved upstream notice | `client-only@0.0.1` declares MIT but does not ship an original copyright/permission notice. Published metadata and the exact exception are retained without inventing attribution. Other collected runtime notices, including native Sharp/libvips conditions, remain separate from application MIT; see [security/license report](SECURITY_LICENSE.md). |
| Image security evidence | Application dependency audits do not scan Debian/Node image packages against all CVE databases. A dedicated image vulnerability scan and periodic base-image maintenance remain separate work. |

Initial documentation, testing and bounded visualization contributions are drafted in [community issues](../community/INITIAL_ISSUES.md). These are prepared drafts, not published GitHub issues.
