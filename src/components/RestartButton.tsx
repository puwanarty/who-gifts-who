import { useAppState } from '../state/AppStateContext'
import './RestartButton.css'

export function RestartButton() {
  const { dispatch } = useAppState()

  function restart() {
    if (window.confirm('ล้างผลจับฉลากทั้งหมดแล้วกลับไปหน้าตั้งค่า? รายชื่อและคู่ยังอยู่')) {
      dispatch({ type: 'restart' })
    }
  }

  return (
    <button type="button" className="restart-button" onClick={restart}>
      เริ่มใหม่
    </button>
  )
}
