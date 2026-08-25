import { Router } from 'express'
import { fileRoutes } from './files'
import { uploadRoutes } from './uploads'

export const routes = Router()

routes.use('/api/uploads', uploadRoutes)
routes.use('/api/files', fileRoutes)
