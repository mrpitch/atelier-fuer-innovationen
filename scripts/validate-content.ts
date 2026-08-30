#!/usr/bin/env -S npx tsx
/**
 * validate-content: check that the Fumadocs content tree is internally
 * consistent — every `<Illu>`/`<Slide>` slug used in MDX has a matching JSON
 * entry, every `illus.json`/`slides.json` asset resolves under `public/`,
 * every non-separator `meta.json` `pages` entry resolves to a real page, and
 * every relative image/link path in MDX resolves to a real file.
 *
 * Usage:
 *   npx tsx scripts/validate-content.ts [root]
 *
 * Exits 0 if the tree is conformant, 1 otherwise (with a report on stderr).
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { argv, exit, stderr, stdout } from 'node:process'

export interface ContentViolation {
	file: string
	reason: string
}

const CONTENT_DIR = 'src/content/docs'
const DATA_DIR = 'src/data'
const PUBLIC_DIR = 'public'

interface IlluEntry {
	slug: string
	name: string
	image: string
}

interface SlideEntry {
	slug: string
	name: string
	image: string
	url?: string
}

interface MetaJson {
	pages?: string[]
}

const toPosix = (p: string): string => p.split(sep).join('/')

function readJson<T>(absPath: string): T | null {
	try {
		return JSON.parse(readFileSync(absPath, 'utf-8')) as T
	} catch {
		return null
	}
}

function loadIllus(root: string): IlluEntry[] {
	const data = readJson<{ illus: IlluEntry[] }>(join(root, DATA_DIR, 'illus.json'))
	return data?.illus ?? []
}

function loadSlides(root: string): SlideEntry[] {
	const data = readJson<{ slides: SlideEntry[] }>(join(root, DATA_DIR, 'slides.json'))
	return data?.slides ?? []
}

function resolvesUnderPublic(root: string, assetPath: string): boolean {
	return existsSync(join(root, PUBLIC_DIR, assetPath))
}

// Fumadocs `meta.json` `pages` conventions (see fumadocs-core's page-tree
// loader): "---Text---"/"---" are section separators, "..."/"z...a" pull in
// the remaining unlisted pages, and a leading "!" excludes/hides a page
// without removing it from the tree — none of these name an entry that must
// resolve on disk the way a plain or "!"-prefixed page name does.
const SEPARATOR_RE = /^---(?:\[[^\]]+\])?.*---$|^---$/
const REST_VALUES = new Set(['...', 'z...a'])

function resolvesToPage(dir: string, name: string): boolean {
	if (existsSync(join(dir, `${name}.mdx`)) || existsSync(join(dir, `${name}.md`))) return true
	const subDir = join(dir, name)
	return existsSync(subDir) && statSync(subDir).isDirectory()
}

function checkMetaPages(absPath: string, relPath: string, dir: string, violations: ContentViolation[]): void {
	const meta = readJson<MetaJson>(absPath)
	if (!meta?.pages) return
	for (const item of meta.pages) {
		if (SEPARATOR_RE.test(item)) continue
		if (REST_VALUES.has(item)) continue
		if (item.startsWith('...')) {
			// extract-from-folder directive, e.g. "...xeniapolis" — pulls another
			// folder's pages in inline, so the folder itself must resolve.
			const folderName = item.slice(3)
			const subDir = join(dir, folderName)
			if (!existsSync(subDir) || !statSync(subDir).isDirectory()) {
				violations.push({ file: relPath, reason: `pages entry "${item}" does not resolve to a folder` })
			}
			continue
		}
		const name = item.startsWith('!') ? item.slice(1) : item
		if (!resolvesToPage(dir, name)) {
			violations.push({ file: relPath, reason: `pages entry "${item}" does not resolve to a page` })
		}
	}
}

const COMPONENT_RE = /<(Illu|Slide)\b([^>]*)>/g
const SLUG_ATTR_RE = /\bslug=["']([^"']+)["']/

function checkComponentSlugs(
	content: string,
	relPath: string,
	illus: IlluEntry[],
	slides: SlideEntry[],
	violations: ContentViolation[],
): void {
	for (const match of content.matchAll(COMPONENT_RE)) {
		const [, component, attrs] = match
		const slugMatch = SLUG_ATTR_RE.exec(attrs)
		if (!slugMatch) continue
		const slug = slugMatch[1]
		const dataset = component === 'Illu' ? illus : slides
		const dataFile = component === 'Illu' ? 'illus.json' : 'slides.json'
		if (!dataset.some((entry) => entry.slug === slug)) {
			violations.push({ file: relPath, reason: `<${component} slug="${slug}"> has no matching entry in ${dataFile}` })
		}
	}
}

// Matches markdown images (`![alt](url)`) and links (`[text](url)`,
// negative lookbehind excludes the image form), each with an optional
// trailing `"title"`.
const IMAGE_RE = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
const LINK_RE = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

function isRelativePath(url: string): boolean {
	if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return false // scheme, e.g. http:, mailto:, tel:
	if (url.startsWith('/')) return false // site-absolute
	if (url.startsWith('#')) return false // anchor-only
	return true
}

function stripHash(url: string): string {
	const idx = url.indexOf('#')
	return idx === -1 ? url : url.slice(0, idx)
}

function checkRelativePaths(absPath: string, relPath: string, content: string, violations: ContentViolation[]): void {
	const dir = dirname(absPath)
	const checked = new Set<string>()
	for (const re of [IMAGE_RE, LINK_RE]) {
		for (const match of content.matchAll(re)) {
			const raw = match[1]
			if (!isRelativePath(raw)) continue
			const target = stripHash(raw)
			if (!target || checked.has(target)) continue
			checked.add(target)
			if (!existsSync(join(dir, target))) {
				violations.push({ file: relPath, reason: `relative path "${raw}" does not resolve to a file` })
			}
		}
	}
}

function walk(dir: string, root: string, mdxFiles: { absPath: string; relPath: string }[], violations: ContentViolation[]): void {
	if (!existsSync(dir)) return
	for (const name of readdirSync(dir).sort()) {
		const fullPath = join(dir, name)
		const relPath = toPosix(relative(root, fullPath))
		if (statSync(fullPath).isDirectory()) {
			walk(fullPath, root, mdxFiles, violations)
		} else if (name === 'meta.json') {
			checkMetaPages(fullPath, relPath, dir, violations)
		} else if (name.endsWith('.mdx')) {
			mdxFiles.push({ absPath: fullPath, relPath })
		}
	}
}

export function findContentViolations(root: string): ContentViolation[] {
	const violations: ContentViolation[] = []
	const illus = loadIllus(root)
	const slides = loadSlides(root)

	for (const entry of illus) {
		if (!resolvesUnderPublic(root, entry.image)) {
			violations.push({
				file: `${DATA_DIR}/illus.json`,
				reason: `illus entry "${entry.slug}" image "${entry.image}" does not resolve to a file under public/`,
			})
		}
	}
	for (const entry of slides) {
		if (!resolvesUnderPublic(root, entry.image)) {
			violations.push({
				file: `${DATA_DIR}/slides.json`,
				reason: `slide entry "${entry.slug}" image "${entry.image}" does not resolve to a file under public/`,
			})
		}
		if (entry.url && !resolvesUnderPublic(root, entry.url)) {
			violations.push({
				file: `${DATA_DIR}/slides.json`,
				reason: `slide entry "${entry.slug}" url "${entry.url}" does not resolve to a file under public/`,
			})
		}
	}

	const mdxFiles: { absPath: string; relPath: string }[] = []
	walk(join(root, CONTENT_DIR), root, mdxFiles, violations)

	for (const { absPath, relPath } of mdxFiles) {
		const content = readFileSync(absPath, 'utf-8')
		checkComponentSlugs(content, relPath, illus, slides, violations)
		checkRelativePaths(absPath, relPath, content, violations)
	}

	return violations.sort((a, b) => a.file.localeCompare(b.file) || a.reason.localeCompare(b.reason))
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`

if (isMain) {
	const root = argv[2] ?? '.'
	const violations = findContentViolations(root)
	if (violations.length === 0) {
		stdout.write('Content integrity: OK\n')
		exit(0)
	}
	stderr.write(`Content integrity: ${violations.length} violation(s)\n\n`)
	for (const { file, reason } of violations) {
		stderr.write(`  ${file}: ${reason}\n`)
	}
	exit(1)
}
