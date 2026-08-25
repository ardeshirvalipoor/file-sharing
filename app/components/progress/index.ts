// A bar and a line of numbers under it. Give it byte counts; it works out the
// percentage, the sizes and the speed.

import { Div, Span } from '@codesuma/baseline'
import { fileSize, percentage, transferRate } from '../../lib/format'
import styles from './index.module.css'

export const Progress = () => {
    const base = Div()
    base.addClass(styles.progress)

    const track = Div()
    track.addClass(styles.track)

    const fill = Div()
    fill.addClass(styles.fill)
    track.append(fill)

    const done = Span('0%')
    done.addClass(styles.done)

    const rate = Span('')
    rate.addClass(styles.rate)

    const numbers = Div()
    numbers.addClass(styles.numbers)
    numbers.append(done, rate)

    base.append(track, numbers)

    // Where this run started, remembered on the first update. A resumed upload
    // begins at, say, 600 MB already done; counting those bytes into the speed
    // would show a number nobody's connection ever reached.
    let startedBytes: number | null = null
    let startedAt = 0

    return Object.assign(base, {
        update(uploadedBytes: number, totalBytes: number) {
            if (startedBytes === null) {
                startedBytes = uploadedBytes
                startedAt = Date.now()
            }

            const percent = percentage(uploadedBytes, totalBytes)

            fill.style({ width: `${percent}%` })
            done.text(`${percent}% · ${fileSize(uploadedBytes)} of ${fileSize(totalBytes)}`)
            rate.text(transferRate(uploadedBytes - startedBytes, Date.now() - startedAt))
        },

        // Called before a new upload so the next one measures its own speed.
        reset() {
            startedBytes = null
            fill.style({ width: '0%' })
            done.text('0%')
            rate.text('')
        }
    })
}
