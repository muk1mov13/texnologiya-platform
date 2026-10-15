import { m } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeachSubject } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { cx, FOCUS_RING } from '@/lib/cx'
import { EASE_OUT } from '@/lib/motion'

interface SubjectAccordionProps {
  subject: TeachSubject
  open: boolean
  onToggle: () => void
  /** Faqat ochiq holatda chiziladi (yopiq fanlar uchun so'rov yuborilmaydi). */
  children: ReactNode
}

/** Fan kartasi: sarlavha qatori bosilganda ichidagi tarkib ochiladi/yopiladi. */
export function SubjectAccordion({ subject, open, onToggle, children }: SubjectAccordionProps) {
  const { t } = useTranslation()
  const bodyId = useId()

  return (
    <section
      className={cx(
        'overflow-hidden rounded-3xl bg-white shadow-soft ring-1 transition-shadow motion-reduce:transition-none',
        open ? 'ring-brand-200/80' : 'ring-slate-200/70',
      )}
    >
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className={cx(
            'group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/70 motion-reduce:transition-none sm:px-6',
            FOCUS_RING,
            'focus-visible:-outline-offset-2',
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              'grid size-11 shrink-0 place-items-center rounded-xl ring-1 transition-colors motion-reduce:transition-none',
              open
                ? 'bg-brand-50 text-brand-700 ring-brand-200/70'
                : 'bg-slate-50 text-slate-500 ring-slate-200/70 group-hover:text-brand-700',
            )}
          >
            <Icon name="layers" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold tracking-tight text-balance text-slate-900">{subject.title}</span>
            <span className="mt-0.5 block text-sm text-slate-500 tabular-nums">
              {t('teach.topicsCount', { count: subject.topics.length })}
            </span>
          </span>
          <span className="hidden sm:block">
            <Badge dot tone={subject.is_published ? 'green' : 'amber'}>
              {subject.is_published ? t('common.published') : t('common.draft')}
            </Badge>
          </span>
          <Icon
            name="chevronDown"
            className={cx(
              'size-5 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none',
              open && 'rotate-180 text-brand-600',
            )}
          />
        </button>
      </h2>
      {open && (
        <m.div
          id={bodyId}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="border-t border-slate-100"
        >
          {children}
        </m.div>
      )}
    </section>
  )
}
