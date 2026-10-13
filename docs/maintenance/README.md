# Maintenance evidence

These reports describe this local extraction and distinguish passed checks, observed failures and unexecuted checks. Historical Build Week reports remain separate in the [archive](../archive/build-week/INDEX.md).

[Verification follow-up](VERIFICATION_FIXES.md) records the subsequent performance,
dependency/notice corrections and actual hosted-CI results. The initial reports
below retain their original failures and scope; consult the follow-up for current status.

| Requested deliverable | Report |
| --- | --- |
| Repository Audit Report | [REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md), [per-file classification](REPOSITORY_INVENTORY.json) |
| Source Extraction Report | [SOURCE_EXTRACTION.md](SOURCE_EXTRACTION.md), [immutable origin](../ORIGIN.md), [source manifest](source-baseline-manifest.json) |
| Architecture & Dependency Report | [ARCHITECTURE_DEPENDENCIES.md](ARCHITECTURE_DEPENDENCIES.md) |
| Docker Development Verification Report | [development results](DOCKER_VERIFICATION.md#development) |
| Docker Production Verification Report | [production results](DOCKER_VERIFICATION.md#production) |
| Security & License Audit | [SECURITY_LICENSE.md](SECURITY_LICENSE.md), [redistribution notices](../../THIRD_PARTY_NOTICES.md) |
| CI Verification Report | [CI_VERIFICATION.md](CI_VERIFICATION.md) |
| Acoustic Regression Report | [ACOUSTIC_REGRESSION.md](ACOUSTIC_REGRESSION.md) |
| Contributor Onboarding Guide | [onboarding](../community/ONBOARDING.md), [CONTRIBUTING.md](../../CONTRIBUTING.md), [Docker guide](../deployment/docker.md) |
| Final Change Summary | [FINAL_CHANGE_SUMMARY.md](FINAL_CHANGE_SUMMARY.md), [verification ledger](FINAL_VERIFICATION.md) |
| Remaining Technical Debt | [REMAINING_TECHNICAL_DEBT.md](REMAINING_TECHNICAL_DEBT.md) |

[BASELINE_TEST_REPORT.md](BASELINE_TEST_REPORT.md) records checks performed before maintenance. The initial stress failure is preserved even though its targeted rerun passed. Final results cannot be inferred from historical evidence, selected version numbers or configuration review.

[REMOTE_HANDOFF.md](REMOTE_HANDOFF.md) records the initial push and subsequent user-authorized PR integration. [PR #1](https://github.com/kekekewww/Echo-Canva-Web/pull/1) is merged; its main CI passed. The original source repository remains unchanged.

Current command evidence is in `evidence/`; full local diagnostic logs and browser profiles are retained in the sibling `verification-logs/` directory and are excluded from containers. No paid API requests or subjective headphone evaluation were performed.
