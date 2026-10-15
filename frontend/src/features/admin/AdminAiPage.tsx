import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAiSettings, useAiUsageStats, useReindex, useUpdateAiSettings } from '@/api/adminAi'
import type { AiSettingsView } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Select } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { pushToast } from '@/components/ui/toast-store'
import { formatDate } from '@/lib/format'
import { aiSettingsSchema, type AiSettingsValues } from './schemas'
import { PageHeader } from './ui/PageHeader'
import { Panel } from './ui/Panel'
import { StatCard } from './ui/StatCard'

const DAY_OPTIONS = [7, 30, 90]

/** `/admin/ai`: AI sozlamalari, sarf statistikasi, indeksni qayta qurish, maxfiylik eslatmasi. */
export function AdminAiPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="sparkles"
        eyebrow={t('navGroups.learning')}
        title={t('adminAi.title')}
        subtitle={t('adminAi.subtitle')}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <SettingsCard />
        <div className="flex flex-col gap-6">
          <IndexCard />
          <p className="flex gap-3 rounded-2xl bg-slate-100/70 p-4 text-sm text-pretty text-slate-600 ring-1 ring-slate-200/60">
            <Icon name="lock" className="mt-0.5 size-4 shrink-0 text-slate-500" />
            {t('adminAi.privacy')}
          </p>
        </div>
      </div>
      <UsageCard />
    </div>
  )
}

function SettingsCard() {
  const { t } = useTranslation()
  const settings = useAiSettings()
  return (
    <Panel title={t('adminAi.settings')}>
      <QueryState query={settings} loading={<Skeleton className="h-56" />}>
        {(data) => <SettingsForm key={`${data.enabled}-${data.student_daily_limit}`} data={data} />}
      </QueryState>
    </Panel>
  )
}

function SettingsForm({ data }: { data: AiSettingsView }) {
  const { t } = useTranslation()
  const update = useUpdateAiSettings()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AiSettingsValues>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: { enabled: data.enabled, student_daily_limit: data.student_daily_limit },
  })

  const onSubmit = handleSubmit((values) =>
    update.mutate(values, { onSuccess: () => pushToast('success', t('adminAi.saved')) }),
  )

  return (
    <div className="flex flex-col gap-5">
      {!data.configured && (
        <p role="status" className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200/70">
          <Icon name="bolt" className="mt-0.5 size-4 shrink-0" />
          {t('adminAi.notConfigured')}
        </p>
      )}
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          [t('adminAi.provider'), data.provider],
          [t('adminAi.chatModel'), data.chat_model],
          [t('adminAi.embeddingModel'), data.embedding_model],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/60">
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd className="mt-0.5 truncate font-mono text-sm font-medium text-slate-800" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4 border-t border-slate-100 pt-5">
        {update.error && <FormError error={update.error} />}
        <Checkbox label={t('adminAi.enabled')} {...register('enabled')} />
        <Field
          id="ai-daily-limit"
          label={t('adminAi.dailyLimit')}
          hint={t('adminAi.dailyLimitHint')}
          error={errors.student_daily_limit?.message}
        >
          <div className="w-36">
            <Input
              id="ai-daily-limit"
              type="number"
              min={0}
              max={500}
              {...register('student_daily_limit', { valueAsNumber: true })}
            />
          </div>
        </Field>
        <div>
          <Button type="submit" loading={update.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}

function UsageCard() {
  const { t, i18n } = useTranslation()
  const [days, setDays] = useState(30)
  const usage = useAiUsageStats(days)

  return (
    <Panel
      flush
      title={t('adminAi.usage')}
      actions={
        <div className="w-36">
          <Select aria-label={t('adminAi.usage')} value={days} onChange={(event) => setDays(Number(event.target.value))}>
            {DAY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t('adminAi.days', { count: option })}
              </option>
            ))}
          </Select>
        </div>
      }
    >
      <QueryState query={usage} loading={<div className="p-6"><Skeleton className="h-40" /></div>}>
        {(data) => {
          const max = Math.max(1, ...data.days.map((day) => day.requests))
          const total = data.days.reduce((sum, day) => sum + day.requests, 0)
          return (
            <div className="flex flex-col">
              <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
                <StatCard icon="chat" label={t('adminAi.requests')} value={total} />
                <StatCard icon="layers" label={t('adminAi.chunksLabel')} value={data.chunks} tone="slate" />
                <StatCard
                  icon="refresh"
                  label={t('adminAi.staleLabel')}
                  value={data.stale_chunks}
                  tone={data.stale_chunks > 0 ? 'amber' : 'slate'}
                />
              </div>
              {data.days.length === 0 ? (
                <p className="border-t border-slate-100 px-5 py-6 text-sm text-slate-500 sm:px-6">
                  {t('adminAi.noUsage')}
                </p>
              ) : (
                <div className="max-h-[28rem] overflow-auto border-t border-slate-100">
                  <table className="w-full text-sm">
                    <caption className="sr-only">{t('adminAi.total', { count: total })}</caption>
                    <thead className="sticky top-0 bg-white/95 backdrop-blur">
                      <tr className="text-left text-xs tracking-wide text-slate-500 uppercase">
                        <th scope="col" className="px-5 py-3 font-semibold sm:px-6">
                          {t('adminAi.day')}
                        </th>
                        <th scope="col" className="px-3 py-3 font-semibold">
                          {t('adminAi.requests')}
                        </th>
                        <th scope="col" className="px-5 py-3 text-right font-semibold sm:px-6">
                          {t('adminAi.users')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {data.days.map((day) => (
                        <tr key={day.day} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-5 py-2.5 whitespace-nowrap text-slate-700 sm:px-6">
                            {formatDate(day.day, i18n.language)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <div aria-hidden="true" className="h-1.5 w-full max-w-60 rounded-full bg-slate-100">
                                <div
                                  className="h-1.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                                  style={{ width: `${(day.requests / max) * 100}%` }}
                                />
                              </div>
                              <span className="w-10 shrink-0 font-semibold text-slate-800">{day.requests}</span>
                            </div>
                          </td>
                          <td className="px-5 py-2.5 text-right text-slate-700 sm:px-6">{day.users}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        }}
      </QueryState>
    </Panel>
  )
}

function IndexCard() {
  const { t } = useTranslation()
  const reindex = useReindex()
  const [confirmAll, setConfirmAll] = useState(false)

  const run = (all: boolean) =>
    reindex.mutate(
      { all },
      {
        onSuccess: () => {
          pushToast('info', t('adminAi.queued'))
          setConfirmAll(false)
        },
      },
    )

  return (
    <Panel title={t('adminAi.index')} description={t('adminAi.reindexText')}>
      <div className="flex flex-col gap-2">
        <Button size="sm" variant="secondary" loading={reindex.isPending && !confirmAll} onClick={() => run(false)}>
          <Icon name="refresh" className="size-4" />
          {t('adminAi.reindexStale')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirmAll(true)}>
          {t('adminAi.reindexAll')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmAll}
        title={t('adminAi.reindexAllTitle')}
        text={t('adminAi.reindexAllText')}
        confirmLabel={t('adminAi.reindexAll')}
        pending={reindex.isPending}
        onCancel={() => setConfirmAll(false)}
        onConfirm={() => run(true)}
      />
    </Panel>
  )
}
