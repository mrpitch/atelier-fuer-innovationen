import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
	computeTargetPath,
	crawlSite,
	decodeHtmlEntities,
	extractReferences,
	extractTitle,
	isUnderConstruction,
	renderMarkdownTable,
	type FetchPage,
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
	const html = '<HTML><HEAD><TITLE>Ann&auml;herung: Was ist Xenia?</TITLE></HEAD></HTML>'
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
	const { pages, assets } = extractReferences(html, 'https://xeniapolis.de/ann_frame.html')
	assert.deepEqual(pages.sort(), ['https://xeniapolis.de/ann/annstart.html', 'https://xeniapolis.de/ann_menu.html'])
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
	const { pages, assets } = extractReferences(html, 'https://xeniapolis.de/ann/annstart.html')
	assert.deepEqual(pages, [])
	assert.deepEqual(assets, [])
})

test('extractReferences ignores external, off-domain links', () => {
	const html = '<a href="http://home.de.netscape.com/de/">Netscape</a>'
	const { pages, assets } = extractReferences(html, 'https://xeniapolis.de/index.html')
	assert.deepEqual(pages, [])
	assert.deepEqual(assets, [])
})

test('extractReferences drops malformed attribute values with stray angle brackets', () => {
	const html = '<a href="telepol/wissensa.htm%3E%3Cimg%20src=">broken</a>'
	const { pages, assets } = extractReferences(html, 'https://xeniapolis.de/telepol/1.htm')
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
	const html = '<a href="impression">broken link, no extension, no trailing slash</a>'
	const { pages, assets } = extractReferences(html, 'https://xeniapolis.de/ins/insstart.html')
	assert.deepEqual(pages, ['https://xeniapolis.de/ins/impression'])
	assert.deepEqual(assets, [])
})

test('isUnderConstruction flags baustelle.html targets only', () => {
	assert.equal(isUnderConstruction('/baustelle.html'), true)
	assert.equal(isUnderConstruction('/mar/baustelle.html'), true)
	assert.equal(isUnderConstruction('/mar/marstart.html'), false)
})

test('computeTargetPath maps a district start page to that folder\'s index.mdx', () => {
	const { targetPath, notes } = computeTargetPath('/ins/insstart.html')
	assert.equal(targetPath, 'src/content/docs/xeniapolis/inszenierung/index.mdx')
	assert.equal(notes, '')
})

test('computeTargetPath maps a generic district content page by filename', () => {
	const { targetPath } = computeTargetPath('/kon/ewelt1a.html')
	assert.equal(targetPath, 'src/content/docs/xeniapolis/kontexte/ewelt1a.mdx')
})

test('computeTargetPath consolidates every viertelN.html copy onto the shared overview page', () => {
	assert.equal(
		computeTargetPath('/ann/viertel3.html').targetPath,
		'src/content/docs/xeniapolis/die-stadtviertel-der-wissensstadt.mdx',
	)
	assert.equal(
		computeTargetPath('/pot/viertel3.html').targetPath,
		'src/content/docs/xeniapolis/die-stadtviertel-der-wissensstadt.mdx',
	)
})

test('computeTargetPath uses the verified content match for mar/marstart.html and zen/zenstart.html', () => {
	assert.equal(
		computeTargetPath('/mar/marstart.html').targetPath,
		'src/content/docs/xeniapolis/idee-kontakt-begegnungen.mdx',
	)
	assert.equal(
		computeTargetPath('/zen/zenstart.html').targetPath,
		'src/content/docs/xeniapolis/besuch-in-der-wissensstadt.mdx',
	)
})

test('computeTargetPath maps the kurzueb and ewelt2 page sequences onto their aggregated MDX files', () => {
	assert.equal(
		computeTargetPath('/ann/kurzueb3.html').targetPath,
		'src/content/docs/xeniapolis/kurzuebersicht.mdx',
	)
	assert.equal(
		computeTargetPath('/kon/ewelt2f.html').targetPath,
		'src/content/docs/xeniapolis/konstellationen-beim-uebergang-zur-nformationsgesellschaft.mdx',
	)
})

test('computeTargetPath places Zentrum outside the Stadtviertel folder convention', () => {
	const { targetPath, notes } = computeTargetPath('/zen/rundgang1.html')
	assert.equal(targetPath, 'src/content/docs/xeniapolis/zentrum/rundgang1.mdx')
	assert.equal(notes.includes('not one of the 8 Stadtviertel'), true)
})

test('computeTargetPath has no target for frame/menu chrome and the root frameset', () => {
	assert.equal(computeTargetPath('/ann_frame.html').targetPath, '')
	assert.equal(computeTargetPath('/ann_menu.html').targetPath, '')
	assert.equal(computeTargetPath('/menu1.html').targetPath, '')
	assert.equal(computeTargetPath('/index.html').targetPath, '')
})

test('computeTargetPath flags baustelle.html as having no content to migrate', () => {
	const { targetPath, notes } = computeTargetPath('/baustelle.html')
	assert.equal(targetPath, '')
	assert.equal(notes.includes('under construction'), true)
})

test('computeTargetPath flags out-of-convention paths for manual triage', () => {
	assert.equal(computeTargetPath('/telepol/xenia.htm').notes.includes('manual triage'), true)
	assert.equal(computeTargetPath('/kon/zen/zenstart.html').notes.includes('manual triage'), true)
	assert.equal(computeTargetPath('/~mib/agora/azxenia.htm').notes.includes('manual triage'), true)
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
	const fetchPage: FetchPage = async (url) => site[url] ?? { status: 404, html: null }

	const records = await crawlSite('https://xeniapolis.de/', fetchPage)

	assert.equal(records.length, 3)
	const byUrl = new Map(records.map((r) => [r.url, r]))
	assert.equal(byUrl.get('https://xeniapolis.de/')!.title, 'Willkommen')
	assert.equal(byUrl.get('https://xeniapolis.de/ann_frame.html')!.title, 'Viertel der Annäherung')
	const annstart = byUrl.get('https://xeniapolis.de/ann/annstart.html')!
	assert.deepEqual(annstart.assets, ['https://xeniapolis.de/gifs/b_icons/annbild.gif'])
	assert.equal(annstart.targetPath, 'src/content/docs/xeniapolis/viertel-der-annaeherung/index.mdx')
})

test('crawlSite records unreachable pages with their HTTP status and does not crawl past them', async () => {
	const site: Record<string, FetchedPageFixture> = {
		'https://xeniapolis.de/': {
			status: 200,
			html: '<TITLE>Root</TITLE><a href="missing.html">gone</a>',
		},
		'https://xeniapolis.de/missing.html': { status: 404, html: null },
	}
	const fetchPage: FetchPage = async (url) => site[url] ?? { status: 404, html: null }

	const records = await crawlSite('https://xeniapolis.de/', fetchPage)

	assert.equal(records.length, 2)
	const missing = records.find((r) => r.url === 'https://xeniapolis.de/missing.html')!
	assert.equal(missing.httpStatus, 404)
	assert.equal(missing.title, '')
	assert.deepEqual(missing.assets, [])
})

test('renderMarkdownTable groups records by district and includes every record once', () => {
	const records = [
		{
			url: 'https://xeniapolis.de/ann/annstart.html',
			httpStatus: 200,
			title: 'Annstart',
			targetPath: 'src/content/docs/xeniapolis/viertel-der-annaeherung/index.mdx',
			assets: ['https://xeniapolis.de/gifs/a.gif'],
			underConstruction: false,
			notes: '',
		},
		{
			url: 'https://xeniapolis.de/index.html',
			httpStatus: 200,
			title: 'Willkommen',
			targetPath: '',
			assets: [],
			underConstruction: false,
			notes: 'Site root frameset — superseded by Fumadocs layout, not migrated as content.',
		},
	]
	const table = renderMarkdownTable(records)
	assert.equal(table.includes('## (root)'), true)
	assert.equal(table.includes('## ann'), true)
	assert.equal(table.includes('annstart.html'), true)
	assert.equal(table.includes('index.html'), true)
})

interface FetchedPageFixture {
	status: number
	html: string | null
}
