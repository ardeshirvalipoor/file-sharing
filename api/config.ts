// Every setting the service needs, read once when the process starts.
//
// Keeping this in one file means no other file ever touches process.env, and a
// missing setting stops the server on boot instead of halfway through somebody's
// one gigabyte upload.

import 'dotenv/config'

function required(name: string): string {
    const value = process.env[name]
    if (!value) throw new Error(`Missing environment variable: ${name}`)
    return value
}

export const config = {
    port: Number(process.env.PORT ?? 3000),

    // Share links are built from this, so it must be the address people reach
    // the service on. On Fly.io that is https://your-app.fly.dev.
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000',

    // Supabase Postgres. See api/lib/db.ts.
    databaseUrl: required('DATABASE_URL'),

    // Cloudflare R2. See api/lib/storage.ts for why the S3 words show up here.
    r2: {
        accountId: required('R2_ACCOUNT_ID'),
        accessKeyId: required('R2_ACCESS_KEY_ID'),
        secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
        bucket: required('R2_BUCKET_NAME')
    },

    // Signs upload tokens. See api/lib/upload-token.ts.
    tokenSecret: required('UPLOAD_TOKEN_SECRET')
}

// One gigabyte, the largest file we accept.
export const MAX_FILE_SIZE = 1024 * 1024 * 1024

// The size of one part of a multipart upload.
//
// The storage rejects parts smaller than 5 MiB, except for the very last one.
// It also refuses more than 10000 parts. At 8 MiB a one gigabyte file becomes
// 128 parts, which is comfortably inside both limits and small enough that a
// failed part is cheap to send again.
export const PART_SIZE = 8 * 1024 * 1024

// Presigned URLs stop working after these many seconds. They are deliberately
// short: if one leaks, it is useless soon after.
export const UPLOAD_URL_TTL = 60 * 60
export const DOWNLOAD_URL_TTL = 5 * 60
