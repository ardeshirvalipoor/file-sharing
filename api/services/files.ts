// Reading a finished file. Two questions only: what is it, and where can the
// browser fetch it from.

import { createHmac } from 'node:crypto'
import { config } from '../config'
import * as db from '../lib/db'
import { isFileId, objectKey } from '../lib/file-id'
import * as storage from '../lib/storage'
import { HttpError } from '../lib/http-error'
import { DOWNLOAD_URL_TTL } from '../config'
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

// Keep the short-lived storage URL from lasting beyond the share link itself.
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

// This hashes the visitor's address before writing a download row, so the
// database stores only a stable fingerprint and never the raw IP.
function hashAddress(address: string): string {
    return createHmac('sha256', config.tokenSecret)
        .update(`linkify-address-v1:${address}`)
        .digest('base64url')
}

async function readFileInfo(id: string): Promise<FileInfo & { passwordHash: string | null }> {
    if (!isFileId(id)) throw new HttpError(404, 'This link does not point at a file')

    const databaseFile = await db.findFile(id)
    if (!databaseFile) throw new HttpError(404, 'This file is not here any more')

    const storedFile = await storage.headFile(objectKey(id))
    if (!storedFile) throw new HttpError(404, 'This file is not here any more')

    return {
        id,
        fileName: databaseFile.fileName,
        contentType: previewContentType(databaseFile.contentType, databaseFile.fileName),
        size: databaseFile.size,
        // Fall back to object metadata only for files predating the DB column.
        protected: Boolean(databaseFile.passwordHash || storedFile.passwordHash),
        passwordHash: databaseFile.passwordHash || storedFile.passwordHash || null
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
