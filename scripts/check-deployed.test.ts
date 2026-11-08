import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, test } from 'node:test'

import { checkDeployed } from './check-deployed'

const servers: Server[] = []
after(() => {
	for (const server of servers) server.close()
})

/** A host that answers `routes` (path -> status) and 403 for anything else,
 * like CloudFront in front of S3 for a key that does not exist. */
async function host(
	routes: Record<string, number>,
	sitemapPaths: string[]
): Promise<string> {
	const sitemap = `<?xml version="1.0"?><urlset>${sitemapPaths
		.map((path) => `<url><loc>https://elsewhere.example${path}</loc></url>`)
		.join('')}</urlset>`
	const server = createServer((req, res) => {
		if (req.url === '/sitemap.xml') {
			res.writeHead(200, { 'content-type': 'application/xml' })
			res.end(sitemap)
			return
		}
		res.writeHead(routes[req.url ?? ''] ?? 403)
		res.end()
	})
	servers.push(server)
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}

test('passes when every sitemap address and the favicon answer 200', async () => {
	const base = await host(
		{ '/': 200, '/docs/': 200, '/docs/xeniapolis/': 200, '/favicon.ico': 200 },
		['/', '/docs/', '/docs/xeniapolis/']
	)
	const report = await checkDeployed(base)
	assert.deepEqual(report, { checked: 4, failures: [] })
})

test('fails on the one route that is broken, and names it', async () => {
	const base = await host({ '/': 200, '/docs/': 200, '/favicon.ico': 200 }, [
		'/',
		'/docs/',
		'/docs/xeniapolis/',
	])
	const report = await checkDeployed(base)
	assert.deepEqual(report.failures, [
		{ url: `${base}/docs/xeniapolis/`, status: 403 },
	])
})

test('fails on a missing favicon and on a redirect', async () => {
	const base = await host({ '/': 200, '/docs/': 301 }, ['/', '/docs/'])
	const report = await checkDeployed(base)
	assert.deepEqual(
		report.failures.map(({ url, status }) => [url.replace(base, ''), status]),
		[
			['/docs/', 301],
			['/favicon.ico', 403],
		]
	)
})

test('rejects an empty sitemap instead of passing vacuously', async () => {
	const base = await host({}, [])
	await assert.rejects(checkDeployed(base), /lists no addresses/)
})
