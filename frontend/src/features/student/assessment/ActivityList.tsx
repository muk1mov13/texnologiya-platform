import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubmitAttempt } from '@/api/assessment'
import type { ActivityType, ActivityView, AttemptAnswer, AttemptResult as AttemptResultData } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { AttemptResult } from './AttemptResult'
import { ChoicePlayer } from './ChoicePlayer'
import { CrosswordPlayer } from './CrosswordPlayer'

const ICONS: Record<ActivityType, string> = { quiz: '📝', yesno: '✅', crossword: '🧩' }

interface ActivityListProps {
  topicId: number
  stepId: number
  activities: ActivityView[]
}

/** Takrorlash/amaliyot bosqichidagi faoliyatlar: ro'yxat → yechish → natija. */
export function ActivityList({ topicId, stepId, activities }: ActivityListProps) {
  const { t } = useTranslation()
  const submit = useSubmitAttempt(topicId, stepId)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [result, setResult] = useState<AttemptResultData | null>(null)
  // "Qayta urinish" yechish komponentini yangi (bo'sh javoblar bilan) qayta yaratadi.
  const [run, setRun] = useState(0)
  const selected = activities.find((activity) => activity.id === selectedId) ?? null

  if (activities.length === 0) {
    return <EmptyState icon="🗂️" title={t('player.noContent')} text={t('player.noContentText')} />
  }

  if (!selected) {
    return (
      <ul className="flex flex-col gap-3">
        {activities.map((activity) => (
          <li key={activity.id}>
            <Card className="flex flex-wrap items-center gap-3 p-4">
              <span className="text-2xl" aria-hidden="true">
                {ICONS[activity.type]}
              </span>
              <div className="min-w-40 flex-1">
                <p className="font-semibold">{activity.title}</p>
                <p className="text-sm text-slate-600">
                  {t(`activity.${activity.type}`)}
                  {activity.attempts_count > 0 && ` · ${t('activity.attempts', { count: activity.attempts_count })}`}
                </p>
              </div>
              {activity.best_percent !== null ? (
                <Badge tone="green">{t('activity.best', { percent: Math.round(activity.best_percent) })}</Badge>
              ) : (
                <Badge>{t('activity.notAttempted')}</Badge>
              )}
              <Button size="sm" onClick={() => setSelectedId(activity.id)}>
                {activity.attempts_count > 0 ? t('activity.retry') : t('activity.start')}
              </Button>
            </Card>
          </li>
        ))}
      </ul>
    )
  }

  const back = () => {
    setSelectedId(null)
    setResult(null)
    submit.reset()
  }
  const retry = () => {
    setResult(null)
    setRun((value) => value + 1)
    submit.reset()
  }
  const onSubmit = (answers: AttemptAnswer[]) =>
    submit.mutate({ activityId: selected.id, answers }, { onSuccess: setResult })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={back}>
          ← {t('activity.back')}
        </Button>
        <h3 className="font-bold">{selected.title}</h3>
      </div>
      {result ? (
        <AttemptResult
          score={result.score}
          maxScore={result.max_score}
          items={result.result}
          onRetry={retry}
          onBack={back}
        />
      ) : selected.type === 'crossword' ? (
        <CrosswordPlayer
          key={`${selected.id}-${run}`}
          activity={selected}
          pending={submit.isPending}
          onSubmit={onSubmit}
        />
      ) : (
        <ChoicePlayer
          key={`${selected.id}-${run}`}
          activity={selected}
          pending={submit.isPending}
          onSubmit={onSubmit}
        />
      )}
    </div>
  )
}
