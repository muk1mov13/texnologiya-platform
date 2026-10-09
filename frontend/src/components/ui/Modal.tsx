import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  describedBy?: string
}

const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

function getFocusable(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.matches(':disabled'),
  )
}

export function Modal({ open, title, onClose, children, footer, describedBy }: ModalProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const firstField = panel?.querySelector<HTMLElement>(
      'input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])',
    )
    const firstButton = panel?.querySelector<HTMLElement>('button:not([disabled])')
    const initial = firstField ?? firstButton ?? panel
    initial?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const node = panelRef.current
      if (!node) return
      const focusable = getFocusable(node)
      if (focusable.length === 0) {
        event.preventDefault()
        node.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg px-2 text-xl leading-none text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  text: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  pending?: boolean
}

export function ConfirmDialog({ open, title, text, confirmLabel, onConfirm, onCancel, pending }: ConfirmDialogProps) {
  const { t } = useTranslation()
  const textId = useId()
  return (
    <Modal
      open={open}
      title={title}
      onClose={pending ? () => {} : onCancel}
      describedBy={textId}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p id={textId} className="text-slate-700">
        {text}
      </p>
    </Modal>
  )
}
