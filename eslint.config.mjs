import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
	...nextCoreWebVitals,
	...nextTypescript,
	// fumadocs-mdx postinstall codegen output; not source, never linted.
	{ ignores: ['.source/**'] },
	// Sandcastle bind-mounts a copy of `.next` here; it holds generated Next
	// route types after a sandbox run (gitignored, never linted).
	{ ignores: ['.sandcastle/container-cache/**'] },
]

export default config
