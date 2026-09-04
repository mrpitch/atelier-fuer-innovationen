import { runSandcastleForIssue, parseArgs } from '@mrpitch/sandcastle'

const output = await runSandcastleForIssue(parseArgs(process.argv.slice(2)), {
	checkCommand: 'pnpm test',
})
console.log(JSON.stringify(output))
