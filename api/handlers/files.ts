import type { Request, Response } from 'express'
import services from '../services'

// GET /api/files/:id
export async function info(req: Request<{ id: string }>, res: Response) {
    res.json(await services.files.info(req.params.id))
}

// GET /api/files/:id/download
export async function download(req: Request<{ id: string }>, res: Response) {
    // app.ts tells Express to trust the proxy in front of us, so req.ip is the
    // address the person is really coming from and not Fly's own.
    const visitor = { address: req.ip ?? '', userAgent: req.get('user-agent') ?? null }

    // A redirect, not a proxy. The browser follows it to the bucket and pulls
    // the bytes from there, so this machine carries none of the traffic.
    res.redirect(302, await services.files.downloadUrl(req.params.id, visitor))
}
