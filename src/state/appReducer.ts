import type { AppState, Assignments, Participant } from '../types'

export const initialState: AppState = {
  version: 1,
  phase: 'setup',
  participants: [],
  assignments: null,
  revealedGiverIds: [],
  currentGiverId: null,
}

export type AppAction =
  | { type: 'addParticipant'; id: string; name: string }
  | { type: 'renameParticipant'; id: string; name: string }
  | { type: 'removeParticipant'; id: string }
  | { type: 'setPartner'; id: string; partnerId: string | null }
  | { type: 'clearParticipants' }
  | { type: 'startDraw'; assignments: Assignments }
  | { type: 'openReveal'; giverId: string }
  | { type: 'closeReveal' }
  | { type: 'markRevealed' }
  | { type: 'finishReveal' }
  | { type: 'restart' }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'addParticipant':
      if (state.phase !== 'setup') return state
      return {
        ...state,
        participants: [...state.participants, { id: action.id, name: action.name, partnerId: null }],
      }

    case 'renameParticipant':
      if (state.phase !== 'setup') return state
      return {
        ...state,
        participants: state.participants.map((person) =>
          person.id === action.id ? { ...person, name: action.name } : person,
        ),
      }

    case 'removeParticipant':
      if (state.phase !== 'setup') return state
      return {
        ...state,
        participants: state.participants
          .filter((person) => person.id !== action.id)
          .map((person) => (person.partnerId === action.id ? { ...person, partnerId: null } : person)),
      }

    case 'setPartner':
      if (state.phase !== 'setup' || action.partnerId === action.id) return state
      return { ...state, participants: linkPartners(state.participants, action.id, action.partnerId) }

    case 'clearParticipants':
      if (state.phase !== 'setup') return state
      return initialState

    case 'startDraw':
      if (state.phase !== 'setup') return state
      return {
        ...state,
        phase: 'board',
        participants: state.participants.map((person) => ({ ...person, name: person.name.trim() })),
        assignments: action.assignments,
        revealedGiverIds: [],
        currentGiverId: null,
      }

    case 'openReveal': {
      const isKnown = state.participants.some((person) => person.id === action.giverId)
      if (state.phase !== 'board' || !isKnown || state.revealedGiverIds.includes(action.giverId)) return state
      return { ...state, phase: 'reveal', currentGiverId: action.giverId }
    }

    case 'closeReveal':
      if (state.phase !== 'reveal' || isCurrentRevealed(state)) return state
      return { ...state, phase: 'board', currentGiverId: null }

    case 'markRevealed':
      if (state.phase !== 'reveal' || state.currentGiverId === null || isCurrentRevealed(state)) return state
      return { ...state, revealedGiverIds: [...state.revealedGiverIds, state.currentGiverId] }

    case 'finishReveal': {
      if (state.phase !== 'reveal' || !isCurrentRevealed(state)) return state
      const everyoneRevealed = state.participants.every((person) => state.revealedGiverIds.includes(person.id))
      return { ...state, phase: everyoneRevealed ? 'summary' : 'board', currentGiverId: null }
    }

    case 'restart':
      return { ...initialState, participants: state.participants }
  }
}

function isCurrentRevealed(state: AppState): boolean {
  return state.currentGiverId !== null && state.revealedGiverIds.includes(state.currentGiverId)
}

/** Links `id` with `partnerId` (or unlinks when null), first freeing both people from any previous partner. */
function linkPartners(participants: Participant[], id: string, partnerId: string | null): Participant[] {
  const affected = new Set<string>([id])
  if (partnerId !== null) affected.add(partnerId)
  for (const person of participants) {
    if (affected.has(person.id) && person.partnerId !== null) affected.add(person.partnerId)
  }
  return participants.map((person) => {
    if (person.id === id) return { ...person, partnerId }
    if (person.id === partnerId) return { ...person, partnerId: id }
    if (affected.has(person.id)) return { ...person, partnerId: null }
    return person
  })
}
