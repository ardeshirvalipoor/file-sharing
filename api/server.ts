import { app } from './app'
import { config } from './config'
import services from './services'

// Delete expired files once a minute while the machine is awake. An expired link
// already stops working on its own, so this only frees the space.
const CLEANUP_INTERVAL_MS = 60 * 1000
// Prevent overlapping runs if one cleanup takes longer than a minute.
let cleanupRunning = false

async function cleanupExpiredFiles(): Promise<void> {
    if (cleanupRunning) return
    cleanupRunning = true
    try {
        const deleted = await services.files.deleteExpired()
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
