import type { ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { cx } from '@/lib/cx'

interface EmptyBlockProps {
  icon: IconName
  title: string
  text?: string
  action?: ReactNode
  className?: string
}

/** Panel ichidagi ixcham bo'sh holat: ikonka, sarlavha, izoh va (ixtiyoriy) birinchi amal. */
export function EmptyBlock({ icon, title, text, action, className }: EmptyBlockProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mb-1 grid size-11 place-items-center rounded-xl bg-white text-slate-500 shadow-soft ring-1 ring-slate-200/70"
      >
        <Icon name={icon} className="size-5" />
      </span>
      <p className="font-semibold text-balance text-slate-800">{title}</p>
      {text && <p className="max-w-sm text-sm text-pretty text-slate-500">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
