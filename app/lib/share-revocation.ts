const tokenKey = (fileId: string) => `linkify-revocation-token:${fileId}`

export function storeRevocationToken(fileId: string, token: string): boolean {
    try {
        localStorage.setItem(tokenKey(fileId), token)
        return true
    } catch {
        return false
    }
}

export function getRevocationToken(fileId: string): string | undefined {
    return localStorage.getItem(tokenKey(fileId)) ?? undefined
}

