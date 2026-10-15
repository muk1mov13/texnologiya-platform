import { m } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useSubject } from '@/api/student'
import type { LessonType, SubjectDetail, TopicCard } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { BACK_LINK, EYEBROW, SURFACE, SURFACE_LINK_SM } from '@/components/ui/styles'
import { cx, FOCUS_RING } from '@/lib/cx'
import { useProtectedDownload } from '@/lib/download'
import { LESSON_TYPES } from '@/lib/lessonType'
import { fadeUp, stagger } from '@/lib/motion'

export function SubjectPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const subject = useSubject(slug)

  return (
    <div className="flex flex-col gap-6">
      <Link to="/app" className={BACK_LINK}>
        <Icon name="arrowLeft" className="size-4" />
        {t('student.allSubjects')}
      </Link>
      <QueryState query={subject} loading={<SubjectSkeleton />}>
        {(data) => <SubjectBody subject={data} />}
      </QueryState>
    </div>
  )
}

function SubjectSkeleton() {
  return (
    <>
      <div className={cx(SURFACE, 'flex flex-col gap-3 p-6 sm:p-8')}>
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex max-w-3xl flex-col gap-3">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="flex items-center gap-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <Skeleton className="h-20 flex-1 rounded-2xl" />
          </div>
        ))}
      </div>
    </>
  )
}

function isDone(topic: TopicCard): boolean {
  return topic.progress.total > 0 && topic.progress.completed >= topic.progress.total
}

function SubjectBody({ subject }: { subject: SubjectDetail }) {
  const { t } = useTranslation()
  const { topics } = subject
  const [filter, setFilter] = useState<LessonType | 'all'>('all')
  const groups = LESSON_TYPES.map((type) => ({
    type,
    topics: topics.filter((topic) => topic.lesson_type === type),
  })).filter((group) => group.topics.length > 0)
  const visible = filter === 'all' ? groups : groups.filter((group) => group.type === filter)
  const options: Array<LessonType | 'all'> = ['all', ...groups.map((group) => group.type)]
  return (
    <>
      <SubjectHero subject={subject} />
      {topics.length === 0 ? (
        <EmptyState icon="layers" title={t('student.noTopics')} />
      ) : groups.length === 1 ? (
        // Bitta tur (masalan, faqat ma'ruzalar) bo'lsa guruh sarlavhasi va filtr kerak emas.
        <TopicPath topics={groups[0].topics} />
      ) : (
        <>
          <div
            role="group"
            aria-label={t('student.lessonFilter')}
            className="flex w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100/70 p-1 ring-1 ring-slate-200/60 sm:w-fit"
          >
            {options.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={filter === type}
                onClick={() => setFilter(type)}
                className={cx(
                  'shrink-0 rounded-xl px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition motion-reduce:transition-none',
                  filter === type
                    ? 'bg-white text-brand-800 shadow-soft ring-1 ring-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900',
                  FOCUS_RING,
                )}
              >
                {type === 'all' ? t('student.allTypes') : t(`student.lessonGroups.${type}`)}
              </button>
            ))}
          </div>
          {visible.map((group) => (
            <section key={group.type} aria-labelledby={`group-${group.type}`} className="flex flex-col gap-4">
              <h2 id={`group-${group.type}`} className="flex items-center gap-2 text-xl font-bold tracking-tight">
                {t(`student.lessonGroups.${group.type}`)}
                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-600 tabular-nums">
                  {group.topics.length}
                </span>
              </h2>
              <TopicPath topics={group.topics} />
            </section>
          ))}
        </>
      )}
    </>
  )
}

function SubjectHero({ subject }: { subject: SubjectDetail }) {
  const { t } = useTranslation()
  const { title, description, topics, slug, syllabus_name } = subject
  const syllabus = useProtectedDownload()
  const done = topics.filter(isDone).length
  return (
    <m.header
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className={cx(SURFACE, 'relative isolate overflow-hidden p-6 sm:p-8')}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(60%_90%_at_100%_0%,black,transparent)]" />
        <div className="absolute -top-24 -right-10 size-72 rounded-full bg-brand-200/40 blur-3xl" />
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-2xl flex-col items-start gap-3">
          <span className={EYEBROW}>
            <Icon name="layers" className="size-3.5" />
            {t('student.topicCount', { count: topics.length })}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">{title}</h1>
          {description && <p className="text-pretty text-slate-600">{description}</p>}
          {syllabus_name && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-1"
              loading={syllabus.pending}
              onClick={() => void syllabus.download(`/api/subjects/${slug}/syllabus`, syllabus_name)}
            >
              {!syllabus.pending && <Icon name="download" className="size-4" />}
              {t('student.syllabus')}
            </Button>
          )}
        </div>
        {topics.length > 0 && (
          <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200/70 md:flex-col md:px-6 md:text-center">
            <ProgressRing completed={done} total={topics.length} size={72} decorative />
            <p className="text-sm font-semibold text-slate-600 tabular-nums">
              {t('student.topicsDone', { done, total: topics.length })}
            </p>
          </div>
        )}
      </div>
    </m.header>
  )
}

function TopicPath({ topics }: { topics: TopicCard[] }) {
  return (
    <m.ol
      initial="hidden"
      animate="show"
      variants={stagger(0.05)}
      className="relative flex max-w-3xl flex-col gap-3"
    >
      {/* Tugunlarni bog'lovchi vertikal chiziq (bezak). */}
      <span aria-hidden="true" className="absolute top-6 bottom-6 left-5 w-0.5 -translate-x-1/2 rounded-full bg-slate-200" />
      {topics.map((topic, index) => (
        <m.li key={topic.id} variants={fadeUp} className="relative flex items-center gap-3 sm:gap-4">
          <TopicNode topic={topic} number={index + 1} />
          <TopicLink topic={topic} number={index + 1} />
        </m.li>
      ))}
    </m.ol>
  )
}

/** Yo'l tuguni: tugatilgan — gradient belgi, boshlangan — brand halqa, boshlanmagan — kulrang. */
function TopicNode({ topic, number }: { topic: TopicCard; number: number }) {
  const done = isDone(topic)
  const started = !done && topic.progress.completed > 0
  return (
    <span
      aria-hidden="true"
      className={cx(
        'relative grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums ring-4 ring-slate-50',
        done
          ? 'bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow-sm'
          : started
            ? 'bg-white text-brand-800 outline-2 -outline-offset-2 outline-brand-500'
            : 'bg-white text-slate-500 outline-1 -outline-offset-1 outline-slate-200',
      )}
    >
      {done ? <Icon name="check" className="size-5" /> : number}
    </span>
  )
}

function TopicLink({ topic, number }: { topic: TopicCard; number: number }) {
  const { t } = useTranslation()
  const done = isDone(topic)
  const { completed, total } = topic.progress
  return (
    <Link
      to={`/app/topics/${topic.id}`}
      className={cx(SURFACE_LINK_SM, 'group flex min-w-0 flex-1 items-center gap-4 p-4')}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          {t(`student.topicLabel.${topic.lesson_type}`, { number })}
          {done && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-800 ring-1 ring-emerald-200/70">
              <Icon name="check" className="size-3" />
              {t('student.topicDone')}
            </span>
          )}
        </span>
        <span className="font-bold tracking-tight text-balance text-slate-900">{topic.title}</span>
        {total > 0 && !done && (
          <span className="flex items-center gap-3 pt-1">
            <ProgressBar value={completed / total} className="h-1.5 max-w-40" />
            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              {t('student.stepsDone', { completed, total })}
            </span>
          </span>
        )}
      </span>
      <Icon
        name="chevronRight"
        className="size-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700 motion-reduce:transition-none"
      />
    </Link>
  )
}
