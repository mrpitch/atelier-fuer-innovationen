import Link from 'next/link'
import { readSvgMarkup } from '@/components/svg-frame'
import { resolveLucideIcon } from '@/lib/resolve-icon'
import { stadtplatzEntries } from '@/data/stadtplatz'

/**
 * The Zentrum's Stadtplatz: the modell-zentrum.svg plaza illustration with a
 * clickable building per Stadtviertel, plus the same eight links as an
 * ordinary list for keyboard and screen-reader users (see issue #149).
 *
 * The buildings are pointer-only (aria-hidden, untabbable): the `<ul>` below
 * is the dedicated keyboard/screen-reader path to the same eight links, so a
 * focusable overlay would just double every tab stop.
 */
export const Stadtplatz = async () => {
	let markup: string | null = null
	try {
		markup = await readSvgMarkup('/illus/modell-zentrum.svg')
	} catch (error) {
		console.error('Error loading Stadtplatz illustration:', error)
	}

	return (
		<div className="mb-8">
			<div className="bg-fd-card border p-4">
				<div className="relative aspect-[640/350]">
					{markup !== null && (
						<span
							aria-hidden="true"
							className="[&_svg]:block [&_svg]:size-full"
							dangerouslySetInnerHTML={{ __html: markup }}
						/>
					)}
					{stadtplatzEntries.map((entry) => {
						const Icon = resolveLucideIcon(entry.icon)
						return (
							<Link
								key={entry.slug}
								href={entry.href}
								title={entry.label}
								aria-hidden="true"
								tabIndex={-1}
								className="bg-fd-background text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm md:size-10"
								style={{
									left: `${entry.building.x}%`,
									top: `${entry.building.y}%`,
								}}
							>
								<Icon aria-hidden="true" className="size-4 md:size-5" />
							</Link>
						)
					})}
				</div>
			</div>
			<ul className="mt-4">
				{stadtplatzEntries.map((entry) => (
					<li key={entry.slug}>
						<Link href={entry.href}>{entry.label}</Link>
					</li>
				))}
			</ul>
		</div>
	)
}
