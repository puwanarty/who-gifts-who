import { describe, expect, test } from 'vitest'
import type { Participant } from '../types'
import { isLastGiver } from './isLastGiver'

const alice: Participant = { id: 'a', name: 'Alice', partnerId: null }
const bob: Participant = { id: 'b', name: 'Bob', partnerId: null }
const carol: Participant = { id: 'c', name: 'Carol', partnerId: null }

function threeWith(revealedGiverIds: string[]) {
  return { participants: [alice, bob, carol], revealedGiverIds }
}

describe('isLastGiver', () => {
  test('is false while two or more others are unrevealed', () => {
    expect(isLastGiver(threeWith([]), 'a')).toBe(false)
  })

  test('is true when every other giver is revealed', () => {
    expect(isLastGiver(threeWith(['a', 'b']), 'c')).toBe(true)
  })

  test('stays true after the last giver is marked revealed', () => {
    expect(isLastGiver(threeWith(['a', 'b', 'c']), 'c')).toBe(true)
  })

  test('is false for a giver who is not last', () => {
    expect(isLastGiver(threeWith(['a']), 'b')).toBe(false)
  })

  test('handles two participants', () => {
    expect(isLastGiver({ participants: [alice, bob], revealedGiverIds: [] }, 'a')).toBe(false)
    expect(isLastGiver({ participants: [alice, bob], revealedGiverIds: ['a'] }, 'b')).toBe(true)
  })

  test('is false for an unknown giver id', () => {
    expect(isLastGiver(threeWith(['a', 'b', 'c']), 'zzz')).toBe(false)
  })
})
