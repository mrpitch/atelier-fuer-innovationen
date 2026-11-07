import ExportedImage from 'next-image-export-optimizer'
import Logo from '@/public/images/logo.png'
import type { BaseLayoutProps } from '@fumadocs/base-ui/layouts/shared'

import {
	HousePlus,
	Building2,
	ComponentIcon,
	Compass,
	Coins,
	Drama,
	Landmark,
	Layers,
	Puzzle,
	Rocket,
	Store,
	Users,
} from 'lucide-react'

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
				{
					icon: <Compass />,
					text: 'Viertel der Annäherung',
					description:
						'Ansatz und Gestaltungsschwerpunkt des Viertels der Annäherung sowie die Stadtrundgänge, die hier ihren Ausgang nehmen',
					url: '/docs/xeniapolis/annaeherung',
				},
				{
					icon: <Store />,
					text: 'Viertel der Märkte und Kooperation',
					description:
						'Ideen, Kontakte und Begegnungen als Netzwerk kooperierender Einheiten',
					url: '/docs/xeniapolis/maerkte',
				},
				{
					icon: <Layers />,
					text: 'Viertel der Kontexte',
					description:
						'Das XENIA-Thema "Eine Welt für morgen" im Kontext der Konstellationen beim Übergang zur Informationsgesellschaft',
					url: '/docs/xeniapolis/kontexte',
				},
				{
					icon: <Drama />,
					text: 'Viertel der Inszenierung',
					description:
						'Das Leitbild der Wiederbelebung der Polis, das Besucher nacherleben und mitgestalten können',
					url: '/docs/xeniapolis/inszenierung',
				},
				{
					icon: <Rocket />,
					text: 'Viertel der Zukunft',
					description:
						'Das XENIA-Thema "Futursysteme": den Wandel wollen und die Zukunft als Fremde gastlich empfangen',
					url: '/docs/xeniapolis/zukunft',
				},
				{
					icon: <Coins />,
					text: 'Viertel der Wertschöpfung',
					description:
						'Das Projekt Xenia selbst: Chaos-Chancen und Forschungsarbeit',
					url: '/docs/xeniapolis/wertschoepfung',
				},
				{
					icon: <Puzzle />,
					text: 'Viertel der Potenziale',
					description:
						'Die Xenia-Kollektion MOSAIK: wiederverwendbare Wissensbausteine für innovative Aufgaben',
					url: '/docs/xeniapolis/potenziale',
				},
				{
					icon: <Users />,
					text: 'Viertel der Führung',
					description:
						'Ansatz und Gestaltungsschwerpunkt des Viertels der Führung sowie das XENIA-Thema "Netzwerk der Innovatoren"',
					url: '/docs/xeniapolis/fuehrung',
				},
			],
		},
	],
}
