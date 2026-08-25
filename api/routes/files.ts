import { Router } from 'express'
import * as handlers from '../handlers/files'

export const fileRoutes = Router()

fileRoutes.get('/:id', handlers.info)
fileRoutes.get('/:id/download', handlers.download)
