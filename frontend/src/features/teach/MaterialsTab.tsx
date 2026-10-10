import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteMaterial, useRetryMaterial, useUploadMaterial } from '@/api/teach'
import type { Material, StepEditor } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { pushToast } from '@/components/ui/toast-store'

const ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx'

export function MaterialsTab({ topicId, step }: { topicId: number; step: StepEditor }) {
  const { t } = useTranslation()
  const upload = useUploadMaterial(topicId)
  const remove = useDeleteMaterial(topicId)
  const retry = useRetryMaterial(topicId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [toDelete, setToDelete] = useState<Material | null>(null)
  const titleId = `material-title-${step.id}`
  const fileId = `material-file-${step.id}`
  const canSubmit = file !== null && title.trim() !== ''

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file || !title.trim()) return
    upload.mutate(
      { stepId: step.id, title: title.trim(), file },
      {
        onSuccess: () => {
          setTitle('')
          setFile(null)
          if (fileRef.current) fileRef.current.value = ''
          pushToast('success', t('teach.materialUploaded'))
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {upload.error && (
          <div className="sm:col-span-3">
            <FormError error={upload.error} />
          </div>
        )}
        <Field id={titleId} label={t('teach.materialTitle')}>
          <Input id={titleId} value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field id={fileId} label={t('teach.materialFile')} hint={t('teach.materialFileHint')}>
          <Input
            ref={fileRef}
            id={fileId}
            type="file"
            accept={ACCEPT}
            className="file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:font-semibold"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </Field>
        <Button type="submit" loading={upload.isPending} disabled={!canSubmit}>
          {t('teach.upload')}
        </Button>
      </form>
      {step.materials.length === 0 ? (
        <p className="text-slate-500">{t('teach.noMaterials')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {step.materials.map((material) => (
            <MaterialRow
              key={material.id}
              material={material}
              retrying={retry.isPending && retry.variables === material.id}
              onRetry={() => retry.mutate(material.id)}
              onDelete={() => setToDelete(material)}
            />
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title={t('teach.deleteMaterialTitle')}
        text={t('teach.deleteMaterialText', { title: toDelete?.title ?? '' })}
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

interface MaterialRowProps {
  material: Material
  retrying: boolean
  onRetry: () => void
  onDelete: () => void
}

function MaterialRow({ material, retrying, onRetry, onDelete }: MaterialRowProps) {
  const { t } = useTranslation()
  return (
    <li
      aria-label={material.title}
      className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-slate-100 bg-white px-4 py-3"
    >
      <div className="min-w-40 flex-1">
        <p className="font-semibold">{material.title}</p>
        <p className="text-sm text-slate-500">{material.original_name}</p>
        {material.status === 'failed' && (
          <p className="mt-1 text-sm text-red-700">
            {t(`materialErrors.${material.error ?? 'CONVERSION_FAILED'}`, {
              defaultValue: t('materialErrors.CONVERSION_FAILED'),
            })}
          </p>
        )}
      </div>
      {material.status === 'processing' && (
        <Badge tone="amber">
          <Spinner size="sm" decorative /> {t('teach.status.processing')}
        </Badge>
      )}
      {material.status === 'ready' && (
        <Badge tone="green">
          {t('teach.status.ready')}
          {material.page_count ? ` · ${t('teach.pagesCount', { count: material.page_count })}` : ''}
        </Badge>
      )}
      {material.status === 'failed' && (
        <>
          <Badge tone="red">{t('teach.status.failed')}</Badge>
          <Button variant="secondary" size="sm" loading={retrying} onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </>
      )}
      <Button variant="ghost" size="sm" disabled={material.status === 'processing'} onClick={onDelete}>
        {t('common.delete')}
      </Button>
    </li>
  )
}
