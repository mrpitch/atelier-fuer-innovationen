import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
	computeTargetPath,
	crawlSite,
	decodeHtmlEntities,
	extractReferences,
	extractTitle,
	isUnderConstruction,
	renderDispositionCounts,
	renderMarkdownTable,
	type FetchPage,
	type SourceMapRecord,
} from './xeniapolis-source-map'

test('decodeHtmlEntities decodes named German entities', () => {
	assert.equal(decodeHtmlEntities('Ann&auml;herung'), 'Annäherung')
	assert.equal(decodeHtmlEntities('Wertsch&ouml;pfung'), 'Wertschöpfung')
	assert.equal(decodeHtmlEntities('Stra&szlig;e &amp; Co'), 'Straße & Co')
})

test('decodeHtmlEntities decodes numeric entities', () => {
	assert.equal(decodeHtmlEntities('&#228;&#xe4;'), 'ää')
})

test('decodeHtmlEntities leaves unknown entities untouched', () => {
	assert.equal(decodeHtmlEntities('&unknownentity;'), '&unknownentity;')
})

test('extractTitle reads and decodes the title tag', () => {
	const html =
		'<HTML><HEAD><TITLE>Ann&auml;herung: Was ist Xenia?</TITLE></HEAD></HTML>'
	assert.equal(extractTitle(html), 'Annäherung: Was ist Xenia?')
})

test('extractTitle returns empty string when there is no title', () => {
	assert.equal(extractTitle('<HTML><BODY>no title</BODY></HTML>'), '')
})

test('extractReferences resolves relative page and asset links', () => {
	const html = `
		<FRAME SRC="ann_menu.html">
		<a href="../ann/annstart.html">start</a>
		<IMG SRC="gifs/b_icons/annbild.gif">
		<BODY BACKGROUND="gifs/b_menu1/menu1_bckrd.gif">
	`
	const { pages, assets } = extractReferences(
		html,
		'https://xeniapolis.de/ann_frame.html'
	)
	assert.deepEqual(pages.sort(), [
		'https://xeniapolis.de/ann/annstart.html',
		'https://xeniapolis.de/ann_menu.html',
	])
	assert.deepEqual(assets.sort(), [
		'https://xeniapolis.de/gifs/b_icons/annbild.gif',
		'https://xeniapolis.de/gifs/b_menu1/menu1_bckrd.gif',
	])
})

test('extractReferences ignores javascript, mailto, and fragment-only links', () => {
	const html = `
		<a href="javascript:history.back()">back</a>
		<a href="mailto:someone@example.com">mail</a>
		<a href="#top">top</a>
	`
	const { pages, assets } = extractReferences(
		html,
		'https://xeniapolis.de/ann/annstart.html'
	)
	assert.deepEqual(pages, [])
	assert.deepEqual(assets, [])
})

test('extractReferences ignores external, off-domain links', () => {
	const html = '<a href="http://home.de.netscape.com/de/">Netscape</a>'
	const { pages, assets } = extractReferences(
		html,
		'https://xeniapolis.de/index.html'
	)
	assert.deepEqual(pages, [])
	assert.deepEqual(assets, [])
})

test('extractReferences drops malformed attribute values with stray angle brackets', () => {
	const html = '<a href="telepol/wissensa.htm%3E%3Cimg%20src=">broken</a>'
	const { pages, assets } = extractReferences(
		html,
		'https://xeniapolis.de/telepol/1.htm'
	)
	assert.deepEqual(pages, [])
	assert.deepEqual(assets, [])
})

test('extractReferences strips hash fragments so anchored links dedupe to one URL', () => {
	const html = `
		<a href="annstart.html#wasis">a</a>
		<a href="annstart.html#wasbie">b</a>
	`
	const { pages } = extractReferences(html, 'https://xeniapolis.de/ann/')
	assert.deepEqual(pages, ['https://xeniapolis.de/ann/annstart.html'])
})

test('extractReferences treats an extensionless, non-slash link as a page rather than dropping it', () => {
	const html =
		'<a href="impression">broken link, no extension, no trailing slash</a>'
	const { pages, assets } = extractReferences(
		html,
		'https://xeniapolis.de/ins/insstart.html'
	)
	assert.deepEqual(pages, ['https://xeniapolis.de/ins/impression'])
	assert.deepEqual(assets, [])
})

test('isUnderConstruction flags baustelle.html targets only', () => {
	assert.equal(isUnderConstruction('/baustelle.html'), true)
	assert.equal(isUnderConstruction('/mar/baustelle.html'), true)
	assert.equal(isUnderConstruction('/mar/marstart.html'), false)
})

test("computeTargetPath maps a district start page to that folder's index.mdx", () => {
	const { targetPath, notes } = computeTargetPath('/ins/insstart.html')
	assert.equal(targetPath, 'src/content/docs/xeniapolis/inszenierung/index.mdx')
	assert.equal(notes, '')
})

test('computeTargetPath maps the Inszenierung numbered sub-items into the archive subfolders', () => {
	const expected = {
		'/ins/aufstz10.html':
			'src/content/docs/xeniapolis/archiv/aufsaetze/10-die-wiederbelebung-der-polis-mit-den-staedten-des-wissens.mdx',
		'/ins/cebit2.html':
			'src/content/docs/xeniapolis/archiv/cebit/02-impressionen.mdx',
		'/ins/zeitun01.html':
			'src/content/docs/xeniapolis/archiv/zeitungen/01-tempo-spinner-vom-dienst.mdx',
		'/ins/zeitun07a.html':
			'src/content/docs/xeniapolis/archiv/zeitungen/07-sni-in-nrw-staedte-des-wissens.mdx',
		'/telepol/mr10.htm':
			'src/content/docs/xeniapolis/archiv/telepolis/netzwerk-fuer-innovatoren/messerueckblick/10-braess.mdx',
	}
	for (const [path, targetPath] of Object.entries(expected)) {
		const result = computeTargetPath(path)
		assert.equal(result.targetPath, targetPath, `target for ${path}`)
		assert.equal(result.disposition, 'migrated')
	}
})

test('computeTargetPath maps the Inszenierung Medienspiegel/Präsentationen section index pages into the archive', () => {
	for (const [path, targetPath] of [
		[
			'/ins/meilen0.html',
			'src/content/docs/xeniapolis/archiv/medienspiegel.mdx',
		],
		[
			'/ins/zeitun0.html',
			'src/content/docs/xeniapolis/archiv/medienspiegel.mdx',
		],
		[
			'/ins/radio0.html',
			'src/content/docs/xeniapolis/archiv/medienspiegel.mdx',
		],
		['/ins/web0.html', 'src/content/docs/xeniapolis/archiv/medienspiegel.mdx'],
		[
			'/ins/aufstz0.html',
			'src/content/docs/xeniapolis/archiv/praesentationen.mdx',
		],
		['/ins/cebit0.html', 'src/content/docs/xeniapolis/archiv/cebit-95.mdx'],
		[
			'/ins/telepol0.html',
			'src/content/docs/xeniapolis/archiv/telepolis/index.mdx',
		],
	] as const) {
		const result = computeTargetPath(path)
		assert.equal(
			result.targetPath,
			targetPath,
			`expected archive target for ${path}`
		)
		assert.equal(
			result.notes,
			'Section index page, migrated verbatim into the Xeniapolis archive as dated source material (centered on the 1995/96 breakthrough, spanning 1991–1997 once Medienspiegel is counted), outside the Stadtviertel structure.',
			`expected archive note for ${path}`
		)
	}
})

test('computeTargetPath maps the kon/ewelt1* slides into their #151 chapter folder with readable slugs', () => {
	assert.equal(
		computeTargetPath('/kon/ewelt1.html').targetPath,
		'src/content/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/index.mdx'
	)
	assert.equal(
		computeTargetPath('/kon/ewelt1a.html').targetPath,
		'src/content/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/wandel-der-beschaeftigungsstruktur.mdx'
	)
})

test('computeTargetPath consolidates every viertelN.html copy onto the shared overview page', () => {
	assert.equal(
		computeTargetPath('/ann/viertel3.html').targetPath,
		'src/content/docs/xeniapolis/annaeherung/die-stadtviertel-der-wissensstadt.mdx'
	)
	assert.equal(
		computeTargetPath('/pot/viertel3.html').targetPath,
		'src/content/docs/xeniapolis/annaeherung/die-stadtviertel-der-wissensstadt.mdx'
	)
})

test('computeTargetPath consolidates every besuchN.html copy onto the shared overview page', () => {
	assert.equal(
		computeTargetPath('/ann/besuch3.html').targetPath,
		'src/content/docs/xeniapolis/annaeherung/besuch-in-der-wissensstadt.mdx'
	)
	assert.equal(
		computeTargetPath('/pot/besuch3.html').targetPath,
		'src/content/docs/xeniapolis/annaeherung/besuch-in-der-wissensstadt.mdx'
	)
})

test('computeTargetPath maps ann/umgeb1.html to its own Umgebung page', () => {
	assert.equal(
		computeTargetPath('/ann/umgeb1.html').targetPath,
		'src/content/docs/xeniapolis/annaeherung/umgebung.mdx'
	)
})

test('computeTargetPath maps the wer/ partner and team bios by filename', () => {
	assert.equal(
		computeTargetPath('/wer/palfred.html').targetPath,
		'src/content/docs/xeniapolis/wertschoepfung/palfred.mdx'
	)
	assert.equal(
		computeTargetPath('/wer/wvolk.html').targetPath,
		'src/content/docs/xeniapolis/wertschoepfung/wvolk.mdx'
	)
})

test('computeTargetPath uses the verified content match for mar/marstart.html', () => {
	assert.equal(
		computeTargetPath('/mar/marstart.html').targetPath,
		'src/content/docs/xeniapolis/maerkte/idee-kontakt-begegnungen.mdx'
	)
})

test('computeTargetPath maps zen/zenstart.html to the Zentrum welcome hub, not the Stadtviertel-tour page it merely links to', () => {
	const { targetPath, notes } = computeTargetPath('/zen/zenstart.html')
	assert.equal(targetPath, 'src/content/docs/xeniapolis/index.mdx')
	assert.equal(notes.includes('navigation chrome'), true)
})

test('computeTargetPath maps zen/impress.html to the docs-root impressum.mdx, not a nested xeniapolis/ path', () => {
	const { targetPath, notes } = computeTargetPath('/zen/impress.html')
	assert.equal(targetPath, 'src/content/docs/impressum.mdx')
	assert.equal(notes.includes('only one Impressum'), true)
})

test('computeTargetPath maps each kurzueb page to its own split sibling page', () => {
	assert.equal(
		computeTargetPath('/ann/kurzueb1.html').targetPath,
		'src/content/docs/xeniapolis/annaeherung/staetten-der-begegnung.mdx'
	)
	assert.equal(
		computeTargetPath('/ann/kurzueb3.html').targetPath,
		'src/content/docs/xeniapolis/annaeherung/aufbruch-zum-kontinent-der-loesungen.mdx'
	)
})

test('computeTargetPath maps kurzueb4/5 to the re-homed fuehrung pages, not annaeherung', () => {
	assert.equal(
		computeTargetPath('/ann/kurzueb4.html').targetPath,
		'src/content/docs/xeniapolis/fuehrung/ateliers-fuer-innovatoren.mdx'
	)
	assert.equal(
		computeTargetPath('/ann/kurzueb5.html').targetPath,
		'src/content/docs/xeniapolis/fuehrung/xenia-im-netzwerk-der-wissensstaedte.mdx'
	)
})

test('computeTargetPath maps the ewelt2 page sequence onto its aggregated MDX file', () => {
	assert.equal(
		computeTargetPath('/kon/ewelt2f.html').targetPath,
		'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx'
	)
})

test('computeTargetPath maps wer/idee0.html, wer/gesch0.html, and wer/werist0.html to their human-readable slugs', () => {
	assert.equal(
		computeTargetPath('/wer/idee0.html').targetPath,
		'src/content/docs/xeniapolis/wertschoepfung/die-idee.mdx'
	)
	assert.equal(
		computeTargetPath('/wer/gesch0.html').targetPath,
		'src/content/docs/xeniapolis/wertschoepfung/projektgeschichte.mdx'
	)
	assert.equal(
		computeTargetPath('/wer/werist0.html').targetPath,
		'src/content/docs/xeniapolis/wertschoepfung/mitwirkende.mdx'
	)
})

test('computeTargetPath aggregates wer/arbeit0.html and wer/plan0.html onto one Forschungsarbeit page', () => {
	assert.equal(
		computeTargetPath('/wer/arbeit0.html').targetPath,
		'src/content/docs/xeniapolis/wertschoepfung/forschungsarbeit.mdx'
	)
	assert.equal(
		computeTargetPath('/wer/plan0.html').targetPath,
		'src/content/docs/xeniapolis/wertschoepfung/forschungsarbeit.mdx'
	)
})

test('computeTargetPath maps fue/netzw0.html to its human-readable slug', () => {
	assert.equal(
		computeTargetPath('/fue/netzw0.html').targetPath,
		'src/content/docs/xeniapolis/fuehrung/netzwerk-der-innovatoren.mdx'
	)
})

test('computeTargetPath places Zentrum outside the Stadtviertel folder convention', () => {
	const { targetPath, notes } = computeTargetPath('/zen/rundgang1.html')
	assert.equal(targetPath, 'src/content/docs/xeniapolis/zentrum/rundgang1.mdx')
	assert.equal(notes.includes('not one of the 8 Stadtviertel'), true)
})

test('computeTargetPath has no target for frame/menu chrome and the root frameset', () => {
	for (const path of ['/ann_frame.html', '/ann_menu.html', '/menu1.html']) {
		const result = computeTargetPath(path)
		assert.equal(result.targetPath, '')
		assert.equal(result.disposition, 'chrome')
	}
	const root = computeTargetPath('/index.html')
	assert.equal(root.targetPath, '')
	assert.equal(root.disposition, 'chrome')
	assert.equal(root.notes.includes('superseded'), true)
})

test('computeTargetPath flags baustelle.html as having no content to migrate', () => {
	const { targetPath, notes, disposition } =
		computeTargetPath('/baustelle.html')
	assert.equal(targetPath, '')
	assert.equal(notes.includes('under construction'), true)
	assert.equal(disposition, 'under-construction')
})

test('computeTargetPath gives every non-200 source an empty target and the HTTP error note', () => {
	for (const path of [
		'/kon/zen/zenstart.html',
		'/~mib/agora/azxenia.htm',
		'/telepol/xenia.html',
		'/ins/impression',
		// Status wins over every other rule, including explicit overrides.
		'/telepol/xenia.htm',
	]) {
		const result = computeTargetPath(path, 404)
		assert.equal(result.targetPath, '', `expected no target for ${path}`)
		assert.equal(result.notes, 'Source returns HTTP 404 — nothing to migrate.')
		assert.equal(result.disposition, 'http-error')
	}
})

test('computeTargetPath marks HTTP 200 pages outside every rule as unmapped rather than guessing', () => {
	const result = computeTargetPath('/telepol/neu.htm')
	assert.equal(result.targetPath, '')
	assert.equal(result.disposition, 'unmapped')
})

test('crawlSite follows links transitively and dedupes repeated URLs', async () => {
	const site: Record<string, FetchedPageFixture> = {
		'https://xeniapolis.de/': {
			status: 200,
			html: '<TITLE>Willkommen</TITLE><a href="ann_frame.html">ann</a>',
		},
		'https://xeniapolis.de/ann_frame.html': {
			status: 200,
			html: '<TITLE>Viertel der Ann&auml;herung</TITLE><FRAME SRC="ann/annstart.html"><a href="/">home</a>',
		},
		'https://xeniapolis.de/ann/annstart.html': {
			status: 200,
			html: '<TITLE>Annstart</TITLE><IMG SRC="../gifs/b_icons/annbild.gif">',
		},
	}
	const fetchPage: FetchPage = async (url) =>
		site[url] ?? { status: 404, html: null }

	const records = await crawlSite('https://xeniapolis.de/', fetchPage)

	assert.equal(records.length, 3)
	const byUrl = new Map(records.map((r) => [r.url, r]))
	assert.equal(byUrl.get('https://xeniapolis.de/')!.title, 'Willkommen')
	assert.equal(
		byUrl.get('https://xeniapolis.de/ann_frame.html')!.title,
		'Viertel der Annäherung'
	)
	const annstart = byUrl.get('https://xeniapolis.de/ann/annstart.html')!
	assert.deepEqual(annstart.assets, [
		'https://xeniapolis.de/gifs/b_icons/annbild.gif',
	])
	assert.equal(
		annstart.targetPath,
		'src/content/docs/xeniapolis/annaeherung/index.mdx'
	)
})

test('crawlSite records unreachable pages with their HTTP status and does not crawl past them', async () => {
	const site: Record<string, FetchedPageFixture> = {
		'https://xeniapolis.de/': {
			status: 200,
			html: '<TITLE>Root</TITLE><a href="missing.html">gone</a>',
		},
		'https://xeniapolis.de/missing.html': { status: 404, html: null },
	}
	const fetchPage: FetchPage = async (url) =>
		site[url] ?? { status: 404, html: null }

	const records = await crawlSite('https://xeniapolis.de/', fetchPage)

	assert.equal(records.length, 2)
	const missing = records.find(
		(r) => r.url === 'https://xeniapolis.de/missing.html'
	)!
	assert.equal(missing.httpStatus, 404)
	assert.equal(missing.title, '')
	assert.deepEqual(missing.assets, [])
	assert.equal(missing.targetPath, '')
	assert.equal(missing.disposition, 'http-error')
	assert.equal(missing.notes, 'Source returns HTTP 404 — nothing to migrate.')
})

test('renderMarkdownTable groups records by district and includes every record once', () => {
	const records = [
		{
			url: 'https://xeniapolis.de/ann/annstart.html',
			httpStatus: 200,
			title: 'Annstart',
			targetPath: 'src/content/docs/xeniapolis/annaeherung/index.mdx',
			assets: ['https://xeniapolis.de/gifs/a.gif'],
			underConstruction: false,
			disposition: 'migrated' as const,
			notes: '',
		},
		{
			url: 'https://xeniapolis.de/index.html',
			httpStatus: 200,
			title: 'Willkommen',
			targetPath: '',
			assets: [],
			underConstruction: false,
			disposition: 'chrome' as const,
			notes:
				'Site root frameset — superseded by Fumadocs layout, not migrated as content.',
		},
	]
	const table = renderMarkdownTable(records)
	assert.equal(table.includes('## (root)'), true)
	assert.equal(table.includes('## ann'), true)
	assert.equal(table.includes('annstart.html'), true)
	assert.equal(table.includes('index.html'), true)
})

test('renderDispositionCounts counts each disposition once', () => {
	const base = {
		httpStatus: 200,
		title: '',
		targetPath: '',
		assets: [],
		underConstruction: false,
		notes: '',
	}
	const table = renderDispositionCounts([
		{ ...base, url: 'https://xeniapolis.de/a', disposition: 'chrome' },
		{ ...base, url: 'https://xeniapolis.de/b', disposition: 'chrome' },
		{ ...base, url: 'https://xeniapolis.de/c', disposition: 'http-error' },
	])
	assert.equal(
		table.includes(
			'| `chrome` | Frame/menu chrome or root frameset, superseded | 2 |'
		),
		true
	)
	assert.equal(
		table.includes(
			'| `http-error` | Source answers with a non-200 status | 1 |'
		),
		true
	)
	assert.equal(
		table.includes(
			'| `migrated` | Migrated to an existing MDX page (`targetPath` set) | 0 |'
		),
		true
	)
})

// Spec rule for epic #92: migration completeness = every non-underConstruction
// source record has a targetPath that exists. These tests assert it against
// the checked-in data, so a stale map or a missing page fails the suite.
const repoRoot = join(fileURLToPath(import.meta.url), '..', '..')
const checkedInRecords: SourceMapRecord[] = JSON.parse(
	readFileSync(
		join(repoRoot, 'docs', 'reference', 'xeniapolis-source-map.json'),
		'utf8'
	)
)

const isFrameChrome = (url: string): boolean => {
	const segments = new URL(url).pathname.split('/').filter(Boolean)
	const file = (segments[segments.length - 1] ?? '').toLowerCase()
	return (
		segments.length === 0 ||
		(segments.length === 1 && /^index\.html?$/.test(file)) ||
		/_frame\.html?$/.test(file) ||
		/_menu\.html?$/.test(file) ||
		/^menu\d*\.html?$/.test(file)
	)
}

test('checked-in source map: every HTTP 200 content page has a targetPath that exists on disk', () => {
	const content = checkedInRecords.filter(
		(r) => r.httpStatus === 200 && !r.underConstruction && !isFrameChrome(r.url)
	)
	assert.equal(content.length > 0, true)
	const missing = content
		.filter((r) => !r.targetPath || !existsSync(join(repoRoot, r.targetPath)))
		.map((r) => `${r.url} -> ${r.targetPath || '(none)'}`)
	assert.deepEqual(missing, [])
})

test('checked-in source map: every non-200 record has no targetPath and the HTTP error note', () => {
	const errors = checkedInRecords.filter((r) => r.httpStatus !== 200)
	assert.equal(errors.length > 0, true)
	for (const record of errors) {
		assert.equal(record.targetPath, '', record.url)
		assert.equal(
			record.notes,
			`Source returns HTTP ${record.httpStatus} — nothing to migrate.`,
			record.url
		)
	}
})

test('checked-in source map: frame/menu chrome and baustelle have no targetPath, and no record awaits triage', () => {
	for (const record of checkedInRecords) {
		if (record.httpStatus !== 200) continue
		if (record.underConstruction || isFrameChrome(record.url)) {
			assert.equal(record.targetPath, '', record.url)
		}
		assert.equal(record.notes.includes('manual triage'), false, record.url)
		assert.notEqual(record.disposition, 'unmapped', record.url)
	}
})

test('checked-in source map: the disposition field agrees with status, chrome and construction flags', () => {
	for (const record of checkedInRecords) {
		const expected =
			record.httpStatus !== 200
				? 'http-error'
				: record.underConstruction
					? 'under-construction'
					: isFrameChrome(record.url)
						? 'chrome'
						: 'migrated'
		assert.equal(record.disposition, expected, record.url)
	}
})

interface FetchedPageFixture {
	status: number
	html: string | null
}
