import { runSandcastleForIssue, parseArgs } from '@mrpitch/sandcastle'

const output = await runSandcastleForIssue(parseArgs(process.argv.slice(2)), {
	checkCommand: 'REPLACE_WITH_CHECK_COMMAND',
})
console.log(JSON.stringify(output))
