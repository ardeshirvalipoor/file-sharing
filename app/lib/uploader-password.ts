// Keep the uploader's password scoped to the current tab instead of placing it in a share URL.
const storageKey = (fileId: string) => `linkify-uploader-password:${fileId}`

// Save or clear the uploader-only password before navigating in this tab.
export function storeUploaderPassword(fileId: string, password: string): void {
    if (password) sessionStorage.setItem(storageKey(fileId), password)
    else sessionStorage.removeItem(storageKey(fileId))
}

// Consume the uploader-only password once so copied public links cannot inherit it.
export function consumeUploaderPassword(fileId: string): string | undefined {
    const key = storageKey(fileId)
    const password = sessionStorage.getItem(key)
    sessionStorage.removeItem(key)
    return password ?? undefined
}
