import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useCreateTopic, useDeleteTopic, useReorderTopics, useTeachSubjects } from '@/api/teach'
import type { TeachSubject, TeachTopicBrief } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { canRetry } from '@/api/errors'

export function TeachHomePage() {
  const { t } = useTranslation()
  const subjects = useTeachSubjects()

  // (a) Xato bo'lsa ham, oldin yuklangan ma'lumot bo'lsa o'shani ko'rsatamiz — fon
  // yangilanishi muvaffaqiyatsiz bo'lsa, allaqachon ko'rsatilgan ro'yxat yo'qolmaydi.
  if (subjects.data === undefined) {
    if (subjects.isPending) return <PageSpinner />
    if (subjects.isError) {
      return (
        <ErrorState
          error={subjects.error}
          onRetry={canRetry(subjects.error) ? () => void subjects.refetch() : undefined}
        />
      )
    }
  }

  const data = subjects.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('teach.title')}</h1>
      {data.length === 0 ? (
        <EmptyState icon="🧑‍🏫" title={t('teach.noSubjects')} text={t('teach.noSubjectsText')} />
      ) : (
        data.map((subject) => <SubjectTopics key={subject.id} subject={subject} />)
      )}
    </div>
  )
}

function PublishedBadge({ published }: { published: boolean }) {
  const { t } = useTranslation()
  return <Badge tone={published ? 'green' : 'amber'}>{published ? t('common.published') : t('common.draft')}</Badge>
}

function SubjectTopics({ subject }: { subject: TeachSubject }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateTopic(subject.id)
  const reorder = useReorderTopics(subject.id)
  const remove = useDeleteTopic()
  const [title, setTitle] = useState('')
  const [toDelete, setToDelete] = useState<TeachTopicBrief | null>(null)
  const inputId = `new-topic-${subject.id}`
  const topics = subject.topics
  // (d) Suriladigan mavzuning tugmasiga fokusni saqlab qolish uchun: so'rov tugab, ro'yxat
  // yangi tartibda qayta chiqgach, shu mavzuning tugmasiga fokus qaytariladi (klaviatura
  // foydalanuvchilari uchun). Buferlangan qiymat ro'yxat o'zgarganda quyidagi effectda ishlatiladi.
  const pendingFocusRef = useRef<{ topicId: number; direction: 'up' | 'down' } | null>(null)

  function moveButtonId(topicId: number, direction: 'up' | 'down') {
    return `teach-move-${direction}-${topicId}`
  }

  function move(index: number, delta: -1 | 1) {
    if (reorder.isPending) return
    const direction: 'up' | 'down' = delta === -1 ? 'up' : 'down'
    const topic = topics[index]
    const ids = topics.map((t) => t.id)
    const target = index + delta
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    pendingFocusRef.current = { topicId: topic.id, direction }
    reorder.mutate(ids)
  }

  useEffect(() => {
    const pending = pendingFocusRef.current
    if (!pending) return
    const { topicId, direction } = pending
    if (!topics.some((t) => t.id === topicId)) return
    const other: 'up' | 'down' = direction === 'up' ? 'down' : 'up'
    const button =
      document.getElementById(moveButtonId(topicId, direction)) ??
      document.getElementById(moveButtonId(topicId, other))
    button?.focus()
    pendingFocusRef.current = null
  }, [topics])

  function onCreate(event: FormEvent) {
    event.preventDefault()
    const value = title.trim()
    if (value.length < 2) return
    create.mutate(
      { title: value },
      {
        onSuccess: (topic) => {
          setTitle('')
          void navigate(`/teach/topics/${topic.id}`)
        },
      },
    )
  }

  return (
    <Card className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{subject.title}</h2>
        <PublishedBadge published={subject.is_published} />
      </header>
      {topics.length === 0 ? (
        <p className="text-slate-500">{t('teach.noTopics')}</p>
      ) : (
        <ol className="flex flex-col divide-y-2 divide-slate-100">
          {topics.map((topic, index) => (
            <li key={topic.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="w-6 text-sm font-bold text-slate-400">{index + 1}</span>
              <Link to={`/teach/topics/${topic.id}`} className="min-w-40 flex-1 font-semibold hover:text-brand-700">
                {topic.title}
              </Link>
              <PublishedBadge published={topic.is_published} />
              <Button
                id={moveButtonId(topic.id, 'up')}
                variant="ghost"
                size="sm"
                aria-label={t('teach.moveUp', { title: topic.title })}
                disabled={index === 0 || reorder.isPending}
                onClick={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                id={moveButtonId(topic.id, 'down')}
                variant="ghost"
                size="sm"
                aria-label={t('teach.moveDown', { title: topic.title })}
                disabled={index === topics.length - 1 || reorder.isPending}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('teach.deleteTopic', { title: topic.title })}
                onClick={() => setToDelete(topic)}
              >
                🗑️
              </Button>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={onCreate} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          {t('teach.newTopicLabel')}
        </label>
        <Input
          id={inputId}
          value={title}
          maxLength={200}
          placeholder={t('teach.newTopicPlaceholder')}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Button type="submit" className="shrink-0" loading={create.isPending} disabled={title.trim().length < 2}>
          {t('teach.addTopic')}
        </Button>
      </form>
      <ConfirmDialog
        open={toDelete !== null}
        title={t('teach.deleteTopicTitle')}
        text={t('teach.deleteTopicText', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }}
      />
    </Card>
  )
}
