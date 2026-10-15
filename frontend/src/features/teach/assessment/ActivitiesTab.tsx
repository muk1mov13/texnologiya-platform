import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useDeleteActivity,
  usePublishActivity,
  useReorderActivities,
  useStepActivities,
} from '@/api/teachAssessment'
import type { ActivityTeach, ActivityType, TeachLayout } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { DataList, ListRow, RowIcon } from '@/features/admin/ui/DataList'
import { EmptyBlock } from '@/features/admin/ui/EmptyBlock'
import { IconAction } from '@/features/admin/ui/IconAction'
import { cellKey, type CellKey } from '@/features/student/assessment/crossword'
import { cx, FOCUS_RING } from '@/lib/cx'
import { AddSection } from '../AddSection'
import { ActivityEditor } from './ActivityEditor'

const ICONS: Record<ActivityType, IconName> = { quiz: 'quiz', yesno: 'check', crossword: 'grid' }
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
          <div className="flex flex-col gap-6">
            {items.length === 0 ? (
              <EmptyBlock icon="quiz" title={t('activityEditor.empty')} text={t('activityEditor.emptyText')} />
            ) : (
              <DataList flat>
                {items.map((activity, index) =>
                  editing?.kind === 'edit' && editing.id === activity.id ? (
                    <li key={activity.id} aria-label={activity.title} className="bg-slate-50/70 px-5 py-4 sm:px-6">
                      <ActivityEditor
                        topicId={topicId}
                        stepId={stepId}
                        type={activity.type}
                        initial={activity}
                        onDone={closeEditor}
                      />
                    </li>
                  ) : (
                    <ListRow
                      key={activity.id}
                      aria-label={activity.title}
                      leading={<RowIcon icon={ICONS[activity.type]} tone={activity.is_published ? 'brand' : 'slate'} />}
                      title={activity.title}
                      meta={
                        <>
                          {t(`activity.${activity.type}`)} ·{' '}
                          {t('activityEditor.itemsCount', { count: activity.items.length })}
                        </>
                      }
                      badges={
                        <Badge dot tone={activity.is_published ? 'green' : 'amber'}>
                          {activity.is_published ? t('common.published') : t('common.draft')}
                        </Badge>
                      }
                      actions={
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={publish.isPending && publish.variables.id === activity.id}
                            onClick={() => publish.mutate({ id: activity.id, published: !activity.is_published })}
                          >
                            {activity.is_published ? t('activityEditor.unpublish') : t('activityEditor.publish')}
                          </Button>
                          <span className="flex items-center">
                            <IconAction
                              icon="arrowUp"
                              label={t('activityEditor.moveUp')}
                              disabled={index === 0 || reorder.isPending}
                              onClick={() => move(index, -1)}
                            />
                            <IconAction
                              icon="arrowDown"
                              label={t('activityEditor.moveDown')}
                              disabled={index === items.length - 1 || reorder.isPending}
                              onClick={() => move(index, 1)}
                            />
                            {activity.layout && (
                              <IconAction
                                icon="eye"
                                label={t('activityEditor.preview')}
                                pressed={previewId === activity.id}
                                onClick={() => setPreviewId(previewId === activity.id ? null : activity.id)}
                              />
                            )}
                            <IconAction
                              icon="pencil"
                              label={t('common.edit')}
                              onClick={() => setEditing({ kind: 'edit', id: activity.id })}
                            />
                            <IconAction icon="trash" label={t('common.delete')} onClick={() => setToDelete(activity)} />
                          </span>
                        </>
                      }
                      below={
                        activity.layout &&
                        previewId === activity.id && (
                          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                            <CrosswordPreview layout={activity.layout} />
                          </div>
                        )
                      }
                    />
                  ),
                )}
              </DataList>
            )}
            {editing?.kind === 'new' ? (
              <AddSection title={t(NEW_LABELS[editing.type])}>
                <ActivityEditor topicId={topicId} stepId={stepId} type={editing.type} onDone={closeEditor} />
              </AddSection>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {(['quiz', 'yesno', 'crossword'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEditing({ kind: 'new', type })}
                    className={cx(
                      'group flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700',
                      'transition-colors hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-800 motion-reduce:transition-none',
                      FOCUS_RING,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200/70 transition-colors group-hover:bg-white group-hover:text-brand-700 motion-reduce:transition-none"
                    >
                      <Icon name={ICONS[type]} className="size-4" />
                    </span>
                    <span className="flex-1">{t(NEW_LABELS[type])}</span>
                    <Icon name="plus" className="size-4 text-slate-400 group-hover:text-brand-600" />
                  </button>
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
