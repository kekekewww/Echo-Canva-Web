# Source Extraction Report

Date: 2026-10-13. **Completed and verified:** the independent root commit has exactly the Build Week tag's Git tree, including all 291 paths and blob identities. The detailed source/release/command record is [ORIGIN.md](../ORIGIN.md).

| Verification | Actual result |
| --- | --- |
| Fetch origin tags and peel the permitted tag | PASS: `c8fe24700b67861e2f64fbb8950e9281c0e13a3c` |
| Compare tag with later Main without extracting Main | PASS: comparison only, 36 differing paths; no merge/cherry-pick/copy from later Main |
| Export using peeled SHA with newline conversion disabled | PASS: all 291 archive blobs match |
| Independent Git root tree | PASS: `ca4a2543f6f0e8848fe8d8eb57f3ed70faaba294`, identical to upstream |
| Preserve original material and procedural asset attribution | PASS: original MIT and `public/audio/LICENSE.md` retained |
| Preserve historical delivery evidence | PASS: 73 archived originals/snapshots verified against source hashes; [manifest](../archive/build-week/MANIFEST.json) |
| Isolated work and new remote | PASS: independent directory/branch; completed branch subsequently pushed to the user-supplied remote; see [remote handoff](REMOTE_HANDOFF.md) |
| Original source write / image publication / deploy | NOT PERFORMED; the destination PR adoption does not write the original source repository |

Run `node scripts/verify-source-baseline.mjs` from a full-history clone to recheck the independent extraction root. A shallow clone must first retrieve that root commit. The [machine-readable manifest](source-baseline-manifest.json) also supplies SHA-256 for exported source bytes.

Maintenance is limited to independently authored open-source documentation/governance, historical relocation, dependency/AI safety corrections, Docker/CI/server health, runtime notices and additive tests. Final unchanged-core verification is recorded in [FINAL_VERIFICATION.md](FINAL_VERIFICATION.md). No desktop, native runtime, Steam Audio, VST or engine integration was added.

After initial publication, the user authorized PR creation and automatic merge.
The content-neutral destination-history bridge preserves both the immutable
extraction root and the LICENSE-only initializer. The strict verifier checks
these exact two roots; see [ADR 0005](../adr/0005-preserve-destination-initializer.md)
and [remote handoff](REMOTE_HANDOFF.md). The initializer adds no product code.
