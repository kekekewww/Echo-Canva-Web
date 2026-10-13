# 0003 — Explicit production AI opt-in

- Date: 2026-10-13
- Status: Accepted

## Context

The source application has optional server-side provider credentials and no user authentication service. Placing a shared paid key behind publicly reachable AI routes can create an uncontrolled spending endpoint. Manual scenes and presets must remain available without a key.

## Decision

Require `AI_ENABLED=true` before production provider requests. The provided production Compose environment defaults to disabled. Preserve local development configured-provider behavior when the flag is unset, and allow `AI_ENABLED=false` everywhere. Add bounded route input and per-process incoming/concurrent request limits; disable automatic SDK retries.

Operators enabling a public keyed service must use an authenticated TLS gateway plus provider spending/request quotas. Keys are runtime server configuration and never Docker build arguments or browser variables.

## Alternatives and consequences

Adding accounts or an authentication database would expand product scope. Removing AI routes would drop a baseline capability. Process counters are bounded protection for one process, not a distributed rate limiter or authorization mechanism. Multiple replicas require gateway/provider quotas.

## Verification

Mocked route/provider tests cover disabled production, explicit opt-in/disable, malformed/bounded input, concurrency and rate limits, and key-free fallback. See [SECURITY.md](../../SECURITY.md) and [the security audit](../maintenance/SECURITY_LICENSE.md). No real shared key is used for verification.
