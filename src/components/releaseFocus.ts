import type { MouseEvent } from 'react'

/**
 * The reveal screen leaves Space/Enter to whichever button has focus, so a corner button still
 * focused after a mouse click would swallow the next "กดลุ้น" keypress. Keyboard presses (detail 0)
 * keep focus where the keyboard user put it.
 */
export function releaseFocus(event: MouseEvent<HTMLButtonElement>, action: () => void): void {
  if (event.detail > 0) event.currentTarget.blur()
  action()
}
