import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
	extractBlocks,
	findCopyIntegrityViolations,
	generateBaseline,
	type BaselineEntry,
} from './copy-integrity'

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..')

let root: string
const createdRoots: string[] = []

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'copy-integrity-test-'))
	createdRoots.push(root)
})

after(() => {
	for (const dir of createdRoots) rmSync(dir, { recursive: true, force: true })
})

function write(relPath: string, content: string): void {
	const full = join(root, relPath)
	mkdirSync(join(full, '..'), { recursive: true })
	writeFileSync(full, content)
}

const PAGE = 'src/content/docs/xeniapolis/zukunft/index.mdx'

test('extractBlocks records the page title, headings, paragraphs and list items as protected', () => {
	write(
		PAGE,
		[
			'---',
			'title: Viertel der Zukunft',
			'description: irrelevant',
			'---',
			'',
			'Den Wandel wollen — der Weg ist das Ziel.',
			'',
			'## Ansatz',
			'',
			'Volkswirtschaftlich richtig rechnen!',
			'',
			'- Erster Punkt',
			'- Zweiter Punkt',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map(({ kind, text, editorial }) => ({ kind, text, editorial })),
		[
			{ kind: 'title', text: 'Viertel der Zukunft', editorial: false },
			{
				kind: 'paragraph',
				text: 'Den Wandel wollen — der Weg ist das Ziel.',
				editorial: false,
			},
			{ kind: 'heading', text: 'Ansatz', editorial: false },
			{
				kind: 'paragraph',
				text: 'Volkswirtschaftlich richtig rechnen!',
				editorial: false,
			},
			{ kind: 'listItem', text: 'Erster Punkt', editorial: false },
			{ kind: 'listItem', text: 'Zweiter Punkt', editorial: false },
		]
	)
})

test('extractBlocks normalises only whitespace (wraps, blank runs, trailing space)', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Erste Zeile   ',
			'zweite Zeile eines Absatzes',
			'',
			'',
			'Zweiter Absatz.',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	const paragraphs = blocks.filter((b) => b.kind === 'paragraph')
	assert.deepEqual(
		paragraphs.map((b) => b.text),
		['Erste Zeile zweite Zeile eines Absatzes', 'Zweiter Absatz.']
	)
})

test('extractBlocks skips frontmatter, import/export statements and JSX component lines', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			"import { Illu } from '@/components/illus'",
			'',
			'<Illu slug="modell-zukunft" />',
			'',
			'Geschützter Text.',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map((b) => b.text),
		['Titel', 'Geschützter Text.']
	)
})

test('extractBlocks skips a multi-line {/* ... */} JSX comment block entirely, not as prose', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Davor.',
			'',
			'{/* <Cards>',
			'  <Card title="Verworfener Titel">',
			'    Verworfener Text, der nie gerendert wird.',
			'  </Card>',
			'</Cards> */}',
			'',
			'Danach.',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map((b) => b.text),
		['Titel', 'Davor.', 'Danach.']
	)
})

test('extractBlocks skips a self-closing JSX tag whose attributes span multiple lines, without swallowing later prose', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			"import { Illu } from '@/components/illus'",
			'',
			'Davor.',
			'',
			'<Illu',
			'  slug="modell-zukunft"',
			'/>',
			'',
			'## Danach',
			'',
			'Nachfolgender Text.',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map((b) => b.text),
		['Titel', 'Davor.', 'Danach', 'Nachfolgender Text.']
	)
})

test('extractBlocks treats a fenced code block as a literal sample, not as headings, list items or JSX', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Davor.',
			'',
			'```html',
			'<h1>Titel</h1>',
			'# nicht geschützt',
			'- auch kein Listenpunkt',
			'```',
			'',
			'Danach.',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map((b) => b.text),
		['Titel', 'Davor.', 'Danach.']
	)
})

test('a marker directly above a heading marks the whole section editorial, up to the next heading of the same or shallower depth', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Geschützter Absatz.',
			'',
			'{/* editorial */}',
			'## Weitere Stadtviertel',
			'',
			'Von hier aus erreichen Sie:',
			'',
			'- [Zentrum](/docs/xeniapolis)',
			'',
			'## Nächster Abschnitt',
			'',
			'Wieder geschützt.',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map(({ text, editorial }) => ({ text, editorial })),
		[
			{ text: 'Titel', editorial: false },
			{ text: 'Geschützter Absatz.', editorial: false },
			{ text: 'Weitere Stadtviertel', editorial: true },
			{ text: 'Von hier aus erreichen Sie:', editorial: true },
			{ text: '[Zentrum](/docs/xeniapolis)', editorial: true },
			{ text: 'Nächster Abschnitt', editorial: false },
			{ text: 'Wieder geschützt.', editorial: false },
		]
	)
})

test('a marker directly above a paragraph marks only that one paragraph editorial', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Geschützter Absatz eins.',
			'',
			'{/* editorial */}',
			'Zurück zur Übersicht.',
			'',
			'Geschützter Absatz zwei.',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map(({ text, editorial }) => ({ text, editorial })),
		[
			{ text: 'Titel', editorial: false },
			{ text: 'Geschützter Absatz eins.', editorial: false },
			{ text: 'Zurück zur Übersicht.', editorial: true },
			{ text: 'Geschützter Absatz zwei.', editorial: false },
		]
	)
})

test('a marker separated from its block by a blank line applies to nothing, rather than drifting onto a later block', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'{/* editorial */}',
			'',
			'## Weitere Stadtviertel',
			'',
			'Immer noch geschützt, trotz Marker weiter oben.',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map(({ text, editorial }) => ({ text, editorial })),
		[
			{ text: 'Titel', editorial: false },
			{ text: 'Weitere Stadtviertel', editorial: false },
			{
				text: 'Immer noch geschützt, trotz Marker weiter oben.',
				editorial: false,
			},
		]
	)
})

test('a marker directly above a list marks every item in that run of list items editorial', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'{/* editorial */}',
			'- Editorial eins',
			'- Editorial zwei',
			'',
			'- Geschützt drei',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map(({ text, editorial }) => ({ text, editorial })),
		[
			{ text: 'Titel', editorial: false },
			{ text: 'Editorial eins', editorial: true },
			{ text: 'Editorial zwei', editorial: true },
			{ text: 'Geschützt drei', editorial: false },
		]
	)
})

test('generateBaseline excludes editorial blocks and is deterministic across runs', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Geschützter Absatz.',
			'',
			'{/* editorial */}',
			'## Weitere Stadtviertel',
			'',
			'- [Zentrum](/docs/xeniapolis)',
			'',
		].join('\n')
	)

	const first = generateBaseline(root)
	const second = generateBaseline(root)
	assert.deepEqual(first, second)
	assert.deepEqual(
		first.map((b) => b.text),
		['Titel', 'Geschützter Absatz.']
	)
})

test('a freshly generated baseline checked against the same, unchanged tree has no violations', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Geschützter Absatz.',
			'',
			'## Ansatz',
			'',
			'Noch mehr geschützter Text.',
			'',
		].join('\n')
	)

	const baseline = generateBaseline(root)
	assert.deepEqual(findCopyIntegrityViolations(root, baseline), [])
})

test('editing one word in a protected paragraph fails the check and names the page and block', () => {
	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Geschützter Absatz eins.', ''].join(
			'\n'
		)
	)
	const baseline = generateBaseline(root)

	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Geschützter Absatz zwei.', ''].join(
			'\n'
		)
	)

	const violations = findCopyIntegrityViolations(root, baseline)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].page, PAGE)
	assert.equal(violations[0].kind, 'paragraph')
	assert.match(violations[0].reason, /Geschützter Absatz eins\./)
})

test('moving a protected block verbatim to another page still passes the check', () => {
	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Wandernder Absatz.', ''].join('\n')
	)
	const baseline = generateBaseline(root)

	const otherPage = 'src/content/docs/xeniapolis/annaeherung/index.mdx'
	write(PAGE, ['---', 'title: Titel', '---', ''].join('\n'))
	write(
		otherPage,
		['---', 'title: Annäherung', '---', '', 'Wandernder Absatz.', ''].join('\n')
	)

	assert.deepEqual(findCopyIntegrityViolations(root, baseline), [])
})

test('deleting a protected block fails the check', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Absatz, der bleibt.',
			'',
			'Absatz, der verschwindet.',
			'',
		].join('\n')
	)
	const baseline = generateBaseline(root)

	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Absatz, der bleibt.', ''].join('\n')
	)

	const violations = findCopyIntegrityViolations(root, baseline)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /Absatz, der verschwindet\./)
})

test('an editorial block that comes to coincidentally match deleted protected text does not mask the deletion', () => {
	const otherPage = 'src/content/docs/xeniapolis/annaeherung/index.mdx'
	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Verschwindet gleich.', ''].join('\n')
	)
	write(
		otherPage,
		[
			'---',
			'title: Annäherung',
			'---',
			'',
			'{/* editorial */}',
			'Harmloser Hinweis.',
			'',
		].join('\n')
	)
	const baseline = generateBaseline(root)

	write(PAGE, ['---', 'title: Titel', '---', ''].join('\n'))
	write(
		otherPage,
		[
			'---',
			'title: Annäherung',
			'---',
			'',
			'{/* editorial */}',
			'Verschwindet gleich.',
			'',
		].join('\n')
	)

	const violations = findCopyIntegrityViolations(root, baseline)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /Verschwindet gleich\./)
})

test('deleting all but one copy of a protected block that repeats verbatim on several pages still fails for each lost copy', () => {
	const pageB = 'src/content/docs/xeniapolis/annaeherung/index.mdx'
	const pageC = 'src/content/docs/xeniapolis/kontexte/index.mdx'
	const shared = 'Dieser Satz steht wortgleich auf drei Seiten.'
	for (const [page, title] of [
		[PAGE, 'Titel'],
		[pageB, 'Annäherung'],
		[pageC, 'Kontexte'],
	] as const) {
		write(page, ['---', `title: ${title}`, '---', '', shared, ''].join('\n'))
	}
	const baseline = generateBaseline(root)

	// Only one copy of the shared sentence survives.
	write(PAGE, ['---', 'title: Titel', '---', '', shared, ''].join('\n'))
	write(pageB, ['---', 'title: Annäherung', '---', ''].join('\n'))
	write(pageC, ['---', 'title: Kontexte', '---', ''].join('\n'))

	const violations = findCopyIntegrityViolations(root, baseline)
	assert.equal(violations.length, 2)
	for (const violation of violations)
		assert.match(
			violation.reason,
			/Dieser Satz steht wortgleich auf drei Seiten\./
		)
})

test('changing or moving a marked editorial block never fails the check', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'{/* editorial */}',
			'## Weitere Stadtviertel',
			'',
			'- [Zentrum](/docs/xeniapolis)',
			'',
		].join('\n')
	)
	const baseline = generateBaseline(root)

	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'{/* editorial */}',
			'## Weitere Stadtviertel',
			'',
			'- [Komplett andere Liste](/docs/xeniapolis/annaeherung)',
			'',
		].join('\n')
	)

	assert.deepEqual(findCopyIntegrityViolations(root, baseline), [])
})

test('prose sharing a line with a generic JSX comment is kept, with just the comment stripped', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Geschützter Satz. {/* Hinweis für Redakteure */}',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map((b) => b.text),
		['Titel', 'Geschützter Satz.']
	)
})

test('a table contributes one protected block per non-empty cell, without pipes or the separator row', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'| Kopf A | Kopf B |',
			'|---|---|',
			'| Zelle 1 | |',
			'| | Zelle 4 |',
			'',
		].join('\n')
	)

	assert.deepEqual(
		extractBlocks(root).map((b) => [b.kind, b.text, b.editorial]),
		[
			['title', 'Titel', false],
			['paragraph', 'Kopf A', false],
			['paragraph', 'Kopf B', false],
			['paragraph', 'Zelle 1', false],
			['paragraph', 'Zelle 4', false],
		]
	)
})

test('restyling a table as plain paragraphs keeps its cell text protected', () => {
	write(
		PAGE,
		['---', 'title: Titel', '---', '', '| Zelle A | Zelle B |', ''].join('\n')
	)
	const baseline = generateBaseline(root)

	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Zelle A', '', 'Zelle B', ''].join('\n')
	)
	assert.deepEqual(findCopyIntegrityViolations(root, baseline), [])

	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Zelle A', '', 'Zelle C', ''].join('\n')
	)
	assert.equal(findCopyIntegrityViolations(root, baseline).length, 1)
})

test('a marker directly above a table marks every cell of that table editorial', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'{/* editorial */}',
			'| Hinweis A | Hinweis B |',
			'|---|---|',
			'| Hinweis C | Hinweis D |',
			'',
			'Geschützt.',
			'',
		].join('\n')
	)

	assert.deepEqual(
		extractBlocks(root).map((b) => [b.text, b.editorial]),
		[
			['Titel', false],
			['Hinweis A', true],
			['Hinweis B', true],
			['Hinweis C', true],
			['Hinweis D', true],
			['Geschützt.', false],
		]
	)
})

test('a blockquote is recorded without its `>` markers and apart from the prose around it', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'Davor.',
			'> Zitat Zeile eins',
			'> Zitat Zeile zwei',
			'Danach.',
			'',
		].join('\n')
	)

	assert.deepEqual(
		extractBlocks(root).map((b) => b.text),
		['Titel', 'Davor.', 'Zitat Zeile eins Zitat Zeile zwei', 'Danach.']
	)
})

test('a wrapped list item continuation line stays part of the same list item, keeping its editorial flag', () => {
	write(
		PAGE,
		[
			'---',
			'title: Titel',
			'---',
			'',
			'{/* editorial */}',
			'- Editorial Punkt eins',
			'  der über zwei Zeilen geht',
			'',
			'- Geschützt zwei',
			'  auch über zwei Zeilen',
			'',
		].join('\n')
	)

	const blocks = extractBlocks(root)
	assert.deepEqual(
		blocks.map(({ kind, text, editorial }) => ({ kind, text, editorial })),
		[
			{ kind: 'title', text: 'Titel', editorial: false },
			{
				kind: 'listItem',
				text: 'Editorial Punkt eins der über zwei Zeilen geht',
				editorial: true,
			},
			{
				kind: 'listItem',
				text: 'Geschützt zwei auch über zwei Zeilen',
				editorial: false,
			},
		]
	)
})

test('baseline matching is keyed on kind as well as text, so a same-text block of a different kind cannot mask a loss', () => {
	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Geteilter Text.', ''].join('\n')
	)
	const baseline = generateBaseline(root)

	write(
		PAGE,
		['---', 'title: Titel', '---', '', '## Geteilter Text.', ''].join('\n')
	)

	const violations = findCopyIntegrityViolations(root, baseline)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].kind, 'paragraph')
	assert.match(violations[0].reason, /Geteilter Text\./)
})

const scriptPath = fileURLToPath(
	new URL('./copy-integrity.ts', import.meta.url)
)
const tsxBin = join(repoRoot, 'node_modules', '.bin', 'tsx')

function runCli(
	scriptDir: string,
	args: string[],
	cwd?: string
): { status: number | null; stdout: string; stderr: string } {
	return spawnSync(tsxBin, [join(scriptDir, 'copy-integrity.ts'), ...args], {
		cwd,
		encoding: 'utf8',
	})
}

function createCliScriptDir(): string {
	const scriptDir = mkdtempSync(join(tmpdir(), 'copy-integrity-cli-'))
	createdRoots.push(scriptDir)
	cpSync(scriptPath, join(scriptDir, 'copy-integrity.ts'))
	return scriptDir
}

test('CLI: --generate parses argv, writes the baseline next to the script and reports the count', () => {
	const scriptDir = createCliScriptDir()
	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Geschützter Satz.', ''].join('\n')
	)

	const result = runCli(scriptDir, ['--generate', root])

	assert.equal(result.status, 0)
	assert.match(result.stdout, /Wrote 2 protected blocks/)
	const baseline: BaselineEntry[] = JSON.parse(
		readFileSync(join(scriptDir, 'copy-integrity-baseline.json'), 'utf8')
	)
	assert.deepEqual(
		baseline.map((b) => b.text),
		['Titel', 'Geschützter Satz.']
	)
})

test('CLI: check mode exits 0 on a matching tree, defaulting root to the cwd', () => {
	const scriptDir = createCliScriptDir()
	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Geschützter Satz.', ''].join('\n')
	)
	runCli(scriptDir, ['--generate', root])

	const result = runCli(scriptDir, [], root)

	assert.equal(result.status, 0)
	assert.match(result.stdout, /Copy integrity: OK/)
})

test('CLI: check mode exits 1 and names the page and the lost block on a changed tree', () => {
	const scriptDir = createCliScriptDir()
	write(
		PAGE,
		['---', 'title: Titel', '---', '', 'Geschützter Satz.', ''].join('\n')
	)
	runCli(scriptDir, ['--generate', root])
	write(PAGE, ['---', 'title: Titel', '---', ''].join('\n'))

	const result = runCli(scriptDir, [root])

	assert.equal(result.status, 1)
	assert.match(result.stderr, /1 violation/)
	assert.match(result.stderr, new RegExp(PAGE.replace(/[/.]/g, '\\$&')))
	assert.match(result.stderr, /Geschützter Satz\./)
})

// Copy rule for epic #144 / issue #145: the checked-in baseline is the
// contract. These tests assert it against the repo's actual content tree
// (not a fixture), so an edited, split, merged or missing protected block
// fails `pnpm test` — the same check `pnpm validate:copy-integrity` runs in CI.
const checkedInBaseline: BaselineEntry[] = JSON.parse(
	readFileSync(
		join(repoRoot, 'scripts', 'copy-integrity-baseline.json'),
		'utf8'
	)
)

test('checked-in copy-integrity baseline: the current content tree has no violations', () => {
	assert.deepEqual(findCopyIntegrityViolations(repoRoot, checkedInBaseline), [])
})

test('checked-in copy-integrity baseline: regenerating it from the current tree produces no diff', () => {
	assert.deepEqual(generateBaseline(repoRoot), checkedInBaseline)
})
