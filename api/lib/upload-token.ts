import { createHmac, timingSafeEqual } from 'node:crypto'
import { config } from '../config'
import { HttpError } from './http-error'

// An upload token holds everything we know about one upload in progress.
//
// We hand it to the browser and ask for it back on every later request. That is
// what lets this service run with no database at all: the state lives in the
// browser, not on the machine, so a restarted or replaced Fly machine forgets
// nothing.
//
// The signature is what makes that safe. The browser can read the token, but it
// cannot change one byte of it without us noticing, because only we know the
// secret. Without a signature, anyone could edit the size, the file name, or
// somebody else's upload id.

// Optional password protection is part of the upload state. We keep the hash in
// the signed token so an interrupted upload can resume without exposing the secret.
export interface UploadToken {
    id: string          // the share id, which is also the storage key
    uploadId: string    // the storage's own id for this multipart upload
    fileName: string
    contentType: string
    size: number
    passwordHash?: string
}

export function writeUploadToken(upload: UploadToken): string {
    const payload = Buffer.from(JSON.stringify(upload)).toString('base64url')
    return `${payload}.${sign(payload)}`
}

export function readUploadToken(token: string): UploadToken {
    const [payload, signature] = token.split('.')
    if (!payload || !signature || !matches(sign(payload), signature)) {
        throw new HttpError(400, 'This upload token is not valid')
    }

    // Safe to trust after the signature check: we wrote this JSON ourselves.
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as UploadToken
}

function sign(payload: string): string {
    return createHmac('sha256', config.tokenSecret).update(payload).digest('base64url')
}

// Comparing two signatures with === returns false as soon as it hits a
// different character. Someone measuring how long the answer takes could learn
// the signature one character at a time. timingSafeEqual always looks at every
// byte, so the reply takes the same time whatever the input.
function matches(expected: string, actual: string): boolean {
    const a = Buffer.from(expected)
    const b = Buffer.from(actual)
    return a.length === b.length && timingSafeEqual(a, b)
}
