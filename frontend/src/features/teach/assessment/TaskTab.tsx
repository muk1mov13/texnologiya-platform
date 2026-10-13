import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDeleteTask, useSaveTask, useStepTask } from '@/api/teachAssessment'
import type { TaskOut } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { pushToast } from '@/components/ui/toast-store'
import { fromLocalInput, toLocalInput } from '@/lib/datetime'
import { taskSchema, type TaskValues } from './schemas'

/** Vazifa bosqichidagi yagona topshiriq: yaratish, tahrirlash va o'chirish. */
export function TaskTab({ topicId, stepId }: { topicId: number; stepId: number }) {
  const task = useStepTask(stepId)
  return (
    <QueryState query={task}>
      {/* Yaratilgach yoki o'chirilgach forma yangi qiymatlar bilan qayta yaratiladi. */}
      {(data) => <TaskForm key={data?.id ?? 'new'} topicId={topicId} stepId={stepId} task={data} />}
    </QueryState>
  )
}

function TaskForm({ topicId, stepId, task }: { topicId: number; stepId: number; task: TaskOut | null }) {
  const { t } = useTranslation()
  const save = useSaveTask(topicId, stepId)
  const remove = useDeleteTask(topicId, stepId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      type: task?.type ?? 'both',
      max_score: task?.max_score ?? 10,
      rubric: task?.rubric ?? '',
      deadline: toLocalInput(task?.deadline ?? null),
    },
  })

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { ...values, rubric: values.rubric || null, deadline: fromLocalInput(values.deadline) },
      { onSuccess: () => pushToast('success', t('taskEdit.saved')) },
    ),
  )

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit}>
      {!task && <p className="text-slate-500">{t('taskEdit.empty')}</p>}
      <Field id="task-title" label={t('taskEdit.title')} error={errors.title?.message}>
        <Input id="task-title" {...register('title')} />
      </Field>
      <Field id="task-description" label={t('taskEdit.description')} error={errors.description?.message}>
        <Textarea id="task-description" rows={6} {...register('description')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="task-type" label={t('taskEdit.type')}>
          <Select id="task-type" {...register('type')}>
            <option value="text">{t('taskEdit.typeText')}</option>
            <option value="file">{t('taskEdit.typeFile')}</option>
            <option value="both">{t('taskEdit.typeBoth')}</option>
          </Select>
        </Field>
        <Field id="task-max-score" label={t('taskEdit.maxScore')} error={errors.max_score?.message}>
          <Input id="task-max-score" type="number" min={1} max={100} {...register('max_score', { valueAsNumber: true })} />
        </Field>
        <Field id="task-deadline" label={t('taskEdit.deadline')} hint={t('taskEdit.deadlineHint')} error={errors.deadline?.message}>
          <Input id="task-deadline" type="datetime-local" {...register('deadline')} />
        </Field>
      </div>
      <Field id="task-rubric" label={t('taskEdit.rubric')} error={errors.rubric?.message}>
        <Textarea id="task-rubric" rows={3} {...register('rubric')} />
      </Field>
      {save.isError && <FormError error={save.error} />}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={save.isPending}>
          {t('common.save')}
        </Button>
        {task && (
          <Button variant="secondary" onClick={() => setConfirmDelete(true)}>
            {t('taskEdit.delete')}
          </Button>
        )}
      </div>
      {task && (
        <ConfirmDialog
          open={confirmDelete}
          title={t('taskEdit.deleteTitle')}
          text={t('taskEdit.deleteText', { title: task.title })}
          confirmLabel={t('common.delete')}
          pending={remove.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => remove.mutate(task.id, { onSuccess: () => setConfirmDelete(false) })}
        />
      )}
    </form>
  )
}
