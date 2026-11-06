# EC-101 independent adversarial verification

**VERDICT: NOT_VERIFIED.** The numerical acceptance criteria pass. Two committed historical logs in the candidate delta contain absolute local checkout paths (F01), violating the public-evidence constraint and blocking acceptance. No product fix or task-status change was made.

Verifier: GPT-Sol gpt-6.1-sol via Codex. Date: 2026-11-06. Environment: Node v22.23.3, win32, x64. Sandbox mode: danger-full-access, approvals never. The brief's boundaries were enforced procedurally; no OS sandbox protected the checkouts. Only local shell tools were used. TEMP, TMP and TMPDIR pointed to the absolute scratch/tmp directory before every Node invocation. No network, browser, MCP connector, commit, push, PR or deployment action was used.

Candidate: cd0d6ab2738d2712e495ee24ce723a60bccd2895. Baseline: 98a4374fa839aa5dee7c6c35e575b8003f7f1a31. My scripts/copies/detailed evidence are under scratch/. The two report outputs contain no absolute local path or personal value. Scratch tool logs may contain tool-rendered paths and are local working evidence.

## A. Identity and scope

Ran git rev-parse HEAD/status in both checkouts, git diff 98a4374 cd0d6ab -- src pnpm-lock.yaml, changed-path listing and tree comparisons for all 25 commits in the range. The requested product diff is empty. Every intermediate commit matches baseline for src, pnpm-lock.yaml, pnpm-workspace.yaml, patches, next.config.ts, tsconfig.json, vitest.config.ts, .nvmrc and benchmarks/results/mvp-baseline.json. Package JSON excluding scripts also matches at every intermediate commit. No transient product change later reverted was found in these inspected paths.

There are 251 changed files. Every path outside the brief's allowed prefixes:

| Path | Effect assessment |
| --- | --- |
| .dockerignore | Admits corpus/harness/config into Docker context; packaging inputs change, runtime source does not. Docker not executed. |
| .gitignore | Developer tooling/output exclusions. |
| AGENTS.md | Agent policy, no application runtime behavior. |
| CLAUDE.md | Agent documentation/commands. |
| docs/README.md | Documentation links. |
| docs/adr/README.md | Documentation index. |
| eslint.config.mjs | Lint-scope exclusion for local agent tooling. |
| package.json | Four added corpus scripts; all nonscript fields and dependencies unchanged. |
| scripts/lint-knowledge.mjs | Developer documentation checker, no production/acoustic integration. |

Final status: candidate clean; baseline has no tracked changes and only the permitted untracked overlay roots benchmarks/corpus/, scripts/corpus/, tests/corpus/, vitest.corpus.config.ts. Tool-generated incremental TypeScript data and Vitest caches were relocated under scratch/. Evidence: scratch/identity-privacy.json and scratch/final-status.json.

## B. Independent hash and format check

Wrote scratch/independent.mjs using Node built-ins, importing nothing from scripts/corpus or benchmarks/corpus/harness. All 172 input/expected files match independently computed SHA-256 and byte counts, have LF/no BOM, and no input/expected file is missing or unlisted (recursive enumeration). Rules hash matches too.

Read only the aggregate format from lib.mjs: sorted case ID, space, independently computed expected-file hash, LF; SHA-256 the concatenated string. Independent aggregate:

76d6ad8b3a2b5d1fe0dbec6b0372676903821332c56fb4ecbe53ec897c1598e6

| Artifact under candidate/benchmarks/corpus/v1 | Independently computed SHA-256 |
| --- | --- |
| manifest.json | 4b4bf901d2fadd8bf8266482739a30bd3b19de6dd1cd047fd80f59c0ee3e1fb6 |
| comparison-rules.json | ecd33cd6bb4010474a471dc2e937f302d14ec6d8aaffcd2b819ab8bb6cc6fa74 |
| evidence/acceptance-rerun.json | 6452a2261a97bcd8a4ddf91284390ae2e29a6a354d1d8499a937086b4efec265 |
| evidence/sensitivity.json | 5f4854bca7a800ba065835cbe4d4f2c8a31323e71e6f728b56bd901016d73d3b |

No mismatch. Evidence: scratch/independent.json.

## C. Baseline and candidate reruns

Overlaid only the four permitted roots using git archive/tar; baseline tracked diff remained empty. From baseline/, ran two distinct top-level invocations:

- node scripts/corpus/cli.mjs rerun --out ../scratch/baseline-one --evidence ../scratch/baseline-one.json
- node scripts/corpus/cli.mjs rerun --out ../scratch/baseline-two --evidence ../scratch/baseline-two.json

Each spawned A/B in manifest order and C reversed. Separately in candidate/: node scripts/corpus/cli.mjs run --run-id candidate --out ../scratch/candidate-run. All exited 0. Every run has B's aggregate.

| Run | gitHead prefix | Bit-exact against expected | Violations | Product match / diffs |
| --- | --- | --- | --- | --- |
| baseline-one/A | 98a4374 | 86/86 | 0 | true / [] |
| baseline-one/B | 98a4374 | 86/86 | 0 | true / [] |
| baseline-one/C | 98a4374 | 86/86 | 0 | true / [] |
| baseline-two/A | 98a4374 | 86/86 | 0 | true / [] |
| baseline-two/B | 98a4374 | 86/86 | 0 | true / [] |
| baseline-two/C | 98a4374 | 86/86 | 0 | true / [] |
| candidate-run/candidate | cd0d6ab | 86/86 | 0 | true / [] |

For each baseline invocation, all four comparisons (A-B, A-expected, B-expected, C-expected) report 86 cases, 86/86 bit-exact, zero violations/missing/extra. A/B/C aggregates are identical. Direct candidate comparisons with baseline-one/A and baseline-two/A likewise report 86/86 and zero violations. My comparator agrees for every run.

All six baseline full gitHead values equal baseline SHA; candidate gitHead equals candidate SHA. productTreesMatchBaseline=true and productTreeDiffs=[] throughout. Independent product trees and package-without-scripts hash match the manifest. These fields attest only to committed HEAD; clean tracked diffs separately establish unmodified source. Evidence: both rerun JSON files, scratch/candidate-run/candidate/run.json and scratch/candidate-baseline-*.json.

## D. Independent comparison and units

The independent comparator implements pointer matching, single-segment *, terminal ** matching one or more segments, exact values, six-decimal toFixed rounding, max(atol, rtol times scale), shortest circular distance, and structural/ordered-array/empty-container checks. It imports no repository comparator. A separate differential driver imports both implementations solely to compare judgments.

There are **135147 leaves** (primitives and empty containers). Zero match no rule; zero match multiple rules. Counts:

| Class | Leaves |
| --- | ---: |
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

The repository comparator reports the same total. All seven runs have zero violations in both comparators. Forty-nine numeric probes exercise all 25 classes: exact changes, decimal changes, inside/outside tolerances, circular full turns and angle changes. Zero pass/fail disagreements. Evidence: scratch/differential.json.

All 23 calculated continuous classes have units. No noninteger number is classified discrete. The exact passthrough wildcard has no single unit: 1442 numbers, 699 strings, 163 booleans, 70 null/empty-container leaves. It includes copied physical values, inserted defaults and generated integer history indices. Thus the literal answer to whether it holds only copied numbers is **no** (F04). The checked cases contain no calculated acoustic float hidden there.

Traced three pass-through quantities in persistence.ts/projections.ts: M002 listener height 1.7 m becomes first-listener Y and projected listenerHeightM; its source height 1.2 m is spread into sourceHeightsM and copied into the Hybrid extension; M008 source plan position (7.25, 4.5) survives import/projection unchanged. M004 history-path index 0 is generated by collectOperations in history.ts; before/after position values are cloned. M005 panX=0 is inserted by migrateView rather than copied from input.

Unit checks against source covered these eight samples:

| Field | Source relation / unit |
| --- | --- |
| Classic room.volumeM3 | room-acoustics.ts: polygon m2 times height m gives m3. |
| Classic room.totalSurfaceM2 | Sum of planar surface areas, m2. |
| Classic room.rt60S | Eyring decay calculation with explicit MIN_RT60_S/MAX_RT60_S, s. |
| Classic room.preDelayMs | sqrt(area)/343 m/s times 1000, 5–80 ms clamp. |
| Classic earlyReflections.delayMs | compute-frame.ts: excess path length/343 times 1000, ms. |
| Hybrid paths.distanceM / delayMs | direct.ts: Euclidean metres; distance/SOUND_SPEED_MPS times 1000 gives ms. |
| Hybrid azimuthDeg / elevationDeg | atan2/asin times 180/pi, degrees. |
| Hybrid arrivalDirection / reflectionPoint | normalize3 gives dimensionless unit 1; point coordinates remain metres. |

The dB/Hz classes also correspond to logarithmic gain/cutoff code. No sampled unit mismatch.

## E. Rules against the maintainer decision

Every class matches the supplied dated decision. Six Classic oracle classes use decimal=6. The five other Classic classes use atol=1e-6/rtol=0. Hybrid classes use atol=1e-5/rtol=0, except azimuth uses circular period=360/atol=1e-5. Discrete and migrated pass-through values are exact.

Status is frozen, frozenOn=2026-11-06; no class is proposed. Counts: 2 discrete, 9 existing-test, 14 approved. Independently read Git's first-freeze rules at d82092b: byte-identical to final rules.

Read all cited existing-test assertions:

- Six Classic classes: projectFrame in src/benchmarks/classic-baseline.ts applies Number(value.toFixed(6)) to the matching fields. tests/unit/classic-baseline-capture.test.ts:13 uses toEqual against the artifact.
- hybrid-length-m: direct-test lines 141/154 assert distanceM; reflection-test 26/41/53 and second-order-test 55 assert pathLengthM. Helpers compare absolute error <=1e-5.
- hybrid-delay-ms: direct-test 142; reflection-test 27/42/54 for delayMs and 28 for excessDelayMs; second-order-test 56–60 for delayMs, all at 1e-5.
- hybrid-elevation-deg: direct-test 143/155 use that same helper. Azimuth's cited tests establish 1e-5 but do not establish circular wrapping; wrapping is the maintainer's new approval.

No incorrect existing-test precision citation found. Evidence: scratch/decision.json.

## F. Provenance

All 86 entries record source type/references, license, hashes/sizes and a seed object or explicit null. No provenance field is missing. Kind counts match: 27 Classic frames, 20 Hybrid frames, 4 visibility, 5 second-order, 13 migration, 9 validation, 4 patch, 2 Classic tapes, 2 Hybrid tapes. Tag/scenario counts also match the source record.

Independently projected C001–C010 from frozen outputs to the original oracle fields, rounded numbers to six decimals and compared values/order against benchmarks/results/mvp-baseline.json. **All ten match**, covering 322 oracle leaves including empty arrays.

Independently implemented the visibility-test recurrence: state=(imul(state,1664525)+1013904223) unsigned 32-bit; draw=state/2^32; seed=20261013. All 2048 regenerated V003 queries match, including every-seventh coincident segment and every-fifth nonseventh parallel construction.

Independently regenerated TC01's complete 64-step tape from seed 20261106: 28 jittered approach poses, 8 unjittered jamb poses, 28 jittered exit poses, 112 random draws. All positions/headings match. TH01 has the same walk. This checks seed consumption as well as metadata.

Compared V001's patch/seven query endpoints, V002's twelve partitions, V003's 32 partitions, and SO001–SO004's floor/ceiling/distant-wall vertices, poses and options to the named tests. All 16 explicit fixture checks pass; V003 queries were checked separately above. V002's allowance construction and later-wall behavior agree with the test.

Also reran sensitivity in a scratch repository copy. Its complete data matches the stored evidence after excluding gitHead (different reproduction checkout identity). Clean nonazimuth maxima reproduce as 2.5352164811920375e-10 and 2.532326561777154e-7, with matching flips. Evidence: scratch/provenance.json, scratch/coverage.json, scratch/sensitivity-reproduction.log.

## G. Migration and geometry coverage

Added observation-only persistence branch markers to a scratch source copy. Named branches are reached:

| Case | Observed branch/result |
| --- | --- |
| M001 | Bare v1 scene accepted into Classic. |
| M002 | v2 spatial branch; listener 1.7 m/source 1.2 m preserved. |
| M003 | v2 without spatial extension; default source height 1.5 m. |
| M004 | Legacy 2.0 snapshot history; one past snapshot becomes one patch with three value operations. |
| M005 | Current-cache envelope/migrateView; absent pan fields become 0. |
| M006 | Current-cache envelope; absent primitives becomes []. |
| M007 | Envelope; absent room-material fields receive defaults. |
| M008 | Transfer/envelope import; metadata retained, local_missing marked for relinking. |
| M009 | Wrong-mode Hybrid transfer rejected with error. |
| M010 | v2 branch refuses Classic mode; result unsupported with outer outcome ok. |
| M011 | parseScene rejects schema 0.9 before persistence. |
| M012 | Envelope reaches spatial validation; invalid wall bounds/thickness rejected. |
| M013 | parseSceneDocument rejects compatibility hash before persistence. |

Rejection routes were traced through serializers/transfer/spatial validation. M011/M013 correctly have no persistence marker. Evidence: scratch/investigation.json.

Twenty-three independent geometry/limit/locale checks plus two tape checks passed. Numerically checked more than ten cases:

- DC01 separation 0; DC02 1 m collinear wall on a 6 m route; DC03 wall endpoint at listener; DC04 partition crossing y=3.5 m equals door edge; DC05 length exactly 0.1 m; DC06 zero retained reflections.
- DH02 zero plan separation and 1.5 m vertical separation gives elevation 90 degrees. DH03 azimuths are 180 and -179.99999997135208 degrees. DH05 heights equal the 2.1 m opening top.
- DV01 length 0; DV02 about 0.05 m; DV03 raw 1e999 parses to Infinity; DV08 3 m portal on 2 m wall; DV09 55 m width while every vertex remains within schema coordinate bounds.
- DK03 fourth vertex 0.5 m off plane; DK04 four vertices/three unique; DK05 vertex-ending segment misses while through-vertex segment hits.
- CL01 area 2.25 m2 gives 4.3731778426 ms before the 5 ms floor. CL02 area 900 m2 gives 87.4635568513 ms before the 80 ms ceiling. CL05 retains two near taps below 80 ms. CL06 long pair is 52.9528091795 m with excess delay 45.4510956121 ms, reaching the 50 m length rejection.
- LC01 two 8 m paths have exactly equal gain and pinned locale order. LC03/LC05 distinct names have equal fingerprints.

Runtime inspection: HL02 keeps four 47.13–48.63 m paths and rejects paths above 50 m; HL03 finds twelve valid paths/keeps six; HL04 has 26 representative candidates/considers 24, yielding 552 ordered pairs versus 650 uncapped. LC02 is sensitive to Hybrid top-K/ordering mutations. The constructions satisfy their names.

Coverage remains finite. Missing corpus cases include corrupt/unavailable-cache recovery, nonempty future history, multiple/disabled listeners in migration, successful primitive-bearing migration, and tiny nonzero separation around normalize3's 1e-8 m boundary. Exact zero is covered. These are nonblocking extensions to the broad migration/degeneracy criteria. S8–S10, full-length timing tapes, Worker/audio paths and ports are outside the corpus scope.

## H. Adversarial mutation and tampering

Copied src under scratch and aliased @ to each copy for separate Vitest invocations. All 86 frozen inputs ran through the unchanged serial harness. Probe exit 0 means execution succeeded; caught/survived is determined by recorded comparison failures. Unmodified control ran first.

| Mutation | Source relative to src | Result | Failing cases | Examples |
| --- | --- | --- | ---: | --- |
| control | unmodified source | control passed | 0 | none |
| classic-delay | acoustics/compute-frame.ts | caught | 26 | C001_CONCRETE_DEFAULT, C003_CONCRETE_PORTAL_ROUTE |
| classic-eyring | acoustics/room-acoustics.ts | caught | 29 | C001_CONCRETE_DEFAULT, C002_CONCRETE_CLOSED_PORTAL |
| classic-tie-sort | acoustics/compute-frame.ts | caught | 15 | C001_CONCRETE_DEFAULT, C006_HARD_ROOM |
| hybrid-speed | acoustics/hybrid3d/geometry.ts | caught | 32 | H001_PARTITION_PORTAL_OPEN, H002_PARTITION_PORTAL_CLOSED |
| hybrid-endpoints | acoustics/hybrid3d/geometry.ts | caught | 10 | H004_DEFAULT_PROJECT, V001_PORTAL_APERTURE |
| migration-source-height | domain/workspace/persistence.ts | caught | 2 | M001_SCENESPEC_V1_TO_CLASSIC, M003_DOC_V2_NO_SPATIAL_TO_HYBRID |
| migration-pan | domain/workspace/persistence.ts | caught | 1 | M005_CACHE_BEFORE_PANNING |
| domain-wall-minimum | domain/scene/geometry-validation.ts | caught | 2 | DV01_ZERO_LENGTH_WALL, DV02_WALL_BELOW_MIN |
| classic-early-cap | acoustics/image-source.ts | caught | 1 | CL05_EARLY_DELAY_CAP |
| hybrid-top-k | acoustics/hybrid3d/direct.ts | caught | 3 | H003_SECOND_ORDER_BLOCKED, HL03_SECOND_ORDER_TOP_K |
| uncovered-room-sort | acoustics/room-acoustics.ts | survived | 0 | none |

Changes were: Classic excess-delay divisor 343 to 340; Eyring constant 0.161 to 0.162; Classic final tie-sort sign; Hybrid speed 343 to 344; Hybrid endpoint exclusion to inclusive endpoints; migration source-height default 1.5 to 1.6; missing panX default 0 to 0.25; wall minimum 0.1 to 0.01; Classic early-delay cap 80 to 800; Hybrid frame maxCandidates 6 to 5; room boundary-material tie-sort reversal. Ten regressions were caught. The room sort survives, matching a documented blind spot. Evidence: scratch/mutations.json and per-mutation outputs.

In scratch repository copies, ran all three tests/unit/corpus-* files directly with Vitest (95 tests), both CLI verification modes and a separate CLI rerun per tamper trial. Unmodified copied-repository control passes all 95 tests.

| Tampering | verify | require-frozen | CLI rerun | 95 corpus tests |
| --- | --- | --- | --- | --- |
| control | passes | passes | passes | passes |
| loosen-tolerance | passes | passes | passes | fails |
| edit-expected | passes | passes | fails | fails |
| delete-case | passes | passes | passes | fails |
| replace-evidence | passes | passes | passes | passes |
| rules-draft | passes | fails | passes | fails |
| unclassified-field | fails | fails | fails | fails |
| coordinated-evidence-rewrite | passes | passes | passes | passes |

What caught each attack:

- Relaxed hybrid-gain-db atol to 1000000 and updated rules/manifest hashes: CLI verify/rerun pass; two unit evidence anchors fail while evidence references remain stale. Repeated with original rule formatting preserved to exclude incidental regex-fixture failures.
- Increased C001 room volume by 1 and updated expected hash/size: verification passes; CLI rerun and unit replay/oracle/evidence checks fail.
- Deleted LC05 and its input/expected/manifest entry: verification/rerun pass for 85 cases; unit count, definition and evidence checks fail.
- Set saved acceptance gitHead to an all-zero SHA, evidence ok=false and every comparison ok=false/violationCount=123: both verification modes, rerun and all 95 tests pass (F02).
- Flipped rules to draft, cleared frozenOn, made one class proposed and rehashed: plain verify/rerun pass; require-frozen and tests fail. rerun's own verification omits requireFrozen.
- Added an unclassified root output field and rehashed: both verification modes, rerun and tests fail.
- Coordinated relaxed tolerance with rewritten corpus/rules hash references in both evidence files: preserving rule formatting, both verification modes, rerun and **all 95 tests pass** (F03).

Not caught: changes outside exercised inputs/branches; the surviving room sort; forged saved acceptance semantics unused by anchors; coordinated changes to mutable policy and its references. Hashes establish consistency, not approval. Fresh output evidence here establishes the actual candidate's results. The README acknowledges numerical/locale/order and coverage limits; freeze/immutability still depends on review discipline beyond gate enforcement.

Evidence: scratch/tampering.json, scratch/tamper-rules.json and scratch/tamper-cli.json. Some initial tamper attempts reformatted rules and triggered three incidental regex-based freeze-test failures; the preserved-format repetitions above isolate the semantic findings.

## I. Repository checks

Executed directly in candidate/, logs under scratch/:

| Command | Actual result |
| --- | --- |
| node node_modules/vitest/vitest.mjs run | PASS, 85 files/794 tests. |
| node node_modules/typescript/bin/tsc --noEmit | PASS, exit 0. Incremental build information moved under scratch/. |
| node node_modules/eslint/bin/eslint.js . --max-warnings=0 | PASS, exit 0. |
| node scripts/lint-knowledge.mjs | PASS, 37 pages/4 entry points. |
| node scripts/verify-source-baseline.mjs | PASS, 291 source files; root/provenance/license checks. |
| node scripts/corpus/cli.mjs verify --require-frozen | PASS, 86 cases. |

No unmodified candidate check failed. A scratch setup initially hit tar's interpretation of a drive-qualified archive name; a relative archive argument resolved it and all required runs subsequently executed. That was an audit setup error, not a product failure. Intentional tamper/mutation failures are separate from candidate results.

Build, E2E, Docker, other OSes, real audio output and listening checks were not run: outside this brief, and no pass is claimed.

## J. Privacy

Independently scanned all **251 changed files**, including generated data/historical logs, excluding commit metadata. Checked drive-qualified paths, context-bounded Unix home/temp/workspace roots, email patterns and actual runtime user/host tokens. Reviewed real-name candidates separately. Relative module imports containing /workspace/ were excluded as false positives.

**FAIL:** candidate/knowledge/raw/sources/windows-2026-11-06/targeted-unit.log:2 and candidate/knowledge/raw/sources/windows-2026-11-06/unit.log:2 contain absolute local checkout paths. Values are deliberately omitted. These files were introduced by earlier shared-memory work (2a68438), before corpus-specific commits, but remain in the audited baseline-to-candidate delta. This violates the candidate's explicit public-evidence constraint; it is not a new acoustic defect.

No actual runtime username/hostname token or email was found. knowledge/raw/references/memory.md:7 contains a public reference author's real name as attribution, not leaked local identity; the value is not repeated here. Finite pattern/token scanning cannot prove absence of every possible personal string.

The corpus privacy unit test deliberately excludes these historical logs, so its pass does not refute this finding. Both public report outputs were separately scanned for path/email/runtime-identity strings.

## K. Claims audit

Read the required README, source record, handoff, session, task, CLAUDE corpus entries, knowledge schema and benchmark-plan sections 3/6. Corroborated published hashes, aggregate, case/kind/tag/scenario counts, seeds, baseline identity, unchanged product, rule counts/statuses, 86/86 reruns, 794 unit tests, Classic oracle and sensitivity data. First/final frozen rules are byte-identical. EC-101 correctly remains Implemented and does not claim independent verification had already occurred.

Forced all nine documented collation locales (en, zh-TW, de, sv, cs, et, lt, da, tr) in scratch: each produced **86/86 byte-identical outputs** (scratch/locales.json).

Reproduced more than five numbered source-record findings using freshly rerun outputs, source traces and scratch probes:

| Source finding | Independent result |
| --- | --- |
| 1 | C011 direct/H008 blocked; checked stress_81 endpoint lies 0.0249615088 m from ray line, within 0.04 m half-thickness. |
| 2 | DC04 portal at exact plan door edge; DH05 direct at opening top. |
| 3 | H002 wall hits report thicknessM=0.1 despite authored thickness. compile.ts omits makePatch3 thickness; audible-direct.ts uses authored wall thickness for walls. |
| 5 | DH02 vertical; a 1e-12 m planar perturbation changes azimuth to 135 degrees. |
| 6 | Coincident DC01 succeeds with finite direct path; DH01 throws distinct-position error; separate normalize3 threshold visible in source. |
| 7 | DK03 nonplanar/DK04 duplicate-vertex patches accepted. |
| 8 | DV04 has two duplicate_id issues plus portal_detached. |
| 9 | DK05 vertex endpoint ignored, through-vertex crossing hits. |
| 10 | Fresh baseline run records 144 negative-zero paths before JSON writing; serialized files have zero. |
| 13 | LC03/LC05 distinct non-BMP names have equal fingerprints and equal independently called classicProjectionHash. |
| 15 | Source confirms frame candidates=6/patch budget=24, Hybrid literal 50 m, reference-only 32 guard, Classic final delay recomputation with literal 343. |

Sensitivity reproduction supports tied-order/rounding/TH02-boundary observations (4/11/12) for the final corpus. The older 72-case rounding statistic is explicitly historical in the source record and was not treated as a current measurement.

**UNVERIFIED:** historical GitHub Actions status and Linux/Windows comparison (network forbidden); historical 400000-scene search/universal unreachable-guard proof (no original executable search artifact obtained, not independently rerun); historical disk/agent incidents and contemporaneous commands. Current Windows measurements do not independently establish those historical events. No remote check is reported PASS.

The material enforcement gaps are F02/F03; passthrough prose is imprecise (F04). No other locally falsified hash, case count, precision citation or current rerun claim was found. No product behavior was tuned to a fixture.

## Findings by severity

### Critical

None found.

### Important

**F01 — Committed absolute local paths. Blocks acceptance: yes.** Where: the two historical logs identified in J, line 2. What is wrong: local checkout paths remain in public committed evidence. How known: independent scan and Git history. This predates corpus-specific changes, but the reviewed candidate still violates the explicit public-evidence constraint. Values are omitted.

**F02 — Saved acceptance claims lack semantic validation. Blocks acceptance: no.** Where: corpus-integrity freeze anchors and acceptance evidence. What is wrong: recorded failure/fabricated baseline identity can pass verification. How known: replace-evidence passes all 95 corpus tests, both verify modes and fresh rerun. Current candidate outputs were independently reproduced, so this does not invalidate those actual measurements.

**F03 — Frozen policy can be rewritten with its hash references. Blocks acceptance: no.** Where: rules/manifest/evidence anchoring. What is wrong: gates do not independently enforce approved tolerance values. How known: preserved-format coordinated rewrite with million-dB tolerance passes all 95 tests/CLI gates; stale references fail two anchors. Review/new-version policy remains necessary.

### Minor

**F04 — Passthrough description is too narrow. Blocks acceptance: no.** Where: rules/README. What is wrong: described as copied numbers, but includes nonnumbers, inserted defaults and generated indices. How known: independent type/leaf counts and migration/history traces in D. Current exact comparisons remain appropriate; no calculated acoustic float escaped classification in the checked corpus.

Core reproducibility/numerical criteria pass on this Windows environment. Acceptance of this exact public candidate remains blocked by F01.
