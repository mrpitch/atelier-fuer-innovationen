import { type ChildProcess, execFileSync, execSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { connect, createServer } from 'node:net'
import { tmpdir } from 'node:os'
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

// A safety margin above sandcastle's own 600s default. Doesn't replace
// wrapping network calls in `timeout` (see prompt.md's Rules) — that's
// what actually keeps a hung registry lookup from burning the whole
// budget — this just gives a well-behaved-but-slow step more room before
// AgentIdleTimeoutError kills the run outright.
const IDLE_TIMEOUT_SECONDS = 900

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

// --- Host Chrome for Playwright MCP -----------------------------------
//
// The sandbox container has no browser and never gets one baked into its
// image — Sandcastle only ever runs on this host machine (never a remote
// sandbox), so instead of a second container, the container's own
// .sandcastle/mcp-playwright-connect.sh attaches over CDP to a real Chrome
// this script launches right here, on the host, before the container starts.
//
// Chrome's own remote-debugging server has no authentication, so it never
// listens beyond loopback (127.0.0.1) — the only thing actually reachable
// from the sandbox is a dumb TCP forwarder in front of it, bound to
// 0.0.0.0 because that's what the container needs to reach it via
// host.docker.internal (Docker Desktop has no separate "docker-only"
// interface on macOS to bind to instead). That forwarder allowlists
// loopback-only sources: Docker Desktop NATs the container's
// host.docker.internal traffic so it arrives here as 127.0.0.1, while a
// genuine LAN client arrives with its own real address — verified
// empirically, not assumed. (Linux hosts using
// `--add-host=host.docker.internal:host-gateway` don't get that
// NAT-to-loopback rewrite; the container's real bridge-subnet address
// would need allowlisting there instead — not handled here.)
//
// Chrome's remote-debugging HTTP server also rejects any request whose
// Host header isn't "localhost" or a literal IP address (DNS-rebinding
// protection, shipped since Chrome 66) — this is why
// mcp-playwright-connect.sh resolves host.docker.internal to its IP
// *inside the container* before connecting, rather than handing Playwright
// the hostname directly.
const CHROME_READY_TIMEOUT_MS = 15_000

// How long to wait for Chrome to actually exit after each of SIGTERM and
// SIGKILL. Only spent on shutdown, and only when Chrome is slow to go.
const CHROME_EXIT_TIMEOUT_MS = 5_000

interface HostBrowser {
	forwardPort: number
	close(): Promise<void>
}

// Tracked so a SIGINT/SIGTERM mid-run (or an uncaught error) still gets a
// chance to kill Chrome and free its port, instead of orphaning the
// process — see the process.once() handlers below.
let activeHostBrowser: HostBrowser | null = null

function findChromeBinary(): string {
	const macCandidates = [
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/Applications/Chromium.app/Contents/MacOS/Chromium',
	]
	for (const candidate of macCandidates) {
		try {
			execFileSync('test', ['-x', candidate])
			return candidate
		} catch {
			// not present, try the next candidate
		}
	}
	for (const bin of ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser']) {
		try {
			return execSync(`command -v ${bin}`, { encoding: 'utf8' }).trim()
		} catch {
			// not on PATH, try the next candidate
		}
	}
	throw new Error(
		'No Chrome/Chromium binary found on this host. Playwright MCP needs a real ' +
			'browser to attach to — install Google Chrome (or Chromium) on the machine ' +
			'running afk/hitl sessions.',
	)
}

// OS-assigned free port: bind to port 0, read back what the kernel picked,
// close immediately. A small TOCTOU race exists between the close and
// whatever binds it next, acceptable for a single local dev machine.
function allocatePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer()
		server.on('error', reject)
		server.listen(0, '127.0.0.1', () => {
			const address = server.address()
			if (address === null || typeof address === 'string') {
				reject(new Error('Failed to allocate a port'))
				return
			}
			server.close(() => resolve(address.port))
		})
	})
}

// kill() only delivers the signal; Chrome keeps writing to its profile
// directory until it has actually exited. Removing that directory in between
// races those writes and throws ENOTEMPTY — which, thrown from close()'s
// finally block, killed a whole run *after* its work was already committed.
// Wait for the process to be gone before touching the directory, escalating
// to SIGKILL rather than hanging the run on a Chrome that ignores SIGTERM.
async function killChromeAndWait(chrome: ChildProcess): Promise<void> {
	const hasExited = () => chrome.exitCode !== null || chrome.signalCode !== null
	if (hasExited()) return

	const exited = new Promise<void>((resolve) => chrome.once('exit', () => resolve()))
	const withinTimeout = () =>
		Promise.race([exited, new Promise<void>((resolve) => setTimeout(resolve, CHROME_EXIT_TIMEOUT_MS))])

	chrome.kill()
	await withinTimeout()
	if (hasExited()) return

	chrome.kill('SIGKILL')
	await withinTimeout()
}

// A leftover profile directory is a few megabytes in the OS temp dir, which
// the OS reaps on its own schedule. A run dying in cleanup is not something
// the caller can recover from — the work is committed but nothing downstream
// ever learns it succeeded. Never trade the second failure for the first:
// retry (rmSync retries ENOTEMPTY and friends natively), then warn and move on.
function removeUserDataDir(userDataDir: string): void {
	try {
		rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error)
		console.warn(`Warning: could not remove Chrome profile directory ${userDataDir}: ${reason}`)
	}
}

async function waitForChromeReady(port: number): Promise<void> {
	const deadline = Date.now() + CHROME_READY_TIMEOUT_MS
	while (Date.now() < deadline) {
		try {
			const response = await fetch(`http://127.0.0.1:${port}/json/version`)
			if (response.ok) return
		} catch {
			// not up yet
		}
		await new Promise((resolve) => setTimeout(resolve, 200))
	}
	throw new Error(`Chrome did not become ready on 127.0.0.1:${port} within ${CHROME_READY_TIMEOUT_MS}ms`)
}

// One Chrome + forwarder pair per call — buildImplementRunOptions() and
// buildReviewRunOptions() each start their own rather than sharing one
// instance, so the review pass never inherits console/localStorage/cookie
// state the implementer's browsing session left behind. Costs one extra
// Chrome boot (~1-2s); matches this file's existing insistence (see
// buildReviewRunOptions()'s doc comment) that the review pass be a genuinely
// fresh perspective, not just a fresh Claude Code session sharing state
// underneath it.
async function startHostBrowser(): Promise<HostBrowser> {
	const chromeBinary = findChromeBinary()
	const chromePort = await allocatePort()
	const forwardPort = await allocatePort()
	const userDataDir = mkdtempSync(join(tmpdir(), 'sandcastle-chrome-'))

	const chrome = spawn(
		chromeBinary,
		[
			'--headless=new',
			`--remote-debugging-port=${chromePort}`,
			'--remote-debugging-address=127.0.0.1',
			'--no-sandbox',
			'--disable-gpu',
			`--user-data-dir=${userDataDir}`,
		],
		{ stdio: 'ignore' },
	)

	try {
		await waitForChromeReady(chromePort)
	} catch (error) {
		await killChromeAndWait(chrome)
		removeUserDataDir(userDataDir)
		throw error
	}

	const forwarder = createServer((client) => {
		const remote = client.remoteAddress ?? ''
		const isLoopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1'
		if (!isLoopback) {
			client.destroy()
			return
		}
		const upstream = connect(chromePort, '127.0.0.1')
		client.pipe(upstream)
		upstream.pipe(client)
		client.on('error', () => {})
		upstream.on('error', () => {})
	})
	await new Promise<void>((resolve) => forwarder.listen(forwardPort, '0.0.0.0', resolve))

	let closed = false
	const hostBrowser: HostBrowser = {
		forwardPort,
		async close() {
			if (closed) return
			closed = true
			await new Promise<void>((resolve) => forwarder.close(() => resolve()))
			await killChromeAndWait(chrome)
			removeUserDataDir(userDataDir)
			if (activeHostBrowser === hostBrowser) activeHostBrowser = null
		},
	}
	activeHostBrowser = hostBrowser
	return hostBrowser
}

// Backstop for a killed/crashed run: without this, SIGINT/SIGTERM leaves
// Chrome running and its port held, invisible until the next run mysteriously
// can't bind the same port range.
async function shutdownActiveBrowserAndExit(): Promise<void> {
	await activeHostBrowser?.close()
	process.exit(1)
}
process.once('SIGINT', () => void shutdownActiveBrowserAndExit())
process.once('SIGTERM', () => void shutdownActiveBrowserAndExit())

type SandcastleRole = 'implement' | 'review'

// Fresh docker() sandbox config per call — buildImplementRunOptions() and
// buildReviewRunOptions() each get their own, rather than sharing one
// object, in case sandcastle mutates it internally.
//
// SANDCASTLE_SANDBOXED and SANDCASTLE_ROLE mark the container as such for
// whatever runs inside it — nothing reads them yet, but they're the gating
// mechanism for any future rule that must apply inside a sandbox run and
// never to an interactive host session (e.g. a project-level config copy
// gated on SANDCASTLE_SANDBOXED), and for anything that needs to tell the
// implement and review passes apart.
function buildDockerSandbox(cdpForwardPort: number, role: SandcastleRole) {
	return docker({
		mounts: [
			{ hostPath: CONTAINER_NODE_MODULES_CACHE, sandboxPath: 'node_modules' },
			{ hostPath: CONTAINER_NEXT_CACHE, sandboxPath: '.next' },
			{ hostPath: HOST_PNPM_STORE, sandboxPath: CONTAINER_PNPM_STORE },
		],
		env: {
			npm_config_store_dir: CONTAINER_PNPM_STORE,
			// Read by .sandcastle/mcp-playwright-connect.sh to build its
			// --cdp-endpoint after resolving host.docker.internal to an IP.
			SANDCASTLE_CDP_PORT: String(cdpForwardPort),
			SANDCASTLE_SANDBOXED: '1',
			SANDCASTLE_ROLE: role,
		},
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
export function buildImplementRunOptions(input: SandcastleIssueInput, cdpForwardPort: number) {
	return {
		name: 'implement',
		sandbox: buildDockerSandbox(cdpForwardPort, 'implement'),
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
export function buildReviewRunOptions(input: SandcastleIssueInput, cdpForwardPort: number) {
	return {
		name: 'review',
		sandbox: buildDockerSandbox(cdpForwardPort, 'review'),
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

// The guardrails that still reach an agent by bind-mount rather than by the
// image (see #67's split: CLAUDE.md/settings.json are baked into the image,
// content-empty on purpose — anything with actual rules still lives here,
// in the branch). A branch cut before one of these landed on trunk bind-
// mounts a tree that never saw it, and would silently run unguarded — or
// worse, merge back and delete the rule from trunk. Checking for these
// host-side, before the container starts, turns that into a loud failure
// instead of a silent no-op.
export const GUARDRAIL_ARTIFACTS = ['.sandcastle/efficiency-rules.md', 'AGENTS.md', 'CLAUDE.md']

export function assertGuardrailsPresent(baseDir: string = process.cwd()) {
	const missing = GUARDRAIL_ARTIFACTS.filter((path) => !existsSync(join(baseDir, path)))
	if (missing.length > 0) {
		throw new Error(
			`Missing guardrail artifact(s) in the checked-out tree: ${missing.join(', ')}. ` +
				'This branch was likely cut before they landed on trunk — rebase onto trunk ' +
				'before retrying.',
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
// Exported for the test: docker() validates that every mount's host path
// already exists, so anything constructing a sandbox — runSandcastle() below,
// or a test calling buildImplementRunOptions() directly — has to run this
// first. These directories are gitignored, so a clean checkout (CI, a fresh
// clone) genuinely does not have them.
export function ensureContainerCacheDirs() {
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
	assertGuardrailsPresent()
	ensureContainerCacheDirs()

	const implementBrowser = await startHostBrowser()
	let implementOutput
	try {
		;({ output: implementOutput } = await run(
			buildImplementRunOptions(input, implementBrowser.forwardPort),
		))
	} finally {
		await implementBrowser.close()
	}
	if (!implementOutput.success) {
		// Nothing was committed cleanly (or /implement itself reported a
		// blocker) — there's nothing for an independent review to look at yet.
		return { ...implementOutput, reviewReport: null }
	}

	// A fresh Chrome for the review pass, not the implementer's — see
	// startHostBrowser()'s doc comment: a reused browser could leak
	// console/localStorage/cookie state from the implement pass into what's
	// supposed to be an independent check.
	const reviewBrowser = await startHostBrowser()
	let reviewOutput
	try {
		;({ output: reviewOutput } = await run(buildReviewRunOptions(input, reviewBrowser.forwardPort)))
	} finally {
		await reviewBrowser.close()
	}
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
	// Same reasoning as assertOnIssueBranch above: fail before the gh
	// round-trip below, not just before the container.
	assertGuardrailsPresent()
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
