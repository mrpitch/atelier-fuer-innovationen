import { execFileSync, execSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { claudeCode, Output, run } from '@ai-hero/sandcastle'
import { docker } from '@ai-hero/sandcastle/sandboxes/docker'
import { z } from 'zod'

// sandcastle hard-errors if `output` is set and `maxIterations !== 1`. This
// wrapper hands off exactly one afk issue per call, so that isn't a real
// constraint in practice.
const MAX_ITERATIONS = 1

// The head branch strategy bind-mounts this whole repo into the container,
// which would otherwise shadow the image's own baked node_modules with the
// host's (built for the host's OS/arch, not the container's). Mounting a
// separate, persistent host directory at the container's node_modules path
// keeps container installs off the host entirely: the first run (or a
// lockfile change) pays a real install, and every run after that is a fast,
// host-untouched no-op. The leaf segment must be literally "node_modules" —
// most JS tooling (vitest, eslint, etc.) already excludes any directory
// with that exact name by default, so the vendored packages cached here
// are never scanned by host tooling.
const CONTAINER_NODE_MODULES_CACHE = join(
	process.cwd(),
	'.sandcastle',
	'container-cache',
	'node_modules',
)

// Cold-cache installs (first run, or after a lockfile change) can take
// several minutes inside the sandbox; sandcastle's default hook timeout is
// too short for that case.
const SANDBOX_READY_TIMEOUT_MS = 300_000

export const resultSchema = z.object({
	success: z.boolean(),
	summary: z.string(),
	blockers: z.string().nullable(),
})

const issueSchema = z.object({
	title: z.string(),
	body: z.string().nullable(),
})

export interface SandcastleIssueInput {
	issueNumber: string
	issueTitle: string
	issueBody: string
	fixedPoint: string
}

const BASE_BRANCH_FILE = join(process.cwd(), '.sandcastle', 'base-branch.txt')

// implement-epic step 3 writes this immediately before invoking
// sandbox_command, so /implement's review step inside the sandbox has a
// fixed point to diff against — the branch the feature branch was cut from
// (the epic branch, or trunk for a standalone issue). A literal file path,
// not a CLI arg, for the same reason the repair-context path (below) is:
// it keeps sandbox_command's own invocation a fixed, analysable shape for
// the Bash permission check.
export function readFixedPoint(): string {
	try {
		return readFileSync(BASE_BRANCH_FILE, 'utf8').trim()
	} catch {
		throw new Error(
			`Expected ${BASE_BRANCH_FILE} to exist — implement-epic writes it right before invoking sandbox_command. Run this script through implement-epic, not standalone.`,
		)
	}
}

// No explicit return-type annotation: `run()`'s overload resolution depends
// on the literal `output` type surviving inference (OutputObjectDefinition
// vs. the base RunOptions), so widening it here would pick the wrong overload.
export function buildRunOptions(input: SandcastleIssueInput) {
	return {
		name: 'worker',
		sandbox: docker({
			mounts: [{ hostPath: CONTAINER_NODE_MODULES_CACHE, sandboxPath: 'node_modules' }],
		}),
		agent: claudeCode('claude-sonnet-5'),
		promptFile: './.sandcastle/prompt.md',
		promptArgs: {
			ISSUE_NUMBER: input.issueNumber,
			ISSUE_TITLE: input.issueTitle,
			ISSUE_BODY: input.issueBody,
			FIXED_POINT: input.fixedPoint,
			// TARGET_BRANCH is a sandcastle built-in for the head branch
			// strategy — it's auto-derived from whatever's actually checked
			// out and passing it here throws. assertOnIssueBranch() below
			// guards against the host being on the wrong branch instead.
		},
		maxIterations: MAX_ITERATIONS,
		output: Output.object({ tag: 'result', schema: resultSchema }),
		branchStrategy: { type: 'head' as const },
		hooks: {
			sandbox: {
				// CI=true keeps this non-interactive. Cheap once the cache above is
				// warm; only a lockfile change or a first run does real work here.
				onSandboxReady: [
					{ command: 'CI=true pnpm install --frozen-lockfile', timeoutMs: SANDBOX_READY_TIMEOUT_MS },
				],
			},
		},
	}
}

// sandcastle's head branch strategy bind-mounts whatever the host currently
// has checked out, deriving its own TARGET_BRANCH from that — it never takes a
// branch from us. If the host drifted onto a different branch, sandcastle
// would silently run against the wrong code with no error, so we check here.
//
// The expectation is derived from the issue number rather than passed in as
// argv: implement-epic always sandboxes an issue from its own
// `feat/<N>-*` branch (its own branch procedure creates and checks it out
// before invoking sandbox_command), so the issue number alone pins which
// branch is correct. See fetchIssue() for why keeping argv free of
// caller-substituted values matters.
export function assertOnIssueBranch(issueNumber: string) {
	const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
	const expectedPrefix = `feat/${issueNumber}-`
	if (!currentBranch.startsWith(expectedPrefix)) {
		throw new Error(
			`Expected the host repo to be checked out on a "${expectedPrefix}*" branch for issue #${issueNumber}, but found "${currentBranch}".`,
		)
	}
}

// The wrapper fetches the issue itself instead of taking the title and body as
// argv. Claude Code's Bash permission check matches an allowlist rule by
// statically parsing the command; a call whose arguments come from `$(gh issue
// view ...)` is opaque to that parser, so no rule can match it and every run
// prompts a human for approval — which is exactly what an afk run must not
// need. Fetching here keeps the invocation a fixed, analysable shape:
// `pnpm tsx scripts/run-sandcastle.ts <N>` (matching implement-epic's
// `sandbox_command` contract, which substitutes `{issue}` and nothing else).
//
// gh runs on the host (never in the container, which holds no credentials) and
// is expected to already be authenticated, same as every other step that
// touches the issue tracker.
export function fetchIssue(issueNumber: string): { issueTitle: string; issueBody: string } {
	const raw = execFileSync('gh', ['issue', 'view', issueNumber, '--json', 'title,body'], {
		encoding: 'utf8',
	})
	const issue = issueSchema.parse(JSON.parse(raw))
	return { issueTitle: issue.title, issueBody: issue.body ?? '' }
}

// implement-epic's hand-back procedure re-invokes a configured
// sandbox_command with `--repair-context <path>` after a gate fails, so a
// repair pass continues from the previous attempt instead of starting over.
// The report arrives as a file path for the same reason the issue body is
// fetched rather than passed: a literal path keeps the command statically
// analysable, where an inlined report would not be.
export function buildIssueBody(issueBody: string, repairContextPath?: string): string {
	if (!repairContextPath) return issueBody

	const report = readFileSync(repairContextPath, 'utf8').trim()
	return `${issueBody}

## Previous attempt

A previous run on this branch did not clear a gate. Its working tree is still in
place — continue from it rather than starting over.

${report}`
}

// docker()'s bind-mount provider requires the mounted hostPath to already
// exist before container creation.
function ensureContainerNodeModulesCache() {
	mkdirSync(CONTAINER_NODE_MODULES_CACHE, { recursive: true })
}

export async function runSandcastle(input: SandcastleIssueInput) {
	assertOnIssueBranch(input.issueNumber)
	ensureContainerNodeModulesCache()
	const { output } = await run(buildRunOptions(input))
	return output
}

export interface SandcastleCliArgs {
	issueNumber: string
	repairContextPath?: string
}

export async function runSandcastleForIssue(args: SandcastleCliArgs) {
	// Deliberately checked here as well as in runSandcastle(): a drifted host
	// should fail before spending a gh round-trip, and runSandcastle() stays
	// self-guarding for callers that build the input themselves. The duplicate
	// check is one `git rev-parse`.
	assertOnIssueBranch(args.issueNumber)
	const { issueTitle, issueBody } = fetchIssue(args.issueNumber)
	const fixedPoint = readFixedPoint()
	return runSandcastle({
		issueNumber: args.issueNumber,
		issueTitle,
		fixedPoint,
		issueBody: buildIssueBody(issueBody, args.repairContextPath),
	})
}

export function parseArgs(argv: string[]): SandcastleCliArgs {
	const usage = 'Usage: tsx scripts/run-sandcastle.ts <issueNumber> [--repair-context <path>]'
	const [issueNumber, ...rest] = argv

	// Digits only: the number is interpolated into the branch assertion and
	// handed to gh, so anything else is a caller mistake worth failing loudly.
	if (!issueNumber || !/^\d+$/.test(issueNumber)) {
		throw new Error(usage)
	}

	const flagIndex = rest.indexOf('--repair-context')
	if (flagIndex === -1) return { issueNumber }

	const repairContextPath = rest[flagIndex + 1]
	if (!repairContextPath) {
		throw new Error(`--repair-context requires a path. ${usage}`)
	}

	return { issueNumber, repairContextPath }
}

async function main() {
	const output = await runSandcastleForIssue(parseArgs(process.argv.slice(2)))
	console.log(JSON.stringify(output))
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error(error)
		process.exit(1)
	})
}
