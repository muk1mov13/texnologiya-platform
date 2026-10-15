import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useTeachSubjects } from '@/api/teach'
import { useTeachStats } from '@/api/teachAssessment'
import type { TeachSubject } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Select } from '@/components/ui/Field'
import { QueryState } from '@/components/ui/QueryState'
import { PageHeader } from '@/features/admin/ui/PageHeader'

/** O'qituvchi statistikasi: tanlangan fan mavzulari bo'yicha talabalar faolligi va natijasi. */
export function StatsPage() {
  const { t } = useTranslation()
  const subjects = useTeachSubjects()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon="chart" eyebrow={t('navGroups.learning')} title={t('stats.title')} />
      <QueryState query={subjects}>
        {(data) =>
          data.length === 0 ? (
            <EmptyState icon="🧑‍🏫" title={t('teach.noSubjects')} text={t('teach.noSubjectsText')} />
          ) : (
            <SubjectStats subjects={data} />
          )
        }
      </QueryState>
    </div>
  )
}

function SubjectStats({ subjects }: { subjects: TeachSubject[] }) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  // Tanlangan fan manzilda saqlanadi; noto'g'ri yoki yo'q bo'lsa, birinchi fan olinadi.
  const subjectId =
    subjects.find((subject) => String(subject.id) === searchParams.get('subject'))?.id ?? subjects[0].id
  const stats = useTeachStats(subjectId)

  return (
    <Card className="flex flex-col gap-4 p-5">
      <Field id="stats-subject" label={t('stats.subject')}>
        <Select
          id="stats-subject"
          value={subjectId}
          onChange={(event) => setSearchParams({ subject: event.target.value }, { replace: true })}
          className="sm:max-w-sm"
        >
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.title}
            </option>
          ))}
        </Select>
      </Field>
      <QueryState query={stats}>
        {(rows) =>
          rows.length === 0 ? (
            <p className="text-slate-500">{t('stats.empty')}</p>
          ) : (
            // Telefon ekranida jadval sahifani emas, faqat o'z konteynerini suradi.
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b-2 border-slate-100 text-slate-500">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {t('stats.topic')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      {t('stats.started')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      {t('stats.completed')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      {t('stats.avg')}
                    </th>
                    <th scope="col" className="py-2 pl-3 text-right font-semibold">
                      {t('stats.pending')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.topic_id} className="border-b border-slate-100 last:border-0">
                      <th scope="row" className="py-2 pr-3 font-semibold">
                        {row.topic_title}
                      </th>
                      <td className="px-3 py-2 text-right tabular-nums">{row.started}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.completed}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {row.avg_best_percent === null ? '—' : `${Math.round(row.avg_best_percent)}%`}
                      </td>
                      <td className="py-2 pl-3 text-right tabular-nums">{row.pending_submissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryState>
    </Card>
  )
}
