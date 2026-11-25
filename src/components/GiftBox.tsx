import { motion } from 'motion/react'
import './GiftBox.css'

export type GiftBoxStage = 'idle' | 'shaking' | 'opened'

// The lid pops up, then lands on the floor left of the box so it never covers the name above.
const LID_OPEN = { x: ['0%', '-55%', '-108%'], y: ['0%', '-140%', '285%'], rotate: [0, -35, -3] }
const LID_CLOSED = { x: '0%', y: '0%', rotate: 0 }

export function GiftBox({ stage, reducedMotion }: { stage: GiftBoxStage; reducedMotion: boolean }) {
  return (
    <div className={`gift-box${stage === 'shaking' && !reducedMotion ? ' is-shaking' : ''}`} aria-hidden="true">
      <div className="gift-box-body" />
      <motion.div
        className="gift-box-lid"
        // initial={false} starts at the target pose, so a box that is already open after a refresh does not replay.
        initial={false}
        animate={stage === 'opened' ? LID_OPEN : LID_CLOSED}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.85, times: [0, 0.35, 1], ease: ['easeOut', 'easeIn'] }}
      />
    </div>
  )
}
