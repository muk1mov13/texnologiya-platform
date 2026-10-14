import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useUpdateTopic } from '@/api/teach'
import type { TopicEditor } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field'
import { pushToast } from '@/components/ui/toast-store'
import { LESSON_TYPES } from '@/lib/lessonType'
import { topicSchema, type TopicValues } from './schemas'

export function TopicDetailsForm({ topic }: { topic: TopicEditor }) {
  const { t } = useTranslation()
  const update = useUpdateTopic(topic.id)
  const {
    register,
    handleSubmit,
    formState: { errors },
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
    <Card>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          update.mutate(values, { onSuccess: () => pushToast('success', t('teach.topicSaved')) }),
        )}
      >
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
        <Field id="topic-summary" label={t('teach.topicSummary')} error={errors.summary?.message}>
          <Textarea id="topic-summary" rows={3} aria-invalid={Boolean(errors.summary)} {...register('summary')} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox label={t('teach.topicPublished')} {...register('is_published')} />
          <Button type="submit" loading={update.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
