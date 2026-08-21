// fumadocs-mdx v11 -> v15 breaking changes relevant to this file (see PR/commit
// for the fuller per-package migration notes): `getDefaultMDXOptions()` was
// replaced by `applyMdxPreset()`, `postInstall()` now takes an options object
// (configPath/outDir/...), and `extractedReferences` is no longer generated
// by default (opt in via `postprocess`). `defineDocs`/`defineConfig` are
// unchanged. None of this is applied here yet; that's a later ticket.
//
// Also note: the generated `.source/` output shape changed — v11 emitted a
// single `.source/index.ts` (imported in src/lib/source.ts as `@/.source`);
// v15 emits `.source/server.ts` + `.source/dynamic.ts` + `.source/browser.ts`
// instead and no longer writes `index.ts` at all. `tsconfig.json`'s
// `@/.source` path alias now points at `.source/server.ts`, which exposes the
// same `docs` collection (with `toFumadocsSource()`) that `index.ts` used to.
import { defineDocs, defineConfig } from 'fumadocs-mdx/config'

export const docs = defineDocs({
	dir: 'src/content/docs',
})

// export const xeniapolis = defineDocs({
// 	dir: 'src/content/xeniapolis',
// })

export default defineConfig({
	mdxOptions: {
		// MDX options
	},
})
