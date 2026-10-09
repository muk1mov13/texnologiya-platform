import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router'
import { useTopic } from '@/api/student'
import type { StepBrief } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { PageSpinner } from '@/components/ui/Spinner'
import { cx } from '@/lib/cx'
import { isStepKind, STEP_ICONS } from '@/lib/steps'
import { StepContentView } from './StepContent'

export function PlayerPage() {
  const { t } = useTranslation()
  const params = useParams()
  const topicId = Number(params.topicId)
  const topic = useTopic(topicId)

  if (!Number.isInteger(topicId) || topicId <= 0) return <EmptyState icon="🧭" title={t('notFound.title')} />
  if (topic.isPending) return <PageSpinner />
  if (topic.isError) return <ErrorState error={topic.error} onRetry={() => void topic.refetch()} />

  const { steps } = topic.data
  if (!isStepKind(params.kind)) {
    const first = steps.find((step) => step.has_content) ?? steps[0]
    return <Navigate to={`/app/topics/${topicId}/${first.kind}`} replace />
  }
  const index = steps.findIndex((step) => step.kind === params.kind)
  const current = steps[index]
  const next = steps.slice(index + 1).find((step) => step.has_content)

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/app/subjects/${topic.data.subject.slug}`}
        className="text-sm font-semibold text-brand-700 hover:underline"
      >
        ← {topic.data.subject.title}
      </Link>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <ProgressRing completed={topic.data.progress.completed} total={topic.data.progress.total} size={48} />
              <h1 className="font-bold leading-tight">{topic.data.title}</h1>
            </div>
            <ol aria-label={t('player.steps')} className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
              {steps.map((step) => (
                <li key={step.id} className="shrink-0">
                  <StepLink topicId={topicId} step={step} active={step.id === current.id} />
                </li>
              ))}
            </ol>
          </Card>
        </aside>
        <section aria-labelledby="step-title" className="min-w-0">
          <h2 id="step-title" className="mb-4 text-xl font-bold">
            <span aria-hidden="true">{STEP_ICONS[current.kind]} </span>
            {t(`steps.${current.kind}`)}
          </h2>
          <StepContentView key={current.id} topicId={topicId} step={current} nextKind={next?.kind} />
        </section>
      </div>
    </div>
  )
}

function StepLink({ topicId, step, active }: { topicId: number; step: StepBrief; active: boolean }) {
  const { t } = useTranslation()
  const completed = step.status === 'completed'
  return (
    <Link
      to={`/app/topics/${topicId}/${step.kind}`}
      aria-current={active ? 'step' : undefined}
      className={cx(
        'flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm whitespace-nowrap',
        active ? 'bg-brand-100 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-100',
        !step.has_content && !active && 'text-slate-400',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
          // completed/active bir-biridan ajralib turishi va o'qilishi uchun: brand-600 (tugatilgan)
          // brand-700 (joriy, faol)dan bir pog'ona yengilroq — ikkisi ham oq matn bilan yetarli kontrastda.
          completed ? 'bg-brand-600 text-white' : active ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-600',
        )}
      >
        {completed ? '✓' : step.order}
      </span>
      {t(`steps.${step.kind}`)}
      {completed && <span className="sr-only"> ({t('player.completed')})</span>}
    </Link>
  )
}
