import { m } from 'motion/react'
import type { MouseEvent, ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { fadeUp } from '@/lib/motion'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
}

/** Kursorni kuzatuvchi yorug'lik dog'li karta (`--x`/`--y` CSS o'zgaruvchilari orqali). */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  function onMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--x', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--y', `${event.clientY - rect.top}px`)
  }

  return (
    <m.div
      variants={fadeUp}
      onMouseMove={onMove}
      className={cx(
        'group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-7',
        'transition duration-300 hover:-translate-y-1 hover:border-brand-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(420px circle at var(--x, 50%) var(--y, 50%), rgb(45 212 191 / 0.14), transparent 60%)',
        }}
      />
      <div className="relative flex h-full flex-col">{children}</div>
    </m.div>
  )
}
