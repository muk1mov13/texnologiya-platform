import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/lib/cx'
import { dismissToast, getToasts, subscribeToasts, type ToastKind } from './toast-store'

const KIND_CLASSES: Record<ToastKind, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-brand-200 bg-brand-50 text-brand-900',
}

export function Toaster() {
  const { t } = useTranslation()
  const toasts = useSyncExternalStore(subscribeToasts, getToasts)
  return (
    <div aria-live="polite" className="fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:left-auto sm:items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          className={cx('flex w-full max-w-sm items-start gap-3 rounded-xl border-2 px-4 py-3 shadow-lg', KIND_CLASSES[toast.kind])}
        >
          <p className="flex-1 text-sm font-medium">{toast.text}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label={t('common.close')}
            className="text-lg leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
