# Echo Canvas fixed corpus

A fixed, hash-pinned set of inputs and expected outputs for the Classic 2.5D and Hybrid 3D acoustics, plus the rules that decide when another implementation counts as equal. The expected outputs were produced by the TypeScript implementation at the baseline commit recorded in `v1/manifest.json`. A future adapter (Rust, WASM, anything that can read JSON) is held against the same files.

Nothing here times or profiles anything, and nothing touches audio.

## Layout

```text
benchmarks/corpus/
  README.md
  harness/                 TypeScript serial adapter, case definitions, lcg32 generator
  v1/
    manifest.json          corpus id, baseline commit and tree hashes, rules hash, one entry per case
    comparison-rules.json  field classes and the rules that map output paths to classes
    inputs/<caseId>.json   frozen inputs, authored key order, 2-space indent, LF
    expected/<caseId>.json frozen outputs, canonical form, LF
    evidence/sensitivity.json  how far outputs move under tiny coordinate noise
scripts/corpus/
  lib.mjs                  canonical JSON, comparator, verifyCorpus (reads JSON only, no TypeScript)
  cli.mjs                  verify, run, compare, rerun, freeze, refresh-rules-hash
tests/corpus/              generator, run entry, sensitivity (vitest.corpus.config.ts)
```

Inputs keep their authored key order. The Classic static fingerprint hashes `JSON.stringify(scene)`, so sorting input keys would change it. Only outputs are written with sorted keys.

## Commands

All commands run from the repository root.

```text
node scripts/corpus/cli.mjs verify [--require-frozen]
node scripts/corpus/cli.mjs run --run-id <id> [--order manifest|reverse] [--out <dir>]
node scripts/corpus/cli.mjs compare <dirA> <dirB|expected> [--json <path>]
node scripts/corpus/cli.mjs rerun [--out <dir>] [--evidence <path>]
node scripts/corpus/cli.mjs freeze --frozen-on <YYYY-MM-DD>
node scripts/corpus/cli.mjs refresh-rules-hash
```

Every command also accepts `--corpus <dir>` to point at a copy of `v1`. `package.json` has `corpus:verify`, `corpus:run`, `corpus:compare` and `corpus:rerun`, each calling the CLI with that command. `corpus:verify` passes `--require-frozen`, so it fails if the rules are not frozen with every class decided.

- `verify` checks, and reports every problem instead of stopping at the first: each input and expected file exists, matches its recorded SHA-256 and byte count, and has no CRLF and no UTF-8 BOM; files in `inputs/` or `expected/` that the manifest does not list; each expected file is in canonical form and records the `caseId`, `kind` and `outcome` the manifest says; the rules file matches `rules.sha256`; every leaf of every expected file is matched by exactly one rule. With `--require-frozen` it also fails unless the rules are frozen and no class is still `proposed`.
- `run` starts a new `vitest` process (`vitest.corpus.config.ts`, `tests/corpus/run.corpus.ts`) that runs every case through the TypeScript adapter and writes `<out>/<runId>/outputs/<caseId>.json` and `<out>/<runId>/run.json`. The default `--out` is `.corpus-runs`, which is git-ignored. `run.json` holds the run id and order, the manifest hash, git head, repo-relative dirty paths, product tree hashes and whether they match the baseline, node/V8/platform/arch/CPU model/logical CPU count, per-case output hashes, their aggregate SHA-256, the paths where an output contained `-0`, and the start time. Values git cannot supply are the string `"unavailable"`. It carries no host name, user name or absolute path.
- `compare` holds the first directory (the run under test) against the second, which is another run directory or the word `expected`. It exits non-zero on any violation, missing case, or extra output file in either directory.
- `rerun` verifies the corpus, then runs A and B in manifest order and C in reverse order, each in its own process, and compares A against B and A, B and C each against `expected`. It fails if the three aggregate hashes are not identical, even when every comparison is within tolerance.
- `freeze` refuses unless every class is `discrete`, `existing-test` or `approved`. Otherwise it sets `status` to `frozen`, records `frozenOn`, and rewrites `rules.sha256`.
- `refresh-rules-hash` rewrites only `rules.sha256`, for use while the rules are draft. It refuses, and changes nothing, once the rules are frozen.

`run.json` also records `productTreeDiffs` and `productTreesMatchBaseline`. Committed trees at `HEAD` are compared with `baseline.treeHashes` in the manifest for `src`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` and `patches`. `package.json` is compared by the SHA-256 of its canonical JSON with the `scripts` field removed (`baseline.packageJsonNoScriptsSha256`, read from the baseline commit when the corpus was generated), because this work adds scripts to it. `productTreeDiffs` lists the paths that differ and `productTreesMatchBaseline` is true when it is empty. Uncommitted changes do not affect either; they appear in `gitDirty`. When git is unavailable, or the baseline is missing from the manifest, both are `"unavailable"`, because nothing was checked. `packageJsonNoScriptsSha256` in `run.json` is the value computed from `HEAD`.

Regenerating the corpus and the sensitivity evidence needs an explicit opt-in. The generator refuses to rewrite inputs and expected outputs once the rules are frozen; the sensitivity entry writes only evidence and has no such gate:

```text
ECHO_CORPUS_UPDATE=1 corepack pnpm exec vitest run --config vitest.corpus.config.ts tests/corpus/generate.corpus.ts
ECHO_CORPUS_UPDATE=1 corepack pnpm exec vitest run --config vitest.corpus.config.ts tests/corpus/sensitivity.corpus.ts
```

## Adapter contract

An adapter reads `inputs/<caseId>.json` and returns one JSON document per case. Compare it by writing the documents to `<dir>/outputs/<caseId>.json` and running `compare <dir> expected`. The TypeScript adapter, `harness/ts-serial-adapter.ts`, is the reference for every shape below. `harness/types.ts` declares the case kinds, and the case definitions in `harness/definitions/` show how each input is built.

Every output is an object with `caseId`, `kind` and `outcome`:

- `outcome: "ok"` carries `value`, whose shape depends on `kind`.
- `outcome: "error"` carries `error: { name, message }`. The TypeScript adapter produces this when the implementation throws.

| kind | `value` |
| --- | --- |
| `classic-frame` | `{ staticFingerprint, frame }`, the Classic acoustic frame at time 0 |
| `hybrid-frame` | `{ staticGeometryHash, frame, audible, earlyTapsBySource }` |
| `hybrid-visibility` | one entry per query: `{ hits, hasHit, reverseHasHit }`, plus `hasHitAccepted` and `legVisible` when the query lists allowed walls |
| `hybrid-second-order` | `{ exhaustive, pruned: { paths, stats } or null, evaluation or null }` |
| `hybrid-patch` | the built acoustic patch (vertices, normal, AABB, thickness, openings) |
| `scene-validation` | the validator result, `{ ok, errors }` |
| `workspace-migration` | `{ result, ... }`, with the migrated project, projected scene or document, history, warning and the recomputed frame where the route produces them |
| `classic-tape` | `{ steps }`, each step `{ step, event, staticFingerprint, frame }` |
| `hybrid-tape` | `{ steps }`, each step `{ step, event, staticGeometryHash, classicProjectionHash, frame }` |

A tape step that fails validation is `{ step, event, outcome: "error", error }` and ends the tape. The recorded cases contain no such step.

Output files are canonical: keys sorted by UTF-16 code unit at every depth, 2-space indent, LF, one trailing newline, `undefined` members dropped. `NaN` and the infinities have no JSON form, so canonicalisation throws with the offending path. Negative zero is written as `0`, so an output file cannot hold `-0`. The `negativeZeroLeafCount` that `compare` prints counts only what the compared files hold, so it is 0 for files written by the TypeScript adapter. The authoritative record is `negativeZeroPaths` in `run.json`, taken before the text is written.

## Comparison rules

`comparison-rules.json` has `status` (`draft` or `frozen`), `frozenOn`, `classes` and `rules`.

A rule is `{ kinds, path, class }`. `path` is a JSON Pointer in which `*` stands for exactly one segment (an array index or a source, wall or portal id) and a final `**` stands for one or more remaining segments. `**` anywhere else is rejected. A leaf must be matched by exactly one rule that lists the case's kind. No rule gives `unclassified`, and two rules give `ambiguous`, so a field added by later product work fails even when its value is unchanged. Leaves are primitives and empty arrays or objects.

A class gives the comparison:

| `compare` | passes when |
| --- | --- |
| `exact` | the values are identical (strings, booleans, integers, ids, hashes, array order and length) |
| `decimal` | both numbers rounded with `toFixed(decimals)` are equal |
| `tolerance` | `abs(actual - expected) <= max(atol, rtol * max(abs(actual), abs(expected)))` |
| `circular` | the difference wrapped into one `period` is at most `atol` |

Each class also has a `unit` (required unless `exact`), a `status` and a `source`:

- `discrete`: exact by nature.
- `existing-test`: the value is asserted at that precision by a test or reviewed oracle in this repository, and `source` names the `file:line`.
- `proposed`: the value is a proposal that still needs a maintainer decision.
- `approved`: a maintainer decided. Only this status, `discrete` and `existing-test` can be frozen.

The `passthrough` class is exact. It covers numbers that workspace migration copies from its input without calculating. It is applied with `**` to the project, scene, document and history parts of a migration output.

A structure change (a missing or extra leaf, an array that became an object, a number that became a string) is always a violation. A number that is `-0` on one side and `0` on the other compares as equal in a continuous class, is reported in the comparator report's `negativeZeroPaths`, and keeps the case from counting as bit-exact. Output files cannot hold `-0`, so this only arises when values are compared in memory; the `negativeZeroLeafCount` of a `compare` run reflects only the files it read, and `run.json`'s `negativeZeroPaths` is the authoritative record. An `exact` class treats `-0` and `0` as different.

## Case families

86 cases. The ids use a letter prefix.

| prefix | kind | what it covers |
| --- | --- | --- |
| `C` | `classic-frame` | the ten Classic regression scenarios `C001` to `C010`, `C011` to `C013` source-count stress and `C014` reflection-heavy |
| `H` | `hybrid-frame` | the same rooms as Hybrid documents, 3D stress and a blocked second-order document |
| `V` | `hybrid-visibility` | portal aperture, reflector allowance, 2048 seeded segments |
| `SO` | `hybrid-second-order` | exhaustive and pruned second-order search |
| `M` | `workspace-migration` | accepted and rejected project, document, cache and transfer payloads |
| `DC`, `DH`, `DV`, `DK` | `classic-frame`, `hybrid-frame`, `scene-validation`, `hybrid-patch` (and one `hybrid-visibility`) | degenerate geometry: coincident points, grazing and collinear routes, invalid scenes and patches |
| `TC`, `TH` | `classic-tape`, `hybrid-tape` | event tapes: a seeded listener tape and a static edit tape for each mode |
| `CL`, `HL`, `LC`, `DV09`, `SO005` | `classic-frame`, `hybrid-frame`, `scene-validation`, `hybrid-second-order` | clamps, caps and locale behaviour: pre-delay floor and ceiling, early-delay cap, second-order path limit, second-order top K, representative-patch cap, room dimension limit, id tie-breaks under `localeCompare`, Unicode scene names. Tagged `limit` or `locale`. Added to v1 under a one-time maintainer exception, after mutation testing showed these constants unpinned |

### Scenario coverage

| scenario | cases |
| --- | --- |
| S1 hard and treated rooms | `C006`, `C007`, `C008`, `C009`, `H005`, `H006` |
| S2 concrete partition with a portal | `C001`, `C002`, `C003`, `C004`, `C005`, `H001`, `H002`, `H004` |
| S3 geometry stress | `C010_STRESS_100_WALLS`, `H007_STRESS_8_PRIMITIVES` |
| S4 source-count stress | `C011`, `C012`, `C013`, `H008`, `H009`, `H010` |
| S5 seeded listener tape | `TC01_LISTENER_TAPE_SEEDED`, `TH01_LISTENER_TAPE_SEEDED` |
| S6 static edit tape | `TC02_STATIC_EDIT_TAPE`, `TH02_STATIC_EDIT_TAPE` |
| S7 reflection-heavy and second order | `C014_REFLECTION_HEAVY`, `H003_SECOND_ORDER_BLOCKED`, `SO001`, `SO002`, `SO003`, `SO004` |

Scenarios S8 to S10, and a tape of 60 Hz over 60 s, are not covered. They belong to EC-102 and later work, which is about timing and audio, and this corpus has neither. The recorded tapes have 64 and 24 steps.

## Sensitivity evidence

`v1/evidence/sensitivity.json` is generated by `tests/corpus/sensitivity.corpus.ts`. For the four frame and tape kinds it moves every plan coordinate stored under `position`, `a` or `b` (listener, sources, wall endpoints, primitives, tape events) by plus or minus 1e-12 m or 1e-9 m, with the sign drawn from `lcg32(20261106)`. It records, per field class and delta, the largest absolute change and where it happened, the discrete flips with their first three examples, and how many leaves left the class tolerance. Units that flipped (a reordered or resized array, a changed id, an input that no longer validates) are reported separately, because comparing arrays by index after a reorder measures the reorder and not the numeric drift. Hashes of the exact input doubles are counted in `hashChanges` and are not treated as flips. Only the four kinds above are perturbed, so classes that appear in the other kinds have no sensitivity data.

## Changing the product on purpose

A product change that alters outputs needs an ADR and a new corpus version. `v1` stays as baseline evidence, and live replay moves to the newest version, which gets its own freeze, maintainer tolerance approval and acceptance run.

- Replay failing on a product pull request is the corpus doing its job. Read the violation, then decide whether the change is intended.
- Do not flip `status` back to `draft` or regenerate a frozen version to make replay pass. That is what this section exists to prevent. `verify --require-frozen`, the evidence anchors in `tests/unit/corpus-integrity.test.ts` and the refusals in the generator and `refresh-rules-hash` all assume a frozen version never changes.
- `AGENTS.md` already requires an ADR, a migration and regression evidence for intentional changes.
- `v1` is hardcoded today in `scripts/corpus/lib.mjs` (the `CORPUS_PREFIX` constant), `scripts/corpus/cli.mjs` (the default corpus and `inCorpus`), `tests/corpus/run.corpus.ts`, `tests/corpus/generate.corpus.ts` and the tests. The first new version has to parameterise those paths.

## Adding a case

While the rules are draft, add the definition under `harness/definitions/`, regenerate with the generator command above, run `refresh-rules-hash` if the rules changed, and `verify`. Once the rules are frozen the generator refuses and the files are immutable: a new case or a changed tolerance means a new corpus version directory (`v2`), not an edit of `v1`.

## Known limits

- Error messages come from the TypeScript implementation. An adapter in another language reaches `outcome: "error"` for the same cases, but its `error.name` and `error.message` will differ, and `error.*` is compared exactly.
- Validation messages in `/value/errors/*/message` hold zod text, for example "Too big: expected number to be <=50" in `DV03` and `DV06`. A zod upgrade fails replay, and a port would have to copy zod's wording.
- Hash and fingerprint fields are JavaScript-specific: they depend on `JSON.stringify` key order and on an FNV hash over `for...of` code points.
- `-0` is reported, not preserved. Files hold `0`, so an adapter that produces `-0` is compared as `0`. `negativeZeroLeafCount` in a `compare` result reflects only what the compared files hold; `negativeZeroPaths` in `run.json` is the authoritative record.
- Arrays are compared by index. A different but valid ordering of ties is a violation, and the sensitivity evidence shows that tied reflections can swap order under noise as small as 1e-12 m.
- `existing-test` is a claim about where a precision is already asserted. It is not a claim that the precision is the right one.
- `azimuthDeg` is undefined when the source is directly above or below the listener. `DH02` is compared at its exact input, where it is bit-identical on Windows and Linux. A small coordinate shift moves it by 135 degrees, so a future port must handle this deliberately.
- The output order of Classic reflections is set at `src/acoustics/compute-frame.ts:156-161`. Array order is part of the contract, so a port with different float noise in symmetric scenes can fail on order.
- Three clamps cannot be reached by a valid scene, so no case pins them: `MIN_PORTAL_LOWPASS_HZ` (a route holds at most 8 portals, so the lowpass never falls below 8000 Hz), `MIN_REFLECTION_GAIN_DB` in `src/acoustics/image-source.ts` (a first-order tap that passes the 80 ms delay cap is never quieter than about -53 dB) and `MIN_LOWPASS_HZ` in `src/acoustics/hybrid3d/reflection-rendering.ts` (no registry material has a high-to-mid reflection ratio below 0.63).
- `fnv1a` adds `charCodeAt(0)` of each code point, which is only the high surrogate for a character outside the BMP. `LC03` and `LC05` differ only by U+1D11E and U+1D11F and have the same `staticFingerprint`.
- Reflection ties are ordered by `localeCompare`. `LC01` and `LC02` use ids whose locale order differs from code-unit order. Outputs did not change under the collation locales en, zh-TW, de, sv, cs, et, lt, da and tr, but a port has to reproduce the ICU ordering of those ASCII ids or fail those two cases.
- The six Classic oracle classes use six-decimal rounding to match the existing test, which can fail on noise when a value sits at a rounding boundary.
- `classicProjectionHash` and `staticFingerprint` both hash `charCodeAt(0)` per code point, so names that differ only in a non-BMP low surrogate collide. `LC03` and `LC05` pin this. `classicProjectionHash` is a persisted compatibility check at `src/domain/scene-document/validate.ts:53`.
- Eight `localeCompare` sites change no case when mutated singly: `room-acoustics:62`, `image-source:151`, `:225`, `:238`, `bvh:42`, `:79`, `:156` and `second-order:82`. `LC01` and `LC02` catch `compute-frame:158`, `reflections:106`, `second-order:59`, `reflection-rendering:59`, and all sites together.
- Three guards cannot trigger for any valid scene, so they are not pinned: `MIN_PORTAL_LOWPASS_HZ` (8 portals give 8000 Hz), `MIN_REFLECTION_GAIN_DB` (worst -52.97 dB against a -60 floor), and `MIN_LOWPASS_HZ` in `reflection-rendering.ts` (registry minimum 12659 Hz). `MAX_REFERENCE_SECOND_ORDER_PATCHES` (32) applies only to the reference oracle and is not pinned; `HL04` pins the frame path's 24.
