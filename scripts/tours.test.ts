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
const EWELT1_DIR = join(KONTEXTE_DIR, 'einstimmung-zur-zukunftsgestaltung')
const EWELT3_DIR = join(KONTEXTE_DIR, 'eine-welt-im-wandel')

const EWELT1_OVERVIEW =
	'[Einstimmung zur Zukunftsgestaltung](/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung)'
const EWELT3_OVERVIEW =
	'["Eine Welt" im Wandel](/docs/xeniapolis/kontexte/eine-welt-im-wandel)'
// ewelt3d carries the hand-written text's original extra space verbatim —
// the copy rule forbids correcting it.
const EWELT3D_OVERVIEW =
	'["Eine Welt " im Wandel](/docs/xeniapolis/kontexte/eine-welt-im-wandel)'

const EWELT1_FILES: Record<string, string> = {
	a: 'wandel-der-beschaeftigungsstruktur.mdx',
	b: 'das-informationale-babylon.mdx',
	c: 'beschuetzte-weisheit-geordnetes-staatswesen.mdx',
	d: 'die-mission-des-hl-franziskus.mdx',
	e: 'unternehmerische-engagements-im-visionaeren-vorfeld.mdx',
	f: 'xenia-stadt-des-wissens-und-staette-der-begegnung.mdx',
	g: 'potentiale-einer-stadt-des-wissens-nutzen.mdx',
	h: 'das-vor-bild-der-erfinderunternehmer.mdx',
}
const EWELT3_FILES: Record<string, string> = {
	a: 'das-satori-konzept.mdx',
	b: 'eine-welt-der-probleme-und-revolutionen.mdx',
	c: 'die-gestaltungsfelder-der-problemloesungsgesellschaft.mdx',
	d: 'aufbruch-zum-kontinent-der-loesungen.mdx',
	e: 'die-erste-globale-revolution.mdx',
	f: 'megatrends-der-erfordernisse.mdx',
	g: 'gedanken.mdx',
	h: 'eine-programmatische-skizzierung.mdx',
}

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
	const resolved = resolveStation(
		'ewelt1',
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/das-vor-bild-der-erfinderunternehmer'
	)
	assert.equal(resolved?.index, 7)
	assert.equal(resolved?.total, 8)
	assert.equal(
		resolved?.next,
		'/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft'
	)
})

test("ewelt3's last station exits into ewelt4's overview", () => {
	const resolved = resolveStation(
		'ewelt3',
		'/docs/xeniapolis/kontexte/eine-welt-im-wandel/eine-programmatische-skizzierung'
	)
	assert.equal(resolved?.index, 7)
	assert.equal(resolved?.total, 8)
	assert.equal(
		resolved?.next,
		'/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis'
	)
})

test('a middle ewelt3 station is unaffected by the exit and still points to the next slide', () => {
	const resolved = resolveStation(
		'ewelt3',
		'/docs/xeniapolis/kontexte/eine-welt-im-wandel/gedanken'
	)
	assert.equal(
		resolved?.next,
		'/docs/xeniapolis/kontexte/eine-welt-im-wandel/eine-programmatische-skizzierung'
	)
})

test('a tour slug not in the definitions resolves to undefined', () => {
	assert.equal(resolveStation('not-a-tour', '/docs/xeniapolis'), undefined)
})

test('a station not listed on the tour resolves to undefined', () => {
	assert.equal(
		resolveStation(
			'ewelt1',
			'/docs/xeniapolis/kontexte/eine-welt-im-wandel/das-satori-konzept'
		),
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
		const content = readFileSync(join(EWELT1_DIR, EWELT1_FILES[letter]), 'utf8')
		assert.ok(
			content.includes(EWELT1_OVERVIEW),
			`${EWELT1_FILES[letter]} is missing the overview link`
		)
	}
})

test('every ewelt3 station keeps its original link back to the series overview', () => {
	for (const letter of ['a', 'b', 'c', 'e', 'f', 'g', 'h']) {
		const content = readFileSync(join(EWELT3_DIR, EWELT3_FILES[letter]), 'utf8')
		assert.ok(
			content.includes(EWELT3_OVERVIEW),
			`${EWELT3_FILES[letter]} is missing the overview link`
		)
	}

	const d = readFileSync(join(EWELT3_DIR, EWELT3_FILES.d), 'utf8')
	assert.ok(
		d.includes(EWELT3D_OVERVIEW),
		`${EWELT3_FILES.d} is missing the overview link`
	)
})
