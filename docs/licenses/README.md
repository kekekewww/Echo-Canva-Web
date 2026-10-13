# Pinned supplemental runtime notices

Some Next.js vendored packages and Sharp native npm archives omit notice files that
are present in the original published package or its upstream release. These files
retain that material for the production image. They do not change executable code.

`runtime-notice-fallbacks.json` maps exact package versions to supplemental files.
The collector retains source URLs and explanatory notes in its inventory. Review
and update these records when updating the corresponding dependency; never apply an
old notice record to an unreviewed new native release.

- Edge Runtime licenses are unchanged bytes from the exact published npm tarballs,
  verified against registry SHA-512 integrity values.
- Sharp/libvips packaging notices and build version references are pinned to the
  `v1.3.4` packaging commit. The full upstream libvips LGPL-2.1 text and the LGPL-3.0
  plus GPL-3.0 texts are retained because the packaging distribution invokes the
  LGPL's later-version option.
- The `client-only@0.0.1` archive declares MIT but supplies no copyright/license
  text or original source revision. Its original metadata and provenance exception
  are retained without inventing an author or assigning another project's notice.

Upstream notices, source links and exact package provenance are evidence, not a
legal certification. Base-image and bundled-native component obligations remain
separate from the npm metadata inventory.
