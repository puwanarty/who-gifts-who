// Kept apart from the draw state so a mute choice survives "ล้างรายชื่อทั้งหมด" and restarts.
export const MUTED_KEY = 'who-gifts-who:muted'

// The default storage is resolved inside try: in some browsers merely reading
// `localStorage` throws (site data blocked, sandboxed frames).
export function loadMuted(storage?: Pick<Storage, 'getItem'>): boolean {
  try {
    return (storage ?? globalThis.localStorage).getItem(MUTED_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveMuted(muted: boolean, storage?: Pick<Storage, 'setItem'>): void {
  try {
    ;(storage ?? globalThis.localStorage).setItem(MUTED_KEY, String(muted))
  } catch {
    // Without storage the choice lasts until the page reloads.
  }
}
