import assert from 'node:assert/strict'
import test from 'node:test'
import { describeUploadFailure } from './upload-error'

// The browser should get a direct hint about the missing Cloudflare R2 CORS rule
// instead of a vague "connection dropped" error that looks like a random bug.
test('upload failure explains the Cloudflare R2 CORS requirement', () => {
    const message = describeUploadFailure('The connection dropped')

    assert.match(message, /Cloudflare R2/i)
    assert.match(message, /CORS/i)
    assert.match(message, /AllowedOrigins/i)
})
