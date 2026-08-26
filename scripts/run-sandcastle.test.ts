import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
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
	readEfficiencyRulesFromTrunk,
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
	efficiencyRules: 'test efficiency rules text',
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

test('the implement run templates the efficiency rules text into the prompt args', () => {
	const options = buildImplementRunOptions(input, 12345)
	assert.equal(options.promptArgs.EFFICIENCY_RULES, input.efficiencyRules)
})

test('the review run templates the efficiency rules text into the prompt args', () => {
	const options = buildReviewRunOptions(input, 12345)
	assert.equal(options.promptArgs.EFFICIENCY_RULES, input.efficiencyRules)
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

test('assertGuardrailsPresent does not require the efficiency-rules file (#74: sourced from trunk, not the branch tree)', () => {
	const dir = mkdtempSync(join(tmpdir(), 'sandcastle-guardrails-no-rules-file-'))
	try {
		writeArtifact(dir, 'AGENTS.md')
		writeArtifact(dir, 'CLAUDE.md')
		assert.doesNotThrow(() => assertGuardrailsPresent(dir))
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
})

// A hermetic origin/HEAD == "trunk" repo, unrelated to this actual repo's own
// remote: a temp bare repo as origin, a temp working copy pointed at it,
// with the rules file committed only on trunk and the checked-out branch
// left with a different (or missing) tree. Exercises #74's acceptance
// criterion directly: a run started from a branch whose tree lacks the
// rules file must still get the trunk copy.
function initRepoWithTrunkRules(rulesText: string): { workDir: string; originDir: string } {
	const originDir = mkdtempSync(join(tmpdir(), 'sandcastle-trunk-origin-'))
	const workDir = mkdtempSync(join(tmpdir(), 'sandcastle-trunk-work-'))
	execFileSync('git', ['init', '-q', '--bare', '-b', 'trunk', originDir])
	execFileSync('git', ['init', '-q', '-b', 'trunk'], { cwd: workDir })
	execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: workDir })
	execFileSync('git', ['config', 'user.name', 'Test'], { cwd: workDir })
	mkdirSync(join(workDir, '.sandcastle'), { recursive: true })
	writeFileSync(join(workDir, '.sandcastle', 'efficiency-rules.md'), rulesText)
	execFileSync('git', ['add', '.'], { cwd: workDir })
	execFileSync('git', ['commit', '-q', '-m', 'trunk rules'], { cwd: workDir })
	execFileSync('git', ['remote', 'add', 'origin', originDir], { cwd: workDir })
	execFileSync('git', ['push', '-q', 'origin', 'trunk'], { cwd: workDir })
	execFileSync('git', ['remote', 'set-head', 'origin', '-a'], { cwd: workDir })

	// Move the checked-out branch away from trunk and drop the file from its
	// tree entirely, so a filesystem read would come back empty/missing.
	execFileSync('git', ['checkout', '-q', '-b', 'feature'], { cwd: workDir })
	execFileSync('git', ['rm', '-q', '.sandcastle/efficiency-rules.md'], { cwd: workDir })
	execFileSync('git', ['commit', '-q', '-m', 'drop rules from feature branch'], { cwd: workDir })

	return { workDir, originDir }
}

test('readEfficiencyRulesFromTrunk reads trunk content even when the checked-out branch lacks the file', () => {
	const { workDir, originDir } = initRepoWithTrunkRules('trunk-only rules text\n')
	try {
		assert.equal(readEfficiencyRulesFromTrunk(workDir), 'trunk-only rules text')
	} finally {
		rmSync(workDir, { recursive: true, force: true })
		rmSync(originDir, { recursive: true, force: true })
	}
})
