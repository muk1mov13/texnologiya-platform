import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useResults } from '@/api/assessment'
import type { ActivityResult, SubjectResults, SubmissionStatus, TaskResult } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'

const STATUS_TONES = { submitted: 'slate', returned: 'amber', graded: 'green' } as const
const STATUS_KEYS: Record<SubmissionStatus, string> = {
  submitted: 'task.statusSubmitted',
  returned: 'task.statusReturned',
  graded: 'task.statusGraded',
}

/** "Natijalarim": fan → mavzu bo'yicha faoliyatlardagi eng yaxshi natija va vazifalar holati. */
export function ResultsPage() {
  const { t } = useTranslation()
  const results = useResults()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('results.title')}</h1>
      <QueryState query={results}>
        {(subjects) =>
          subjects.length === 0 ? (
            <EmptyState icon="📊" title={t('results.empty')} text={t('results.emptyText')} />
          ) : (
            <div className="flex flex-col gap-8">
              {subjects.map((subject) => (
                <SubjectSection key={subject.subject_id} subject={subject} />
              ))}
            </div>
          )
        }
      </QueryState>
    </div>
  )
}

function SubjectSection({ subject }: { subject: SubjectResults }) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-brand-900">{subject.subject_title}</h2>
      {subject.topics.map((topic) => (
        <Card key={topic.topic_id} className="flex flex-col gap-4 p-5">
          <h3 className="font-bold">{topic.topic_title}</h3>
          {topic.activities.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('results.activities')}</p>
              <ul className="flex flex-col gap-2">
                {topic.activities.map((activity) => (
                  <ActivityRow key={activity.activity_id} activity={activity} />
                ))}
              </ul>
            </div>
          )}
          {topic.tasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('results.tasks')}</p>
              <ul className="flex flex-col gap-2">
                {topic.tasks.map((task) => (
                  <TaskRow key={task.task_id} task={task} />
                ))}
              </ul>
            </div>
          )}
        </Card>
      ))}
    </section>
  )
}

function ActivityRow({ activity }: { activity: ActivityResult }) {
  const { t, i18n } = useTranslation()
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-2 border-slate-100 p-3">
      <div className="min-w-40 flex-1">
        <p className="font-semibold">{activity.title}</p>
        <p className="text-sm text-slate-600">
          {t(`activity.${activity.type}`)} · {t('activity.attempts', { count: activity.attempts_count })} ·{' '}
          {t('results.lastAttempt', {
            date: new Date(activity.last_attempt_at).toLocaleDateString(i18n.language),
          })}
        </p>
      </div>
      <Badge tone="green">{t('activity.best', { percent: Math.round(activity.best_percent) })}</Badge>
      <Link
        to={`/app/results/attempts/${activity.last_attempt_id}`}
        className={cx('text-sm font-semibold text-brand-700 hover:underline', FOCUS_RING)}
      >
        {t('results.review')} →
      </Link>
    </li>
  )
}

function TaskRow({ task }: { task: TaskResult }) {
  const { t } = useTranslation()
  return (
    <li className="flex flex-col gap-1 rounded-xl border-2 border-slate-100 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 font-semibold">{task.title}</p>
        <Badge tone={STATUS_TONES[task.status]}>
          {t(STATUS_KEYS[task.status], { score: task.score ?? 0, max: task.max_score })}
        </Badge>
        {task.is_late && <Badge tone="amber">{t('task.late')}</Badge>}
      </div>
      {task.feedback && <p className="whitespace-pre-line text-sm text-slate-700">{task.feedback}</p>}
    </li>
  )
}
