import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { useTeachSubjects } from '@/api/teach'
import { useTeachStats } from '@/api/teachAssessment'
import type { TopicStats } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Field'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyBlock } from '@/features/admin/ui/EmptyBlock'
import { PageHeader } from '@/features/admin/ui/PageHeader'
import { Panel } from '@/features/admin/ui/Panel'
import { StatCard } from '@/features/admin/ui/StatCard'
import { cx, FOCUS_RING } from '@/lib/cx'
import { completionOf, percent, scoreTone, sortRows, summarize, type SortDir, type SortKey } from './statsSummary'

/** O'qituvchi statistikasi: tanlangan fan mavzulari bo'yicha talabalar faolligi va natijasi. */
export function StatsPage() {
  const { t } = useTranslation()
  const subjects = useTeachSubjects()
  const [searchParams, setSearchParams] = useSearchParams()
  const list = subjects.data ?? []
  // Tanlangan fan manzilda saqlanadi; noto'g'ri yoki yo'q bo'lsa, birinchi fan olinadi.
  const subject = list.find((item) => String(item.id) === searchParams.get('subject')) ?? list[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="chart"
        eyebrow={t('navGroups.learning')}
        title={t('stats.title')}
        subtitle={subject && list.length === 1 ? subject.title : t('stats.subtitle')}
        actions={
          subject &&
          list.length > 1 && (
            <div className="w-full sm:w-64">
              <label htmlFor="stats-subject" className="sr-only">
                {t('stats.subject')}
              </label>
              <Select
                id="stats-subject"
                value={subject.id}
                onChange={(event) => setSearchParams({ subject: event.target.value }, { replace: true })}
              >
                {list.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </div>
          )
        }
      />
      <QueryState query={subjects}>
        {(data) =>
          data.length === 0 || !subject ? (
            <EmptyState icon="🧑‍🏫" title={t('teach.noSubjects')} text={t('teach.noSubjectsText')} />
          ) : (
            <SubjectStats key={subject.id} subjectId={subject.id} />
          )
        }
      </QueryState>
    </div>
  )
}

function SubjectStats({ subjectId }: { subjectId: number }) {
  const { t } = useTranslation()
  const stats = useTeachStats(subjectId)
  const summary = stats.data ? summarize(stats.data) : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon="users"
          label={t('stats.kpi.students')}
          hint={t('stats.kpi.studentsHint')}
          value={summary?.activeStudents}
        />
        <StatCard
          icon="target"
          label={t('stats.kpi.completion')}
          hint={t('stats.kpi.completionHint')}
          value={summary && percent(summary.completionRate)}
        />
        <StatCard
          icon="trophy"
          label={t('stats.kpi.score')}
          hint={t('stats.kpi.scoreHint')}
          value={summary && percent(summary.avgScore)}
        />
        <StatCard
          icon="clipboard"
          tone={summary?.pending ? 'amber' : 'brand'}
          label={t('stats.kpi.pending')}
          value={summary?.pending}
          to={summary?.pending ? '/teach/review' : undefined}
        />
      </div>
      <Panel flush title={t('stats.topicsTitle')} description={t('stats.topicsHint')}>
        <QueryState query={stats} loading={<RowsSkeleton />}>
          {(rows) =>
            rows.length === 0 ? (
              <div className="p-5 sm:p-6">
                <EmptyBlock icon="chart" title={t('stats.empty')} text={t('stats.emptyText')} />
              </div>
            ) : (
              <TopicsTable rows={rows} />
            )
          }
        </QueryState>
      </Panel>
    </div>
  )
}

interface Column {
  key: SortKey
  label: string
  align: 'left' | 'right'
}

/** Mavzular jadvali (`md`+) va telefon uchun kartochkalar; ustun sarlavhasini bosib saralanadi. */
function TopicsTable({ rows }: { rows: TopicStats[] }) {
  const { t } = useTranslation()
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'order', dir: 'asc' })
  const sorted = sortRows(rows, sort.key, sort.dir)
  const columns: Column[] = [
    { key: 'order', label: '#', align: 'left' },
    { key: 'title', label: t('stats.topic'), align: 'left' },
    { key: 'started', label: t('stats.started'), align: 'right' },
    { key: 'completion', label: t('stats.completed'), align: 'left' },
    { key: 'score', label: t('stats.avg'), align: 'right' },
    { key: 'pending', label: t('stats.pending'), align: 'right' },
  ]

  function toggle(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : // Raqamli ustunlarda avval eng kattasi — odatda shu qiziq.
          { key, dir: key === 'order' || key === 'title' ? 'asc' : 'desc' },
    )
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="bg-slate-50/70 text-xs text-slate-500">
          <tr>
            {columns.map((column, index) => {
              const active = sort.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cx(
                    'py-2.5 font-semibold',
                    index === 0 ? 'w-12 pr-2 pl-6' : index === columns.length - 1 ? 'pr-6 pl-3' : 'px-3',
                    column.key === 'completion' && 'w-[30%]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(column.key)}
                    className={cx(
                      'inline-flex items-center gap-1 rounded-md uppercase tracking-wide transition-colors hover:text-slate-900 motion-reduce:transition-none',
                      column.align === 'right' && 'w-full justify-end',
                      active && 'text-slate-900',
                      FOCUS_RING,
                    )}
                  >
                    {column.label}
                    <Icon
                      name={active && sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'}
                      className={cx('size-3.5', active ? 'opacity-100' : 'opacity-0')}
                    />
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((row) => (
            <tr key={row.topic_id} className="transition-colors hover:bg-slate-50/70 motion-reduce:transition-none">
              <td className="py-3.5 pr-2 pl-6 text-slate-400 tabular-nums">{rows.indexOf(row) + 1}</td>
              <th scope="row" className="px-3 py-3.5 font-semibold text-slate-900">
                <TopicLink row={row} />
              </th>
              <td className="px-3 py-3.5 text-right text-slate-700 tabular-nums">{row.started}</td>
              <td className="px-3 py-3.5">
                <Completion row={row} />
              </td>
              <td className="px-3 py-3.5 text-right">
                <ScoreChip value={row.avg_best_percent} />
              </td>
              <td className="py-3.5 pr-6 pl-3 text-right">
                <PendingCount count={row.pending_submissions} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-slate-100 md:hidden">
        {sorted.map((row) => (
          <li key={row.topic_id} className="flex flex-col gap-3 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 font-semibold text-slate-900">
                <span className="mr-1.5 text-sm font-medium text-slate-400 tabular-nums">{rows.indexOf(row) + 1}</span>
                <TopicLink row={row} />
              </p>
              <ScoreChip value={row.avg_best_percent} />
            </div>
            <Completion row={row} />
            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <MobileStat label={t('stats.started')}>{row.started}</MobileStat>
              <MobileStat label={t('stats.pending')}>
                <PendingCount count={row.pending_submissions} />
              </MobileStat>
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

function TopicLink({ row }: { row: TopicStats }) {
  return (
    <Link
      to={`/teach/topics/${row.topic_id}`}
      className={cx('rounded-sm break-words hover:text-brand-700 hover:underline', FOCUS_RING)}
    >
      {row.topic_title}
    </Link>
  )
}

/** Tugatganlar soni va boshlaganlarga nisbatan ingichka progress chizig'i. */
function Completion({ row }: { row: TopicStats }) {
  const { t } = useTranslation()
  const value = completionOf(row)
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={t('stats.completionOf', { title: row.topic_title })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value === null ? undefined : Math.round(value)}
        className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-slate-100"
      >
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className="shrink-0 text-sm text-slate-700 tabular-nums">
        {row.completed}
        <span className="text-slate-400"> · {percent(value)}</span>
      </span>
    </div>
  )
}

const SCORE_TONES = {
  good: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  mid: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  low: 'bg-rose-50 text-rose-800 ring-rose-200/80',
  none: 'text-slate-400 ring-transparent',
} as const

function ScoreChip({ value }: { value: number | null }) {
  return (
    <span
      className={cx(
        'inline-block min-w-12 rounded-lg px-2 py-0.5 text-center text-sm font-semibold tabular-nums ring-1',
        SCORE_TONES[scoreTone(value)],
      )}
    >
      {percent(value)}
    </span>
  )
}

function PendingCount({ count }: { count: number }) {
  const { t } = useTranslation()
  if (count === 0) return <span className="text-slate-300 tabular-nums">0</span>
  return (
    <Link
      to="/teach/review"
      aria-label={t('review.pending', { count })}
      className={cx(
        'inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-sm font-semibold text-amber-800 tabular-nums ring-1 ring-amber-200/80 hover:bg-amber-100',
        FOCUS_RING,
      )}
    >
      {count}
      <Icon name="arrowRight" className="size-3.5" />
    </Link>
  )
}

function MobileStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="text-slate-500">{label}:</dt>
      <dd className="font-medium text-slate-800 tabular-nums">{children}</dd>
    </div>
  )
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4 sm:px-6">
          <Skeleton className="h-4 w-6 rounded-md" />
          <Skeleton className="h-4 flex-1 rounded-md" />
          <Skeleton className="hidden h-2 w-1/4 rounded-full md:block" />
          <Skeleton className="h-6 w-12 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
