import Link from 'next/link'

import { linkVariants } from '@/components/ui/button'
import { cn } from '@/lib/cn'

/**
 * Stands in for the old flat Kontexte addresses (#151): the static export
 * has no server-side redirects, so this renders at the old address as a
 * real, prerendered page that sends visitors and crawlers on to the new one
 * — a `<meta http-equiv="refresh">` (works without JavaScript, on any
 * static host) plus a visible fallback link. React hoists `<meta>`/`<link>`
 * rendered anywhere in the tree into `<head>`, so no custom head wiring is
 * needed here.
 */
export function KontexteRedirect({ to }: { to: string }) {
	return (
		<>
			<meta httpEquiv="refresh" content={`0; url=${to}`} />
			<link rel="canonical" href={to} />
			<p>
				Diese Seite ist umgezogen nach{' '}
				<Link href={to} className={cn(linkVariants({ color: 'primary' }))}>
					{to}
				</Link>
				.
			</p>
		</>
	)
}
