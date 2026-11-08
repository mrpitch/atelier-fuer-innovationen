/**
 * Order for each Stadtrundgang and each Kontexte slide series, keyed by
 * tour slug. `Tour` (src/components/tour.tsx) looks up the current station's
 * position in this list to render "Station n von N" and the previous/next
 * links — see docs/reference/components.md.
 *
 * Kurzübersicht's stations 4 and 5 live under `fuehrung/`, not `annaeherung/`
 * (see src/content/docs/xeniapolis/annaeherung/index.mdx): the order below is
 * the one place that hop is expressed.
 */
export interface TourDefinition {
	slug: string
	stations: string[]
	/**
	 * Where the last station's "Nächste" leads once it leaves this tour's own
	 * stations — e.g. chapter 1's last slide continuing into
	 * konstellationen-beim-uebergang-zur-informationsgesellschaft, or chapter
	 * 3's last slide into chapter 4's overview. Without it, the last
	 * station's "Nächste" is disabled.
	 */
	exit?: string
}

// Each chapter folder under kontexte/ (#151) keeps the eight lettered
// sub-slides, in their original a-h order, as one Tour; the chapter's own
// overview page is not a station (it never was, even before the rename).
const KONTEXTE_1 =
	'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung'
const KONTEXTE_3 = '/docs/xeniapolis/kontexte/eine-welt-im-wandel'
const KONTEXTE_4 = '/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis'
const KONTEXTE_5 = '/docs/xeniapolis/kontexte/wandel-chaos-und-chance'
const KONTEXTE_6 =
	'/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren'
const KONTEXTE_7 =
	'/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation'
const KONTEXTE_8 = '/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk'

export const tours: TourDefinition[] = [
	{
		slug: 'kurzuebersicht',
		stations: [
			'/docs/xeniapolis/annaeherung/staetten-der-begegnung',
			'/docs/xeniapolis/annaeherung/kondratieffs-zyklen',
			'/docs/xeniapolis/annaeherung/aufbruch-zum-kontinent-der-loesungen',
			'/docs/xeniapolis/fuehrung/ateliers-fuer-innovatoren',
			'/docs/xeniapolis/fuehrung/xenia-im-netzwerk-der-wissensstaedte',
		],
	},
	{
		slug: 'besuch-in-der-wissensstadt',
		stations: ['/docs/xeniapolis/annaeherung/besuch-in-der-wissensstadt'],
		exit: '/docs/xeniapolis/annaeherung/umgebung',
	},
	{
		slug: 'die-stadtviertel-der-wissensstadt',
		stations: [
			'/docs/xeniapolis/annaeherung/die-stadtviertel-der-wissensstadt',
		],
	},
	{
		slug: 'umgebung',
		stations: ['/docs/xeniapolis/annaeherung/umgebung'],
	},
	{
		slug: 'ewelt1',
		stations: [
			`${KONTEXTE_1}/wandel-der-beschaeftigungsstruktur`,
			`${KONTEXTE_1}/das-informationale-babylon`,
			`${KONTEXTE_1}/beschuetzte-weisheit-geordnetes-staatswesen`,
			`${KONTEXTE_1}/die-mission-des-hl-franziskus`,
			`${KONTEXTE_1}/unternehmerische-engagements-im-visionaeren-vorfeld`,
			`${KONTEXTE_1}/xenia-stadt-des-wissens-und-staette-der-begegnung`,
			`${KONTEXTE_1}/potentiale-einer-stadt-des-wissens-nutzen`,
			`${KONTEXTE_1}/das-vor-bild-der-erfinderunternehmer`,
		],
		exit: '/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft',
	},
	{
		slug: 'ewelt3',
		stations: [
			`${KONTEXTE_3}/das-satori-konzept`,
			`${KONTEXTE_3}/eine-welt-der-probleme-und-revolutionen`,
			`${KONTEXTE_3}/die-gestaltungsfelder-der-problemloesungsgesellschaft`,
			`${KONTEXTE_3}/aufbruch-zum-kontinent-der-loesungen`,
			`${KONTEXTE_3}/die-erste-globale-revolution`,
			`${KONTEXTE_3}/megatrends-der-erfordernisse`,
			`${KONTEXTE_3}/gedanken`,
			`${KONTEXTE_3}/eine-programmatische-skizzierung`,
		],
		exit: KONTEXTE_4,
	},
	{
		slug: 'ewelt4',
		stations: [
			`${KONTEXTE_4}/lebensqualitaet-skala-der-beduerfnisse-und-der-beduerfnisbefriedigung`,
			`${KONTEXTE_4}/staedte-potentiale-und-probleme`,
			`${KONTEXTE_4}/die-wiederbelebung-der-polis`,
			`${KONTEXTE_4}/xenia-platz-der-zukunft`,
			`${KONTEXTE_4}/visionen-innovationen-paradigmen`,
			`${KONTEXTE_4}/gedankenkreise-fuer-eine-heisse-kreative-mischung`,
			`${KONTEXTE_4}/potential-defizit-balance-rechnung`,
			`${KONTEXTE_4}/eine-welt-kommt-in-bewegung`,
		],
	},
	{
		slug: 'ewelt5',
		stations: [
			`${KONTEXTE_5}/das-individuum-in-der-gemeinschaft`,
			`${KONTEXTE_5}/verantwortungsstrategien-auspraegungen-und-wirkungen`,
			`${KONTEXTE_5}/bifurkationen-bei-alternativen-weltmodellen`,
			`${KONTEXTE_5}/der-weg-ist-das-ziel`,
			`${KONTEXTE_5}/xenia-stadtplan-der-modernen-viertel`,
			`${KONTEXTE_5}/gestaltungsfelder-und-leitvorhaben`,
			`${KONTEXTE_5}/kontextwissen-und-faktenwissen`,
			`${KONTEXTE_5}/das-xenia-konzept`,
		],
	},
	{
		slug: 'ewelt6',
		stations: [
			`${KONTEXTE_6}/xenia-system-im-ueberblick`,
			`${KONTEXTE_6}/wissensrepraesentation-in-urbanem-ambiente`,
			`${KONTEXTE_6}/kontext-und-fokus-als-komplementaere-regulatoren`,
			`${KONTEXTE_6}/die-thematisch-methodische-inszenierung`,
			`${KONTEXTE_6}/das-fokusthema`,
			`${KONTEXTE_6}/der-innovative-support`,
			`${KONTEXTE_6}/mehrfach-weiterverwendbare-wissensbausteine`,
			`${KONTEXTE_6}/das-netzwerk-fuer-innovatoren`,
		],
	},
	{
		slug: 'ewelt7',
		stations: [
			`${KONTEXTE_7}/das-xenia-konzept-vorbereitete-komplexe`,
			`${KONTEXTE_7}/handlungsszenario-wissensstaedte-und-oder-datenautobahnen`,
			`${KONTEXTE_7}/kontextszenario-die-leerstelle`,
			`${KONTEXTE_7}/das-leitbild-entstehung-und-perspektiven-der-erweiterung`,
			`${KONTEXTE_7}/das-applikationenszenario`,
			`${KONTEXTE_7}/das-portfolio-fuer-innovationen`,
			`${KONTEXTE_7}/das-potentialeportfolio`,
			`${KONTEXTE_7}/das-unternehmerische-programm`,
		],
	},
	{
		slug: 'ewelt8',
		stations: [
			`${KONTEXTE_8}/innovative-herausforderungen-aus-sicht-der-fuehrung`,
			`${KONTEXTE_8}/expo-2000-mehr-markttransparenz-fuer-innovationen`,
			`${KONTEXTE_8}/kybernetischer-ansatz-zur-systembeherrschung`,
			`${KONTEXTE_8}/xenia-festival-futur`,
			`${KONTEXTE_8}/wege-zur-informationsgesellschaft`,
			`${KONTEXTE_8}/makro-gestaltungspotentiale-des-wandels`,
			`${KONTEXTE_8}/halb-voll-oder-halb-leer`,
			`${KONTEXTE_8}/unternehmerische-perspektiven-mit-xenia`,
		],
	},
]

export interface ResolvedStation {
	index: number
	total: number
	previous?: string
	next?: string
}

/**
 * Looks up `station`'s position within `tour` and resolves its
 * previous/next hrefs, folding in the tour's `exit` for the last station.
 * Pure data lookup, kept free of React/Next imports so it can be unit
 * tested directly (see tours.test.ts).
 */
export function resolveStation(
	tour: string,
	station: string
): ResolvedStation | undefined {
	const definition = tours.find((candidate) => candidate.slug === tour)
	if (!definition) return undefined

	const index = definition.stations.indexOf(station)
	if (index === -1) return undefined

	const total = definition.stations.length
	const isLast = index === total - 1

	return {
		index,
		total,
		previous: index > 0 ? definition.stations[index - 1] : undefined,
		next: isLast ? definition.exit : definition.stations[index + 1],
	}
}
