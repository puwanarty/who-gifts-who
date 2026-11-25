import { useEffect } from 'react'
import { ScreenControls } from './components/ScreenControls'
import { keepScreenAwake } from './screen/wakeLock'
import { BoardScreen } from './screens/BoardScreen'
import { RevealScreen } from './screens/RevealScreen'
import { SetupScreen } from './screens/SetupScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { useAppState } from './state/AppStateContext'

export default function App() {
  useEffect(() => keepScreenAwake(), [])

  return (
    <>
      <ScreenControls />
      <CurrentScreen />
    </>
  )
}

function CurrentScreen() {
  const { state } = useAppState()

  switch (state.phase) {
    case 'setup':
      return <SetupScreen />
    case 'board':
      return <BoardScreen />
    case 'reveal':
      return <RevealScreen key={state.currentGiverId} />
    case 'summary':
      return <SummaryScreen />
  }
}
