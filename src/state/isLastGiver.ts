import type { AppState } from '../types'

/**
 * True when every other participant has already revealed. Derived rather than stored, so it
 * holds both before and after the giver is marked revealed and survives a refresh.
 */
export function isLastGiver(state: Pick<AppState, 'participants' | 'revealedGiverIds'>, giverId: string): boolean {
  if (!state.participants.some((person) => person.id === giverId)) return false
  return state.participants.every((person) => person.id === giverId || state.revealedGiverIds.includes(person.id))
}
