import { afterEach, describe, expect, test } from 'vitest'
import { loadMuted, MUTED_KEY, saveMuted } from './soundPreference'

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

const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

afterEach(() => {
  if (originalLocalStorage) Object.defineProperty(globalThis, 'localStorage', originalLocalStorage)
  else delete (globalThis as { localStorage?: unknown }).localStorage
})

describe('mute preference', () => {
  test('sound is on when nothing is saved', () => {
    expect(loadMuted(memoryStorage())).toBe(false)
  })

  test('a saved choice round-trips', () => {
    const storage = memoryStorage()
    saveMuted(true, storage)
    expect(storage.data[MUTED_KEY]).toBeDefined()
    expect(loadMuted(storage)).toBe(true)
    saveMuted(false, storage)
    expect(loadMuted(storage)).toBe(false)
  })

  test('an unreadable value means sound on', () => {
    expect(loadMuted(memoryStorage({ [MUTED_KEY]: 'garbage' }))).toBe(false)
  })

  test('blocked storage means sound on and saving does not throw', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError')
      },
    })
    expect(loadMuted()).toBe(false)
    expect(() => saveMuted(true)).not.toThrow()
  })
})
