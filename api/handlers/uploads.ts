// Handlers are the thin layer between HTTP and the services. They read the
// request, check it, call one service function, and choose a status code.
// No upload logic lives here.
//
// The type argument on Request names the parts of the address this handler
// expects, which is both a type check and a note to the next reader.

import type { Request, Response } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/http-error'
import type { LinkExpiry } from '../lib/share-link'
import services from '../services'

const startSchema = z.object({
    fileName: z.string().min(1).max(255),
    contentType: z.string().min(1).max(255),
    size: z.number().int().positive(),
    password: z.string().trim().min(6).max(128).optional()
})

// A completed upload gets exactly one of the lifetimes offered in the UI.
const finishSchema = z.object({ expiresIn: z.enum(['1h', '1d', '1w']) })

// POST /api/uploads
export async function start(req: Request, res: Response) {
    const file = parse(startSchema, req.body)
    res.status(201).json(await services.uploads.start(file))
}

// GET /api/uploads/:token/parts
export async function uploadedParts(req: Request<{ token: string }>, res: Response) {
    res.json({ parts: await services.uploads.uploadedParts(req.params.token) })
}

// GET /api/uploads/:token/parts/:partNumber/url
export async function partUrl(req: Request<{ token: string; partNumber: string }>, res: Response) {
    const url = await services.uploads.partUrl(req.params.token, Number(req.params.partNumber))
    res.json({ url })
}

// POST /api/uploads/:token/complete
export async function finish(req: Request<{ token: string }>, res: Response) {
    const { expiresIn } = parse<{ expiresIn: LinkExpiry }>(finishSchema, req.body)
    res.json(await services.uploads.finish(req.params.token, expiresIn))
}

// DELETE /api/uploads/:token
export async function cancel(req: Request<{ token: string }>, res: Response) {
    await services.uploads.cancel(req.params.token)
    res.status(204).end()
}

// Runs a schema and turns a failure into a 400 the browser can show to a person.
function parse<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body)
    if (result.success) return result.data

    const problems = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
    throw new HttpError(400, problems.join(', '))
}
