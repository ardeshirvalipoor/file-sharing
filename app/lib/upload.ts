// The resumable upload, from start to share link. This is the heart of the app.
//
// The shape of it:
//   1. Work out whether we have seen this file before.
//   2. Ask the server which parts the storage already holds.
//   3. Send only the parts that are missing, a few at a time.
//   4. Ask the server to glue them together.
//
// Nothing here touches the screen. The page passes in two callbacks and decides
// for itself what to draw.

import { waitFor } from '@codesuma/baseline'
import * as api from './api'
import { fingerprint, forget, recall, remember } from './upload-store'

// How many parts travel at once. More than a handful stops helping: the parts
// start competing for the same connection and each one just gets slower.
const CONCURRENT_PARTS = 3

// How many tries one part gets before we give up on the whole upload.
const ATTEMPTS_PER_PART = 3

export interface UploadReport {
    uploadedBytes: number
    totalBytes: number
}

export interface UploadOptions {
    onStatus(message: string): void
    onProgress(report: UploadReport): void
}

// Optional passwords are carried through the resumable upload flow so a file can
// be protected without forcing the browser to restart its upload from the top.
export async function uploadFile(file: File, options: UploadOptions, expiresIn: api.LinkExpiry, password?: string): Promise<{ id: string; url: string }> {
    const id = fingerprint(file)
    const upload = await openUpload(file, id, options, password)

    // Bytes the storage already has. Zero for a fresh upload, possibly almost
    // the whole file for a resumed one.
    let settledBytes = sum(upload.parts.map(part => part.size))

    // Bytes of the parts currently in the air, one entry per part. They are kept
    // apart from settledBytes because a part that fails halfway has to give its
    // bytes back, and this is where we take them from.
    const inFlightBytes = new Map<number, number>()

    const report = () => options.onProgress({
        uploadedBytes: settledBytes + sum([...inFlightBytes.values()]),
        totalBytes: file.size
    })

    const alreadyThere = new Set(upload.parts.map(part => part.partNumber))
    const missing = countUp(upload.totalParts).filter(partNumber => !alreadyThere.has(partNumber))

    options.onStatus(`Sending ${missing.length} of ${upload.totalParts} parts`)
    report()

    await inParallel(missing, CONCURRENT_PARTS, async partNumber => {
        const part = partOf(file, partNumber, upload.partSize)

        await sendPart(upload.token, partNumber, part, sentBytes => {
            inFlightBytes.set(partNumber, sentBytes)
            report()
        })

        // The part landed, so its bytes move from "in the air" to "settled".
        inFlightBytes.delete(partNumber)
        settledBytes += part.size
        report()
    })

    options.onStatus('Putting the parts together')
    const finished = await api.finishUpload(upload.token, expiresIn)

    // The upload is done, so the note about it is no longer worth keeping.
    await forget(id)

    return finished
}

// Throws away an unfinished upload: tells the storage to drop the parts it
// collected, then forgets our note about it.
export async function discardUpload(file: File): Promise<void> {
    const id = fingerprint(file)
    const remembered = await recall(id)
    if (!remembered) return

    try {
        await api.cancelUpload(remembered.token)
    } catch {
        // The storage may have dropped it already. Either way it is gone, which
        // is what we wanted.
    }

    await forget(id)
}

// Whether an earlier upload of this exact file is waiting to be continued.
export function resumableUpload(file: File) {
    return recall(fingerprint(file))
}

interface OpenUpload {
    token: string
    partSize: number
    totalParts: number
    parts: api.UploadedPart[]
}

// Finds or creates the upload this file belongs to, and asks the storage what it
// already has.
async function openUpload(file: File, id: string, options: UploadOptions, password?: string): Promise<OpenUpload> {
    const remembered = await recall(id)

    if (remembered) {
        try {
            const parts = await api.uploadedParts(remembered.token)
            options.onStatus(`Continuing an earlier upload, ${parts.length} of ${remembered.totalParts} parts already sent`)
            return { ...remembered, parts }
        } catch {
            // The storage no longer knows this upload. It was finished, thrown
            // away, or cleaned up. There is nothing to continue, so we drop our
            // note and begin again.
            await forget(id)
        }
    }

    options.onStatus('Preparing the upload')
    const started = await api.startUpload(file, password)

    await remember({
        fingerprint: id,
        fileName: file.name,
        startedAt: Date.now(),
        ...started
    })

    return { ...started, parts: [] }
}

// Sends one part, with a fresh URL and a fresh try each time it fails.
async function sendPart(token: string, partNumber: number, part: Blob, onProgress: (sentBytes: number) => void): Promise<void> {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_PART; attempt++) {
        try {
            // A new URL every attempt, in case the previous one had gone stale.
            const url = await api.partUrl(token, partNumber)
            await put(url, part, onProgress)
            return
        } catch (problem) {
            if (attempt === ATTEMPTS_PER_PART) {
                const cause = problem instanceof Error ? problem.message : 'unknown reason'
                throw new Error(`Part ${partNumber} failed ${ATTEMPTS_PER_PART} times in a row: ${cause}`)
            }

            // The retry starts from zero bytes, so the progress bar must not
            // keep counting what the failed attempt had sent.
            onProgress(0)
            await waitFor(attempt * 1000)
        }
    }
}

// Sends the bytes straight to the storage.
//
// This is the one place the app drops to a raw browser API instead of baseline.
// baseline's http.upload always sends a POST and sets a Content-Type header, and
// a presigned URL only accepts the exact request it was signed for: a PUT with
// the raw bytes and nothing added. fetch() cannot report upload progress at all,
// so XMLHttpRequest it is.
function put(url: string, body: Blob, onProgress: (sentBytes: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.open('PUT', url)

        request.upload.onprogress = event => {
            if (event.lengthComputable) onProgress(event.loaded)
        }

        request.onload = () => {
            if (request.status >= 200 && request.status < 300) resolve()
            else reject(new Error(`The storage answered ${request.status}`))
        }

        request.onerror = () => reject(new Error('The connection dropped'))
        request.send(body)
    })
}

// A window onto one part of the file. slice() reads nothing; the bytes are only
// pulled off the disk while the request sends them, which is why a one gigabyte
// file never sits in memory.
function partOf(file: File, partNumber: number, partSize: number): Blob {
    const start = (partNumber - 1) * partSize
    return file.slice(start, Math.min(start + partSize, file.size))
}

// Runs `work` over every item, never more than `limit` at the same time.
//
// Each worker takes the next item the moment it is free, so one slow part never
// holds up the others. This is a queue with a few hands, not a set of batches.
async function inParallel<T>(items: T[], limit: number, work: (item: T) => Promise<void>): Promise<void> {
    const queue = [...items]

    const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
        for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
            await work(item)
        }
    })

    await Promise.all(workers)
}

function countUp(total: number): number[] {
    return Array.from({ length: total }, (_, index) => index + 1)
}

function sum(numbers: number[]): number {
    return numbers.reduce((total, value) => total + value, 0)
}
