// Shown for any address that is not the upload page and not a share link.

import { Button, Div, H1, P, Page, router } from '@codesuma/baseline'

export const MissingPage = () => {
    const page = Page()
    page.addClass('screen')

    const card = Div()
    card.addClass('card')

    const heading = H1('Nothing at this address')
    heading.addClass('heading')

    const intro = P('The link may have been mistyped, or the file it pointed at is gone.')
    intro.addClass('intro')

    const home = Button('Send a file')
    home.addClass('button', 'primary')
    home.on('click', () => router.goto('/'))

    const actions = Div()
    actions.addClass('actions')
    actions.append(home)

    card.append(heading, intro, actions)
    page.append(card)

    return page
}
