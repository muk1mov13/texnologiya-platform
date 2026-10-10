import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useGlossaryMutations } from '@/api/teach'
import type { GlossaryTerm } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { glossarySchema, type GlossaryValues } from './schemas'

export function GlossaryTab({ topicId, items }: { topicId: number; items: GlossaryTerm[] }) {
  const { t } = useTranslation()
  const { add, update, remove } = useGlossaryMutations(topicId)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<GlossaryTerm | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="text-slate-500">{t('teach.noGlossary')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} aria-label={item.term} className="rounded-xl border-2 border-slate-100 bg-white p-3">
              {editingId === item.id ? (
                <GlossaryForm
                  idPrefix={`glossary-${item.id}`}
                  initial={item}
                  submitLabel={t('common.save')}
                  pending={update.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(values) =>
                    update.mutate({ id: item.id, data: values }, { onSuccess: () => setEditingId(null) })
                  }
                />
              ) : (
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold">{item.term}</p>
                    <p className="text-slate-600">{item.definition}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(item.id)}>
                    {t('common.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(item)}>
                    {t('common.delete')}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <section className="rounded-2xl bg-slate-50 p-4">
        <h3 className="mb-3 font-semibold">{t('teach.addTerm')}</h3>
        <GlossaryForm
          idPrefix="glossary-new"
          submitLabel={t('common.add')}
          pending={add.isPending}
          onSubmit={(values, reset) => add.mutate(values, { onSuccess: reset })}
        />
      </section>
      <ConfirmDialog
        open={toDelete !== null}
        title={t('teach.deleteTermTitle')}
        text={t('teach.deleteItemText', { title: toDelete?.term ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }}
      />
    </div>
  )
}

interface GlossaryFormProps {
  idPrefix: string
  initial?: GlossaryTerm
  submitLabel: string
  pending: boolean
  onSubmit: (values: GlossaryValues, reset: () => void) => void
  onCancel?: () => void
}

function GlossaryForm({ idPrefix, initial, submitLabel, pending, onSubmit, onCancel }: GlossaryFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GlossaryValues>({
    resolver: zodResolver(glossarySchema),
    defaultValues: { term: initial?.term ?? '', definition: initial?.definition ?? '' },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={handleSubmit((values) => onSubmit(values, () => reset({ term: '', definition: '' })))}
    >
      <Field id={`${idPrefix}-term`} label={t('teach.term')} error={errors.term?.message}>
        <Input id={`${idPrefix}-term`} aria-invalid={Boolean(errors.term)} {...register('term')} />
      </Field>
      <Field id={`${idPrefix}-definition`} label={t('teach.definition')} error={errors.definition?.message}>
        <Textarea id={`${idPrefix}-definition`} rows={3} aria-invalid={Boolean(errors.definition)} {...register('definition')} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}
