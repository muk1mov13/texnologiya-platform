import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useAttemptDetail } from '@/api/assessment'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'
import { AttemptResult } from './assessment/AttemptResult'

/** Bitta urinish tahlili: har savol bo'yicha talaba javobi, to'g'ri javob va izoh. */
export function AttemptDetailPage() {
  const { t, i18n } = useTranslation()
  const { attemptId = '' } = useParams()
  const id = Number(attemptId)
  const attempt = useAttemptDetail(id)
  // Noto'g'ri ID'da so'rov o'chiq (abadiy `isPending`) — QueryState'ga yuborilmaydi.
  const validId = Number.isInteger(id) && id > 0

  const body = !validId ? (
    <EmptyState icon="🔍" title={t('notFound.title')} />
  ) : (
    <QueryState query={attempt}>
      {(data) => (
        <>
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold sm:text-3xl">{data.activity_title}</h1>
            <p className="text-slate-600">
              {t(`activity.${data.activity_type}`)} · {new Date(data.created_at).toLocaleString(i18n.language)}
            </p>
          </header>
          <AttemptResult score={data.score} maxScore={data.max_score} items={data.result} />
        </>
      )}
    </QueryState>
  )

  return (
    <div className="flex flex-col gap-6">
      <Link to="/app/results" className={cx('text-sm font-semibold text-brand-700 hover:underline', FOCUS_RING)}>
        ← {t('results.back')}
      </Link>
      {body}
    </div>
  )
}
