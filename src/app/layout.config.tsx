import Image from 'next-export-optimize-images/image'
import Logo from '@/public/images/logo.png'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

import {
	HousePlus,
	Building2,
	ComponentIcon,
	Book,
	AlbumIcon,
} from 'lucide-react'

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */

export const logo = (
	<>
		<Image
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
						'Generate interactive playgrounds and docs for your OpenAPI schema.',
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
					icon: <Book />,
					text: 'Viertel der Annäherung',
					description: 'Lorem ipsum dolor sit amet',
					url: '/docs/xeniapolisviertel-der-annaeherung',
				},
				{
					icon: <AlbumIcon />,
					text: 'Viertel der Führung',
					description: 'Lorem ipsum dolor sit amet',
					url: '/docs/xeniapolis/viertel-der-fuerung',
				},
			],
		},
	],
}
