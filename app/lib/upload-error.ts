// The browser upload can fail for two different reasons: a brief network drop or
// Cloudflare R2 rejecting the direct PUT because the site origin is missing from
// the bucket CORS rule. This helper keeps the user-facing error actionable.
export function describeUploadFailure(reason: string): string {
    const origin = typeof window === 'undefined' ? 'http://localhost:41000' : window.location.origin
    const base = `The browser could not upload directly to Cloudflare R2. Add ${origin} to the bucket CORS AllowedOrigins, keep PUT enabled, and retry.`
    return `${base} Original error: ${reason}`
}
