import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLiteratureMutations } from '@/api/teach'
import type { LiteratureIn, LiteratureItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { DataList, ListRow, RowIcon } from '@/features/admin/ui/DataList'
import { EmptyBlock } from '@/features/admin/ui/EmptyBlock'
import { IconAction } from '@/features/admin/ui/IconAction'
import { AddSection } from './AddSection'
import { literatureSchema, type LiteratureValues } from './schemas'

function toPayload(values: LiteratureValues): LiteratureIn {
  return {
    title: values.title,
    author: values.author,
    year: values.year === '' ? null : Number(values.year),
    url: values.url === '' ? null : values.url,
  }
}

const EMPTY: LiteratureValues = { title: '', author: '', year: '', url: '' }

export function LiteratureTab({ topicId, items }: { topicId: number; items: LiteratureItem[] }) {
  const { t } = useTranslation()
  const { add, update, remove } = useLiteratureMutations(topicId)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<LiteratureItem | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {items.length === 0 ? (
        <EmptyBlock icon="library" title={t('teach.noLiterature')} text={t('teach.noLiteratureText')} />
      ) : (
        <DataList flat>
          {items.map((item) =>
            editingId === item.id ? (
              <li key={item.id} aria-label={item.title} className="bg-slate-50/70 px-5 py-4 sm:px-6">
                <LiteratureForm
                  idPrefix={`literature-${item.id}`}
                  initial={{
                    title: item.title,
                    author: item.author,
                    year: item.year === null ? '' : String(item.year),
                    url: item.url ?? '',
                  }}
                  submitLabel={t('common.save')}
                  pending={update.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(values) =>
                    update.mutate({ id: item.id, data: toPayload(values) }, { onSuccess: () => setEditingId(null) })
                  }
                />
              </li>
            ) : (
              <ListRow
                key={item.id}
                aria-label={item.title}
                className="items-start"
                leading={<RowIcon icon="book" tone="brand" />}
                title={item.title}
                meta={
                  (item.author || item.year) && (
                    <span className="text-slate-600">{[item.author, item.year].filter(Boolean).join(' · ')}</span>
                  )
                }
                extra={
                  item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm break-all text-brand-700 hover:underline"
                    >
                      {item.url}
                    </a>
                  )
                }
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
      <AddSection title={t('teach.addLiterature')}>
        <LiteratureForm
          idPrefix="literature-new"
          initial={EMPTY}
          submitLabel={t('common.add')}
          pending={add.isPending}
          onSubmit={(values, reset) => add.mutate(toPayload(values), { onSuccess: reset })}
        />
      </AddSection>
      <ConfirmDialog
        open={toDelete !== null}
        title={t('teach.deleteLiteratureTitle')}
        text={t('teach.deleteItemText', { title: toDelete?.title ?? '' })}
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

interface LiteratureFormProps {
  idPrefix: string
  initial: LiteratureValues
  submitLabel: string
  pending: boolean
  onSubmit: (values: LiteratureValues, reset: () => void) => void
  onCancel?: () => void
}

function LiteratureForm({ idPrefix, initial, submitLabel, pending, onSubmit, onCancel }: LiteratureFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LiteratureValues>({ resolver: zodResolver(literatureSchema), defaultValues: initial })

  return (
    <form
      noValidate
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={handleSubmit((values) => onSubmit(values, () => reset(EMPTY)))}
    >
      <div className="sm:col-span-2">
        <Field id={`${idPrefix}-title`} label={t('teach.litTitle')} error={errors.title?.message}>
          <Input id={`${idPrefix}-title`} aria-invalid={Boolean(errors.title)} {...register('title')} />
        </Field>
      </div>
      <Field id={`${idPrefix}-author`} label={t('teach.litAuthor')} error={errors.author?.message}>
        <Input id={`${idPrefix}-author`} aria-invalid={Boolean(errors.author)} {...register('author')} />
      </Field>
      <Field id={`${idPrefix}-year`} label={t('teach.litYear')} error={errors.year?.message}>
        <Input id={`${idPrefix}-year`} inputMode="numeric" aria-invalid={Boolean(errors.year)} {...register('year')} />
      </Field>
      <div className="sm:col-span-2">
        <Field id={`${idPrefix}-url`} label={t('teach.litUrl')} error={errors.url?.message}>
          <Input id={`${idPrefix}-url`} type="url" aria-invalid={Boolean(errors.url)} {...register('url')} />
        </Field>
      </div>
      <div className="flex gap-2 sm:col-span-2">
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
