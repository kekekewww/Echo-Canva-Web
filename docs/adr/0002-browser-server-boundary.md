# 0002 — Browser computation and optional container workflows

- Date: 2026-10-13
- Status: Accepted

## Context

The existing Next.js/React/TypeScript application already performs acoustic computation in browser Workers and renders sound with Web Audio. Contributors need a consistent optional toolchain and operators need a simple self-hosted deployment.

## Decision

Keep native pnpm development, add a separate Docker development environment with Compose Watch, and build production as a multi-stage Next.js standalone application. Run one application container as a non-root user. Retain server API routes and Vercel compatibility.

AudioContext, browser HRTF, local audio decoding/IndexedDB, project storage, and acoustic Workers stay in the host browser. Docker executes the Next.js server. No host sound device, host network, privileged container, database, message queue, or container desktop is introduced.

## Alternatives and consequences

A static export would remove server AI routes. Desktop/native runtimes and extra services are outside the source-baseline scope. Containerization improves development consistency and self-hosting; it does not accelerate browser ray/geometry calculations or Web Audio.

## Verification

Check frozen installs, source synchronization, hot reload, development quality commands, standalone assets, API responses, non-root execution, health, and graceful shutdown. [Docker documentation](../deployment/docker.md) and maintenance reports distinguish actual runs from CI definitions and unavailable local daemon checks.
