import { useEffect, useRef, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router'
import { useTopic } from '@/api/student'
import type { StepBrief, TopicDetail } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { QueryState } from '@/components/ui/QueryState'
import { BACK_LINK } from '@/components/ui/styles'
import { cx, FOCUS_RING } from '@/lib/cx'
import { isStepKind, STEP_ICON_NAMES } from '@/lib/steps'
import { StepContentView } from './StepContent'
import { TutorDock } from './tutor/TutorDock'

export function PlayerPage() {
  const { t } = useTranslation()
  const params = useParams()
  const topicId = Number(params.topicId)
  const topic = useTopic(topicId)

  // Fokus/scroll effekti uchun joriy bosqich ID'si — ma'lumot hali yuklanmagan bo'lsa undefined.
  // Hook'lar har renderda bir xil tartibda chaqirilishi kerak, shuning uchun bu pastdagi
  // "early return"lardan OLDIN hisoblanadi.
  const previewSteps = topic.data?.steps
  const previewCurrentId =
    previewSteps && isStepKind(params.kind) ? previewSteps.find((step) => step.kind === params.kind)?.id : undefined

  const headingRef = useRef<HTMLHeadingElement>(null)
  const hasFocusedOnceRef = useRef(false)
  useEffect(() => {
    if (previewCurrentId === undefined) return
    if (!hasFocusedOnceRef.current) {
      // Sahifaga birinchi kelishda (yoki yangilashda) fokus o'g'irlanmasin — faqat bosqich
      // ALMASHGANDA (masalan, "Keyingi bosqich") sarlavhaga o'tadi.
      hasFocusedOnceRef.current = true
      return
    }
    headingRef.current?.scrollIntoView({ block: 'start' })
    // `preventScroll`: scroll yuqorida ALLAQACHON `scrollIntoView` bilan bajarildi (u
    // `scroll-mt-*`ni hisobga oladi) — fokus o'zi yana scroll qilsa, brauzer header ostini
    // nishonlab, sarlavhani sticky header orqasiga olib ketishi mumkin edi.
    headingRef.current?.focus({ preventScroll: true })
  }, [previewCurrentId])

  // PdfViewer chunk'ini mavzu/bosqich JSON bilan bir vaqtda oldindan yuklaydi — aks holda
  // JSON -> chunk -> PDF ketma-ket (waterfall) yuklanardi. Xato (`.catch`) shu yerda yutiladi —
  // aks holda tarmoqsiz/eskirgan hash holatida ishlanmagan rad etish (unhandled rejection)
  // bo'lardi. Haqiqiy xato `StepContent`dagi Suspense `import()`i orqali `RouteError`ga chiqadi.
  useEffect(() => {
    void import('./PdfViewer').catch(() => {})
  }, [])

  // Noto'g'ri ID'da so'rov o'chiq (abadiy `isPending`), shuning uchun QueryState'dan oldin ajratiladi.
  if (!Number.isInteger(topicId) || topicId <= 0) return <EmptyState icon="target" title={t('notFound.title')} />
  return (
    <QueryState query={topic}>
      {(data) => <PlayerBody topicId={topicId} kind={params.kind} topic={data} headingRef={headingRef} />}
    </QueryState>
  )
}

interface PlayerBodyProps {
  topicId: number
  kind: string | undefined
  topic: TopicDetail
  headingRef: RefObject<HTMLHeadingElement | null>
}

function PlayerBody({ topicId, kind, topic, headingRef }: PlayerBodyProps) {
  const { t } = useTranslation()
  const { steps } = topic
  // Backend har mavzuga 7 bosqich kafolatlaydi, ammo kafolat buzilsa sahifa yiqilmasin.
  if (steps.length === 0) {
    return <EmptyState icon="folder" title={t('player.noContent')} text={t('player.noContentText')} />
  }
  const index = isStepKind(kind) ? steps.findIndex((step) => step.kind === kind) : -1
  if (index === -1) {
    // Bosqich turi ko'rsatilmagan, noma'lum yoki shu mavzuda yo'q — birinchi kontentli bosqichga.
    const first = steps.find((step) => step.has_content) ?? steps[0]
    return <Navigate to={`/app/topics/${topicId}/${first.kind}`} replace />
  }
  const current = steps[index]
  const next = steps.slice(index + 1).find((step) => step.has_content)

  return (
    <div className="flex flex-col gap-5">
      <Link to={`/app/subjects/${topic.subject.slug}`} className={BACK_LINK}>
        <Icon name="arrowLeft" className="size-4" />
        {topic.subject.title}
      </Link>
      {/* `minmax(0,1fr)`: aks holda bosqichlar ro'yxati (gorizontal scroll) mobil ustunni kengaytiradi. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[250px_minmax(0,1fr)_340px]">
        <aside className="md:sticky md:top-20 md:self-start">
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-3 px-1">
              <div className="flex items-center gap-3">
                <ProgressRing completed={topic.progress.completed} total={topic.progress.total} size={48} />
                <h1 className="font-bold tracking-tight text-balance leading-tight text-slate-900">{topic.title}</h1>
              </div>
              <ProgressBar
                value={topic.progress.total > 0 ? topic.progress.completed / topic.progress.total : 0}
                className="h-1.5"
              />
            </div>
            {/* `relative`: havolalardagi `sr-only` (absolute) matn scroll konteynerdan chiqib sahifani kengaytirmasin. */}
            <ol
              aria-label={t('player.steps')}
              className="relative -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 md:flex-col md:gap-0.5 md:overflow-visible"
            >
              {steps.map((step) => (
                <li key={step.id} className="shrink-0">
                  <StepLink topicId={topicId} step={step} active={step.id === current.id} />
                </li>
              ))}
            </ol>
          </Card>
        </aside>
        <section aria-labelledby="step-title" className="min-w-0">
          <div className="mb-5 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 ring-1 ring-brand-200/70"
            >
              <Icon name={STEP_ICON_NAMES[current.kind]} className="size-5" />
            </span>
            <h2
              ref={headingRef}
              id="step-title"
              tabIndex={-1}
              // `scroll-mt-28`: AppLayout'ning `sticky top-0` header'i ostida qolmasin (mobil'da
              // nav ikkinchi qatorga tushishi mumkin, shuning uchun zaxira bilan). `outline-none`
              // qoldirilgan, `FOCUS_RING` esa YO'Q — bu dastur fokusi (skript orqali), klaviatura
              // foydalanuvchisi emas, shuning uchun fokus halqasi ko'rsatilmasligi kerak.
              className="scroll-mt-28 text-2xl font-extrabold tracking-tight text-slate-900 outline-none"
            >
              {t(`steps.${current.kind}`)}
            </h2>
          </div>
          <StepContentView key={current.id} topicId={topicId} step={current} nextKind={next?.kind} />
        </section>
        <TutorDock topicId={topicId} />
      </div>
    </div>
  )
}

function StepLink({ topicId, step, active }: { topicId: number; step: StepBrief; active: boolean }) {
  const { t } = useTranslation()
  const completed = step.status === 'completed'
  return (
    <Link
      to={`/app/topics/${topicId}/${step.kind}`}
      aria-current={active ? 'step' : undefined}
      className={cx(
        'relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm whitespace-nowrap transition motion-reduce:transition-none',
        FOCUS_RING,
        // Uch holat o'zaro bir-birini istisno qiladi: faol / oddiy / kontentsiz (xira).
        active
          ? 'bg-brand-50 font-bold text-brand-900 ring-1 ring-brand-200/70'
          : step.has_content
            ? 'font-medium text-slate-700 hover:bg-slate-100'
            : 'text-slate-400 hover:bg-slate-50',
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-0 hidden w-1 rounded-full bg-gradient-to-b from-brand-400 to-brand-700 md:block"
        />
      )}
      <span
        aria-hidden="true"
        className={cx(
          'grid size-7 shrink-0 place-items-center rounded-lg',
          // completed/active bir-biridan ajralib turishi uchun: tugatilgan — gradient + belgi,
          // joriy — oq fon ustida brand ikonka, qolganlari — kulrang.
          completed
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white'
            : active
              ? 'bg-white text-brand-700 ring-1 ring-brand-200'
              : 'bg-slate-100 text-slate-500',
        )}
      >
        <Icon name={completed ? 'check' : STEP_ICON_NAMES[step.kind]} className="size-4" />
      </span>
      {t(`steps.${step.kind}`)}
      {completed && <span className="sr-only"> ({t('player.completed')})</span>}
    </Link>
  )
}
