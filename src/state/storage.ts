import { isValidAssignment } from '../draw/drawAssignments'
import type { AppState, Participant, Phase } from '../types'
import { initialState } from './appReducer'

// All GitHub Pages project sites of one user share an origin, so the key is namespaced.
export const STORAGE_KEY = 'who-gifts-who:state:v1'

const PHASES: readonly Phase[] = ['setup', 'board', 'reveal', 'summary']

export function loadState(storage: Pick<Storage, 'getItem'> = globalThis.localStorage): AppState {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return initialState
    return parseState(JSON.parse(raw)) ?? initialState
  } catch {
    return initialState
  }
}

export function saveState(state: AppState, storage: Pick<Storage, 'setItem'> = globalThis.localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable (private mode, quota); the app keeps working in memory.
  }
}

function parseState(value: unknown): AppState | null {
  if (!isRecord(value) || value.version !== 1) return null
  const { phase, participants, assignments, revealedGiverIds, currentGiverId } = value

  if (typeof phase !== 'string' || !PHASES.includes(phase as Phase)) return null
  if (!Array.isArray(participants) || !participants.every(isParticipant)) return null
  if (!Array.isArray(revealedGiverIds) || !revealedGiverIds.every((id) => typeof id === 'string')) return null
  if (currentGiverId !== null && typeof currentGiverId !== 'string') return null

  const ids = new Set(participants.map((person) => person.id))
  if (!revealedGiverIds.every((id) => ids.has(id))) return null

  if (assignments === null) {
    if (phase !== 'setup') return null
  } else if (!isStringRecord(assignments) || !isValidAssignment(participants, assignments)) {
    return null
  }

  const state: AppState = {
    version: 1,
    phase: phase as Phase,
    participants,
    assignments,
    revealedGiverIds,
    currentGiverId,
  }
  if (state.phase === 'reveal' && (currentGiverId === null || !ids.has(currentGiverId))) {
    return { ...state, phase: 'board', currentGiverId: null }
  }
  return state
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string')
}

function isParticipant(value: unknown): value is Participant {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.partnerId === null || typeof value.partnerId === 'string')
  )
}
