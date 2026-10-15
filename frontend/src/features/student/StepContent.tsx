import { lazy, Suspense, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCompleteStep, useStep } from '@/api/student'
import type { GlossaryTerm, LiteratureItem, MaterialView, StepBrief, StepKind } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/icons/Icon'
import { buttonClasses } from '@/components/ui/button-classes'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { SURFACE_SM } from '@/components/ui/styles'
import { PageSpinner } from '@/components/ui/Spinner'
import { cx, FOCUS_RING } from '@/lib/cx'
import { ACTIVITY_KINDS, FILE_KINDS, SELF_COMPLETE_KINDS } from '@/lib/steps'
import { ActivityList } from './assessment/ActivityList'
import { TaskStep } from './assessment/TaskStep'

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

  const empty = <EmptyState icon="folder" title={t('player.noContent')} text={t('player.noContentText')} />
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
            {ACTIVITY_KINDS.has(data.kind) && (
              <ActivityList topicId={topicId} stepId={data.id} activities={data.activities} />
            )}
            {data.kind === 'task' && data.task && (
              <TaskStep topicId={topicId} stepId={data.id} task={data.task} submission={data.submission} />
            )}
            {(ACTIVITY_KINDS.has(data.kind) || data.kind === 'task') && nextKind && (
              <StepFooter>
                <NextLink topicId={topicId} kind={nextKind} primary />
              </StepFooter>
            )}
            {SELF_COMPLETE_KINDS.has(data.kind) && (
              <StepFooter>
                {data.status === 'completed' ? (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200/70">
                    <Icon name="check" className="size-4" />
                    {t('player.completed')}
                  </span>
                ) : (
                  <Button loading={complete.isPending} onClick={() => complete.mutate(step.id)}>
                    {!complete.isPending && <Icon name="check" className="size-4" />}
                    {t('player.complete')}
                  </Button>
                )}
                {nextKind && <NextLink topicId={topicId} kind={nextKind} primary={data.status === 'completed'} />}
              </StepFooter>
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
                  'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition motion-reduce:transition-none',
                  isSelected
                    ? 'bg-brand-50 text-brand-900 ring-2 ring-brand-600'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300',
                  FOCUS_RING,
                )}
              >
                <Icon name="pdf" className="size-4" />
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
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className={cx(SURFACE_SM, 'relative overflow-hidden p-4 pl-5')}>
          <span aria-hidden="true" className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-brand-400 to-brand-700" />
          <dt className="font-bold tracking-tight text-brand-900">{item.term}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-pretty text-slate-700">{item.definition}</dd>
        </div>
      ))}
    </dl>
  )
}

function LiteratureList({ items }: { items: LiteratureItem[] }) {
  const { t } = useTranslation()
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={item.id} className={cx(SURFACE_SM, 'flex items-start gap-4 p-4')}>
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-800 tabular-nums ring-1 ring-brand-200/70"
          >
            {index + 1}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-semibold text-balance text-slate-900">{item.title}</span>
            {(item.author || item.year) && (
              <span className="text-sm text-slate-600">{[item.author, item.year].filter(Boolean).join(', ')}</span>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cx(
                  'mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline',
                  FOCUS_RING,
                )}
              >
                {t('player.openLink')}
                <Icon name="externalLink" className="size-3.5" />
              </a>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Bosqich ostidagi amallar paneli ("Tugatdim", "Keyingi bosqich"). */
function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className={cx(SURFACE_SM, 'flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4')}>
      {children}
    </div>
  )
}

function NextLink({ topicId, kind, primary = false }: { topicId: number; kind: StepKind; primary?: boolean }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/app/topics/${topicId}/${kind}`}
      className={buttonClasses(primary ? 'primary' : 'secondary', 'md', 'group ml-auto')}
    >
      {t('player.next')}
      <Icon
        name="arrowRight"
        className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </Link>
  )
}
