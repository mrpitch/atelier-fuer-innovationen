#!/usr/bin/env -S npx tsx
/**
 * validate-stadtviertel: check that `src/data/stadtviertel.json` — the
 * single canonical list of the eight Stadtviertel (slug, nav/breadcrumb
 * label, icon, process order) — is the source every other place that
 * repeats this data agrees with: each Stadtviertel's own `meta.json`
 * (`title`/`icon`), the process order listed under the
 * "---Stadtviertel---" group in `xeniapolis/meta.json`, and that every
 * canonical icon name is a real `lucide-react` export.
 *
 * Usage:
 *   npx tsx scripts/validate-stadtviertel.ts [root]
 *
 * Exits 0 if everything agrees with the canonical list, 1 otherwise (with a
 * report on stderr).
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { argv, exit, stderr, stdout } from 'node:process'
import { icons } from 'lucide-react'

export interface StadtviertelViolation {
	file: string
	reason: string
}

interface StadtviertelDefinition {
	slug: string
	label: string
	icon: string
}

interface IMetaJson {
	title?: string
	icon?: string
	pages?: string[]
}

const DATA_PATH = 'src/data/stadtviertel.json'
const XENIAPOLIS_DIR = 'src/content/docs/xeniapolis'
const STADTVIERTEL_MARKER = '---Stadtviertel---'
const SEPARATOR_RE = /^---(?:\[[^\]]+\])?.*---$|^---$/

function readJson<T>(absPath: string): T | null {
	try {
		return JSON.parse(readFileSync(absPath, 'utf-8')) as T
	} catch {
		return null
	}
}

function loadDefinitions(root: string): StadtviertelDefinition[] {
	const data = readJson<{ stadtviertel: StadtviertelDefinition[] }>(
		join(root, DATA_PATH)
	)
	return data?.stadtviertel ?? []
}

function extractStadtviertelGroup(pages: string[]): string[] {
	const startIndex = pages.indexOf(STADTVIERTEL_MARKER)
	if (startIndex === -1) return []
	const group: string[] = []
	for (const item of pages.slice(startIndex + 1)) {
		if (SEPARATOR_RE.test(item)) break
		group.push(item)
	}
	return group
}

export function findStadtviertelViolations(
	root: string
): StadtviertelViolation[] {
	const violations: StadtviertelViolation[] = []
	const definitions = loadDefinitions(root)

	for (const { slug, label, icon } of definitions) {
		if (!Object.hasOwn(icons, icon)) {
			violations.push({
				file: DATA_PATH,
				reason: `Stadtviertel "${slug}" icon "${icon}" is not a lucide-react export`,
			})
		}

		const metaPath = join(XENIAPOLIS_DIR, slug, 'meta.json')
		const meta = readJson<IMetaJson>(join(root, metaPath))
		if (!meta) {
			violations.push({
				file: metaPath,
				reason: `no meta.json found for Stadtviertel "${slug}"`,
			})
			continue
		}
		if (meta.title !== label) {
			violations.push({
				file: metaPath,
				reason: `title "${meta.title}" does not match the canonical label "${label}"`,
			})
		}
		if (meta.icon !== icon) {
			violations.push({
				file: metaPath,
				reason: `icon "${meta.icon}" does not match the canonical icon "${icon}"`,
			})
		}
	}

	const xeniapolisMetaPath = join(XENIAPOLIS_DIR, 'meta.json')
	const xeniapolisMeta = readJson<IMetaJson>(join(root, xeniapolisMetaPath))
	const group = extractStadtviertelGroup(xeniapolisMeta?.pages ?? [])
	const canonicalSlugs = definitions.map((d) => d.slug)
	if (group.join(',') !== canonicalSlugs.join(',')) {
		violations.push({
			file: xeniapolisMetaPath,
			reason: `Stadtviertel group order [${group.join(', ')}] does not match the canonical order [${canonicalSlugs.join(', ')}]`,
		})
	}

	return violations.sort(
		(a, b) => a.file.localeCompare(b.file) || a.reason.localeCompare(b.reason)
	)
}

const isMain =
	process.argv[1] && import.meta.url === `file://${process.argv[1]}`

if (isMain) {
	const root = argv[2] ?? '.'
	if (!existsSync(join(root, DATA_PATH))) {
		stderr.write(`${DATA_PATH} not found under "${root}"\n`)
		exit(1)
	}
	const violations = findStadtviertelViolations(root)
	if (violations.length === 0) {
		stdout.write('Stadtviertel integrity: OK\n')
		exit(0)
	}
	stderr.write(`Stadtviertel integrity: ${violations.length} violation(s)\n\n`)
	for (const { file, reason } of violations) {
		stderr.write(`  ${file}: ${reason}\n`)
	}
	exit(1)
}
