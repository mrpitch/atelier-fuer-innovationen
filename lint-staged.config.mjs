const config = {
	'*.{ts,tsx}': [
		'eslint --fix --max-warnings 0',
		'prettier --write',
		// A function task gets no filenames appended: tsc ignores tsconfig.json
		// when given file arguments, so this must be one full-project run.
		() => 'pnpm typecheck',
	],
	'!(*.{ts,tsx})': 'prettier --write --ignore-unknown',
}

export default config
