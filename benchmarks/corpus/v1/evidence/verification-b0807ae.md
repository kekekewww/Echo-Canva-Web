VERDICT: VERIFIED

Independent EC-101 verification dated 2026-11-06. Candidate: b0807aedbc31b34f7db97ab565483c82e14d6191. Baseline: 98a4374fa839aa5dee7c6c35e575b8003f7f1a31. Every maintainer acceptance criterion passes on freshly produced evidence. The findings identify real coverage/trust limits; none blocks these stated criteria. This verdict does not assert exhaustive regression coverage or physical acoustic accuracy.

Verifier: GPT-Sol gpt-6.1-sol via Codex. Environment: Node v22.23.3, Windows (win32), x64, PowerShell. Sandbox mode: danger-full-access, without enforced operating-system isolation. Local shell only; no network or browser/MCP access. Before every Node invocation, TEMP, TMP and TMPDIR pointed to the absolute assignment-local scratch/tmp directory. Installed process-skill guidance was read locally; no configuration was modified. All audit scripts, copies, temporary data and logs are under scratch/. Ignored Vitest caches were relocated under scratch/tool-caches/. No commits, pushes or external changes were made.

## A. Identity and scope

Git confirmed both full SHAs. The command git diff 98a4374 b0807ae -- src pnpm-lock.yaml is empty. Independent comparison also confirms recorded equivalence between branch point dd57934 and baseline 98a4374 for source, package, lockfile, workspace, patches, Next/TypeScript/Vitest configuration, Node version and existing Classic oracle. All 26 intervening commits were inspected, including merge-parent diffs: no product source/lockfile/configuration change was introduced and later reverted. Package changes add only four corpus scripts.

Every changed path outside the brief's corpus/knowledge areas:

| Path | Effect on product behavior |
| --- | --- |
| .dockerignore | Includes corpus/config in Docker build context for tests. Changes context contents/size; no acoustic/application runtime change. Docker was not run. |
| .gitignore | Ignores local tooling and corpus runs; source-control hygiene. |
| AGENTS.md | Adds memory-policy links; governance only. |
| CLAUDE.md | Contributor/agent guidance and commands; documentation. |
| docs/README.md | Knowledge-index link; documentation. |
| docs/adr/README.md | Research-proposal register link; documentation. |
| eslint.config.mjs | Ignores local tooling; affects lint scope, not runtime. |
| package.json | Adds corpus:verify/run/compare/rerun; existing commands/dependencies unchanged. |
| scripts/lint-knowledge.mjs | Standalone knowledge validation; not imported by application. |

Final candidate status is clean. Baseline tracked status/diff is clean; its only untracked paths are the permitted overlay: benchmarks/corpus/, scripts/corpus/, tests/corpus/, vitest.corpus.config.ts. Overlay was extracted from a candidate git archive and changed no tracked baseline file. No parent checkout was modified. Evidence: scratch/independent-audit.json and scratch/rules-claims-privacy.json.

## B. Independent hash and format check

scratch/independent.mjs imports only Node built-ins, not the harness or comparison library. It independently hashed all 172 input/expected files from 86 manifest entries, checked byte counts, recursively checked missing/unlisted case files, checked LF/no CR/no UTF-8 BOM, and checked canonical expected JSON. No mismatch or orphan case file. Supporting manifest/rules/evidence files are not case payloads.

| Artifact | Independent SHA-256 |
| --- | --- |
| comparison-rules.json | ecd33cd6bb4010474a471dc2e937f302d14ec6d8aaffcd2b819ab8bb6cc6fa74 |
| evidence/acceptance-rerun.json | 6452a2261a97bcd8a4ddf91284390ae2e29a6a354d1d8499a937086b4efec265 |
| evidence/sensitivity.json | 5f4854bca7a800ba065835cbe4d4f2c8a31323e71e6f728b56bd901016d73d3b |
| manifest.json | 4b4bf901d2fadd8bf8266482739a30bd3b19de6dd1cd047fd80f59c0ee3e1fb6 |

The aggregate definition was read from lib.mjs only for its format: sort case IDs by JavaScript code-unit order, concatenate caseId + space + fileHash + LF, then SHA-256. Using independently recomputed byte hashes:

- Input aggregate: 6021c7169bf6f4cf0888d40abc344b161ededf819488e7ffb846d110233129e9
- Expected aggregate: 76d6ad8b3a2b5d1fe0dbec6b0372676903821332c56fb4ecbe53ec897c1598e6

Expected caseId, kind and outcome match the manifest; replay/integrity checks also corroborate this. Evidence: scratch/independent-audit.json.

## C. Rerun at the baseline SHA

Ran these as two separate top-level Node invocations in baseline:

- node scripts/corpus/cli.mjs rerun --out <scratch/baseline-1> --evidence <scratch/baseline-1.json>
- node scripts/corpus/cli.mjs rerun --out <scratch/baseline-2> --evidence <scratch/baseline-2.json>

Angle-bracket arguments denote assignment-local output paths, not literal shell syntax. Each invocation starts A/B in manifest order and C reversed, in separate child processes. Then ran in candidate: node scripts/corpus/cli.mjs run --run-id candidate --out <scratch/candidate-run>.

| Run | Head | Violations | Bit-exact |
| --- | --- | --- | --- |
| baseline-1/A | 98a4374 | 0 | 86/86 |
| baseline-1/B | 98a4374 | 0 | 86/86 |
| baseline-1/C | 98a4374 | 0 | 86/86 |
| baseline-2/A | 98a4374 | 0 | 86/86 |
| baseline-2/B | 98a4374 | 0 | 86/86 |
| baseline-2/C | 98a4374 | 0 | 86/86 |
| candidate-run/candidate | b0807ae | 0 | 86/86 |

Each of all seven run aggregates, independently recomputed from output-file bytes, is:

76d6ad8b3a2b5d1fe0dbec6b0372676903821332c56fb4ecbe53ec897c1598e6

For EACH baseline top-level rerun, repository comparisons A-B, A-expected, B-expected and C-expected reported 86 cases, zero violations, 86 bit-exact, zero missing/extra outputs and identical aggregates. Separate CLI comparisons of candidate against baseline-1/A and baseline-2/A reported the same counts. My comparator checked each of all seven runs against expected: 135,147 leaves per run, zero violations, 86/86 bit-exact.

All baseline gitHead fields equal the full baseline SHA; candidate records the full candidate SHA. Every run records productTreesMatchBaseline=true and productTreeDiffs=[]. Source tree: 8550eb37f1486053b86bcfbefd15f6156e2e02ab. Lockfile object: 572834c945b6b40b3b043430eac085edaa42510b. Canonical package-without-scripts SHA-256: 5f01ee87071cad8b0c88299047fc3e27c4c87d1bd231162f8bb70693e5b09e93. Candidate's raw package object appropriately differs because scripts were added. These fields describe committed HEAD; separate clean tracked diffs establish checkout integrity.

Evidence: scratch/baseline-1.json, scratch/baseline-2.json, scratch/rerun-independent.json and seven run/output directories.

## D. Independent comparison

My comparator implements JSON Pointer escaping; one-segment * and terminal one-or-more-segment **; leaf/container/type/array-length checks; exact Object.is semantics; numeric toFixed rounding; documented absolute/relative tolerance formula; and shortest circular difference. Empty arrays/objects count as leaves. All 135,147 leaves match exactly one rule: zero unclassified or ambiguous.

| Class | Leaves |
| --- | --- |
| classic-cutoff-hz | 222 |
| classic-delay-ms | 570 |
| classic-gain-db | 792 |
| classic-length-m | 1458 |
| classic-new-area-m2 | 117 |
| classic-new-cutoff-hz | 570 |
| classic-new-delay-ms | 117 |
| classic-new-gain-db | 222 |
| classic-new-length-m | 3518 |
| classic-time-s | 351 |
| classic-volume-m3 | 117 |
| discrete | 60922 |
| hybrid-aux-delay-ms | 269 |
| hybrid-aux-length-m | 20838 |
| hybrid-azimuth-deg | 218 |
| hybrid-cutoff-hz | 163 |
| hybrid-delay-ms | 1808 |
| hybrid-direction | 3951 |
| hybrid-elevation-deg | 218 |
| hybrid-gain-db | 331 |
| hybrid-length-m | 1097 |
| hybrid-metric-ms | 5 |
| hybrid-metric-ratio | 15 |
| hybrid-point-m | 34884 |
| passthrough | 2374 |

Repository and independent comparisons agree for all fresh runs. Seventeen deliberate probes also agree: identical values, decimal inside/outside rounding, tolerance inside/outside threshold, circular wrap by 360 and inside/outside threshold, changed IDs, reordered arrays, unknown fields, overlapping rules, missing fields, numeric-to-string, array-to-object, and negative zero in continuous/exact fields.

All 23 non-exact classes have units. No fractional number occurs in the generic discrete class. Passthrough has 2,374 leaves, including 1,442 numeric leaves and 292 fractional numbers; its status is discrete intentionally because migration copies/defaults are exact. Thus a literal query for STATUS discrete includes those 292 approved pass-through fractions; these are not calculated acoustics.

Current numeric passthrough values are copied, selected/rearranged, or supplied as explicit defaults. Generated integer history-path indices are the documented exception. Acoustic frames are classified separately. Traced input to output and implementation:

- M002 listener height 1.7 m: spatial3d.listenerHeightM to listeners[0].position.y in persistence.ts, then copied into projected document.
- M002 source heights 1.2 m: spatial sourceHeightsM spread into project, then copied by projections.ts.
- M008 source x=7.25 and plan y=4.5 m: frozen transfer project.scene through envelope validation/transfer parsing into project and projected base scene.
- M005 panX/panY=0: migrateView explicit fallback, without numerical calculation.
- M004 history values x 3 to 4, z 4 to 2, revision 0 to 1: copied before/after values; generated array index 0 is exact.

The broad passthrough rule cannot prove numeric origin for future fixtures. Accepted current M cases have no primitive footprints requiring calculated projection coordinates; future cases need the same origin audit.

Unit samples against source (more than six): Euclidean physicalDistanceM/pathLengthM are m; volume is area times height in m3 (room-acoustics.ts:119); totalSurfaceM2 sums m2 (:135); Eyring RT60 is s (:102-109); preDelay and Classic relative reflection delay divide m by 343 m/s and multiply by 1000, yielding ms (:154, compute-frame.ts:165); logarithmic amplitude gains are dB (image-source.ts); cutoffs are Hz; Hybrid points are m, normalized directions dimensionless, and atan2/asin times 180/pi are degrees (hybrid3d/direct.ts). No sampled unit mismatch.

Independent traversal BEFORE serialization found 144 negative-zero leaves in 25 cases, exactly matching run.json. Files normalize them to zero. Continuous -0 versus 0 passes but is not bit-exact; exact -0 versus 0 fails. Evidence: scratch/extended-results.json, scratch/raw-zero.json, scratch/independent.mjs.

## E. Rules against the maintainer decision

Independent comparison found no policy mismatch across all 25 classes. Status=frozen, frozenOn=2026-11-06; 2 discrete, 9 existing-test, 14 approved, no proposed class.

- Six Classic oracle classes (length, volume, time, delay, gain, cutoff) use decimal 6. Read classic-baseline.ts round/projectFrame and classic-baseline-capture.test.ts deep equality against mvp-baseline.json; all six field groups really occur in that rounded oracle.
- Five Classic non-oracle classes use approved atol=1e-6, rtol=0.
- Hybrid length: cited direct-test :141/154, reflection-test :26/41/53 and second-order-test :55 use closeTo with default absolute tolerance 1e-5.
- Hybrid delay: direct-test :142, reflection-test :27/42/54, first-order excessDelayMs :28, second-order-test :56-60 assert 1e-5 explicitly or through that helper.
- Hybrid elevation: direct-test :143/155 uses default/explicit 1e-5. These are absolute-error helpers, not inferred Vitest decimal precision.
- Other Hybrid continuous fields use approved atol=1e-5, rtol=0. Azimuth uses approved circular atol=1e-5, period=360. Cited azimuth tests establish absolute precision; circular wrapping is correctly a separate approval.
- IDs/enums/booleans/hashes/counters/order/length and migrated passthrough remain exact; fixed timestamps here are integers.

Evidence: scratch/rules-claims-privacy.json and cited source/test files read locally.


## F. Provenance

Every manifest case records source type and existing reference paths, MIT repository provenance, seed object or explicit null, and input/output hashes and sizes. All source references exist. All hashes were independently checked in B.

Independently projected C001-C010 into the existing oracle shape, rounded every continuous oracle field with Number(value.toFixed(6)), and compared every leaf and array order with mvp-baseline.json. All ten matched, zero mismatches. No harness projection helper was imported.

Independently regenerated V003 using the cited test recurrence: state=(imul(state,1664525)+1013904223)>>>0, random=state/2^32, seed 20261013. All 2,048 full queries and allowed wall IDs match exactly, including 293 zero-length queries and the nonzero parallel-query branch. No corpus PRNG/helper was imported.

Independently regenerated both TC01 and TH01 tapes from seed 20261106: 28 approach poses, 8 unjittered jamb poses, 28 exit poses. The 56 jittered poses consume 112 draws, x then y, with documented rounding/headings. All 64 complete events match exactly for both tapes.

Independently rebuilt the named visibility-test partition coordinates/openings and second-order-test floor/ceiling and 30 distant walls as JSON. V001/V002/V003 patch arrays and SO001-SO004 fixture arrays match. Read and checked V001's seven endpoint/aperture segments, V002 reflector-allowance queries, and SO001-SO004 source/listener/options against the tests, including pruning bounds. Fixture reproduction does not establish physical oracle accuracy.

Evidence: scratch/provenance.mjs and scratch/provenance-coverage.json.

## G. Coverage

All 13 M cases replayed; persistence branches were instrumented only in scratch/trace-src. Instrumented outputs stayed identical to expected:

| Cases | Reached behavior |
| --- | --- |
| M001 | Bare SceneSpec v1 to Classic project. |
| M002 / M003 | v2 document with spatial values / no-spatial fallback. |
| M004 | Legacy cacheVersion 2.0 snapshot-history branch; one past snapshot becomes compact patch. |
| M005 / M006 | Current-cache history and authoring envelope; omitted pan defaults to zero / omitted primitives to []. |
| M007 | Envelope lacks room material/ceiling fields; scene/default values supplied. |
| M008 | Transfer envelope, unavailable local-asset relinking, retained source transform. |
| M009 / M010 | Wrong-mode transfer error / unsupported v2-to-Classic migration. |
| M011 | Unsupported SceneSpec schema 0.9 serialization error. |
| M012 | Envelope parses, then spatial validation rejects bottom=5, top=-1, thickness=-1. |
| M013 | Document compatibility-hash mismatch rejected before frame calculation. |

Numerically checked DC01-DC06, DH02-DH05, DV01/DV02/DV06/DV09, CL01/CL02/CL05/CL06, HL02-HL04 and LC01-LC05:

- DC01 source/listener distance exactly 0 m; DC02 route/wall cross products zero; DC03 endpoint distance 0 m.
- DC04 crosses x=6 at plan y=3.5 m, exactly the narrowed door edge. DC05 hypot exactly 0.1 m. DC06 limit=0 and both tap arrays empty.
- DH02 zero plan separation and 1.5 m height difference, elevation 90 degrees. DH03 azimuths 180 and -179.99999997135208 degrees. DH04 source x=6.1 equals wall back-face x=6+0.2/2. DH05 source/listener/opening-top heights all 2.1 m.
- DV01 wall length 0; DV02 approximately 0.05 m. DV06 spans 60 m and fails coordinate schema. DV09 spans 55 m while individual x coordinates stay within schema bounds, reaching room_dimension_exceeded.
- CL01 area=2.25 m2 gives raw 4.3731778426 ms, clamped to 5. CL02 area=900 m2 gives raw 87.4635568513 ms, clamped to 80. CL05 distant north image path=94.0212741883 m, excess=268.2835982168 ms; only south/west taps remain. CL06 excluded two-wall path=52.9528091795 m, above 50 m.
- HL02 retained paths are below 50 m. HL03 has 12 valid candidates with large top K, retaining 6 in frame. HL04 compiles 116 patches: representative budget 24 yields 2 candidate paths, budget 32 yields 8, confirming the cap is exercised.
- LC01 exactly equal gain pairs use localeCompare ID order rather than code-unit order. LC02 exercises corresponding Hybrid ordering. LC03/LC05 have different non-BMP names but identical Classic fingerprints; LC04 is the Hybrid Unicode-name counterpart.

Both acceptance areas have substantial real coverage. Useful missing extensions: legacy future-history migration, malformed-cache recovery in the fixed corpus, disabled/multiple-listener migration variants, and a validation-kind positive case at exactly 0.1 m. The last gap is demonstrated in I1. Near-coincident Hybrid normalization at 1e-9 m was independently probed but is not frozen. The assignment does not require exhaustive partitioning of these domains; no acceptance-critical family is absent.

Evidence: scratch/provenance-coverage.json, scratch/extended-results.json, scratch/minimum-boundary-proof.json.

## H. Adversarial mutation and tampering

Product mutations happened only in separate scratch source copies. Each Vitest invocation aliases @ to its copy, runs the unchanged adapter on all 86 frozen inputs, and uses my comparator against expected. Unmutated control was first: zero violations, 86/86 bit-exact. Successful calculation/test execution is distinct from comparison success; below are actual comparison counts.

| Mutation | Violations | Bit-exact | First detecting case |
| --- | --- | --- | --- |
| control | 0 | 86/86 | NONE |
| classic-delay | 568 | 60/86 | C001_CONCRETE_DEFAULT |
| classic-loss | 25 | 79/86 | C002_CONCRETE_CLOSED_PORTAL |
| hybrid-propagation | 509 | 59/86 | H001_PARTITION_PORTAL_OPEN |
| hybrid-speed | 2077 | 54/86 | H001_PARTITION_PORTAL_OPEN |
| migration-pan | 2 | 85/86 | M005_CACHE_BEFORE_PANNING |
| migration-height | 60 | 84/86 | M001_SCENESPEC_V1_TO_CLASSIC |
| sort-gain | 4863 | 61/86 | C001_CONCRETE_DEFAULT |
| minimum-wall | 2 | 84/86 | DV01_ZERO_LENGTH_WALL |
| uncovered-room-sort | 0 | 86/86 | NONE |
| sort-tie | 220 | 71/86 | C001_CONCRETE_DEFAULT |
| minimum-condition | 0 | 86/86 | NONE |

Mutation meanings: Classic delay divisor 343 to 340; loss cap 24 to 12 dB; Hybrid propagation sign; Hybrid speed 343 to 340; migration pan fallback 0 to 1; source-height fallback 1.5 to 1.6 m; gain sort direction; wall-minimum constant 0.1 to 0.2 m; boundary-wall ID sort direction; tied-reflection ID sort direction; and wall-minimum predicate multiplier 1 to 2. Nine caught, two missed.

The minimum-wall CONSTANT mutation is caught only through exact error text in DV01/DV02. Changing only the predicate preserves that text and is missed. Direct original-versus-mutant validateScene calls prove DC05 changes from accepted to rejected while corpus outputs remain 86/86 bit-exact. The first mutation was therefore not proof that the positive validation boundary was pinned.

Tampering used scratch repository copies with installed dependencies linked. Ran the pnpm-test equivalent for all three tests/unit/corpus-* files, plus CLI probes, for each variant. Four git-dependent tests skip in these deliberately git-free copies; the original candidate suite had no skips. Control: 94 tests pass, 4 skipped, all CLI exit 0.

Exit codes (0 accepts, 1 rejects; 'not run' is not a pass):

| Scratch variant | verify | require-frozen | Corpus tests | compare | rerun |
| --- | --- | --- | --- | --- | --- |
| control | 0 | 0 | 0 | 0 | 0 |
| loosen-rehash | 0 | 0 | 1 | 0 | 0 |
| edit-expected | 0 | 0 | 1 | 1 | not run |
| delete-case | 0 | 0 | 1 | 1 | 0 |
| replace-evidence | 0 | 0 | 1 | 0 | 0 |
| draft-rules | 0 | 1 | 1 | 0 | 0 |
| unclassified-field | 1 | 1 | 1 | 1 | not run |
| rewrite-evidence-consistent | 0 | 0 | 0 | 0 | 0 |

- loosen-rehash: Hybrid gain atol changed to 100 dB; rules/manifest rehashed and evidence hash anchors updated consistently. Both verify modes and full rerun accept; five unit tests fail, including independently hand-written approved-class table and pinned rules hash. This confirms the README policy-pin claim.
- edit-expected: C006 volume changed by 1 m3, size/hash/manifest updated. CLI integrity accepts consistent bytes. Classic oracle, acceptance anchors and live replay reject (five unit failures); comparison rejects. Rerun not run for this already detected variant.
- delete-case: DV01 and both payloads removed, manifest updated. CLI integrity accepts 85 consistent cases; unit case-count/evidence anchors reject (four failures). Comparing original 86-case outputs reports an extra output; fresh 85-case rerun accepts. CLI alone does not know a case was deleted.
- replace-evidence: acceptance evidence replaced by only {ok:true}. CLI ignores historical evidence and fresh rerun passes; three unit anchor tests reject replacement.
- draft-rules: status changed to draft, manifest rules hash updated. Plain verify/rerun accept; require-frozen and nine unit tests reject.
- unclassified-field: unknown expected leaf added and expected/manifest rehashed. Both verify modes, comparison and unit replay reject (14 unit failures); rerun not run.
- rewrite-evidence-consistent: recorded acceptance-run environment node/platform and timestamps fabricated, preserving checked hashes/results. All 94 runnable unit tests and verify/frozen/compare/rerun accept. A fresh rerun supplies new evidence without authenticating committed historical metadata.

Not caught: unexercised branches/sorts, demonstrated positive validator boundary, consistently fabricated unasserted historical metadata, changes within approved continuous tolerances, and coordinated changes to corpus AND approval-test source by someone allowed to edit both. Files cannot preserve -0 or prove physical realism. README discloses uncovered sorts, floating-point tie risk, fixed-output semantics and negative-zero limits. Its verify description accurately limits checks to hashes/format/coverage, with frozen status requested explicitly; no cryptographic authenticity is promised. Positive minimum validation is an additional gap found here.

Evidence: scratch/mutations.json, scratch/mutations-extra.json, scratch/mutations-boundary.json, scratch/tampering.json and per-variant logs/configurations/source copies.


## I. Repository checks

Executed directly in candidate, without package-manager/network calls:

| Command | Actual result |
| --- | --- |
| node node_modules/vitest/vitest.mjs run | PASS: 85 files, 797 tests, no failures/skips; exit 0. |
| node node_modules/typescript/bin/tsc --noEmit --incremental false | PASS: exit 0, no diagnostics. Incremental output disabled to keep generated artifacts out of candidate. |
| node node_modules/eslint/bin/eslint.js . --max-warnings=0 | PASS: exit 0, no diagnostics. |
| node scripts/lint-knowledge.mjs | PASS: 37 pages, 4 entry points; exit 0. |
| node scripts/verify-source-baseline.mjs | PASS: 291 source files; immutable source-root/provenance/license checks; exit 0. |

No original-check failure required an environmental exception. Expected failures in scratch tampering/mutations are separate in H. Dependency installation was supplied, not rerun. Build, browser E2E, Docker, macOS, listening, actual audio output and profiling were not run and are not claimed passed; section I specifically required the five checks above. Numerical replay is not browser/offline-audio or real-output evidence. Logs: scratch/check-exits.json and corresponding scratch/*.log.

## J. Privacy

Scanned the complete branch patch git diff dd57934c31915c64c0c505face8cdb7534a24346 b0807aedbc31b34f7db97ab565483c82e14d6191, including generated payloads, added/removed text and context. Checked local path/email forms and current local username/host tokens; reviewed human-readable additions for personal names. No private local identity, absolute local path or email disclosure was found in branch changes. Repository/public documentation links contain intentional public source/account identifiers for provenance; they are not workstation-identity leaks. Commit metadata excluded.

Additional baseline diff findings: absolute local paths at knowledge/raw/sources/windows-2026-11-06/targeted-unit.log:2 and knowledge/raw/sources/windows-2026-11-06/unit.log:2. Both predate branch point, are unchanged by this branch, and are explicitly non-blocking under the privacy-scope decision. Published-source author attribution also appears only in pre-existing main material: knowledge/raw/references/memory.md:7, knowledge/wiki/decisions/0004-memory-governance.md:6, knowledge/wiki/index.md:34. Personal values are omitted here. Public attribution must not be silently removed.

Five preliminary broad-regex branch hits were URL-syntax false positives, resolved by checking drive-letter boundaries and inspecting the lines. Refined branch scan: zero findings. Both deliverables were checked again for absolute local paths, email forms and local identity tokens before completion. Evidence: scratch/privacy-refined.json and scratch/rules-claims-privacy.json.

## K. Claims audit

Read corpus README, source record, handoff, session, task EC-101 and corpus entries in CLAUDE.md. Confirmed hashes, 86 cases, kind counts (27/20/4/5/13/9/4/2/2), migration=13, degenerate=25, limit=9, locale=5, scenario counts, seeds, tape lengths, 25-class statuses, unchanged source, command behavior and reproduced aggregate/bit-exact claims. Tracked v1 files total 7,357,825 bytes, consistent with approximate size wording. Candidate has 797 passing tests; the documents explicitly date 794 tests to cb2ef6d, before three more tests were added, so that is not a contradictory current-count claim.

Reproduced full sensitivity execution in a separate scratch repository copy. Algorithm, seed, deltas, coordinate counts, corpus/rules hashes, hashChanges, perClass numerical data and unitsWithFlips exactly match committed sensitivity.json. Only gitHead differs, as expected for a git-free copy. No checkout evidence was overwritten. Evidence: scratch/sensitivity-comparison.json.

Thirteen numbered source-record findings independently reproduced:

| Finding | Fresh observation |
| --- | --- |
| 1 | Closest stress_81 endpoint is 0.0249615088 m from route, inside 0.04 m half-thickness; C011 direct, H008 blocked. |
| 2 | DC04 grazes plan door edge and uses portal; DH05 grazes opening top at 2.1 m and is direct. |
| 3 | H008 wall hit thickness 0.1 m versus authored 0.08 m. Compile omits wall patch thickness; audible wall transmission reads authored wall thickness. |
| 4 | Classic final tie sort is in compute-frame. Reversed tie comparator causes 220 violations in 15 cases; reproduced sensitivity includes named order flips. |
| 5 | Vertical direction gives azimuth 0; 1e-12 m horizontal perturbation yields 135 degrees. |
| 6 | DC01 finite zero-distance direct output; DH01 distinct-position error; 1e-9 m direct separation gives different normalize3 error. |
| 7 | DK03 scalar triple product 0.5 proves non-planarity; DK04 has 3 unique vertices among 4; both return ok. |
| 8 | DV04 emits duplicate_id errors and portal_detached. |
| 9 | DK05 endpoint/coplanar queries have no hits; crossing queries 3 and 7 (zero-based) each have one. |
| 10 | Independent raw traversal: 144 negative-zero leaves in 25 cases, exactly matching run.json. |
| 12 | TH02 box y=0.5 m, height=1 m puts base exactly on floor; tiny vertical perturbation can invalidate it, consistent with reproduced sensitivity. |
| 13 | LC03/LC05 distinct non-BMP names collide; hash source uses one charCodeAt(0) per code point. |
| 15 | Inspected frame literals maxCandidates=6, representative patches=24, 50 m path cap; probes confirm HL03/HL04 budget effects. Classic frame recomputes delay with literal 343. |

One documentation chronology error: handoff line 9 says only knowledge/CLAUDE changed after cb2ef6d; final candidate also changes corpus README and integrity tests (M1). No false hash, final corpus-count or reproduced numerical-result claim found.

UNVERIFIED historical/external claims: cited GitHub Actions run and Linux/Windows job logs (network forbidden); prior-machine incidents and reviewer mutation totals; older 72-case noise statistics; universal unreachable-guard conclusion and previous 400,000-scene search. Source explicitly labels older noise figures historical and discloses guard limitations. These claims were not promoted to independently measured facts. They are not required acceptance criteria; this verdict rests on fresh local evidence.

## Findings by severity

### Critical

None.

### Important

**I1. The exact-minimum wall case does not call validateScene. Doubling only the validator predicate threshold to 0.2 m leaves all 86 outputs bit-exact, although DC05 now fails validation.**

Where: benchmarks/corpus/harness/ts-serial-adapter.ts:runClassicFrame; v1/inputs/DC05_WALL_EXACTLY_MIN_LENGTH.json.

Evidence: scratch/mutations-boundary.json: 0 violations, 86 bit-exact. scratch/minimum-boundary-proof.json: originalOk=true, modifiedOk=false.

Acceptance: **does not block**. Additional future-regression coverage gap. Existing measured degenerate-geometry coverage satisfies the stated criterion, which does not require exhaustive validator mutation coverage. No product change exists in this candidate.

**I2. Consistently fabricated historical environment/timestamp metadata passes all checks. CLI-only checks also accept consistently rehashed tolerances and draft rules unless require-frozen is requested.**

Where: scripts/corpus/lib.mjs:verifyCorpus; scripts/corpus/cli.mjs:rerun; tests/unit/corpus-integrity.test.ts:freeze anchors.

Evidence: scratch/tampering.json: fabricated metadata passes 94 runnable corpus tests and CLI verify/frozen/compare/rerun. Rehashed 100 dB tolerance passes CLI but fails independently pinned unit tests; draft status fails frozen verification and unit tests.

Acceptance: **does not block**. Checks establish consistency rather than cryptographic authenticity. Required full checks enforce tolerance policy; this audit independently reproduced baseline results. README describes the narrower CLI behavior accurately.

**I3. Reversing boundary-wall ID sorting produces no corpus change.**

Where: src/acoustics/room-acoustics.ts:62; benchmarks/corpus/README.md:Known limits.

Evidence: scratch/mutations.json, uncovered-room-sort: 0 violations, 86 bit-exact.

Acceptance: **does not block**. Already disclosed among eight singly undetected locale-sort sites. Final tied-reflection ordering is independently caught by the sort-tie mutation.

**I4. Baseline edge behavior includes singular vertical azimuth, mode-dependent coincident-source handling, default thickness in wall hits, and acceptance of non-planar/duplicate-vertex patches.**

Where: src/acoustics/hybrid3d/direct.ts; geometry.ts; compile.ts; baseline product behavior.

Evidence: Fresh runs and direct probes reproduce source findings 1-10, 12, 13 and 15; see section K.

Acceptance: **does not block**. Pre-existing behavior is reported and frozen. The assignment forbids tuning product formulas or fixtures to conceal it.

### Minor

**M1. The statement that only knowledge pages and the CLAUDE command table changed after cb2ef6d is incomplete at the candidate SHA.**

Where: knowledge/handoffs/2026-11-06-ec-101-claude.md:9.

Evidence: git diff cb2ef6d b0807ae also includes benchmarks/corpus/README.md and tests/unit/corpus-integrity.test.ts; three tests were added.

Acceptance: **does not block**. Documentation chronology only; corpus bytes and product source remain unchanged.

**M2. Two pre-existing test logs contain absolute local paths.**

Where: knowledge/raw/sources/windows-2026-11-06/targeted-unit.log:2; knowledge/raw/sources/windows-2026-11-06/unit.log:2.

Evidence: Independent baseline diff scan found both lines; neither is changed by diff dd57934 b0807ae. Personal values omitted.

Acceptance: **does not block**. Pre-existing main material is explicitly outside the maintainer-defined privacy scope.

Machine-readable criterion decisions, seven run aggregates and section results are in verification.json. Tracked source checkouts remain unchanged; intentional audit mutations remain under scratch/.
