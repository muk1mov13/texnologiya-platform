import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/api/auth'
import { useBookCategories, useUploadBook } from '@/api/library'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { pushToast } from '@/components/ui/toast-store'
import { DOC_ACCEPT, FILE_INPUT_CLASS, IMAGE_ACCEPT } from '@/lib/files'
import { bookUploadSchema, type BookUploadValues } from './schemas'

export function BookUploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal open={open} title={t('myBooks.uploadTitle')} onClose={onClose}>
      {open && <BookUploadForm onDone={onClose} />}
    </Modal>
  )
}

function BookUploadForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const upload = useUploadBook()
  const categories = useBookCategories()
  const listId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [fileMissing, setFileMissing] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookUploadValues>({
    resolver: zodResolver(bookUploadSchema),
    defaultValues: { category: '', title: '', author: '' },
  })

  function onSubmit(values: BookUploadValues) {
    if (!file) {
      setFileMissing(true)
      return
    }
    upload.mutate(
      { ...values, file, cover },
      {
        onSuccess: (book) => {
          pushToast('success', t(book.is_approved ? 'myBooks.uploadedApproved' : 'myBooks.uploadedPending'))
          onDone()
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {upload.error && <FormError error={upload.error} />}
      <p className="text-sm text-slate-600">
        {t(user?.role === 'admin' ? 'myBooks.adminNotice' : 'myBooks.teacherNotice')}
      </p>
      <Field id="book-title" label={t('myBooks.titleLabel')} error={errors.title?.message}>
        <Input id="book-title" maxLength={300} {...register('title')} />
      </Field>
      <Field id="book-author" label={t('myBooks.authorLabel')} error={errors.author?.message}>
        <Input id="book-author" maxLength={200} {...register('author')} />
      </Field>
      <Field
        id="book-category"
        label={t('myBooks.categoryLabel')}
        hint={t('myBooks.categoryHint')}
        error={errors.category?.message}
      >
        <Input id="book-category" list={listId} maxLength={100} autoComplete="off" {...register('category')} />
      </Field>
      <datalist id={listId}>
        {(categories.data ?? []).map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      <Field
        id="book-file"
        label={t('myBooks.fileLabel')}
        hint={t('myBooks.fileHint')}
        error={fileMissing && !file ? 'myBooks.fileRequired' : undefined}
      >
        <Input
          id="book-file"
          type="file"
          accept={DOC_ACCEPT}
          className={FILE_INPUT_CLASS}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </Field>
      <Field id="book-cover" label={t('myBooks.coverLabel')} hint={t('myBooks.coverHint')}>
        <Input
          id="book-cover"
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
        <Button type="submit" loading={upload.isPending}>
          {t('myBooks.upload')}
        </Button>
      </div>
    </form>
  )
}
