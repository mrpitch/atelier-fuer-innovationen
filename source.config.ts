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
