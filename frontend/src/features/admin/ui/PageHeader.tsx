import type { ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  /** Sarlavha ustidagi kichik yorliq (odatda menyu guruhi). */
  eyebrow?: string
  icon?: IconName
  /** O'ng tomondagi amallar (tugmalar). */
  actions?: ReactNode
}

/** Admin sahifasining sarlavhasi: ikonka, eyebrow, sarlavha, izoh va amallar. */
export function PageHeader({ title, subtitle, eyebrow, icon, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 items-start gap-4">
        {icon && (
          <span
            aria-hidden="true"
            className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-white to-brand-50 text-brand-700 shadow-soft ring-1 ring-brand-200/60 sm:grid"
          >
            <Icon name={icon} className="size-6" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-xs font-bold tracking-[0.14em] text-brand-700 uppercase">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-[1.9rem] sm:leading-tight">
            {title}
          </h1>
          {subtitle && <p className="mt-1 max-w-2xl text-pretty text-slate-600">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
