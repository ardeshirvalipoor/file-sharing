// The page people land on: pick a file, watch it go up, copy the link.
//
// The page owns no upload logic. It builds the pieces of the screen once, then
// moves between five stages by showing and hiding them. Reading setStage() below
// tells you everything about what the screen can look like.

import { Base, Button, Div, H1, Input, P, Page, Span, waitFor } from '@codesuma/baseline'
import { Progress } from '../../components/progress'
import { DropZone } from '../../components/drop-zone'
import * as api from '../../lib/api'
import { fileSize } from '../../lib/format'
import { discardUpload, resumableUpload, uploadFile } from '../../lib/upload'
import { consumeUploaderPassword, storeUploaderPassword } from '../../lib/uploader-password'
import { show } from '../../lib/show'
import { createPreferencesBar, t, translateUploadStatus } from '../../lib/preferences'
import styles from './index.module.css'

// The server enforces this too. Checking here only saves a pointless round trip
// and gives a faster answer.
const MAX_FILE_SIZE = 1024 * 1024 * 1024

type Stage = 'idle' | 'chosen' | 'uploading' | 'done' | 'failed'

export const UploadPage = () => {
    const page = Page()
    page.addClass('screen')
    const preferencesBar = createPreferencesBar()

    const card = Div()
    card.addClass('card')

    // Put the product name in the main heading so the brand is immediately clear.
    const heading = H1('Linkify')
    heading.addClass('heading')

    // Keep the 1 GB limit and resumable-upload promise visible in the introduction.
    const intro = P(t('intro'))
    intro.addClass('intro')

    const benefitsWrap = Div()
    benefitsWrap.addClass('benefits-wrap')
    const benefitsTitle = Base('h2')
    benefitsTitle.addClass('benefits-title')
    benefitsTitle.text(t('benefitsTitle'))
    const benefits = Div()
    benefits.addClass('benefits')
    const benefitItems = [
        { emoji: '⚡', title: t('fast'), text: t('fastDetail') },
        { emoji: '🔒', title: t('private'), text: t('privateDetail') },
        { emoji: '🛡️', title: t('safe'), text: t('safeDetail') },
        { emoji: '↩️', title: t('resumable'), text: t('resumableDetail') },
        { emoji: '✨', title: t('simple'), text: t('simpleDetail') },
        { emoji: '✅', title: t('reliable'), text: t('reliableDetail') }
    ]
    for (const item of benefitItems) {
        const block = Div()
        block.addClass('benefit')
        const heading = Base('strong')
        heading.text(`${item.emoji} ${item.title}`)
        const detail = Span(item.text)
        block.append(heading, detail)
        benefits.append(block)
    }
    benefitsWrap.append(benefitsTitle, benefits)

    // Explain Linkify's purpose and the core transfer behavior below the benefits.
    const aboutWrap = Div()
    aboutWrap.addClass('about-wrap')
    const aboutTitle = Base('h2')
    aboutTitle.addClass('about-title')
    aboutTitle.text(t('aboutTitle'))
    const aboutDescription = P(t('aboutDescription'))
    aboutDescription.addClass('about-description')
    aboutWrap.append(aboutTitle, aboutDescription)

    // Offer only the three supported link lifetimes in a native accessible select.
    const expiryChoices: { value: api.LinkExpiry; label: string }[] = [
        { value: '1h', label: t('hour') },
        { value: '1d', label: t('day') },
        { value: '1w', label: t('week') }
    ]
    const expiryRow = Div()
    expiryRow.addClass(styles.expiryRow)
    const expiryLabel = Base('label')
    expiryLabel.addClass(styles.expiryLabel)
    expiryLabel.append(Span(t('expiryLabel')))
    const expirySelect = Base('select')
    expirySelect.addClass(styles.expirySelect)
    expirySelect.el.setAttribute('aria-label', t('expiryLabel'))
    for (const choice of expiryChoices) {
        const option = Base('option')
        option.el.setAttribute('value', choice.value)
        option.el.textContent = choice.label
        expirySelect.append(option)
    }
    expirySelect.el.value = '1h'
    expiryLabel.append(expirySelect)
    expiryRow.append(expiryLabel)

    // A password toggle lets the uploader choose whether a sensitive file should be
    // protected before the share link is created.
    const passwordRow = Div()
    passwordRow.addClass(styles.passwordRow)
    const passwordToggle = Input('', 'checkbox', { checked: false })
    passwordToggle.addClass(styles.passwordToggle)
    const passwordLabel = Base('label')
    passwordLabel.addClass(styles.passwordLabel)
    passwordLabel.append(passwordToggle, Span(t('protect')))
    const passwordInput = Input('', 'password')
    passwordInput.addClass(styles.passwordInput)
    passwordInput.el.setAttribute('placeholder', t('passwordPlaceholder'))
    passwordInput.el.setAttribute('aria-label', t('enterPassword'))
    passwordRow.append(passwordLabel, passwordInput)
    // Show password validation directly below the input that needs correction.
    const passwordError = P('')
    passwordError.addClass('error')
    passwordError.el.style.flexBasis = '100%'
    passwordError.el.style.boxSizing = 'border-box'
    passwordRow.append(passwordError)

    const dropZone = DropZone(t('dropTitle'), t('dropHint'))

    // Terms live directly under the upload field so an uploader has to agree before
    // a file can be selected or sent.
    const termsRow = Div()
    termsRow.addClass(styles.termsRow)
    const termsCheckbox = Input('', 'checkbox', { checked: false })
    termsCheckbox.addClass(styles.termsCheckbox)
    const termsLabel = Base('label')
    termsLabel.addClass(styles.termsLabel)
    const termsText = Span(`${t('agree')} `)
    const termsLink = Base('a')
    termsLink.el.href = '/terms.html'
    termsLink.el.target = '_blank'
    termsLink.el.rel = 'noopener noreferrer'
    termsLink.el.textContent = t('terms')
    const termsAnd = Span(` ${t('and')} `)
    const privacyLink = Base('a')
    privacyLink.el.href = '/privacy.html'
    privacyLink.el.target = '_blank'
    privacyLink.el.rel = 'noopener noreferrer'
    privacyLink.el.textContent = t('privacy')
    termsLabel.append(termsCheckbox, termsText, termsLink, termsAnd, privacyLink)
    termsRow.append(termsLabel)
    // Explain that consent is required and update the note as the checkbox changes.
    const termsHint = P(t('acceptBeforeUse'))
    termsHint.addClass('note')
    termsRow.append(termsHint)

    // The preview area shows a quick thumbnail or media snapshot for images, video,
    // and PDFs before the user shares the final link.
    const previewWrap = Div()
    previewWrap.addClass(styles.previewWrap)
    const previewMedia = Div()
    previewMedia.addClass(styles.previewMedia)
    previewWrap.append(previewMedia)

    // --- the chosen file -----------------------------------------------------

    const fileName = Div()
    fileName.addClass(styles.fileName)

    const fileMeta = Div()
    fileMeta.addClass(styles.fileMeta)

    const fileRow = Div()
    fileRow.addClass(styles.fileRow)
    fileRow.append(fileName, fileMeta)

    const resumeNote = P(t('resumeNote'))
    resumeNote.addClass('note')

    const uploadButton = Button(t('upload'))
    uploadButton.addClass('button', 'primary')

    const discardButton = Button(t('discard'))
    discardButton.addClass('button', 'secondary')

    const actions = Div()
    actions.addClass('actions')
    actions.append(uploadButton, discardButton)

    // --- while it runs -------------------------------------------------------

    const progress = Progress()

    const status = P('')
    status.addClass('status')

    // --- when it ends --------------------------------------------------------

    const shareInput = Input('', 'text', { readonly: true })
    shareInput.addClass(styles.shareInput)

    const copyButton = Button(t('copy'))
    copyButton.addClass('button', 'secondary')

    // Add a small action group so the finished share link can be opened in a new
    // tab or shown as a QR code for mobile scanning without leaving the current page.
    const openButton = Button(t('openLink'))
    openButton.addClass('button', 'secondary')

    // Open the dedicated media page without changing the share/download URL.
    const previewButton = Button(t('preview'))
    previewButton.addClass('button', 'secondary')

    // Keep the QR action visually compact while its accessible label names the action.
    const qrButton = Button('')
    qrButton.addClass('button', 'secondary', styles.qrButton)
    qrButton.el.setAttribute('aria-label', t('qrCodeTitle'))
    qrButton.el.title = t('qrCodeTitle')
    qrButton.el.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M3 3h7v7H3zM5 5v3h3V5zM14 3h7v7h-7zM16 5v3h3V5zM3 14h7v7H3zM5 16v3h3v-3z"/><path d="M13 13h3v3h-3zM18 13h3v2h-3zM17 16h2v2h-2zM13 18h2v3h-2zM16 19h2v2h-2zM20 17h1v4h-1z"/></svg>'

    const shareActions = Div()
    shareActions.addClass(styles.shareActions)
    shareActions.append(copyButton, openButton, previewButton, qrButton)

    const shareRow = Div()
    shareRow.addClass(styles.shareRow)
    shareRow.append(shareInput, shareActions)

    // Keep a dedicated popup for the generated QR code so users can scan it from
    // a phone while the desktop browser still shows the share link and controls.
    const qrModal = Div()
    qrModal.addClass('qr-modal', 'hidden')
    const qrDialog = Div()
    qrDialog.addClass('qr-dialog')
    const qrTitle = Base('h3')
    qrTitle.addClass('qr-title')
    qrTitle.text(t('qrCodeTitle'))
    const qrImage = Base('img')
    qrImage.addClass('qr-image')
    qrImage.el.alt = t('qrCodeTitle')
    const qrCloseButton = Button(t('close'))
    qrCloseButton.addClass('button', 'secondary')
    qrDialog.append(qrTitle, qrImage, qrCloseButton)
    qrModal.append(qrDialog)

    // Confirm the selected expiration beside the completed share link.
    const expirySummary = P('')
    expirySummary.addClass('status')

    const error = P('')
    error.addClass('error')

    const retryButton = Button(t('tryAgain'))
    retryButton.addClass('button', 'primary')

    const againButton = Button(t('sendAnother'))
    againButton.addClass('button', 'secondary')

    const endActions = Div()
    endActions.addClass('actions')
    endActions.append(retryButton, againButton)

    card.append(heading, intro, expiryRow, passwordRow, dropZone, previewWrap, fileRow, resumeNote, actions, termsRow, progress, status, shareRow, expirySummary, error, endActions)
    page.append(preferencesBar, card, benefitsWrap, aboutWrap, qrModal)

    // --- state ---------------------------------------------------------------

    let chosen: File | null = null
    let canResume = false
    let previewUrl: string | null = null
    let currentShareUrl = ''
    // Keep viewer URLs identical to the public share link.
    function uploaderLink(value: string): URL {
        const link = new URL(value)
        link.searchParams.delete('password')
        return link
    }

    // Clear any stale tab password and navigate in place; every viewer must ask for the password.
    function openViewer(url: URL): void {
        const match = /^\/f\/([^/]+)/.exec(url.pathname)
        if (!match) {
            throw new Error('The file viewer URL is not valid')
        }

        storeUploaderPassword(match[1], '')
        window.location.href = url.toString()
    }

    // Restore the completed-upload view when returning from a file viewer.
    page.on('enter', async () => {
        const params = new URLSearchParams(window.location.search)
        const completedLink = params.get('completed')
        if (!completedLink) return

        try {
            const shareUrl = new URL(completedLink)
            const match = /^\/f\/([^/]+)$/.exec(shareUrl.pathname)
            if (shareUrl.origin !== window.location.origin || !match) {
                throw new Error('The saved share link is not valid')
            }

            // Consume the restoration URL so refreshing returns to a clean upload page.
            window.history.replaceState(null, '', '/')
            const ownerPassword = consumeUploaderPassword(match[1]) ?? ''
            const file = await api.fileInfo(match[1], ownerPassword || undefined, shareUrl)
            chosen = null
            canResume = false
            fileName.text(file.fileName)
            fileMeta.text(fileSize(file.size))
            currentShareUrl = `${shareUrl.origin}${shareUrl.pathname}${shareUrl.search}`
            shareInput.setValue(currentShareUrl)
            expirySummary.text(t('linkExpiresAt', {
                date: new Date(Number(shareUrl.searchParams.get('expires')) * 1000).toLocaleString()
            }))
            show(previewButton, true)
            setStage('done')
        } catch (problem) {
            heading.text(t('nothingHere'))
            error.text(problem instanceof Error ? problem.message : t('linkDidNotWork'))
            setStage('failed')
        }
    })

    function updateUploadAvailability() {
        const enabled = termsCheckbox.el.checked
        dropZone.setDisabled(!enabled)
        show(termsHint, !enabled)
        uploadButton.el.disabled = !enabled
        uploadButton.el.setAttribute('aria-disabled', String(!enabled))
        if (!enabled) {
            uploadButton.el.title = t('acceptBeforeUpload')
        } else {
            uploadButton.el.title = ''
        }
    }

    function setStage(stage: Stage) {
        show(dropZone, stage === 'idle')
        show(expiryRow, stage === 'idle' || stage === 'chosen')
        show(passwordRow, stage === 'idle' || stage === 'chosen')
        show(termsRow, stage === 'idle' || stage === 'chosen')
        show(previewWrap, stage === 'chosen' || stage === 'uploading')
        show(fileRow, stage !== 'idle')
        show(resumeNote, stage === 'chosen' && canResume)
        show(actions, stage === 'chosen')
        show(discardButton, canResume)
        show(progress, stage === 'uploading')
        show(status, stage === 'uploading')
        show(shareRow, stage === 'done')
        show(expirySummary, stage === 'done')
        show(error, stage === 'failed')
        show(endActions, stage === 'done' || stage === 'failed')
        show(retryButton, stage === 'failed')
    }

    function resetPreview() {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            previewUrl = null
        }
        previewMedia.el.innerHTML = ''
    }

    function renderPreview(file: File) {
        resetPreview()
        const type = file.type || ''

        if (type.startsWith('image/')) {
            const image = Base('img')
            image.el.src = URL.createObjectURL(file)
            image.el.alt = file.name
            previewMedia.append(image)
            previewUrl = image.el.src
            return
        }

        if (type.startsWith('video/')) {
            const video = Base('video')
            video.el.src = URL.createObjectURL(file)
            video.el.controls = true
            video.el.muted = true
            previewMedia.append(video)
            previewUrl = video.el.src
            return
        }

        if (type === 'application/pdf') {
            const frame = Base('iframe')
            frame.el.src = URL.createObjectURL(file)
            frame.el.title = file.name
            frame.el.setAttribute('sandbox', 'allow-scripts allow-same-origin')
            previewMedia.append(frame)
            previewUrl = frame.el.src
        }
    }

    async function choose(file: File) {
        if (!termsCheckbox.el.checked) {
            error.text(t('acceptBeforeSelect'))
            setStage('failed')
            show(fileRow, false)
            show(retryButton, false)
            resetPreview()
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            chosen = null
            error.text(t('tooLarge', { name: file.name, size: fileSize(file.size) }))
            setStage('failed')
            show(fileRow, false)
            show(retryButton, false)
            resetPreview()
            return
        }

        chosen = file
        canResume = Boolean(await resumableUpload(file))

        fileName.text(file.name)
        fileMeta.text(fileSize(file.size))
        uploadButton.text(canResume ? t('continueUpload') : t('upload'))
        renderPreview(file)

        setStage('chosen')
    }

    async function run() {
        if (!chosen) return

        if (!termsCheckbox.el.checked) {
            error.text(t('acceptBeforeUpload'))
            setStage('failed')
            return
        }

        const password = passwordToggle.el.checked ? passwordInput.value().trim() : undefined
        if (passwordToggle.el.checked && !password) {
            passwordError.text(t('passwordRequired'))
            show(passwordError, true)
            return
        }
        if (password !== undefined && password.length < 6) {
            show(passwordError, false)
            error.text(t('passwordTooShort'))
            setStage('failed')
            return
        }
        show(passwordError, false)

        const expiresIn = (expirySelect.el as HTMLSelectElement).value as api.LinkExpiry
        // Clear any earlier result before this upload starts so actions cannot reuse a stale link.
        currentShareUrl = ''
        shareInput.setValue('')
        progress.reset()
        status.text(t('preparingUpload'))
        setStage('uploading')

        try {
            const finished = await uploadFile(chosen, {
                onStatus: message => status.text(translateUploadStatus(message)),
                onProgress: report => progress.update(report.uploadedBytes, report.totalBytes)
            }, expiresIn, password)

            currentShareUrl = finished.url
            shareInput.setValue(currentShareUrl)
            // Every completed upload can open its dedicated preview or download page.
            show(previewButton, true)
            expirySummary.text(t('expirySummary', { duration: expiryChoices.find(choice => choice.value === expiresIn)?.label ?? '' }))
            canResume = false
            setStage('done')
        } catch (problem) {
            // Whatever went wrong, the parts that did arrive are still in the
            // bucket, so "Try again" really does continue rather than restart.
            canResume = true
            error.text(problem instanceof Error ? problem.message : t('uploadFailed'))
            setStage('failed')
        }
    }

    dropZone.on('file', (file: File) => { void choose(file) })
    uploadButton.on('click', () => {
        if (!termsCheckbox.el.checked) {
            error.text(t('acceptBeforeUpload'))
            setStage('failed')
            return
        }
        void run()
    })
    retryButton.on('click', () => { void run() })

    discardButton.on('click', async () => {
        if (!chosen) return
        await discardUpload(chosen)
        canResume = false
        uploadButton.text(t('upload'))
        setStage('chosen')
    })

    againButton.on('click', () => {
        chosen = null
        canResume = false
        currentShareUrl = ''
        shareInput.setValue('')
        passwordToggle.el.checked = false
        passwordInput.setValue('')
        termsCheckbox.el.checked = false
        updateUploadAvailability()
        show(qrModal, false)
        resetPreview()
        setStage('idle')
    })

    // Copying a fresh share link uses the browser clipboard when available and a
    // textarea fallback when permission is blocked. The button text changes to
    // "Copied" to confirm the action immediately.
    copyButton.on('click', async () => {
        const value = currentShareUrl
        if (!value) return

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value)
            } else {
                const area = document.createElement('textarea')
                area.value = value
                area.setAttribute('readonly', 'true')
                area.style.position = 'fixed'
                area.style.left = '-9999px'
                document.body.append(area)
                area.select()
                document.execCommand('copy')
                area.remove()
            }
        } catch {
            const area = document.createElement('textarea')
            area.value = value
            area.setAttribute('readonly', 'true')
            area.style.position = 'fixed'
            area.style.left = '-9999px'
            document.body.append(area)
            area.select()
            document.execCommand('copy')
            area.remove()
        }

        copyButton.text(t('copied'))
        await waitFor(1500)
        copyButton.text(t('copy'))
    })

    // Open the existing public share page in the reusable viewer tab.
    openButton.on('click', () => {
        const value = currentShareUrl
        if (!value) return
        try {
            openViewer(uploaderLink(value))
        } catch (problem) {
            error.text(problem instanceof Error ? problem.message : t('uploadFailed'))
            show(error, true)
        }
    })

    // Reuse the signed share-link query while routing to the dedicated preview screen.
    previewButton.on('click', () => {
        const value = currentShareUrl
        if (!value) return
        const previewLink = uploaderLink(value)
        previewLink.pathname = `${previewLink.pathname}/preview`
        try {
            openViewer(previewLink)
        } catch (problem) {
            error.text(problem instanceof Error ? problem.message : t('uploadFailed'))
            show(error, true)
        }
    })

    // The QR popup keeps mobile scanning easy without hiding the desktop share link.
    qrButton.on('click', () => {
        const value = currentShareUrl
        if (!value) return
        qrImage.el.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`
        qrImage.el.loading = 'eager'
        show(qrModal, true)
    })

    qrCloseButton.on('click', () => show(qrModal, false))
    qrModal.el.addEventListener('click', (event) => {
        if (event.target === qrModal.el) show(qrModal, false)
    })

    termsCheckbox.el.addEventListener('change', () => {
        updateUploadAvailability()
        if (termsCheckbox.el.checked) {
            error.text('')
            show(error, false)
        }
    })

    passwordToggle.el.addEventListener('change', () => {
        show(passwordInput, passwordToggle.el.checked)
        show(passwordError, false)
        if (!passwordToggle.el.checked) passwordInput.setValue('')
    })
    // Clear the required-password message as soon as a value is entered.
    passwordInput.el.addEventListener('input', () => {
        if (passwordInput.value().trim()) show(passwordError, false)
    })
    show(passwordInput, false)
    show(passwordError, false)
    updateUploadAvailability()
    setStage('idle')

    return page
}
