import { useTranslation } from 'react-i18next'
import { useAiUsage } from '@/api/ai'
import { useAiCheck } from '@/api/teachAi'
import type { SubmissionDetail } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Javob sahifasidagi AI tavsiyasi: taklif qilingan ball va izoh. Ball avtomatik qo'yilmaydi.
 * AI o'chiq va hali tekshiruv bo'lmagan bo'lsa karta ko'rsatilmaydi.
 */
export function AiSuggestionCard({ detail }: { detail: SubmissionDetail }) {
  const { t } = useTranslation()
  const usage = useAiUsage()
  const check = useAiCheck(detail.id)
  const enabled = Boolean(usage.data?.enabled)
  const status = detail.ai_status

  if (!enabled && status === 'none') return null

  const feedback = detail.ai_feedback
  const canRun = enabled && status !== 'pending'

  return (
    <Card className="flex flex-col gap-3 border-brand-100 p-5">
      <h2 className="font-bold">
        <span aria-hidden="true">✨ </span>
        {t('aiReview.title')}
      </h2>

      {status === 'none' && <p className="text-sm text-slate-600">{t('aiReview.none')}</p>}

      {status === 'pending' && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner size="sm" decorative />
          {t('aiReview.pending')}
        </p>
      )}

      {status === 'done' && (
        <div className="flex flex-col gap-3">
          {detail.ai_score !== null && (
            <p className="text-lg font-bold text-brand-900">
              {t('aiReview.score', { score: detail.ai_score, max: detail.max_score })}
            </p>
          )}
          {feedback && (
            <>
              <p className="whitespace-pre-line text-slate-700">{feedback.feedback}</p>
              <FeedbackList title={t('aiReview.strengths')} items={feedback.strengths} />
              <FeedbackList title={t('aiReview.issues')} items={feedback.issues} />
            </>
          )}
          <p className="text-xs text-slate-500">{t('aiReview.notice')}</p>
        </div>
      )}

      {status === 'unsupported' && <p className="text-sm text-slate-600">{t('aiReview.unsupported')}</p>}
      {status === 'failed' && <p className="text-sm text-red-700">{t('aiReview.failed')}</p>}

      {canRun && (
        <div>
          <Button size="sm" variant="secondary" loading={check.isPending} onClick={() => check.mutate()}>
            {status === 'none' ? t('aiReview.check') : t('aiReview.recheck')}
          </Button>
        </div>
      )}
    </Card>
  )
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
