import { execFileSync, execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, sep } from 'node:path'

import { type AgentStreamEvent, claudeCode, type LoggingOption, Output, run } from '@ai-hero/sandcastle'
import { docker } from '@ai-hero/sandcastle/sandboxes/docker'
import { z } from 'zod'

const MAX_ITERATIONS = 1

// Prompt templates live alongside the rest of this repo's Sandcastle
// scaffold, not in an installed package — see .sandcastle/README.md.
const TEMPLATES_DIR = join(process.cwd(), '.sandcastle')

// Container-side paths — fixed regardless of host layout.
const CONTAINER_NODE_MODULES_CACHE_SUBPATH = '.sandcastle/container-cache/node_modules'
const CONTAINER_PNPM_STORE = '/home/agent/.pnpm-store'
const CONTAINER_CLAUDE_JSON = '/home/agent/.claude.json'
const HOST_CLAUDE_JSON_SUBPATH = '.sandcastle/claude.json'
const LOGS_SUBPATH = '.sandcastle/logs'
const WORKTREES_SUBPATH = '.sandcastle/worktrees'
const PRESERVED_PATCHES_SUBPATH = '.sandcastle/preserved'

const SANDBOX_READY_TIMEOUT_MS = 300_000
const IDLE_TIMEOUT_SECONDS = 900

// Shared by buildDockerSandbox() (the mount source) and ensureClaudeJsonSeed()
// (the file it seeds) — both must agree on the same host path.
function hostClaudeJsonPath(): string {
	return join(process.cwd(), HOST_CLAUDE_JSON_SUBPATH)
}

const implementResultSchema = z.object({
	success: z.boolean(),
	summary: z.string(),
	blockers: z.string().nullable(),
	notes: z.string().nullable().optional(),
})

const reviewResultSchema = z.object({
	verdict: z.enum(['clean', 'issues_found']),
	findings: z.string(),
	summary: z.string(),
})

export const resultSchema = z.object({
	success: z.boolean(),
	summary: z.string(),
	blockers: z.string().nullable(),
	reviewReport: z.string().nullable(),
	notes: z.string().nullable(),
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
	/** The epic's notes file content (see implement-epic § "Epic notes"); empty for a standalone issue. */
	epicNotes: string
}

export interface SandcastleRunConfig {
	/** Project-specific typecheck/test command passed into the implement prompt. */
	checkCommand?: string
	/** Override the implement prompt file path (absolute). Defaults to .sandcastle/implement-prompt.md. */
	implementPromptFile?: string
	/** Override the review prompt file path (absolute). Defaults to .sandcastle/review-prompt.md. */
	reviewPromptFile?: string
}

const BASE_BRANCH_FILE = '.sandcastle/base-branch.txt'

export function readFixedPoint(): string {
	try {
		return readFileSync(BASE_BRANCH_FILE, 'utf8').trim()
	} catch {
		throw new Error(
			`Expected ${BASE_BRANCH_FILE} to exist — implement-epic writes it right before invoking sandbox_command.`,
		)
	}
}

// implement-epic keeps one notes file per epic on the host, gitignored, so it
// never reaches the sandbox worktree on its own. The fixed point names the
// epic (origin/epic/<N>-<slug>); a standalone issue's fixed point is trunk and
// has no notes.
export function readEpicNotes(fixedPoint: string): string {
	const epicNumber = /(?:^|\/)epic\/(\d+)-/.exec(fixedPoint)?.[1]
	if (!epicNumber) return ''
	const notesPath = join(process.cwd(), '.epic-notes', `${epicNumber}.md`)
	return existsSync(notesPath) ? readFileSync(notesPath, 'utf8').trim() : ''
}

// Fresh docker() sandbox config per call — buildImplementRunOptions() and
// buildReviewRunOptions() each get their own, rather than sharing one
// object, in case sandcastle mutates it internally.
function buildDockerSandbox() {
	const hostNodeModulesCache = join(process.cwd(), CONTAINER_NODE_MODULES_CACHE_SUBPATH)
	// Share the host pnpm content-addressable store so warm-cache installs
	// are a no-op. dirname strips the version segment pnpm appends.
	const hostPnpmStore = dirname(execSync('pnpm store path', { encoding: 'utf8' }).trim())
	const hostClaudeJson = hostClaudeJsonPath()
	return docker({
		mounts: [
			{ hostPath: hostNodeModulesCache, sandboxPath: 'node_modules' },
			{ hostPath: hostPnpmStore, sandboxPath: CONTAINER_PNPM_STORE },
			// Without this, Claude Code refuses to honor .claude/settings.json
			// permissions.allow in a workspace it hasn't seen an interactive
			// trust dialog for — see .sandcastle/README.md.
			{ hostPath: hostClaudeJson, sandboxPath: CONTAINER_CLAUDE_JSON },
		],
		env: {
			npm_config_store_dir: CONTAINER_PNPM_STORE,
		},
	})
}

const installHook = {
	onSandboxReady: [
		{ command: 'CI=true pnpm install --frozen-lockfile', timeoutMs: SANDBOX_READY_TIMEOUT_MS },
	],
}

// No explicit return-type annotation: run()'s overload resolution depends on
// the literal `output` type surviving inference.
export function buildImplementRunOptions(input: SandcastleIssueInput, config: SandcastleRunConfig = {}) {
	return {
		name: 'implement',
		sandbox: buildDockerSandbox(),
		agent: claudeCode('claude-sonnet-5'),
		promptFile: config.implementPromptFile ?? join(TEMPLATES_DIR, 'implement-prompt.md'),
		promptArgs: {
			ISSUE_NUMBER: input.issueNumber,
			ISSUE_TITLE: input.issueTitle,
			ISSUE_BODY: input.issueBody,
			FIXED_POINT: input.fixedPoint,
			EPIC_NOTES: input.epicNotes || 'None yet.',
			CHECK_COMMAND: config.checkCommand ?? 'echo "no check command configured"',
		},
		maxIterations: MAX_ITERATIONS,
		output: Output.object({ tag: 'result', schema: implementResultSchema, maxRetries: 1 }),
		branchStrategy: { type: 'merge-to-head' as const },
		idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
		hooks: { sandbox: installHook },
	}
}

export function buildReviewRunOptions(input: SandcastleIssueInput, config: SandcastleRunConfig = {}) {
	return {
		name: 'review',
		sandbox: buildDockerSandbox(),
		agent: claudeCode('claude-sonnet-5'),
		promptFile: config.reviewPromptFile ?? join(TEMPLATES_DIR, 'review-prompt.md'),
		promptArgs: {
			ISSUE_NUMBER: input.issueNumber,
			ISSUE_TITLE: input.issueTitle,
			ISSUE_BODY: input.issueBody,
			FIXED_POINT: input.fixedPoint,
		},
		maxIterations: MAX_ITERATIONS,
		output: Output.object({ tag: 'result', schema: reviewResultSchema, maxRetries: 1 }),
		branchStrategy: { type: 'merge-to-head' as const },
		idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
		hooks: { sandbox: installHook },
	}
}

export function assertOnIssueBranch(issueNumber: string): string {
	const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
	const expectedPrefix = `feat/${issueNumber}-`
	if (!currentBranch.startsWith(expectedPrefix)) {
		throw new Error(
			`Expected the host repo to be checked out on a "${expectedPrefix}*" branch for issue #${issueNumber}, but found "${currentBranch}".`,
		)
	}
	return currentBranch
}

export function fetchIssue(issueNumber: string): { issueTitle: string; issueBody: string } {
	const raw = execFileSync('gh', ['issue', 'view', issueNumber, '--json', 'title,body'], {
		encoding: 'utf8',
	})
	const issue = issueSchema.parse(JSON.parse(raw))
	return { issueTitle: issue.title, issueBody: issue.body ?? '' }
}

export function buildIssueBody(issueBody: string, repairContextPath?: string): string {
	if (!repairContextPath) return issueBody
	const report = readFileSync(repairContextPath, 'utf8').trim()
	return `${issueBody}

## Previous attempt

A previous run on this branch did not clear a gate. Its working tree is still in
place — continue from it rather than starting over.

${report}`
}

function ensureContainerCacheDirs() {
	mkdirSync(join(process.cwd(), CONTAINER_NODE_MODULES_CACHE_SUBPATH), { recursive: true })
}

// A bind-mount source path that doesn't exist on the host gets created by
// Docker as an empty directory, not a file — silently breaking the trust
// mount rather than erroring. Seed a minimal file if one isn't already
// there (e.g. a project that installed sandcastle before this mount existed
// and hasn't re-run the scaffold). Never overwrite an existing file: after
// the first sandboxed run it holds Claude Code's own feature-flag cache
// data, which must survive.
function ensureClaudeJsonSeed() {
	const hostClaudeJson = hostClaudeJsonPath()
	if (existsSync(hostClaudeJson)) return
	writeFileSync(
		hostClaudeJson,
		JSON.stringify({ projects: { '/home/agent/workspace': { hasTrustDialogAccepted: true } } }, null, 2) + '\n',
	)
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

// --- Crashed-run recovery --------------------------------------------------
//
// A crashed run (an idle timeout, a container error) leaves its worktree and
// `sandcastle/*` branch behind, with the agent's partial work in them. After
// each run the worktrees that did not exist before it are saved as a patch
// against the host HEAD, then removed. Worktrees from other runs are left
// alone. A failure here only warns.

interface SandcastleWorktree {
	path: string
	branch: string | undefined
}

const runGit = (args: string[], cwd?: string) =>
	execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

function listSandcastleWorktrees(): SandcastleWorktree[] {
	const root = join(process.cwd(), WORKTREES_SUBPATH) + sep
	return runGit(['worktree', 'list', '--porcelain'])
		.split('\n\n')
		.map((block) => ({
			path: /^worktree (.+)$/m.exec(block)?.[1],
			branch: /^branch refs\/heads\/(.+)$/m.exec(block)?.[1],
		}))
		.filter((worktree): worktree is SandcastleWorktree => worktree.path?.startsWith(root) ?? false)
}

function snapshotWorktrees(): Set<string> | undefined {
	try {
		return new Set(listSandcastleWorktrees().map((worktree) => worktree.path))
	} catch {
		return undefined
	}
}

function cleanUpNewWorktrees(issueNumber: string, known: Set<string> | undefined) {
	if (!known) return
	try {
		const hostHead = runGit(['rev-parse', 'HEAD']).trim()
		for (const worktree of listSandcastleWorktrees()) {
			if (known.has(worktree.path)) continue
			try {
				runGit(['add', '-A'], worktree.path)
				const patch = runGit(['diff', '--cached', '--binary', hostHead], worktree.path)
				if (patch.trim()) {
					const patchPath = join(process.cwd(), PRESERVED_PATCHES_SUBPATH, `${issueNumber}-${basename(worktree.path)}.patch`)
					mkdirSync(dirname(patchPath), { recursive: true })
					writeFileSync(patchPath, patch)
					console.error(
						`Saved the work left in ${worktree.path} to ${patchPath}. Apply it with: git apply ${patchPath}`,
					)
				}
				runGit(['worktree', 'remove', '--force', worktree.path])
				if (worktree.branch?.startsWith('sandcastle/')) {
					runGit(['branch', '-D', worktree.branch])
				}
			} catch (error) {
				console.error(
					`Could not clean up ${worktree.path}: ${errorMessage(error)}. Remove it with: git worktree remove --force ${worktree.path}`,
				)
			}
		}
	} catch (error) {
		console.error(`Could not list the sandcastle worktrees: ${errorMessage(error)}`)
	}
}

// --- Per-pass timing -------------------------------------------------------
//
// Each pass writes `<log>.timing.json` next to its agent log: tool time,
// sub-agent time and model time, plus the counters the efficiency rules care
// about. See .sandcastle/README.md for the fields.

// Claude Code names its sub-agent tool "Agent" (older versions: "Task").
const SUBAGENT_TOOLS = new Set(['Agent', 'Task'])

// A Bash call that does nothing but wait: `true`, `:`, `sleep 5`, `echo waiting`.
// An echo with a redirect, pipe or expansion does real work and does not match.
const HEARTBEAT_COMMAND = /^(true|:|sleep\s+[\d.]+|echo\b[^|;&<>$`]*)$/

type PassName = 'implement' | 'review'

export interface TimingSummary {
	name: PassName
	wallSeconds: number
	/** Top-level tool calls other than sub-agents, overlapping calls counted once. */
	toolSeconds: number
	/** Top-level sub-agent runs, overlapping runs counted once. */
	subagentSeconds: number
	/** Everything else: the parent's own model turns and API latency. */
	modelSeconds: number
	/**
	 * Part of the model time: from the last top-level tool result to the
	 * parent's next model output, summed over the pass. `null` when the stream
	 * had no tool result lines to measure from.
	 */
	toolResultToModelSeconds: number | null
	toolCalls: number
	subagentSpawns: number
	/** Top-level Bash calls issued after the first sub-agent spawn. */
	bashCallsAfterSubagentSpawn: number
	/** Of those, calls that only wait (`true`, `sleep`, `echo`). */
	heartbeatBashCalls: number
	/** Context size (input + cache tokens) of the last top-level model turn. */
	finalContextTokens: number | null
	/**
	 * How a tool call's end was measured. `tool_result`: the timestamp of the
	 * tool result line the agent streamed back. `next-event-gap`: no tool result
	 * line was seen in the whole run, so each call ends at the next raw stream
	 * line after it. `null`: the pass made no top-level tool calls.
	 */
	toolEndSource: 'tool_result' | 'next-event-gap' | null
	/** Why the tool and model split is missing or rough; `null` when it is measured. */
	caveat: string | null
}

interface ToolCall {
	name: string
	start: number
	end?: number
	gapEnd?: number
	/** Last stream line a sub-agent's own turns produced. A background sub-agent's result returns at once while it keeps running. */
	lastChildAt?: number
	topLevel: boolean
	isSubagent: boolean
	afterSubagentSpawn: boolean
	command: string | undefined
}

type Interval = readonly [number, number]

function unionMs(intervals: Interval[]): number {
	const sorted = [...intervals].sort((a, b) => a[0] - b[0])
	let total = 0
	let cursorEnd = -Infinity
	for (const [start, end] of sorted) {
		total += Math.max(0, end - Math.max(start, cursorEnd))
		cursorEnd = Math.max(cursorEnd, end)
	}
	return total
}

const toSeconds = (ms: number) => Math.round(ms) / 1000

const contentBlockSchema = z.object({
	type: z.string(),
	id: z.string().optional(),
	name: z.string().optional(),
	input: z.object({ command: z.string().optional() }).optional(),
	tool_use_id: z.string().optional(),
})

// One stream-json line from the Claude CLI. A user message whose content is a
// plain string, or any other line shape, fails the parse and is skipped.
const streamLineSchema = z.object({
	type: z.string(),
	parent_tool_use_id: z.string().nullish(),
	message: z.object({
		content: z.array(contentBlockSchema),
		usage: z
			.object({
				input_tokens: z.number().default(0),
				cache_creation_input_tokens: z.number().default(0),
				cache_read_input_tokens: z.number().default(0),
			})
			.optional(),
	}),
})

// Consumes the agent's stream-json lines as sandcastle forwards them. `raw`
// events carry every stdout line verbatim with a host-side timestamp, so a
// `tool_use` block and its `tool_result` are timed from the two lines.
export class TimingRecorder {
	private readonly calls = new Map<string, ToolCall>()
	private readonly openForGap: ToolCall[] = []
	private firstEvent: number | undefined
	private lastEvent: number | undefined
	private spawned = false
	private sawToolResult = false
	private finalContextTokens: number | null = null
	private lastToolResultAt: number | undefined
	private toolResultToModelMs = 0

	constructor(private readonly name: PassName) {}

	record(event: AgentStreamEvent): void {
		const at = event.timestamp.getTime()
		this.firstEvent ??= at
		this.lastEvent = at
		if (event.type !== 'raw') return
		for (const call of this.openForGap.splice(0)) {
			if (at > call.start) call.gapEnd = at
			else this.openForGap.push(call)
		}
		this.recordRawLine(event.line, at)
	}

	private recordRawLine(line: string, at: number): void {
		if (!line.startsWith('{')) return
		let json: unknown
		try {
			json = JSON.parse(line)
		} catch {
			return
		}
		const parsed = streamLineSchema.safeParse(json)
		if (!parsed.success) return
		const { type, message } = parsed.data
		const parentId = parsed.data.parent_tool_use_id
		const topLevel = parentId == null
		if (parentId) {
			const parent = this.calls.get(parentId)
			if (parent) parent.lastChildAt = at
		}

		if (type === 'assistant') {
			const { usage } = message
			if (topLevel && this.lastToolResultAt !== undefined) {
				this.toolResultToModelMs += at - this.lastToolResultAt
				this.lastToolResultAt = undefined
			}
			if (topLevel && usage) {
				const tokens = usage.input_tokens + usage.cache_creation_input_tokens + usage.cache_read_input_tokens
				if (tokens > 0) this.finalContextTokens = tokens
			}
			for (const block of message.content) {
				if (block.type !== 'tool_use' || block.name === undefined || block.id === undefined) continue
				const isSubagent = SUBAGENT_TOOLS.has(block.name)
				const call: ToolCall = {
					name: block.name,
					start: at,
					topLevel,
					isSubagent,
					afterSubagentSpawn: topLevel && this.spawned,
					command: block.input?.command?.trim(),
				}
				this.calls.set(block.id, call)
				this.openForGap.push(call)
				if (topLevel && isSubagent) this.spawned = true
			}
		} else if (type === 'user') {
			for (const block of message.content) {
				if (block.type !== 'tool_result' || block.tool_use_id === undefined) continue
				const call = this.calls.get(block.tool_use_id)
				if (call && call.end === undefined) {
					call.end = at
					this.sawToolResult = true
					if (topLevel) this.lastToolResultAt = at
				}
			}
		}
	}

	summary(): TimingSummary {
		const first = this.firstEvent ?? 0
		const last = this.lastEvent ?? first
		const wallMs = last - first
		const topLevel = [...this.calls.values()].filter((call) => call.topLevel)
		const toolEndSource = topLevel.length === 0 ? null : this.sawToolResult ? 'tool_result' : 'next-event-gap'

		const interval = (call: ToolCall): Interval => {
			const end = (toolEndSource === 'tool_result' ? call.end : call.gapEnd) ?? last
			return [call.start, Math.max(end, call.lastChildAt ?? end)]
		}
		const subagents = topLevel.filter((call) => call.isSubagent)
		const tools = topLevel.filter((call) => !call.isSubagent)
		const busyMs = unionMs(topLevel.map(interval))

		const bashAfterSpawn = topLevel.filter((call) => call.name === 'Bash' && call.afterSubagentSpawn)

		let caveat: string | null = null
		if (this.firstEvent === undefined) {
			caveat =
				'No agent stream events arrived: the pass ended before the agent produced output, so nothing could be timed.'
		} else if (toolEndSource === 'next-event-gap') {
			caveat =
				'No tool_result lines in the stream: each tool call ends at the next stream line, so tool time includes model latency and the tool-result-to-model time is unknown.'
		}

		return {
			name: this.name,
			wallSeconds: toSeconds(wallMs),
			toolSeconds: toSeconds(unionMs(tools.map(interval))),
			subagentSeconds: toSeconds(unionMs(subagents.map(interval))),
			modelSeconds: toSeconds(wallMs - busyMs),
			toolResultToModelSeconds: toolEndSource === 'tool_result' ? toSeconds(this.toolResultToModelMs) : null,
			toolCalls: topLevel.length,
			subagentSpawns: subagents.length,
			bashCallsAfterSubagentSpawn: bashAfterSpawn.length,
			heartbeatBashCalls: bashAfterSpawn.filter(
				(call) => call.command !== undefined && HEARTBEAT_COMMAND.test(call.command),
			).length,
			finalContextTokens: this.finalContextTokens,
			toolEndSource,
			caveat,
		}
	}
}

export function formatTimingLine(summary: TimingSummary): string {
	const minutes = (seconds: number | null) => (seconds === null ? 'n/a' : (seconds / 60).toFixed(1))
	const context = summary.finalContextTokens === null ? 'n/a' : `${Math.ceil(summary.finalContextTokens / 1000)}k`
	return (
		`[${summary.name}] ${minutes(summary.wallSeconds)} min: ` +
		`tools ${minutes(summary.toolSeconds)}, sub-agents ${minutes(summary.subagentSeconds)}, ` +
		`model ${minutes(summary.modelSeconds)} (tool result to model ${minutes(summary.toolResultToModelSeconds)}); ` +
		`${summary.toolCalls} tool calls, ` +
		`${summary.bashCallsAfterSubagentSpawn} Bash after spawn ` +
		`(${summary.heartbeatBashCalls} heartbeats), context ${context}, tool end: ${summary.toolEndSource ?? 'n/a'}` +
		(summary.caveat === null ? '' : `. ${summary.caveat}`)
	)
}

// Runs one agent pass with an explicit log file so the stream can be timed.
// The log is named like sandcastle's default, host branch then pass name, and
// the timing summary lands next to it as `<log>.timing.json`. Timing is
// diagnostics only: a failure to write it warns on stderr (stdout stays one
// JSON line) and never changes the run's outcome.
async function withRunLog<T>(
	branch: string,
	name: PassName,
	runWith: (logging: LoggingOption) => Promise<T>,
): Promise<T> {
	const stamp = new Date().toISOString().replace(/\.\d+Z$/, '').replace(/[-:]/g, '').replace('T', '-')
	const logPath = join(process.cwd(), LOGS_SUBPATH, `${branch.replaceAll('/', '-')}-${name}-${stamp}.log`)
	const recorder = new TimingRecorder(name)
	try {
		return await runWith({
			type: 'file',
			path: logPath,
			onAgentStreamEvent: (event) => recorder.record(event),
		})
	} finally {
		try {
			const summary = recorder.summary()
			const timingPath = logPath.replace(/\.log$/, '.timing.json')
			mkdirSync(dirname(timingPath), { recursive: true })
			writeFileSync(timingPath, `${JSON.stringify(summary, null, 2)}\n`)
			console.error(formatTimingLine(summary))
		} catch (error) {
			console.error(`Could not write the ${name} timing summary: ${errorMessage(error)}`)
		}
	}
}

// Two sequential run() calls, deliberately not one call whose prompt does
// both jobs and not a resumed session for the second: the implementer
// already runs /code-review on itself, and self-review's blind spots are
// exactly the ones a second pass in the same context would share. A fresh
// session sees only the diff and the issue — a real second opinion.
//
// Each call uses branchStrategy: 'merge-to-head' — a real, isolated git
// worktree per call (never a bind-mount of the host's own checkout), whose
// commits are merged back onto whatever's checked out at hostRepoDir
// (assertOnIssueBranch() guarantees that's the issue's feat/<N>-* branch)
// as soon as the call returns. That's what lets the review call, running
// after the implement call has already returned, see the implementer's
// commit: it isn't reading the implementer's now-torn-down worktree, it's
// forking a fresh worktree from the host branch the merge just landed on.
// The implementer commits, the reviewer never does — merge-to-head's
// merge-back is a no-op on the review call.
//
// `success` is only ever `true` once the independent review comes back clean.
export async function runSandcastle(input: SandcastleIssueInput, config: SandcastleRunConfig = {}) {
	const branch = assertOnIssueBranch(input.issueNumber)
	ensureContainerCacheDirs()
	ensureClaudeJsonSeed()
	const knownWorktrees = snapshotWorktrees()

	try {
		return await runPasses(input, config, branch)
	} finally {
		cleanUpNewWorktrees(input.issueNumber, knownWorktrees)
	}
}

async function runPasses(input: SandcastleIssueInput, config: SandcastleRunConfig, branch: string) {
	const { output: implementOutput } = await withRunLog(branch, 'implement', (logging) =>
		run({ ...buildImplementRunOptions(input, config), logging }),
	)
	if (!implementOutput.success) {
		return { ...implementOutput, reviewReport: null, notes: implementOutput.notes ?? null }
	}

	const { output: reviewOutput } = await withRunLog(branch, 'review', (logging) =>
		run({ ...buildReviewRunOptions(input, config), logging }),
	)
	if (reviewOutput.verdict === 'clean') {
		return {
			success: true,
			summary: implementOutput.summary,
			blockers: null,
			reviewReport: reviewOutput.summary,
			notes: implementOutput.notes ?? null,
		}
	}

	return {
		success: false,
		summary: implementOutput.summary,
		blockers: `Independent review found issues after the implementation was committed:\n\n${reviewOutput.findings}`,
		reviewReport: reviewOutput.findings,
		notes: implementOutput.notes ?? null,
	}
}

export interface SandcastleCliArgs {
	issueNumber: string
	repairContextPath?: string
}

export async function runSandcastleForIssue(args: SandcastleCliArgs, config: SandcastleRunConfig = {}) {
	assertOnIssueBranch(args.issueNumber)
	const { issueTitle, issueBody } = fetchIssue(args.issueNumber)
	const fixedPoint = readFixedPoint()
	return runSandcastle(
		{
			issueNumber: args.issueNumber,
			issueTitle,
			fixedPoint,
			epicNotes: readEpicNotes(fixedPoint),
			issueBody: buildIssueBody(issueBody, args.repairContextPath),
		},
		config,
	)
}

export function parseArgs(argv: string[]): SandcastleCliArgs {
	const usage = 'Usage: pnpm tsx scripts/run-sandcastle.ts <issueNumber> [--repair-context <path>]'
	const [issueNumber, ...rest] = argv

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

const output = await runSandcastleForIssue(parseArgs(process.argv.slice(2)), {
	checkCommand: 'REPLACE_WITH_CHECK_COMMAND',
})
console.log(JSON.stringify(output))
