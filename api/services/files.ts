// Reading a finished file. Two questions only: what is it, and where can the
// browser fetch it from.

import { isFileId, objectKey } from '../lib/file-id'
import * as storage from '../lib/storage'
import { HttpError } from '../lib/http-error'

export interface FileInfo {
    id: string
    fileName: string
    contentType: string
    size: number
}

// What the download page shows before anyone commits to a one gigabyte download.
export async function info(id: string): Promise<FileInfo> {
    if (!isFileId(id)) throw new HttpError(404, 'This link does not point at a file')

    const file = await storage.headFile(objectKey(id))
    if (!file) throw new HttpError(404, 'This file is not here any more')

    return { id, ...file }
}

// A short-lived URL straight to the bucket. Checking info() first means a dead
// link gets a clear 404 instead of a redirect to a URL that fails oddly.
export async function downloadUrl(id: string): Promise<string> {
    const file = await info(id)
    return storage.presignDownloadUrl(objectKey(id), file.fileName)
}
