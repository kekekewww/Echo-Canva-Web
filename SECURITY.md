# Security Policy

## Reporting a vulnerability

Do not publish API keys, private audio, exploit details, or personal information in an issue or pull request. Use [GitHub private vulnerability reporting](https://github.com/kekekewww/Echo-Canva-Web/security/advisories/new) if the published repository enables it. If it is unavailable, use a private contact method listed on [the repository owner's GitHub profile](https://github.com/kekekewww), or ask for a private reporting channel without disclosing vulnerability details.

Include the affected commit/version, environment, a minimal reproduction without live credentials, impact, and a proposed fix if available. Maintainers will triage reports according to available capacity. No response-time commitment or dedicated security support team is implied.

The maintained branch receives security fixes. Historical Build Week archives and the original source repository are provenance records; they do not inherit fixes from this extracted repository. See [ORIGIN.md](docs/ORIGIN.md) and the [security and license audit](docs/maintenance/SECURITY_LICENSE.md) for extraction-specific findings and changes.

## Credentials and optional AI

The manual editor, presets, deterministic acoustics, and browser audio work without provider credentials. Production AI routes require explicit `AI_ENABLED=true`; the provided production Compose setup defaults to `AI_ENABLED=false`. In local development, an unset `AI_ENABLED` preserves the configured-provider behavior; `AI_ENABLED=false` disables provider use explicitly.

Store keys in local `.env.local` for native development, or in the deployment's runtime environment/secret mechanism. Never use a `NEXT_PUBLIC_` variable for a secret, add a key to Docker build arguments, bake `.env` into an image, or commit credentials. Examples contain placeholders only. Ignore files are protection against mistakes, not a secret-management system.

An operator who enables AI on a publicly reachable server must place these routes behind an authenticated TLS gateway and set provider spending/request quotas. The application has no user accounts or built-in authentication service. Its per-process request/concurrency bounds reduce accidental resource usage; they are not a distributed quota or authorization boundary. Horizontal replicas each have their own counters. Do not expose a shared provider key through an unauthenticated paid endpoint.

AI input/output is untrusted. Compiler results must pass strict schema and domain validation; explanatory output must remain grounded in the deterministic snapshot. Model output must never execute code, load arbitrary URLs, set Web Audio parameters, or become an authoritative acoustic computation. Automated tests use mocks and need no real API key.

## Browser and server responsibilities

AudioContext, HRTF rendering, acoustic Workers, localStorage projects, and IndexedDB audio execute in the user's browser. Local audio blobs are not uploaded to the Next.js API routes. Scene descriptions and compact acoustic snapshots submitted to an enabled AI provider do leave the browser; avoid including sensitive names or prompt content.

Serve remote deployments over HTTPS. Browser audio requires a user gesture and browser permissions/policies; no host audio device, privileged container, host network, or container desktop is required. Container health checks report server liveness only; they do not assess audio perception or acoustic accuracy.

## Dependency and deployment maintenance

Use frozen lockfile installs, review dependency advisories and licenses, and document upgrades separately from acoustic behavior changes. The production image runs as a non-root user and includes the standalone server and required assets. Keep runtime secrets out of images, CI logs, support reports, and exported scenes. Fork pull requests must run without deployment credentials and paid provider keys.

Retain [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), the MIT License, asset provenance, and runtime third-party license notices. A vulnerability audit and a redistribution/license audit answer different questions; both results belong in maintenance evidence.

If a credential is exposed, revoke/rotate it at the provider first, then remove the exposure and assess logs and billed usage. Deleting a file or rewriting a commit alone does not invalidate a leaked credential.
