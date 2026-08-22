import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
	output: 'export',
	reactStrictMode: true,
	images: {
		loader: 'custom',
		imageSizes: [640, 960, 1280, 1600, 1920],
		deviceSizes: [640, 960, 1280, 1600, 1920],
	},
	transpilePackages: ['next-image-export-optimizer'],
	// See https://www.npmjs.com/package/next-image-export-optimizer#configuration
	env: {
		nextImageExportOptimizer_imageFolderPath: 'public',
		nextImageExportOptimizer_exportFolderPath: 'out',
		nextImageExportOptimizer_quality: '75',
		nextImageExportOptimizer_storePicturesInWEBP: 'true',
		nextImageExportOptimizer_exportFolderName: '_optimized',
		nextImageExportOptimizer_generateAndUseBlurImages: 'true',
	},
}

export default withMDX(config)
