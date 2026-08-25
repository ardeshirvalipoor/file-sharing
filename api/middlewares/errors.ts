import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../lib/http-error'

// Answers any /api path we did not define. It sits above the catch-all route so
// that a misspelled endpoint replies with JSON instead of a page of HTML.
export function notFound(_req: Request, res: Response) {
    res.status(404).json({ error: 'No such endpoint' })
}

// Express 5 catches rejected promises from async handlers and sends them here,
// which is why no handler in this project needs a try/catch block.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message })
        return
    }

    // Anything else is our own bug. Log the real cause, tell the browser nothing.
    console.error(error)
    res.status(500).json({ error: 'Something went wrong on our side' })
}
