import assert from 'node:assert/strict'
import test from 'node:test'
import { createRevocationToken, hashRevocationToken } from './share-revocation'

test('revocation tokens are random capabilities and only their hashes are stored', () => {
    const first = createRevocationToken()
    const second = createRevocationToken()

    assert.match(first, /^[A-Za-z0-9_-]{43}$/)
    assert.notEqual(first, second)
    assert.notEqual(hashRevocationToken(first), first)
    assert.equal(hashRevocationToken(first), hashRevocationToken(first))
    assert.notEqual(hashRevocationToken(first), hashRevocationToken(second))
})
