import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState, type ComponentProps } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useUpdateTopic } from '@/api/teach'
import type { TopicEditor } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { pushToast } from '@/components/ui/toast-store'
import { cx, FOCUS_RING } from '@/lib/cx'
import { LESSON_TYPES } from '@/lib/lessonType'
import { topicSchema, type TopicValues } from './schemas'

/**
 * Mavzu ma'lumotlari: odatda yig'ilgan panel (sarlavhada qisqacha mazmun ko'rinadi). Forma
 * yopiq holatda ham DOM'da qoladi (`hidden`), shuning uchun kiritilgan qiymatlar yo'qolmaydi.
 */
export function TopicDetailsForm({ topic }: { topic: TopicEditor }) {
  const { t } = useTranslation()
  const update = useUpdateTopic(topic.id)
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TopicValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      title: topic.title,
      summary: topic.summary,
      lesson_type: topic.lesson_type,
      is_published: topic.is_published,
    },
  })

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
        className={cx(
          'group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/70 motion-reduce:transition-none sm:px-6',
          FOCUS_RING,
          'focus-visible:-outline-offset-2',
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200/70 group-hover:text-brand-700"
        >
          <Icon name="settings" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold tracking-tight text-slate-900">{t('teach.detailsTitle')}</span>
          <span className="mt-0.5 block truncate text-sm text-slate-500">
            {topic.summary.trim() || t('teach.detailsNoSummary')}
          </span>
        </span>
        <Icon
          name="chevronDown"
          className={cx(
            'size-5 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </button>
      <div id={bodyId} hidden={!open} className="border-t border-slate-100 px-5 py-5 sm:px-6">
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) =>
            update.mutate(values, {
              onSuccess: () => {
                reset(values)
                pushToast('success', t('teach.topicSaved'))
              },
            }),
          )}
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <Field id="topic-title" label={t('teach.topicTitle')} error={errors.title?.message}>
              <Input id="topic-title" aria-invalid={Boolean(errors.title)} {...register('title')} />
            </Field>
            <Field id="topic-lesson-type" label={t('teach.topicLessonType')}>
              <Select id="topic-lesson-type" {...register('lesson_type')}>
                {LESSON_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`lessonType.${type}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field id="topic-summary" label={t('teach.topicSummary')} error={errors.summary?.message}>
            <Textarea id="topic-summary" rows={3} aria-invalid={Boolean(errors.summary)} {...register('summary')} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <Switch label={t('teach.topicPublished')} {...register('is_published')} />
            <div className="flex items-center gap-2">
              {isDirty && (
                <Button variant="ghost" size="sm" onClick={() => reset()}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button type="submit" size="sm" loading={update.isPending} disabled={!isDirty}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}

/** Checkbox — almashtirgich ko'rinishida (holat matni yorliqda, rang faqat qo'shimcha belgi). */
function Switch({ label, ...rest }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
      <span className="relative inline-flex">
        <input type="checkbox" className="peer sr-only" {...rest} />
        <span
          aria-hidden="true"
          className={cx(
            'h-6 w-11 rounded-full bg-slate-200 ring-1 ring-slate-300/60 transition-colors motion-reduce:transition-none',
            'peer-checked:bg-brand-600 peer-checked:ring-brand-700/40',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700',
          )}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-soft transition-transform duration-200 peer-checked:translate-x-5 motion-reduce:transition-none"
        />
      </span>
      {label}
    </label>
  )
}
