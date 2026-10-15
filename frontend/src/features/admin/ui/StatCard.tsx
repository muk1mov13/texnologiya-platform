import { Link } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Skeleton } from '@/components/ui/Skeleton'
import { cx, FOCUS_RING } from '@/lib/cx'

type Tone = 'brand' | 'amber' | 'rose' | 'slate'

const ICON_TONES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200/70',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200/70',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200/70',
}

interface StatCardProps {
  label: string
  /** `undefined` — hali yuklanmoqda (skelet). */
  value: number | string | undefined
  icon: IconName
  tone?: Tone
  hint?: string
  /** Bosilsa o'tiladigan sahifa. */
  to?: string
}

/** Ko'rsatkich kartasi: ikonka, katta raqam va yorliq; `to` berilsa — havola. */
export function StatCard({ label, value, icon, tone = 'brand', hint, to }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className={cx('grid size-10 place-items-center rounded-xl ring-1', ICON_TONES[tone])}>
          <Icon name={icon} className="size-5" />
        </span>
        {to && (
          <Icon
            name="arrowRight"
            className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 motion-reduce:transition-none"
          />
        )}
      </div>
      <div className="mt-5">
        {value === undefined ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <p className="text-[2rem] leading-none font-extrabold tracking-tight text-slate-900 tabular-nums">{value}</p>
        )}
        <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </>
  )
  const base = 'group relative block rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-200/70'
  if (!to) return <div className={base}>{body}</div>
  return (
    <Link
      to={to}
      className={cx(
        base,
        'transition duration-300 hover:-translate-y-0.5 hover:shadow-glow-sm hover:ring-brand-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        FOCUS_RING,
      )}
    >
      {body}
    </Link>
  )
}
