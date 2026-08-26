import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

import {
	assertGuardrailsPresent,
	buildImplementRunOptions,
	buildReviewRunOptions,
	ensureContainerCacheDirs,
	GUARDRAIL_ARTIFACTS,
} from './run-sandcastle'

// docker() refuses to build a sandbox whose mount host paths don't exist, and
// the container caches are gitignored — so on a clean checkout these tests
// fail on a missing directory rather than on anything they mean to assert.
// runSandcastle() calls this for the same reason before it builds a sandbox.
ensureContainerCacheDirs()

const input = {
	issueNumber: '67',
	issueTitle: 'sandcastle: deliver agent settings via the image, not the branch',
	issueBody: 'test issue body',
	fixedPoint: 'origin/main',
}

test('the implement run is marked sandboxed with the implement role', () => {
	const options = buildImplementRunOptions(input, 12345)
	assert.equal(options.sandbox.env.SANDCASTLE_SANDBOXED, '1')
	assert.equal(options.sandbox.env.SANDCASTLE_ROLE, 'implement')
})

test('the review run is marked sandboxed with the review role', () => {
	const options = buildReviewRunOptions(input, 12345)
	assert.equal(options.sandbox.env.SANDCASTLE_SANDBOXED, '1')
	assert.equal(options.sandbox.env.SANDCASTLE_ROLE, 'review')
})

function writeArtifact(dir: string, artifact: string) {
	const path = join(dir, artifact)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, '')
}

test('assertGuardrailsPresent does not throw when every guardrail artifact exists', () => {
	const dir = mkdtempSync(join(tmpdir(), 'sandcastle-guardrails-present-'))
	try {
		for (const artifact of GUARDRAIL_ARTIFACTS) {
			writeArtifact(dir, artifact)
		}
		assert.doesNotThrow(() => assertGuardrailsPresent(dir))
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
})

test('assertGuardrailsPresent throws naming the missing artifact', () => {
	const dir = mkdtempSync(join(tmpdir(), 'sandcastle-guardrails-missing-'))
	try {
		const [missingArtifact, ...presentArtifacts] = GUARDRAIL_ARTIFACTS
		for (const artifact of presentArtifacts) {
			writeArtifact(dir, artifact)
		}
		assert.throws(() => assertGuardrailsPresent(dir), new RegExp(missingArtifact.replace(/\./g, '\\.')))
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
})

test('assertGuardrailsPresent names the epic branch, not trunk, when base-branch.txt records one', () => {
	const dir = mkdtempSync(join(tmpdir(), 'sandcastle-guardrails-missing-subissue-'))
	try {
		const [, ...presentArtifacts] = GUARDRAIL_ARTIFACTS
		for (const artifact of presentArtifacts) {
			writeArtifact(dir, artifact)
		}
		writeArtifact(dir, '.sandcastle/base-branch.txt')
		writeFileSync(join(dir, '.sandcastle', 'base-branch.txt'), 'origin/epic/64-sandcastle-guardrails\n')
		assert.throws(() => assertGuardrailsPresent(dir), /rebase onto origin\/epic\/64-sandcastle-guardrails/)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
})
