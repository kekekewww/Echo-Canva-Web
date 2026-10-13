# ADR 0006: Reproducible local dependency security and notice corrections

Status: Accepted

Date: 2026-10-13

## Context

The remaining development-only `braces@3.0.3` advisory can be reproduced with a
deeply nested pattern within its existing input-length limit. No fixed release
is published. The npm `client-only@0.0.1` archive declares MIT but contains no
original copyright or permission notice; Next.js also vendors that marker.
Copying a different project's notice would not resolve its provenance.

## Decision

Use pnpm's version-specific, lockfile-hashed patches in `patches/`:

- Bound braces/parentheses parsing and recursive AST walkers at 128 structural
  levels. Reject excess nesting with `SyntaxError` / `BRACES_MAX_DEPTH`. Preserve
  ordinary grammar and upstream MIT attribution. Do not falsify the package
  version or suppress the version-based advisory.
- Independently implement the two tiny client-boundary markers under this
  project's MIT license. Preserve canonical import paths, conditional exports,
  Next compiler aliases and rejection of Server Component imports. Replace both
  the installed package and Next's vendored copy. Retain original publication
  metadata as historical provenance, rather than relabeling it as licensed code.
- Require complete runtime notices and zero provenance exceptions. Fail the
  collector and runtime guard for the original marker identity or missing notice.

Docker's dependency stage copies patches before frozen installation; Compose
Watch rebuilds for patch changes. Native installation and CI consume the same
lockfile. These patches add no dependency, network service or application feature.

## Alternatives and consequences

An upstream fixed braces release is preferred when available. An unpatched
override or invented `3.0.4` is not reproducible. Removing Next's lint stack is
broader than this correction. Retaining a legal exception does not meet the
redistribution objective; borrowing another package's copyright is inappropriate.

The local patches must be reviewed on dependency upgrades. If their exact source
no longer matches, installation must fail until the patch is revised or removed.
The braces advisory remains visible to registry-version scanners; this is a
documented local mitigation of stack exhaustion, not a claim that every possible
glob expansion or regular-expression resource issue is solved.

## Verification

Use the ordinary full quality gates, `braces-security.test.ts`, marker and runtime
collector/guard regressions, and `node scripts/verify-client-marker-boundary.mjs`.
The last command uses the real Next compiler: a Client Component must build and
a Server Component import must fail for the boundary reason. Build and inspect
the production image after every patch change. Actual results, including retained
failures, are recorded in [the follow-up report](../maintenance/VERIFICATION_FIXES.md).
