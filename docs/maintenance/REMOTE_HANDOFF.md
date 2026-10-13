# Remote handoff

Date: 2026-10-13. After the initial local extraction and verification, the user
supplied the existing destination repository. This report records that subsequent
branch publication; it does not replace or relabel the local test results.

| Check or action | Actual result |
| --- | --- |
| Destination | [kekekewww/Echo-Canva-Web](https://github.com/kekekewww/Echo-Canva-Web), public and accessible |
| Local origin | `https://github.com/kekekewww/Echo-Canva-Web.git`, verified before push |
| Existing remote main | `923b79dd73b572100c6505694a50fa267dd3df72`, initial commit containing only LICENSE; unchanged after push |
| Published branch | [chore/open-source-extraction](https://github.com/kekekewww/Echo-Canva-Web/tree/chore/open-source-extraction) |
| First published head | `3f2dac497638b99e5bdd162d9c18166d6abb9a7e`; the handoff documentation is a subsequent commit on the same branch |
| Push | PASS: normal `git push --set-upstream origin chore/open-source-extraction`; new branch created, no force push |
| Remote verification | PASS: `git ls-remote --heads origin` confirmed the published commit and unchanged main; local tracking branch established |
| Source verification immediately before publication | PASS: all 291 immutable root files and tree `ca4a2543f6f0e8848fe8d8eb57f3ed70faaba294` |
| PR comparison with main | UNAVAILABLE: GitHub compare API returned `No common ancestor between main and chore/open-source-extraction` (HTTP 404) |
| GitHub-hosted CI | NOT EXECUTED: Actions API lists zero workflows and no branch runs; the work-branch push does not match the workflow's `main` push trigger |
| Original Echo-Canva repository | No writes, push, history/tag/release changes or deployment |

## Initial publication stage

At initial publication, the existing remote initializer and extraction had no
common ancestor. Combining them with an unrelated-history merge would also add
a second root, which the original source verifier rejected. No
rebase, history replacement, unrelated-history merge, default-branch change or PR
merge was performed at that stage.

The default branch then had no workflow, so a manual dispatch was not an
available substitute for adoption. Do not treat
publication as CI acceptance: the final local/native and production-container
Chromium suites remain **44/45 with one failed performance gate**, and the
development-only `braces` advisory and `client-only` notice gap remain unresolved.
See [final verification](FINAL_VERIFICATION.md), [CI verification](CI_VERIFICATION.md)
and [remaining debt](REMAINING_TECHNICAL_DEBT.md).

No public image, release, issue, label or deployment was published during this
handoff. No credentials were supplied to AI providers or hosted CI.

## Subsequent authorized PR integration

The user subsequently requested creation, push and automatic merge of a PR.
The initializer and extraction LICENSE have the same Git blob, so bridge commit
`b9f3254` preserves both histories without changing a tracked file. The source
verifier now explicitly checks exactly these two reviewed roots and still checks
the original 291 source entries. See [ADR 0005](../adr/0005-preserve-destination-initializer.md)
and [the history record](repository-history.json).

The adoption is [PR #1](https://github.com/kekekewww/Echo-Canva-Web/pull/1) into
`main` with a merge commit, preserving
the extraction root and initializer as ancestors. No force push, upstream write,
squash, rebase or deployment is involved. GitHub-hosted check results and the
final merge state are visible on the PR; the initial NOT EXECUTED entries above
describe the earlier publication stage, not a verdict on a later run. Existing
local 44/45 failures remain recorded in the [verification ledger](FINAL_VERIFICATION.md).

PR #1 was merged at `3b2a6b5d6f7b9518e2a8ac9f488cabb0a568a648`.
The corrected PR run and [merged-main run 38350389651](https://github.com/kekekewww/Echo-Canva-Web/actions/runs/38350389651)
both completed successfully: 524 units, Chromium 45/45 and actual Docker
build/start/health/API/runtime/shutdown checks. The initial hosted Docker run's
old-Compose failure is retained. [Subsequent verification fixes](VERIFICATION_FIXES.md)
record the newly authorized performance, dependency and notice corrections.
