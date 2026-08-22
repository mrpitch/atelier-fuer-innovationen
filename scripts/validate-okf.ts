#!/usr/bin/env -S npx tsx
/**
 * validate-okf: check that every non-exempt .md/.mdx file in the repo carries
 * a non-empty OKF `type` frontmatter field (OKF v0.2's one required key).
 *
 * Usage:
 *   npx tsx scripts/validate-okf.ts [root]
 *
 * Exits 0 if the tree is conformant, 1 otherwise (with a report on stderr).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import { argv, exit, stderr, stdout } from 'node:process'

export interface OkfViolation {
	file: string
	reason: string
}

// Directories whose contents are never OKF concept documents, wherever they occur
// (build/vendor output) — skipped entirely rather than filtered file-by-file.
const VENDOR_DIR_NAMES = new Set(['node_modules', '.next', '.source', 'out', '.git'])

// Path prefixes with a fixed, tool-owned frontmatter contract of their own.
const EXEMPT_DIR_PREFIXES = ['.claude/skills/', '.agents/skills/', '.sandcastle/']

// AGENTS.md/CLAUDE.md are loaded verbatim as runtime agent instructions (not read via
// docs-discovery tooling like docs/agents/*.md) — same "don't touch tool-loaded frontmatter" risk as SKILL.md.
const EXEMPT_FILES = new Set([
	'docs/index.md',
	'docs/agents/diataxis-context.md',
	'AGENTS.md',
	'CLAUDE.md',
])

const toPosix = (p: string): string => p.split(sep).join('/')

function isExempt(relPath: string): boolean {
	if (basename(relPath) === 'README.md') return true
	if (EXEMPT_FILES.has(relPath)) return true
	return EXEMPT_DIR_PREFIXES.some((prefix) => relPath.startsWith(prefix))
}

function extractFrontmatterBlock(content: string): string | null {
	if (!content.startsWith('---')) return null
	const end = content.indexOf('\n---', 3)
	if (end === -1) return null
	return content.slice(4, end)
}

function readField(frontmatterBlock: string, key: string): string | undefined {
	for (const line of frontmatterBlock.split('\n')) {
		const colon = line.indexOf(':')
		if (colon === -1) continue
		if (line.slice(0, colon).trim() !== key) continue
		return line
			.slice(colon + 1)
			.trim()
			.replace(/^['"]|['"]$/g, '')
	}
	return undefined
}

function checkFile(absPath: string, relPath: string): OkfViolation | null {
	const content = readFileSync(absPath, 'utf-8')
	const frontmatter = extractFrontmatterBlock(content)
	if (frontmatter === null) {
		return { file: relPath, reason: 'no frontmatter block found' }
	}
	const type = readField(frontmatter, 'type')
	if (!type) {
		return { file: relPath, reason: 'missing or empty required `type` field' }
	}
	return null
}

function walk(dir: string, root: string, violations: OkfViolation[]): void {
	for (const name of readdirSync(dir).sort()) {
		const fullPath = join(dir, name)
		const relPath = toPosix(relative(root, fullPath))
		if (statSync(fullPath).isDirectory()) {
			if (VENDOR_DIR_NAMES.has(name)) continue
			walk(fullPath, root, violations)
		} else if (name.endsWith('.md') || name.endsWith('.mdx')) {
			if (isExempt(relPath)) continue
			const violation = checkFile(fullPath, relPath)
			if (violation) violations.push(violation)
		}
	}
}

export function findOkfViolations(root: string): OkfViolation[] {
	const violations: OkfViolation[] = []
	walk(root, root, violations)
	return violations.sort((a, b) => a.file.localeCompare(b.file))
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`

if (isMain) {
	const root = argv[2] ?? '.'
	const violations = findOkfViolations(root)
	if (violations.length === 0) {
		stdout.write('OKF conformance: OK\n')
		exit(0)
	}
	stderr.write(`OKF conformance: ${violations.length} violation(s)\n\n`)
	for (const { file, reason } of violations) {
		stderr.write(`  ${file}: ${reason}\n`)
	}
	exit(1)
}
