import type { ReactNode } from 'react'

/**
 * Frame for a Stadtviertel's four-part text (Prozeßansatz, Konzeptionelle
 * Hinweise, Prozeßdokument, Gestaltungsschwerpunkt) on its Stadtviertel page.
 *
 * The text itself is not copied here: each page pulls its section out of
 * `annaeherung/die-stadtviertel-der-wissensstadt.mdx` with `<include>`, so the
 * overview article stays the one place the words live (issue #150). This
 * component only gives all eight the same frame, so they compare at a glance.
 */
export const StadtviertelText = ({ children }: { children: ReactNode }) => (
	<section className="bg-fd-card my-8 rounded-lg border p-4 md:p-6 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
		{children}
	</section>
)
