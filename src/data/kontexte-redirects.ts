/**
 * #151 regrouped the Kontexte slide series from flat file-name codes
 * (`ewelt1`, `ewelt1a`, …) into readable addresses nested under a folder per
 * chapter. This maps every old address's last URL segment to the new
 * absolute path, so `src/app/docs/[[...slug]]/page.tsx` can keep serving the
 * old address as a page that redirects to the new one — the static export
 * has no server-side redirects, so the old address has to remain a real,
 * prerendered page (see docs/architecture/08-crosscutting/static-export-strategy.md).
 *
 * Keyed by the slug segment right after `xeniapolis/kontexte/`, e.g. the key
 * for `/docs/xeniapolis/kontexte/ewelt1a` is `ewelt1a`.
 */
export const kontexteRedirects: Record<string, string> = {
	ewelt1: '/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung',
	ewelt1a:
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/wandel-der-beschaeftigungsstruktur',
	ewelt1b:
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/das-informationale-babylon',
	ewelt1c:
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/beschuetzte-weisheit-geordnetes-staatswesen',
	ewelt1d:
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/die-mission-des-hl-franziskus',
	ewelt1e:
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/unternehmerische-engagements-im-visionaeren-vorfeld',
	ewelt1f:
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/xenia-stadt-des-wissens-und-staette-der-begegnung',
	ewelt1g:
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/potentiale-einer-stadt-des-wissens-nutzen',
	ewelt1h:
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/das-vor-bild-der-erfinderunternehmer',

	ewelt3: '/docs/xeniapolis/kontexte/eine-welt-im-wandel',
	ewelt3a: '/docs/xeniapolis/kontexte/eine-welt-im-wandel/das-satori-konzept',
	ewelt3b:
		'/docs/xeniapolis/kontexte/eine-welt-im-wandel/eine-welt-der-probleme-und-revolutionen',
	ewelt3c:
		'/docs/xeniapolis/kontexte/eine-welt-im-wandel/die-gestaltungsfelder-der-problemloesungsgesellschaft',
	ewelt3d:
		'/docs/xeniapolis/kontexte/eine-welt-im-wandel/aufbruch-zum-kontinent-der-loesungen',
	ewelt3e:
		'/docs/xeniapolis/kontexte/eine-welt-im-wandel/die-erste-globale-revolution',
	ewelt3f:
		'/docs/xeniapolis/kontexte/eine-welt-im-wandel/megatrends-der-erfordernisse',
	ewelt3g: '/docs/xeniapolis/kontexte/eine-welt-im-wandel/gedanken',
	ewelt3h:
		'/docs/xeniapolis/kontexte/eine-welt-im-wandel/eine-programmatische-skizzierung',

	ewelt4: '/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis',
	ewelt4a:
		'/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis/lebensqualitaet-skala-der-beduerfnisse-und-der-beduerfnisbefriedigung',
	ewelt4b:
		'/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis/staedte-potentiale-und-probleme',
	ewelt4c:
		'/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis/die-wiederbelebung-der-polis',
	ewelt4d:
		'/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis/xenia-platz-der-zukunft',
	ewelt4e:
		'/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis/visionen-innovationen-paradigmen',
	ewelt4f:
		'/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis/gedankenkreise-fuer-eine-heisse-kreative-mischung',
	ewelt4g:
		'/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis/potential-defizit-balance-rechnung',
	ewelt4h:
		'/docs/xeniapolis/kontexte/die-wiederbelebung-der-polis/eine-welt-kommt-in-bewegung',

	ewelt5: '/docs/xeniapolis/kontexte/wandel-chaos-und-chance',
	ewelt5a:
		'/docs/xeniapolis/kontexte/wandel-chaos-und-chance/das-individuum-in-der-gemeinschaft',
	ewelt5b:
		'/docs/xeniapolis/kontexte/wandel-chaos-und-chance/verantwortungsstrategien-auspraegungen-und-wirkungen',
	ewelt5c:
		'/docs/xeniapolis/kontexte/wandel-chaos-und-chance/bifurkationen-bei-alternativen-weltmodellen',
	ewelt5d:
		'/docs/xeniapolis/kontexte/wandel-chaos-und-chance/der-weg-ist-das-ziel',
	ewelt5e:
		'/docs/xeniapolis/kontexte/wandel-chaos-und-chance/xenia-stadtplan-der-modernen-viertel',
	ewelt5f:
		'/docs/xeniapolis/kontexte/wandel-chaos-und-chance/gestaltungsfelder-und-leitvorhaben',
	ewelt5g:
		'/docs/xeniapolis/kontexte/wandel-chaos-und-chance/kontextwissen-und-faktenwissen',
	ewelt5h:
		'/docs/xeniapolis/kontexte/wandel-chaos-und-chance/das-xenia-konzept',

	ewelt6: '/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren',
	ewelt6a:
		'/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren/xenia-system-im-ueberblick',
	ewelt6b:
		'/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren/wissensrepraesentation-in-urbanem-ambiente',
	ewelt6c:
		'/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren/kontext-und-fokus-als-komplementaere-regulatoren',
	ewelt6d:
		'/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren/die-thematisch-methodische-inszenierung',
	ewelt6e:
		'/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren/das-fokusthema',
	ewelt6f:
		'/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren/der-innovative-support',
	ewelt6g:
		'/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren/mehrfach-weiterverwendbare-wissensbausteine',
	ewelt6h:
		'/docs/xeniapolis/kontexte/xenia-system-und-atelier-fuer-innovatoren/das-netzwerk-fuer-innovatoren',

	ewelt7: '/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation',
	ewelt7a:
		'/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation/das-xenia-konzept-vorbereitete-komplexe',
	ewelt7b:
		'/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation/handlungsszenario-wissensstaedte-und-oder-datenautobahnen',
	ewelt7c:
		'/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation/kontextszenario-die-leerstelle',
	ewelt7d:
		'/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation/das-leitbild-entstehung-und-perspektiven-der-erweiterung',
	ewelt7e:
		'/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation/das-applikationenszenario',
	ewelt7f:
		'/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation/das-portfolio-fuer-innovationen',
	ewelt7g:
		'/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation/das-potentialeportfolio',
	ewelt7h:
		'/docs/xeniapolis/kontexte/xenia-selbst-eine-fundamentale-innovation/das-unternehmerische-programm',

	ewelt8: '/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk',
	ewelt8a:
		'/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk/innovative-herausforderungen-aus-sicht-der-fuehrung',
	ewelt8b:
		'/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk/expo-2000-mehr-markttransparenz-fuer-innovationen',
	ewelt8c:
		'/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk/kybernetischer-ansatz-zur-systembeherrschung',
	ewelt8d:
		'/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk/xenia-festival-futur',
	ewelt8e:
		'/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk/wege-zur-informationsgesellschaft',
	ewelt8f:
		'/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk/makro-gestaltungspotentiale-des-wandels',
	ewelt8g:
		'/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk/halb-voll-oder-halb-leer',
	ewelt8h:
		'/docs/xeniapolis/kontexte/perspektiven-fuer-ein-netzwerk/unternehmerische-perspektiven-mit-xenia',
}

/**
 * Resolves `slug` (the full `[[...slug]]` param array) to a redirect target,
 * if it names one of the old Kontexte addresses. Kept free of React/Next
 * imports so it can be unit tested directly (see kontexte-redirects.test.ts).
 */
export function resolveKontexteRedirect(
	slug: string[] | undefined
): string | undefined {
	if (!slug || slug.length !== 3) return undefined
	if (slug[0] !== 'xeniapolis' || slug[1] !== 'kontexte') return undefined
	return kontexteRedirects[slug[2]]
}
