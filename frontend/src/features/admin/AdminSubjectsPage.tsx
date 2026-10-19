import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useAdminSubjects,
  useDeleteSubject,
  useDeleteSyllabus,
  useUpdateSubject,
  useUploadSyllabus,
} from '@/api/admin'
import type { SubjectAdmin } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { pushToast } from '@/components/ui/toast-store'
import { cx } from '@/lib/cx'
import { useProtectedDownload } from '@/lib/download'
import { SubjectFormModal } from './SubjectFormModal'
import { ListSkeleton } from './ui/ListSkeleton'
import { PageHeader } from './ui/PageHeader'

export function AdminSubjectsPage() {
  const { t } = useTranslation()
  const subjects = useAdminSubjects()
  const update = useUpdateSubject()
  const remove = useDeleteSubject()
  const [editing, setEditing] = useState<SubjectAdmin | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<SubjectAdmin | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="layers"
        eyebrow={t('navGroups.learning')}
        title={t('admin.subjects.title')}
        subtitle={t('admin.subjects.subtitle')}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Icon name="plus" className="size-4" />
            {t('admin.subjects.new')}
          </Button>
        }
      />
      <QueryState query={subjects} loading={<ListSkeleton rows={3} />}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState icon="layers" title={t('admin.subjects.empty')} />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {list.map((subject) => (
                <li
                  key={subject.id}
                  aria-label={subject.title}
                  className="flex flex-col rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70 transition hover:ring-brand-200 motion-reduce:transition-none"
                >
                  <div className="flex items-start gap-4 p-5 sm:p-6">
                    <span
                      aria-hidden="true"
                      className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-sm font-extrabold text-white tabular-nums shadow-glow-sm"
                    >
                      {subject.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-bold tracking-tight break-words text-slate-900">{subject.title}</p>
                        <Badge dot tone={subject.is_published ? 'green' : 'amber'}>
                          {subject.is_published ? t('common.published') : t('common.draft')}
                        </Badge>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">/{subject.slug}</p>
                      {subject.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-pretty text-slate-600">{subject.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mx-5 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/60 sm:mx-6">
                    <SyllabusControls subject={subject} />
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 p-5 pt-4 sm:px-6">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={update.isPending && update.variables?.id === subject.id}
                      onClick={() => update.mutate({ id: subject.id, data: { is_published: !subject.is_published } })}
                    >
                      <Icon name={subject.is_published ? 'eyeOff' : 'eye'} className="size-4" />
                      {subject.is_published ? t('admin.subjects.unpublish') : t('admin.subjects.publish')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(subject)}>
                      <Icon name="pencil" className="size-4" />
                      {t('common.edit')}
                    </Button>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setToDelete(subject)}>
                      <Icon name="trash" className="size-4" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
      <SubjectFormModal
        open={editing !== null}
        subject={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title={t('admin.subjects.deleteTitle')}
        text={t('admin.subjects.deleteText', { title: toDelete?.title ?? '' })}
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

function SyllabusControls({ subject }: { subject: SubjectAdmin }) {
  const { t } = useTranslation()
  const upload = useUploadSyllabus()
  const remove = useDeleteSyllabus()
  const { download, pending: downloading } = useProtectedDownload()
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = `syllabus-${subject.id}`

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="flex min-w-0 flex-1 items-center gap-2 text-slate-600">
        <Icon name="pdf" className={cx('size-4 shrink-0', subject.syllabus_name ? 'text-brand-600' : 'text-slate-400')} />
        <span className="min-w-0 truncate">
          {subject.syllabus_name
            ? t('admin.subjects.syllabusFile', { name: subject.syllabus_name })
            : t('admin.subjects.syllabusNone')}
        </span>
      </span>
      <label htmlFor={inputId} className="sr-only">
        {t('admin.subjects.syllabusUpload')}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) {
            upload.mutate(
              { id: subject.id, file },
              { onSuccess: () => pushToast('success', t('admin.subjects.syllabusSaved')) },
            )
          }
        }}
      />
      <Button size="sm" variant="secondary" loading={upload.isPending} onClick={() => inputRef.current?.click()}>
        {subject.syllabus_name ? t('admin.subjects.syllabusReplace') : t('admin.subjects.syllabusUpload')}
      </Button>
      {subject.syllabus_name && (
        <Button
          size="sm"
          variant="ghost"
          loading={downloading}
          onClick={() => void download(`/api/subjects/${subject.slug}/syllabus`, subject.syllabus_name ?? 'dastur.pdf')}
        >
          <Icon name="download" className="size-4" />
          {t('admin.subjects.syllabusDownload')}
        </Button>
      )}
      {subject.syllabus_name && (
        <Button size="sm" variant="ghost" loading={remove.isPending} onClick={() => remove.mutate(subject.id)}>
          {t('admin.subjects.syllabusDelete')}
        </Button>
      )}
    </div>
  )
}
