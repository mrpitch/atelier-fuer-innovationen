import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'

import { findStadtviertelViolations } from './validate-stadtviertel'

let root: string
const createdRoots: string[] = []

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'stadtviertel-test-'))
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

const DEFINITIONS = [
	{ slug: 'annaeherung', label: 'Viertel der Annäherung', icon: 'Signpost' },
	{ slug: 'maerkte', label: 'Viertel der Märkte', icon: 'Store' },
]

function writeConformantTree(
	definitions: { slug: string; label: string; icon: string }[] = DEFINITIONS
): void {
	write(
		'src/data/stadtviertel.json',
		JSON.stringify({ stadtviertel: definitions })
	)
	write(
		'src/content/docs/xeniapolis/meta.json',
		JSON.stringify({
			pages: [
				'---Zentrum---',
				'index',
				'---Stadtviertel---',
				...definitions.map((d) => d.slug),
				'---Archiv---',
				'archiv',
			],
		})
	)
	for (const { slug, label, icon } of definitions) {
		write(
			`src/content/docs/xeniapolis/${slug}/meta.json`,
			JSON.stringify({ title: label, icon })
		)
	}
}

test('a conformant tree returns no violations', () => {
	writeConformantTree()
	assert.deepEqual(findStadtviertelViolations(root), [])
})

test('a meta.json title that does not match the canonical label is a violation', () => {
	writeConformantTree()
	write(
		'src/content/docs/xeniapolis/annaeherung/meta.json',
		JSON.stringify({ title: 'Annäherung', icon: 'Signpost' })
	)

	const violations = findStadtviertelViolations(root)
	assert.equal(violations.length, 1)
	assert.equal(
		violations[0].file,
		'src/content/docs/xeniapolis/annaeherung/meta.json'
	)
	assert.match(violations[0].reason, /title/)
})

test('a meta.json icon that does not match the canonical icon is a violation', () => {
	writeConformantTree()
	write(
		'src/content/docs/xeniapolis/annaeherung/meta.json',
		JSON.stringify({ title: 'Viertel der Annäherung', icon: 'Building2' })
	)

	const violations = findStadtviertelViolations(root)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /icon/)
})

test('a canonical icon that is not a real lucide-react export is a violation', () => {
	writeConformantTree([
		{ slug: 'annaeherung', label: 'Viertel der Annäherung', icon: 'NotAnIcon' },
	])

	const violations = findStadtviertelViolations(root)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].file, 'src/data/stadtviertel.json')
	assert.match(violations[0].reason, /NotAnIcon/)
})

test('a missing per-Stadtviertel meta.json is a violation', () => {
	writeConformantTree()
	rmSync(join(root, 'src/content/docs/xeniapolis/maerkte/meta.json'))

	const violations = findStadtviertelViolations(root)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /maerkte/)
})

test('xeniapolis/meta.json listing the Stadtviertel out of order is a violation', () => {
	writeConformantTree()
	write(
		'src/content/docs/xeniapolis/meta.json',
		JSON.stringify({
			pages: [
				'---Stadtviertel---',
				'maerkte',
				'annaeherung',
				'---Archiv---',
				'archiv',
			],
		})
	)

	const violations = findStadtviertelViolations(root)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /order/)
})

test('xeniapolis/meta.json missing a Stadtviertel entry is a violation', () => {
	writeConformantTree()
	write(
		'src/content/docs/xeniapolis/meta.json',
		JSON.stringify({ pages: ['---Stadtviertel---', 'annaeherung'] })
	)

	const violations = findStadtviertelViolations(root)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /order/)
})
