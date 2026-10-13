# Maintenance evidence

These reports describe this local extraction and distinguish passed checks, observed failures and unexecuted checks. Historical Build Week reports remain separate in the [archive](../archive/build-week/INDEX.md).

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

[REMOTE_HANDOFF.md](REMOTE_HANDOFF.md) records the subsequent push to the existing user-supplied repository, the unchanged LICENSE-only `main`, and the pending default-branch/hosted-CI integration.

Current command evidence is in `evidence/`; full local diagnostic logs and browser profiles are retained in the sibling `verification-logs/` directory and are excluded from containers. No paid API requests or subjective headphone evaluation were performed.
