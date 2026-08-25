// One way in to every service.
//
// Importing this instead of a single file means a call site reads
// services.uploads.start(...), which says both what is being done and which
// part of the app owns it. Adding a service means one line here.

import * as uploads from './uploads'
import * as files from './files'

export default {
    uploads,
    files
}
