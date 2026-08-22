import { execFileSync, execSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

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

// Same bind-mount problem as node_modules above, different symptom: without
// this, `.next` inside the container is the host's real `.next` directory
// (bind-mounted, not copied). If the implement or review pass runs `pnpm
// dev`/`pnpm build` to verify its work — exactly what .sandcastle/prompt.md
// tells it to — Turbopack's cache ends up with absolute paths baked in
// pointing at the *container's* cwd (`/home/agent/workspace`), not the
// host's. The host's next `pnpm dev` then fails to resolve its own module
// graph against a cache built for a path that doesn't exist here. Isolating
// `.next` the same way as node_modules means a sandbox build can never
// corrupt the host's own dev cache; the host just rebuilds one of its own
// on the next `pnpm dev`, same as if the sandbox had never run.
const CONTAINER_NEXT_CACHE = join(process.cwd(), '.sandcastle', 'container-cache', 'next')

// The image has no `~/.npmrc`, so the host's `store-dir` setting never
// reaches the container — pnpm falls back to its own last-resort default:
// a `.pnpm-store` folder relative to cwd. Since cwd inside the container
// *is* this bind-mounted worktree (see the node_modules comment above),
// that fallback wrote a stray `.pnpm-store` straight into the repo on
// every real (non-cached) install. Mounting the host's actual global pnpm
// store and pointing `store-dir` at it (via `npm_config_store_dir` below)
// makes the container share the same content-addressable cache as the
// host instead of creating a second one.
//
// `pnpm store path` reports `<store-dir>/vN` (pnpm appends its own
// cache-format version segment); `dirname` strips that back down to the
// actual `store-dir` value so the container recreates the same `vN`
// segment on its own, landing in the same place as the host's store.
const HOST_PNPM_STORE = dirname(execSync('pnpm store path', { encoding: 'utf8' }).trim())
const CONTAINER_PNPM_STORE = '/home/agent/.pnpm-store'

// Cold-cache installs (first run, or after a lockfile change) can take
// several minutes inside the sandbox; sandcastle's default hook timeout is
// too short for that case.
const SANDBOX_READY_TIMEOUT_MS = 300_000

// What `.sandcastle/prompt.md` itself instructs the implementing agent to
// emit — the wrapper's own final output (see resultSchema below) is a
// superset assembled from this plus the independent review pass.
const implementResultSchema = z.object({
	success: z.boolean(),
	summary: z.string(),
	blockers: z.string().nullable(),
})

// What `.sandcastle/review-prompt.md` instructs the independent reviewer to
// emit. A separate schema/agent/session from implementResultSchema on
// purpose — see runSandcastle()'s doc comment.
const reviewResultSchema = z.object({
	verdict: z.enum(['clean', 'issues_found']),
	findings: z.string(),
	summary: z.string(),
})

// The wrapper's own contract with implement-epic (see
// docs/agents/implementation-workflow.md's "Sandbox command" section):
// `success` is only `true` once both the implementer and the independent
// reviewer are satisfied, never on the implementer's self-report alone.
export const resultSchema = z.object({
	success: z.boolean(),
	summary: z.string(),
	blockers: z.string().nullable(),
	// The independent reviewer's report — implement-epic's step 4 posts this
	// as a PR comment for the audit trail. Null only when the implement pass
	// itself failed/blocked before a review pass ever ran.
	reviewReport: z.string().nullable(),
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

// A safety margin above sandcastle's own 600s default. Doesn't replace
// wrapping network calls in `timeout` (see prompt.md's Rules) — that's
// what actually keeps a hung registry lookup from burning the whole
// budget — this just gives a well-behaved-but-slow step more room before
// AgentIdleTimeoutError kills the run outright.
const IDLE_TIMEOUT_SECONDS = 900

// Fresh docker() sandbox config per call — buildImplementRunOptions() and
// buildReviewRunOptions() each get their own, rather than sharing one
// object, in case sandcastle mutates it internally.
function buildDockerSandbox() {
	return docker({
		mounts: [
			{ hostPath: CONTAINER_NODE_MODULES_CACHE, sandboxPath: 'node_modules' },
			{ hostPath: CONTAINER_NEXT_CACHE, sandboxPath: '.next' },
			{ hostPath: HOST_PNPM_STORE, sandboxPath: CONTAINER_PNPM_STORE },
		],
		env: { npm_config_store_dir: CONTAINER_PNPM_STORE },
	})
}

// CI=true keeps this non-interactive. Cheap once the mounts above are
// warm — including on the review pass's own container, since it shares
// the same host-mounted caches and the lockfile hasn't changed — only a
// lockfile change or a genuinely first run does real work here.
const installHook = {
	onSandboxReady: [
		{ command: 'CI=true pnpm install --frozen-lockfile', timeoutMs: SANDBOX_READY_TIMEOUT_MS },
	],
}

// No explicit return-type annotation: `run()`'s overload resolution depends
// on the literal `output` type surviving inference (OutputObjectDefinition
// vs. the base RunOptions), so widening it here would pick the wrong overload.
export function buildImplementRunOptions(input: SandcastleIssueInput) {
	return {
		name: 'implement',
		sandbox: buildDockerSandbox(),
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
		// maxRetries: a malformed <result> tag resumes the same session with a
		// token-efficient error description instead of failing the whole run
		// (and losing the already-committed work) over a formatting slip.
		output: Output.object({ tag: 'result', schema: implementResultSchema, maxRetries: 1 }),
		branchStrategy: { type: 'head' as const },
		idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
		hooks: { sandbox: installHook },
	}
}

// The review pass runs as a brand-new session (no resumeSession) on the
// SAME host branch — head strategy bind-mounts whatever's currently
// checked out, which by now includes the implementer's commit(s) — so it
// has no access to the implementer's reasoning, only the diff and the
// issue. That's what makes it an independent check rather than the
// implementer grading its own work; see runSandcastle()'s doc comment.
export function buildReviewRunOptions(input: SandcastleIssueInput) {
	return {
		name: 'review',
		sandbox: buildDockerSandbox(),
		agent: claudeCode('claude-sonnet-5'),
		promptFile: './.sandcastle/review-prompt.md',
		promptArgs: {
			ISSUE_NUMBER: input.issueNumber,
			ISSUE_TITLE: input.issueTitle,
			ISSUE_BODY: input.issueBody,
			FIXED_POINT: input.fixedPoint,
		},
		maxIterations: MAX_ITERATIONS,
		output: Output.object({ tag: 'result', schema: reviewResultSchema, maxRetries: 1 }),
		branchStrategy: { type: 'head' as const },
		idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
		hooks: { sandbox: installHook },
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

// docker()'s bind-mount provider requires each mounted hostPath to already
// exist before container creation.
function ensureContainerCacheDirs() {
	mkdirSync(CONTAINER_NODE_MODULES_CACHE, { recursive: true })
	mkdirSync(CONTAINER_NEXT_CACHE, { recursive: true })
}

// Two sequential run() calls on the same host branch, deliberately not one
// call whose prompt does both jobs and not a resumed session for the
// second: the implementer already runs /code-review on itself inside
// .sandcastle/prompt.md's own /implement step, and self-review's blind
// spots are exactly the ones a second pass in the *same* context would
// share. A fresh session with no resumeSession sees only the diff and the
// issue, not the implementer's own rationalizations — a real second
// opinion, not the same agent grading its own work twice. Container boot
// is cheap either way (~1s, confirmed against this repo's own sandbox
// logs) and the package caches are host-mounted, so a second container
// costs one more no-op `pnpm install`, not a second real one.
//
// `success` is only ever `true` once the independent review comes back
// clean — implement-epic's auto-merge (docs/agents/implementation-workflow.md)
// treats `success: true` as its only gate, so this is what actually keeps
// a self-approved change from squash-merging into the epic branch
// unattended.
export async function runSandcastle(input: SandcastleIssueInput) {
	assertOnIssueBranch(input.issueNumber)
	ensureContainerCacheDirs()

	const { output: implementOutput } = await run(buildImplementRunOptions(input))
	if (!implementOutput.success) {
		// Nothing was committed cleanly (or /implement itself reported a
		// blocker) — there's nothing for an independent review to look at yet.
		return { ...implementOutput, reviewReport: null }
	}

	const { output: reviewOutput } = await run(buildReviewRunOptions(input))
	if (reviewOutput.verdict === 'clean') {
		return {
			success: true,
			summary: implementOutput.summary,
			blockers: null,
			reviewReport: reviewOutput.summary,
		}
	}

	return {
		success: false,
		summary: implementOutput.summary,
		blockers: `Independent review (fresh session, no context shared with the implementer) found issues after the implementation was already committed:\n\n${reviewOutput.findings}`,
		reviewReport: reviewOutput.findings,
	}
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
