// The only file in the project that talks to the object store.
//
// We store files in Cloudflare R2. R2 speaks the S3 protocol, which is why the
// client library is called @aws-sdk/client-s3 even though no Amazon service is
// involved anywhere. S3 is the protocol; AWS is just the company that invented
// it. Backblaze B2 and Fly's Tigris speak the same protocol, so moving to either
// one means changing the endpoint below and nothing else.
//
// The rest of the app calls the plain functions at the bottom and never sees an
// S3 command object.

import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    ListPartsCommand,
    PutObjectCommand,
    S3Client,
    UploadPartCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { DOWNLOAD_URL_TTL, UPLOAD_URL_TTL, config } from '../config'
import { isFileId, objectKey } from './file-id'
import { MAX_LINK_LIFETIME_SECONDS } from './share-link'


const client = new S3Client({
    // R2 has no regions, but the S3 protocol insists on the field.
    region: 'auto',
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey
    },

    // Recent versions of the library add a checksum header to every upload. That
    // header becomes part of the signature, and the browser uploading through a
    // presigned URL does not know to send it, so the storage rejects the part.
    // Asking for checksums only when the protocol requires them keeps presigned
    // uploads working.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
})

// Limit the full legacy-file scan to once per day instead of every cleanup tick.
let legacyFileScanAt = 0

export interface StoredPart {
    partNumber: number
    etag: string
    size: number
}



export interface RetainedFileRecord {
    id: string
    fileName: string
    contentType: string
    size: number
    passwordProtected: boolean
    expiresAt: number
    recordedAt: number
}

// Protected uploads keep only a password hash in the object metadata. That lets
// the server validate a password later without saving the plain secret anywhere.
export async function createMultipartUpload(key: string, fileName: string, contentType: string): Promise<string> {
    const metadata: Record<string, string> = { filename: encodeURIComponent(fileName) }

    const created = await client.send(new CreateMultipartUploadCommand({
        Bucket: config.r2.bucket,
        Key: key,
        ContentType: contentType,
        // Metadata values must be plain ASCII, and file names often are not.
        Metadata: metadata
    }))

    if (!created.UploadId) throw new Error('Storage did not return an upload id')
    return created.UploadId
}

// A URL that lets the holder upload exactly one part of exactly this upload,
// and only for the next hour. The browser sends the bytes straight to R2 with
// it, so the file never passes through our machine.
export function presignPartUrl(key: string, uploadId: string, partNumber: number): Promise<string> {
    const command = new UploadPartCommand({
        Bucket: config.r2.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber
    })

    return getSignedUrl(client, command, { expiresIn: UPLOAD_URL_TTL })
}

// Which parts of this upload the storage already holds. This is the answer that
// makes resuming possible, and it is authoritative in a way the browser's own
// notes never are.
export async function listParts(key: string, uploadId: string): Promise<StoredPart[]> {
    const listed = await client.send(new ListPartsCommand({
        Bucket: config.r2.bucket,
        Key: key,
        UploadId: uploadId
    }))

    // One response holds up to 1000 parts and our largest upload has 128, so
    // there is never a second page to fetch.
    return (listed.Parts ?? []).map(part => ({
        partNumber: part.PartNumber ?? 0,
        etag: part.ETag ?? '',
        size: part.Size ?? 0
    }))
}

// Glues the parts together into one object. After this the file is real and the
// share link works.
export async function completeMultipartUpload(key: string, uploadId: string, parts: StoredPart[]): Promise<void> {
    await client.send(new CompleteMultipartUploadCommand({
        Bucket: config.r2.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            // The storage insists on ascending part numbers.
            Parts: [...parts]
                .sort((a, b) => a.partNumber - b.partNumber)
                .map(part => ({ PartNumber: part.partNumber, ETag: part.etag }))
        }
    }))
}

// Keep file details in a durable record separate from the expiring payload.
async function saveFileRecord(record: RetainedFileRecord): Promise<void> {
    await client.send(new PutObjectCommand({
        Bucket: config.r2.bucket,
        Key: `records/${record.id}.json`,
        Body: JSON.stringify(record),
        ContentType: 'application/json'
    }))
}

// Save the persistent metadata record and an ordered marker for the cleanup worker.
export async function scheduleFileDeletion(record: RetainedFileRecord): Promise<void> {
    await saveFileRecord(record)
    await client.send(new PutObjectCommand({
        Bucket: config.r2.bucket,
        Key: expirationMarkerKey(record.id, record.expiresAt),
        Body: new Uint8Array()
    }))
}

// Delete expired files in timestamp order; future markers stop the scan early.
export async function deleteExpiredFiles(now = Math.floor(Date.now() / 1000)): Promise<number> {
    let deletedFiles = 0

    while (true) {
        const listed = await client.send(new ListObjectsV2Command({
            Bucket: config.r2.bucket,
            Prefix: 'expirations/',
            MaxKeys: 1000
        }))
        const markers = listed.Contents ?? []
        if (markers.length === 0) return deletedFiles + await deleteLegacyExpiredFiles(now)

        let deletedMarkers = 0
        for (const marker of markers) {
            const key = marker.Key
            if (!key) continue

            const parsed = parseExpirationMarker(key)
            if (!parsed) {
                await client.send(new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: key }))
                deletedMarkers++
                continue
            }
            if (parsed.expiresAt > now) return deletedFiles + await deleteLegacyExpiredFiles(now)

            await client.send(new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: objectKey(parsed.id) }))
            await client.send(new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: key }))
            deletedFiles++
            deletedMarkers++
        }

        if (deletedMarkers === 0 || (!listed.IsTruncated && deletedMarkers < markers.length)) {
            return deletedFiles + await deleteLegacyExpiredFiles(now)
        }
    }
}

// Throws away an unfinished upload and the parts it collected. Without this the
// parts sit in the bucket costing money forever.
export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await client.send(new AbortMultipartUploadCommand({
        Bucket: config.r2.bucket,
        Key: key,
        UploadId: uploadId
    }))
}


// A URL that downloads this one file for the next few minutes. The bucket itself
// stays private, so this is the only way in.
export function presignDownloadUrl(key: string, fileName: string, expiresIn = DOWNLOAD_URL_TTL): Promise<string> {
    return presignFileUrl(key, fileName, 'attachment', expiresIn)
}

// Preview URLs request inline display and are kept separate from the counted
// download flow so opening a share page does not increment download totals.
export function presignPreviewUrl(key: string, fileName: string, contentType: string, expiresIn = DOWNLOAD_URL_TTL): Promise<string> {
    return presignFileUrl(key, fileName, 'inline', expiresIn, contentType)
}

// Sign the same object request with the requested browser disposition.
function presignFileUrl(key: string, fileName: string, disposition: 'attachment' | 'inline', expiresIn: number, contentType?: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: config.r2.bucket,
        Key: key,
        // Use the uploader's filename while selecting download or inline display.
        ResponseContentDisposition: contentDisposition(fileName, disposition),
        ...(contentType ? { ResponseContentType: contentType } : {})
    })

    return getSignedUrl(client, command, { expiresIn })
}

// This reads the object metadata the browser never sees, including an optional
// legacy password hash for files created before hashes moved to the database.
export async function headFile(key: string): Promise<{ fileName: string; contentType: string; size: number; passwordHash?: string } | null> {
    try {
        const head = await client.send(new HeadObjectCommand({
            Bucket: config.r2.bucket,
            Key: key
        }))

        const metadata = head.Metadata ?? {}
        const fileName = metadata.filename ? decodeURIComponent(metadata.filename) : ''

        return {
            fileName: fileName || key.replace(/^files\//, ''),
            contentType: head.ContentType ?? 'application/octet-stream',
            size: head.ContentLength ?? 0,
            passwordHash: metadata.passwordHash
        }
    } catch (error: unknown) {
        const status = typeof error === 'object' && error && 'name' in error ? (error as { name?: string; $metadata?: { httpStatusCode?: number } }).name : undefined
        const httpStatus = typeof error === 'object' && error && '$metadata' in error ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode : undefined

        if (status === 'NotFound' || httpStatus === 404) return null
        throw error
    }
}

// Order markers by expiration so the sweeper can stop at the first future deadline.
function expirationMarkerKey(id: string, expiresAt: number): string {
    return `expirations/${String(expiresAt).padStart(12, '0')}/${id}`
}

// Parse only marker keys with a valid expiry timestamp and file id.
function parseExpirationMarker(key: string): { expiresAt: number; id: string } | null {
    const match = /^expirations\/(\d{12})\/([A-Za-z0-9_-]{16})$/.exec(key)
    if (!match) return null
    return { expiresAt: Number(match[1]), id: match[2] }
}

// Accept only file keys whose suffix is a valid share id before recording metadata.
function fileIdFromKey(key: string): string | null {
    const id = key.slice('files/'.length)
    return key.startsWith('files/') && isFileId(id) ? id : null
}

// Older files have no marker, so remove them only after every supported link must have expired.
async function deleteLegacyExpiredFiles(now: number): Promise<number> {
    const oneDaySeconds = 24 * 60 * 60
    if (now - legacyFileScanAt < oneDaySeconds) return 0

    const cutoff = now - MAX_LINK_LIFETIME_SECONDS
    let continuationToken: string | undefined
    let deletedFiles = 0

    do {
        const listed = await client.send(new ListObjectsV2Command({
            Bucket: config.r2.bucket,
            Prefix: 'files/',
            MaxKeys: 1000,
            ContinuationToken: continuationToken
        }))
        const expired = (listed.Contents ?? []).filter(file =>
            file.Key && file.LastModified && Math.floor(file.LastModified.getTime() / 1000) <= cutoff
        )

        for (const file of expired) {
            if (!file.Key || !file.LastModified) continue
            const id = fileIdFromKey(file.Key)
            if (!id) continue

            const stored = await headFile(file.Key)
            if (stored) {
                const uploadedAt = Math.floor(file.LastModified.getTime() / 1000)
                await saveFileRecord({
                    id,
                    fileName: stored.fileName,
                    contentType: stored.contentType,
                    size: stored.size,
                    passwordProtected: Boolean(stored.passwordHash),
                    expiresAt: uploadedAt + MAX_LINK_LIFETIME_SECONDS,
                    recordedAt: now
                })
            }
            await client.send(new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: file.Key }))
        }

        deletedFiles += expired.length
        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
    } while (continuationToken)

    legacyFileScanAt = now
    return deletedFiles
}

// Two spellings of the same name, as the header standard asks for. Old browsers
// read the quoted one, everything current reads the UTF-8 one.
function contentDisposition(fileName: string, disposition: 'attachment' | 'inline'): string {
    // Anything outside plain printable ASCII, plus the two characters that
    // would break out of the quotes, becomes an underscore.
    const ascii = fileName.replace(/[^\x20-\x7e]|["\\]/g, '_')
    return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}
