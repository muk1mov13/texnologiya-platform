import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useReplaceBookCover, useUpdateBook } from '@/api/adminCms'
import type { BookAdmin } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { pushToast } from '@/components/ui/toast-store'
import { FILE_INPUT_CLASS, IMAGE_ACCEPT } from '@/lib/files'
import { bookEditSchema, type BookEditValues } from './schemas'

export function BookEditModal({ book, onClose }: { book: BookAdmin | null; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal open={book !== null} title={t('adminBooks.editTitle')} onClose={onClose}>
      {book && <BookEditForm book={book} onDone={onClose} />}
    </Modal>
  )
}

function BookEditForm({ book, onDone }: { book: BookAdmin; onDone: () => void }) {
  const { t } = useTranslation()
  const update = useUpdateBook({ silent: true })
  const replaceCover = useReplaceBookCover()
  const [cover, setCover] = useState<File | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookEditValues>({
    resolver: zodResolver(bookEditSchema),
    defaultValues: { title: book.title, author: book.author, category: book.category },
  })

  // Avval matn, keyin (tanlangan bo'lsa) muqova: muqova xatosi matn o'zgarishini bekor qilmaydi.
  function onSubmit(values: BookEditValues) {
    update.mutate(
      { id: book.id, data: values },
      {
        onSuccess: () => {
          if (!cover) {
            pushToast('success', t('adminBooks.saved'))
            onDone()
            return
          }
          replaceCover.mutate(
            { id: book.id, cover },
            {
              onSuccess: () => {
                pushToast('success', t('adminBooks.saved'))
                onDone()
              },
            },
          )
        },
      },
    )
  }

  const error = update.error ?? replaceCover.error
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && <FormError error={error} />}
      <Field id="edit-book-title" label={t('myBooks.titleLabel')} error={errors.title?.message}>
        <Input id="edit-book-title" maxLength={300} {...register('title')} />
      </Field>
      <Field id="edit-book-author" label={t('myBooks.authorLabel')} error={errors.author?.message}>
        <Input id="edit-book-author" maxLength={200} {...register('author')} />
      </Field>
      <Field id="edit-book-category" label={t('myBooks.categoryLabel')} error={errors.category?.message}>
        <Input id="edit-book-category" maxLength={100} {...register('category')} />
      </Field>
      <Field
        id="edit-book-cover"
        label={t(book.has_cover ? 'adminBooks.replaceCover' : 'adminBooks.addCover')}
        hint={t('myBooks.coverHint')}
      >
        <Input
          id="edit-book-cover"
          type="file"
          accept={IMAGE_ACCEPT}
          className={FILE_INPUT_CLASS}
          onChange={(event) => setCover(event.target.files?.[0] ?? null)}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={update.isPending || replaceCover.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
