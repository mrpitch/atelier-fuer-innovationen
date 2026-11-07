import { ImageZoom } from '@/components/image-zoom'
import { isSvg, readSvgMarkup, SvgFrame } from '@/components/svg-frame'

interface IIllu {
	slug: string
	name: string
	image: string
	/**
	 * `.svg` that uses `currentColor` or `var(--color-fd-*, <light fallback>)`:
	 * rendered inline so it follows the page theme. An `<img>`-embedded SVG
	 * can't see the page's `color`, the `.dark` class or the CSS variables.
	 */
	themed?: boolean
}

// interface ISlides {
// 	slides: ISlide[]
// }
const getIllusData = async () => {
	try {
		// Using dynamic import for JSON
		const illusData = await import('@/data/illus.json')
		return illusData.illus as IIllu[]
	} catch (error) {
		console.error('Error loading illus:', error)
		return [] as IIllu[]
	}
}

const getIllusBySlug = async (slug: string) => {
	const illus = await getIllusData()
	return illus.find((illus) => illus.slug === slug)
}

export const Illus = async () => {
	const illus = await getIllusData()

	return (
		<div>
			{illus.map((illus) => (
				<div key={illus.name}>{illus.name}</div>
			))}
		</div>
	)
}

export const Illu = async ({
	slug,
	variant = 'illustration',
}: {
	slug: string
	/**
	 * "icon" inlines the SVG markup (not an `<img>`) so `currentColor`/ADR-0002
	 * section CSS custom properties reach it; `<img>`-embedded SVGs render in
	 * an isolated image context that cannot see the page's `color`.
	 */
	variant?: 'illustration' | 'icon'
}) => {
	const illus = await getIllusBySlug(slug)
	if (!illus) return null

	if (variant === 'icon') {
		if (!isSvg(illus.image)) return null
		let markup: string
		try {
			markup = await readSvgMarkup(illus.image)
		} catch (error) {
			console.error('Error loading icon illu:', error)
			return null
		}
		return (
			<span
				aria-hidden="true"
				className="ml-2 inline-flex size-6 align-text-bottom [&_svg]:size-full"
				dangerouslySetInnerHTML={{ __html: markup }}
			/>
		)
	}

	if (isSvg(illus.image)) {
		return (
			<SvgFrame
				src={illus.image}
				alt={illus.name}
				themed={illus.themed}
				className="mb-8"
			/>
		)
	}

	return (
		<div className="bg-fd-card mb-8 border p-4">
			<ImageZoom
				src={illus?.image}
				width={640}
				height={480}
				alt={illus?.name}
			/>
		</div>
	)
}
