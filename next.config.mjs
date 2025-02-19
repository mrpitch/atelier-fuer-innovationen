import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
	output: 'standalone',
	reactStrictMode: true,
	images: {
		dangerouslyAllowSVG: true,
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '3000',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'loremflickr.com',
				pathname: '/**',
			},
		],
		formats: ['image/avif', 'image/webp'],
	},
}

export default withMDX(config)
