// Every call the browser makes to our own server, in one place, with types.
//
// baseline's `http` returns the status instead of throwing on a failure, so
// unwrap() below turns a failed response into an Error carrying the message the
// server wrote. That way the pages can just try/catch.

import { http } from '@codesuma/baseline'

// The browser and server share the same accepted link-lifetime values.
export type LinkExpiry = '1h' | '1d' | '1w'

export interface StartedUpload {
    token: string
    partSize: number
    totalParts: number
}

export interface UploadedPart {
    partNumber: number
    etag: string
    size: number
}

// The browser API now reports whether a file is protected and can pass an
// optional password through the upload flow without changing the rest of the app.
export interface FileInfo {
    id: string
    fileName: string
    contentType: string
    size: number
    protected: boolean
}

export async function startUpload(file: File, password?: string): Promise<StartedUpload> {
    return unwrap<StartedUpload>(await http.post('/api/uploads', {
        fileName: file.name,
        // An unknown type is normal for files with no extension.
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        password
    }))
}

export async function uploadedParts(token: string): Promise<UploadedPart[]> {
    const body = unwrap<{ parts: UploadedPart[] }>(await http.get(`/api/uploads/${token}/parts`))
    return body.parts
}

export async function partUrl(token: string, partNumber: number): Promise<string> {
    const body = unwrap<{ url: string }>(await http.get(`/api/uploads/${token}/parts/${partNumber}/url`))
    return body.url
}

export async function finishUpload(token: string, expiresIn: LinkExpiry): Promise<{ id: string; url: string }> {
    return unwrap(await http.post(`/api/uploads/${token}/complete`, { expiresIn }))
}

export async function cancelUpload(token: string): Promise<void> {
    unwrap(await http.delete(`/api/uploads/${token}`))
}

export async function fileInfo(id: string, password?: string): Promise<FileInfo> {
    const query = new URLSearchParams(window.location.search)
    if (password) query.set('password', password)
    else query.delete('password')
    return unwrap<FileInfo>(await http.get(`/api/files/${id}?${query.toString()}`))
}

function unwrap<T>(response: { status: number; data: any }): T {
    if (response.status >= 200 && response.status < 300) return response.data as T
    throw new Error(response.data?.error || `The server answered ${response.status}`)
}
