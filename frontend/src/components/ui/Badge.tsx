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

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONES[tone],
      )}
    >
      {children}
    </span>
  )
}
