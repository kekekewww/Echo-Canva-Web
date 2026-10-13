# 0001 — Immutable source extraction

- Date: 2026-10-13
- Status: Accepted
- Scope: Echo Canvas Web repository extraction

## Context

The independent repository must preserve the formal Build Week version and must not silently absorb later upstream product work. Upstream history, tags, releases, deployments, and uncommitted local edits must remain untouched.

## Decision

Resolve `v1.0.0-build-week` to its commit, extract only tracked files at that commit into an independent repository, and record the result in [ORIGIN.md](../ORIGIN.md). Retain relevant original documents in a byte-preserving archive. Document maintenance/security changes relative to that immutable baseline.

## Alternatives

Copying the current upstream `main`, cherry-picking later feature commits, or rewriting upstream history would break this extraction's provenance requirements. A full product rewrite would make behavioral comparison harder without improving this maintenance task.

## Consequences and verification

This repository has independent history and versioning. Upstream release names remain source references. Verify the exact commit, extraction inventory, source differences, baseline report, and final regression report before declaring compatibility. A later upstream import requires a separately reviewed decision.
