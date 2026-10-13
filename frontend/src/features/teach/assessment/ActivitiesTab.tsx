import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useDeleteActivity,
  usePublishActivity,
  useReorderActivities,
  useStepActivities,
} from '@/api/teachAssessment'
import type { ActivityTeach, ActivityType, TeachLayout } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { cellKey, type CellKey } from '@/features/student/assessment/crossword'
import { ActivityEditor } from './ActivityEditor'

const ICONS: Record<ActivityType, string> = { quiz: '📝', yesno: '✅', crossword: '🧩' }
const NEW_LABELS: Record<ActivityType, string> = {
  quiz: 'activityEditor.newQuiz',
  yesno: 'activityEditor.newYesNo',
  crossword: 'activityEditor.newCrossword',
}

type Editing = { kind: 'edit'; id: number } | { kind: 'new'; type: ActivityType } | null

/** Takrorlash/amaliyot bosqichidagi faoliyatlar: ro'yxat, nashr, tartib, tahrirlash va o'chirish. */
export function ActivitiesTab({ topicId, stepId }: { topicId: number; stepId: number }) {
  const { t } = useTranslation()
  const activities = useStepActivities(stepId)
  const publish = usePublishActivity(topicId, stepId)
  const remove = useDeleteActivity(topicId, stepId)
  const reorder = useReorderActivities(topicId, stepId)
  const [editing, setEditing] = useState<Editing>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<ActivityTeach | null>(null)

  const closeEditor = () => setEditing(null)

  return (
    <QueryState query={activities}>
      {(items) => {
        const move = (index: number, offset: number) => {
          const ids = items.map((item) => item.id)
          ;[ids[index], ids[index + offset]] = [ids[index + offset], ids[index]]
          reorder.mutate(ids)
        }
        return (
          <div className="flex flex-col gap-4">
            {items.length === 0 ? (
              <p className="text-slate-500">{t('activityEditor.empty')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((activity, index) => (
                  <li
                    key={activity.id}
                    aria-label={activity.title}
                    className="rounded-xl border-2 border-slate-100 bg-white p-3"
                  >
                    {editing?.kind === 'edit' && editing.id === activity.id ? (
                      <ActivityEditor
                        topicId={topicId}
                        stepId={stepId}
                        type={activity.type}
                        initial={activity}
                        onDone={closeEditor}
                      />
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl" aria-hidden="true">
                            {ICONS[activity.type]}
                          </span>
                          <div className="min-w-40 flex-1">
                            <p className="font-semibold">{activity.title}</p>
                            <p className="text-sm text-slate-600">
                              {t(`activity.${activity.type}`)} ·{' '}
                              {t('activityEditor.itemsCount', { count: activity.items.length })}
                            </p>
                          </div>
                          <Badge tone={activity.is_published ? 'green' : 'amber'}>
                            {activity.is_published ? t('common.published') : t('common.draft')}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={publish.isPending && publish.variables.id === activity.id}
                            onClick={() => publish.mutate({ id: activity.id, published: !activity.is_published })}
                          >
                            {activity.is_published ? t('activityEditor.unpublish') : t('activityEditor.publish')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={index === 0 || reorder.isPending}
                            aria-label={t('activityEditor.moveUp')}
                            onClick={() => move(index, -1)}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={index === items.length - 1 || reorder.isPending}
                            aria-label={t('activityEditor.moveDown')}
                            onClick={() => move(index, 1)}
                          >
                            ↓
                          </Button>
                          {activity.layout && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-expanded={previewId === activity.id}
                              onClick={() => setPreviewId(previewId === activity.id ? null : activity.id)}
                            >
                              {t('activityEditor.preview')}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setEditing({ kind: 'edit', id: activity.id })}>
                            {t('common.edit')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setToDelete(activity)}>
                            {t('common.delete')}
                          </Button>
                        </div>
                        {activity.layout && previewId === activity.id && <CrosswordPreview layout={activity.layout} />}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {editing?.kind === 'new' ? (
              <section className="rounded-2xl bg-slate-50 p-4">
                <h3 className="mb-3 font-semibold">{t(NEW_LABELS[editing.type])}</h3>
                <ActivityEditor topicId={topicId} stepId={stepId} type={editing.type} onDone={closeEditor} />
              </section>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(['quiz', 'yesno', 'crossword'] as const).map((type) => (
                  <Button key={type} variant="secondary" size="sm" onClick={() => setEditing({ kind: 'new', type })}>
                    {t(NEW_LABELS[type])}
                  </Button>
                ))}
              </div>
            )}
            <ConfirmDialog
              open={toDelete !== null}
              title={t('activityEditor.deleteTitle')}
              text={t('activityEditor.deleteText', { title: toDelete?.title ?? '' })}
              confirmLabel={t('common.delete')}
              pending={remove.isPending}
              onCancel={() => setToDelete(null)}
              onConfirm={() => {
                if (toDelete) remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
              }}
            />
          </div>
        )
      }}
    </QueryState>
  )
}

/** Saqlangan krossvord to'ri — faqat o'qish uchun, harflar bilan. */
function CrosswordPreview({ layout }: { layout: TeachLayout }) {
  const { t } = useTranslation()
  const letters = new Map<CellKey, string>()
  const numbers = new Map<CellKey, number>()
  for (const word of layout.words) {
    numbers.set(cellKey(word.row, word.col), word.number)
    word.cells.forEach((letter, k) => {
      const key = word.direction === 'across' ? cellKey(word.row, word.col + k) : cellKey(word.row + k, word.col)
      letters.set(key, letter)
    })
  }
  return (
    <div
      role="img"
      aria-label={t('activityEditor.previewLabel')}
      className="mx-auto grid w-full gap-0.5"
      style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 2rem))`, maxWidth: `${layout.cols * 2.1}rem` }}
    >
      {Array.from({ length: layout.rows * layout.cols }, (_, i) => {
        const key = cellKey(Math.floor(i / layout.cols), i % layout.cols)
        const letter = letters.get(key)
        const number = numbers.get(key)
        return (
          <div
            key={key}
            className={
              letter === undefined
                ? 'aspect-square'
                : 'relative flex aspect-square items-center justify-center rounded border-2 border-slate-300 bg-white text-xs font-bold sm:text-sm'
            }
          >
            {number !== undefined && (
              <span className="absolute top-0 left-0.5 text-[0.55rem] font-bold text-slate-500">{number}</span>
            )}
            {letter}
          </div>
        )
      })}
    </div>
  )
}
