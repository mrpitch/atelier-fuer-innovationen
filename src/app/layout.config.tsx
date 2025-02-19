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
			text: 'Lust Wandeln',
			url: '/docs',
			items: [
				{
					icon: <Book />,
					text: 'Teil 1',
					description: 'Einfache Erstellung von Dokumentationen',
					url: '/docs/teil-1',
				},
				{
					icon: <AlbumIcon />,
					text: 'Teil 2',
					description:
						'Generate interactive playgrounds and docs for your OpenAPI schema.',
					url: '/docs/teil-2',
				},
				{
					icon: <ComponentIcon />,
					text: 'Components',
					description: 'Übersicht über alle UI Komponenten',
					url: '/docs/components',
				},
			],
		},
	],
}
