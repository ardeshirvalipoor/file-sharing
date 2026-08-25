import type { Request, Response } from 'express'
import * as files from '../services/files'

// GET /api/files/:id
export async function info(req: Request<{ id: string }>, res: Response) {
    res.json(await files.info(req.params.id))
}

// GET /api/files/:id/download
export async function download(req: Request<{ id: string }>, res: Response) {
    // A redirect, not a proxy. The browser follows it to the bucket and pulls
    // the bytes from there, so this machine carries none of the traffic.
    res.redirect(302, await files.downloadUrl(req.params.id))
}
