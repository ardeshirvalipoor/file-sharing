// Builds the Express application: middleware, routes, and the fallbacks that
// catch everything else. Starting the server is server.ts's job, so this file
// stays easy to import from a test.

import express from 'express'
import path from 'node:path'
import { errorHandler, notFound } from './middlewares/errors'
import { routes } from './routes/index'

export const app = express()

// Fly.io terminates HTTPS in front of us, so Express needs to be told to
// believe the proxy headers about the original request.
app.enable('trust proxy')

// Request bodies here are small pieces of JSON. File bytes never reach us, so a
// tight limit is free protection.
app.use(express.json({ limit: '64kb' }))

app.use(routes)

// Any /api path we did not define. This sits above the catch-all below so a
// misspelled endpoint answers with JSON instead of a page of HTML.
app.use('/api', notFound)

// The built browser app: index.html, bundle.js, bundle.css.
const publicDir = path.join(process.cwd(), 'public')
app.use(express.static(publicDir, { index: false }))

app.get('/health', (_req, res) => { res.send('ok') })

// Every other address belongs to the app's own router, including share links
// like /f/AbCd1234EfGh5678. The server always answers with the same page and
// the browser decides what to show.
app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
})

app.use(errorHandler)
