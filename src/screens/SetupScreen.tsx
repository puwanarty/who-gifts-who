import { useRef, useState, type KeyboardEvent } from 'react'
import { drawAssignments } from '../draw/drawAssignments'
import { useAppState } from '../state/AppStateContext'
import { validateParticipants, type SetupProblem } from '../state/validateParticipants'
import type { Participant } from '../types'
import './SetupScreen.css'

const NO_PARTNER = ''

export function SetupScreen() {
  const { state, dispatch } = useAppState()
  const { participants } = state
  const [messages, setMessages] = useState<string[]>([])
  // The row for a newly added person mounts on the next render; its input focuses itself then.
  const idToFocus = useRef<string | null>(null)

  function addPerson() {
    const id = crypto.randomUUID()
    dispatch({ type: 'addParticipant', id, name: '' })
    idToFocus.current = id
    setMessages([])
  }

  function onNameKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    // Enter on the last row adds the next person, so a long list can be typed without the mouse.
    if (event.key === 'Enter' && !event.nativeEvent.isComposing && index === participants.length - 1) {
      event.preventDefault()
      addPerson()
    }
  }

  function startDraw() {
    const problems = validateParticipants(participants)
    if (problems.length > 0) {
      setMessages(problems.map(describeProblem).filter((text, index, all) => all.indexOf(text) === index))
      return
    }
    const result = drawAssignments(participants)
    if (!result.ok) {
      setMessages([
        result.reason === 'too-few-participants'
          ? 'ต้องมีอย่างน้อย 2 คน'
          : 'จับฉลากแบบนี้ไม่ได้ เพราะคนที่มาเป็นคู่กันต้องไม่จับได้กันเอง ลองเพิ่มคนอีกอย่างน้อย 1 คน หรือแก้การจับคู่',
      ])
      return
    }
    dispatch({ type: 'startDraw', assignments: result.assignments })
  }

  return (
    <main className="setup">
      <div className="setup-sheet">
        <header className="setup-header">
          <h1>ใครมาบ้าง</h1>
          <p className="setup-count">{participants.length} คน</p>
        </header>

        {participants.length === 0 ? (
          <p className="setup-empty">ยังไม่มีใครในรายชื่อ เพิ่มชื่อทุกคนที่มางาน แล้วเลือกคู่ให้คนที่มาด้วยกัน</p>
        ) : (
          <ol className="setup-list">
            {participants.map((person, index) => (
              <li key={person.id} className="setup-row">
                <input
                  ref={(element) => {
                    if (element && idToFocus.current === person.id) {
                      idToFocus.current = null
                      element.focus()
                    }
                  }}
                  className="setup-name"
                  type="text"
                  value={person.name}
                  placeholder="ชื่อ"
                  aria-label={`ชื่อคนที่ ${index + 1}`}
                  autoComplete="off"
                  enterKeyHint="next"
                  onChange={(event) => {
                    dispatch({ type: 'renameParticipant', id: person.id, name: event.target.value })
                    setMessages([])
                  }}
                  onKeyDown={(event) => onNameKeyDown(event, index)}
                />
                <label className="setup-partner">
                  <span className="setup-partner-label">คู่กับ</span>
                  <select
                    value={person.partnerId ?? NO_PARTNER}
                    aria-label={`คู่ของ${displayName(person, index)}`}
                    onChange={(event) => {
                      const partnerId = event.target.value === NO_PARTNER ? null : event.target.value
                      dispatch({ type: 'setPartner', id: person.id, partnerId })
                      setMessages([])
                    }}
                  >
                    <option value={NO_PARTNER}>ไม่มีคู่</option>
                    {partnerOptions(participants, person).map(({ candidate, position }) => (
                      <option key={candidate.id} value={candidate.id}>
                        {displayName(candidate, position)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="setup-remove"
                  aria-label={`ลบ${displayName(person, index)}`}
                  onClick={() => {
                    dispatch({ type: 'removeParticipant', id: person.id })
                    setMessages([])
                  }}
                >
                  ลบ
                </button>
              </li>
            ))}
          </ol>
        )}

        <button type="button" className="setup-add" onClick={addPerson}>
          + เพิ่มคน
        </button>

        {messages.length > 0 && (
          <div className="setup-messages" role="alert">
            {messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <button type="button" className="setup-start" onClick={startDraw}>
          เริ่มจับฉลาก
        </button>

        <p className="setup-note">ข้อมูลเก็บไว้ในเบราว์เซอร์นี้ ใช้เครื่องและเบราว์เซอร์เดิมตั้งแต่กรอกชื่อจนจบงาน</p>
      </div>
    </main>
  )
}

function displayName(person: Participant, index: number): string {
  return person.name.trim() || `คนที่ ${index + 1}`
}

/** Everyone else who is free, plus this person's current partner. */
function partnerOptions(participants: Participant[], person: Participant) {
  return participants
    .map((candidate, position) => ({ candidate, position }))
    .filter(
      ({ candidate }) =>
        candidate.id !== person.id && (candidate.partnerId === null || candidate.partnerId === person.id),
    )
}

function describeProblem(problem: SetupProblem): string {
  switch (problem.kind) {
    case 'too-few':
      return 'ต้องมีอย่างน้อย 2 คน'
    case 'empty-name':
      return 'ใส่ชื่อให้ครบทุกช่อง'
    case 'duplicate-name':
      return `มีชื่อซ้ำกัน: ${problem.name}`
  }
}
