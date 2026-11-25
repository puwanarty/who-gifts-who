import type { Participant } from '../types'

export type SetupProblem =
  | { kind: 'too-few' }
  | { kind: 'empty-name'; id: string }
  | { kind: 'duplicate-name'; name: string; ids: string[] }

export function validateParticipants(participants: Participant[]): SetupProblem[] {
  const problems: SetupProblem[] = []
  if (participants.length < 2) problems.push({ kind: 'too-few' })

  const idsByName = new Map<string, string[]>()
  for (const person of participants) {
    const name = person.name.trim()
    if (name === '') {
      problems.push({ kind: 'empty-name', id: person.id })
      continue
    }
    idsByName.set(name, [...(idsByName.get(name) ?? []), person.id])
  }
  for (const [name, ids] of idsByName) {
    if (ids.length > 1) problems.push({ kind: 'duplicate-name', name, ids })
  }
  return problems
}
