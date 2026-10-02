// Reading a finished file. Two questions only: what is it, and where can the
// browser fetch it from.

import { createHmac } from 'node:crypto'
import { config } from '../config'
import * as db from '../lib/db'
import { isFileId, objectKey } from '../lib/file-id'
import * as storage from '../lib/storage'
import { HttpError } from '../lib/http-error'

export interface FileInfo {
    id: string
    fileName: string
    contentType: string
    size: number
}

// Who is asking. The handler digs these out of the request, because nothing in
// this file knows what an Express request is.
export interface Visitor {
    address: string
    userAgent: string | null
}

// What the download page shows before anyone commits to a one gigabyte download.
export async function info(id: string): Promise<FileInfo> {
    if (!isFileId(id)) throw new HttpError(404, 'This link does not point at a file')

    const file = await db.findFile(id)
    if (!file) throw new HttpError(404, 'This file is not here any more')

    return file
}

// A short-lived URL straight to the bucket. Checking info() first means a dead
// link gets a clear 404 instead of a redirect to a URL that fails oddly.
export async function downloadUrl(id: string, visitor: Visitor): Promise<string> {
    const file = await info(id)

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

// We keep a hash of the address instead of the address itself, which is enough
// to tell two downloads apart without holding anything that points at a person.
// A plain hash would be no protection, because there are few enough addresses to
// simply try them all, so the server's secret goes into the hash as well.
function hashAddress(address: string): string {
    return createHmac('sha256', config.tokenSecret).update(address).digest('base64url')
}
