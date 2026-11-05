import path from 'node:path'

// Vendored or sandbox TS lives in the paths .prettierignore leaves alone.
// Keep this list in step with it.
const VENDORED = /^(\.agents|\.claude|\.sandcastle)\//

const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ')

const config = {
	'*.{ts,tsx}': (staged) => {
		const files = staged
			.map((file) => path.relative(process.cwd(), file))
			.filter((file) => !VENDORED.test(file))
		if (files.length === 0) return []
		return [
			`eslint --fix --max-warnings 0 ${quote(files)}`,
			`prettier --write ${quote(files)}`,
			// No filenames here: tsc ignores tsconfig.json when given file
			// arguments, so this must be one full-project run.
			'pnpm typecheck',
		]
	},
	'!(*.{ts,tsx})': 'prettier --write --ignore-unknown',
}

export default config
