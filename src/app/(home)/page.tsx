import Link from 'next/link'
import { Cards, Card } from '@/components/card'
import { AlbumIcon, Book, ComponentIcon, Rocket } from 'lucide-react'

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center">
			<div className="flex flex-col items-center justify-center">
				<Cards>
					<Link href="/docs">
						<Card icon={<Rocket />} title="Einführung">
							Handles most of the logic, including document search, content
							source adapters, and Markdown extensions.
						</Card>
					</Link>
					<Link href="/docs/teil-1">
						<Card icon={<Book />} title="Teil 1">
							The default theme of Fumadocs, it offers a beautiful look for
							documentation sites and interactive components.
						</Card>
					</Link>
					<Link href="/docs/teil-2">
						<Card icon={<AlbumIcon />} title="Teil 2">
							The input/source of your content, it can be a CMS, or local data
							layers like [Content
							Collections](https://www.content-collections.dev) and [Fumadocs
							MDX](/docs/mdx), the official content source.
						</Card>
					</Link>

					<Link href="/docs/components">
						<Card icon={<ComponentIcon />} title="Components">
							A command line tool to install UI components similar to Shadcn UI
							and automate things.
						</Card>
					</Link>
				</Cards>
			</div>
		</main>
	)
}
