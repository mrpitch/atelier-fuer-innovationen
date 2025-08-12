/**
 * @type {import('next-export-optimize-images').Config}
 */
const config = {
	imageDir: '_optimized',
	cacheDir: 'out/.cache',
	quality: 75,
	filenameGenerator: ({ path, name, extension, width }) =>
		`${path.replace(/^\//, '').replace(/\//g, '-')}-${name}.${width}.${extension}`,
	// sharpOptions: {
	// 	webp: {
	// 		quality: 80,
	// 	},
	// },
	convertFormat: [
		['png', 'webp'],
		['jpg', 'webp'],
	],
	generateFormats: ['webp'],
}

module.exports = config
