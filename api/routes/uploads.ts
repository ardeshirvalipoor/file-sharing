import { Router } from 'express'
import handlers from '../handlers'

export const uploadRoutes = Router()

// The four steps of an upload, in the order the browser walks through them.
uploadRoutes.post('/', handlers.uploads.start)
uploadRoutes.get('/:token/parts', handlers.uploads.uploadedParts)
uploadRoutes.get('/:token/parts/:partNumber/url', handlers.uploads.partUrl)
uploadRoutes.post('/:token/complete', handlers.uploads.finish)

// And the way out if the person changes their mind.
uploadRoutes.delete('/:token', handlers.uploads.cancel)
