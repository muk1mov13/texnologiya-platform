import type { ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'

/** Bosqich tablaridagi "yangi element qo'shish" bloki: ochiq kulrang sirt va sarlavha. */
export function AddSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
        <span
          aria-hidden="true"
          className="grid size-6 place-items-center rounded-md bg-white text-brand-700 shadow-soft ring-1 ring-slate-200/70"
        >
          <Icon name="plus" className="size-3.5" />
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}
