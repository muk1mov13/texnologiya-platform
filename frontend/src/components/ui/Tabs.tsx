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
}

export function Tabs<T extends string>({ items, value, onChange, label }: TabsProps<T>) {
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
      className="flex gap-1 overflow-x-auto border-b-2 border-slate-100"
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
              '-mb-0.5 inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold whitespace-nowrap',
              selected ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800',
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
