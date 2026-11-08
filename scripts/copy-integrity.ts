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
	realpathSync,
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
const QUOTE_RE = /^\s*>+\s?(.*)$/
const TABLE_ROW_RE = /^\s*\|/
const TABLE_SEPARATOR_RE = /^\s*\|[\s:|-]*-[\s:|-]*$/
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

type Region =
	| { kind: 'heading'; level: number }
	| { kind: 'list' }
	| { kind: 'table' }
	| null

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
	let paragraphQuoted = false
	let currentListItem: { lines: string[]; editorial: boolean } | null = null
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

	// A list item's text can wrap onto following lines before the next
	// blank line or bullet — those continuation lines belong to the item
	// that's still open, not to a new paragraph block.
	const flushListItem = (): void => {
		if (!currentListItem) return
		blocks.push({
			page,
			kind: 'listItem',
			text: normalize(currentListItem.lines.join(' ')),
			editorial: currentListItem.editorial,
		})
		currentListItem = null
	}

	// Leaving list or table territory for a different kind of block: flush
	// whatever item was still open and, since a run of list items or table
	// rows ends there too, drop the marked run's region (a heading region
	// spans blank lines on purpose, so it isn't touched here).
	const endRun = (): void => {
		flushListItem()
		if (region?.kind === 'list' || region?.kind === 'table') region = null
	}

	for (let line of lines) {
		if (inCodeFence) {
			if (CODE_FENCE_RE.test(line)) inCodeFence = false
			continue
		}
		if (inGenericComment) {
			const commentEnd = line.indexOf('*/}')
			if (commentEnd === -1) continue
			inGenericComment = false
			line = line.slice(commentEnd + 3)
			if (line.trim() === '') continue
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
			endRun()
			pendingMarker = false
			inCodeFence = true
			continue
		}

		// The marker applies only to the block directly below it, with no
		// blank or intervening line — any other line wastes a pending marker
		// rather than letting it drift onto a later block.
		if (line.trim() === '') {
			flushParagraph()
			endRun()
			pendingMarker = false
			continue
		}
		if (MARKER_RE.test(line)) {
			flushParagraph()
			endRun()
			pendingMarker = true
			continue
		}
		// A generic `{/* ... */}` JSX comment (anything other than the exact
		// editorial marker) is dead/invisible content, never rendered. Strip
		// just the comment and keep processing whatever prose shares the
		// line with it — only drop the line outright when nothing but the
		// comment was on it.
		if (line.includes('{/*')) {
			const commentStart = line.indexOf('{/*')
			const commentEnd = line.indexOf('*/}', commentStart)
			const rest =
				commentEnd === -1
					? line.slice(0, commentStart)
					: line.slice(0, commentStart) + line.slice(commentEnd + 3)
			if (commentEnd === -1) inGenericComment = true
			if (rest.trim() === '') {
				flushParagraph()
				endRun()
				pendingMarker = false
				continue
			}
			line = rest
		}
		if (IMPORT_EXPORT_RE.test(line)) {
			flushParagraph()
			endRun()
			pendingMarker = false
			continue
		}
		if (JSX_LINE_RE.test(line)) {
			flushParagraph()
			endRun()
			pendingMarker = false
			// A JSX tag whose closing `>` isn't on this line (attributes or
			// `/>` spilling onto their own lines) is still markup, not prose —
			// keep skipping through its close.
			if (!line.includes('>')) inOpenJsxTag = true
			continue
		}

		// A blockquote's `>` markers are Markdown syntax, not copy: strip them
		// so the same words stay protected if the quote is restyled. A quote
		// and the prose around it are separate paragraphs.
		const quote = QUOTE_RE.exec(line)
		const quoted = quote !== null
		if (quote) line = quote[1]
		if (paragraphLines.length > 0 && quoted !== paragraphQuoted) {
			flushParagraph()
		}
		if (quoted && currentListItem) endRun()
		if (quoted && line.trim() === '') {
			flushParagraph()
			continue
		}

		// A table row: every non-empty cell is its own protected text block
		// (kind `paragraph`, so restyling the table as a list or cards keeps
		// the words protected). The `|---|` separator row is syntax only.
		if (TABLE_ROW_RE.test(line)) {
			flushParagraph()
			flushListItem()
			if (TABLE_SEPARATOR_RE.test(line)) continue
			let editorial: boolean
			if (pendingMarker) {
				editorial = true
				region = { kind: 'table' }
			} else {
				editorial = region !== null
			}
			pendingMarker = false
			const cells = line
				.trim()
				.replace(/^\|/, '')
				.replace(/\|$/, '')
				.split(/(?<!\\)\|/)
			for (const cell of cells) {
				const text = normalize(cell)
				if (text) blocks.push({ page, kind: 'paragraph', text, editorial })
			}
			continue
		}

		const heading = HEADING_RE.exec(line)
		if (heading) {
			flushParagraph()
			endRun()
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
			flushListItem()
			let editorial: boolean
			if (pendingMarker) {
				editorial = true
				region = { kind: 'list' }
			} else {
				editorial = region?.kind === 'heading' || region?.kind === 'list'
			}
			pendingMarker = false
			currentListItem = { lines: [listItem[1]], editorial }
			continue
		}

		if (currentListItem) {
			currentListItem.lines.push(line.trim())
			continue
		}

		if (paragraphLines.length === 0) {
			paragraphEditorial = pendingMarker || region?.kind === 'heading'
			paragraphQuoted = quoted
			pendingMarker = false
		}
		paragraphLines.push(line.trim())
	}
	flushParagraph()
	flushListItem()

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
	// Matching is keyed on kind as well as text, so e.g. a heading that now
	// reads the same as a since-deleted paragraph doesn't mask the loss.
	const matchKey = (kind: BlockKind, text: string): string =>
		`${kind}\u0000${text}`

	// Only non-editorial text can satisfy a baseline entry: otherwise editing
	// an unrelated editorial block to coincidentally match a deleted
	// protected block's text would mask the deletion. Counts, not just
	// presence, matter too: the same wording can legitimately repeat across
	// pages, and losing all but one copy is still a real loss.
	const currentTextCounts = new Map<string, number>()
	for (const block of extractBlocks(root)) {
		if (block.editorial) continue
		const key = matchKey(block.kind, block.text)
		currentTextCounts.set(key, (currentTextCounts.get(key) ?? 0) + 1)
	}

	const violations: CopyIntegrityViolation[] = []
	for (const entry of baseline) {
		const key = matchKey(entry.kind, entry.text)
		const remaining = currentTextCounts.get(key) ?? 0
		if (remaining > 0) {
			currentTextCounts.set(key, remaining - 1)
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

// Compare real paths: when the script is reached through a symlink (macOS
// `/var` -> `/private/var`), `argv[1]` keeps the link while `import.meta.url`
// is resolved, and a plain string comparison would silently skip the check.
const isMain =
	process.argv[1] !== undefined &&
	realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)

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
