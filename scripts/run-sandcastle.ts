import { parseArgs, runSandcastleForIssue } from '@mrpitch/sandcastle'

async function main() {
	const output = await runSandcastleForIssue(parseArgs(process.argv.slice(2)), {
		checkCommand: 'pnpm exec tsc --noEmit && pnpm exec eslint .',
	})
	console.log(JSON.stringify(output))
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
