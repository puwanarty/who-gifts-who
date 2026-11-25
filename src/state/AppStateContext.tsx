import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import type { AppState } from '../types'
import { appReducer, type AppAction } from './appReducer'
import { loadState, saveState } from './storage'

type AppStateContextValue = { state: AppState; dispatch: Dispatch<AppAction> }

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  return <AppStateContext value={{ state, dispatch }}>{children}</AppStateContext>
}

// oxlint-disable-next-line react/only-export-components -- the hook belongs with its provider
export function useAppState(): AppStateContextValue {
  const value = useContext(AppStateContext)
  if (value === null) throw new Error('useAppState must be used inside <AppStateProvider>')
  return value
}
