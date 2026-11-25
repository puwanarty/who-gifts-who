import { expect, test } from 'vitest'
import type { AppState } from '../types'
import { initialState } from './appReducer'
import { loadState, saveState, STORAGE_KEY } from './storage'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value
    },
  }
}

const saved: AppState = {
  version: 1,
  phase: 'board',
  participants: [
    { id: 'a', name: 'บอส', partnerId: 'b' },
    { id: 'b', name: 'มายด์', partnerId: 'a' },
    { id: 'c', name: 'แพรว', partnerId: null },
    { id: 'd', name: 'กอล์ฟ', partnerId: null },
  ],
  assignments: { a: 'c', b: 'd', c: 'a', d: 'b' },
  revealedGiverIds: ['a'],
  currentGiverId: null,
}

test('round-trip returns the saved state', () => {
  const storage = memoryStorage()
  saveState(saved, storage)
  expect(Object.keys(storage.data)).toEqual([STORAGE_KEY])
  expect(loadState(storage)).toEqual(saved)
})

test('missing key gives the initial state', () => {
  expect(loadState(memoryStorage())).toEqual(initialState)
})

test('invalid JSON gives the initial state', () => {
  expect(loadState(memoryStorage({ [STORAGE_KEY]: '{oops' }))).toEqual(initialState)
})

test('getItem throwing gives the initial state', () => {
  const storage = {
    getItem: () => {
      throw new Error('SecurityError')
    },
  }
  expect(loadState(storage)).toEqual(initialState)
})

test('setItem throwing does not throw', () => {
  const storage = {
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }
  expect(() => saveState(saved, storage)).not.toThrow()
})

test('another version gives the initial state', () => {
  const stored = JSON.stringify({ ...saved, version: 2 })
  expect(loadState(memoryStorage({ [STORAGE_KEY]: stored }))).toEqual(initialState)
})

test('a wrongly shaped value gives the initial state', () => {
  const stored = JSON.stringify({ version: 1, phase: 'board', participants: 'nope' })
  expect(loadState(memoryStorage({ [STORAGE_KEY]: stored }))).toEqual(initialState)
  expect(loadState(memoryStorage({ [STORAGE_KEY]: 'null' }))).toEqual(initialState)
})

test('assignments referencing an unknown participant give the initial state', () => {
  const stored = JSON.stringify({ ...saved, assignments: { a: 'c', b: 'd', c: 'a', d: 'zzz' } })
  expect(loadState(memoryStorage({ [STORAGE_KEY]: stored }))).toEqual(initialState)
})

test('board without assignments gives the initial state', () => {
  const stored = JSON.stringify({ ...saved, assignments: null })
  expect(loadState(memoryStorage({ [STORAGE_KEY]: stored }))).toEqual(initialState)
})

test('reveal without a current giver is normalized to board', () => {
  const stored = JSON.stringify({ ...saved, phase: 'reveal', currentGiverId: null })
  expect(loadState(memoryStorage({ [STORAGE_KEY]: stored }))).toEqual({ ...saved, phase: 'board' })
})

test('reveal with an unknown current giver is normalized to board', () => {
  const stored = JSON.stringify({ ...saved, phase: 'reveal', currentGiverId: 'zzz' })
  expect(loadState(memoryStorage({ [STORAGE_KEY]: stored }))).toEqual({ ...saved, phase: 'board' })
})
