import Link from 'next/link'

import { HomeHero } from '@/app/_components/home-hero'
import { Cards, Card } from '@/components/card'
import { Book, ComponentIcon, Rocket } from 'lucide-react'

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

					<div className="mt-24 flex flex-col items-center justify-center">
						<Cards>
							<Link href="/docs/atelier">
								<Card icon={<Rocket />} title="Atelier">
									A Hoiwe mi oa Baamwach i hob di liab, resch ebba. Vo de oans,
									zwoa, gsuffa muass, is.
								</Card>
							</Link>
							<Link href="/docs/xeniapolis">
								<Card icon={<Book />} title="Xeniapolis">
									A bissal wos gehd ollaweil hawadere midananda mim Radl foahn i
									moan oiwei jedza, schnacksln vo de so
								</Card>
							</Link>
							<Link href="/docs/components">
								<Card icon={<ComponentIcon />} title="Components">
									Wurscht schoo. Resch Steckerleis vui da, Baamwach im Beidl.
									Diandldrahn da an Fingahaggln, nia need.
								</Card>
							</Link>
						</Cards>
					</div>
				</div>
			</main>
		</>
	)
}
