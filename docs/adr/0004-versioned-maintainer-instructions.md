# 0004 — Preserve versioned maintainer instructions

- Date: 2026-10-13
- Status: Accepted

## Context

The independent repository replaces competition-era AGENTS instructions with a reviewed long-term maintenance guide. After the same-major security upgrade, Next.js 16.3.8 native development automatically appended framework-managed instructions to `AGENTS.md`. Starting a development server should not silently change this tracked governance document.

## Decision

Set `agentRules: false` in `next.config.ts`. Keep the project's AGENTS content under explicit version control and maintainer review. Contributors can still consult Next.js documentation when needed; framework guidance does not require automatic file mutation.

## Alternatives and consequences

Accepting automatic append would create unexpected working-tree changes and mix framework-generated guidance with project rules. Making the file read-only would depend on host filesystem permissions and interfere with legitimate maintenance. The framework-supported configuration keeps native and container workflows simple.

This is a local configuration maintenance difference from the source tag, alongside standalone output. It changes neither scene compatibility nor acoustic, audio, Worker, or AI behavior. It is not a post-Build-Week source feature import.

## Verification

The native development check captured `AGENTS.md` before and after starting Next.js with this setting; its hash remained unchanged. Full command/environment evidence belongs in [FINAL_VERIFICATION.md](../maintenance/FINAL_VERIFICATION.md). This observation covers the executed native workflow, not every future framework version.
