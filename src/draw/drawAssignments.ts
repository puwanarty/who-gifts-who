import type { Assignments, Participant } from '../types'

/** Returns a uniformly distributed number in [0, 1). */
export type RandomSource = () => number

export const cryptoRandom: RandomSource = () =>
  crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32

export type DrawFailureReason = 'too-few-participants' | 'no-valid-assignment'

export type DrawResult =
  | { ok: true; assignments: Assignments }
  | { ok: false; reason: DrawFailureReason }

// Each sample succeeds with probability of roughly 1/e² even when everyone
// is paired, so 2000 attempts practically never fall through to backtracking.
const DEFAULT_SAMPLING_ATTEMPTS = 2000

export function drawAssignments(
  participants: Participant[],
  random: RandomSource = cryptoRandom,
  maxSamplingAttempts: number = DEFAULT_SAMPLING_ATTEMPTS,
): DrawResult {
  if (participants.length < 2) return { ok: false, reason: 'too-few-participants' }

  const ids = participants.map((person) => person.id)
  const partnerOf = new Map(participants.map((person) => [person.id, person.partnerId]))
  const canGive = (giver: string, receiver: string) =>
    receiver !== giver && receiver !== partnerOf.get(giver)

  // Rejection sampling: a uniformly random permutation, kept only if valid,
  // gives every valid assignment the same probability.
  for (let attempt = 0; attempt < maxSamplingAttempts; attempt++) {
    const receivers = shuffled(ids, random)
    if (ids.every((giver, index) => canGive(giver, receivers[index]))) {
      return { ok: true, assignments: Object.fromEntries(ids.map((giver, index) => [giver, receivers[index]])) }
    }
  }

  // Exhaustive search: either finds an assignment or proves none exists.
  const givers = shuffled(ids, random)
  const used = new Set<string>()
  const assignments: Assignments = {}
  const assign = (position: number): boolean => {
    if (position === givers.length) return true
    const giver = givers[position]
    for (const receiver of shuffled(ids, random)) {
      if (used.has(receiver) || !canGive(giver, receiver)) continue
      used.add(receiver)
      assignments[giver] = receiver
      if (assign(position + 1)) return true
      used.delete(receiver)
      delete assignments[giver]
    }
    return false
  }
  return assign(0) ? { ok: true, assignments } : { ok: false, reason: 'no-valid-assignment' }
}

export function isValidAssignment(participants: Participant[], assignments: Assignments): boolean {
  const ids = new Set(participants.map((person) => person.id))
  const givers = Object.keys(assignments)
  if (givers.length !== ids.size || !givers.every((giver) => ids.has(giver))) return false

  const receivers = new Set(Object.values(assignments))
  if (receivers.size !== ids.size || ![...receivers].every((receiver) => ids.has(receiver))) return false

  return participants.every((person) => {
    const receiver = assignments[person.id]
    return receiver !== person.id && receiver !== person.partnerId
  })
}

function shuffled<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}
