// A dedicated file page with inline previews where browsers support them and a
// direct download option for every file type.

import { Base, Button, Div, H1, Input, P, Page, IRouteEvent } from '@codesuma/baseline'
import { fileInfo } from '../../lib/api'
import { fileSize } from '../../lib/format'
import { createPreferencesBar, languageLocale, t } from '../../lib/preferences'
import { show } from '../../lib/show'
import { storeUploaderPassword } from '../../lib/uploader-password'

export const PreviewPage = () => {
    const page = Page()
    page.addClass('screen')
    const preferencesBar = createPreferencesBar()

    const card = Div()
    card.addClass('card')

    const heading = H1(t('loading'))
    heading.addClass('heading')
    const meta = P('')
    meta.addClass('intro')

    // Keep rendered media within a dedicated, responsive viewer area.
    const mediaWrap = Div()
    mediaWrap.el.style.width = '100%'
    mediaWrap.el.style.minHeight = '240px'
    mediaWrap.el.style.overflow = 'hidden'
    const backButton = Button(t('backToShare'))
    backButton.addClass('button', 'secondary')
    // Every file type remains accessible even when the browser cannot preview it.
    const downloadButton = Button(t('download'))
    downloadButton.addClass('button', 'primary')
    const actions = Div()
    actions.addClass('actions')
    actions.append(backButton, downloadButton)

    const passwordWrap = Div()
    passwordWrap.el.style.display = 'flex'
    passwordWrap.el.style.flexWrap = 'wrap'
    passwordWrap.el.style.gap = '8px'
    const passwordInput = Input('', 'password')
    passwordInput.el.setAttribute('placeholder', t('enterPassword'))
    passwordInput.el.setAttribute('aria-label', t('enterPassword'))
    passwordInput.el.style.flex = '1'
    passwordInput.el.style.minWidth = '180px'
    const unlockButton = Button(t('unlock'))
    unlockButton.addClass('button', 'secondary')
    const passwordError = P('')
    passwordError.addClass('error')
    passwordError.el.style.flexBasis = '100%'
    passwordWrap.append(passwordInput, unlockButton, passwordError)

    const error = P('')
    error.addClass('error')
    card.append(heading, meta, mediaWrap, passwordWrap, actions, error)
    page.append(preferencesBar, card)

    let currentId = ''
    let shareUrl = ''
    let downloadUrl = ''
    let ownerPassword = ''

    function renderMedia(contentType: string, fileName: string, password?: string) {
        mediaWrap.el.innerHTML = ''
        const query = new URLSearchParams(window.location.search)
        if (password) query.set('password', password)
        else query.delete('password')
        const source = `/api/files/${currentId}/preview?${query.toString()}`

        // Match the media element to the file's type. The server already guessed a
        // type from the file name when the uploader's browser reported none.
        const type = contentType
        if (type.startsWith('image/')) {
            const image = Base('img')
            image.el.src = source
            image.el.alt = fileName
            image.el.style.display = 'block'
            image.el.style.maxWidth = '100%'
            image.el.style.maxHeight = '75vh'
            image.el.style.margin = '0 auto'
            mediaWrap.append(image)
        } else if (type.startsWith('video/')) {
            const video = Base('video')
            video.el.src = source
            video.el.controls = true
            video.el.style.display = 'block'
            video.el.style.maxWidth = '100%'
            video.el.style.maxHeight = '75vh'
            video.el.style.margin = '0 auto'
            mediaWrap.append(video)
        } else if (type === 'application/pdf') {
            const frame = Base('iframe')
            frame.el.src = source
            frame.el.title = fileName
            frame.el.style.width = '100%'
            frame.el.style.height = '75vh'
            frame.el.style.minHeight = '480px'
            frame.el.style.border = '0'
            mediaWrap.append(frame)
        } else {
            // Archives and other binary formats cannot be rendered by browsers, so explain the download option.
            const message = P(t('previewUnavailable'))
            message.addClass('intro')
            mediaWrap.append(message)
        }
        mediaWrap.el.style.display = 'block'
        show(mediaWrap, true)
    }

    async function loadFile(id: string, password?: string) {
        show(mediaWrap, false)
        show(actions, false)
        show(passwordWrap, false)
        show(passwordError, false)
        show(error, false)
        heading.text(t('loading'))
        meta.text('')

        try {
            const file = await fileInfo(id, password)
            currentId = file.id
            const query = new URLSearchParams(window.location.search)
            const expiresAt = Number(query.get('expires'))
            query.delete('password')
            shareUrl = `${window.location.origin}/f/${file.id}?${query.toString()}`
            const authorizedQuery = new URLSearchParams(query)
            if (password) authorizedQuery.set('password', password)
            ownerPassword = password ?? ''
            downloadUrl = `/api/files/${file.id}/download?${authorizedQuery.toString()}`
            heading.text(file.fileName)
            meta.text(`${fileSize(file.size)} · ${t('linkExpiresAt', { date: new Date(expiresAt * 1000).toLocaleString(languageLocale()) })}`)
            renderMedia(file.contentType, file.fileName, password)
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

    // Load the file after route parameters are available, preserving signed-link validation.
    page.on('enter', async ({ params }: IRouteEvent) => {
        // Every viewer, including the uploader's own Preview action, must unlock protected files.
        await loadFile(params.id)
    })

    // Let password-protected preview links retry in place without losing the share signature.
    unlockButton.on('click', async () => {
        const password = passwordInput.value().trim()
        if (!password) {
            passwordError.text(t('pleaseEnterPassword'))
            show(passwordError, true)
            return
        }
        const pathSegments = new URL(location.href).pathname.split('/')
        await loadFile(currentId || pathSegments[pathSegments.length - 2] || '', password)
    })

    // Return to the completed-upload screen and restore its existing signed link.
    backButton.on('click', () => {
        if (!shareUrl) return
        const params = new URLSearchParams({ completed: shareUrl })
        if (ownerPassword) storeUploaderPassword(currentId, ownerPassword)
        window.location.href = `/?${params.toString()}`
    })

    // Download through the counted endpoint while preserving the validated link and password.
    downloadButton.on('click', () => {
        if (downloadUrl) window.location.href = downloadUrl
    })

    // Start hidden through the shared class helper rather than inline display styles.
    show(mediaWrap, false)
    show(passwordWrap, false)
    show(actions, false)

    return page
}
