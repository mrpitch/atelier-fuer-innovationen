#!/usr/bin/env -S npx tsx
/**
 * check-deployed: post-deploy request check. Fetches `<base>/sitemap.xml`,
 * requests every address it lists on `<base>` (the origin inside the sitemap
 * is ignored, so a staging host or local server can be checked), and also
 * requests the favicon. Every request must answer exactly 200: a redirect or
 * an S3 403 AccessDenied (CloudFront's answer for a key that does not exist)
 * fails the check.
 *
 * Usage:
 *   npx tsx scripts/check-deployed.ts [baseUrl]
 *
 * `baseUrl` defaults to the production origin in src/lib/site.ts. Exits 0 if
 * every address answers 200, 1 otherwise (with a report on stderr).
 */

import { argv, exit, stderr, stdout } from 'node:process'

import { SITE_URL } from '../src/lib/site'

export interface DeployedFailure {
	url: string
	status: number | string
}

export interface DeployedReport {
	checked: number
	failures: DeployedFailure[]
}

const SITEMAP_PATH = '/sitemap.xml'
// Requested besides the sitemap: browsers ask for it on every page load.
const EXTRA_PATHS = ['/favicon.ico']
const CONCURRENCY = 8

async function status(
	url: string,
	fetchImpl: typeof fetch
): Promise<number | string> {
	try {
		const response = await fetchImpl(url, {
			method: 'HEAD',
			redirect: 'manual',
		})
		return response.status
	} catch (error) {
		return error instanceof Error ? error.message : String(error)
	}
}

export async function checkDeployed(
	baseUrl: string,
	fetchImpl: typeof fetch = fetch
): Promise<DeployedReport> {
	const base = baseUrl.replace(/\/+$/, '')

	const sitemapResponse = await fetchImpl(`${base}${SITEMAP_PATH}`)
	if (sitemapResponse.status !== 200) {
		throw new Error(
			`${base}${SITEMAP_PATH} answered ${sitemapResponse.status}, expected 200`
		)
	}
	const xml = await sitemapResponse.text()
	const paths = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(
		(match) => {
			const { pathname, search } = new URL(match[1])
			return `${pathname}${search}`
		}
	)
	if (paths.length === 0) {
		throw new Error(`${base}${SITEMAP_PATH} lists no addresses`)
	}

	const urls = [...new Set([...paths, ...EXTRA_PATHS])].map(
		(path) => `${base}${path}`
	)
	const failures: DeployedFailure[] = []
	let next = 0
	const worker = async () => {
		while (next < urls.length) {
			const url = urls[next++]
			const result = await status(url, fetchImpl)
			if (result !== 200) failures.push({ url, status: result })
		}
	}
	await Promise.all(Array.from({ length: CONCURRENCY }, worker))

	failures.sort((a, b) => a.url.localeCompare(b.url))
	return { checked: urls.length, failures }
}

const isMain =
	process.argv[1] && import.meta.url === `file://${process.argv[1]}`

if (isMain) {
	const base = argv[2] ?? SITE_URL
	try {
		const { checked, failures } = await checkDeployed(base)
		if (failures.length === 0) {
			stdout.write(`Deployed check: ${checked} addresses on ${base}: OK\n`)
			exit(0)
		}
		stderr.write(
			`Deployed check: ${failures.length} of ${checked} addresses on ${base} failed\n\n`
		)
		for (const { url, status } of failures) {
			stderr.write(`  ${status}  ${url}\n`)
		}
		exit(1)
	} catch (error) {
		stderr.write(`Deployed check: ${(error as Error).message}\n`)
		exit(1)
	}
}
