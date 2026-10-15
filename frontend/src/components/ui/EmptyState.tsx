import type { ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'
import { isIconName, type IconName } from '@/components/icons/paths'

interface EmptyStateProps {
  /** SVG ikonka nomi yoki (eski sahifalarda) emoji. */
  icon?: IconName | (string & {})
  title: string
  text?: string
  action?: ReactNode
}

export function EmptyState({ icon = 'folder', title, text, action }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl bg-white px-6 py-14 text-center shadow-soft ring-1 ring-slate-200/70">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(45_212_191/0.12),transparent)]"
      />
      <span
        aria-hidden="true"
        className="relative grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-3xl text-brand-700 ring-1 ring-brand-200/60"
      >
        {isIconName(icon) ? <Icon name={icon} className="size-7" /> : icon}
      </span>
      <h2 className="relative text-lg font-bold tracking-tight text-balance text-slate-900">{title}</h2>
      {text && <p className="relative max-w-md text-pretty text-slate-600">{text}</p>}
      {action && <div className="relative mt-2">{action}</div>}
    </div>
  )
}
