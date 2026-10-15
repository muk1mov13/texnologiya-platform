import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useContinue, useSubjects } from '@/api/student'
import type { ContinueTarget, SubjectCard } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EYEBROW, SECTION_HEADING, SURFACE, SURFACE_LINK } from '@/components/ui/styles'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { greetingKey } from '@/lib/greeting'
import { fadeUp, stagger } from '@/lib/motion'
import { STEP_ICON_NAMES } from '@/lib/steps'
import { DashboardStats } from './DashboardStats'

export function SubjectsPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const next = useContinue()
  return (
    <div className="flex flex-col gap-8">
      <Hero name={user?.full_name ?? ''} target={next.data ?? null} />
      {/* XP, seriya va nishonlar faqat talabalarga beriladi (o'qituvchi/admin ko'rib chiqishda olmaydi). */}
      {user?.role === 'student' && <DashboardStats />}
      <section aria-labelledby="subjects-heading" className="flex flex-col gap-4">
        <h2 id="subjects-heading" className={SECTION_HEADING}>
          {t('student.subjects')}
        </h2>
        <SubjectList />
      </section>
    </div>
  )
}

/** Bosh panel tepasi: salomlashuv va "Davom ettirish" (oxirgi ochilgan bosqich). */
function Hero({ name, target }: { name: string; target: ContinueTarget | null }) {
  const { t, i18n } = useTranslation()
  const now = new Date()
  return (
    <m.section
      initial="hidden"
      animate="show"
      variants={stagger(0.08)}
      className={cx(SURFACE, 'relative isolate overflow-hidden p-6 sm:p-8')}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(70%_80%_at_0%_0%,black,transparent)]" />
        <div className="absolute -top-24 -left-16 size-72 rounded-full bg-brand-200/40 blur-3xl" />
      </div>
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <m.div variants={fadeUp} className="flex flex-col gap-3">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
            <span className={EYEBROW}>
              <Icon name="sparkles" className="size-3.5" />
              {t(`student.greeting.${greetingKey(now)}`)}
            </span>
            <span>{formatDate(now.toISOString(), i18n.language)}</span>
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">
            {t('student.hello', { name })}
          </h1>
          <p className="max-w-md text-pretty text-slate-600">{target ? t('student.heroText') : t('student.startHint')}</p>
        </m.div>
        {target && (
          <m.div variants={fadeUp}>
            <ContinueCard target={target} />
          </m.div>
        )}
      </div>
    </m.section>
  )
}

function ContinueCard({ target }: { target: ContinueTarget }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/app/topics/${target.topic_id}/${target.step_kind}`}
      className={cx(
        'group relative isolate flex flex-col gap-5 overflow-hidden rounded-3xl bg-brand-950 p-5 text-white shadow-glow sm:p-6',
        'transition duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        FOCUS_RING,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -top-20 -right-10 -z-10 size-56 rounded-full bg-brand-500/40 blur-3xl transition-opacity group-hover:opacity-80"
      />
      <span className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-brand-200 ring-1 ring-white/15"
        >
          <Icon name={STEP_ICON_NAMES[target.step_kind]} className="size-6" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-bold tracking-wider text-brand-200 uppercase">{t('student.continue')}</span>
          <span className="text-lg font-bold text-balance">{target.topic_title}</span>
          <span className="truncate text-sm text-brand-100/80">
            {target.subject_title} · {t(`steps.${target.step_kind}`)}
          </span>
        </span>
      </span>
      <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand-900">
        {t('student.continueCta')}
        <Icon
          name="arrowRight"
          className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </span>
    </Link>
  )
}

function SubjectList() {
  const { t } = useTranslation()
  const subjects = useSubjects()
  // Masalan, "Tugatdim" ['subjects']ni invalidatsiya qiladi; keyingi qayta so'rov 500 bo'lsa
  // ham ro'yxat ko'rinishda qoladi (QueryState).
  return (
    <QueryState query={subjects} loading={<SubjectSkeletons />}>
      {(data) =>
        data.length === 0 ? (
          <EmptyState icon="book" title={t('student.noSubjects')} text={t('student.noSubjectsText')} />
        ) : (
          <m.ul
            initial="hidden"
            animate="show"
            variants={stagger(0.06)}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {data.map((subject, index) => (
              <m.li key={subject.id} variants={fadeUp}>
                <SubjectTile subject={subject} index={index} />
              </m.li>
            ))}
          </m.ul>
        )
      }
    </QueryState>
  )
}

function SubjectSkeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((key) => (
        <div key={key} className={cx(SURFACE, 'flex flex-col overflow-hidden')}>
          <Skeleton className="h-28 rounded-none" />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-2 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Fan kartalari banneri — bitta brand aksent ichida bir-biridan ajralib turadigan uch soya.
const BANNERS = [
  'from-brand-500 to-brand-800',
  'from-brand-700 to-brand-950',
  'from-brand-400 to-brand-700',
]

function SubjectTile({ subject, index }: { subject: SubjectCard; index: number }) {
  const { t } = useTranslation()
  const { completed, total } = subject.progress
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <Link
      to={`/app/subjects/${subject.slug}`}
      className={cx(SURFACE_LINK, 'group flex h-full flex-col overflow-hidden')}
    >
      <span
        aria-hidden="true"
        className={cx('relative flex h-28 items-end overflow-hidden bg-gradient-to-br p-4', BANNERS[index % BANNERS.length])}
      >
        <span className="absolute inset-0 bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <span className="absolute -right-3 -bottom-8 text-[7rem] leading-none font-extrabold text-white/10 transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none">
          {subject.title.trim().charAt(0).toLocaleUpperCase()}
        </span>
        <span className="relative grid size-10 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
          <Icon name="book" className="size-5" />
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-2 p-5">
        <span className="flex items-start justify-between gap-3">
          <span className="text-lg leading-snug font-bold tracking-tight text-balance text-slate-900">
            {subject.title}
          </span>
          <ProgressRing completed={completed} total={total} size={44} />
        </span>
        {subject.description && <span className="line-clamp-2 text-sm text-slate-600">{subject.description}</span>}
        <span className="mt-auto flex flex-col gap-2 pt-3">
          <ProgressBar value={total > 0 ? completed / total : 0} />
          <span className="flex items-center justify-between text-sm font-semibold text-slate-500">
            <span>{t('student.topicCount', { count: subject.topic_count })}</span>
            <span className="text-brand-800 tabular-nums">{percent}%</span>
          </span>
        </span>
      </span>
    </Link>
  )
}
