import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

import { AlbumIcon, Book, ComponentIcon } from 'lucide-react'

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		title: (
			<>
				<svg
					width="24"
					height="24"
					xmlns="http://www.w3.org/2000/svg"
					aria-label="Logo"
				>
					<circle cx={12} cy={12} r={12} fill="currentColor" />
				</svg>
				Atelier-fuer-innovationen
			</>
		),
	},
	links: [
		{
			type: 'menu',
			text: 'Übersicht',
			url: '/docs',
			items: [],
		},
		{
			type: 'menu',
			text: 'Atelier',
			url: '/docs/atelier',
			items: [
				{
					icon: <Book />,
					text: 'Teil 1',
					description: 'Einfache Erstellung von Dokumentationen',
					url: '/docs/atelier/teil-1',
				},
				{
					icon: <AlbumIcon />,
					text: 'Teil 2',
					description:
						'Generate interactive playgrounds and docs for your OpenAPI schema.',
					url: '/docs/atelier/teil-2',
				},
				{
					icon: <ComponentIcon />,
					text: 'Components',
					description: 'Übersicht über alle UI Komponenten',
					url: '/docs/components',
				},
			],
		},{
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
					description:
						'Lorem ipsum dolor sit amet',
					url: '/docs/xeniapolis/viertel-der-fuerung',
				},
			],
		}
	],
}
