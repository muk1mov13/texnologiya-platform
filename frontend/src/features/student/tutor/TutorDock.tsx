import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiUsage } from '@/api/ai'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
        <Card className="flex h-[calc(100vh-7rem)] flex-col overflow-hidden p-0 sm:p-0">
          <TutorPanel topicId={topicId} />
        </Card>
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
            'fixed bottom-4 right-4 z-30 rounded-full bg-brand-700 px-4 py-3 font-semibold text-white shadow-press',
            FOCUS_RING,
          )}
        >
          <span aria-hidden="true">🤖 </span>
          {t('tutor.open')}
        </button>
      )}
      <div className={cx(!open && 'hidden')}>
        <div aria-hidden="true" className="fixed inset-0 z-40 bg-slate-900/40" onClick={() => setOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('tutor.title')}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[80vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
        >
          <div className="flex justify-end px-3 pt-2">
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
