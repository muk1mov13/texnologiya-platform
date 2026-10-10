import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCompleteStep, useStep } from '@/api/student'
import type { GlossaryTerm, LiteratureItem, MaterialView, StepBrief, StepKind } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-classes'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { PageSpinner } from '@/components/ui/Spinner'
import { cx, FOCUS_RING } from '@/lib/cx'
import { FILE_KINDS, SELF_COMPLETE_KINDS } from '@/lib/steps'

// PdfViewer (react-pdf + pdf.js) alohida chunk'ga ajratiladi — asosiy bundle faqat lecture/
// presentation bosqichida kerak bo'lgan ~1 MB'lik kodni yuklamaydi. `PlayerPage` bu chunk'ni
// mount bo'lishi bilan oldindan yuklaydi (`import('./PdfViewer')`), shuning uchun odatda
// Suspense fallback faqat bir lahzaga ko'rinadi.
const PdfViewer = lazy(() => import('./PdfViewer').then((module) => ({ default: module.PdfViewer })))

interface StepContentViewProps {
  topicId: number
  step: StepBrief
  nextKind?: StepKind
}

export function StepContentView({ topicId, step, nextKind }: StepContentViewProps) {
  const { t } = useTranslation()
  // Mavzu ro'yxati bosqichni kontentsiz deb bilsa, so'rov yuborilmaydi: GET /api/steps/{id}
  // bo'sh bosqich uchun ham StepProgress(in_progress) qatorini yaratadi (backend progress.py
  // _get_or_create_progress) — 2-bosqichda bu qatorlar bosqich "boshlangan" deb noto'g'ri
  // o'qilishi mumkin edi.
  const content = useStep(step.has_content ? step.id : undefined)
  const complete = useCompleteStep(topicId)

  const empty = <EmptyState icon="🗂️" title={t('player.noContent')} text={t('player.noContentText')} />
  // Kontentsiz bosqichda so'rov o'chiq (abadiy `isPending`) — QueryState'ga yuborilmaydi.
  if (!step.has_content) return empty

  return (
    <QueryState query={content}>
      {(data) =>
        // Bosqich kontenti ENDI yuklangan ma'lumot (`data.has_content`) asosida aniqlanadi — mavzu
        // ro'yxatidagi `step.has_content` eskirgan bo'lishi mumkin (masalan, material endigina
        // o'chirilgan — bu holda `data` yuklangan, ammo `has_content` yolg'on).
        !data.has_content ? (
          empty
        ) : (
          <div className="flex flex-col gap-6">
            {FILE_KINDS.has(data.kind) && <FileMaterials materials={data.materials} />}
            {data.kind === 'glossary' && <GlossaryList items={data.glossary} />}
            {data.kind === 'literature' && <LiteratureList items={data.literature} />}
            {SELF_COMPLETE_KINDS.has(data.kind) && (
              <div className="flex flex-wrap items-center gap-3 border-t-2 border-slate-100 pt-4">
                {data.status === 'completed' ? (
                  <Badge tone="green">✓ {t('player.completed')}</Badge>
                ) : (
                  <Button loading={complete.isPending} onClick={() => complete.mutate(step.id)}>
                    {t('player.complete')}
                  </Button>
                )}
                {nextKind && (
                  <Link to={`/app/topics/${topicId}/${nextKind}`} className={buttonClasses('secondary')}>
                    {t('player.next')} →
                  </Link>
                )}
              </div>
            )}
          </div>
        )
      }
    </QueryState>
  )
}

/**
 * Bitta vaqtda faqat bitta material (PDF) chiziladi: bir nechta material bo'lsa, tanlagich
 * ko'rsatiladi — aks holda hamma PDF bir vaqtda yuklab olinib, ikki nusxa xotirada saqlanardi.
 */
function FileMaterials({ materials }: { materials: MaterialView[] }) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState(materials[0]?.id)
  if (materials.length === 0) return null
  const selected = materials.find((material) => material.id === selectedId) ?? materials[0]
  return (
    <div className="flex flex-col gap-4">
      {materials.length > 1 && (
        <div role="group" aria-label={t('player.materials')} className="flex flex-wrap gap-2">
          {materials.map((material) => {
            const isSelected = material.id === selected.id
            return (
              <button
                key={material.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(material.id)}
                className={cx(
                  'rounded-xl border-2 px-3 py-1.5 text-sm font-semibold transition',
                  isSelected
                    ? 'border-brand-700 bg-brand-100 text-brand-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  FOCUS_RING,
                )}
              >
                {material.title}
              </button>
            )
          })}
        </div>
      )}
      <Suspense fallback={<PageSpinner />}>
        <PdfViewer key={selected.id} url={selected.file_url} title={selected.title} />
      </Suspense>
    </div>
  )
}

function GlossaryList({ items }: { items: GlossaryTerm[] }) {
  return (
    <dl className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border-2 border-slate-100 bg-white p-4">
          <dt className="font-bold text-brand-900">{item.term}</dt>
          <dd className="mt-1 text-slate-700">{item.definition}</dd>
        </div>
      ))}
    </dl>
  )
}

function LiteratureList({ items }: { items: LiteratureItem[] }) {
  const { t } = useTranslation()
  return (
    <ol className="flex list-decimal flex-col gap-3 pl-6">
      {items.map((item) => (
        <li key={item.id} className="pl-1">
          <span className="font-semibold">{item.title}</span>
          {(item.author || item.year) && (
            <span className="text-slate-600"> — {[item.author, item.year].filter(Boolean).join(', ')}</span>
          )}
          {item.url && (
            <>
              {' '}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 hover:underline"
              >
                {t('player.openLink')}
              </a>
            </>
          )}
        </li>
      ))}
    </ol>
  )
}
