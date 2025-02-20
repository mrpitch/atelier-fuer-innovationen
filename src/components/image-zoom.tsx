'use client'

//import Image from 'next-export-optimize-images/image'
import Picture from 'next-export-optimize-images/picture'
import { type ImageProps } from 'next/image'
import { type ImgHTMLAttributes } from 'react'
import './image-zoom.css'
import Zoom, { type UncontrolledProps } from 'react-medium-image-zoom'

export type ImageZoomProps = ImageProps & {
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

function getImageSrc(src: ImageProps['src']): string {
	if (typeof src === 'string') return src
	if ('default' in src) return src.default.src
	return src.src
}

export function ImageZoom({
	zoomInProps,
	children,
	rmiz,
	alt = '',
	...props
}: ImageZoomProps) {
	return (
		<Zoom
			zoomMargin={20}
			wrapElement="span"
			{...rmiz}
			zoomImg={{
				src: getImageSrc(props.src),
				sizes: undefined,
				...zoomInProps,
			}}
		>
			{children ?? (
				<Picture
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"
					alt={alt}
					{...props}
				/>
			)}
		</Zoom>
	)
}
