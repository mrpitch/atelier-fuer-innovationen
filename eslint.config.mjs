import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
	...nextCoreWebVitals,
	...nextTypescript,
	// fumadocs-mdx postinstall codegen output; not source, never linted.
	{ ignores: ['.source/**'] },
]

export default config
