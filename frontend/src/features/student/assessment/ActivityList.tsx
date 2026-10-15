import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubmitAttempt } from '@/api/assessment'
import type { ActivityType, ActivityView, AttemptAnswer, AttemptResult as AttemptResultData } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SURFACE_SM } from '@/components/ui/styles'
import { cx } from '@/lib/cx'
import { AttemptResult } from './AttemptResult'
import { ChoicePlayer } from './ChoicePlayer'
import { CrosswordPlayer } from './CrosswordPlayer'

const ICONS: Record<ActivityType, IconName> = { quiz: 'quiz', yesno: 'check', crossword: 'layers' }

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
    return <EmptyState icon="folder" title={t('player.noContent')} text={t('player.noContentText')} />
  }

  if (!selected) {
    return (
      <ul className="flex flex-col gap-3">
        {activities.map((activity) => (
          <li key={activity.id}>
            <div className={cx(SURFACE_SM, 'flex flex-wrap items-center gap-4 p-4')}>
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 ring-1 ring-brand-200/70"
              >
                <Icon name={ICONS[activity.type]} className="size-5" />
              </span>
              <div className="min-w-40 flex-1">
                <p className="font-semibold tracking-tight text-slate-900">{activity.title}</p>
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
                <Icon name={activity.attempts_count > 0 ? 'refresh' : 'play'} className="size-4" />
                {activity.attempts_count > 0 ? t('activity.retry') : t('activity.start')}
              </Button>
            </div>
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
        <Button variant="secondary" size="sm" onClick={back}>
          <Icon name="arrowLeft" className="size-4" />
          {t('activity.back')}
        </Button>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{selected.title}</h3>
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
