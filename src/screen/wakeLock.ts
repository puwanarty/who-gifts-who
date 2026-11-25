interface ScreenLock {
  release(): Promise<void>
}

export interface WakeLockEnvironment {
  navigator: { wakeLock?: { request(type: 'screen'): Promise<ScreenLock> } }
  document: {
    visibilityState: DocumentVisibilityState
    addEventListener(type: 'visibilitychange', listener: () => void): void
    removeEventListener(type: 'visibilitychange', listener: () => void): void
  }
}

/**
 * Keeps the display on while the app is open, so a laptop driving the party TV does not dim
 * between turns. Returns a function that lets the screen sleep again.
 */
export function keepScreenAwake(
  environment: WakeLockEnvironment = { navigator: globalThis.navigator, document: globalThis.document },
): () => void {
  const wakeLock = environment.navigator.wakeLock
  if (!wakeLock) return () => {}

  let stopped = false
  let lock: ScreenLock | null = null

  const request = () => {
    if (environment.document.visibilityState !== 'visible') return
    wakeLock.request('screen').then(
      (granted) => {
        if (stopped) void granted.release()
        else lock = granted
      },
      // Refused (battery saver, no permission): the screen just follows the system setting.
      () => {},
    )
  }

  // The browser drops the lock whenever the tab is hidden, so it is taken again on return.
  environment.document.addEventListener('visibilitychange', request)
  request()

  return () => {
    stopped = true
    environment.document.removeEventListener('visibilitychange', request)
    void lock?.release().catch(() => {})
    lock = null
  }
}
