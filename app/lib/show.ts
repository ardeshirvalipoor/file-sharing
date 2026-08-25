// Both pages build every piece of their screen once and then switch pieces on
// and off. This is that switch.

type Toggleable = { toggleClass(cls: string, force?: boolean): unknown }

export function show(component: Toggleable, visible: boolean) {
    component.toggleClass('hidden', !visible)
}
