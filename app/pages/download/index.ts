// What someone sees when they open a share link.
//
// The page shows what the file is before anyone commits to downloading a
// gigabyte, then sends them to the server, which redirects the browser to the
// storage. The bytes never come through our machine.

import { Base, Button, Div, H1, Input, P, Page, IRouteEvent } from '@codesuma/baseline'
import { fileInfo } from '../../lib/api'
import { fileSize } from '../../lib/format'
import { createPreferencesBar, languageLocale, t } from '../../lib/preferences'
import { show } from '../../lib/show'

export const DownloadPage = () => {
    const page = Page()
    page.addClass('screen')
    const preferencesBar = createPreferencesBar()

    const card = Div()
    card.addClass('card')

    const heading = H1(t('loading'))
    heading.addClass('heading')

    const meta = P('')
    meta.addClass('intro')

    // Supported preview types are displayed here before the browser decides to
    // download the file. This keeps the share page useful without forcing a full
    // file transfer before the user confirms the link.
    const previewWrap = Div()
    previewWrap.el.style.display = 'none'
    previewWrap.el.style.margin = '12px 0'
    previewWrap.el.style.maxWidth = '100%'
    previewWrap.el.style.textAlign = 'center'

    const previewMedia = Div()
    previewMedia.el.style.display = 'flex'
    previewMedia.el.style.alignItems = 'center'
    previewMedia.el.style.justifyContent = 'center'
    previewMedia.el.style.minHeight = '180px'
    previewMedia.el.style.borderRadius = '10px'
    previewMedia.addClass('download-preview-media')
    previewWrap.append(previewMedia)

    const passwordWrap = Div()
    passwordWrap.el.style.display = 'none'
    passwordWrap.el.style.margin = '12px 0'
    passwordWrap.el.style.display = 'flex'
    passwordWrap.el.style.gap = '8px'
    passwordWrap.el.style.flexWrap = 'wrap'
    show(passwordWrap, false)

    const passwordInput = Input('', 'password')
    passwordInput.el.setAttribute('placeholder', t('enterPassword'))
    passwordInput.el.setAttribute('aria-label', t('enterPassword'))
    passwordInput.el.style.flex = '1'
    passwordInput.el.style.minWidth = '180px'
    const unlockButton = Button(t('unlock'))
    unlockButton.addClass('button', 'secondary')
    passwordWrap.append(passwordInput, unlockButton)
    // Keep incorrect-password feedback in the visible password section for retry.
    const passwordError = P('')
    passwordError.addClass('error')
    // Give password failures a full row beneath the input and unlock control.
    passwordError.el.style.flexBasis = '100%'
    passwordWrap.append(passwordError)

    const downloadButton = Button(t('download'))
    downloadButton.addClass('button', 'primary')

    const actions = Div()
    actions.addClass('actions')
    actions.append(downloadButton)

    const error = P('')
    error.addClass('error')

    card.append(heading, meta, previewWrap, passwordWrap, actions, error)
    page.append(preferencesBar, card)

    let downloadPath = ''
    let currentId = ''
    let previewUrl: string | null = null

    function resetPreview() {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            previewUrl = null
        }
        previewMedia.el.innerHTML = ''
    }

    function renderPreview(file: { contentType: string; fileName: string; size: number; protected: boolean }, previewSource: string) {
        resetPreview()
        const type = file.contentType || ''

        if (type.startsWith('image/')) {
            const image = Base('img')
            image.el.src = previewSource
            image.el.alt = file.fileName
            image.el.style.maxWidth = '100%'
            image.el.style.maxHeight = '280px'
            previewMedia.append(image)
            previewWrap.el.style.display = 'block'
            return
        }

        if (type.startsWith('video/')) {
            const video = Base('video')
            video.el.src = previewSource
            video.el.controls = true
            video.el.muted = true
            video.el.style.maxWidth = '100%'
            video.el.style.maxHeight = '280px'
            previewMedia.append(video)
            previewWrap.el.style.display = 'block'
            return
        }

        if (type === 'application/pdf') {
            const frame = Base('iframe')
            frame.el.src = previewSource
            frame.el.title = file.fileName
            frame.el.style.width = '100%'
            frame.el.style.height = '300px'
            frame.el.style.border = '0'
            previewMedia.append(frame)
            previewWrap.el.style.display = 'block'
        }
    }

    async function loadFile(id: string, password?: string) {
        show(actions, false)
        show(error, false)
        show(passwordWrap, false)
        show(passwordError, false)
        heading.text(t('loading'))
        meta.text('')
        resetPreview()

        try {
            const file = await fileInfo(id, password)
            currentId = file.id
            if (file.protected && !password) {
                heading.text(t('protectedTitle'))
                meta.text(t('protectedPrompt'))
                show(passwordWrap, true)
                return
            }

            // Hide password controls after the supplied password has been accepted.
            show(passwordWrap, false)
            heading.text(file.fileName)
            const expiresAt = Number(new URLSearchParams(window.location.search).get('expires'))
            const expiryDate = new Date(expiresAt * 1000).toLocaleString(languageLocale())
            meta.text(`${fileSize(file.size)} · ${t('linkExpiresAt', { date: expiryDate })}`)

            const query = new URLSearchParams(window.location.search)
            if (password) query.set('password', password)
            else query.delete('password')
            downloadPath = `/api/files/${file.id}/download?${query.toString()}`
            // Preview requests get inline disposition and do not enter download logs.
            const previewPath = `/api/files/${file.id}/preview?${query.toString()}`
            renderPreview(file, previewPath)
            show(actions, true)
        } catch (problem) {
            if (problem instanceof Error && problem.message.toLowerCase().includes('password')) {
                heading.text(t('protectedTitle'))
                meta.text(t('protectedPrompt'))
                show(passwordWrap, true)
                if (password) {
                    passwordError.text(problem.message)
                    show(passwordError, true)
                }
                return
            }

            heading.text(t('nothingHere'))
            error.text(problem instanceof Error ? problem.message : t('linkDidNotWork'))
            show(error, true)
        }
    }

    // The router hands the page a fresh `enter` event every time someone
    // navigates here, with the :id from the address bar in params.
    page.on('enter', async ({ params }: IRouteEvent) => {
        // Every viewer, including the uploader's own Open action, must unlock protected files.
        await loadFile(params.id)
    })

    unlockButton.on('click', async () => {
        const password = passwordInput.value().trim()
        if (!password) {
            passwordError.text(t('pleaseEnterPassword'))
            show(passwordError, true)
            return
        }
        show(passwordError, false)
        await loadFile(currentId || (new URL(location.href).pathname.split('/').pop() ?? ''), password)
    })

    downloadButton.on('click', () => {
        // A normal navigation, not fetch(). The server answers with a redirect,
        // the browser follows it to the storage, and the download bar appears
        // like it would for any other link.
        window.location.href = downloadPath
    })

    return page
}
