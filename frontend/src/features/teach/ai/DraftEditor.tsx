import { useTranslation } from 'react-i18next'
import { useUpdateDraft } from '@/api/teachAi'
import type { ActivityTeach, AiDraft, GlossaryIn, TaskIn } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { ActivityEditor } from '../assessment/ActivityEditor'
import { TaskForm } from '../assessment/TaskTab'
import { DraftGlossaryEditor } from './DraftGlossaryEditor'

interface DraftEditorProps {
  draft: AiDraft
  topicId: number
  onDone: () => void
}

/**
 * Qoralamani mavjud muharrirlar bilan tahrirlash: saqlash `PUT /teach/ai/drafts/{id}` ga boradi
 * (backend payload'ni o'sha kirish sxemalari bilan tekshiradi), haqiqiy yozuv faqat tasdiqlashda.
 */
export function DraftEditor({ draft, topicId, onDone }: DraftEditorProps) {
  const { t } = useTranslation()
  const update = useUpdateDraft(topicId)
  const pending = update.isPending
  const error = update.isError ? update.error : null
  const payload = draft.payload ?? {}

  const saveRaw = (data: Record<string, unknown>, onError?: (error: unknown) => void) =>
    update.mutate({ id: draft.id, payload: data }, { onSuccess: onDone, onError })

  if (draft.kind === 'glossary') {
    const items = Array.isArray(payload.items) ? (payload.items as GlossaryIn[]) : []
    return (
      <DraftGlossaryEditor
        items={items}
        pending={pending}
        error={error}
        onSave={(terms) => saveRaw({ items: terms })}
        onCancel={onDone}
      />
    )
  }

  if (draft.kind === 'task') {
    return (
      <div className="flex flex-col gap-2">
        <TaskForm
          topicId={topicId}
          stepId={draft.step_id}
          task={null}
          draft={{
            initial: payload as unknown as TaskIn,
            saver: { save: (data) => saveRaw({ ...data }), pending, error },
          }}
        />
        <Button size="sm" variant="secondary" className="self-start" onClick={onDone}>
          {t('common.cancel')}
        </Button>
      </div>
    )
  }

  return (
    <ActivityEditor
      topicId={topicId}
      stepId={draft.step_id}
      type={draft.kind}
      initial={payload as unknown as Pick<ActivityTeach, 'title' | 'items'>}
      saver={{
        save: (data, onError) => saveRaw({ title: data.title, items: data.items }, onError),
        pending,
        error,
      }}
      onDone={onDone}
    />
  )
}
