import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAddDocument, useCreateFolder, useUpdateDocument, useUpdateFolder } from '@/api/adminCms'
import type { LibraryDocument, LibrarySection } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { DOC_ACCEPT, FILE_INPUT_CLASS } from '@/lib/files'
import { documentSchema, folderSchema, type DocumentValues, type FolderValues } from './schemas'

export interface FolderOption {
  id: number
  label: string
}

/** Papka yaratish (ota papka ixtiyoriy) yoki nomini o'zgartirish. */
export type FolderTarget =
  | { mode: 'create'; section: LibrarySection; parentId: number | null; order: number }
  | { mode: 'rename'; id: number; title: string }

function FormButtons({ pending, onCancel }: { pending: boolean; onCancel: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel}>
        {t('common.cancel')}
      </Button>
      <Button type="submit" loading={pending}>
        {t('common.save')}
      </Button>
    </div>
  )
}

export function FolderModal({ target, onClose }: { target: FolderTarget | null; onClose: () => void }) {
  const { t } = useTranslation()
  const title =
    target?.mode === 'rename'
      ? t('adminLibrary.renameFolder')
      : target?.parentId
        ? t('adminLibrary.newSubfolder')
        : t('adminLibrary.newFolder')
  return (
    <Modal open={target !== null} title={title} onClose={onClose}>
      {target && <FolderForm target={target} onDone={onClose} />}
    </Modal>
  )
}

function FolderForm({ target, onDone }: { target: FolderTarget; onDone: () => void }) {
  const { t } = useTranslation()
  const create = useCreateFolder()
  const update = useUpdateFolder()
  const mutation = target.mode === 'create' ? create : update
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FolderValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: { title: target.mode === 'rename' ? target.title : '' },
  })

  function onSubmit({ title }: FolderValues) {
    if (target.mode === 'create') {
      create.mutate(
        { section: target.section, parent_id: target.parentId, title, order: target.order },
        { onSuccess: onDone },
      )
    } else {
      update.mutate({ id: target.id, data: { title } }, { onSuccess: onDone })
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {mutation.error && <FormError error={mutation.error} />}
      <Field id="folder-title" label={t('adminLibrary.folderTitle')} error={errors.title?.message}>
        <Input id="folder-title" maxLength={200} {...register('title')} />
      </Field>
      <FormButtons pending={mutation.isPending} onCancel={onDone} />
    </form>
  )
}

export function AddDocumentModal({ folderId, onClose }: { folderId: number | null; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal open={folderId !== null} title={t('adminLibrary.addDocument')} onClose={onClose}>
      {folderId !== null && <AddDocumentForm folderId={folderId} onDone={onClose} />}
    </Modal>
  )
}

function AddDocumentForm({ folderId, onDone }: { folderId: number; onDone: () => void }) {
  const { t } = useTranslation()
  const add = useAddDocument()
  const [file, setFile] = useState<File | null>(null)
  const [fileMissing, setFileMissing] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FolderValues>({ resolver: zodResolver(folderSchema), defaultValues: { title: '' } })

  function onFile(next: File | null) {
    setFile(next)
    // Nom bo'sh bo'lsa fayl nomidan (kengaytmasiz) to'ldiriladi.
    if (next && !getValues('title').trim()) setValue('title', next.name.replace(/\.[^.]+$/, ''))
  }

  function onSubmit({ title }: FolderValues) {
    if (!file) {
      setFileMissing(true)
      return
    }
    add.mutate({ folderId, title, file }, { onSuccess: onDone })
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {add.error && <FormError error={add.error} />}
      <Field
        id="document-file"
        label={t('myBooks.fileLabel')}
        hint={t('myBooks.fileHint')}
        error={fileMissing && !file ? 'myBooks.fileRequired' : undefined}
      >
        <Input
          id="document-file"
          type="file"
          accept={DOC_ACCEPT}
          className={FILE_INPUT_CLASS}
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
      </Field>
      <Field id="document-title" label={t('adminLibrary.documentTitle')} error={errors.title?.message}>
        <Input id="document-title" maxLength={300} {...register('title')} />
      </Field>
      <FormButtons pending={add.isPending} onCancel={onDone} />
    </form>
  )
}

interface EditDocumentModalProps {
  document: LibraryDocument | null
  folders: FolderOption[]
  onClose: () => void
}

export function EditDocumentModal({ document, folders, onClose }: EditDocumentModalProps) {
  const { t } = useTranslation()
  return (
    <Modal open={document !== null} title={t('adminLibrary.editDocument')} onClose={onClose}>
      {document && <EditDocumentForm document={document} folders={folders} onDone={onClose} />}
    </Modal>
  )
}

function EditDocumentForm({
  document,
  folders,
  onDone,
}: {
  document: LibraryDocument
  folders: FolderOption[]
  onDone: () => void
}) {
  const { t } = useTranslation()
  const update = useUpdateDocument()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { title: document.title, folder_id: document.folder_id },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((data) => update.mutate({ id: document.id, data }, { onSuccess: onDone }))}
      className="flex flex-col gap-4"
    >
      {update.error && <FormError error={update.error} />}
      <Field id="edit-document-title" label={t('adminLibrary.documentTitle')} error={errors.title?.message}>
        <Input id="edit-document-title" maxLength={300} {...register('title')} />
      </Field>
      <Field id="edit-document-folder" label={t('adminLibrary.folder')}>
        <Select id="edit-document-folder" {...register('folder_id', { valueAsNumber: true })}>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.label}
            </option>
          ))}
        </Select>
      </Field>
      <FormButtons pending={update.isPending} onCancel={onDone} />
    </form>
  )
}
