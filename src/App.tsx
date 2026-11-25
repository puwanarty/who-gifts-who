import { SetupScreen } from './screens/SetupScreen'
import { useAppState } from './state/AppStateContext'

export default function App() {
  const { state } = useAppState()

  switch (state.phase) {
    case 'setup':
      return <SetupScreen />
    case 'board':
    case 'reveal':
    case 'summary':
      // Placeholder until the board, reveal and summary screens exist.
      return <main>{state.phase}</main>
  }
}
