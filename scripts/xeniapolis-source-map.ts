#!/usr/bin/env -S npx tsx
/**
 * xeniapolis-source-map: crawl xeniapolis.de and produce a checked-in inventory
 * of every reachable source URL, so the #92 migration's completeness is
 * verifiable rather than asserted.
 *
 * Usage:
 *   npx tsx scripts/xeniapolis-source-map.ts
 *
 * Writes docs/reference/xeniapolis-source-map.json and .md from a live crawl
 * of https://xeniapolis.de/.
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { stdout } from 'node:process'
import { fileURLToPath } from 'node:url'

export interface SourceMapRecord {
	url: string
	httpStatus: number
	title: string
	targetPath: string
	assets: string[]
	underConstruction: boolean
	notes: string
}

export interface FetchedPage {
	status: number
	html: string | null
}

export type FetchPage = (url: string) => Promise<FetchedPage>

const ORIGIN = 'https://xeniapolis.de'

// Stadtviertel folder slugs, following the convention already established by
// src/content/docs/xeniapolis/* (see docs/reference/glossary.md for the
// canonical district names).
const DISTRICT_SLUGS: Record<string, string> = {
	ann: 'annaeherung',
	mar: 'maerkte',
	kon: 'kontexte',
	ins: 'inszenierung',
	zuk: 'zukunft',
	wer: 'wertschoepfung',
	pot: 'potenziale',
	fue: 'fuehrung',
}

// Source pages whose text was hand-compared against an already-migrated MDX
// file and found to match — the planned target is that existing file rather
// than a computed path. Some already-migrated MDX files aggregate several
// source pages into one (each ## heading below matches one source page's
// <title>), the same pattern as the viertelN.html tour consolidation.
//
// ann/kurzueb1.html-kurzueb5.html were previously aggregated into one
// kurzuebersicht.mdx; #98 split that file into five ordered sibling pages
// (one per stop, sequenced via annaeherung/meta.json) so each source page now
// gets its own target below. ann/umgeb1.html has no numbered siblings of its
// own, so it is listed here rather than getting a regex branch like besuchN
// and viertelN below.
//
// wer/idee0.html, wer/gesch0.html, and wer/werist0.html were each renamed to
// a human-readable slug (die-idee, projektgeschichte, mitwirkende) rather
// than keeping their mechanical basename. wer/arbeit0.html and
// wer/plan0.html were aggregated into one forschungsarbeit.mdx (each ##
// heading matches one source page's <title>), the district's own "current
// work" and "future plans" sections, named after its own tagline
// "Chaos-Chancen und Forschungsarbeit" (#104).
const VERIFIED_TARGETS: Record<string, string> = {
	'/mar/marstart.html': 'src/content/docs/xeniapolis/maerkte/idee-kontakt-begegnungen.mdx',
	'/ann/kurzueb1.html': 'src/content/docs/xeniapolis/annaeherung/staetten-der-begegnung.mdx',
	'/ann/kurzueb2.html': 'src/content/docs/xeniapolis/annaeherung/kondratieffs-zyklen.mdx',
	'/ann/kurzueb3.html': 'src/content/docs/xeniapolis/annaeherung/aufbruch-zum-kontinent-der-loesungen.mdx',
	'/ann/kurzueb4.html': 'src/content/docs/xeniapolis/annaeherung/ateliers-fuer-innovatoren.mdx',
	'/ann/kurzueb5.html': 'src/content/docs/xeniapolis/annaeherung/xenia-im-netzwerk-der-wissensstaedte.mdx',
	'/ann/umgeb1.html': 'src/content/docs/xeniapolis/annaeherung/besuch-in-der-wissensstadt.mdx',
	'/kon/ewelt2.html': 'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
	'/kon/ewelt2a.html': 'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
	'/kon/ewelt2b.html': 'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
	'/kon/ewelt2c.html': 'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
	'/kon/ewelt2d.html': 'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
	'/kon/ewelt2e.html': 'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
	'/kon/ewelt2f.html': 'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
	'/kon/ewelt2g.html': 'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
	'/kon/ewelt2h.html': 'src/content/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
	'/wer/idee0.html': 'src/content/docs/xeniapolis/wertschoepfung/die-idee.mdx',
	'/wer/gesch0.html': 'src/content/docs/xeniapolis/wertschoepfung/projektgeschichte.mdx',
	'/wer/arbeit0.html': 'src/content/docs/xeniapolis/wertschoepfung/forschungsarbeit.mdx',
	'/wer/plan0.html': 'src/content/docs/xeniapolis/wertschoepfung/forschungsarbeit.mdx',
	'/wer/werist0.html': 'src/content/docs/xeniapolis/wertschoepfung/mitwirkende.mdx',
}

const NAMED_ENTITIES: Record<string, string> = {
	auml: 'ä',
	ouml: 'ö',
	uuml: 'ü',
	Auml: 'Ä',
	Ouml: 'Ö',
	Uuml: 'Ü',
	szlig: 'ß',
	eacute: 'é',
	egrave: 'è',
	ecirc: 'ê',
	agrave: 'à',
	ccedil: 'ç',
	ntilde: 'ñ',
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	mdash: '—',
	ndash: '–',
	hellip: '…',
}

export function decodeHtmlEntities(text: string): string {
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
		if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16))
		if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10))
		return NAMED_ENTITIES[entity] ?? match
	})
}

export function extractTitle(html: string): string {
	const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
	if (!match) return ''
	return decodeHtmlEntities(match[1]).replace(/\s+/g, ' ').trim()
}

const ASSET_EXTENSIONS = new Set([
	'gif',
	'jpg',
	'jpeg',
	'png',
	'bmp',
	'ico',
	'wav',
	'mid',
	'midi',
	'class',
	'css',
	'js',
	'swf',
	'mov',
	'avi',
])

function isMalformed(rawValue: string): boolean {
	return /[<>]|%3c|%3e/i.test(rawValue)
}

export function extractReferences(html: string, baseUrl: string): { pages: string[]; assets: string[] } {
	const pages = new Set<string>()
	const assets = new Set<string>()
	const re = /(?:href|src|background)\s*=\s*["']([^"']*)["']/gi
	let match: RegExpExecArray | null
	while ((match = re.exec(html))) {
		const raw = match[1].trim()
		if (!raw || raw.startsWith('#')) continue
		if (/^(javascript|mailto|tel):/i.test(raw)) continue
		if (isMalformed(raw)) continue

		let resolved: URL
		try {
			resolved = new URL(raw, baseUrl)
		} catch {
			continue
		}
		if (resolved.hostname !== 'xeniapolis.de') continue

		resolved.hash = ''
		const url = resolved.toString()
		const extMatch = resolved.pathname.match(/\.([a-z0-9]+)$/i)

		if (extMatch && ASSET_EXTENSIONS.has(extMatch[1].toLowerCase())) {
			assets.add(url)
		} else {
			// Anything not a recognized asset extension is treated as a page —
			// including extensionless paths and unrecognized extensions — so a
			// reachable URL is never silently dropped from the inventory.
			pages.add(url)
		}
	}
	return { pages: [...pages], assets: [...assets] }
}

export function isUnderConstruction(pathname: string): boolean {
	return /(^|\/)baustelle\.html?$/i.test(pathname)
}

function slugifyFile(file: string): string {
	return file.replace(/\.[^.]+$/, '').toLowerCase()
}

function pathSegments(pathname: string): string[] {
	return pathname.split('/').filter(Boolean)
}

export function computeTargetPath(pathname: string): { targetPath: string; notes: string } {
	const segments = pathSegments(pathname)
	const file = (segments[segments.length - 1] ?? '').toLowerCase()

	if (isUnderConstruction(pathname)) {
		return { targetPath: '', notes: 'Shared "under construction" placeholder — no content to migrate.' }
	}
	if (segments.length === 0 || (segments.length === 1 && /^index\.html?$/.test(file))) {
		return { targetPath: '', notes: 'Site root frameset — superseded by Fumadocs layout, not migrated as content.' }
	}
	if (/_frame\.html?$/.test(file) || /_menu\.html?$/.test(file) || /^menu\d*\.html?$/.test(file)) {
		return { targetPath: '', notes: 'Frame/menu navigation chrome — superseded by Fumadocs layout, not migrated as content.' }
	}
	if (VERIFIED_TARGETS[pathname]) {
		return { targetPath: VERIFIED_TARGETS[pathname], notes: 'Content matches an already-migrated page (verified by comparing text).' }
	}
	if (file === 'impress.html' && segments[0] === 'zen') {
		return {
			targetPath: 'src/content/docs/impressum.mdx',
			notes: 'There is only one Impressum site-wide, so it lives at the docs root rather than nested under xeniapolis/ (see src/content/docs/meta.json).',
		}
	}
	if (file === 'zenstart.html' && segments[0] === 'zen') {
		return {
			targetPath: 'src/content/docs/xeniapolis/index.mdx',
			notes:
				"Pure navigation chrome (image map + copyright footer), no unique prose. The Zentrum's welcome role is fulfilled by index.mdx, whose \"Was ist/bietet Xenia\" text is verbatim-sourced from and verified against ann/annstart.html.",
		}
	}

	const district = segments[0]
	const isDistrictPath = segments.length === 2 && (Object.hasOwn(DISTRICT_SLUGS, district) || district === 'zen')

	if (isDistrictPath) {
		if (/^viertel\d+\.html?$/.test(file)) {
			return {
				targetPath: 'src/content/docs/xeniapolis/annaeherung/die-stadtviertel-der-wissensstadt.mdx',
				notes:
					'Part of the cross-district Stadtviertel tour, duplicated per district folder on the source site; consolidated into one already-migrated overview page.',
			}
		}
		if (/^besuch\d+\.html?$/.test(file)) {
			return {
				targetPath: 'src/content/docs/xeniapolis/annaeherung/besuch-in-der-wissensstadt.mdx',
				notes:
					'Part of the cross-district Besuch-im-Zentrum tour, duplicated per district folder on the source site; consolidated into one already-migrated overview page.',
			}
		}
		if (district === 'ins' && !/^\w+start\.html?$/.test(file)) {
			return {
				targetPath: '',
				notes:
					'Medienspiegel / Präsentationen sub-page, not migrated individually — deferred to the archive ticket that follows #101, cross-referenced from inszenierung/index.mdx.',
			}
		}
		if (district === 'zen') {
			return {
				targetPath: `src/content/docs/xeniapolis/zentrum/${slugifyFile(file)}.mdx`,
				notes: 'Zentrum is not one of the 8 Stadtviertel — placed in its own top-level folder rather than the folder-per-Stadtviertel convention.',
			}
		}
		const slug = DISTRICT_SLUGS[district]
		if (/^\w+start\.html?$/.test(file)) {
			return { targetPath: `src/content/docs/xeniapolis/${slug}/index.mdx`, notes: '' }
		}
		return { targetPath: `src/content/docs/xeniapolis/${slug}/${slugifyFile(file)}.mdx`, notes: '' }
	}

	return {
		targetPath: '',
		notes: 'No target-path convention applies (outside the Stadtviertel/Zentrum structure, or a broken/duplicate nested link) — needs manual triage.',
	}
}

export async function crawlSite(startUrl: string, fetchPage: FetchPage): Promise<SourceMapRecord[]> {
	const visited = new Set<string>()
	const queue: string[] = [startUrl]
	const records: SourceMapRecord[] = []

	while (queue.length > 0) {
		const url = queue.shift()!
		if (visited.has(url)) continue
		visited.add(url)

		const { status, html } = await fetchPage(url)
		const title = html ? extractTitle(html) : ''
		let assets: string[] = []
		if (html) {
			const refs = extractReferences(html, url)
			assets = refs.assets
			for (const page of refs.pages) {
				if (!visited.has(page)) queue.push(page)
			}
		}

		const pathname = new URL(url).pathname
		const { targetPath, notes } = computeTargetPath(pathname)
		records.push({
			url,
			httpStatus: status,
			title,
			targetPath,
			assets,
			underConstruction: isUnderConstruction(pathname),
			notes,
		})
	}

	return records.sort((a, b) => a.url.localeCompare(b.url))
}

function districtOf(record: SourceMapRecord): string {
	const segments = pathSegments(new URL(record.url).pathname)
	return segments.length >= 2 ? segments[0] : '(root)'
}

export function renderMarkdownTable(records: SourceMapRecord[]): string {
	const groups = new Map<string, SourceMapRecord[]>()
	for (const record of records) {
		const key = districtOf(record)
		const group = groups.get(key) ?? []
		group.push(record)
		groups.set(key, group)
	}

	const lines: string[] = []
	for (const key of [...groups.keys()].sort()) {
		lines.push(`## ${key}`, '')
		lines.push('| URL | Status | Title | Target path | Assets | Under construction | Notes |')
		lines.push('| --- | --- | --- | --- | --- | --- | --- |')
		for (const record of groups.get(key)!) {
			const cell = (value: string): string => value.replace(/\|/g, '\\|')
			lines.push(
				`| ${cell(record.url)} | ${record.httpStatus} | ${cell(record.title)} | ${cell(record.targetPath || '—')} | ${record.assets.length} | ${record.underConstruction ? 'yes' : 'no'} | ${cell(record.notes || '—')} |`,
			)
		}
		lines.push('')
	}
	return lines.join('\n')
}

async function fetchPageLive(url: string): Promise<FetchedPage> {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), 15000)
	try {
		const res = await fetch(url, { signal: controller.signal, redirect: 'follow' })
		const contentType = res.headers.get('content-type') ?? ''
		if (!contentType.toLowerCase().includes('html')) {
			return { status: res.status, html: null }
		}
		const buffer = await res.arrayBuffer()
		const html = new TextDecoder('iso-8859-1').decode(buffer)
		return { status: res.status, html }
	} catch {
		return { status: 0, html: null }
	} finally {
		clearTimeout(timer)
	}
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`

if (isMain) {
	const records = await crawlSite(`${ORIGIN}/`, fetchPageLive)
	const scriptDir = dirname(fileURLToPath(import.meta.url))
	const outDir = join(scriptDir, '..', 'docs', 'reference')

	writeFileSync(join(outDir, 'xeniapolis-source-map.json'), `${JSON.stringify(records, null, 2)}\n`)

	const frontmatter = `---
name: Xeniapolis Source Map
description: Inventory of every reachable source URL on xeniapolis.de, crawled for the #92 migration, with its planned target MDX path.
tags: [xeniapolis, migration, source-map, inventory]
kind: reference
type: Reference
status: current
last_reviewed: ${new Date().toISOString().slice(0, 10)}
authoritative: true
---

`
	const intro = `# Xeniapolis Source Map

Generated by \`scripts/xeniapolis-source-map.ts\` from a live crawl of https://xeniapolis.de/, starting at the site root and following every \`href\`/\`src\`/\`background\` reference transitively (frame pages, menu pages, district start pages, and all numbered tour pages included). Re-run \`npx tsx scripts/xeniapolis-source-map.ts\` to regenerate both this table and \`xeniapolis-source-map.json\` (the machine-readable form of the same data — one record per row here).

${records.length} source URLs found, grouped below by their first path segment (district code, or \`(root)\` for top-level frame/menu/index files).

## Target path convention

- Each of the 8 Stadtviertel maps to its existing (or, for Märkte, not-yet-created) \`src/content/docs/xeniapolis/<slug>/\` folder; a district's \`<code>start.html\` is that folder's \`index.mdx\`.
- **Zentrum** (\`zen/\`) is not one of the 8 Stadtviertel (see \`docs/reference/glossary.md\`), so it gets its own \`xeniapolis/zentrum/\` folder rather than living inside the Stadtviertel convention.
- The numbered \`viertelN.html\` and \`besuchN.html\` tours are each duplicated verbatim inside every district folder on the source site; all copies of a tour point at that tour's single already-migrated overview page — \`annaeherung/die-stadtviertel-der-wissensstadt.mdx\` and \`annaeherung/besuch-in-der-wissensstadt.mdx\` respectively (the latter also absorbs \`ann/umgeb1.html\`, the Umgebung tour's closing stop).
- Some already-migrated MDX files aggregate several source pages into one (each \`##\` heading matches one source page's \`<title>\`): \`kon/ewelt2.html\`, \`ewelt2a.html\`–\`ewelt2h.html\` → \`konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx\`. \`ann/kurzueb1.html\`–\`kurzueb5.html\` used to follow the same pattern but were split in #98 into five ordered sibling pages (\`annaeherung/staetten-der-begegnung.mdx\` through \`annaeherung/xenia-im-netzwerk-der-wissensstaedte.mdx\`), sequenced via \`annaeherung/meta.json\` so Fumadocs prev/next provides the walk.
- \`ins/\`'s Medienspiegel and Präsentationen sub-pages (\`aufstz*\`, \`cebit*\`, \`meilen0\`, \`radio0\`, \`telepol0\`, \`web0\`, \`zeitun*\`) are not migrated individually — deferred to the archive ticket that follows #101, cross-referenced from \`inszenierung/index.mdx\`.
- Frame/menu chrome, the site's root frameset, and the shared \`baustelle.html\` placeholder have no target path — they're navigation/placeholder artifacts, not content.
- \`telepol/\` and \`~mib/\` are a separate, older "Telepolis" exhibition embedded in the same site, outside the Stadtviertel/Zentrum structure; they're flagged \`needs manual triage\` rather than assigned a path.
- A handful of nested URLs (e.g. \`kon/zen/zenstart.html\`) are broken/duplicate relative links already present on the source site — also flagged \`needs manual triage\`.

Full per-page asset lists live in \`xeniapolis-source-map.json\`; this table shows only the asset count per page.

`
	writeFileSync(join(outDir, 'xeniapolis-source-map.md'), frontmatter + intro + renderMarkdownTable(records))

	stdout.write(`Wrote ${records.length} records to docs/reference/xeniapolis-source-map.{json,md}\n`)
}
