import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useResults } from '@/api/assessment'
import type { ActivityResult, ActivityType, SubjectResults, SubmissionStatus, TaskResult } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { QueryState } from '@/components/ui/QueryState'
import { PAGE_TITLE, SURFACE, SURFACE_SM } from '@/components/ui/styles'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'

const STATUS_TONES = { submitted: 'slate', returned: 'amber', graded: 'green' } as const
const STATUS_KEYS: Record<SubmissionStatus, string> = {
  submitted: 'task.statusSubmitted',
  returned: 'task.statusReturned',
  graded: 'task.statusGraded',
}
const ACTIVITY_ICONS: Record<ActivityType, IconName> = { quiz: 'quiz', yesno: 'check', crossword: 'layers' }

/** "Natijalarim": fan → mavzu bo'yicha faoliyatlardagi eng yaxshi natija va vazifalar holati. */
export function ResultsPage() {
  const { t } = useTranslation()
  const results = useResults()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className={PAGE_TITLE}>{t('results.title')}</h1>
        <p className="text-pretty text-slate-600">{t('results.subtitle')}</p>
      </header>
      <QueryState query={results}>
        {(subjects) =>
          subjects.length === 0 ? (
            <EmptyState icon="chart" title={t('results.empty')} text={t('results.emptyText')} />
          ) : (
            <m.div initial="hidden" animate="show" variants={stagger(0.06)} className="flex flex-col gap-6">
              <Summary subjects={subjects} />
              {subjects.map((subject) => (
                <SubjectSection key={subject.subject_id} subject={subject} />
              ))}
            </m.div>
          )
        }
      </QueryState>
    </div>
  )
}

/** Barcha fanlar bo'yicha qisqa xulosa (faqat kelgan ma'lumotdan hisoblanadi). */
function Summary({ subjects }: { subjects: SubjectResults[] }) {
  const { t } = useTranslation()
  const topics = subjects.flatMap((subject) => subject.topics)
  const activities = topics.flatMap((topic) => topic.activities)
  const tasks = topics.flatMap((topic) => topic.tasks)
  const average =
    activities.length > 0
      ? Math.round(activities.reduce((sum, activity) => sum + activity.best_percent, 0) / activities.length)
      : null
  const graded = tasks.filter((task) => task.status === 'graded').length
  const items: Array<{ icon: IconName; label: string; value: string; ratio?: number }> = [
    { icon: 'target', label: t('results.summaryActivities'), value: String(activities.length) },
    {
      icon: 'chart',
      label: t('results.summaryAverage'),
      value: average === null ? '—' : `${average}%`,
      ratio: average === null ? undefined : average / 100,
    },
    { icon: 'clipboard', label: t('results.summaryTasks'), value: `${graded} / ${tasks.length}` },
  ]
  return (
    <m.dl variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className={cx(SURFACE, 'flex flex-col gap-3 p-5')}>
          <dt className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 ring-1 ring-brand-200/70"
            >
              <Icon name={item.icon} className="size-5" />
            </span>
            {item.label}
          </dt>
          <dd className="flex flex-col gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">{item.value}</span>
            {item.ratio !== undefined && <ProgressBar value={item.ratio} />}
          </dd>
        </div>
      ))}
    </m.dl>
  )
}

function SubjectSection({ subject }: { subject: SubjectResults }) {
  const { t } = useTranslation()
  return (
    <m.details variants={fadeUp} open className={cx(SURFACE, 'group overflow-hidden')}>
      <summary
        className={cx(
          'flex cursor-pointer list-none items-center gap-3 p-5 transition hover:bg-slate-50/70 motion-reduce:transition-none [&::-webkit-details-marker]:hidden',
          FOCUS_RING,
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow-sm"
        >
          <Icon name="book" className="size-5" />
        </span>
        <h2 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-balance text-slate-900">
          {subject.subject_title}
        </h2>
        <Icon
          name="chevronDown"
          className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="flex flex-col gap-4 border-t border-slate-200/70 bg-slate-50/50 p-4 sm:p-5">
        {subject.topics.map((topic) => (
          <section key={topic.topic_id} className={cx(SURFACE_SM, 'flex flex-col gap-4 p-4 sm:p-5')}>
            <h3 className="font-bold tracking-tight text-slate-900">{topic.topic_title}</h3>
            {topic.activities.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-500">{t('results.activities')}</p>
                <ul className="flex flex-col gap-2">
                  {topic.activities.map((activity) => (
                    <ActivityRow key={activity.activity_id} activity={activity} />
                  ))}
                </ul>
              </div>
            )}
            {topic.tasks.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-500">{t('results.tasks')}</p>
                <ul className="flex flex-col gap-2">
                  {topic.tasks.map((task) => (
                    <TaskRow key={task.task_id} task={task} />
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </m.details>
  )
}

function ActivityRow({ activity }: { activity: ActivityResult }) {
  const { t, i18n } = useTranslation()
  const percent = Math.round(activity.best_percent)
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-slate-200"
      >
        <Icon name={ACTIVITY_ICONS[activity.type]} className="size-4" />
      </span>
      <div className="min-w-40 flex-1">
        <p className="font-semibold text-slate-900">{activity.title}</p>
        <p className="text-sm text-slate-600">
          {t(`activity.${activity.type}`)} · {t('activity.attempts', { count: activity.attempts_count })} ·{' '}
          {t('results.lastAttempt', { date: formatDate(activity.last_attempt_at, i18n.language) })}
        </p>
      </div>
      <div className="flex w-full items-center gap-3 sm:w-48">
        <ProgressBar value={activity.best_percent / 100} className="flex-1" />
        <span className="sr-only">{t('activity.best', { percent })}</span>
        <span aria-hidden="true" className="w-11 text-right text-sm font-bold text-slate-900 tabular-nums">
          {percent}%
        </span>
      </div>
      <Link
        to={`/app/results/attempts/${activity.last_attempt_id}`}
        className={cx(
          'group inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900',
          FOCUS_RING,
        )}
      >
        {t('results.review')}
        <Icon
          name="arrowRight"
          className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </Link>
    </li>
  )
}

function TaskRow({ task }: { task: TaskResult }) {
  const { t } = useTranslation()
  return (
    <li className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-slate-200"
        >
          <Icon name="clipboard" className="size-4" />
        </span>
        <p className="flex-1 font-semibold text-slate-900">{task.title}</p>
        <Badge tone={STATUS_TONES[task.status]}>
          {t(STATUS_KEYS[task.status], { score: task.score ?? 0, max: task.max_score })}
        </Badge>
        {task.is_late && <Badge tone="amber">{t('task.late')}</Badge>}
      </div>
      {task.feedback && (
        <p className="rounded-lg bg-white p-3 text-sm whitespace-pre-line text-slate-700 ring-1 ring-slate-200/60">
          {task.feedback}
        </p>
      )}
    </li>
  )
}
