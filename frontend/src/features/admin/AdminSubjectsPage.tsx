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
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { pushToast } from '@/components/ui/toast-store'
import { SubjectFormModal } from './SubjectFormModal'

export function AdminSubjectsPage() {
  const { t } = useTranslation()
  const subjects = useAdminSubjects()
  const update = useUpdateSubject()
  const remove = useDeleteSubject()
  const [editing, setEditing] = useState<SubjectAdmin | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<SubjectAdmin | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin.subjects.title')}</h1>
        <Button onClick={() => setEditing('new')}>{t('admin.subjects.new')}</Button>
      </div>
      <QueryState query={subjects}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState icon="📚" title={t('admin.subjects.empty')} />
          ) : (
            <ul className="flex flex-col gap-3">
              {list.map((subject) => (
                <li
                  key={subject.id}
                  aria-label={subject.title}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-4"
                >
                  <div className="min-w-48 flex-1">
                    <p className="font-semibold">{subject.title}</p>
                    <p className="font-mono text-xs text-slate-500">{subject.slug}</p>
                    <SyllabusControls subject={subject} />
                  </div>
                  <Badge tone={subject.is_published ? 'green' : 'amber'}>
                    {subject.is_published ? t('common.published') : t('common.draft')}
                  </Badge>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={update.isPending && update.variables?.id === subject.id}
                      onClick={() => update.mutate({ id: subject.id, data: { is_published: !subject.is_published } })}
                    >
                      {subject.is_published ? t('admin.subjects.unpublish') : t('admin.subjects.publish')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(subject)}>
                      {t('common.edit')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setToDelete(subject)}>
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
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = `syllabus-${subject.id}`

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-600">
        {subject.syllabus_name
          ? t('admin.subjects.syllabusFile', { name: subject.syllabus_name })
          : t('admin.subjects.syllabusNone')}
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
        <Button size="sm" variant="ghost" loading={remove.isPending} onClick={() => remove.mutate(subject.id)}>
          {t('admin.subjects.syllabusDelete')}
        </Button>
      )}
    </div>
  )
}
