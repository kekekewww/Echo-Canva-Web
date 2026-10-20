# Third-party notices

Echo Canvas Web source remains under the [MIT License](LICENSE). Third-party
dependencies retain their own copyright notices and licenses; the project's MIT
license does not replace those terms.

## Project assets

The four bundled WAV fixtures are original deterministic procedural signals. Their
provenance and attribution remain in [public/audio/LICENSE.md](public/audio/LICENSE.md).
The project icon is the original vector asset. No named external HRTF dataset is
bundled; browser HRTF rendering uses the browser's Web Audio implementation.

## Dependency notices

Install with the committed pnpm lockfile to obtain the exact package versions and
their upstream notices. Major packages include Next.js and React (MIT), TypeScript
and the OpenAI SDK (Apache-2.0), Zod and Vitest (MIT), and Playwright (Apache-2.0).
Transitive dependencies include additional BSD, ISC, MPL, Python, CC-BY, BlueOak,
and LGPL terms. Do not describe every dependency as MIT.

The production Docker build runs `node scripts/collect-runtime-licenses.mjs` after
the standalone build. It copies original dependency license/copyright/notice files,
including notices for bundled Next.js code, into `/app/third-party-licenses` and
writes `/app/third-party-licenses/inventory.json`. It includes traced runtime
packages and declared application runtime dependencies whose code can be bundled
into server chunks, such as OpenAI and Zod. The inventory records package names,
versions, declared licenses, source repositories, copied notice paths, supplemental
provenance records, and any missing records. The final image retains this directory, the
project MIT license, this notice, and the procedural-audio notice. The collector
does not fetch additional software or alter upstream notices.

## Sharp and libvips

Next.js includes Sharp for image optimization. Sharp's JavaScript package uses
Apache-2.0; its native distributions include libvips and components with separate
terms, including LGPL-3.0-or-later. Review the exact native package's collected
license files when distributing an image, along with the [Sharp project
license](https://sharp.pixelplumbing.com/#licensing), [Sharp/libvips packaging and
source information](https://github.com/lovell/sharp-libvips), and [libvips
source](https://github.com/libvips/libvips). Exact component versions and native
package repositories are available in the generated inventory and upstream native
package metadata. Release-pinned supplemental notices and full LGPL/GPL texts are
retained in [docs/licenses](docs/licenses/README.md) when an npm native archive omits
them; the builder copies these into the generated runtime notice directory. Preserve
the relevant notices and source availability/relinking
rights required by their terms when redistributing or modifying these components.

The Docker base image also contains Node.js and Debian packages with their own
notices, including `/usr/share/doc/*/copyright` where supplied by Debian. The
application dependency inventory is separate from the base-image package inventory.

The original `client-only@0.0.1` archive declares MIT but omits a
copyright/permission notice and source revision. Its exact published metadata and
integrity remain as [historical provenance](docs/licenses/client-only-0.0.1/PROVENANCE.md).
No authentic upstream copyright notice was established, and none is invented.
Version-specific [Next.js](patches/next@16.4.2.patch) and
[installed marker](patches/client-only@0.0.1.patch) patches replace both copies with
the independently authored `@echo-canvas/client-only-marker@1.0.0`, under the
repository's complete MIT notice. Its fixed filenames, default no-op entry and
`react-server` rejection preserve the documented marker convention. These patches
do not assign this repository's copyright to the original npm code. The collector
fails on notice/provenance gaps, and the runtime guard rejects the original marker
artifact and any provenance exception.

This file and the automated inventory document provenance and retain notices. They
are not a certification that every downstream redistribution arrangement satisfies
every license obligation.
