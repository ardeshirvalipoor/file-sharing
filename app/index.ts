// Where the browser app starts.
//
// Three jobs: make the container the router draws pages into, wait for the
// browser database to be ready, then hand over to the router.


import { Div, router } from '@codesuma/baseline'
import { ready } from './lib/upload-store'
import { initializePreferences } from './lib/preferences'
import { DownloadPage } from './pages/download'
import { MissingPage } from './pages/missing'
import { UploadPage } from './pages/upload'

// Imported last on purpose: CSS lands in the bundle in import order, and these
// rules need to come after the ones Baseline's own components bring with them.

import './global.css'

const view = Div()
document.body.appendChild(view.el)

// Restore the selected theme and text direction before rendering a route.
initializePreferences()

// The store has to exist before the upload page reads it, and creating one is
// asynchronous, so the routes wait.
ready().then(() => {
    router.routes({
        '/': UploadPage,
        '/f/:id': DownloadPage,
        '*': MissingPage
    }, view)
})
