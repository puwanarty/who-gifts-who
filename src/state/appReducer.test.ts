import { describe, expect, test } from 'vitest'
import type { AppState, Participant } from '../types'
import { appReducer, initialState } from './appReducer'

function setupWith(participants: Participant[]): AppState {
  return { ...initialState, participants }
}

const alice: Participant = { id: 'a', name: 'Alice', partnerId: null }
const bob: Participant = { id: 'b', name: 'Bob', partnerId: null }
const carol: Participant = { id: 'c', name: 'Carol', partnerId: null }

function partnerIds(state: AppState): Record<string, string | null> {
  return Object.fromEntries(state.participants.map((person) => [person.id, person.partnerId]))
}

const drawn: AppState = {
  version: 1,
  phase: 'board',
  participants: [alice, bob, carol],
  assignments: { a: 'b', b: 'c', c: 'a' },
  revealedGiverIds: [],
  currentGiverId: null,
}

describe('participants in setup', () => {
  test('addParticipant appends a person without a partner', () => {
    const state = appReducer(initialState, { type: 'addParticipant', id: 'x', name: 'บอส' })
    expect(state.participants).toEqual([{ id: 'x', name: 'บอส', partnerId: null }])
  })

  test('renameParticipant keeps the typed text', () => {
    const state = appReducer(setupWith([alice]), { type: 'renameParticipant', id: 'a', name: 'Al ' })
    expect(state.participants[0].name).toBe('Al ')
  })

  test('setPartner links both sides', () => {
    const state = appReducer(setupWith([alice, bob, carol]), { type: 'setPartner', id: 'a', partnerId: 'b' })
    expect(partnerIds(state)).toEqual({ a: 'b', b: 'a', c: null })
  })

  test('setPartner to a new partner unlinks the old pair', () => {
    const paired = appReducer(setupWith([alice, bob, carol]), { type: 'setPartner', id: 'a', partnerId: 'b' })
    const state = appReducer(paired, { type: 'setPartner', id: 'a', partnerId: 'c' })
    expect(partnerIds(state)).toEqual({ a: 'c', b: null, c: 'a' })
  })

  test('setPartner to someone already paired unlinks their old partner', () => {
    const paired = appReducer(setupWith([alice, bob, carol]), { type: 'setPartner', id: 'a', partnerId: 'b' })
    const state = appReducer(paired, { type: 'setPartner', id: 'c', partnerId: 'b' })
    expect(partnerIds(state)).toEqual({ a: null, b: 'c', c: 'b' })
  })

  test('setPartner null unlinks both', () => {
    const paired = appReducer(setupWith([alice, bob]), { type: 'setPartner', id: 'a', partnerId: 'b' })
    const state = appReducer(paired, { type: 'setPartner', id: 'b', partnerId: null })
    expect(partnerIds(state)).toEqual({ a: null, b: null })
  })

  test('setPartner with yourself is ignored', () => {
    const before = setupWith([alice, bob])
    expect(appReducer(before, { type: 'setPartner', id: 'a', partnerId: 'a' })).toBe(before)
  })

  test('removing a partnered participant clears the partner link', () => {
    const paired = appReducer(setupWith([alice, bob, carol]), { type: 'setPartner', id: 'a', partnerId: 'b' })
    const state = appReducer(paired, { type: 'removeParticipant', id: 'a' })
    expect(partnerIds(state)).toEqual({ b: null, c: null })
  })

  test('clearParticipants empties the list in setup', () => {
    const paired = appReducer(setupWith([alice, bob, carol]), { type: 'setPartner', id: 'a', partnerId: 'b' })
    expect(appReducer(paired, { type: 'clearParticipants' })).toEqual(initialState)
  })

  test('participant actions are ignored outside setup', () => {
    expect(appReducer(drawn, { type: 'addParticipant', id: 'x', name: 'X' })).toBe(drawn)
    expect(appReducer(drawn, { type: 'renameParticipant', id: 'a', name: 'X' })).toBe(drawn)
    expect(appReducer(drawn, { type: 'removeParticipant', id: 'a' })).toBe(drawn)
    expect(appReducer(drawn, { type: 'setPartner', id: 'a', partnerId: 'b' })).toBe(drawn)
    expect(appReducer(drawn, { type: 'clearParticipants' })).toBe(drawn)
  })
})

describe('drawing and revealing', () => {
  test('startDraw moves to board and trims names', () => {
    const before = setupWith([{ ...alice, name: '  Alice ' }, bob])
    const state = appReducer(before, { type: 'startDraw', assignments: { a: 'b', b: 'a' } })
    expect(state.phase).toBe('board')
    expect(state.assignments).toEqual({ a: 'b', b: 'a' })
    expect(state.participants.map((person) => person.name)).toEqual(['Alice', 'Bob'])
  })

  test('startDraw is ignored outside setup', () => {
    expect(appReducer(drawn, { type: 'startDraw', assignments: { a: 'c', b: 'a', c: 'b' } })).toBe(drawn)
  })

  test('openReveal moves to reveal for that giver', () => {
    const state = appReducer(drawn, { type: 'openReveal', giverId: 'b' })
    expect(state.phase).toBe('reveal')
    expect(state.currentGiverId).toBe('b')
  })

  test('openReveal ignores already revealed givers', () => {
    const before = { ...drawn, revealedGiverIds: ['b'] }
    expect(appReducer(before, { type: 'openReveal', giverId: 'b' })).toBe(before)
  })

  test('openReveal ignores unknown givers', () => {
    expect(appReducer(drawn, { type: 'openReveal', giverId: 'zzz' })).toBe(drawn)
  })

  test('closeReveal returns to board before the reveal', () => {
    const opened = appReducer(drawn, { type: 'openReveal', giverId: 'a' })
    const state = appReducer(opened, { type: 'closeReveal' })
    expect(state.phase).toBe('board')
    expect(state.currentGiverId).toBeNull()
    expect(state.revealedGiverIds).toEqual([])
  })

  test('markRevealed is idempotent', () => {
    const opened = appReducer(drawn, { type: 'openReveal', giverId: 'a' })
    const once = appReducer(opened, { type: 'markRevealed' })
    const twice = appReducer(once, { type: 'markRevealed' })
    expect(twice.revealedGiverIds).toEqual(['a'])
    expect(twice.phase).toBe('reveal')
  })

  test('closeReveal is ignored after markRevealed', () => {
    const revealed = appReducer(appReducer(drawn, { type: 'openReveal', giverId: 'a' }), { type: 'markRevealed' })
    expect(appReducer(revealed, { type: 'closeReveal' })).toBe(revealed)
  })

  test('finishReveal goes to board when others remain', () => {
    const revealed = appReducer(appReducer(drawn, { type: 'openReveal', giverId: 'a' }), { type: 'markRevealed' })
    const state = appReducer(revealed, { type: 'finishReveal' })
    expect(state.phase).toBe('board')
    expect(state.currentGiverId).toBeNull()
  })

  test('finishReveal goes to summary when everyone is revealed', () => {
    const before: AppState = { ...drawn, phase: 'reveal', currentGiverId: 'c', revealedGiverIds: ['a', 'b', 'c'] }
    const state = appReducer(before, { type: 'finishReveal' })
    expect(state.phase).toBe('summary')
    expect(state.currentGiverId).toBeNull()
  })

  test('finishReveal is ignored before markRevealed', () => {
    const opened = appReducer(drawn, { type: 'openReveal', giverId: 'a' })
    expect(appReducer(opened, { type: 'finishReveal' })).toBe(opened)
  })

  test('restart keeps participants and couples, clears the draw', () => {
    const paired = { ...drawn, participants: [{ ...alice, partnerId: 'b' }, { ...bob, partnerId: 'a' }, carol] }
    const midway: AppState = { ...paired, phase: 'reveal', currentGiverId: 'a', revealedGiverIds: ['a'] }
    const state = appReducer(midway, { type: 'restart' })
    expect(state).toEqual({
      version: 1,
      phase: 'setup',
      participants: paired.participants,
      assignments: null,
      revealedGiverIds: [],
      currentGiverId: null,
    })
  })
})
