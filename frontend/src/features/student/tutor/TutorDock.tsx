import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiUsage } from '@/api/ai'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/ui/Button'
import { SURFACE } from '@/components/ui/styles'
import { cx, FOCUS_RING } from '@/lib/cx'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { TutorPanel } from './TutorPanel'

/**
 * Pleyerdagi repetitor: keng ekranda o'ng ustun, telefonda pastdan ochiladigan panel.
 * Bir vaqtda faqat bitta `TutorPanel` chiziladi (suhbat holati ikkiga bo'linmasin); mobil panel
 * yopilganda unmount qilinmaydi, faqat yashiriladi — suhbat saqlanadi. AI o'chiq bo'lsa hech narsa.
 */
export function TutorDock({ topicId }: { topicId: number }) {
  const { t } = useTranslation()
  const usage = useAiUsage()
  const wide = useMediaQuery('(min-width: 1024px)')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!usage.data?.enabled) return null

  if (wide) {
    return (
      <aside aria-label={t('tutor.title')} className="sticky top-20 self-start">
        <div className={cx(SURFACE, 'flex h-[calc(100dvh-7rem)] flex-col overflow-hidden')}>
          <TutorPanel topicId={topicId} />
        </div>
      </aside>
    )
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className={cx(
            'fixed right-4 bottom-4 z-30 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-600 to-brand-900 px-5 py-3 font-semibold text-white shadow-glow',
            'transition hover:-translate-y-0.5 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0',
            FOCUS_RING,
          )}
        >
          <Icon name="sparkles" className="size-5" />
          {t('tutor.open')}
        </button>
      )}
      <div className={cx(!open && 'hidden')}>
        <div aria-hidden="true" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('tutor.title')}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200/70"
        >
          <div className="relative flex justify-end px-3 pt-2">
            <span aria-hidden="true" className="absolute top-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-slate-200" />
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
          <div className="min-h-0 flex-1">
            <TutorPanel topicId={topicId} />
          </div>
        </div>
      </div>
    </>
  )
}
