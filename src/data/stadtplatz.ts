import stadtviertelData from '@/data/stadtviertel.json'

/**
 * Original link labels from the Stadtplatz entry page of the source site
 * (xeniapolis.de/zen/zenstart.html, fetched 2026-11-07), keyed by the
 * stadtviertel.json slug they resolve to. "Netzzwerk" (sic) is the source
 * page's own spelling of the Führung link.
 */
const originalLabel: Record<string, string> = {
	annaeherung: 'Annäherung: Was ist und bietet Xenia?',
	maerkte: 'Märkte und Kooperation: Ideen, Kontakte, Begegnung',
	kontexte: 'Kontexte: XENIA-Thema "Eine Welt für morgen"',
	inszenierung: 'Inszenierung: Präsentationen von Xenia und Medienspiegel',
	zukunft: 'Zukunft: XENIA-Thema "Futursysteme"',
	wertschoepfung: 'Wertschöpfung: Das Projekt Xenia',
	potenziale: 'Potentiale: Xenia-Kollektion-Mosaik',
	fuehrung: 'Führung: XENIA-Thema: "Netzzwerk der Innovatoren"',
}

/**
 * Position (percent of the 640x350 viewBox) of each district's building in
 * public/illus/modell-zentrum.svg, read off the drawing's own polygon
 * clusters, left to right — the walking order the "Stadtführer" quote in
 * index.mdx already describes ("Zu ihrer linken ... Annäherung ... Führung").
 */
const buildingPosition: Record<string, { x: number; y: number }> = {
	annaeherung: { x: 26, y: 56.1 },
	maerkte: { x: 29.2, y: 40.5 },
	kontexte: { x: 36.9, y: 64 },
	inszenierung: { x: 44.5, y: 40.3 },
	zukunft: { x: 55.5, y: 76.3 },
	wertschoepfung: { x: 63.1, y: 47.2 },
	potenziale: { x: 70.8, y: 71.9 },
	fuehrung: { x: 74, y: 62.9 },
}

export interface IStadtplatzEntry {
	slug: string
	icon: string
	label: string
	href: string
	building: { x: number; y: number }
}

/**
 * The eight Stadtviertel as Stadtplatz entries, in stadtviertel.json's
 * canonical order (the single Stadtviertel source of truth, see issue #147)
 * so this list can't drift from the docs nav.
 */
export const stadtplatzEntries: IStadtplatzEntry[] =
	stadtviertelData.stadtviertel.map((stadtviertel) => ({
		slug: stadtviertel.slug,
		icon: stadtviertel.icon,
		label: originalLabel[stadtviertel.slug] ?? stadtviertel.label,
		href: `/docs/xeniapolis/${stadtviertel.slug}`,
		building: buildingPosition[stadtviertel.slug] ?? { x: 50, y: 50 },
	}))
