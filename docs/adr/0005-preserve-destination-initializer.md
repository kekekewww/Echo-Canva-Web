# 0005 - Preserve destination initializer during PR adoption

- Date: 2026-10-13
- Status: Accepted
- Scope: Git provenance and the user-authorized PR integration

## Context

The completed independent extraction was pushed to the user-supplied destination.
Its existing `main` consists of initializer commit
`923b79dd73b572100c6505694a50fa267dd3df72` with only `LICENSE`; GitHub could not
compare it with the unrelated extraction branch. The user subsequently requested
creation, push and automatic merge of a PR.

The initializer's LICENSE is byte-identical to the immutable source LICENSE:
Git blob `c8016f0c6346720d3172abde5f7f834e21c0946e`, mode `100644`.
It adds no product code and no later upstream feature.

## Decision

Merge the destination initializer into the work branch while retaining both
published histories. The bridge commit changes no tracked file. Create the PR
against `main`, then use a merge commit with an exact PR-head match; do not squash
or rebase away the immutable extraction root. Do not force-push either history.

The source verifier accepts exactly the reviewed extraction root and destination
initializer. It checks the initializer's exact commit, tree and sole LICENSE
blob in addition to the original source tree and all 291 source paths/blobs/modes.
Record their roles separately in
[repository-history.json](../maintenance/repository-history.json).
Unknown roots remain an error; this is a narrowly reviewed history adoption,
not permission to import arbitrary histories or later upstream code.

Application CI retrieves full history and runs the provenance verifier. Fork PRs
still have read-only permissions and no deployment or paid-provider credentials.
Record actual hosted check outcomes without weakening existing acoustic or
performance assertions.

## Alternatives

Replacing or force-pushing the existing main would discard its current branch
history. Squashing or rebasing the extraction onto the initializer would remove
the original extraction root from the adopted lineage. Changing the default
branch alone would leave the requested PR integration unfinished. An exact,
content-neutral bridge preserves both histories and enables a normal PR.

## Consequences and verification

Adopted full-history clones have two explicitly reviewed roots. The immutable
upstream SHA and the independent extraction root's tree remain unchanged.
There is no duplicate LICENSE archive because the existing bytes are identical;
both original commits remain reachable.

Verify the bridge's empty tree diff, all 291 source entries, rejection of missing
or unexpected roots and altered provenance records, plus ancestry after merge.
The [remote handoff](../maintenance/REMOTE_HANDOFF.md) records the initial
publication and subsequent integration stages. Previously observed E2E failures
remain historical failures even if a different runner later passes.
