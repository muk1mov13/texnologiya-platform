import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useSubject } from '@/api/student'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { PageSpinner } from '@/components/ui/Spinner'
import { cx } from '@/lib/cx'

// Katta ekranda mavzular chap-o'ng siljib, yo'l (path) shaklini hosil qiladi.
const OFFSETS = ['sm:ml-0', 'sm:ml-24', 'sm:ml-48', 'sm:ml-24']

export function SubjectPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const subject = useSubject(slug)

  if (subject.isPending) return <PageSpinner />
  if (subject.isError) return <ErrorState error={subject.error} onRetry={() => void subject.refetch()} />

  const { title, description, topics } = subject.data
  return (
    <div className="flex flex-col gap-6">
      <Link to="/app" className="text-sm font-semibold text-brand-700 hover:underline">
        ← {t('student.allSubjects')}
      </Link>
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
              <li key={topic.id} className={cx('w-full sm:max-w-md', OFFSETS[index % OFFSETS.length])}>
                <Link
                  to={`/app/topics/${topic.id}`}
                  className="flex items-center gap-4 rounded-2xl border-2 border-slate-100 bg-white p-4 transition hover:border-brand-200 hover:shadow-md"
                >
                  <ProgressRing completed={topic.progress.completed} total={topic.progress.total} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('student.topicNumber', { number: index + 1 })}
                    </span>
                    <span className="font-bold">{topic.title}</span>
                  </span>
                  {done && <Badge tone="green">✓ {t('student.topicDone')}</Badge>}
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
