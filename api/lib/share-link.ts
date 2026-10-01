import { createHmac, timingSafeEqual } from 'node:crypto'
import { config } from '../config'
import { HttpError } from './http-error'

// Only these signed share-link lifetimes are accepted by the upload service.
export type LinkExpiry = '1h' | '1d' | '1w'

const expirySeconds: Record<LinkExpiry, number> = {
    '1h': 60 * 60,
    '1d': 24 * 60 * 60,
    '1w': 7 * 24 * 60 * 60
}

// Use the longest supported lifetime as a safe cleanup bound for older files.
export const MAX_LINK_LIFETIME_SECONDS = Math.max(...Object.values(expirySeconds))

// Share the same expiration timestamp between the signed URL and the R2 cleanup marker.
export function shareLinkExpiresAt(duration: LinkExpiry): number {
    return Math.floor(Date.now() / 1000) + expirySeconds[duration]
}

// Start the lifetime after upload completion and sign both the file id and expiry.
export function createShareLink(id: string, duration: LinkExpiry, expiresAt = shareLinkExpiresAt(duration)): string {
    const signature = sign(id, String(expiresAt))
    const query = new URLSearchParams({ expires: String(expiresAt), signature })

    return `${config.publicBaseUrl}/f/${id}?${query}`
}

// Passwords are never stored in plain text. We hash them with the same secret
// that signs share links so we can compare the value later without exposing it.
export function hashPassword(password: string): string {
    return createHmac('sha256', config.tokenSecret)
        .update(`linkify-password-v1:${password}`)
        .digest('base64url')
}

// The browser can send a password without us ever keeping it in a readable form.
// We only compare the hash to the stored version the upload metadata contains.
export function verifyPassword(password: string, expectedHash: string): boolean {
    const actualHash = hashPassword(password)
    const actualBytes = Buffer.from(actualHash)
    const expectedBytes = Buffer.from(expectedHash)
    return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes)
}

// Reject missing, altered, and expired links before looking up or downloading a file.
export function verifyShareLink(id: string, expiryValue: unknown, signatureValue: unknown): number {
    if (typeof expiryValue !== 'string' || !/^\d+$/.test(expiryValue) || typeof signatureValue !== 'string') {
        throw new HttpError(404, 'This share link is not valid')
    }

    const expiresAt = Number(expiryValue)
    if (!Number.isSafeInteger(expiresAt) || !matches(sign(id, expiryValue), signatureValue)) {
        throw new HttpError(404, 'This share link is not valid')
    }

    if (expiresAt <= Math.floor(Date.now() / 1000)) {
        throw new HttpError(410, 'This share link has expired')
    }

    return expiresAt
}

function sign(id: string, expiresAt: string): string {
    return createHmac('sha256', config.tokenSecret)
        .update(`linkify-share-v1:${id}:${expiresAt}`)
        .digest('base64url')
}

function matches(expected: string, actual: string): boolean {
    const expectedBytes = Buffer.from(expected)
    const actualBytes = Buffer.from(actual)
    return expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes)
}