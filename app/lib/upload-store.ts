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

// Include sampled file bytes so different files with matching names, sizes, and
// timestamps cannot accidentally resume the same upload or reuse its share id.
export async function fingerprint(file: File): Promise<string> {
    const sampleSize = 64 * 1024
    const offsets = [...new Set([
        0,
        Math.max(0, Math.floor((file.size - sampleSize) / 2)),
        Math.max(0, file.size - sampleSize)
    ])]
    const samples = await Promise.all(offsets.map(offset =>
        file.slice(offset, Math.min(offset + sampleSize, file.size)).arrayBuffer()
    ))
    const metadata = new TextEncoder().encode(JSON.stringify([file.name, file.size, file.lastModified, offsets]))
    const combined = new Uint8Array(metadata.length + samples.reduce((size, sample) => size + sample.byteLength, 0))
    combined.set(metadata)

    let cursor = metadata.length
    for (const sample of samples) {
        combined.set(new Uint8Array(sample), cursor)
        cursor += sample.byteLength
    }

    const digest = await crypto.subtle.digest('SHA-256', combined)
    const hex = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
    return `v2:${hex}`
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
