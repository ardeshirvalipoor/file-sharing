// What someone sees when they open a share link.
//
// The page shows what the file is before anyone commits to downloading a
// gigabyte, then sends them to the server, which redirects the browser to the
// storage. The bytes never come through our machine.

import { Button, Div, H1, P, Page, IRouteEvent } from '@codesuma/baseline'
import { fileInfo } from '../../lib/api'
import { fileSize } from '../../lib/format'
import { show } from '../../lib/show'

export const DownloadPage = () => {
    const page = Page()
    page.addClass('screen')

    const card = Div()
    card.addClass('card')

    const heading = H1('Loading')
    heading.addClass('heading')

    const meta = P('')
    meta.addClass('intro')

    const downloadButton = Button('Download')
    downloadButton.addClass('button', 'primary')

    const actions = Div()
    actions.addClass('actions')
    actions.append(downloadButton)

    const error = P('')
    error.addClass('error')

    card.append(heading, meta, actions, error)
    page.append(card)

    let downloadPath = ''

    // The router hands the page a fresh `enter` event every time someone
    // navigates here, with the :id from the address bar in params.
    page.on('enter', async ({ params }: IRouteEvent) => {
        show(actions, false)
        show(error, false)
        heading.text('Loading')
        meta.text('')

        try {
            const file = await fileInfo(params.id)

            heading.text(file.fileName)
            meta.text(`${fileSize(file.size)} · anyone with this link can download it`)
            downloadPath = `/api/files/${file.id}/download`

            show(actions, true)
        } catch (problem) {
            heading.text('Nothing here')
            error.text(problem instanceof Error ? problem.message : 'This link did not work')
            show(error, true)
        }
    })

    downloadButton.on('click', () => {
        // A normal navigation, not fetch(). The server answers with a redirect,
        // the browser follows it to the storage, and the download bar appears
        // like it would for any other link.
        window.location.href = downloadPath
    })

    return page
}
