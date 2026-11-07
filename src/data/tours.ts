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
}

const KONTEXTE_SERIES = [1, 3, 4, 5, 6, 7, 8]
const KONTEXTE_SLIDES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

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
	})),
]
