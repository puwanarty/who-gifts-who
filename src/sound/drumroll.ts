// Seconds between hits at the start and at the end of the roll.
const FIRST_GAP = 0.11
const LAST_GAP = 0.035

/** Hit times in seconds from the roll's start; the gaps shrink so the roll speeds up into the reveal. */
export function drumrollHitTimes(durationSeconds: number): number[] {
  const times: number[] = []
  for (let time = 0; time < durationSeconds; ) {
    times.push(time)
    const progress = time / durationSeconds
    time += FIRST_GAP + (LAST_GAP - FIRST_GAP) * progress
  }
  return times
}
