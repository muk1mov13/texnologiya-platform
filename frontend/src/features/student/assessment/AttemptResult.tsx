import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { ResultItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { cx } from '@/lib/cx'

interface AttemptResultProps {
  score: number
  maxScore: number
  items: ResultItem[]
  onRetry?: () => void
  onBack?: () => void
}

/** Urinish natijasi: ball va har element bo'yicha to'g'ri/xato, to'g'ri javob va izoh. */
export function AttemptResult({ score, maxScore, items, onRetry, onBack }: AttemptResultProps) {
  const { t } = useTranslation()
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center gap-4">
        <ProgressRing completed={score} total={maxScore} size={64} />
        <div>
          <p className="text-2xl font-extrabold">{t('activity.score', { score, max: maxScore })}</p>
          <p className="text-slate-600">{percent}%</p>
        </div>
      </Card>
      <ol className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li
            key={index}
            className={cx(
              'rounded-xl border-2 p-4',
              item.is_correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50',
            )}
          >
            <p className="font-semibold">
              <span aria-hidden="true">{item.is_correct ? '✓ ' : '✗ '}</span>
              <span className="sr-only">{item.is_correct ? t('activity.correct') : t('activity.wrong')}: </span>
              {item.prompt}
            </p>
            <p className="mt-1 text-sm">
              {t('activity.yourAnswer')}: <strong>{answerText(item, item.given, t)}</strong>
            </p>
            {!item.is_correct && (
              <p className="text-sm">
                {t('activity.correctAnswer')}: <strong>{answerText(item, item.correct, t)}</strong>
              </p>
            )}
            {item.explanation && <p className="mt-2 text-sm text-slate-700">{item.explanation}</p>}
          </li>
        ))}
      </ol>
      {(onRetry || onBack) && (
        <div className="flex flex-wrap gap-3">
          {onRetry && <Button onClick={onRetry}>{t('activity.retry')}</Button>}
          {onBack && (
            <Button variant="secondary" onClick={onBack}>
              ← {t('activity.back')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** Javobni o'qiladigan matnga aylantiradi: test — variant matni, ha/yo'q — "Ha"/"Yo'q", krossvord — so'z. */
function answerText(item: ResultItem, value: ResultItem['given'], t: TFunction): string {
  if (value === null || value === '') return t('activity.noAnswer')
  if (typeof value === 'boolean') return value ? t('activity.yes') : t('activity.no')
  if (typeof value === 'number' && item.options) return item.options[value] ?? String(value)
  return String(value)
}
