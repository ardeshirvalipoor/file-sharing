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
    GetObjectCommand,
    HeadObjectCommand,
    ListPartsCommand,
    S3Client,
    UploadPartCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { DOWNLOAD_URL_TTL, UPLOAD_URL_TTL, config } from '../config'

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

export interface StoredPart {
    partNumber: number
    etag: string
    size: number
}

export interface StoredFile {
    fileName: string
    contentType: string
    size: number
}

// Opens a multipart upload and returns the id that ties all its parts together.
// Nothing is stored yet; this only reserves the name.
export async function createMultipartUpload(key: string, fileName: string, contentType: string): Promise<string> {
    const created = await client.send(new CreateMultipartUploadCommand({
        Bucket: config.r2.bucket,
        Key: key,
        ContentType: contentType,
        // Metadata values must be plain ASCII, and file names often are not.
        Metadata: { filename: encodeURIComponent(fileName) }
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

// Throws away an unfinished upload and the parts it collected. Without this the
// parts sit in the bucket costing money forever.
export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await client.send(new AbortMultipartUploadCommand({
        Bucket: config.r2.bucket,
        Key: key,
        UploadId: uploadId
    }))
}

// The file's name, type and size, without fetching a single byte of it.
// Returns null when there is no such file, because a dead share link is an
// ordinary thing to happen and not an error.
export async function headFile(key: string): Promise<StoredFile | null> {
    try {
        const head = await client.send(new HeadObjectCommand({ Bucket: config.r2.bucket, Key: key }))
        return {
            fileName: decodeURIComponent(head.Metadata?.filename ?? 'download'),
            contentType: head.ContentType ?? 'application/octet-stream',
            size: head.ContentLength ?? 0
        }
    } catch (error) {
        if (isMissing(error)) return null
        throw error
    }
}

// A URL that downloads this one file for the next few minutes. The bucket itself
// stays private, so this is the only way in.
export function presignDownloadUrl(key: string, fileName: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: config.r2.bucket,
        Key: key,
        // Without this the browser would save the file under its random storage
        // key. This asks it to use the name the uploader chose.
        ResponseContentDisposition: contentDisposition(fileName)
    })

    return getSignedUrl(client, command, { expiresIn: DOWNLOAD_URL_TTL })
}

function isMissing(error: unknown): boolean {
    const name = (error as { name?: string }).name
    return name === 'NotFound' || name === 'NoSuchKey'
}

// Two spellings of the same name, as the header standard asks for. Old browsers
// read the quoted one, everything current reads the UTF-8 one.
function contentDisposition(fileName: string): string {
    // Anything outside plain printable ASCII, plus the two characters that
    // would break out of the quotes, becomes an underscore.
    const ascii = fileName.replace(/[^\x20-\x7e]|["\\]/g, '_')
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}
