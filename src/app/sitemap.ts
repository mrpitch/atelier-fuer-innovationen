import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/site'
import { source } from '@/lib/source'

// output: export — emitted once at build time as out/sitemap.xml.
export const dynamic = 'force-static'

// Every address is listed with a trailing slash, the canonical form under
// `trailingSlash: true` (next.config.mjs). The post-deploy check
// (scripts/check-deployed.ts) requests each one.
export default function sitemap(): MetadataRoute.Sitemap {
	return [
		`${SITE_URL}/`,
		...source.getPages().map((page) => `${SITE_URL}${page.url}/`),
	].map((url) => ({ url }))
}
