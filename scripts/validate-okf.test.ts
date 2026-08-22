import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'

import { findOkfViolations } from './validate-okf'

let root: string
const createdRoots: string[] = []

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'okf-test-'))
	createdRoots.push(root)
})

after(() => {
	for (const dir of createdRoots) rmSync(dir, { recursive: true, force: true })
})

function write(relPath: string, content: string): void {
	const full = join(root, relPath)
	mkdirSync(join(full, '..'), { recursive: true })
	writeFileSync(full, content)
}

test('a conformant file with a non-empty type passes', () => {
	write('docs/reference/widget.md', '---\nname: Widget\ntype: Reference\n---\n\n# Widget\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('a file with frontmatter but no type field fails', () => {
	write('docs/reference/widget.md', '---\nname: Widget\n---\n\n# Widget\n')
	const violations = findOkfViolations(root)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].file, 'docs/reference/widget.md')
})

test('a file with an empty type value fails', () => {
	write('docs/reference/widget.md', '---\nname: Widget\ntype:\n---\n\n# Widget\n')
	const violations = findOkfViolations(root)
	assert.equal(violations.length, 1)
})

test('a file with no frontmatter at all fails', () => {
	write('docs/reference/widget.md', '# Widget\n\nNo frontmatter here.\n')
	const violations = findOkfViolations(root)
	assert.equal(violations.length, 1)
})

test('any README.md is exempt regardless of depth', () => {
	write('README.md', '# Root readme\n')
	write('docs/how-to/README.md', '# How-to index\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('docs/index.md is exempt', () => {
	write('docs/index.md', '# Generated index\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('docs/agents/diataxis-context.md is exempt', () => {
	write('docs/agents/diataxis-context.md', '# Generated project context\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('.claude/skills/** is exempt', () => {
	write('.claude/skills/some-skill/SKILL.md', '---\nname: some-skill\n---\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('.agents/skills/** is exempt', () => {
	write('.agents/skills/some-skill/SKILL.md', '---\nname: some-skill\n---\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('root AGENTS.md and CLAUDE.md are exempt', () => {
	write('AGENTS.md', '# Agent skills\n')
	write('CLAUDE.md', 'See AGENTS.md.\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('.sandcastle/** is exempt', () => {
	write('.sandcastle/prompt.md', '# Sandcastle prompt\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('non-markdown files are ignored', () => {
	write('docs/reference/notes.txt', 'not markdown\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('build/vendor output directories are skipped', () => {
	write('node_modules/some-pkg/README.md', '# ignored anyway (readme)\n')
	write('node_modules/some-pkg/CHANGELOG.md', 'no frontmatter\n')
	write('.next/cache/thing.md', 'no frontmatter\n')
	write('.source/generated.md', 'no frontmatter\n')
	write('out/exported.md', 'no frontmatter\n')
	const violations = findOkfViolations(root)
	assert.deepEqual(violations, [])
})

test('mdx files are validated the same way as md files', () => {
	write('src/content/docs/atelier/seite-1.mdx', '---\ntitle: Seite 1\n---\n')
	const violations = findOkfViolations(root)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].file, 'src/content/docs/atelier/seite-1.mdx')
})
