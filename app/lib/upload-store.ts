// Notes about uploads that have not finished yet, kept in the browser's own
// database. This is what makes an upload survive a closed tab: the token lives
// here, and the token is everything the server needs to carry on.
//
// We deliberately do not store the file itself. The person picks it again, and
// because the storage already holds the finished parts, only the rest is sent.

import { idb } from '@codesuma/baseline'

const db = idb('file-sharing')
const STORE = 'uploads'

export interface RememberedUpload {
    fingerprint: string
    token: string
    partSize: number
    totalParts: number
    fileName: string
    startedAt: number
}

// IndexedDB creates its stores during a version upgrade, so this has to finish
// before anything reads or writes. app/index.ts waits for it before mounting.
export function ready(): Promise<void> {
    return db.createStore(STORE, 1, { keyPath: 'fingerprint', autoIncrement: false })
}

// Two files with the same name, size and modified date are the same file as far
// as we are concerned. The browser never tells us where a file lives on disk,
// so this is the closest thing to an identity available to us.
export function fingerprint(file: File): string {
    return `${file.name}:${file.size}:${file.lastModified}`
}

export function remember(upload: RememberedUpload): Promise<unknown> {
    return db.save(STORE, upload)
}

export function recall(fingerprint: string): Promise<RememberedUpload | undefined> {
    return db.get<RememberedUpload>(STORE, fingerprint)
}

export function forget(fingerprint: string): Promise<void> {
    return db.delete(STORE, fingerprint)
}
