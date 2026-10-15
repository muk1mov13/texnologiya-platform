import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { useSubmissionQueue } from '@/api/teachAssessment'
import type { SubmissionStatus } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/features/admin/ui/PageHeader'
import { cx, FOCUS_RING } from '@/lib/cx'

const STATUSES: readonly SubmissionStatus[] = ['submitted', 'returned', 'graded']

function isStatus(value: string | null): value is SubmissionStatus {
  return value !== null && (STATUSES as readonly string[]).includes(value)
}

/** O'qituvchi tekshirish navbati: holat bo'yicha talabalar javoblari. */
export function ReviewQueuePage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const status: SubmissionStatus = isStatus(statusParam) ? statusParam : 'submitted'
  const queue = useSubmissionQueue(status)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon="clipboard" eyebrow={t('navGroups.learning')} title={t('review.title')} />
      <Card className="p-0 sm:p-0">
        <div className="px-4 pt-3 sm:px-5">
          <Tabs
            label={t('review.title')}
            value={status}
            onChange={(next) => setSearchParams({ status: next }, { replace: true })}
            items={STATUSES.map((id) => ({ id, label: t(`review.tab.${id}`) }))}
          />
        </div>
        <div className="px-4 pb-5 sm:px-5">
          <TabPanel id={status}>
            <QueryState query={queue}>
              {(items) =>
                items.length === 0 ? (
                  <EmptyState icon="📭" title={t('review.empty')} />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {items.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={`/teach/review/${item.id}`}
                          className={cx(
                            'flex flex-col gap-1 rounded-xl border-2 border-slate-100 bg-white p-3 transition hover:border-brand-200',
                            FOCUS_RING,
                          )}
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="flex-1 font-semibold">{item.student_name}</span>
                            {item.is_late && <Badge tone="amber">{t('task.late')}</Badge>}
                          </span>
                          <span className="text-sm text-slate-700">{item.task_title}</span>
                          <span className="text-sm text-slate-500">
                            {item.subject_title} · {item.topic_title} ·{' '}
                            {new Date(item.submitted_at).toLocaleString(i18n.language)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              }
            </QueryState>
          </TabPanel>
        </div>
      </Card>
    </div>
  )
}
