'use client'

import ExportedImage, {
	type ExportedImageProps,
} from 'next-image-export-optimizer'
import { type ImgHTMLAttributes } from 'react'
import './image-zoom.css'
import Zoom, { type UncontrolledProps } from 'react-medium-image-zoom'

export type ImageZoomProps = ExportedImageProps & {
	/**
	 * Image props when zoom in
	 */
	zoomInProps?: ImgHTMLAttributes<HTMLImageElement>

	/**
	 * Props for `react-medium-image-zoom`
	 */
	rmiz?: UncontrolledProps
	alt?: string
}

export function ImageZoom({
	zoomInProps,
	children,
	rmiz,
	alt = '',
	...props
}: ImageZoomProps) {
	// next-image-export-optimizer exposes no equivalent of the old plugin's
	// getOptimizedImageProps(), so unless the caller supplies zoomInProps,
	// zoomImg is left undefined and react-medium-image-zoom falls back to
	// cloning the already-optimized <ExportedImage> element for the zoomed view.
	return (
		<Zoom zoomMargin={20} wrapElement="span" {...rmiz} zoomImg={zoomInProps}>
			{children ?? (
				<ExportedImage
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"
					alt={alt}
					{...props}
				/>
			)}
		</Zoom>
	)
}
