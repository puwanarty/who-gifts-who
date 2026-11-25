import { expect, test } from 'vitest'
import type { Participant } from '../types'
import { validateParticipants } from './validateParticipants'

function person(id: string, name: string): Participant {
  return { id, name, partnerId: null }
}

test('too-few for zero and one participant', () => {
  expect(validateParticipants([])).toEqual([{ kind: 'too-few' }])
  expect(validateParticipants([person('a', 'บอส')])).toEqual([{ kind: 'too-few' }])
})

test('empty-name for a blank name', () => {
  expect(validateParticipants([person('a', 'บอส'), person('b', '   ')])).toEqual([{ kind: 'empty-name', id: 'b' }])
})

test('duplicate-name ignores surrounding whitespace', () => {
  expect(validateParticipants([person('a', 'บอส'), person('b', 'บอส '), person('c', 'มายด์')])).toEqual([
    { kind: 'duplicate-name', name: 'บอส', ids: ['a', 'b'] },
  ])
})

test('blank names are not reported as duplicates of each other', () => {
  expect(validateParticipants([person('a', ''), person('b', ' '), person('c', 'มายด์')])).toEqual([
    { kind: 'empty-name', id: 'a' },
    { kind: 'empty-name', id: 'b' },
  ])
})

test('no problems for two distinct names', () => {
  expect(validateParticipants([person('a', 'บอส'), person('b', 'มายด์')])).toEqual([])
})
