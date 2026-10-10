import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router'
import { canRetry } from '@/api/errors'
import { useTopic } from '@/api/student'
import type { StepBrief } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { PageSpinner } from '@/components/ui/Spinner'
import { cx, FOCUS_RING } from '@/lib/cx'
import { isStepKind, STEP_ICONS } from '@/lib/steps'
import { StepContentView } from './StepContent'

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

  if (!Number.isInteger(topicId) || topicId <= 0) return <EmptyState icon="🧭" title={t('notFound.title')} />
  if (topic.isPending) return <PageSpinner />
  // Ma'lumot mavjud bo'lsa (fon qayta so'rovi muvaffaqiyatsiz bo'lsa ham) undan render
  // qilinadi — xato holati faqat ma'lumot umuman yo'q bo'lsa ko'rsatiladi.
  if (!topic.data) {
    return <ErrorState error={topic.error} onRetry={canRetry(topic.error) ? () => void topic.refetch() : undefined} />
  }

  const { steps } = topic.data
  if (!isStepKind(params.kind)) {
    const first = steps.find((step) => step.has_content) ?? steps[0]
    return <Navigate to={`/app/topics/${topicId}/${first.kind}`} replace />
  }
  const index = steps.findIndex((step) => step.kind === params.kind)
  const current = steps[index]
  const next = steps.slice(index + 1).find((step) => step.has_content)

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/app/subjects/${topic.data.subject.slug}`}
        className={cx('text-sm font-semibold text-brand-700 hover:underline', FOCUS_RING)}
      >
        ← {topic.data.subject.title}
      </Link>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <ProgressRing completed={topic.data.progress.completed} total={topic.data.progress.total} size={48} />
              <h1 className="font-bold leading-tight">{topic.data.title}</h1>
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
