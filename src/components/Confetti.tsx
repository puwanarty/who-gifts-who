import { motion } from 'motion/react'
import { useState } from 'react'
import './Confetti.css'

const COLORS = ['var(--box-red)', 'var(--ribbon)', 'var(--paper)', '#f2b134']
const DEFAULT_PIECE_COUNT = 60

type Piece = { x: number; y: number; rotate: number; delay: number; duration: number; color: string }

function makePieces(pieceCount: number): Piece[] {
  return Array.from({ length: pieceCount }, (_, index) => {
    // Burst upward in a fan, then fall below the starting point.
    const angle = Math.PI + Math.random() * Math.PI
    const distance = 20 + Math.random() * 30
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance + 25 + Math.random() * 20,
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.15,
      duration: 1.4 + Math.random() * 0.8,
      color: COLORS[index % COLORS.length],
    }
  })
}

export function Confetti({ active, pieceCount = DEFAULT_PIECE_COUNT }: { active: boolean; pieceCount?: number }) {
  // Created once per mount; RevealScreen remounts for each giver, so the count never changes mid-burst.
  const [pieces] = useState(() => makePieces(pieceCount))
  if (!active) return null

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <motion.span
          key={index}
          className="confetti-piece"
          style={{ background: piece.color }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: `${piece.x}vmin`, y: `${piece.y}vmin`, rotate: piece.rotate, opacity: 0 }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  )
}
