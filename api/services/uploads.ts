// The rules of an upload: how it starts, how it resumes, when it is finished.
//
// The service layer knows nothing about Express. It takes plain values, talks to
// the storage, and returns plain values. That is what makes it easy to read on
// its own and easy to test later.

import { MAX_FILE_SIZE, PART_SIZE, config } from '../config'
import { newFileId, objectKey } from '../lib/file-id'
import * as storage from '../lib/storage'
import { readUploadToken, writeUploadToken } from '../lib/upload-token'
import { HttpError } from '../lib/http-error'
import { createShareLink, hashPassword, LinkExpiry, shareLinkExpiresAt } from '../lib/share-link'

// The upload contract now accepts an optional password. The service validates it
// early and stores only a hash instead of the plain secret.
export interface NewUpload {
    fileName: string
    contentType: string
    size: number
    password?: string
}

export interface StartedUpload {
    token: string
    partSize: number
    totalParts: number
}

// Step one. Reserve a place in the bucket and hand the browser a token that
// stands for this upload from now on.
export async function start(file: NewUpload): Promise<StartedUpload> {
    if (file.size > MAX_FILE_SIZE) {
        throw new HttpError(413, `Files can be at most ${MAX_FILE_SIZE / (1024 * 1024 * 1024)} GB`)
    }

    // An optional password is accepted only when it is long enough. The service
    // hashes it before storing anything in the bucket metadata.
    const password = file.password?.trim()
    if (password !== undefined && password.length > 0 && password.length < 6) {
        throw new HttpError(400, 'Passwords must be at least 6 characters long')
    }

    const id = newFileId()
    const passwordHash = password ? hashPassword(password) : undefined
    const uploadId = await storage.createMultipartUpload(objectKey(id), file.fileName, file.contentType, passwordHash)

    return {
        token: writeUploadToken({ id, uploadId, passwordHash, fileName: file.fileName, contentType: file.contentType, size: file.size }),
        partSize: PART_SIZE,
        totalParts: countParts(file.size)
    }
}

// Step two, asked once when an upload begins or begins again. The browser uses
// the answer to skip everything the storage already has.
export async function uploadedParts(token: string): Promise<storage.StoredPart[]> {
    const upload = readUploadToken(token)
    return storage.listParts(objectKey(upload.id), upload.uploadId)
}

// Step three, asked once per part. We only sign the URL; the bytes go straight
// from the browser to the bucket.
export async function partUrl(token: string, partNumber: number): Promise<string> {
    const upload = readUploadToken(token)
    const totalParts = countParts(upload.size)

    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > totalParts) {
        throw new HttpError(400, `Part number must be a whole number between 1 and ${totalParts}`)
    }

    return storage.presignPartUrl(objectKey(upload.id), upload.uploadId, partNumber)
}

// Step four. Glue the parts together and return the link to share.
export async function finish(token: string, expiresIn: LinkExpiry): Promise<{ id: string; url: string }> {
    const upload = readUploadToken(token)
    const key = objectKey(upload.id)

    // We ask the bucket what it has rather than trusting a list sent by the
    // browser. The bucket is the only place that knows for certain, and its
    // answer already carries the ETags that the next call needs.
    const parts = await storage.listParts(key, upload.uploadId)
    const missing = missingParts(parts, countParts(upload.size))
    if (missing.length > 0) {
        throw new HttpError(409, `${missing.length} part(s) never arrived, starting with part ${missing[0]}`)
    }

    await storage.completeMultipartUpload(key, upload.uploadId, parts)

    // Give the share link and its R2 cleanup marker the same expiration time.
    const expiresAt = shareLinkExpiresAt(expiresIn)
    await storage.scheduleFileDeletion({
        id: upload.id,
        fileName: upload.fileName,
        contentType: upload.contentType,
        size: upload.size,
        passwordProtected: Boolean(upload.passwordHash),
        expiresAt,
        recordedAt: Math.floor(Date.now() / 1000)
    })

    return { id: upload.id, url: createShareLink(upload.id, expiresIn, expiresAt) }
}

// Give up on an upload and let the storage throw away the parts it collected.
export async function cancel(token: string): Promise<void> {
    const upload = readUploadToken(token)
    await storage.abortMultipartUpload(objectKey(upload.id), upload.uploadId)
}

// Every part is PART_SIZE except the last, which holds the remainder.
function countParts(size: number): number {
    return Math.ceil(size / PART_SIZE)
}

function missingParts(parts: storage.StoredPart[], totalParts: number): number[] {
    const arrived = new Set(parts.map(part => part.partNumber))
    const missing: number[] = []

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        if (!arrived.has(partNumber)) missing.push(partNumber)
    }

    return missing
}
