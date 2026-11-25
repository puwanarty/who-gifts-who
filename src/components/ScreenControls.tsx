import { useEffect, useState, type MouseEvent } from 'react'
import { setSoundMuted } from '../sound/sound'
import { loadMuted, saveMuted } from '../sound/soundPreference'
import './ScreenControls.css'

/** Sound and fullscreen toggles, shown on every screen for whoever runs the party laptop. */
export function ScreenControls() {
  const [muted, setMuted] = useState(loadMuted)
  const [isFullscreen, setIsFullscreen] = useState(() => document.fullscreenElement !== null)
  // iPhone Safari has no fullscreen for pages, so the button is left out there.
  const canFullscreen = document.fullscreenEnabled === true

  useEffect(() => {
    setSoundMuted(muted)
    saveMuted(muted)
  }, [muted])

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleFullscreen() {
    const change = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
    change.catch(() => {})
  }

  return (
    <div className="screen-controls">
      <button type="button" className="screen-control" onClick={(event) => releaseFocus(event, () => setMuted(!muted))}>
        {muted ? 'เปิดเสียง' : 'ปิดเสียง'}
      </button>
      {canFullscreen && (
        <button type="button" className="screen-control" onClick={(event) => releaseFocus(event, toggleFullscreen)}>
          {isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
        </button>
      )}
    </div>
  )
}

/**
 * The reveal screen leaves Space/Enter to whichever button has focus, so a button still focused
 * after a mouse click would swallow the next "กดลุ้น" keypress. Keyboard presses (detail 0) keep focus.
 */
function releaseFocus(event: MouseEvent<HTMLButtonElement>, action: () => void) {
  if (event.detail > 0) event.currentTarget.blur()
  action()
}
