import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLiteratureMutations } from '@/api/teach'
import type { LiteratureIn, LiteratureItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
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
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="text-slate-500">{t('teach.noLiterature')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} aria-label={item.title} className="rounded-xl border-2 border-slate-100 bg-white p-3">
              {editingId === item.id ? (
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
              ) : (
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold">{item.title}</p>
                    {(item.author || item.year) && (
                      <p className="text-slate-600">{[item.author, item.year].filter(Boolean).join(', ')}</p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm break-all text-brand-700 hover:underline"
                      >
                        {item.url}
                      </a>
                    )}
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
        <h3 className="mb-3 font-semibold">{t('teach.addLiterature')}</h3>
        <LiteratureForm
          idPrefix="literature-new"
          initial={EMPTY}
          submitLabel={t('common.add')}
          pending={add.isPending}
          onSubmit={(values, reset) => add.mutate(toPayload(values), { onSuccess: reset })}
        />
      </section>
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
