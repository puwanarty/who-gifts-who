import { describe, expect, test } from 'vitest'
import { drumrollHitTimes } from './drumroll'

describe('drumrollHitTimes', () => {
  const duration = 2.4
  const times = drumrollHitTimes(duration)

  test('starts at once and stays inside the shake', () => {
    expect(times[0]).toBe(0)
    expect(times.every((time) => time >= 0 && time < duration)).toBe(true)
  })

  test('hits are in order', () => {
    expect(times.every((time, index) => index === 0 || time > times[index - 1])).toBe(true)
  })

  test('the roll speeds up towards the reveal', () => {
    const countIn = (from: number, to: number) => times.filter((time) => time >= from && time < to).length
    expect(countIn(duration * 0.75, duration)).toBeGreaterThan(countIn(0, duration * 0.25) * 1.5)
  })

  test('a zero-length roll has no hits', () => {
    expect(drumrollHitTimes(0)).toEqual([])
  })
})
