import { Router } from 'express'
import handlers from '../handlers'

export const fileRoutes = Router()

fileRoutes.get('/:id', handlers.files.info)
// Keep inline previews separate from downloads so page visits are not counted.
fileRoutes.get('/:id/preview', handlers.files.preview)
fileRoutes.get('/:id/download', handlers.files.download)
