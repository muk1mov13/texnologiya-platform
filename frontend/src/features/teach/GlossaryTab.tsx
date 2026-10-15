import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useGlossaryMutations } from '@/api/teach'
import type { GlossaryTerm } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { DataList, ListRow, RowIcon } from '@/features/admin/ui/DataList'
import { EmptyBlock } from '@/features/admin/ui/EmptyBlock'
import { IconAction } from '@/features/admin/ui/IconAction'
import { AddSection } from './AddSection'
import { glossarySchema, type GlossaryValues } from './schemas'

export function GlossaryTab({ topicId, items }: { topicId: number; items: GlossaryTerm[] }) {
  const { t } = useTranslation()
  const { add, update, remove } = useGlossaryMutations(topicId)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<GlossaryTerm | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {items.length === 0 ? (
        <EmptyBlock icon="glossary" title={t('teach.noGlossary')} text={t('teach.noGlossaryText')} />
      ) : (
        <DataList flat>
          {items.map((item) =>
            editingId === item.id ? (
              <li key={item.id} aria-label={item.term} className="bg-slate-50/70 px-5 py-4 sm:px-6">
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
              </li>
            ) : (
              <ListRow
                key={item.id}
                aria-label={item.term}
                className="items-start"
                leading={<RowIcon icon="glossary" tone="brand" />}
                title={item.term}
                meta={<span className="text-pretty text-slate-600">{item.definition}</span>}
                actions={
                  <>
                    <IconAction icon="pencil" label={t('common.edit')} onClick={() => setEditingId(item.id)} />
                    <IconAction icon="trash" label={t('common.delete')} onClick={() => setToDelete(item)} />
                  </>
                }
              />
            ),
          )}
        </DataList>
      )}
      <AddSection title={t('teach.addTerm')}>
        <GlossaryForm
          idPrefix="glossary-new"
          submitLabel={t('common.add')}
          pending={add.isPending}
          onSubmit={(values, reset) => add.mutate(values, { onSuccess: reset })}
        />
      </AddSection>
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
  initial?: Pick<GlossaryTerm, 'term' | 'definition'>
  submitLabel: string
  pending: boolean
  onSubmit: (values: GlossaryValues, reset: () => void) => void
  onCancel?: () => void
}

/** Bitta atama formasi; AI glossariy qoralamasi muharriri ham ishlatadi. */
export function GlossaryForm({ idPrefix, initial, submitLabel, pending, onSubmit, onCancel }: GlossaryFormProps) {
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
