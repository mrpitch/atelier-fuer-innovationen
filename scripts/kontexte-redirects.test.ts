import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
	kontexteRedirects,
	resolveKontexteRedirect,
} from '../src/data/kontexte-redirects'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function targetFile(to: string): string {
	// `to` is an absolute `/docs/...` route; the matching MDX source file is
	// either `<path>.mdx` or `<path>/index.mdx`.
	const relative = to.replace(/^\/docs\//, 'src/content/docs/')
	return relative
}

test('every old Kontexte address has exactly 63 entries, one per #151 slide', () => {
	assert.equal(Object.keys(kontexteRedirects).length, 63)
})

test('every redirect target resolves to a real MDX file on disk', () => {
	for (const [oldSlug, to] of Object.entries(kontexteRedirects)) {
		const base = join(REPO_ROOT, targetFile(to))
		const resolves =
			existsSync(`${base}.mdx`) || existsSync(join(base, 'index.mdx'))
		assert.ok(resolves, `${oldSlug} -> ${to} does not resolve to a file`)
	}
})

test('resolveKontexteRedirect finds a known old address', () => {
	assert.equal(
		resolveKontexteRedirect(['xeniapolis', 'kontexte', 'ewelt1a']),
		'/docs/xeniapolis/kontexte/einstimmung-zur-zukunftsgestaltung/wandel-der-beschaeftigungsstruktur'
	)
})

test('resolveKontexteRedirect ignores addresses outside kontexte/', () => {
	assert.equal(
		resolveKontexteRedirect(['xeniapolis', 'annaeherung', 'umgebung']),
		undefined
	)
})

test('resolveKontexteRedirect ignores a current (non-redirected) kontexte address', () => {
	assert.equal(
		resolveKontexteRedirect([
			'xeniapolis',
			'kontexte',
			'einstimmung-zur-zukunftsgestaltung',
		]),
		undefined
	)
})

test('resolveKontexteRedirect ignores slugs of the wrong shape', () => {
	assert.equal(resolveKontexteRedirect(undefined), undefined)
	assert.equal(resolveKontexteRedirect(['xeniapolis', 'kontexte']), undefined)
	assert.equal(
		resolveKontexteRedirect([
			'xeniapolis',
			'kontexte',
			'einstimmung-zur-zukunftsgestaltung',
			'ewelt1a',
		]),
		undefined
	)
})
