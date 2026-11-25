import { BoardScreen } from './screens/BoardScreen'
import { SetupScreen } from './screens/SetupScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { useAppState } from './state/AppStateContext'

export default function App() {
  const { state } = useAppState()

  switch (state.phase) {
    case 'setup':
      return <SetupScreen />
    case 'board':
      return <BoardScreen />
    case 'reveal':
      return <TemporaryReveal />
    case 'summary':
      return <SummaryScreen />
  }
}

// Stand-in until the gift-box reveal screen exists.
function TemporaryReveal() {
  const { dispatch } = useAppState()
  return (
    <main>
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'markRevealed' })
          dispatch({ type: 'finishReveal' })
        }}
      >
        reveal
      </button>
    </main>
  )
}
