import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageZoom } from '@/components/image-zoom'
import { cn } from '@/lib/cn'

export const isSvg = (src: string) => src.endsWith('.svg')

/**
 * Markup of a committed `public/` SVG. It is trusted input: it must only ever
 * come from a file in this repo, never from user-supplied content.
 */
export const readSvgMarkup = (src: string) =>
	readFile(join(process.cwd(), 'public', src), 'utf-8')

/**
 * next-image-export-optimizer only processes raster formats, so `.svg` assets
 * render as a zoomable `bg-fd-card` frame around either:
 *
 * - `themed`: the file's markup inlined, so `currentColor` and the
 *   `var(--color-fd-*, <light fallback>)` tokens inside it resolve against the
 *   page (and the zoom modal) in light and dark mode. `<img>`-embedded SVGs
 *   render in an isolated image context that cannot see either.
 * - otherwise a plain `<img>`, which keeps the file's own colours.
 *
 * A themed file that cannot be read falls back to the plain `<img>`.
 */
export const SvgFrame = async ({
	src,
	alt,
	themed,
	className,
}: {
	src: string
	alt: string
	themed?: boolean
	/** Extra classes for the frame, e.g. a bottom margin. */
	className?: string
}) => {
	let markup: string | null = null
	if (themed) {
		try {
			markup = await readSvgMarkup(src)
		} catch (error) {
			console.error('Error loading themed svg:', error)
		}
	}

	return (
		<div className={cn('bg-fd-card border p-4', className)}>
			<ImageZoom src={src} alt={alt}>
				{markup === null ? (
					// eslint-disable-next-line @next/next/no-img-element -- next-image-export-optimizer only processes raster formats; SVGs render as-is
					<img src={src} alt={alt} />
				) : (
					<>
						<span
							className="block"
							dangerouslySetInnerHTML={{ __html: markup }}
						/>
						<span className="sr-only">{alt}</span>
					</>
				)}
			</ImageZoom>
		</div>
	)
}
