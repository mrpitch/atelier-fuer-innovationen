import Link from 'next/link'

import { HomeHero } from '@/app/_components/home-hero'
import { Cards, Card } from '@fumadocs/base-ui/components/card'
import { Book, Rocket, AlbumIcon } from 'lucide-react'

export default function HomePage() {
	const gridColor =
		'color-mix(in oklab, var(--color-fd-primary) 10%, transparent)'

	return (
		<>
			<div
				className="absolute inset-x-0 top-[360px] h-[250px] max-md:hidden"
				style={{
					background: `repeating-linear-gradient(to right, ${gridColor}, ${gridColor} 1px,transparent 1px,transparent 50px), repeating-linear-gradient(to bottom, ${gridColor}, ${gridColor} 1px,transparent 1px,transparent 50px)`,
				}}
			/>

			<main className="relative z-[2] container max-w-[1100px] px-2 py-4 lg:py-8">
				<div className="relative">
					<HomeHero />

					<div className="mt-24 flex flex-col items-stretch justify-center">
						<Cards>
							<Link href="/docs">
								<Card icon={<Rocket />} title="Einführung">
									Der Einstieg in diese Dokumentation – ein Überblick über das
									Atelier für Innovationen, das Xenia-Projekt und die hier
									verwendeten UI-Komponenten.
								</Card>
							</Link>
							<Link href="/docs/atelier">
								<Card icon={<Book />} title="Atelier">
									Atelier für Innovationen: die Stätte der Begegnung, an der
									dieses Projekt entsteht.
								</Card>
							</Link>
							<Link href="/docs/xeniapolis">
								<Card icon={<AlbumIcon />} title="Xeniapolis">
									Xenia ist das Forschungsprojekt, das den Übergang in die
									Informationsgesellschaft als begehbare Wissensstadt erlebbar
									macht – gegliedert in ein Zentrum und acht Stadtviertel.
								</Card>
							</Link>
						</Cards>
					</div>
				</div>
			</main>
		</>
	)
}
