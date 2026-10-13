# Sharp/libvips 1.3.4 distribution source and notice record

The `@img/sharp-libvips-linux-x64@1.3.4` npm package used by the verified Linux image
declares LGPL-3.0-or-later, but its archive omits a license file. The corresponding
packaging release is `lovell/sharp-libvips` tag `v1.3.4`, annotated tag object
`158bf3bfb1e11de50032645873d52e5920c26986`, resolving to immutable commit
`ebb95f8add54eee8bed840e3fb587e4cbec857d7`.

Retained unchanged upstream files:

- [Component notices](https://github.com/lovell/sharp-libvips/blob/ebb95f8add54eee8bed840e3fb587e4cbec857d7/THIRD-PARTY-NOTICES.md), local `THIRD-PARTY-NOTICES.md` (SHA-256 `6f0d5086e3bcbee12bcdacf5878b31d1104002aeecaeb241d3fff466108082fe`).
- [Packaging Apache-2.0 license](https://github.com/lovell/sharp-libvips/blob/ebb95f8add54eee8bed840e3fb587e4cbec857d7/LICENSE), local `PACKAGING_LICENSE`.
- [Exact component versions](https://github.com/lovell/sharp-libvips/blob/ebb95f8add54eee8bed840e3fb587e4cbec857d7/versions.properties), local `versions.properties`.
- [libvips 8.18.7 LGPL-2.1 license](https://github.com/libvips/libvips/blob/24ad4d042940e6bf99a68871ba886ca8847c9c82/LICENSE), local `LIBVIPS_LICENSE`.
- [GNU LGPL-3.0 text](https://www.gnu.org/licenses/lgpl-3.0.txt), local `COPYING.LESSER` (SHA-256 `e3a994d82e644b03a792a930f574002658412f62407f5fee083f2555c5f23118`).
- [GNU GPL-3.0 text incorporated by LGPL-3.0](https://www.gnu.org/licenses/gpl-3.0.txt), local `COPYING` (SHA-256 `3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986`).

The actual Linux native package's `versions.json` reports libvips `8.18.7`. The
packaging release notice expressly uses LGPL-3.0 through the later-version option
of LGPL-2.0/2.1. The exact version map and
[packaging build script](https://github.com/lovell/sharp-libvips/blob/ebb95f8add54eee8bed840e3fb587e4cbec857d7/build/posix.sh)
identify component source archives and build steps. The packaging source is
available at this immutable commit; the libvips source is available at
`24ad4d042940e6bf99a68871ba886ca8847c9c82` (tag `v8.18.7`). The same `1.3.4`
packaging notices are retained for the Linux ARM64 package; actual ARM64 execution
has not been verified in this workspace.

No upstream native library is modified by this project. Recipients may replace
the corresponding shared libraries subject to their terms. Distributors must
review and provide the corresponding source/materials and rights required by the
applicable licenses for their distribution arrangement. These source references
and retained texts do not claim to be a complete binary component copyright audit
or a substitute for any required corresponding-source delivery.
