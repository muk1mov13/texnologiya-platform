import { lazy, Suspense, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { materialFileUrl, useDeleteMaterial, useRetryMaterial, useUploadMaterial } from '@/api/teach'
import type { Material, StepEditor } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { PageSpinner, Spinner } from '@/components/ui/Spinner'
import { pushToast } from '@/components/ui/toast-store'
import { DataList, ListRow, RowIcon } from '@/features/admin/ui/DataList'
import { EmptyBlock } from '@/features/admin/ui/EmptyBlock'
import { IconAction } from '@/features/admin/ui/IconAction'
import { cx } from '@/lib/cx'
import { formatSize } from '@/lib/format'

// PdfViewer (react-pdf + pdf.js) og'ir: faqat "Ko'rish" bosilganda yuklanadi.
const PdfViewer = lazy(() => import('@/features/student/PdfViewer').then((module) => ({ default: module.PdfViewer })))

const EXTENSIONS = ['.pdf', '.ppt', '.pptx', '.doc', '.docx']
const ACCEPT = EXTENSIONS.join(',')

function hasAllowedExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Fayl nomidan kengaytmasiz sarlavha (nom maydoni bo'sh bo'lsa taklif sifatida). */
function titleFromFile(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim()
}

export function MaterialsTab({ topicId, step }: { topicId: number; step: StepEditor }) {
  const { t, i18n } = useTranslation()
  const upload = useUploadMaterial(topicId)
  const remove = useDeleteMaterial(topicId)
  const retry = useRetryMaterial(topicId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [toDelete, setToDelete] = useState<Material | null>(null)
  const [viewing, setViewing] = useState<Material | null>(null)
  const titleId = `material-title-${step.id}`
  const fileId = `material-file-${step.id}`
  const canSubmit = file !== null && title.trim() !== ''

  function pick(next: File | null) {
    setFile(next)
    if (next && !title.trim()) setTitle(titleFromFile(next.name))
  }

  function clearFile() {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files[0]
    if (!dropped) return
    if (!hasAllowedExtension(dropped.name)) {
      pushToast('error', t('teach.materialWrongType'))
      return
    }
    pick(dropped)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file || !title.trim()) return
    upload.mutate(
      { stepId: step.id, title: title.trim(), file },
      {
        onSuccess: () => {
          setTitle('')
          clearFile()
          pushToast('success', t('teach.materialUploaded'))
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {step.materials.length === 0 ? (
        <EmptyBlock icon="pdf" title={t('teach.noMaterials')} text={t('teach.noMaterialsText')} />
      ) : (
        <DataList flat>
          {step.materials.map((material) => (
            <MaterialRow
              key={material.id}
              material={material}
              retrying={retry.isPending && retry.variables === material.id}
              onRetry={() => retry.mutate(material.id)}
              onView={() => setViewing(material)}
              onDelete={() => setToDelete(material)}
            />
          ))}
        </DataList>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60 sm:p-5">
        <h3 className="font-semibold text-slate-900">{t('teach.addMaterial')}</h3>
        {upload.error && <FormError error={upload.error} />}
        <label
          htmlFor={fileId}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-white px-4 py-7 text-center transition-colors motion-reduce:transition-none',
            'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-700',
            dragging ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200 hover:border-brand-300',
          )}
        >
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200/70"
          >
            <Icon name={file ? 'check' : 'arrowUp'} className="size-5" />
          </span>
          {file ? (
            <span className="text-sm">
              <span className="block font-semibold break-all text-slate-900">{file.name}</span>
              <span className="text-slate-500 tabular-nums">{formatSize(file.size, i18n.language)}</span>
            </span>
          ) : (
            <span className="text-sm">
              <span className="block font-semibold text-slate-900">{t('teach.materialDrop')}</span>
              <span className="text-slate-500">{t('teach.materialFileHint')}</span>
            </span>
          )}
          <input
            ref={fileRef}
            id={fileId}
            type="file"
            accept={ACCEPT}
            aria-label={t('teach.materialFile')}
            className="sr-only"
            onChange={(event) => pick(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Field id={titleId} label={t('teach.materialTitle')}>
            <Input id={titleId} value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <div className="flex gap-2">
            {file && (
              <Button variant="ghost" onClick={clearFile}>
                {t('common.cancel')}
              </Button>
            )}
            <Button type="submit" loading={upload.isPending} disabled={!canSubmit}>
              {t('teach.upload')}
            </Button>
          </div>
        </div>
      </form>

      <Modal open={viewing !== null} size="xl" title={viewing?.title ?? ''} onClose={() => setViewing(null)}>
        {viewing && (
          <Suspense fallback={<PageSpinner />}>
            <PdfViewer key={viewing.id} url={materialFileUrl(viewing.id)} title={viewing.title} />
          </Suspense>
        )}
      </Modal>

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
  onView: () => void
  onDelete: () => void
}

function MaterialRow({ material, retrying, onRetry, onView, onDelete }: MaterialRowProps) {
  const { t } = useTranslation()
  const failed = material.status === 'failed'
  return (
    <ListRow
      aria-label={material.title}
      leading={<RowIcon icon="pdf" tone={failed ? 'rose' : material.status === 'ready' ? 'brand' : 'amber'} />}
      title={material.title}
      meta={<span className="break-all">{material.original_name}</span>}
      extra={
        failed && (
          <p className="mt-1 text-sm text-red-700">
            {t(`materialErrors.${material.error ?? 'CONVERSION_FAILED'}`, {
              defaultValue: t('materialErrors.CONVERSION_FAILED'),
            })}
          </p>
        )
      }
      badges={
        <>
          {material.status === 'processing' && (
            <Badge dot tone="amber">
              <Spinner size="sm" decorative /> {t('teach.status.processing')}
            </Badge>
          )}
          {material.status === 'ready' && (
            <Badge dot tone="green">
              {t('teach.status.ready')}
              {material.page_count ? ` · ${t('teach.pagesCount', { count: material.page_count })}` : ''}
            </Badge>
          )}
          {failed && (
            <Badge dot tone="red">
              {t('teach.status.failed')}
            </Badge>
          )}
        </>
      }
      actions={
        <>
          {failed && (
            <Button variant="secondary" size="sm" loading={retrying} onClick={onRetry}>
              <Icon name="refresh" className="size-4" />
              {t('common.retry')}
            </Button>
          )}
          {material.status === 'ready' && (
            <IconAction icon="eye" label={t('teach.viewMaterial')} onClick={onView} />
          )}
          <IconAction
            icon="trash"
            label={t('common.delete')}
            disabled={material.status === 'processing'}
            onClick={onDelete}
          />
        </>
      }
    />
  )
}
