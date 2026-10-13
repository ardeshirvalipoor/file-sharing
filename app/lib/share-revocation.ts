const tokenKey = (fileId: string) => `linkify-revocation-token:${fileId}`
const revokedKey = (fileId: string) => `linkify-revoked:${fileId}`

export function storeRevocationToken(fileId: string, token: string): boolean {
    try {
        localStorage.setItem(tokenKey(fileId), token)
        localStorage.removeItem(revokedKey(fileId))
        return true
    } catch {
        return false
    }
}

export function getRevocationToken(fileId: string): string | undefined {
    return localStorage.getItem(tokenKey(fileId)) ?? undefined
}

export function markShareRevoked(fileId: string): boolean {
    try {
        localStorage.removeItem(tokenKey(fileId))
        localStorage.setItem(revokedKey(fileId), 'true')
        return true
    } catch {
        return false
    }
}

export function isShareRevoked(fileId: string): boolean {
    return localStorage.getItem(revokedKey(fileId)) === 'true'
}
