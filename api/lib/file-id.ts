import { randomBytes } from 'node:crypto'

// The share id is the only secret protecting a file. Twelve random bytes give
// 16 URL-safe characters and about 10^28 possibilities, so guessing one is not
// a realistic attack.
export function newFileId(): string {
    return randomBytes(12).toString('base64url')
}

const FILE_ID = /^[A-Za-z0-9_-]{16}$/

// Anything arriving from a URL is untrusted. Checking the shape here means we
// never build a storage key out of whatever somebody typed into the address bar.
export function isFileId(value: string): boolean {
    return FILE_ID.test(value)
}

// The bucket never learns the original file name. The object is stored under the
// share id and the name travels beside it as metadata, so a leaked bucket
// listing gives away nothing.
export function objectKey(id: string): string {
    return `files/${id}`
}
