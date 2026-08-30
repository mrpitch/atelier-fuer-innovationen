import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'

import { findContentViolations } from './validate-content'

let root: string
const createdRoots: string[] = []

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'content-test-'))
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

test('a fully conformant tree returns no violations', () => {
	write(
		'src/data/illus.json',
		JSON.stringify({ illus: [{ slug: 'illustration-1', name: 'Illustration 1', image: '/illus/illustration-1.png' }] }),
	)
	write('public/illus/illustration-1.png', 'fake-png')
	write(
		'src/data/slides.json',
		JSON.stringify({ slides: [{ slug: 'slide-1', name: 'Slide 1', image: '/slides/slide-1.jpg', url: '/slides/slide-1.pdf' }] }),
	)
	write('public/slides/slide-1.jpg', 'fake-jpg')
	write('public/slides/slide-1.pdf', 'fake-pdf')
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['index', 'xeniapolis'] }))
	write('src/content/docs/index.mdx', '# Home\n')
	write(
		'src/content/docs/xeniapolis/meta.json',
		JSON.stringify({ pages: ['---Zentrum---', 'index', '!hidden'] }),
	)
	write(
		'src/content/docs/xeniapolis/index.mdx',
		'# Xeniapolis\n\n<Illu slug="illustration-1" />\n\n<Slide slug="slide-1" />\n\n![alt](./local.png)\n\n[link](./local.png)\n\n[external](https://example.com)\n\n[absolute](/xeniapolis/hidden)\n',
	)
	write('src/content/docs/xeniapolis/hidden.mdx', '# Hidden\n')
	write('src/content/docs/xeniapolis/local.png', 'fake-png')

	assert.deepEqual(findContentViolations(root), [])
})

test('an <Illu> slug with no matching illus.json entry is a violation', () => {
	write('src/data/illus.json', JSON.stringify({ illus: [] }))
	write('src/content/docs/xeniapolis/index.mdx', '<Illu slug="missing-illu" />\n')

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].file, 'src/content/docs/xeniapolis/index.mdx')
	assert.match(violations[0].reason, /missing-illu/)
})

test('a <Slide> slug with no matching slides.json entry is a violation', () => {
	write('src/data/slides.json', JSON.stringify({ slides: [] }))
	write('src/content/docs/xeniapolis/index.mdx', '<Slide slug="missing-slide" />\n')

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /missing-slide/)
})

test('an illus.json image that does not resolve under public/ is a violation', () => {
	write('src/data/illus.json', JSON.stringify({ illus: [{ slug: 'a', name: 'A', image: '/illus/missing.png' }] }))

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].file, 'src/data/illus.json')
	assert.match(violations[0].reason, /missing\.png/)
})

test('a slides.json image that does not resolve under public/ is a violation', () => {
	write('src/data/slides.json', JSON.stringify({ slides: [{ slug: 'a', name: 'A', image: '/slides/missing.jpg' }] }))

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].file, 'src/data/slides.json')
	assert.match(violations[0].reason, /missing\.jpg/)
})

test('a slides.json url that does not resolve under public/ is a violation', () => {
	write('public/slides/a.jpg', 'fake-jpg')
	write(
		'src/data/slides.json',
		JSON.stringify({ slides: [{ slug: 'a', name: 'A', image: '/slides/a.jpg', url: '/slides/missing.pdf' }] }),
	)

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /missing\.pdf/)
})

test('a slides.json entry with no url is fine', () => {
	write('public/slides/a.jpg', 'fake-jpg')
	write('src/data/slides.json', JSON.stringify({ slides: [{ slug: 'a', name: 'A', image: '/slides/a.jpg' }] }))

	assert.deepEqual(findContentViolations(root), [])
})

test('a meta.json pages entry that resolves to neither a file nor a folder is a violation', () => {
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['nonexistent'] }))

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].file, 'src/content/docs/meta.json')
	assert.match(violations[0].reason, /nonexistent/)
})

test('a meta.json pages entry resolving to a sibling mdx file passes', () => {
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['index', 'about'] }))
	write('src/content/docs/index.mdx', '# Home\n')
	write('src/content/docs/about.mdx', '# About\n')

	assert.deepEqual(findContentViolations(root), [])
})

test('a meta.json pages entry resolving to a subfolder passes', () => {
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['xeniapolis'] }))
	write('src/content/docs/xeniapolis/index.mdx', '# Xeniapolis\n')

	assert.deepEqual(findContentViolations(root), [])
})

test('meta.json separator entries are ignored', () => {
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['---Section---', '---', 'index'] }))
	write('src/content/docs/index.mdx', '# Home\n')

	assert.deepEqual(findContentViolations(root), [])
})

test('meta.json "..." rest entries are ignored', () => {
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['index', '...'] }))
	write('src/content/docs/index.mdx', '# Home\n')

	assert.deepEqual(findContentViolations(root), [])
})

test('a "!"-prefixed meta.json pages entry still must resolve', () => {
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['!impressum'] }))

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /impressum/)
})

test('a "!"-prefixed meta.json pages entry passes when the page exists', () => {
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['!impressum'] }))
	write('src/content/docs/impressum.mdx', '# Impressum\n')

	assert.deepEqual(findContentViolations(root), [])
})

test('an "..." extract-from-folder meta.json pages entry that does not resolve to a folder is a violation', () => {
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['...missing-folder'] }))

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /missing-folder/)
})

test('an "..." extract-from-folder meta.json pages entry passes when the folder exists', () => {
	write('src/content/docs/meta.json', JSON.stringify({ pages: ['...xeniapolis'] }))
	write('src/content/docs/xeniapolis/index.mdx', '# Xeniapolis\n')

	assert.deepEqual(findContentViolations(root), [])
})

test('a relative image path in MDX that does not resolve is a violation', () => {
	write('src/content/docs/xeniapolis/index.mdx', '![alt](./missing.png)\n')

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.equal(violations[0].file, 'src/content/docs/xeniapolis/index.mdx')
	assert.match(violations[0].reason, /missing\.png/)
})

test('a relative link path in MDX that does not resolve is a violation', () => {
	write('src/content/docs/xeniapolis/index.mdx', '[doc](./missing.pdf)\n')

	const violations = findContentViolations(root)
	assert.equal(violations.length, 1)
	assert.match(violations[0].reason, /missing\.pdf/)
})

test('a relative path resolving to a sibling file passes', () => {
	write('src/content/docs/xeniapolis/index.mdx', '![alt](./present.png)\n\n[doc](present.pdf)\n')
	write('src/content/docs/xeniapolis/present.png', 'fake-png')
	write('src/content/docs/xeniapolis/present.pdf', 'fake-pdf')

	assert.deepEqual(findContentViolations(root), [])
})

test('absolute site paths, external URLs, and anchors in MDX are not checked', () => {
	write(
		'src/content/docs/xeniapolis/index.mdx',
		'![alt](/illus/whatever.png)\n\n[a](https://example.com/x)\n\n[b](#some-heading)\n\n[c](mailto:a@b.com)\n',
	)

	assert.deepEqual(findContentViolations(root), [])
})

test('missing illus.json/slides.json data files are treated as empty datasets', () => {
	write('src/content/docs/xeniapolis/index.mdx', '# Xeniapolis\n')

	assert.deepEqual(findContentViolations(root), [])
})
