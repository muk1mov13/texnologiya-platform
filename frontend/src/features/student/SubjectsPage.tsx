import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useContinue, useSubjects } from '@/api/student'
import type { ContinueTarget, SubjectCard } from '@/api/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'
import { STEP_ICONS } from '@/lib/steps'
import { DashboardStats } from './DashboardStats'

export function SubjectsPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const next = useContinue()
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('student.hello', { name: user?.full_name ?? '' })}</h1>
      {/* XP, seriya va nishonlar faqat talabalarga beriladi (o'qituvchi/admin ko'rib chiqishda olmaydi). */}
      {user?.role === 'student' && <DashboardStats />}
      {next.data && <ContinueCard target={next.data} />}
      <section aria-labelledby="subjects-heading" className="flex flex-col gap-4">
        <h2 id="subjects-heading" className="text-lg font-bold">
          {t('student.subjects')}
        </h2>
        <SubjectList />
      </section>
    </div>
  )
}

function ContinueCard({ target }: { target: ContinueTarget }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/app/topics/${target.topic_id}/${target.step_kind}`}
      // brand-700/brand-50: oq matn bilan WCAG AA kontrastini ta'minlaydi (brand-500 ~2.5:1 edi, yetarli emas).
      className={cx(
        'group flex items-center gap-4 rounded-2xl bg-brand-700 p-5 text-white shadow-press transition hover:bg-brand-900',
        FOCUS_RING,
      )}
    >
      <span className="text-4xl" aria-hidden="true">
        {STEP_ICONS[target.step_kind]}
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-50">{t('student.continue')}</span>
        <span className="text-lg font-bold">{target.topic_title}</span>
        <span className="text-sm text-brand-50">
          {target.subject_title} · {t(`steps.${target.step_kind}`)}
        </span>
      </span>
      <span aria-hidden="true" className="text-2xl transition group-hover:translate-x-1 motion-reduce:transition-none">
        →
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
    <QueryState query={subjects}>
      {(data) =>
        data.length === 0 ? (
          <EmptyState icon="📚" title={t('student.noSubjects')} text={t('student.noSubjectsText')} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((subject) => (
              <li key={subject.id}>
                <SubjectTile subject={subject} />
              </li>
            ))}
          </ul>
        )
      }
    </QueryState>
  )
}

function SubjectTile({ subject }: { subject: SubjectCard }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/app/subjects/${subject.slug}`}
      className={cx(
        'flex h-full items-start gap-4 rounded-2xl border-2 border-slate-100 bg-white p-5 transition hover:border-brand-200 hover:shadow-md',
        FOCUS_RING,
      )}
    >
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-lg font-bold">{subject.title}</span>
        {subject.description && <span className="line-clamp-2 text-sm text-slate-600">{subject.description}</span>}
        <span className="text-sm font-semibold text-slate-500">
          {t('student.topicCount', { count: subject.topic_count })}
        </span>
      </span>
      <ProgressRing completed={subject.progress.completed} total={subject.progress.total} />
    </Link>
  )
}
