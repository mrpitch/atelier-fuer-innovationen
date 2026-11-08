import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
	output: 'export',
	// The host (CloudFront Function RewriteSPAUrls) maps `/docs/x` to
	// `/docs/x/index.html`, so the export must emit `docs/x/index.html`, not
	// `docs/x.html`. See docs/how-to/how-to-build-and-deploy.md.
	trailingSlash: true,
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
