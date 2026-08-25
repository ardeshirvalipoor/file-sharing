// The page people land on: pick a file, watch it go up, copy the link.
//
// The page owns no upload logic. It builds the pieces of the screen once, then
// moves between five stages by showing and hiding them. Reading setStage() below
// tells you everything about what the screen can look like.

import { Button, Div, H1, Input, P, Page, waitFor } from '@codesuma/baseline'
import { Progress } from '../../components/progress'
import { DropZone } from '../../components/drop-zone'
import { fileSize } from '../../lib/format'
import { discardUpload, resumableUpload, uploadFile } from '../../lib/upload'
import { show } from '../../lib/show'
import styles from './index.module.css'

// The server enforces this too. Checking here only saves a pointless round trip
// and gives a faster answer.
const MAX_FILE_SIZE = 1024 * 1024 * 1024

type Stage = 'idle' | 'chosen' | 'uploading' | 'done' | 'failed'

export const UploadPage = () => {
    const page = Page()
    page.addClass('screen')

    const card = Div()
    card.addClass('card')

    const heading = H1('Send a big file')
    heading.addClass('heading')

    const intro = P('Upload up to 1 GB and share the link. Close the tab halfway through and the next attempt carries on from where it stopped.')
    intro.addClass('intro')

    const dropZone = DropZone()

    // --- the chosen file -----------------------------------------------------

    const fileName = Div()
    fileName.addClass(styles.fileName)

    const fileMeta = Div()
    fileMeta.addClass(styles.fileMeta)

    const fileRow = Div()
    fileRow.addClass(styles.fileRow)
    fileRow.append(fileName, fileMeta)

    const resumeNote = P('We still have part of this file from an earlier attempt. Continuing will only send what is missing.')
    resumeNote.addClass('note')

    const uploadButton = Button('Upload')
    uploadButton.addClass('button', 'primary')

    const discardButton = Button('Start fresh')
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

    const copyButton = Button('Copy')
    copyButton.addClass('button', 'secondary')

    const shareRow = Div()
    shareRow.addClass(styles.shareRow)
    shareRow.append(shareInput, copyButton)

    const error = P('')
    error.addClass('error')

    const retryButton = Button('Try again')
    retryButton.addClass('button', 'primary')

    const againButton = Button('Send another file')
    againButton.addClass('button', 'secondary')

    const endActions = Div()
    endActions.addClass('actions')
    endActions.append(retryButton, againButton)

    card.append(heading, intro, dropZone, fileRow, resumeNote, actions, progress, status, shareRow, error, endActions)
    page.append(card)

    // --- state ---------------------------------------------------------------

    let chosen: File | null = null
    let canResume = false

    function setStage(stage: Stage) {
        show(dropZone, stage === 'idle')
        show(fileRow, stage !== 'idle')
        show(resumeNote, stage === 'chosen' && canResume)
        show(actions, stage === 'chosen')
        show(discardButton, canResume)
        show(progress, stage === 'uploading')
        show(status, stage === 'uploading')
        show(shareRow, stage === 'done')
        show(error, stage === 'failed')
        show(endActions, stage === 'done' || stage === 'failed')
        show(retryButton, stage === 'failed')
    }

    async function choose(file: File) {
        if (file.size > MAX_FILE_SIZE) {
            chosen = null
            error.text(`${file.name} is ${fileSize(file.size)}. The limit is 1 GB.`)
            setStage('failed')
            show(fileRow, false)
            show(retryButton, false)
            return
        }

        chosen = file
        canResume = Boolean(await resumableUpload(file))

        fileName.text(file.name)
        fileMeta.text(fileSize(file.size))
        uploadButton.text(canResume ? 'Continue upload' : 'Upload')

        setStage('chosen')
    }

    async function run() {
        if (!chosen) return

        progress.reset()
        status.text('Preparing the upload')
        setStage('uploading')

        try {
            const finished = await uploadFile(chosen, {
                onStatus: message => status.text(message),
                onProgress: report => progress.update(report.uploadedBytes, report.totalBytes)
            })

            shareInput.setValue(finished.url)
            canResume = false
            setStage('done')
        } catch (problem) {
            // Whatever went wrong, the parts that did arrive are still in the
            // bucket, so "Try again" really does continue rather than restart.
            canResume = true
            error.text(problem instanceof Error ? problem.message : 'The upload failed')
            setStage('failed')
        }
    }

    dropZone.on('file', (file: File) => { void choose(file) })
    uploadButton.on('click', () => { void run() })
    retryButton.on('click', () => { void run() })

    discardButton.on('click', async () => {
        if (!chosen) return
        await discardUpload(chosen)
        canResume = false
        uploadButton.text('Upload')
        setStage('chosen')
    })

    againButton.on('click', () => {
        chosen = null
        canResume = false
        setStage('idle')
    })

    copyButton.on('click', async () => {
        await navigator.clipboard.writeText(shareInput.value())
        copyButton.text('Copied')
        await waitFor(1500)
        copyButton.text('Copy')
    })

    setStage('idle')

    return page
}
