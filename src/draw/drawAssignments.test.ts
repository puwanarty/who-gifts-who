import { describe, expect, test } from 'vitest'
import type { Assignments, Participant } from '../types'
import { cryptoRandom, drawAssignments, isValidAssignment } from './drawAssignments'

function people(count: number, couples: [number, number][] = []): Participant[] {
  const list: Participant[] = Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    name: `Person ${index}`,
    partnerId: null,
  }))
  for (const [a, b] of couples) {
    list[a].partnerId = list[b].id
    list[b].partnerId = list[a].id
  }
  return list
}

function allPaired(count: number): [number, number][] {
  const couples: [number, number][] = []
  for (let index = 0; index + 1 < count; index += 2) couples.push([index, index + 1])
  return couples
}

// Independent checker so the property tests do not rely on the code under test.
function violations(participants: Participant[], assignments: Assignments): string[] {
  const problems: string[] = []
  const ids = participants.map((person) => person.id)
  const givers = Object.keys(assignments)
  if (givers.length !== ids.length || !ids.every((id) => id in assignments)) {
    problems.push('givers do not match participants')
  }
  const receivers = Object.values(assignments)
  if (new Set(receivers).size !== receivers.length || !receivers.every((id) => ids.includes(id))) {
    problems.push('receivers are not a permutation')
  }
  for (const person of participants) {
    const receiver = assignments[person.id]
    if (receiver === person.id) problems.push(`${person.id} gives to self`)
    if (person.partnerId !== null && receiver === person.partnerId) {
      problems.push(`${person.id} gives to partner`)
    }
  }
  return problems
}

function isImpossible(count: number, couples: [number, number][]): boolean {
  return (count === 2 && couples.length === 1) || (count === 3 && couples.length === 1)
}

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function couplePatterns(count: number): [number, number][][] {
  return [[], [[0, 1]], allPaired(count)]
}

describe('drawAssignments', () => {
  test('always returns a valid assignment', () => {
    for (let count = 2; count <= 30; count++) {
      for (const couples of couplePatterns(count)) {
        if (isImpossible(count, couples)) continue
        const participants = people(count, couples)
        for (let run = 0; run < 200; run++) {
          const result = drawAssignments(participants)
          expect(result.ok, `n=${count} couples=${couples.length}`).toBe(true)
          if (result.ok) expect(violations(participants, result.assignments)).toEqual([])
        }
      }
    }
  })

  test('reports too few participants', () => {
    expect(drawAssignments([])).toEqual({ ok: false, reason: 'too-few-participants' })
    expect(drawAssignments(people(1))).toEqual({ ok: false, reason: 'too-few-participants' })
  })

  test('reports impossible configurations', () => {
    expect(drawAssignments(people(2, [[0, 1]]))).toEqual({ ok: false, reason: 'no-valid-assignment' })
    expect(drawAssignments(people(3, [[0, 1]]))).toEqual({ ok: false, reason: 'no-valid-assignment' })
  })

  test('backtracking finds a solution when sampling is disabled', () => {
    for (let count = 2; count <= 30; count++) {
      for (const couples of couplePatterns(count)) {
        if (isImpossible(count, couples)) continue
        const participants = people(count, couples)
        const result = drawAssignments(participants, cryptoRandom, 0)
        expect(result.ok, `n=${count} couples=${couples.length}`).toBe(true)
        if (result.ok) expect(violations(participants, result.assignments)).toEqual([])
      }
    }
    expect(drawAssignments(people(2, [[0, 1]]), cryptoRandom, 0)).toEqual({
      ok: false,
      reason: 'no-valid-assignment',
    })
    expect(drawAssignments(people(3, [[0, 1]]), cryptoRandom, 0)).toEqual({
      ok: false,
      reason: 'no-valid-assignment',
    })
  })

  test('is roughly uniform', () => {
    // Two couples (p0-p1, p2-p3) have exactly 4 valid assignments.
    const participants = people(4, [
      [0, 1],
      [2, 3],
    ])
    const counts = new Map<string, number>()
    for (let run = 0; run < 4000; run++) {
      const result = drawAssignments(participants)
      if (!result.ok) throw new Error('draw failed')
      const key = JSON.stringify(Object.entries(result.assignments).sort())
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    expect(counts.size).toBe(4)
    for (const count of counts.values()) {
      expect(count).toBeGreaterThanOrEqual(800)
      expect(count).toBeLessThanOrEqual(1200)
    }
  })

  test('uses the injected random source', () => {
    const participants = people(12, allPaired(12))
    const first = drawAssignments(participants, mulberry32(42))
    const second = drawAssignments(participants, mulberry32(42))
    const other = drawAssignments(participants, mulberry32(7))
    expect(first).toEqual(second)
    expect(first).not.toEqual(other)
  })
})

describe('isValidAssignment', () => {
  const couple = people(4, [[0, 1]])

  test('accepts a valid assignment', () => {
    expect(isValidAssignment(couple, { p0: 'p2', p1: 'p3', p2: 'p1', p3: 'p0' })).toBe(true)
  })

  test('rejects a self-assignment', () => {
    expect(isValidAssignment(couple, { p0: 'p0', p1: 'p3', p2: 'p1', p3: 'p2' })).toBe(false)
  })

  test('rejects a partner-assignment', () => {
    expect(isValidAssignment(couple, { p0: 'p1', p1: 'p2', p2: 'p3', p3: 'p0' })).toBe(false)
  })

  test('rejects a receiver used twice', () => {
    expect(isValidAssignment(couple, { p0: 'p2', p1: 'p2', p2: 'p3', p3: 'p0' })).toBe(false)
  })

  test('rejects a missing giver', () => {
    expect(isValidAssignment(couple, { p0: 'p2', p1: 'p3', p2: 'p0' })).toBe(false)
  })

  test('rejects an unknown receiver', () => {
    expect(isValidAssignment(couple, { p0: 'p2', p1: 'p3', p2: 'p0', p3: 'p9' })).toBe(false)
  })
})
