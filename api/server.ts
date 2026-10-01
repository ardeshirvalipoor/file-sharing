import { app } from './app'
import { config } from './config'
import { deleteExpiredFiles } from './lib/storage'

// Keep expired R2 objects short-lived even when the site receives no requests.
const CLEANUP_INTERVAL_MS = 60 * 1000
// Prevent overlapping bucket scans if one cleanup run takes longer than a minute.
let cleanupRunning = false

async function cleanupExpiredFiles(): Promise<void> {
    if (cleanupRunning) return
    cleanupRunning = true
    try {
        const deleted = await deleteExpiredFiles()
        if (deleted > 0) console.log(`Deleted ${deleted} expired file(s) from R2`)
    } catch (error) {
        console.error('Expired-file cleanup failed:', error)
    } finally {
        cleanupRunning = false
    }
}

app.listen(config.port, () => {
    console.log(`File sharing running on http://localhost:${config.port}`)
    void cleanupExpiredFiles()
    setInterval(() => void cleanupExpiredFiles(), CLEANUP_INTERVAL_MS)
})
