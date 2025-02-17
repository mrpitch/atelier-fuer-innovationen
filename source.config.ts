import { defineDocs, defineConfig } from 'fumadocs-mdx/config'

export const docs = defineDocs({
	dir: 'src/content/docs',
})

export const content = defineDocs({
	dir: 'src/content',
})

export default defineConfig({
	mdxOptions: {
		// MDX options
	},
})
