# Security and license audit

The following ledger preserves the initial extraction's audit, including the
then-unpatched braces advisory and original client-only notice exception.
[The follow-up report](VERIFICATION_FIXES.md) records the subsequent bounded
braces patch, independently authored MIT marker replacements, strict zero-gap
runtime checks and actual reruns. The upstream version-based advisory remains
visible; the original notice has not been invented or retroactively discovered.

Audit date: 2026-10-13. Source scope: the immutable Build Week extraction in
[ORIGIN.md](../ORIGIN.md), its local maintenance changes, and installed dependencies.
No production deployment, provider request using a real key, or image publication
was performed. Results below distinguish completed checks from pending verification.

## Source audit: completed

The pristine extraction scan examined 283 text/configuration files and found zero
credential-shaped OpenAI/OpenRouter, GitHub, AWS access-key values or private-key
blocks. This is a targeted static check, not proof that every possible secret format
is absent. The extraction contained only `.env.example` with blank provider values;
no private environment file was inspected or copied. The original repository and its
published history were not rewritten.

A second maintenance-tree scan examined 359 text/configuration files, including
archived source documentation and supplemental notices, with zero matching values.
Git data, installed dependencies, `.next`, generated notices and browser/test
artifacts were excluded from this source scan and are separate verification scopes.

Only server provider configuration and API routes read provider environment
variables. Browser requests contain prompts/scenes or compact acoustic snapshots,
never a provider key. Neither API route logs prompts or provider payloads. There is
no source use of `eval`, `new Function`, or `dangerouslySetInnerHTML`. Strict scene
schemas, domain geometry validation, safe model-label policy, structured outputs,
disabled model tools, and the existing one-repair limit remain in place.

The audio loader uses registered `/audio/` paths. Local WAV/MP3/Ogg blobs stay in
IndexedDB or the documented memory fallback; project JSON contains metadata, and
local blobs are not submitted to an AI route. Browser AudioContext, HRTF, and workers
remain browser responsibilities.

## Independent security corrections from the tag: implemented

| Finding in source tag | Local correction | Verification status |
| --- | --- | --- |
| A production provider key automatically enabled anonymous paid routes | Production additionally requires explicit server `AI_ENABLED=true`; `false` disables either environment, and unset preserves local development behavior | Mock regression tests added; final results below |
| Client identity was derived from attacker-controlled forwarding headers/user agent | Preserve the client throttles and add one header-independent process budget shared by both routes: 20 accepted requests/minute | Cross-route identity-churn test added |
| Simultaneous requests could consume provider resources in parallel without a cap | Shared budget allows at most two in-flight requests; leases release on success or exception | Pending-provider/exception regression added |
| SDK retries could multiply calls outside the single domain repair allowance | Set `maxRetries: 0`; compilation retains at most one repair request | Source verified; provider network behavior remains mocked |
| `request.json()` accumulated an unbounded body before validation | Stream and cap actual UTF-8 bytes at 256 KiB, including absent/false Content-Length; return 413 `INVALID_REQUEST` | Boundary, multibyte, chunked, early-length and invalid-UTF-8 regressions added |
| Explanation request retained undeclared fields when sent to the provider | Project exactly the declared label/snapshot fields before domain validation and provider invocation | Nested extra-field regression added |
| AI results lacked an explicit cache prohibition | All AI JSON responses set `Cache-Control: no-store` | Success and failure headers tested |

The targeted AI regression suite passed: 7 files / 78 tests on Vitest 4.1.11,
including 13 new security cases. No real provider request was made.

API route URLs, scene schemas, model IDs, deterministic acoustic formulas, worker
coordination, Web Audio behavior, and browser persistence are unchanged by these
corrections. Oversized transport bodies use the existing failure contract; capacity
rejections use the existing `RATE_LIMITED` contract and `Retry-After` header.

Production opt-in is a configuration safeguard, not user authentication. **Before
exposing keyed routes publicly, the operator must put them behind an authenticated
gateway and configure provider spending limits and enforceable quotas.** The
in-memory budget is process-local, resets on restart, and is not a distributed quota
across multiple containers or serverless instances. Client header throttles are not
an authorization boundary. The default no-key/manual deployment requires no such
provider integration and remains usable.

## Dependency audit

The fresh source-lockfile `pnpm audit --json` returned exit 1 with 3 critical,
25 high, 15 moderate, and 1 low advisory (462 dependency records). The July 2026
release audit claiming zero critical/high is retained as historical evidence only;
it is not the current result.

Critical Next.js findings include the [Windows filesystem
RCE](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36),
[AVIF image optimization
RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4),
and [Node ImageResponse SVG
RCE](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j).
No `next/og`, `ImageResponse`, `next/image`, middleware/proxy, or i18n configuration
was found in application source; absence of explicit image imports does not by
itself disable Next's built-in image service. The native Windows baseline is
potentially affected by the Windows-specific advisory. Primary PostCSS advisories
also now include [source-map file
disclosure](https://github.com/postcss/postcss/security/advisories/GHSA-r28c-9q8g-f849)
and an [incomplete-fix
variant](https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp).

Dependency maintenance is recorded in [ARCHITECTURE_DEPENDENCIES.md](ARCHITECTURE_DEPENDENCIES.md).
The actual post-maintenance `pnpm audit --prod --json` passed with zero findings
(99 dependency records). The complete `pnpm audit --json` still returns exit 1:
one high development-only `braces@3.0.3` advisory, zero critical/moderate/low,
and 464 dependency records. The advertised patched `braces@3.0.4` was not published
at the registry check. The advisory is retained without suppression; do not infer
that the full audit passed from the production-only result. Exact versions, scoped
overrides, compatibility verification, and advisory links are in the dependency report.

## License and asset audit

The project MIT notice and procedural audio attribution are preserved. The four
48 kHz mono PCM WAV fixtures are reproducible from the original procedural generator;
the existing audio-asset tests validate format and provenance.

A read-only inventory of the pristine installed **Windows** dependency metadata
found 376 unique package versions: 317 MIT, 26 Apache-2.0, 15 ISC, 7 BSD-2-Clause,
2 BSD-3-Clause, 1 CC0, 1 0BSD, and 7 other declared licenses. No metadata license was
missing. The seven other entries include Sharp native Apache-2.0 AND
LGPL-3.0-or-later, argparse Python-2.0, axe-core/lightningcss MPL-2.0, caniuse-lite
CC-BY-4.0, and minimatch BlueOak-1.0.0. Original license files exist for these entries.
This Windows inventory does not validate a Linux image's native dependencies.

[THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) documents separate upstream
terms, Sharp/libvips source references, and runtime notice preservation. The Docker
builder collects the actual standalone runtime package inventory and original
notices, plus declared runtime dependencies such as OpenAI/Zod whose code is bundled
into server chunks, rather than relying on standalone tracing to include every
license file. Exact Next.js vendor manifests are mapped back to the installed
compiled distribution; its bundled license and `LEGAL` records are retained.

The initial actual Linux image inventory exposed eight missing notices and five
missing installed originals. This is recorded as an initial verification failure,
not a successful license audit. The collector was corrected to map bundled vendor
originals and supplement missing upstream files from [pinned notice
records](../licenses/README.md). Sharp/libvips packaging `v1.3.4` resolves to commit
`ebb95f8add54eee8bed840e3fb587e4cbec857d7`; its component notices, exact component
versions/source/build references, full LGPL-3.0/GPL-3.0 texts and libvips 8.18.7
LGPL-2.1 license are retained. Edge Runtime cookies 6.0.0 and ponyfill 4.0.0 license
bytes were recovered unchanged from exact npm tarballs and verified against their
registry SHA-512 integrity values.

`client-only@0.0.1` declares MIT but its published tarball has no original
copyright/permission notice or source revision. The original metadata and exact
publication integrity are preserved as an explicit provenance exception. Its React
homepage does not establish copyright ownership. No holder has been invented, no
other package's notice substituted, and a zero missing-file count must not be
described as resolution of this upstream attribution question.

Generated inventories are evidence of the platform actually built; Debian/Node
base-image notices are separate. No legal compliance certification is claimed.

The final no-cache Linux production image was inspected at immutable image ID
`sha256:aff89b6ca4e612cdaca8914ab328729d9022bd15727d05e723422e5ce909d313`
(386,448,422 bytes). It was built from the final source/configuration in 201.5614093
seconds; the previous successful image scan is retained as earlier evidence.
Its inventory contains 21 runtime packages (19 standalone packages and all five
declared dependencies, with overlap), four supplemental records, zero missing
license metadata or installed originals, and the one explicit `client-only`
notice exception. Every listed notice exists in the runner filesystem. Linux
libvips retains the complete LGPL/GPL texts and component notices; bundled OpenAI
6.48.0 retains three original notices and Zod 4.4.3 retains its MIT notice.

A read-only, network-disabled container scan inspected 1,453 runner text files
(20,655,557 bytes) and found zero matching credential-shaped values or private-key
blocks, zero `.env`/`.git` entries, and zero provider-key environment symbols in
client static files. The runner has no root `src` or `tests` directory. Image
configuration has no credential environment names, runs as `node`, exposes only
`3000/tcp`, and specifies `SIGTERM`; layer-history checks found zero matching
credential shapes, private-key blocks, or `.env` COPY commands. These targeted
checks do not prove absence of every possible secret encoding or constitute a
complete operating-system/image vulnerability scan.

The first rerun of the custom image scanner read an incorrect inventory field
(`files` instead of `notices` joined under each package directory), so its notice
assertions failed despite present files. The scanner was corrected and its
filesystem assertions rerun successfully against immutable image IDs. This harness
failure is separate from the genuine initial missing-notice failure documented
above. Final scan and configuration/layer-history JSON are retained separately in
the sibling `verification-logs/security-final-no-cache-image-scan.json` and
`security-final-no-cache-image-config-history.json` files.

## Final verification ledger

| Check | Result |
| --- | --- |
| Pristine extraction targeted sensitive scan | PASS: 283 files, zero matching values |
| Maintenance-tree targeted sensitive scan | PASS: 359 source/doc/config files, zero matching values at recorded scan |
| Server-only credential / local-audio boundaries | PASS: source inspected |
| New AI mock unit regressions | PASS: 7 files / 78 tests, including 13 new cases |
| ESLint for changed AI source/tests and notice collector | PASS: zero warnings |
| Development container lint / typecheck / full unit suite | PASS: non-root Linux container, 524 tests; see Docker verification report |
| Development hot reload and restart/browser persistence | PASS: final-config host Chromium observed 1,173 ms source update and preserved listener X=2.25 after restart; earlier 920 ms result is separate evidence in [DOCKER_VERIFICATION.md](DOCKER_VERIFICATION.md) |
| Final full unit/lint/typecheck/build/E2E | See [FINAL_VERIFICATION.md](FINAL_VERIFICATION.md); not inferred here |
| Post-maintenance production dependency audit | PASS: zero findings, exit 0 |
| Post-maintenance complete dependency audit | FAIL: one high development-only braces advisory, exit 1; published fix unavailable |
| Native Windows runtime notice collector | PASS: 20 packages incl. bundled OpenAI/Zod, zero missing metadata/originals; one explicit client-only notice provenance exception |
| Production Linux runtime inventory / retained notices | PASS retention: 21 runtime packages, zero missing metadata/originals, every listed notice present; one explicit client-only upstream provenance exception remains |
| Image filesystem/environment/client static targeted secret scan | PASS final no-cache image: 1,453 text files / 20,655,557 bytes, zero matching credential values or private keys; no .env/.git or client credential symbols |
| Image layer-history targeted secret scan | PASS: zero matching credential shapes, private-key blocks, or .env COPY commands |
| Real paid-provider requests | NOT RUN; mocks only |
| Distributed gateway authorization and provider spending enforcement | OPERATOR CONFIGURATION; not implemented by this application |

Security reporting guidance is in [SECURITY.md](../../SECURITY.md). Do not attach
provider credentials, local audio blobs, or private scene data to a public issue.
