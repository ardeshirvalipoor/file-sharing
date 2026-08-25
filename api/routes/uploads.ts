import { Router } from 'express'
import * as handlers from '../handlers/uploads'

export const uploadRoutes = Router()

// The four steps of an upload, in the order the browser walks through them.
uploadRoutes.post('/', handlers.start)
uploadRoutes.get('/:token/parts', handlers.uploadedParts)
uploadRoutes.get('/:token/parts/:partNumber/url', handlers.partUrl)
uploadRoutes.post('/:token/complete', handlers.finish)

// And the way out if the person changes their mind.
uploadRoutes.delete('/:token', handlers.cancel)
