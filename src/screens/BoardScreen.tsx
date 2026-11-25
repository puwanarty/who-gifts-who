import { RestartButton } from '../components/RestartButton'
import { useAppState } from '../state/AppStateContext'
import './BoardScreen.css'

export function BoardScreen() {
  const { state, dispatch } = useAppState()
  const waiting = state.participants.filter((person) => !state.revealedGiverIds.includes(person.id))
  const done = state.participants.filter((person) => state.revealedGiverIds.includes(person.id))

  return (
    <main className="board">
      <RestartButton />
      <h1 className="board-title">
        <span>ใครยังไม่ได้จับ</span> <span>แตะชื่อตัวเองเลย</span>
      </h1>
      <ul className="board-tags">
        {waiting.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              className="board-tag"
              onClick={() => dispatch({ type: 'openReveal', giverId: person.id })}
            >
              {person.name}
            </button>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <section className="board-done" aria-labelledby="board-done-title">
          <h2 id="board-done-title">จับแล้ว</h2>
          <ul>
            {done.map((person) => (
              <li key={person.id}>{person.name}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
