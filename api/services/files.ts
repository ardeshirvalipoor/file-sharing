// A finished file: what it is, where the browser can fetch it from, and deleting
// it once its link runs out.

import { createHmac } from 'node:crypto'
import { config } from '../config'
import * as db from '../lib/db'
import { isFileId, objectKey } from '../lib/file-id'
import * as storage from '../lib/storage'
import { HttpError } from '../lib/http-error'
import { verifyPassword, verifyShareLink } from '../lib/share-link'

export interface FileInfo {
    id: string
    fileName: string
    contentType: string
    size: number
    protected: boolean
}

// Who is asking. The handler digs these out of the request, because nothing in
// this file knows what an Express request is.
export interface Visitor {
    address: string
    userAgent: string | null
}

// What the download page shows before anyone commits to a one gigabyte download.
export async function info(id: string, expiry: unknown, signature: unknown, password?: string): Promise<FileInfo> {
    verifyShareLink(id, expiry, signature)

    const file = await readFileInfo(id)
    requirePassword(file, password)

    return {
        id: file.id,
        fileName: file.fileName,
        contentType: file.contentType,
        size: file.size,
        protected: file.protected
    }
}

// A short-lived URL straight to the bucket. The same checks as info() come first,
// so a dead link gets a clear error instead of a redirect to a URL that fails oddly.
export async function downloadUrl(id: string, expiry: unknown, signature: unknown, visitor: Visitor, password?: string): Promise<string> {
    verifyShareLink(id, expiry, signature)

    const file = await readFileInfo(id)
    requirePassword(file, password)

    // An uncounted download is better than a download that does not happen, so a
    // failure here is written to the log and then forgotten. Every other error
    // in this service is allowed to reach the person.
    try {
        await db.recordDownload(id, hashAddress(visitor.address), visitor.userAgent)
    } catch (error) {
        console.error('Could not record the download', error)
    }
    return storage.presignDownloadUrl(objectKey(id), file.fileName)
}

// Types a browser can only show as a picture, a video or a PDF. Anything else,
// SVG and HTML included, could run as a web page on the storage domain, so it is
// never shown inline. The uploader chooses the type, so this is an exact match.
const INLINE_TYPES = new Set([
    'image/avif', 'image/bmp', 'image/gif', 'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/ogg', 'video/quicktime', 'video/webm',
    'application/pdf'
])

// Preview access validates the same share link and password but deliberately
// avoids recording a download.
export async function previewUrl(id: string, expiry: unknown, signature: unknown, password?: string): Promise<string> {
    verifyShareLink(id, expiry, signature)

    const file = await readFileInfo(id)
    requirePassword(file, password)

    // Any other type goes out as a download. An <img> tag still shows an SVG
    // sent this way, because it ignores the download header.
    if (!INLINE_TYPES.has(file.contentType)) return storage.presignDownloadUrl(objectKey(id), file.fileName)
    return storage.presignPreviewUrl(objectKey(id), file.fileName, file.contentType)
}

// Deletes the bytes of every file whose link has run out. The row stays, marked
// deleted, as the record that the file was once here.
export async function deleteExpired(): Promise<number> {
    const ids = await db.expiredFileIds()
    for (const id of ids) {
        await storage.deleteFile(objectKey(id))
        await db.markFileDeleted(id)
    }
    return ids.length
}

// This hashes the visitor's address before writing a download row, so the
// database stores only a stable fingerprint and never the raw IP.
function hashAddress(address: string): string {
    return createHmac('sha256', config.tokenSecret)
        .update(`linkify-address-v1:${address}`)
        .digest('base64url')
}

async function readFileInfo(id: string): Promise<FileInfo & { passwordHash: string | null }> {
    if (!isFileId(id)) throw new HttpError(404, 'This link does not point at a file')

    const file = await db.findFile(id)
    if (!file) throw new HttpError(404, 'This file is not here any more')

    return {
        id,
        fileName: file.fileName,
        contentType: previewContentType(file.contentType, file.fileName),
        size: file.size,
        protected: Boolean(file.passwordHash),
        passwordHash: file.passwordHash
    }
}

// Recover a useful browser media type when the uploader reported a generic type.
function previewContentType(contentType: string, fileName: string): string {
    if (contentType !== 'application/octet-stream') return contentType

    const extension = fileName.toLowerCase().split('.').pop()
    const knownTypes: Record<string, string> = {
        bmp: 'image/bmp',
        gif: 'image/gif',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        svg: 'image/svg+xml',
        webp: 'image/webp',
        pdf: 'application/pdf',
        m4v: 'video/mp4',
        mov: 'video/quicktime',
        mp4: 'video/mp4',
        ogv: 'video/ogg',
        webm: 'video/webm'
    }
    return extension ? knownTypes[extension] ?? contentType : contentType
}

function requirePassword(file: FileInfo & { passwordHash: string | null }, password?: string): void {
    if (!file.protected) return
    if (typeof password !== 'string' || password.length === 0) {
        throw new HttpError(401, 'This file is password protected')
    }

    if (!file.passwordHash || !verifyPassword(password, file.passwordHash)) {
        throw new HttpError(401, 'This password is not correct')
    }
}
