import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { canRetry } from '@/api/errors'
import { useSubject } from '@/api/student'
import type { SubjectDetail } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { PageSpinner } from '@/components/ui/Spinner'
import { cx, FOCUS_RING } from '@/lib/cx'

// Katta ekranda (md: va undan yuqori) mavzular chap-o'ng siljib, yo'l (path) shaklini hosil qiladi.
// Kichik ekranlarda (sm va undan past) siljishsiz to'liq kenglikda qoladi — aks holda
// eng kattasi (ml-48 + max-w-md) sm (640px) kengligida konteynerdan tashqariga chiqib ketadi.
const OFFSETS = ['md:ml-0', 'md:ml-24', 'md:ml-48', 'md:ml-24']

export function SubjectPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const subject = useSubject(slug)

  return (
    <div className="flex flex-col gap-6">
      <Link to="/app" className={cx('text-sm font-semibold text-brand-700 hover:underline', FOCUS_RING)}>
        ← {t('student.allSubjects')}
      </Link>
      {subject.isPending ? (
        <PageSpinner />
      ) : !subject.data ? (
        // Ma'lumot mavjud bo'lsa (fon qayta so'rovi muvaffaqiyatsiz bo'lsa ham) undan render
        // qilinadi — xato holati faqat ma'lumot umuman yo'q bo'lsa ko'rsatiladi.
        <ErrorState
          error={subject.error}
          onRetry={canRetry(subject.error) ? () => void subject.refetch() : undefined}
        />
      ) : (
        <SubjectBody subject={subject.data} />
      )}
    </div>
  )
}

function SubjectBody({ subject }: { subject: SubjectDetail }) {
  const { t } = useTranslation()
  const { title, description, topics } = subject
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-slate-600">{description}</p>}
      </header>
      {topics.length === 0 ? (
        <EmptyState icon="🧩" title={t('student.noTopics')} />
      ) : (
        <ol className="flex flex-col gap-4">
          {topics.map((topic, index) => {
            const done = topic.progress.total > 0 && topic.progress.completed >= topic.progress.total
            return (
              <li key={topic.id} className={cx('w-full md:max-w-md', OFFSETS[index % OFFSETS.length])}>
                <Link
                  to={`/app/topics/${topic.id}`}
                  className={cx(
                    'flex items-center gap-4 rounded-2xl border-2 border-slate-100 bg-white p-4 transition hover:border-brand-200 hover:shadow-md',
                    FOCUS_RING,
                  )}
                >
                  <ProgressRing completed={topic.progress.completed} total={topic.progress.total} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('student.topicNumber', { number: index + 1 })}
                    </span>
                    <span className="font-bold">{topic.title}</span>
                  </span>
                  {done && (
                    <Badge tone="green">
                      <span aria-hidden="true">✓</span> {t('student.topicDone')}
                    </Badge>
                  )}
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}
