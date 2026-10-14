import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useSubject } from '@/api/student'
import type { SubjectDetail, TopicCard } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'
import { useProtectedDownload } from '@/lib/download'
import { LESSON_TYPES } from '@/lib/lessonType'

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
      <QueryState query={subject}>{(data) => <SubjectBody subject={data} />}</QueryState>
    </div>
  )
}

function SubjectBody({ subject }: { subject: SubjectDetail }) {
  const { t } = useTranslation()
  const { title, description, topics, slug, syllabus_name } = subject
  const syllabus = useProtectedDownload()
  const groups = LESSON_TYPES.map((type) => ({
    type,
    topics: topics.filter((topic) => topic.lesson_type === type),
  })).filter((group) => group.topics.length > 0)
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-slate-600">{description}</p>}
        {syllabus_name && (
          <div>
            <Button
              size="sm"
              variant="secondary"
              loading={syllabus.pending}
              onClick={() => void syllabus.download(`/api/subjects/${slug}/syllabus`, syllabus_name)}
            >
              <span aria-hidden="true">📄</span> {t('student.syllabus')}
            </Button>
          </div>
        )}
      </header>
      {topics.length === 0 ? (
        <EmptyState icon="🧩" title={t('student.noTopics')} />
      ) : groups.length === 1 ? (
        // Bitta tur (masalan, faqat ma'ruzalar) bo'lsa guruh sarlavhasi kerak emas.
        <TopicPath topics={groups[0].topics} />
      ) : (
        groups.map((group) => (
          <section key={group.type} aria-labelledby={`group-${group.type}`} className="flex flex-col gap-4">
            <h2 id={`group-${group.type}`} className="text-xl font-bold">
              {t(`student.lessonGroups.${group.type}`)}
            </h2>
            <TopicPath topics={group.topics} />
          </section>
        ))
      )}
    </>
  )
}

function TopicPath({ topics }: { topics: TopicCard[] }) {
  const { t } = useTranslation()
  return (
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
                  {t(`student.topicLabel.${topic.lesson_type}`, { number: index + 1 })}
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
  )
}
