export type Participant = { id: string; name: string; partnerId: string | null }

export type Phase = 'setup' | 'board' | 'reveal' | 'summary'

/** giverId -> receiverId */
export type Assignments = Record<string, string>

export type AppState = {
  version: 1
  phase: Phase
  participants: Participant[]
  assignments: Assignments | null
  revealedGiverIds: string[]
  currentGiverId: string | null
}
