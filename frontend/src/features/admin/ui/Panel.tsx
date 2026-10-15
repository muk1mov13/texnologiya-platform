import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

interface PanelProps {
  title?: string
  description?: ReactNode
  actions?: ReactNode
  /** `flush` — ichki bo'shliqsiz (ro'yxat va jadvallar chetgacha boradi). */
  flush?: boolean
  className?: string
  children: ReactNode
}

/** Admin sahifalaridagi bo'lim kartasi: sarlavha qatori va tarkib. */
export function Panel({ title, description, actions, flush = false, className, children }: PanelProps) {
  const hasHead = Boolean(title || actions)
  return (
    <section className={cx('overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70', className)}>
      {hasHead && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="font-bold tracking-tight text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-pretty text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cx(!flush && 'p-5 sm:p-6')}>{children}</div>
    </section>
  )
}
