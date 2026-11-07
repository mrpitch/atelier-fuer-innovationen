#!/usr/bin/env -S npx tsx
/**
 * xeniapolis-source-map: crawl xeniapolis.de and produce a checked-in inventory
 * of every reachable source URL, so the #92 migration's completeness is
 * verifiable rather than asserted.
 *
 * Usage:
 *   pnpm exec tsx scripts/xeniapolis-source-map.ts
 *
 * Writes docs/reference/xeniapolis-source-map.json and .md from a live crawl
 * of https://xeniapolis.de/.
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { stdout } from 'node:process'
import { fileURLToPath } from 'node:url'

/**
 * Every record ends up in exactly one disposition:
 * - `migrated`: HTTP 200 content page with an existing MDX `targetPath`.
 * - `under-construction`: the shared `baustelle.html` placeholder.
 * - `chrome`: frame/menu navigation or the root frameset, superseded by the
 *   Fumadocs layout; no `targetPath`.
 * - `http-error`: the source answers with a non-200 status; nothing to migrate.
 * - `unmapped`: HTTP 200 content with no target assigned yet. A checked-in map
 *   must contain none.
 */
export type Disposition =
	| 'migrated'
	| 'under-construction'
	| 'chrome'
	| 'http-error'
	| 'unmapped'

export interface SourceMapRecord {
	url: string
	httpStatus: number
	title: string
	targetPath: string
	assets: string[]
	underConstruction: boolean
	disposition: Disposition
	notes: string
}

export interface FetchedPage {
	status: number
	html: string | null
}

export type FetchPage = (url: string) => Promise<FetchedPage>

const ORIGIN = 'https://xeniapolis.de'
const CONTENT_ROOT = 'src/content/docs'

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

interface TargetGroup {
	// Directory under src/content/docs that the `targets` values are relative to.
	base: string
	note: string
	// Source pathname -> target file relative to `base`.
	targets: Record<string, string>
}

// Explicit overrides for source pages whose target is not derivable from the
// URL: renamed pages, pages aggregated into one MDX file, and the archive.
// Pages that follow the folder-per-Stadtviertel convention (including the
// kon/ewelt* tour pages and the wer/ partner and team bios) need no entry;
// see computeTargetPath.
const TARGET_GROUPS: TargetGroup[] = [
	{
		base: 'xeniapolis',
		note: 'Content matches an already-migrated page (verified by comparing text).',
		targets: {
			'/mar/marstart.html': 'maerkte/idee-kontakt-begegnungen.mdx',
			'/ann/kurzueb1.html': 'annaeherung/staetten-der-begegnung.mdx',
			'/ann/kurzueb2.html': 'annaeherung/kondratieffs-zyklen.mdx',
			'/ann/kurzueb3.html':
				'annaeherung/aufbruch-zum-kontinent-der-loesungen.mdx',
			'/ann/kurzueb4.html': 'fuehrung/ateliers-fuer-innovatoren.mdx',
			'/ann/kurzueb5.html': 'fuehrung/xenia-im-netzwerk-der-wissensstaedte.mdx',
			'/kon/ewelt2.html':
				'kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
			'/kon/ewelt2a.html':
				'kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
			'/kon/ewelt2b.html':
				'kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
			'/kon/ewelt2c.html':
				'kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
			'/kon/ewelt2d.html':
				'kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
			'/kon/ewelt2e.html':
				'kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
			'/kon/ewelt2f.html':
				'kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
			'/kon/ewelt2g.html':
				'kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
			'/kon/ewelt2h.html':
				'kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft.mdx',
			'/wer/idee0.html': 'wertschoepfung/die-idee.mdx',
			'/wer/gesch0.html': 'wertschoepfung/projektgeschichte.mdx',
			'/wer/arbeit0.html': 'wertschoepfung/forschungsarbeit.mdx',
			'/wer/plan0.html': 'wertschoepfung/forschungsarbeit.mdx',
			'/wer/werist0.html': 'wertschoepfung/mitwirkende.mdx',
			'/pot/msk01.html': 'potenziale/mosaik/msk-01.mdx',
			'/pot/msk02.html': 'potenziale/mosaik/msk-02.mdx',
			'/pot/msk03.html': 'potenziale/mosaik/msk-03.mdx',
			'/pot/msk04.html': 'potenziale/mosaik/msk-04.mdx',
			'/pot/msk05.html': 'potenziale/mosaik/msk-05.mdx',
			'/pot/msk06.html': 'potenziale/mosaik/msk-06.mdx',
			'/pot/msk07.html': 'potenziale/mosaik/msk-07.mdx',
			'/pot/msk08.html': 'potenziale/mosaik/msk-08.mdx',
			'/pot/msk09.html': 'potenziale/mosaik/msk-09.mdx',
			'/pot/msk10.html': 'potenziale/mosaik/msk-10.mdx',
			'/pot/msk11.html': 'potenziale/mosaik/msk-11.mdx',
			'/pot/msk12.html': 'potenziale/mosaik/msk-12.mdx',
			'/pot/msk13.html': 'potenziale/mosaik/msk-13.mdx',
			'/pot/msk14.html': 'potenziale/mosaik/msk-14.mdx',
			'/pot/msk15.html': 'potenziale/mosaik/msk-15.mdx',
			'/pot/msk16.html': 'potenziale/mosaik/msk-16.mdx',
			'/pot/msk17.html': 'potenziale/mosaik/msk-17.mdx',
			'/pot/lit0.html': 'potenziale/mosaik/literatur.mdx',
			'/pot/inh0.html': 'potenziale/mosaik/register.mdx',
			'/fue/netzw0.html': 'fuehrung/netzwerk-der-innovatoren.mdx',
		},
	},
	{
		base: 'xeniapolis/archiv',
		note: 'Section index page, migrated verbatim into the Xeniapolis archive as dated source material (centered on the 1995/96 breakthrough, spanning 1991–1997 once Medienspiegel is counted), outside the Stadtviertel structure.',
		targets: {
			'/ins/meilen0.html': 'medienspiegel.mdx',
			'/ins/zeitun0.html': 'medienspiegel.mdx',
			'/ins/radio0.html': 'medienspiegel.mdx',
			'/ins/web0.html': 'medienspiegel.mdx',
			'/ins/aufstz0.html': 'praesentationen.mdx',
			'/ins/cebit0.html': 'cebit-95.mdx',
			'/ins/telepol0.html': 'telepolis/index.mdx',
		},
	},
	{
		base: 'xeniapolis/archiv/aufsaetze',
		note: 'Verbatim transcription of one Aufsatz, Vortrag or Klappentext listed on the Präsentationen page.',
		targets: {
			'/ins/aufstz02.html': '02-impressionen-zum-leitbild.mdx',
			'/ins/aufstz03.html': '03-ueber-datenautobahnen-spricht-man-nicht.mdx',
			'/ins/aufstz04.html': '04-wandel-der-innovationskultur.mdx',
			'/ins/aufstz05.html':
				'05-staedte-des-wissens-metropolen-der-informationsgesellschaft.mdx',
			'/ins/aufstz06.html': '06-zukunft-und-kulturelles-gedaechtnis.mdx',
			'/ins/aufstz08.html': '08-der-grosse-basar.mdx',
			'/ins/aufstz09.html':
				'09-die-stadt-des-wissens-als-staette-der-begegnung.mdx',
			'/ins/aufstz10.html':
				'10-die-wiederbelebung-der-polis-mit-den-staedten-des-wissens.mdx',
			'/ins/aufstz11.html':
				'11-die-polis-als-leitbild-fuer-den-wandel-der-innovationskultur.mdx',
			'/ins/aufstz13.html':
				'13-technologiemanagement-in-der-informationsindustrie.mdx',
			'/ins/aufstz14.html':
				'14-wieviel-umweltschutz-braucht-die-wirtschaft.mdx',
			'/ins/aufstz15.html':
				'15-die-wiederbelebung-der-polis-unternehmen-buerger-und-kommunen.mdx',
			'/ins/aufstz17.html': '17-die-zukunft-unternehmen.mdx',
			'/ins/aufstz18.html': '18-verantwortung-im-umgang-mit-technologie.mdx',
			'/ins/aufstz19.html': '19-gefragt-sind-visionen-keine-ideologien.mdx',
			'/ins/aufstz23.html': '23-die-gastgeschenke.mdx',
			'/ins/aufstz24.html': '24-die-wiederbelebung-der-polis-manuskript.mdx',
			'/ins/aufstz25.html':
				'25-information-als-wertschoepfungs-gestaltungs-und-operationsfaktor.mdx',
			'/ins/aufstz26.html': '26-chancen-denken-lernen.mdx',
			'/ins/aufstzb1.html': 'abakus.mdx',
			'/ins/aufstzb2.html': 'informationsmarkt.mdx',
			'/ins/aufstze5.html': 'cities-of-knowledge.mdx',
		},
	},
	{
		base: 'xeniapolis/archiv/aufsaetze',
		note: 'Source page holds only a title and a notice ("under construction" or "nicht vorhanden"); migrated as a stub page that records this.',
		targets: {
			'/ins/aufstz01.html': '01-staedte-erleben-und-wissen-gewinnen.mdx',
			'/ins/aufstz12.html': '12-aufbruch-zum-kontinent-der-loesungen.mdx',
			'/ins/aufstz20.html': '20-vom-nutzen-der-zukunftsforschung.mdx',
			'/ins/aufstz21.html': '21-mehr-als-informationsgesellschaft.mdx',
		},
	},
	{
		base: 'xeniapolis/archiv/cebit',
		note: "CeBIT '95 sub-page, migrated verbatim into the archive.",
		targets: {
			'/ins/cebit1.html': '01-die-ausstellung.mdx',
			'/ins/cebit2.html': '02-impressionen.mdx',
			'/ins/cebit3.html': '03-stimmen-zu-xenia.mdx',
			'/ins/cebit4.html': '04-das-goldene-buch.mdx',
			'/ins/cebit5.html': '05-rueckblick-zfe-aktuell.mdx',
		},
	},
	{
		base: 'xeniapolis/archiv/zeitungen',
		note: 'Press clipping from the Medienspiegel, migrated verbatim into the archive; numbering follows the source file names.',
		targets: {
			'/ins/zeitun01.html': '01-tempo-spinner-vom-dienst.mdx',
			'/ins/zeitun02.html': '02-manager-magazin-das-letzte-experiment.mdx',
			'/ins/zeitun03.html': '03-manager-magazin-lizenz-zum-spinnen.mdx',
			'/ins/zeitun04.html': '04-merchants-of-vision.mdx',
			'/ins/zeitun05.html':
				'05-hannoversche-allgemeine-der-hauptberufliche-visionaer.mdx',
			'/ins/zeitun06.html': '06-sueddeutsche-orakel-und-navigation.mdx',
			'/ins/zeitun07a.html': '07-sni-in-nrw-staedte-des-wissens.mdx',
			'/ins/zeitun08.html': '08-handelsblatt-stadt-der-1000-kreuzungen.mdx',
			'/ins/zeitun09.html':
				'09-hannoversche-allgemeine-wissensstadt-zur-expo-2000.mdx',
			'/ins/zeitun10.html': '10-hannoversche-allgemeine-chancen-2000.mdx',
			'/ins/zeitun11.html':
				'11-neue-presse-in-der-stadt-des-wissens-lernen.mdx',
			'/ins/zeitun12.html': '12-neue-presse-xenia-soll-bleiben.mdx',
			'/ins/zeitun13.html': '13-neue-presse-frust-ueber-expo-zankerei.mdx',
			'/ins/zeitun15.html': '15-screen-multimedia-allgegenwaertiger-campus.mdx',
			'/ins/zeitun18.html': '18-spiegel-meine-chaos-chance.mdx',
			'/ins/zeitun19.html': '19-spiegel-editorial.mdx',
			'/ins/zeitun20.html': '20-spiegel-hochdotiertes-missverstaendnis.mdx',
			'/ins/zeitun21.html':
				'21-muenchner-merkur-mit-bauklotzen-aus-der-krise.mdx',
			'/ins/zeitun22.html': '22-wiener-kurier-ich-bin-hier-der-spinner.mdx',
			'/ins/zeitun23.html':
				'23-badische-zeitung-ergebnis-von-zehn-jahren-denkarbeit.mdx',
			'/ins/zeitun24.html': '24-kleine-zeitung-spinner-vom-dienst.mdx',
			'/ins/zeitun25.html': '25-sueddeutsche-ein-mann-spinnt.mdx',
		},
	},
	{
		base: 'xeniapolis/archiv/telepolis',
		note: 'Page of the older Telepolis exhibition embedded in the source site, migrated into the archive.',
		targets: {
			'/telepol/1.htm':
				'wissensarchitekturen/01-nachbildungen-von-gestalten.mdx',
			'/telepol/10.htm': 'wissensarchitekturen/10-abstrakte-gestaltgebung.mdx',
			'/telepol/11.htm': 'wissensarchitekturen/11-abstrakte-vernetzung.mdx',
			'/telepol/12.htm': 'wissensarchitekturen/12-abstrakte-ensembles.mdx',
			'/telepol/2.htm':
				'wissensarchitekturen/02-flaechenhafte-darstellungen.mdx',
			'/telepol/3.htm':
				'wissensarchitekturen/03-referentielle-strukturierungen.mdx',
			'/telepol/4.htm':
				'wissensarchitekturen/04-behaelterartige-anordnungsformen.mdx',
			'/telepol/5.htm': 'wissensarchitekturen/05-aussenarchitektur.mdx',
			'/telepol/6.htm': 'wissensarchitekturen/06-bauliche-ensembles.mdx',
			'/telepol/7.htm': 'wissensarchitekturen/07-strassen-und-plaetze.mdx',
			'/telepol/8.htm':
				'wissensarchitekturen/08-landschaften-und-parkanlagen.mdx',
			'/telepol/9.htm': 'wissensarchitekturen/09-kontextfirmament.mdx',
			'/telepol/ann.htm': 'stadtviertel/annaeherung.mdx',
			'/telepol/atelier.htm': 'atelier-fuer-innovatoren.mdx',
			'/telepol/buch.htm': 'netzwerk-fuer-innovatoren/gaestebuch.mdx',
			'/telepol/fue.htm': 'stadtviertel/fuehrung.mdx',
			'/telepol/history.htm': 'netzwerk-fuer-innovatoren/projekthistorie.mdx',
			'/telepol/innovato.htm': 'netzwerk-fuer-innovatoren/index.mdx',
			'/telepol/ins.htm': 'stadtviertel/inszenierung.mdx',
			'/telepol/kon.htm': 'stadtviertel/kontext.mdx',
			'/telepol/koo.htm': 'stadtviertel/kooperation.mdx',
			'/telepol/kulturen.htm': 'kulturen-des-wissens.mdx',
			'/telepol/leitbild.htm': 'leitbild.mdx',
			'/telepol/messe.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/01-platz-der-zukunft.mdx',
			'/telepol/mr10.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/10-braess.mdx',
			'/telepol/mr11.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/11-hiltrud-schroeder.mdx',
			'/telepol/mr12.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/12-eckhart-bartels.mdx',
			'/telepol/mr13.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/13-junge-besucher.mdx',
			'/telepol/mr14.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/14-engelbert-und-volkmann.mdx',
			'/telepol/mr15.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/15-messeigel.mdx',
			'/telepol/mr2.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/02-besucher-chancen-2000.mdx',
			'/telepol/mr3.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/03-franz-alt.mdx',
			'/telepol/mr4.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/04-rita-suessmuth.mdx',
			'/telepol/mr5.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/05-ruettgers.mdx',
			'/telepol/mr6.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/06-willy-leonhard.mdx',
			'/telepol/mr7.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/07-mediencafe-halle-15.mdx',
			'/telepol/mr8.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/08-chinesische-wissenschaftsdelegation.mdx',
			'/telepol/mr9.htm':
				'netzwerk-fuer-innovatoren/messerueckblick/09-ensemble-der-medien.mdx',
			'/telepol/netzwerk.htm': 'netzwerk-der-staedte-des-wissens.mdx',
			'/telepol/partner.htm':
				'netzwerk-fuer-innovatoren/kooperationspartner.mdx',
			'/telepol/publikat.htm': 'netzwerk-fuer-innovatoren/publikationen.mdx',
			'/telepol/res.htm': 'stadtviertel/ressourcen.mdx',
			'/telepol/schwer1.htm': 'themenschwerpunkte/01-xenia-wissensstadt.mdx',
			'/telepol/schwer2.htm':
				'themenschwerpunkte/02-netzwerk-der-innovatoren.mdx',
			'/telepol/schwer3.htm': 'themenschwerpunkte/03-staedte-des-wissens.mdx',
			'/telepol/schwer4.htm':
				'themenschwerpunkte/04-wiederbelebung-der-polis.mdx',
			'/telepol/schwer5.htm': 'themenschwerpunkte/05-gestaltungsfelder.mdx',
			'/telepol/schwer6.htm':
				'themenschwerpunkte/06-leitvorhaben-und-projekte.mdx',
			'/telepol/schwer7.htm':
				'themenschwerpunkte/07-ressourcen-der-zukunftsgestaltung.mdx',
			'/telepol/schwer8.htm':
				'themenschwerpunkte/08-unternehmerische-herausforderungen.mdx',
			'/telepol/schwer9.htm': 'themenschwerpunkte/09-arbeiten-im-atelier.mdx',
			'/telepol/schwerpu.htm': 'themenschwerpunkte/index.mdx',
			'/telepol/skizze.htm': 'programmatische-skizzierung.mdx',
			'/telepol/wer.htm': 'stadtviertel/wertschoepfung.mdx',
			'/telepol/wissensa.htm': 'wissensarchitekturen/index.mdx',
			'/telepol/wissenss.htm':
				'wissensstadt-am-wege-zur-informationsgesellschaft.mdx',
			'/telepol/xenia.htm': 'willkommen.mdx',
			'/telepol/xeniaueb.htm': 'uebersicht.mdx',
			'/telepol/zen.htm': 'stadtviertel/zentrum.mdx',
			'/telepol/zuk.htm': 'stadtviertel/zukunft.mdx',
		},
	},
	{
		base: 'xeniapolis',
		note: 'Renamed to a human-readable slug rather than keeping the mechanical basename.',
		targets: {
			'/ann/umgeb1.html': 'annaeherung/umgebung.mdx',
		},
	},
	{
		base: '',
		note: 'There is only one Impressum site-wide, so it lives at the docs root rather than nested under xeniapolis/ (see src/content/docs/meta.json).',
		targets: {
			'/zen/impress.html': 'impressum.mdx',
		},
	},
	{
		base: 'xeniapolis',
		note: 'Pure navigation chrome (image map + copyright footer), no unique prose. The Zentrum\'s welcome role is fulfilled by index.mdx, whose "Was ist/bietet Xenia" text is verbatim-sourced from and verified against ann/annstart.html.',
		targets: {
			'/zen/zenstart.html': 'index.mdx',
		},
	},
]

const TARGET_OVERRIDES = new Map<string, { targetPath: string; notes: string }>(
	TARGET_GROUPS.flatMap(({ base, note, targets }) =>
		Object.entries(targets).map(([pathname, file]) => [
			pathname,
			{ targetPath: join(CONTENT_ROOT, base, file), notes: note },
		])
	)
)

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
	return text.replace(
		/&(#x[0-9a-f]+|#\d+|[a-zA-Z]+);/g,
		(match, entity: string) => {
			if (entity.startsWith('#x'))
				return String.fromCodePoint(parseInt(entity.slice(2), 16))
			if (entity.startsWith('#'))
				return String.fromCodePoint(parseInt(entity.slice(1), 10))
			return NAMED_ENTITIES[entity] ?? match
		}
	)
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

export function extractReferences(
	html: string,
	baseUrl: string
): { pages: string[]; assets: string[] } {
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

const CHROME_NOTE =
	'Frame/menu navigation chrome — superseded by Fumadocs layout, not migrated as content.'
const ROOT_NOTE =
	'Site root frameset — superseded by Fumadocs layout, not migrated as content.'

type Classified = Pick<SourceMapRecord, 'targetPath' | 'notes' | 'disposition'>

function chromeNote(pathname: string): string | null {
	const segments = pathSegments(pathname)
	const file = (segments[segments.length - 1] ?? '').toLowerCase()
	if (
		segments.length === 0 ||
		(segments.length === 1 && /^index\.html?$/.test(file))
	) {
		return ROOT_NOTE
	}
	if (
		/_frame\.html?$/.test(file) ||
		/_menu\.html?$/.test(file) ||
		/^menu\d*\.html?$/.test(file)
	) {
		return CHROME_NOTE
	}
	return null
}

export function computeTargetPath(
	pathname: string,
	httpStatus = 200
): Classified {
	if (httpStatus !== 200) {
		return {
			targetPath: '',
			notes: `Source returns HTTP ${httpStatus} — nothing to migrate.`,
			disposition: 'http-error',
		}
	}
	if (isUnderConstruction(pathname)) {
		return {
			targetPath: '',
			notes:
				'Shared "under construction" placeholder — no content to migrate; the five interactive features that linked to it (Gästebuch, Xenia-Tribune, Xenia-Ideenbox, Xenia-Weblink, Xenia-Newsgroup) plus zukstart.html\'s two sub-pages (Das XENIA-System, Der Arbeitsprozeß) are recorded as never-built plans in xeniapolis/archiv/nie-gebaute-features.mdx.',
			disposition: 'under-construction',
		}
	}
	const superseded = chromeNote(pathname)
	if (superseded) {
		return { targetPath: '', notes: superseded, disposition: 'chrome' }
	}
	const override = TARGET_OVERRIDES.get(pathname)
	if (override) return { ...override, disposition: 'migrated' }

	const segments = pathSegments(pathname)
	const file = (segments[segments.length - 1] ?? '').toLowerCase()
	const district = segments[0]
	const isDistrictPath =
		segments.length === 2 &&
		(Object.hasOwn(DISTRICT_SLUGS, district) || district === 'zen')

	if (isDistrictPath) {
		const migrated = (targetPath: string, notes = ''): Classified => ({
			targetPath,
			notes,
			disposition: 'migrated',
		})
		if (/^viertel\d+\.html?$/.test(file)) {
			return migrated(
				'src/content/docs/xeniapolis/annaeherung/die-stadtviertel-der-wissensstadt.mdx',
				'Part of the cross-district Stadtviertel tour, duplicated per district folder on the source site; consolidated into one already-migrated overview page.'
			)
		}
		if (/^besuch\d+\.html?$/.test(file)) {
			return migrated(
				'src/content/docs/xeniapolis/annaeherung/besuch-in-der-wissensstadt.mdx',
				'Part of the cross-district Besuch-im-Zentrum tour, duplicated per district folder on the source site; consolidated into one already-migrated overview page.'
			)
		}
		if (district === 'zen') {
			return migrated(
				`src/content/docs/xeniapolis/zentrum/${slugifyFile(file)}.mdx`,
				'Zentrum is not one of the 8 Stadtviertel — placed in its own top-level folder rather than the folder-per-Stadtviertel convention.'
			)
		}
		const slug = DISTRICT_SLUGS[district]
		if (/^\w+start\.html?$/.test(file)) {
			return migrated(`src/content/docs/xeniapolis/${slug}/index.mdx`)
		}
		return migrated(
			`src/content/docs/xeniapolis/${slug}/${slugifyFile(file)}.mdx`
		)
	}

	return {
		targetPath: '',
		notes:
			'No target path assigned — add the page to TARGET_GROUPS or extend computeTargetPath.',
		disposition: 'unmapped',
	}
}

export async function crawlSite(
	startUrl: string,
	fetchPage: FetchPage
): Promise<SourceMapRecord[]> {
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
		const { targetPath, notes, disposition } = computeTargetPath(
			pathname,
			status
		)
		records.push({
			url,
			httpStatus: status,
			title,
			targetPath,
			assets,
			underConstruction: isUnderConstruction(pathname),
			disposition,
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
		lines.push(
			'| URL | Status | Title | Target path | Assets | Under construction | Disposition | Notes |'
		)
		lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
		for (const record of groups.get(key)!) {
			const cell = (value: string): string => value.replace(/\|/g, '\\|')
			lines.push(
				`| ${cell(record.url)} | ${record.httpStatus} | ${cell(record.title)} | ${cell(record.targetPath || '—')} | ${record.assets.length} | ${record.underConstruction ? 'yes' : 'no'} | ${record.disposition} | ${cell(record.notes || '—')} |`
			)
		}
		lines.push('')
	}
	return lines.join('\n')
}

export function renderDispositionCounts(records: SourceMapRecord[]): string {
	const order: Array<[Disposition, string]> = [
		['migrated', 'Migrated to an existing MDX page (`targetPath` set)'],
		['under-construction', 'Under construction (`baustelle.html`)'],
		['chrome', 'Frame/menu chrome or root frameset, superseded'],
		['http-error', 'Source answers with a non-200 status'],
		['unmapped', 'HTTP 200 content without a target (must be zero)'],
	]
	const lines = ['| Disposition | Meaning | Records |', '| --- | --- | --- |']
	for (const [disposition, meaning] of order) {
		const count = records.filter((r) => r.disposition === disposition).length
		lines.push(`| \`${disposition}\` | ${meaning} | ${count} |`)
	}
	return lines.join('\n')
}

async function fetchPageLive(url: string): Promise<FetchedPage> {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), 15000)
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			redirect: 'follow',
		})
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

const isMain =
	process.argv[1] && import.meta.url === `file://${process.argv[1]}`

if (isMain) {
	const records = await crawlSite(`${ORIGIN}/`, fetchPageLive)
	const unreachable = records.filter((r) => r.httpStatus === 0)
	if (unreachable.length > 0) {
		throw new Error(
			`Crawl failed (network error or timeout) for ${unreachable.length} URL(s); re-run. First: ${unreachable[0].url}`
		)
	}
	const scriptDir = dirname(fileURLToPath(import.meta.url))
	const outDir = join(scriptDir, '..', 'docs', 'reference')

	writeFileSync(
		join(outDir, 'xeniapolis-source-map.json'),
		`${JSON.stringify(records, null, 2)}\n`
	)

	const frontmatter = `---
title: Xeniapolis source map
description: Inventory of every reachable source URL on xeniapolis.de with its HTTP status, disposition and target MDX path, so the #92 migration's completeness is verifiable.
type: reference
status: stable
tags: [xeniapolis, migration, source-map, inventory]
last_reviewed: ${new Date().toISOString().slice(0, 10)}
authoritative: true
---

`
	const intro = `# Xeniapolis source map

Generated by \`scripts/xeniapolis-source-map.ts\` from a live crawl of https://xeniapolis.de/, starting at the site root and following every \`href\`/\`src\`/\`background\` reference transitively. Regenerate this table and \`xeniapolis-source-map.json\` (the machine-readable form, one record per row) with \`pnpm exec tsx scripts/xeniapolis-source-map.ts\`, then run \`pnpm exec prettier --write docs/reference/xeniapolis-source-map.*\`.

${records.length} source URLs found, grouped below by their first path segment (district code, or \`(root)\` for top-level frame/menu/index files).

## Completeness

Every record has exactly one disposition:

${renderDispositionCounts(records)}

Migration is complete when every \`migrated\` record's \`targetPath\` exists and no record is \`unmapped\`. \`scripts/xeniapolis-source-map.test.ts\` asserts this against the checked-in \`xeniapolis-source-map.json\`.

HTTP 404 records have no target; their note reads \`Source returns HTTP 404 — nothing to migrate.\` They include the nested \`kon/<district>/<district>start.html\` duplicates (broken relative links on the source site), \`.html\` twins of Telepolis \`.htm\` pages, the \`telepol/Stadtv/*b.htm\` detail pages, and the whole \`~mib/\` tree.

## Target path convention

- Each of the 8 Stadtviertel maps to \`src/content/docs/xeniapolis/<slug>/\`; a district's \`<code>start.html\` is that folder's \`index.mdx\`, and every other page maps to \`<file>.mdx\` in the same folder. This covers the \`kon/ewelt*\` tour pages and the \`wer/\` partner and team bios.
- **Zentrum** (\`zen/\`) is not one of the 8 Stadtviertel (see \`docs/reference/glossary.md\`), so it gets its own \`xeniapolis/zentrum/\` folder.
- The numbered \`viertelN.html\` and \`besuchN.html\` tours are duplicated verbatim inside every district folder on the source site; all copies point at the single overview page \`annaeherung/die-stadtviertel-der-wissensstadt.mdx\` or \`annaeherung/besuch-in-der-wissensstadt.mdx\`.
- Renamed and aggregated pages are listed explicitly in \`TARGET_GROUPS\` in the generator: \`ann/kurzueb1–5\`, \`ann/umgeb1\` (\`annaeherung/umgebung.mdx\`), \`kon/ewelt2*\` (one aggregated page), \`wer/{idee0,gesch0,arbeit0,plan0,werist0}\`, \`pot/msk01–17\`, \`pot/lit0\`, \`pot/inh0\` (the \`potenziale/mosaik/\` folder), \`fue/netzw0\` and \`mar/marstart\`.
- \`ins/\` section index pages (Medienspiegel, Präsentationen, CeBIT, Telepolis) and their sub-items live in \`xeniapolis/archiv/\`: \`aufsaetze/\` (\`ins/aufstz*\`), \`cebit/\` (\`ins/cebit1–5\`), \`zeitungen/\` (\`ins/zeitun*\`) and \`telepolis/\` (\`ins/telepol0\` and the older Telepolis exhibition under \`telepol/\`).
- Frame/menu chrome and the root frameset are superseded by the Fumadocs layout. The shared \`baustelle.html\` placeholder has no content; the features that linked to it (Gästebuch, Xenia-Tribune, Xenia-Ideenbox, Xenia-Weblink, Xenia-Newsgroup, plus \`zuk/zukstart.html\`'s two sub-pages) are recorded as never-built plans in \`xeniapolis/archiv/nie-gebaute-features.mdx\`.

Full per-page asset lists live in \`xeniapolis-source-map.json\`; this table shows only the asset count per page.

`
	writeFileSync(
		join(outDir, 'xeniapolis-source-map.md'),
		frontmatter + intro + renderMarkdownTable(records)
	)

	stdout.write(
		`Wrote ${records.length} records to docs/reference/xeniapolis-source-map.{json,md}\n`
	)
}
