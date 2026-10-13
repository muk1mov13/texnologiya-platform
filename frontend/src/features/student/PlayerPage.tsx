import { useEffect, useRef, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router'
import { useTopic } from '@/api/student'
import type { StepBrief, TopicDetail } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'
import { isStepKind, STEP_ICONS } from '@/lib/steps'
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
  if (!Number.isInteger(topicId) || topicId <= 0) return <EmptyState icon="🧭" title={t('notFound.title')} />
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
    return <EmptyState icon="🗂️" title={t('player.noContent')} text={t('player.noContentText')} />
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
    <div className="flex flex-col gap-4">
      <Link
        to={`/app/subjects/${topic.subject.slug}`}
        className={cx('text-sm font-semibold text-brand-700 hover:underline', FOCUS_RING)}
      >
        ← {topic.subject.title}
      </Link>
      <div className="grid gap-6 md:grid-cols-[260px_1fr] lg:grid-cols-[240px_1fr_340px]">
        <aside className="md:sticky md:top-20 md:self-start">
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <ProgressRing completed={topic.progress.completed} total={topic.progress.total} size={48} />
              <h1 className="font-bold leading-tight">{topic.title}</h1>
            </div>
            <ol aria-label={t('player.steps')} className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
              {steps.map((step) => (
                <li key={step.id} className="shrink-0">
                  <StepLink topicId={topicId} step={step} active={step.id === current.id} />
                </li>
              ))}
            </ol>
          </Card>
        </aside>
        <section aria-labelledby="step-title" className="min-w-0">
          <h2
            ref={headingRef}
            id="step-title"
            tabIndex={-1}
            // `scroll-mt-28`: AppLayout'ning `sticky top-0` header'i ostida qolmasin (mobil'da
            // nav ikkinchi qatorga tushishi mumkin, shuning uchun zaxira bilan). `outline-none`
            // qoldirilgan, `FOCUS_RING` esa YO'Q — bu dastur fokusi (skript orqali), klaviatura
            // foydalanuvchisi emas, shuning uchun fokus halqasi ko'rsatilmasligi kerak.
            className="mb-4 scroll-mt-28 text-xl font-bold outline-none"
          >
            <span aria-hidden="true">{STEP_ICONS[current.kind]} </span>
            {t(`steps.${current.kind}`)}
          </h2>
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
        'flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm whitespace-nowrap',
        FOCUS_RING,
        // Uch holat o'zaro bir-birini istisno qiladi: faol / oddiy / kontentsiz (xira).
        active
          ? 'bg-brand-100 font-bold text-slate-900'
          : step.has_content
            ? 'text-slate-700 hover:bg-slate-100'
            : 'text-slate-500 hover:bg-slate-100',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
          // completed/active bir-biridan ajralib turishi va o'qilishi uchun: brand-600 (tugatilgan)
          // brand-700 (joriy, faol)dan bir pog'ona yengilroq — ikkisi ham oq matn bilan yetarli kontrastda.
          completed ? 'bg-brand-600 text-white' : active ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-600',
        )}
      >
        {completed ? '✓' : step.order}
      </span>
      {t(`steps.${step.kind}`)}
      {completed && <span className="sr-only"> ({t('player.completed')})</span>}
    </Link>
  )
}
