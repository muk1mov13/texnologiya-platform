import { AnimatePresence, m } from 'motion/react'
import { useId, useState } from 'react'
import type { FaqItem } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { cx, FOCUS_RING } from '@/lib/cx'
import { EASE_OUT } from '@/lib/motion'

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const buttonId = useId()

  return (
    <div
      className={cx(
        'rounded-2xl border bg-white transition-[border-color,box-shadow] duration-300',
        open ? 'border-brand-200 shadow-soft' : 'border-slate-200/80 hover:border-slate-300',
      )}
    >
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className={cx(
            'flex w-full items-start gap-4 rounded-2xl px-5 py-4 text-left font-semibold text-slate-900 sm:px-6 sm:py-5',
            FOCUS_RING,
          )}
        >
          <span className="flex-1">{item.question}</span>
          <m.span
            aria-hidden="true"
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className={cx(
              'grid size-7 shrink-0 place-items-center rounded-full transition-colors',
              open ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700',
            )}
          >
            <Icon name="plus" className="size-4" strokeWidth={2.4} />
          </m.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 leading-relaxed whitespace-pre-line text-slate-600 sm:px-6">{item.answer}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Savol-javob ro'yxati: har bir savol alohida ochiladi (balandlik animatsiyasi bilan). */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <FaqRow key={item.id} item={item} />
      ))}
    </div>
  )
}
