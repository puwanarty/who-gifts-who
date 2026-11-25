import { RestartButton } from '../components/RestartButton'
import { useAppState } from '../state/AppStateContext'
import './SummaryScreen.css'

export function SummaryScreen() {
  const { state } = useAppState()
  const nameOf = new Map(state.participants.map((person) => [person.id, person.name]))

  return (
    <main className="summary">
      <RestartButton />
      <h1 className="summary-title">สรุปว่าใครซื้อของขวัญให้ใคร</h1>
      <ol className="summary-list">
        {state.participants.map((person) => (
          <li key={person.id} className="summary-row">
            <span className="summary-giver">{person.name}</span>
            <span className="summary-arrow" aria-label="ซื้อของขวัญให้">
              →
            </span>
            <span className="summary-receiver">{nameOf.get(state.assignments?.[person.id] ?? '')}</span>
          </li>
        ))}
      </ol>
    </main>
  )
}
