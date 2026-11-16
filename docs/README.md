# Documentation

Start with [README](../README.md), [CONTRIBUTING](../CONTRIBUTING.md), and [onboarding](community/ONBOARDING.md).

For ongoing engineering research and agent handoffs, use the [project memory index](../knowledge/wiki/index.md).

## Maintained references

| Document | Purpose |
| --- | --- |
| [ORIGIN](ORIGIN.md) | Immutable commit, release evidence, extraction differences |
| [Architecture](ARCHITECTURE.md) | Live modules, Workers, audio/storage/server boundaries |
| [Acoustics](ACOUSTICS.md) | Formulas, units, classifications, parameters and limits |
| [Research](RESEARCH.md) | Preserved bibliography and implementation map |
| [API contracts](API_CONTRACTS.md) | Scene and API contract reference with source-era context |
| [Docker](deployment/docker.md) | Optional contributor environment and self-hosting |
| [Browser listening/Desktop checks](testing/browser-listening.md) | Human audio/HRTF/IndexedDB protocol and Windows/macOS Docker Desktop hot reload |
| [Portal walkthrough](tutorials/portal-walkthrough.md) | Reproducible Concrete Partition direct/Portal/blocked tutorial for Classic and Hybrid, with importable fixtures |
| [ADRs](adr/README.md) | Decision records and template |
| [Maintenance reports](maintenance/README.md) | Baseline/final/audit/security/license/dependency evidence and debt |
| [Community issues](community/INITIAL_ISSUES.md) | Published sciwork starter issues and contributor-help issues |

Use [SECURITY](../SECURITY.md) for private vulnerabilities and follow [community conduct](../CODE_OF_CONDUCT.md).

## Proposals

[Desktop rewrite spec](desktop-rewrite-spec/00-README.md) is a self-contained specification for rebuilding this app as a Rust (Tauri) desktop application in a separate repository. Sections 01–07 describe the current code at `46c61c5`, with review findings; 08–10 are the proposed architecture, UX redesign and build plan. It is a proposal, not an adopted decision: this repository's stack rules in `AGENTS.md` are unchanged.

## Historical evidence

[Build Week archive](archive/build-week/INDEX.md) retains requirements, status, plans, research notes, artifacts, original README/AGENTS, and technical-doc copies. It is traceability evidence, not a current roadmap or checklist. Preserve original bytes/attribution; add current corrections outside it.

[Source-era acceptance scripts](ACCEPTANCE_TESTS.md) remain useful for listening/browser reference, read alongside current UI and maintenance reports. Historical status or planned phases do not certify this extraction or a current deployment.
