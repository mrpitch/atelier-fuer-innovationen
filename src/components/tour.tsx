import Link from 'next/link'

import { linkVariants } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { source } from '@/lib/source'
import { resolveStation } from '@/data/tours'

function titleFor(href: string): string {
	const slug = href
		.replace(/^\/docs\//, '')
		.split('/')
		.filter(Boolean)
	return source.getPage(slug)?.data.title ?? href
}

function TourControl({
	href,
	label,
}: {
	href: string | undefined
	label: string
}) {
	const className = cn(linkVariants({ color: 'primary', size: 'sm' }))

	if (!href) {
		return (
			<button type="button" disabled className={cn(className, 'opacity-50')}>
				{label}
			</button>
		)
	}

	return (
		<Link
			href={href}
			className={className}
			aria-label={`${label}: ${titleFor(href)}`}
		>
			{label}
		</Link>
	)
}

/**
 * Step counter and previous/next controls for a station of one of the four
 * Stadtrundgänge or one Kontexte slide series. `tour` and `station` select
 * the current position in src/data/tours.ts; use once near the top and once
 * near the bottom of a station page.
 */
export function Tour({ tour, station }: { tour: string; station: string }) {
	const resolved = resolveStation(tour, station)
	if (!resolved) return null

	const { index, total, previous, next } = resolved

	return (
		<div className="not-prose my-6 flex items-center justify-between gap-4 text-sm">
			<TourControl href={previous} label="Zurück" />
			<span className="text-fd-muted-foreground">
				Station {index + 1} von {total}
			</span>
			<TourControl href={next} label="Nächste" />
		</div>
	)
}
