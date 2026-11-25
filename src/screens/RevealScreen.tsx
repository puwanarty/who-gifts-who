import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Confetti } from '../components/Confetti'
import { GiftBox, type GiftBoxStage } from '../components/GiftBox'
import { RestartButton } from '../components/RestartButton'
import { useAppState } from '../state/AppStateContext'
import './RevealScreen.css'

const SHAKE_DURATION_MS = 2400
// Extra presses from an excited guest would otherwise hit "next" the instant the box opens
// and dismiss the result before the room sees it.
const FINISH_GUARD_MS = 1000

/** Rendered with `key={currentGiverId}` so each giver starts with fresh local state. */
export function RevealScreen() {
  const { state, dispatch } = useAppState()
  const reducedMotion = useReducedMotion() ?? false
  const giverId = state.currentGiverId
  const alreadyRevealed = giverId !== null && state.revealedGiverIds.includes(giverId)

  // A giver who was revealed before this screen mounted (a refresh mid-reveal) shows the open box without replaying.
  const [openedOnMount] = useState(alreadyRevealed)
  const [stage, setStage] = useState<GiftBoxStage>(alreadyRevealed ? 'opened' : 'idle')
  const [canFinish, setCanFinish] = useState(alreadyRevealed)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  function later(callback: () => void, delayMs: number) {
    timers.current.push(window.setTimeout(callback, delayMs))
  }

  function open() {
    setStage('opened')
    later(() => setCanFinish(true), FINISH_GUARD_MS)
  }

  const everyoneRevealed = state.participants.every((person) => state.revealedGiverIds.includes(person.id))

  function press() {
    if (stage !== 'idle') return
    // Mark first, so a refresh during the animation cannot give this person a second reveal.
    dispatch({ type: 'markRevealed' })
    if (reducedMotion) {
      open()
      return
    }
    setStage('shaking')
    later(open, SHAKE_DURATION_MS)
  }

  function finish() {
    if (!canFinish) return
    dispatch({ type: 'finishReveal' })
  }

  // Space/Enter work anywhere, so a presenter clicker or keyboard can drive the reveal.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== ' ' && event.key !== 'Enter') return
      if (event.repeat) return
      const target = event.target as HTMLElement | null
      // Focused controls already handle these keys themselves.
      if (target?.closest('button, input, select, textarea, a')) return
      event.preventDefault()
      if (stage === 'idle') press()
      else if (stage === 'opened') finish()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (giverId === null || state.assignments === null) return null
  const nameOf = (id: string) => state.participants.find((person) => person.id === id)?.name ?? ''
  const giverName = nameOf(giverId)
  const receiverName = nameOf(state.assignments[giverId])
  const isOpened = stage === 'opened'
  const skipEntrance = openedOnMount || reducedMotion

  return (
    <main className="reveal">
      {stage !== 'shaking' && <RestartButton />}

      <p className="reveal-turn">
        ตาของ <strong>{giverName}</strong>
      </p>

      <div className="reveal-stage">
        <div className="reveal-name-slot" aria-live="polite">
          {isOpened && (
            <motion.p
              className="reveal-name"
              style={{ '--name-length': Math.max(receiverName.length, 4) } as CSSProperties}
              initial={skipEntrance ? false : { opacity: 0, y: '70%', scale: 0.3 }}
              animate={{ opacity: 1, y: '0%', scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 15 }}
            >
              {receiverName}
            </motion.p>
          )}
        </div>
        <div className="reveal-box">
          <GiftBox stage={stage} reducedMotion={reducedMotion} />
          <Confetti active={isOpened && !skipEntrance} />
        </div>
        <p className="reveal-line">
          {isOpened ? (
            <>
              {giverName} ได้ซื้อของขวัญให้ <strong>{receiverName}</strong>
            </>
          ) : (
            ' '
          )}
        </p>
      </div>

      <div className="reveal-actions">
        {stage !== 'opened' ? (
          <>
            <button type="button" className="reveal-primary" onClick={press} disabled={stage === 'shaking'}>
              กดลุ้น
            </button>
            {stage === 'idle' && (
              <button type="button" className="reveal-secondary" onClick={() => dispatch({ type: 'closeReveal' })}>
                ย้อนกลับ
              </button>
            )}
          </>
        ) : (
          <button type="button" className="reveal-primary" onClick={finish} disabled={!canFinish}>
            {everyoneRevealed ? 'ดูสรุปทั้งหมด' : 'คนต่อไป'}
          </button>
        )}
      </div>
    </main>
  )
}
