import type { KeyboardEvent, ReactNode } from 'react'
import { cx } from '@/lib/cx'

export interface TabItem<T extends string> {
  id: T
  label: string
  badge?: ReactNode
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  /** `pill` — kulrang "segment" ichida oq tanlangan tugma (admin asboblar qatori). */
  variant?: 'line' | 'pill'
}

export function Tabs<T extends string>({ items, value, onChange, label, variant = 'line' }: TabsProps<T>) {
  const pill = variant === 'pill'
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const index = items.findIndex((item) => item.id === value)
    const step = event.key === 'ArrowRight' ? 1 : -1
    const next = items[(index + step + items.length) % items.length]
    onChange(next.id)
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx(
        'flex gap-1 overflow-x-auto',
        pill
          ? 'w-fit max-w-full rounded-2xl bg-slate-100/80 p-1 ring-1 ring-slate-200/60'
          : 'shadow-[inset_0_-2px_0_var(--color-slate-100)]',
      )}
    >
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            data-tab={item.id}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cx(
              'inline-flex shrink-0 items-center gap-2 text-sm font-semibold whitespace-nowrap',
              pill
                ? cx(
                    'rounded-xl px-3.5 py-1.5 transition motion-reduce:transition-none',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700',
                    selected
                      ? 'bg-white text-slate-900 shadow-soft ring-1 ring-slate-200/70'
                      : 'text-slate-500 hover:text-slate-800',
                  )
                : cx(
                    'border-b-2 px-4 py-2',
                    selected ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800',
                  ),
            )}
          >
            {item.label}
            {item.badge}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className="pt-5">
      {children}
    </div>
  )
}
