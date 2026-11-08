import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { resolveStation } from '../src/data/tours'

const KONTEXTE_DIR = join(
	dirname(fileURLToPath(import.meta.url)),
	'../src/content/docs/xeniapolis/kontexte'
)

const EWELT1_OVERVIEW =
	'[Einstimmung zur Zukunftsgestaltung](/docs/xeniapolis/kontexte/ewelt1)'
const EWELT3_OVERVIEW =
	'["Eine Welt" im Wandel](/docs/xeniapolis/kontexte/ewelt3)'
// ewelt3d carries the hand-written text's original extra space verbatim —
// the copy rule forbids correcting it.
const EWELT3D_OVERVIEW =
	'["Eine Welt " im Wandel](/docs/xeniapolis/kontexte/ewelt3)'

test('kurzuebersicht hops from annaeherung station 3 into fuehrung station 4 and back', () => {
	const third = resolveStation(
		'kurzuebersicht',
		'/docs/xeniapolis/annaeherung/aufbruch-zum-kontinent-der-loesungen'
	)
	assert.equal(third?.index, 2)
	assert.equal(third?.total, 5)
	assert.equal(
		third?.next,
		'/docs/xeniapolis/fuehrung/ateliers-fuer-innovatoren'
	)

	const fourth = resolveStation(
		'kurzuebersicht',
		'/docs/xeniapolis/fuehrung/ateliers-fuer-innovatoren'
	)
	assert.equal(fourth?.index, 3)
	assert.equal(
		fourth?.previous,
		'/docs/xeniapolis/annaeherung/aufbruch-zum-kontinent-der-loesungen'
	)
	assert.equal(
		fourth?.next,
		'/docs/xeniapolis/fuehrung/xenia-im-netzwerk-der-wissensstaedte'
	)
})

test("a tour without an exit disables the last station's next", () => {
	const last = resolveStation(
		'kurzuebersicht',
		'/docs/xeniapolis/fuehrung/xenia-im-netzwerk-der-wissensstaedte'
	)
	assert.equal(last?.index, 4)
	assert.equal(last?.next, undefined)
})

test("ewelt1's last station exits into konstellationen-beim-uebergang-zur-informationsgesellschaft", () => {
	const resolved = resolveStation('ewelt1', '/docs/xeniapolis/kontexte/ewelt1h')
	assert.equal(resolved?.index, 7)
	assert.equal(resolved?.total, 8)
	assert.equal(
		resolved?.next,
		'/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft'
	)
})

test("ewelt3's last station exits into ewelt4", () => {
	const resolved = resolveStation('ewelt3', '/docs/xeniapolis/kontexte/ewelt3h')
	assert.equal(resolved?.index, 7)
	assert.equal(resolved?.total, 8)
	assert.equal(resolved?.next, '/docs/xeniapolis/kontexte/ewelt4')
})

test('a middle ewelt3 station is unaffected by the exit and still points to the next slide', () => {
	const resolved = resolveStation('ewelt3', '/docs/xeniapolis/kontexte/ewelt3g')
	assert.equal(resolved?.next, '/docs/xeniapolis/kontexte/ewelt3h')
})

test('a tour slug not in the definitions resolves to undefined', () => {
	assert.equal(resolveStation('not-a-tour', '/docs/xeniapolis'), undefined)
})

test('a station not listed on the tour resolves to undefined', () => {
	assert.equal(
		resolveStation('ewelt1', '/docs/xeniapolis/kontexte/ewelt3a'),
		undefined
	)
})

test("besuch-in-der-wissensstadt's single station exits into umgebung, the hop its old hand-written Weiter link made", () => {
	const resolved = resolveStation(
		'besuch-in-der-wissensstadt',
		'/docs/xeniapolis/annaeherung/besuch-in-der-wissensstadt'
	)
	assert.equal(resolved?.previous, undefined)
	assert.equal(resolved?.next, '/docs/xeniapolis/annaeherung/umgebung')
})

test('every ewelt1 station keeps its original link back to the series overview', () => {
	for (const letter of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
		const content = readFileSync(
			join(KONTEXTE_DIR, `ewelt1${letter}.mdx`),
			'utf8'
		)
		assert.ok(
			content.includes(EWELT1_OVERVIEW),
			`ewelt1${letter}.mdx is missing the overview link`
		)
	}
})

test('every ewelt3 station keeps its original link back to the series overview', () => {
	for (const letter of ['a', 'b', 'c', 'e', 'f', 'g', 'h']) {
		const content = readFileSync(
			join(KONTEXTE_DIR, `ewelt3${letter}.mdx`),
			'utf8'
		)
		assert.ok(
			content.includes(EWELT3_OVERVIEW),
			`ewelt3${letter}.mdx is missing the overview link`
		)
	}

	const d = readFileSync(join(KONTEXTE_DIR, 'ewelt3d.mdx'), 'utf8')
	assert.ok(
		d.includes(EWELT3D_OVERVIEW),
		'ewelt3d.mdx is missing the overview link'
	)
})
