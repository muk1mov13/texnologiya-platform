import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/lib/cx'

const CONTROL =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-base outline-none transition ' +
  'focus:border-brand-500 aria-[invalid=true]:border-red-400 disabled:bg-slate-50'

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function Field({ id, label, error, hint, children }: FieldProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {t(error)}
        </p>
      )}
    </div>
  )
}

export function Input({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={cx(CONTROL, className)} {...rest} />
}

export function Textarea({ className, rows = 4, ...rest }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cx(CONTROL, 'resize-y', className)} {...rest} />
}

export function Select({ className, ...rest }: ComponentProps<'select'>) {
  return <select className={cx(CONTROL, 'pr-8', className)} {...rest} />
}

export function Checkbox({ label, className, ...rest }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className={cx('inline-flex items-center gap-2 text-sm font-medium', className)}>
      <input type="checkbox" className="size-4 accent-brand-500" {...rest} />
      {label}
    </label>
  )
}
