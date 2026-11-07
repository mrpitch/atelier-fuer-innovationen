#!/usr/bin/env -S npx tsx
/**
 * copy-integrity: prove that no hand-written Xeniapolis copy changed, no
 * matter where it now lives. Every protected text block (page title,
 * heading, paragraph, list item) extracted from the current content tree is
 * checked against a baseline recorded earlier: the check passes as long as
 * each baseline block's text still exists verbatim *somewhere* among the
 * tree's current protected (non-editorial) blocks, regardless of page,
 * position or order. A block marked editorial with `{/* editorial *\/}` (see
 * docs/reference/glossary.md) is never added to the baseline and never
 * counts as a match, so changing or moving it never fails the check, and
 * editing it can never mask the deletion of real protected copy.
 *
 * Usage:
 *   npx tsx scripts/copy-integrity.ts [root]              # check (default)
 *   npx tsx scripts/copy-integrity.ts --generate [root]    # (re)write the baseline
 *
 * Exits 0 if the tree matches the baseline, 1 otherwise (with a report on stderr).
 */

import {
	existsSync,
	readFileSync,
	readdirSync,
	statSync,
	writeFileSync,
} from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { argv, exit, stderr, stdout } from 'node:process'
import { fileURLToPath } from 'node:url'

export type BlockKind = 'title' | 'heading' | 'paragraph' | 'listItem'

export interface Block {
	page: string
	kind: BlockKind
	text: string
	editorial: boolean
}

export interface BaselineEntry {
	page: string
	kind: BlockKind
	text: string
}

export interface CopyIntegrityViolation {
	page: string
	kind: BlockKind
	reason: string
}

const CONTENT_ROOT = 'src/content/docs/xeniapolis'
const BASELINE_PATH = join(
	dirname(fileURLToPath(import.meta.url)),
	'copy-integrity-baseline.json'
)

const MARKER_RE = /^\s*\{\/\*\s*editorial\s*\*\/\}\s*$/
const HEADING_RE = /^(#{1,6})\s+(.*)$/
const LIST_ITEM_RE = /^\s*(?:[-*]|\d+\.)\s+(.*)$/
const JSX_LINE_RE = /^\s*<\/?[A-Za-z]/
const CODE_FENCE_RE = /^\s*```/
const IMPORT_EXPORT_RE = /^\s*(import|export)\s/

const toPosix = (p: string): string => p.split(sep).join('/')

const normalize = (text: string): string => text.replace(/\s+/g, ' ').trim()

function extractFrontmatterTitle(content: string): {
	title: string
	bodyStart: number
} {
	if (!content.startsWith('---')) return { title: '', bodyStart: 0 }
	const end = content.indexOf('\n---', 3)
	if (end === -1) return { title: '', bodyStart: 0 }
	const block = content.slice(4, end)
	let title = ''
	for (const line of block.split('\n')) {
		const colon = line.indexOf(':')
		if (colon === -1) continue
		if (line.slice(0, colon).trim() !== 'title') continue
		title = line
			.slice(colon + 1)
			.trim()
			.replace(/^['"]|['"]$/g, '')
	}
	const bodyStart = content.indexOf('\n', end + 1)
	return { title, bodyStart: bodyStart === -1 ? content.length : bodyStart + 1 }
}

type Region = { kind: 'heading'; level: number } | { kind: 'list' } | null

function extractFileBlocks(content: string, page: string): Block[] {
	const blocks: Block[] = []
	const { title, bodyStart } = extractFrontmatterTitle(content)
	if (title)
		blocks.push({
			page,
			kind: 'title',
			text: normalize(title),
			editorial: false,
		})

	const lines = content.slice(bodyStart).split('\n')

	let region: Region = null
	let pendingMarker = false
	let paragraphLines: string[] = []
	let paragraphEditorial = false
	let inGenericComment = false
	let inOpenJsxTag = false
	let inCodeFence = false

	const flushParagraph = (): void => {
		if (paragraphLines.length === 0) return
		blocks.push({
			page,
			kind: 'paragraph',
			text: normalize(paragraphLines.join(' ')),
			editorial: paragraphEditorial,
		})
		paragraphLines = []
		paragraphEditorial = false
	}

	for (const line of lines) {
		if (inCodeFence) {
			if (CODE_FENCE_RE.test(line)) inCodeFence = false
			continue
		}
		if (inGenericComment) {
			if (line.includes('*/}')) inGenericComment = false
			continue
		}
		if (inOpenJsxTag) {
			if (line.includes('>')) inOpenJsxTag = false
			continue
		}
		// A fenced code block's contents are a literal sample, not prose —
		// skip the whole fence (its content may look like a heading, list
		// item or JSX line, but isn't one).
		if (CODE_FENCE_RE.test(line)) {
			flushParagraph()
			pendingMarker = false
			inCodeFence = true
			continue
		}

		// A blank line ends a marked run of list items, same as any other
		// block boundary: two lists separated by a blank line are two runs,
		// and a marker never carries across one.
		if (region?.kind === 'list' && !LIST_ITEM_RE.test(line)) region = null

		// The marker applies only to the block directly below it, with no
		// blank or intervening line — any other line wastes a pending marker
		// rather than letting it drift onto a later block.
		if (line.trim() === '') {
			flushParagraph()
			pendingMarker = false
			continue
		}
		if (MARKER_RE.test(line)) {
			flushParagraph()
			pendingMarker = true
			continue
		}
		// A generic `{/* ... */}` JSX comment (anything other than the exact
		// editorial marker) is dead/invisible content, never rendered — skip
		// it (and everything up to its closing `*/}`) rather than treating it
		// as prose.
		if (line.includes('{/*')) {
			flushParagraph()
			pendingMarker = false
			if (!line.includes('*/}')) inGenericComment = true
			continue
		}
		if (IMPORT_EXPORT_RE.test(line)) {
			flushParagraph()
			pendingMarker = false
			continue
		}
		if (JSX_LINE_RE.test(line)) {
			flushParagraph()
			pendingMarker = false
			// A JSX tag whose closing `>` isn't on this line (attributes or
			// `/>` spilling onto their own lines) is still markup, not prose —
			// keep skipping through its close.
			if (!line.includes('>')) inOpenJsxTag = true
			continue
		}

		const heading = HEADING_RE.exec(line)
		if (heading) {
			flushParagraph()
			const level = heading[1].length
			let editorial: boolean
			if (pendingMarker) {
				editorial = true
				region = { kind: 'heading', level }
			} else {
				if (region?.kind === 'heading' && level <= region.level) region = null
				editorial = region?.kind === 'heading'
			}
			pendingMarker = false
			blocks.push({
				page,
				kind: 'heading',
				text: normalize(heading[2]),
				editorial,
			})
			continue
		}

		const listItem = LIST_ITEM_RE.exec(line)
		if (listItem) {
			flushParagraph()
			let editorial: boolean
			if (pendingMarker) {
				editorial = true
				region = { kind: 'list' }
			} else {
				editorial = region?.kind === 'heading' || region?.kind === 'list'
			}
			pendingMarker = false
			blocks.push({
				page,
				kind: 'listItem',
				text: normalize(listItem[1]),
				editorial,
			})
			continue
		}

		if (paragraphLines.length === 0) {
			paragraphEditorial = pendingMarker || region?.kind === 'heading'
			pendingMarker = false
		}
		paragraphLines.push(line.trim())
	}
	flushParagraph()

	return blocks
}

function walk(
	dir: string,
	root: string,
	files: { absPath: string; relPath: string }[]
): void {
	if (!existsSync(dir)) return
	for (const name of readdirSync(dir).sort()) {
		const fullPath = join(dir, name)
		if (statSync(fullPath).isDirectory()) {
			walk(fullPath, root, files)
		} else if (name.endsWith('.mdx')) {
			files.push({
				absPath: fullPath,
				relPath: toPosix(relative(root, fullPath)),
			})
		}
	}
}

export function extractBlocks(root: string): Block[] {
	const files: { absPath: string; relPath: string }[] = []
	walk(join(root, CONTENT_ROOT), root, files)

	const blocks: Block[] = []
	for (const { absPath, relPath } of files) {
		const content = readFileSync(absPath, 'utf-8')
		blocks.push(...extractFileBlocks(content, relPath))
	}
	return blocks
}

export function generateBaseline(root: string): BaselineEntry[] {
	return extractBlocks(root)
		.filter((block) => !block.editorial)
		.map(({ page, kind, text }) => ({ page, kind, text }))
}

export function findCopyIntegrityViolations(
	root: string,
	baseline: BaselineEntry[]
): CopyIntegrityViolation[] {
	// Only non-editorial text can satisfy a baseline entry: otherwise editing
	// an unrelated editorial block to coincidentally match a deleted
	// protected block's text would mask the deletion. Counts, not just
	// presence, matter too: the same wording can legitimately repeat across
	// pages, and losing all but one copy is still a real loss.
	const currentTextCounts = new Map<string, number>()
	for (const block of extractBlocks(root)) {
		if (block.editorial) continue
		currentTextCounts.set(
			block.text,
			(currentTextCounts.get(block.text) ?? 0) + 1
		)
	}

	const violations: CopyIntegrityViolation[] = []
	for (const entry of baseline) {
		const remaining = currentTextCounts.get(entry.text) ?? 0
		if (remaining > 0) {
			currentTextCounts.set(entry.text, remaining - 1)
			continue
		}
		violations.push({
			page: entry.page,
			kind: entry.kind,
			reason: `protected ${entry.kind} no longer found verbatim anywhere in the content tree: "${entry.text}"`,
		})
	}

	return violations.sort(
		(a, b) =>
			a.page.localeCompare(b.page) ||
			a.kind.localeCompare(b.kind) ||
			a.reason.localeCompare(b.reason)
	)
}

const isMain =
	process.argv[1] && import.meta.url === `file://${process.argv[1]}`

if (isMain) {
	const generate = argv.includes('--generate')
	const root = argv.slice(2).find((arg) => arg !== '--generate') ?? '.'

	if (generate) {
		const baseline = generateBaseline(root)
		writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, '\t') + '\n')
		stdout.write(
			`Wrote ${baseline.length} protected blocks to scripts/copy-integrity-baseline.json\n`
		)
		exit(0)
	}

	const baseline: BaselineEntry[] = JSON.parse(
		readFileSync(BASELINE_PATH, 'utf-8')
	)
	const violations = findCopyIntegrityViolations(root, baseline)
	if (violations.length === 0) {
		stdout.write('Copy integrity: OK\n')
		exit(0)
	}
	stderr.write(`Copy integrity: ${violations.length} violation(s)\n\n`)
	for (const { page, reason } of violations) {
		stderr.write(`  ${page}: ${reason}\n`)
	}
	exit(1)
}
