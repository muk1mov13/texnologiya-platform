import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

type Tone = 'brand' | 'slate' | 'amber' | 'red' | 'green'

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-900',
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  green: 'bg-emerald-100 text-emerald-800',
}

/** `dot` ko'rinishi: oq fon, halqa va rangli nuqta — holat belgilari uchun (admin ro'yxatlari). */
const DOT_TONES: Record<Tone, string> = {
  brand: 'bg-brand-500',
  slate: 'bg-slate-400',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  green: 'bg-emerald-500',
}

interface BadgeProps {
  tone?: Tone
  /** Holat belgisi: nuqta + matn, yumshoqroq ko'rinish. */
  dot?: boolean
  children: ReactNode
}

export function Badge({ tone = 'slate', dot = false, children }: BadgeProps) {
  if (dot) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
        <span aria-hidden="true" className={cx('size-1.5 rounded-full', DOT_TONES[tone])} />
        {children}
      </span>
    )
  }
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone])}>
      {children}
    </span>
  )
}
