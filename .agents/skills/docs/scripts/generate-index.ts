#!/usr/bin/env -S npx tsx
/**
 * Generate index.md for a documentation tree owned by the `docs` skill.
 *
 * Usage:
 *   npx tsx <skill-dir>/scripts/generate-index.ts [docs_root]
 *
 * Default docs_root is `docs`. Pass a different path for per-package docs.
 *
 * Behavior:
 * - Scans <docs_root> for the Diataxis folders: tutorials, how-to, runbook, reference,
 *   explanation, adr.
 * - Recursively renders nested sub-category folders (e.g. reference/cdk/, how-to/security/).
 * - Extracts the H1 title of each .md file, skipping YAML frontmatter (falls back to a
 *   Title-Cased filename).
 * - Adds an "Architecture" section when <docs_root>/architecture/index.md exists: one bullet
 *   per arc42 section folder, linking that folder's index.md.
 * - Writes <docs_root>/index.md with frontmatter containing only `okf_version: "0.2"`.
 * - Skips hidden files and folders (including .git), README.md (kept as a separate
 *   intro), log.md, and the index file itself.
 * - Honors .gitkeep markers so empty intentional folders still render with "_No documents yet._".
 * - Leaves untouched: openspec/, .github/, agents/, audit-reports/, contracts/ (not indexed).
 *
 * Adapted from arisng/github-copilot-fc (generate_index.py),
 * rewritten in TypeScript.
 *
 * No dependencies beyond Node ≥ 22 stdlib + tsx.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, posix, relative, sep } from 'node:path'
import { argv, exit, stderr, stdout } from 'node:process'

const CATEGORIES: ReadonlyArray<readonly [folder: string, label: string]> = [
	['tutorials', 'Tutorials'],
	['how-to', 'How-to Guides'],
	['runbook', 'Runbooks'],
	['reference', 'Reference'],
	['explanation', 'Explanation'],
	['adr', 'Architecture Decision Records'],
]

const ARCHITECTURE_DIR = 'architecture'

const SKIP_FILES: Record<string, true> = { 'index.md': true, 'README.md': true, 'log.md': true }

const OKF_FRONTMATTER = '---\nokf_version: "0.2"\n---\n\n'

const isDir = (path: string): boolean => {
	try {
		return statSync(path).isDirectory()
	} catch {
		return false
	}
}

const titleCase = (slug: string): string =>
	slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const getTitle = (filepath: string): string => {
	try {
		const lines = readFileSync(filepath, 'utf-8').split(/\r?\n/)
		let i = 0
		if (lines[0]?.trim() === '---') {
			const close = lines.findIndex((l, idx) => idx > 0 && l.trim() === '---')
			if (close > 0) i = close + 1
		}
		let inFence = false
		for (; i < lines.length; i++) {
			const line = lines[i].trim()
			if (line.startsWith('```') || line.startsWith('~~~')) inFence = !inFence
			else if (!inFence && line.startsWith('# ')) return line.slice(2).trim()
		}
	} catch (err) {
		stderr.write(`warning: could not read ${filepath}: ${(err as Error).message}\n`)
	}
	const base = filepath.split(sep).pop() ?? filepath
	return titleCase(base.replace(/\.md$/, ''))
}

interface Entry {
	name: string
	fullPath: string
	isDirectory: boolean
	isFile: boolean
}

const listEntries = (dir: string): Entry[] =>
	readdirSync(dir).map((name) => {
		const fullPath = join(dir, name)
		const stat = statSync(fullPath)
		return { name, fullPath, isDirectory: stat.isDirectory(), isFile: stat.isFile() }
	})

const hasVisibleContent = (dir: string): boolean =>
	listEntries(dir).some((e) => e.name === '.gitkeep' || !e.name.startsWith('.'))

const toPosix = (p: string): string => p.split(sep).join(posix.sep)

const renderDirectory = (dir: string, docsRoot: string, headingLevel: number): string => {
	const entries = listEntries(dir)
	const directFiles = entries
		.filter((e) => e.isFile && e.name.endsWith('.md') && !SKIP_FILES[e.name])
		.sort((a, b) => a.name.localeCompare(b.name))
	const childDirs = entries
		.filter((e) => e.isDirectory && !e.name.startsWith('.'))
		.sort((a, b) => a.name.localeCompare(b.name))
	const visibleChildren = childDirs.filter((d) => hasVisibleContent(d.fullPath))
	const hasKeepMarker = entries.some((e) => e.name === '.gitkeep')

	if (directFiles.length === 0 && visibleChildren.length === 0 && !hasKeepMarker) return ''

	const heading = titleCase(dir.split(sep).pop() ?? '')
	let content = `${'#'.repeat(headingLevel)} ${heading}\n\n`

	for (const file of directFiles) {
		const title = getTitle(file.fullPath)
		const link = `${toPosix(relative(docsRoot, dir))}/${file.name}`
		content += `- [${title}](${link})\n`
	}

	if (directFiles.length > 0 && visibleChildren.length > 0) content += '\n'
	if (directFiles.length === 0 && visibleChildren.length === 0) {
		content += '- _No documents yet._\n\n'
	}

	for (const child of visibleChildren) {
		const childContent = renderDirectory(child.fullPath, docsRoot, headingLevel + 1)
		if (childContent) content += childContent
	}

	return content
}

const renderArchitecture = (docsRoot: string): string => {
	const archPath = join(docsRoot, ARCHITECTURE_DIR)
	if (!existsSync(join(archPath, 'index.md'))) return ''

	const bullets = listEntries(archPath)
		.filter((e) => e.isDirectory && !e.name.startsWith('.'))
		.filter((e) => existsSync(join(e.fullPath, 'index.md')))
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((e) => {
			const title = getTitle(join(e.fullPath, 'index.md'))
			return `- [${title}](${ARCHITECTURE_DIR}/${e.name}/index.md)\n`
		})
	if (bullets.length === 0) return ''

	return `## Architecture\n\n${bullets.join('')}\n`
}

const main = (docsRoot: string): number => {
	if (!isDir(docsRoot)) {
		stderr.write(`error: ${docsRoot} is not a directory\n`)
		return 2
	}

	const header =
		OKF_FRONTMATTER +
		`# ${toPosix(docsRoot)} — Documentation Index\n\n` +
		'Generated by the `docs` skill (`scripts/generate-index.ts`). Do not edit by hand —\n' +
		're-run `docs index` after adding or moving files.\n\n'

	let body = ''

	for (const [folder, section] of CATEGORIES) {
		const catPath = join(docsRoot, folder)
		if (!isDir(catPath)) continue

		const entries = listEntries(catPath)
		const rootFiles = entries
			.filter((e) => e.isFile && e.name.endsWith('.md') && !SKIP_FILES[e.name])
			.sort((a, b) => a.name.localeCompare(b.name))
		const subdirs = entries
			.filter((e) => e.isDirectory && !e.name.startsWith('.'))
			.sort((a, b) => a.name.localeCompare(b.name))
		const visibleSubdirs = subdirs.filter((d) => hasVisibleContent(d.fullPath))

		if (rootFiles.length === 0 && visibleSubdirs.length === 0) continue

		if (body.length > 0 && !body.endsWith('\n\n')) body += '\n'
		body += `## ${section}\n\n`

		for (const file of rootFiles) {
			const title = getTitle(file.fullPath)
			body += `- [${title}](${folder}/${file.name})\n`
		}

		if (rootFiles.length > 0 && visibleSubdirs.length > 0) body += '\n'

		for (const sub of visibleSubdirs) {
			body += renderDirectory(sub.fullPath, docsRoot, 3)
			if (!body.endsWith('\n\n')) body += '\n'
		}

		if (rootFiles.length === 0) body += '\n'
	}

	const architecture = renderArchitecture(docsRoot)
	if (architecture) {
		if (body.length > 0 && !body.endsWith('\n\n')) body += '\n'
		body += architecture
	}

	if (body.length === 0) body = '_No documents found yet._\n'

	const indexPath = join(docsRoot, 'index.md')
	writeFileSync(indexPath, (header + body).trimEnd() + '\n', 'utf-8')
	stdout.write(`wrote ${indexPath}\n`)
	return 0
}

const docsRootArg = argv[2] ?? 'docs'
exit(main(docsRootArg))
