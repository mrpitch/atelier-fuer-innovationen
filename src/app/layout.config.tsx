import ExportedImage from 'next-image-export-optimizer'
import Logo from '@/public/images/logo.png'
import type { BaseLayoutProps } from '@fumadocs/base-ui/layouts/shared'
import stadtviertelData from '@/data/stadtviertel.json'

import { HousePlus, Building2, ComponentIcon, Landmark, icons } from 'lucide-react'

// Home-page-only descriptions for the Xeniapolis mega menu; name, order and
// icon come from src/data/stadtviertel.json (the single Stadtviertel source
// of truth, see issue #147) so this menu can't drift from the docs nav.
const stadtviertelDescriptions: Record<string, string> = {
	annaeherung:
		'Ansatz und Gestaltungsschwerpunkt des Viertels der Annäherung sowie die Stadtrundgänge, die hier ihren Ausgang nehmen',
	maerkte:
		'Ideen, Kontakte und Begegnungen als Netzwerk kooperierender Einheiten',
	kontexte:
		'Das XENIA-Thema "Eine Welt für morgen" im Kontext der Konstellationen beim Übergang zur Informationsgesellschaft',
	inszenierung:
		'Das Leitbild der Wiederbelebung der Polis, das Besucher nacherleben und mitgestalten können',
	zukunft:
		'Das XENIA-Thema "Futursysteme": den Wandel wollen und die Zukunft als Fremde gastlich empfangen',
	wertschoepfung: 'Das Projekt Xenia selbst: Chaos-Chancen und Forschungsarbeit',
	potenziale:
		'Die Xenia-Kollektion MOSAIK: wiederverwendbare Wissensbausteine für innovative Aufgaben',
	fuehrung:
		'Ansatz und Gestaltungsschwerpunkt des Viertels der Führung sowie das XENIA-Thema "Netzwerk der Innovatoren"',
}

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/[[...slug]]/layout.tsx
 */

export const logo = (
	<>
		<ExportedImage
			alt="Atelier für Innovatoren"
			src={Logo}
			width={40}
			height={40}
			className="hidden w-10 md:block"
			aria-label="Logo Atelier für Innovatoren"
		/>
	</>
)
export const baseOptions: BaseLayoutProps = {
	nav: {
		title: (
			<>
				{logo}
				<span className="font-medium [.uwu_&]:hidden [header_&]:text-[15px]">
					Atelier-fuer-innovationen
				</span>
			</>
		),
	},
	links: [
		{
			type: 'menu',
			text: 'Einführung',
			url: '/docs',
			items: [],
		},
		{
			type: 'menu',
			text: 'Atelier',
			url: '/docs/atelier',
			items: [
				{
					icon: <HousePlus />,
					text: 'Atelier',
					description: 'Einfache Erstellung von Dokumentationen',
					url: '/docs/atelier',
				},
				{
					icon: <Building2 />,
					text: 'Xeniapolis',
					description:
						'Xenia: das Forschungsprojekt, das den Übergang in die Informationsgesellschaft als begehbare Wissensstadt erlebbar macht.',
					url: '/docs/xeniapolis',
				},
				{
					icon: <ComponentIcon />,
					text: 'Components',
					description: 'Übersicht über alle UI Komponenten',
					url: '/docs/components',
				},
			],
		},
		{
			type: 'menu',
			text: 'Xeniapolis',
			url: '/docs/xeniapolis',
			items: [
				{
					icon: <Landmark />,
					text: 'Zentrum',
					description:
						'Der Stadtplatz der Wissensstadt: Orientierung vor dem Gang in eines der acht Stadtviertel',
					url: '/docs/xeniapolis',
				},
				...stadtviertelData.stadtviertel.map((stadtviertel) => {
					const Icon = Object.hasOwn(icons, stadtviertel.icon)
						? icons[stadtviertel.icon as keyof typeof icons]
						: Building2
					return {
						icon: <Icon />,
						text: stadtviertel.label,
						description:
							stadtviertelDescriptions[stadtviertel.slug] ?? stadtviertel.label,
						url: `/docs/xeniapolis/${stadtviertel.slug}`,
					}
				}),
			],
		},
	],
}
