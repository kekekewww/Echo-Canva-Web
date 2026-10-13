# client-only 0.0.1 historical provenance

The original marker has been replaced in both executable copies with an
independently authored, project-MIT implementation through version-specific pnpm
patches. This directory retains the original publication evidence; it is no
longer an allowed runtime notice exception. See [ADR 0006](../../adr/0006-local-dependency-patches.md).

The [exact published npm manifest](https://registry.npmjs.org/client-only/0.0.1)
declares `MIT`. `UPSTREAM_PACKAGE.json` is copied unchanged from the
[published archive](https://registry.npmjs.org/client-only/-/client-only-0.0.1.tgz),
verified against its registry integrity:

`sha512-IV3Ou0jSMzZrd3pZ48nLkT9DA7Ag1pnPzaiQhpW7c3RbcqqzvzzVu+L8gfqMp/8IM2MQtSiqaCxrrcfu8I8rMA==`

The archive contains `error.js`, empty `index.js`, and `package.json`; it contains
no copyright/license notice or original source revision. The manifest's React
homepage and issue links are not an authentic copyright statement. The identical
vendored JavaScript source was present in unpatched Next.js' `dist/compiled/client-only`.

This record preserves the declared MIT license and exact publication provenance.
It does **not** invent a copyright holder, substitute the Echo Canvas MIT notice,
or assert that React's or Next.js' copyright applies to the original npm release.
An authoritative permission/copyright notice for the original package remains an
upstream provenance question. The independently authored replacement does not
claim to discover that notice. Runtime inventories must reject original copies,
missing notices and provenance exceptions.
