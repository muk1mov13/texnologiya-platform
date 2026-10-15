import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubmitTask } from '@/api/assessment'
import type { SubmissionView, TaskView } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { pushToast } from '@/components/ui/toast-store'
import { useProtectedDownload } from '@/lib/download'

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png'

interface TaskStepProps {
  topicId: number
  stepId: number
  task: TaskView
  submission: SubmissionView | null
}

/** Vazifa bosqichi: topshiriq, yuborilgan javob holati va javob formasi. */
export function TaskStep({ topicId, stepId, task, submission }: TaskStepProps) {
  const { t, i18n } = useTranslation()
  // Render paytida Date.now() chaqirilmaydi — vaqt bir marta, mount'da olinadi.
  const [now] = useState(() => Date.now())
  const overdue = task.deadline !== null && new Date(task.deadline).getTime() < now

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{task.title}</h3>
        <p className="whitespace-pre-line text-slate-700">{task.description}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="brand">{t('task.maxScore', { score: task.max_score })}</Badge>
          {task.deadline && (
            <Badge>
              {t('task.deadline', { date: new Date(task.deadline).toLocaleDateString(i18n.language) })}
            </Badge>
          )}
          {overdue && <Badge tone="amber">{t('task.overdue')}</Badge>}
        </div>
        {task.rubric && (
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <p className="text-sm font-semibold text-slate-700">{t('task.rubric')}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{task.rubric}</p>
          </div>
        )}
      </Card>
      {submission && <SubmissionStatusCard submission={submission} maxScore={task.max_score} />}
      {submission?.status !== 'graded' && (
        <TaskForm topicId={topicId} stepId={stepId} task={task} submission={submission} />
      )}
    </div>
  )
}

function SubmissionStatusCard({ submission, maxScore }: { submission: SubmissionView; maxScore: number }) {
  const { t } = useTranslation()
  const { download, pending: downloading } = useProtectedDownload()
  const { file_url: fileUrl, original_name: fileName } = submission

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        {submission.status === 'submitted' && <Badge>{t('task.statusSubmitted')}</Badge>}
        {submission.status === 'returned' && <Badge tone="amber">{t('task.statusReturned')}</Badge>}
        {submission.status === 'graded' && (
          <Badge tone="green">{t('task.statusGraded', { score: submission.score ?? 0, max: maxScore })}</Badge>
        )}
        {submission.is_late && <Badge tone="amber">{t('task.late')}</Badge>}
      </div>
      {submission.feedback && (
        <div>
          <p className="text-sm font-semibold text-slate-700">{t('task.feedback')}</p>
          <p className="mt-1 whitespace-pre-line text-slate-700">{submission.feedback}</p>
        </div>
      )}
      {fileUrl && fileName && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" loading={downloading} onClick={() => void download(fileUrl, fileName)}>
            {t('task.download')}
          </Button>
          <span className="text-sm text-slate-600">{fileName}</span>
        </div>
      )}
    </Card>
  )
}

function TaskForm({ topicId, stepId, task, submission }: TaskStepProps) {
  const { t } = useTranslation()
  const submit = useSubmitTask(topicId, stepId)
  const [text, setText] = useState(submission?.text ?? '')
  const [file, setFile] = useState<File | null>(null)
  // Muvaffaqiyatli yuborishdan keyin fayl maydonini tozalash uchun input qayta yaratiladi.
  const [fileInputKey, setFileInputKey] = useState(0)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit.mutate(
      { taskId: task.id, text: task.type === 'file' ? '' : text, file: task.type === 'text' ? null : file },
      {
        onSuccess: () => {
          setFile(null)
          setFileInputKey((value) => value + 1)
          pushToast('success', t('task.sent'))
        },
      },
    )
  }

  return (
    <Card className="p-5">
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        {task.type !== 'file' && (
          <Field id="task-answer" label={t('task.answer')}>
            <Textarea id="task-answer" rows={6} value={text} onChange={(event) => setText(event.target.value)} />
          </Field>
        )}
        {task.type !== 'text' && (
          <Field id="task-file" label={t('task.file')} hint={t('task.fileHint')}>
            <Input
              key={fileInputKey}
              id="task-file"
              type="file"
              accept={ACCEPT}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Field>
        )}
        {submit.isError && <FormError error={submit.error} />}
        <div>
          <Button type="submit" loading={submit.isPending}>
            {submission ? t('task.resend') : t('task.send')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
