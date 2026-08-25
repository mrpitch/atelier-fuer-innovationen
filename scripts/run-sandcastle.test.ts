import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildImplementRunOptions, buildReviewRunOptions } from './run-sandcastle'

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
