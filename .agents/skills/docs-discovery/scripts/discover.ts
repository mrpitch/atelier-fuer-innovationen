#!/usr/bin/env -S npx tsx
/**
 * docs-discovery: scan a folder for .md/.mdx files and output JSON metadata.
 *
 * Usage:
 *   npx tsx .claude/skills/docs-discovery/scripts/discover.ts [docs_root]
 *
 * Output: JSON array to stdout — one entry per file with frontmatter and title.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { argv, exit, stderr, stdout } from 'node:process'

interface DocEntry {
	file: string
	folder: string
	hasFrontmatter: boolean
	frontmatter: Record<string, unknown> | null
	titleFallback: string | null
}

const isDir = (p: string): boolean => {
	try {
		return statSync(p).isDirectory()
	} catch {
		return false
	}
}

const toPosix = (p: string): string => p.split(sep).join('/')

function parseFrontmatter(content: string): Record<string, unknown> | null {
	if (!content.startsWith('---')) return null
	const end = content.indexOf('\n---', 3)
	if (end === -1) return null
	const yaml = content.slice(4, end).trim()
	const result: Record<string, unknown> = {}
	for (const line of yaml.split('\n')) {
		const colon = line.indexOf(':')
		if (colon === -1) continue
		const key = line.slice(0, colon).trim()
		const raw = line.slice(colon + 1).trim()
		if (!key) continue
		if (raw.startsWith('[') && raw.endsWith(']')) {
			result[key] = raw
				.slice(1, -1)
				.split(',')
				.map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
				.filter(Boolean)
		} else if (raw === 'true') {
			result[key] = true
		} else if (raw === 'false') {
			result[key] = false
		} else {
			result[key] = raw.replace(/^['"]|['"]$/g, '')
		}
	}
	return Object.keys(result).length > 0 ? result : null
}

function getTitleFallback(content: string, hasFrontmatter: boolean): string | null {
	if (hasFrontmatter) return null
	for (const line of content.split('\n')) {
		const trimmed = line.trim()
		if (trimmed.startsWith('# ')) return trimmed.slice(2).trim()
		if (trimmed.length > 0 && !trimmed.startsWith('---')) break
	}
	return null
}

function scanDir(dir: string, docsRoot: string, entries: DocEntry[]): void {
	for (const name of readdirSync(dir).sort()) {
		if (name.startsWith('.')) continue
		const fullPath = join(dir, name)
		if (isDir(fullPath)) {
			scanDir(fullPath, docsRoot, entries)
		} else if (name.endsWith('.md') || name.endsWith('.mdx')) {
			try {
				const content = readFileSync(fullPath, 'utf-8')
				const fm = parseFrontmatter(content)
				const hasFrontmatter = fm !== null
				entries.push({
					file: toPosix(relative(process.cwd(), fullPath)),
					folder: toPosix(relative(process.cwd(), dir)),
					hasFrontmatter,
					frontmatter: fm,
					titleFallback: getTitleFallback(content, hasFrontmatter),
				})
			} catch (err) {
				stderr.write(`warning: could not read ${fullPath}: ${(err as Error).message}\n`)
			}
		}
	}
}

const docsRoot = argv[2] ?? 'docs'

if (!isDir(docsRoot)) {
	stderr.write(`error: ${docsRoot} is not a directory\n`)
	exit(2)
}

const entries: DocEntry[] = []
scanDir(docsRoot, docsRoot, entries)
stdout.write(JSON.stringify(entries, null, '\t') + '\n')
exit(0)
