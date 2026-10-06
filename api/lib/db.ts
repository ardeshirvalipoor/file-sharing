// The only file in the project that talks to Postgres.
//
// The database is hosted by Supabase, which is ordinary Postgres with a REST API
// and an accounts system built around it. We use none of that from here. This is
// a plain connection and hand-written SQL, in the same spirit as
// api/lib/storage.ts: the rest of the app calls the functions at the bottom and
// never sees a query.
//
// The database holds no file bytes and no upload state. R2 still holds the
// bytes, and the signed upload token still carries an upload in progress. These
// tables are the index: which files exist, and who has downloaded them.

import postgres from 'postgres'
import { config } from '../config'

const sql = postgres(config.databaseUrl, {
    // Supabase's pooler gives each query whichever connection is free, so a
    // statement prepared on one connection is not there on the next one. Turning
    // prepared statements off is what the pooler asks of every client.
    prepare: false,

    // Our machine handles small messages and nothing else, so a handful of
    // connections is plenty, and letting them go quickly suits a Fly machine
    // that stops when nobody is using it.
    max: 5,
    idle_timeout: 30
})

export interface NewFile {
    fileName: string
    contentType: string
    size: number
}

// Written the moment an upload starts, before anything exists in R2. The row
// says somebody intends to put a file at this id. It stays in status
// 'uploading' until every part has arrived.
export async function insertFile(id: string, file: NewFile): Promise<void> {
    await sql`
        insert into files (id, file_name, content_type, size)
        values (${id}, ${file.fileName}, ${file.contentType}, ${file.size})
    `
}

// The parts are glued together and the object is whole. Only now is there a real
// file at this id.
// Completion saves the final optional password hash and the link's expiry
// alongside the ready status.
export async function markFileReady(id: string, passwordHash: string | null, expiresAt: Date): Promise<void> {
    await sql`
        update files
        set status = 'ready', completed_at = now(), password_hash = ${passwordHash}, expires_at = ${expiresAt}
        where id = ${id}
    `
}

// The person gave up on the upload, or its link ran out and the bytes were
// deleted. We keep the row rather than removing it, so a link that once worked
// can later be told apart from one that never did.
export async function markFileDeleted(id: string): Promise<void> {
    await sql`
        update files
        set deleted_at = now()
        where id = ${id}
    `
}

// Files whose link has run out but whose bytes have not been deleted yet.
export async function expiredFileIds(): Promise<string[]> {
    const rows = await sql`
        select id from files
        where expires_at <= now() and deleted_at is null
    `
    return rows.map(row => row.id)
}

export interface FileRow {
    id: string
    fileName: string
    contentType: string
    size: number
    // Password verification uses this hash without reading it from object storage.
    passwordHash: string | null
}

// The one question a share link asks: is there a file at this id that somebody
// is allowed to have? A row that is still uploading, and a row that was
// cancelled, both answer no, the same as an id that was never used.
export async function findFile(id: string): Promise<FileRow | null> {
    const [row] = await sql`
        select id, file_name, content_type, size, password_hash
        from files
        where id = ${id} and status = 'ready' and deleted_at is null
    `
    if (!row) return null

    // Postgres hands a bigint over as a string, because the largest one does not
    // fit in a JavaScript number. Ours is a gigabyte at most, so it fits easily.
    return {
        id: row.id,
        fileName: row.file_name,
        contentType: row.content_type,
        size: Number(row.size),
        passwordHash: row.password_hash
    }
}

// One row per download, and a running total kept on the file itself.
//
// The two statements are not wrapped in a transaction. If the second one fails
// the total sits one behind, which nobody will notice, and the downloads table
// still holds the truth the total can be rebuilt from.
export async function recordDownload(id: string, ipHash: string, userAgent: string | null): Promise<void> {
    await sql`
        insert into downloads (file_id, ip_hash, user_agent)
        values (${id}, ${ipHash}, ${userAgent})
    `
    await sql`
        update files
        set download_count = download_count + 1
        where id = ${id}
    `
}
