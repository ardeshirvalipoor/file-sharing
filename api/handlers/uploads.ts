// Handlers are the thin layer between HTTP and the services. They read the
// request, check it, call one service function, and choose a status code.
// No upload logic lives here.
//
// The type argument on Request names the parts of the address this handler
// expects, which is both a type check and a note to the next reader.

import type { Request, Response } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/http-error'
import * as uploads from '../services/uploads'

const startSchema = z.object({
    fileName: z.string().min(1).max(255),
    contentType: z.string().min(1).max(255),
    size: z.number().int().positive()
})

// POST /api/uploads
export async function start(req: Request, res: Response) {
    const file = parse(startSchema, req.body)
    res.status(201).json(await uploads.start(file))
}

// GET /api/uploads/:token/parts
export async function uploadedParts(req: Request<{ token: string }>, res: Response) {
    res.json({ parts: await uploads.uploadedParts(req.params.token) })
}

// GET /api/uploads/:token/parts/:partNumber/url
export async function partUrl(req: Request<{ token: string; partNumber: string }>, res: Response) {
    const url = await uploads.partUrl(req.params.token, Number(req.params.partNumber))
    res.json({ url })
}

// POST /api/uploads/:token/complete
export async function finish(req: Request<{ token: string }>, res: Response) {
    res.json(await uploads.finish(req.params.token))
}

// DELETE /api/uploads/:token
export async function cancel(req: Request<{ token: string }>, res: Response) {
    await uploads.cancel(req.params.token)
    res.status(204).end()
}

// Runs a schema and turns a failure into a 400 the browser can show to a person.
function parse<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body)
    if (result.success) return result.data

    const problems = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
    throw new HttpError(400, problems.join(', '))
}
