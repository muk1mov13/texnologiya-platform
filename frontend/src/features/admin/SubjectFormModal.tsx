import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useCreateSubject, useUpdateSubject } from '@/api/admin'
import type { SubjectAdmin } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { pushToast } from '@/components/ui/toast-store'
import { subjectSchema, type SubjectValues } from './schemas'

interface SubjectFormModalProps {
  open: boolean
  /** null — yangi fan yaratiladi. */
  subject: SubjectAdmin | null
  onClose: () => void
}

export function SubjectFormModal({ open, subject, onClose }: SubjectFormModalProps) {
  const { t } = useTranslation()
  return (
    <Modal open={open} title={subject ? t('admin.subjects.editTitle') : t('admin.subjects.newTitle')} onClose={onClose}>
      <SubjectForm key={subject?.id ?? 'new'} subject={subject} onDone={onClose} />
    </Modal>
  )
}

function SubjectForm({ subject, onDone }: { subject: SubjectAdmin | null; onDone: () => void }) {
  const { t } = useTranslation()
  const create = useCreateSubject()
  const update = useUpdateSubject({ silent: true })
  const mutation = subject ? update : create
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubjectValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      title: subject?.title ?? '',
      slug: subject?.slug ?? '',
      description: subject?.description ?? '',
      order: subject?.order ?? 0,
      is_published: subject?.is_published ?? false,
    },
  })

  function onSubmit(values: SubjectValues) {
    const onSuccess = () => {
      pushToast('success', t('admin.subjects.saved'))
      onDone()
    }
    if (subject) {
      // Bo'sh slug yuborilmaydi: backend `None`ni "o'zgartirmaslik" deb tushunadi.
      update.mutate({ id: subject.id, data: { ...values, slug: values.slug || null } }, { onSuccess })
    } else {
      create.mutate({ ...values, slug: values.slug || null }, { onSuccess })
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {mutation.error && <FormError error={mutation.error} />}
      <Field id="subject-title" label={t('admin.subjects.titleLabel')} error={errors.title?.message}>
        <Input id="subject-title" aria-invalid={Boolean(errors.title)} {...register('title')} />
      </Field>
      <Field
        id="subject-slug"
        label={t('admin.subjects.slugLabel')}
        hint={t('admin.subjects.slugHint')}
        error={errors.slug?.message}
      >
        <Input id="subject-slug" aria-invalid={Boolean(errors.slug)} {...register('slug')} />
      </Field>
      <Field id="subject-description" label={t('admin.subjects.descriptionLabel')} error={errors.description?.message}>
        <Textarea id="subject-description" rows={3} {...register('description')} />
      </Field>
      <Field id="subject-order" label={t('admin.subjects.orderLabel')} error={errors.order?.message}>
        <Input
          id="subject-order"
          type="number"
          min={0}
          aria-invalid={Boolean(errors.order)}
          {...register('order', { valueAsNumber: true })}
        />
      </Field>
      <Checkbox label={t('admin.subjects.publishedLabel')} {...register('is_published')} />
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
