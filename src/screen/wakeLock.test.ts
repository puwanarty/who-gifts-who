import { describe, expect, test } from 'vitest'
import { keepScreenAwake, type WakeLockEnvironment } from './wakeLock'

function fakeEnvironment({ supported = true, rejects = false } = {}) {
  const listeners = new Set<() => void>()
  const locks: { released: boolean }[] = []
  let settle: (() => void)[] = []
  const environment = {
    navigator: supported
      ? {
          wakeLock: {
            request: (type: 'screen') => {
              expect(type).toBe('screen')
              if (rejects) return Promise.reject(new Error('NotAllowedError'))
              const lock = { released: false, release: async () => void (lock.released = true) }
              locks.push(lock)
              return new Promise<typeof lock>((resolve) => settle.push(() => resolve(lock)))
            },
          },
        }
      : {},
    document: {
      visibilityState: 'visible' as DocumentVisibilityState,
      addEventListener: (_type: 'visibilitychange', listener: () => void) => void listeners.add(listener),
      removeEventListener: (_type: 'visibilitychange', listener: () => void) => void listeners.delete(listener),
    },
  } satisfies WakeLockEnvironment
  return {
    environment,
    locks,
    listeners,
    async grantPending() {
      const pending = settle
      settle = []
      pending.forEach((resolve) => resolve())
      await Promise.resolve()
      await Promise.resolve()
    },
    async becomeVisible(state: DocumentVisibilityState) {
      environment.document.visibilityState = state
      listeners.forEach((listener) => listener())
      await Promise.resolve()
    },
  }
}

describe('keepScreenAwake', () => {
  test('requests a screen lock on start', async () => {
    const fake = fakeEnvironment()
    keepScreenAwake(fake.environment)
    await fake.grantPending()
    expect(fake.locks).toHaveLength(1)
  })

  test('requests again when the page becomes visible after being hidden', async () => {
    const fake = fakeEnvironment()
    keepScreenAwake(fake.environment)
    await fake.grantPending()
    await fake.becomeVisible('hidden')
    expect(fake.locks).toHaveLength(1)
    await fake.becomeVisible('visible')
    await fake.grantPending()
    expect(fake.locks).toHaveLength(2)
  })

  test('stop releases the lock and stops listening', async () => {
    const fake = fakeEnvironment()
    const stop = keepScreenAwake(fake.environment)
    await fake.grantPending()
    stop()
    await Promise.resolve()
    expect(fake.locks[0].released).toBe(true)
    expect(fake.listeners.size).toBe(0)
  })

  test('a lock granted after stop is released at once', async () => {
    const fake = fakeEnvironment()
    const stop = keepScreenAwake(fake.environment)
    stop()
    await fake.grantPending()
    expect(fake.locks[0].released).toBe(true)
  })

  test('does nothing where wake lock is unsupported', () => {
    const fake = fakeEnvironment({ supported: false })
    const stop = keepScreenAwake(fake.environment)
    expect(fake.listeners.size).toBe(0)
    expect(stop).not.toThrow()
  })

  test('a refused request is ignored', async () => {
    const fake = fakeEnvironment({ rejects: true })
    const stop = keepScreenAwake(fake.environment)
    await fake.grantPending()
    expect(stop).not.toThrow()
  })
})
