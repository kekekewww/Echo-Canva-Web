# Architecture Decision Records

ADRs explain consequential decisions so future contributors can understand the constraints and alternatives without reconstructing a conversation.

Use an ADR for changes to scene/schema compatibility, acoustic formulas or interpretation, Worker/audio contracts, dependency strategy, security boundaries, or deployment architecture. Small fixes and documentation corrections normally belong in a pull request description.

## Process

1. Copy [the template](template.md) to the next numbered filename, for example `0004-short-title.md`.
2. Open it as `Proposed` with the implementation or a focused discussion. State evidence, alternatives, consequences, and verification.
3. Maintainers mark it `Accepted` when the decision is reviewed. Accepted records are retained; replace a decision with a new record and mark the old one `Superseded by NNNN`.
4. Update this index. Avoid inserting secrets, private prompts, or unverifiable scientific claims.

## Records

| Record | Status | Decision |
| --- | --- | --- |
| [0001](0001-immutable-source.md) | Accepted | Extract from an immutable source tag and retain provenance |
| [0002](0002-browser-server-boundary.md) | Accepted | Keep acoustics/audio browser-side and Docker as an optional server workflow |
| [0003](0003-production-ai-opt-in.md) | Accepted | Default production AI to disabled with explicit runtime opt-in |
| [0004](0004-versioned-maintainer-instructions.md) | Accepted | Keep reviewed AGENTS instructions stable during Next.js development |
| [0005](0005-preserve-destination-initializer.md) | Accepted | Preserve the destination initializer and immutable extraction history during PR adoption |
| [0006](0006-local-dependency-patches.md) | Accepted | Hash and test bounded dependency security patches and independently licensed boundary markers |

These initial records capture the authorized extraction scope and implemented maintenance choices. Historical decisions remain available in [the archived decision log](../archive/build-week/docs/DECISION_LOG.md).
