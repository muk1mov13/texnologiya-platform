import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAdminFaq, useCreateFaq, useDeleteFaq, useSwapFaq, useUpdateFaq } from '@/api/adminCms'
import type { FaqItem } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { DataList } from '../ui/DataList'
import { IconAction } from '../ui/IconAction'
import { ListSkeleton } from '../ui/ListSkeleton'
import { PageHeader } from '../ui/PageHeader'
import { faqSchema, type FaqValues } from './schemas'

/** `item === null` — yangi savol (`order` — oxiriga). */
type Editing = { item: FaqItem | null; order: number }

function FaqForm({ editing, onDone }: { editing: Editing; onDone: () => void }) {
  const { t } = useTranslation()
  const create = useCreateFaq()
  const update = useUpdateFaq({ silent: true })
  const { item } = editing
  const mutation = item ? update : create
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FaqValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: { question: item?.question ?? '', answer: item?.answer ?? '', is_published: item?.is_published ?? true },
  })

  function onSubmit(values: FaqValues) {
    if (item) update.mutate({ id: item.id, data: values }, { onSuccess: onDone })
    else create.mutate({ ...values, order: editing.order }, { onSuccess: onDone })
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {mutation.error && <FormError error={mutation.error} />}
      <Field id="faq-question" label={t('adminFaq.question')} error={errors.question?.message}>
        <Input id="faq-question" maxLength={500} {...register('question')} />
      </Field>
      <Field id="faq-answer" label={t('adminFaq.answer')} error={errors.answer?.message}>
        <Textarea id="faq-answer" rows={6} maxLength={5000} {...register('answer')} />
      </Field>
      <Checkbox label={t('adminFaq.publishedLabel')} {...register('is_published')} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}

export function AdminFaqPage() {
  const { t } = useTranslation()
  const query = useAdminFaq()
  const swap = useSwapFaq()
  const toggle = useUpdateFaq()
  const remove = useDeleteFaq()
  const [editing, setEditing] = useState<Editing | null>(null)
  const [deleting, setDeleting] = useState<FaqItem | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="help"
        eyebrow={t('navGroups.site')}
        title={t('adminFaq.title')}
        subtitle={t('adminFaq.subtitle')}
        actions={
          <Button
            disabled={!query.data}
            onClick={() =>
              setEditing({ item: null, order: (query.data ?? []).reduce((max, i) => Math.max(max, i.order + 1), 0) })
            }
          >
            <Icon name="plus" className="size-4" />
            {t('adminFaq.new')}
          </Button>
        }
      />
      <QueryState query={query} loading={<ListSkeleton />}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState icon="help" title={t('faq.empty')} />
          ) : (
            <DataList>
              {items.map((item, index) => {
                const prev = items[index - 1]
                const next = items[index + 1]
                return (
                  <li
                    key={item.id}
                    className="flex gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70 motion-reduce:transition-none sm:px-6"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700 tabular-nums ring-1 ring-brand-200/70"
                    >
                      {index + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-start gap-2">
                        <h2 className="min-w-0 flex-1 font-semibold break-words text-slate-900">{item.question}</h2>
                        <Badge dot tone={item.is_published ? 'green' : 'slate'}>
                          {item.is_published ? t('common.published') : t('common.draft')}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-pretty whitespace-pre-line text-slate-600">{item.answer}</p>
                      <div className="flex flex-wrap items-center gap-1">
                        <IconAction
                          icon="arrowUp"
                          label={t('adminLibrary.moveUp', { title: item.question })}
                          disabled={!prev || swap.isPending}
                          onClick={() => prev && swap.mutate([prev, item])}
                        />
                        <IconAction
                          icon="arrowDown"
                          label={t('adminLibrary.moveDown', { title: item.question })}
                          disabled={!next || swap.isPending}
                          onClick={() => next && swap.mutate([item, next])}
                        />
                        <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />
                        <Checkbox
                          className="mx-2"
                          label={t('common.published')}
                          checked={item.is_published}
                          disabled={toggle.isPending}
                          onChange={(event) => toggle.mutate({ id: item.id, data: { is_published: event.target.checked } })}
                        />
                        <span className="ml-auto flex gap-0.5">
                          <IconAction
                            icon="pencil"
                            label={`${t('common.edit')}: ${item.question}`}
                            onClick={() => setEditing({ item, order: item.order })}
                          />
                          <IconAction
                            icon="trash"
                            label={`${t('common.delete')}: ${item.question}`}
                            onClick={() => setDeleting(item)}
                          />
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </DataList>
          )
        }
      </QueryState>
      <Modal
        open={editing !== null}
        title={t(editing?.item ? 'adminFaq.editTitle' : 'adminFaq.new')}
        onClose={() => setEditing(null)}
      >
        {editing && <FaqForm key={editing.item?.id ?? 'new'} editing={editing} onDone={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog
        open={deleting !== null}
        title={t('adminFaq.deleteTitle')}
        text={t('adminFaq.deleteText', { title: deleting?.question ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
      />
    </div>
  )
}
