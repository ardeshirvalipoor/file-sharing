import assert from 'node:assert/strict'
import test from 'node:test'
import { createShareLink, hashPassword, verifyShareLink } from './share-link'

// This regression test guards the password hashing flow. It makes sure the hash is
// stable and that unsigned share links continue to work exactly as before.
test('hashPassword is stable and share links still validate without a password', () => {
    const password = 'S3cret!123'
    const hash = hashPassword(password)

    assert.notEqual(hash, password)
    assert.equal(hashPassword(password), hash)

    const url = new URL(createShareLink('abc123', '1h'))
    const expires = url.searchParams.get('expires')
    const signature = url.searchParams.get('signature')

    assert.ok(expires)
    assert.ok(signature)
    assert.doesNotThrow(() => verifyShareLink('abc123', expires, signature))
})

// A valid signature does not keep a link usable after its deadline.
test('share links are rejected after their signed expiration time', () => {
    const expiredAt = Math.floor(Date.now() / 1000) - 1
    const url = new URL(createShareLink('abc123', '1h', expiredAt))

    assert.throws(
        () => verifyShareLink('abc123', url.searchParams.get('expires'), url.searchParams.get('signature')),
        /expired/
    )
})
