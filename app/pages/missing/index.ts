// Shown for any address that is not the upload page and not a share link.

import { Button, Div, H1, P, Page, router } from '@codesuma/baseline'
import { createPreferencesBar, t } from '../../lib/preferences'

export const MissingPage = () => {
    const page = Page()
    page.addClass('screen')
    const preferencesBar = createPreferencesBar()

    const card = Div()
    card.addClass('card')

    const heading = H1(t('missingTitle'))
    heading.addClass('heading')

    const intro = P(t('missingIntro'))
    intro.addClass('intro')

    const home = Button(t('sendFile'))
    home.addClass('button', 'primary')
    home.on('click', () => router.goto('/'))

    const actions = Div()
    actions.addClass('actions')
    actions.append(home)

    card.append(heading, intro, actions)
    page.append(preferencesBar, card)

    return page
}
