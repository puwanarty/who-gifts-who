import { useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { ConfirmDialog } from './ConfirmDialog'
import { releaseFocus } from './releaseFocus'
import './RestartButton.css'

export function RestartButton() {
  const { dispatch } = useAppState()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <button type="button" className="restart-button" onClick={(event) => releaseFocus(event, () => setConfirming(true))}>
        เริ่มใหม่
      </button>
      <ConfirmDialog
        open={confirming}
        message="ล้างผลจับฉลากทั้งหมดแล้วกลับไปหน้าตั้งค่า? รายชื่อและคู่ยังอยู่"
        confirmLabel="เริ่มใหม่"
        onConfirm={() => dispatch({ type: 'restart' })}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
