// Reading a finished file. Two questions only: what is it, and where can the
// browser fetch it from.

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
export async function downloadUrl(id: string, expiry: unknown, signature: unknown, password?: string): Promise<string> {
    const expiresAt = verifyShareLink(id, expiry, signature)
    const file = await readFileInfo(id)
    requirePassword(file, password)
    const remainingSeconds = expiresAt - Math.floor(Date.now() / 1000)
    return storage.presignDownloadUrl(objectKey(id), file.fileName, Math.min(DOWNLOAD_URL_TTL, remainingSeconds))
}

async function readFileInfo(id: string): Promise<FileInfo & { passwordHash?: string }> {
    if (!isFileId(id)) throw new HttpError(404, 'This link does not point at a file')

    const file = await storage.headFile(objectKey(id))
    if (!file) throw new HttpError(404, 'This file is not here any more')

    return {
        id,
        fileName: file.fileName,
        contentType: file.contentType,
        size: file.size,
        protected: Boolean(file.passwordHash),
        passwordHash: file.passwordHash
    }
}

function requirePassword(file: FileInfo & { passwordHash?: string }, password?: string): void {
    if (!file.protected) return
    if (typeof password !== 'string' || password.length === 0) {
        throw new HttpError(401, 'This file is password protected')
    }

    if (!file.passwordHash || !verifyPassword(password, file.passwordHash)) {
        throw new HttpError(401, 'This password is not correct')
    }
}
