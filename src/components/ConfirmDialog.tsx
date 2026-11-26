import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type SyntheticEvent } from 'react'
import './ConfirmDialog.css'

type ConfirmDialogProps = {
  open: boolean
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Replaces window.confirm, which drops the browser out of fullscreen mid-party.
 * showModal() puts the dialog in the top layer, so it shows in fullscreen and makes the page behind it inert.
 */
export function ConfirmDialog({ open, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // A stray clicker press (Space/Enter) must cancel, never confirm, so focus starts on cancel.
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Escape: let React state, not the browser, decide when the dialog closes.
  function onNativeCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    onCancel()
  }

  // The dialog has no padding and the card fills it, so a click that lands on the dialog itself is on the backdrop.
  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onCancel()
  }

  // A click on the card's text moves focus to the dialog itself. Space/Enter there must still cancel, and must not
  // bubble to window, where RevealScreen's clicker handler would start a reveal behind the dialog.
  function onDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget || (event.key !== ' ' && event.key !== 'Enter')) return
    event.preventDefault()
    event.stopPropagation()
    onCancel()
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      onCancel={onNativeCancel}
      onClick={onDialogClick}
      onKeyDown={onDialogKeyDown}
    >
      <div className="confirm-dialog-card">
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button ref={cancelRef} type="button" className="confirm-dialog-cancel" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className="confirm-dialog-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
