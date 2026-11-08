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
	 * stations — e.g. ewelt1h continuing into
	 * konstellationen-beim-uebergang-zur-informationsgesellschaft, or ewelt3h
	 * into ewelt4. Without it, the last station's "Nächste" is disabled.
	 */
	exit?: string
}

const KONTEXTE_SERIES = [1, 3, 4, 5, 6, 7, 8]
const KONTEXTE_SLIDES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const KONTEXTE_EXIT: Record<number, string> = {
	1: '/docs/xeniapolis/kontexte/konstellationen-beim-uebergang-zur-informationsgesellschaft',
	3: '/docs/xeniapolis/kontexte/ewelt4',
}

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
	...KONTEXTE_SERIES.map((n) => ({
		slug: `ewelt${n}`,
		stations: KONTEXTE_SLIDES.map(
			(letter) => `/docs/xeniapolis/kontexte/ewelt${n}${letter}`
		),
		exit: KONTEXTE_EXIT[n],
	})),
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
