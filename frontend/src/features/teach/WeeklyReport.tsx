import { useTranslation } from 'react-i18next'
import { useAiUsage } from '@/api/ai'
import { useAiReports } from '@/api/teachAi'
import { plainText } from '@/lib/plainText'

/**
 * Fan bo'yicha oxirgi haftalik AI tahlili (yig'iladigan blok). Hisobot yo'q, AI o'chiq yoki
 * so'rov xato bo'lsa hech narsa chizilmaydi — bosh sahifa buzilmaydi.
 */
export function WeeklyReport({ subjectId }: { subjectId: number }) {
  const { t, i18n } = useTranslation()
  const usage = useAiUsage()
  const reports = useAiReports(subjectId, Boolean(usage.data?.enabled))
  const latest = reports.data?.[0]
  if (!latest) return null

  const format = (day: string) => new Date(day).toLocaleDateString(i18n.language)

  return (
    <details className="rounded-2xl border-2 border-brand-100 bg-brand-50/50 p-4">
      <summary className="cursor-pointer font-semibold text-brand-900">
        <span aria-hidden="true">📊 </span>
        {t('aiReport.title', { from: format(latest.period_start), to: format(latest.period_end) })}
      </summary>
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{plainText(latest.content)}</p>
    </details>
  )
}
