import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAiSettings, useAiUsageStats, useReindex, useUpdateAiSettings } from '@/api/adminAi'
import type { AiSettingsView } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox, Field, Input, Select } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { pushToast } from '@/components/ui/toast-store'
import { aiSettingsSchema, type AiSettingsValues } from './schemas'

const DAY_OPTIONS = [7, 30, 90]

/** `/admin/ai`: AI sozlamalari, sarf statistikasi, indeksni qayta qurish, maxfiylik eslatmasi. */
export function AdminAiPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('adminAi.title')}</h1>
      <SettingsCard />
      <UsageCard />
      <IndexCard />
      <p className="text-xs text-slate-500">
        <span aria-hidden="true">ℹ️ </span>
        {t('adminAi.privacy')}
      </p>
    </div>
  )
}

function SettingsCard() {
  const { t } = useTranslation()
  const settings = useAiSettings()
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="font-bold">{t('adminAi.settings')}</h2>
      <QueryState query={settings}>
        {(data) => <SettingsForm key={`${data.enabled}-${data.student_daily_limit}`} data={data} />}
      </QueryState>
    </Card>
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
    <>
      {!data.configured && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          {t('adminAi.notConfigured')}
        </p>
      )}
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-slate-500">{t('adminAi.provider')}</dt>
        <dd className="font-medium">{data.provider}</dd>
        <dt className="text-slate-500">{t('adminAi.chatModel')}</dt>
        <dd className="font-medium break-all">{data.chat_model}</dd>
        <dt className="text-slate-500">{t('adminAi.embeddingModel')}</dt>
        <dd className="font-medium break-all">{data.embedding_model}</dd>
      </dl>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {update.error && <FormError error={update.error} />}
        <Checkbox label={t('adminAi.enabled')} {...register('enabled')} />
        <Field
          id="ai-daily-limit"
          label={t('adminAi.dailyLimit')}
          hint={t('adminAi.dailyLimitHint')}
          error={errors.student_daily_limit?.message}
        >
          <Input
            id="ai-daily-limit"
            type="number"
            min={0}
            max={500}
            {...register('student_daily_limit', { valueAsNumber: true })}
          />
        </Field>
        <div>
          <Button type="submit" loading={update.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </>
  )
}

function UsageCard() {
  const { t, i18n } = useTranslation()
  const [days, setDays] = useState(30)
  const usage = useAiUsageStats(days)

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">{t('adminAi.usage')}</h2>
        <Select
          aria-label={t('adminAi.usage')}
          className="w-auto"
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
        >
          {DAY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t('adminAi.days', { count: option })}
            </option>
          ))}
        </Select>
      </div>
      <QueryState query={usage}>
        {(data) => {
          const max = Math.max(1, ...data.days.map((day) => day.requests))
          const total = data.days.reduce((sum, day) => sum + day.requests, 0)
          return (
            <div className="flex flex-col gap-3">
              {data.days.length === 0 ? (
                <p className="text-sm text-slate-500">{t('adminAi.noUsage')}</p>
              ) : (
                <>
                  <p className="text-sm font-semibold">{t('adminAi.total', { count: total })}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-1 pr-3 font-medium">{t('adminAi.day')}</th>
                          <th className="py-1 pr-3 font-medium">{t('adminAi.requests')}</th>
                          <th className="py-1 font-medium">{t('adminAi.users')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.days.map((day) => (
                          <tr key={day.day} className="border-t border-slate-100">
                            <td className="whitespace-nowrap py-1 pr-3">
                              {new Date(day.day).toLocaleDateString(i18n.language)}
                            </td>
                            <td className="py-1 pr-3">
                              <div className="flex items-center gap-2">
                                <div aria-hidden="true" className="h-2 w-32 shrink-0 rounded-full bg-slate-100">
                                  <div
                                    className="h-2 rounded-full bg-brand-500"
                                    style={{ width: `${(day.requests / max) * 100}%` }}
                                  />
                                </div>
                                {day.requests}
                              </div>
                            </td>
                            <td className="py-1">{day.users}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <p className="text-sm text-slate-600">{t('adminAi.chunks', { chunks: data.chunks })}</p>
              {data.stale_chunks > 0 && (
                <p className="text-sm text-amber-800">{t('adminAi.stale', { count: data.stale_chunks })}</p>
              )}
            </div>
          )
        }}
      </QueryState>
    </Card>
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
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="font-bold">{t('adminAi.index')}</h2>
      <p className="text-sm text-slate-600">{t('adminAi.reindexText')}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" loading={reindex.isPending && !confirmAll} onClick={() => run(false)}>
          {t('adminAi.reindexStale')}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setConfirmAll(true)}>
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
    </Card>
  )
}
