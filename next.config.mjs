import { createMDX } from 'fumadocs-mdx/next'
import withExportImages from 'next-export-optimize-images'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
	output: 'export',
	reactStrictMode: true,
	images: {
		imageSizes: [640, 960, 1280, 1600, 1920],
		deviceSizes: [640, 960, 1280, 1600, 1920],
	},
}

export default withExportImages(withMDX(config))
