import { Router } from 'express'
import handlers from '../handlers'

export const fileRoutes = Router()

fileRoutes.get('/:id', handlers.files.info)
fileRoutes.get('/:id/download', handlers.files.download)
