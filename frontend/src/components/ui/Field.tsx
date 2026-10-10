import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/lib/cx'

const CONTROL =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-base outline-hidden transition ' +
  'focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30 aria-[invalid=true]:border-red-400 ' +
  'aria-[invalid=true]:focus:ring-red-500/50 disabled:bg-slate-50'

interface FieldContextValue {
  describedBy?: string
  invalid: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function Field({ id, label, error, hint, children }: FieldProps) {
  const { t } = useTranslation()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = error ? errorId : hint ? hintId : undefined
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <FieldContext.Provider value={{ describedBy, invalid: Boolean(error) }}>{children}</FieldContext.Provider>
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {t(error)}
        </p>
      )}
    </div>
  )
}

export function Input({
  className,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...rest
}: ComponentProps<'input'>) {
  const field = useContext(FieldContext)
  return (
    <input
      className={cx(CONTROL, className)}
      aria-describedby={describedBy ?? field?.describedBy}
      aria-invalid={invalid ?? (field?.invalid ? true : undefined)}
      {...rest}
    />
  )
}

export function Textarea({
  className,
  rows = 4,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...rest
}: ComponentProps<'textarea'>) {
  const field = useContext(FieldContext)
  return (
    <textarea
      rows={rows}
      className={cx(CONTROL, 'resize-y', className)}
      aria-describedby={describedBy ?? field?.describedBy}
      aria-invalid={invalid ?? (field?.invalid ? true : undefined)}
      {...rest}
    />
  )
}

export function Select({
  className,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...rest
}: ComponentProps<'select'>) {
  const field = useContext(FieldContext)
  return (
    <select
      className={cx(CONTROL, 'pr-8', className)}
      aria-describedby={describedBy ?? field?.describedBy}
      aria-invalid={invalid ?? (field?.invalid ? true : undefined)}
      {...rest}
    />
  )
}

export function Checkbox({ label, className, ...rest }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className={cx('inline-flex items-center gap-2 text-sm font-medium', className)}>
      <input type="checkbox" className="size-4 accent-brand-500" {...rest} />
      {label}
    </label>
  )
}
