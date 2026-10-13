import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { useGradeSubmission, useReturnSubmission, useSubmission } from '@/api/teachAssessment'
import type { SubmissionDetail } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { QueryState } from '@/components/ui/QueryState'
import { pushToast } from '@/components/ui/toast-store'
import { cx, FOCUS_RING } from '@/lib/cx'
import { useProtectedDownload } from '@/lib/download'

/** Bitta javobni tekshirish: topshiriq, talaba javobi va baholash/qaytarish formasi. */
export function ReviewDetailPage() {
  const { t } = useTranslation()
  const id = Number(useParams().submissionId)
  const submission = useSubmission(id)
  // Noto'g'ri ID'da so'rov o'chiq (abadiy `isPending`) — QueryState'ga yuborilmaydi.
  const validId = Number.isInteger(id) && id > 0

  return (
    <div className="flex flex-col gap-6">
      <Link to="/teach/review" className={cx('text-sm font-semibold text-brand-700 hover:underline', FOCUS_RING)}>
        ← {t('review.back')}
      </Link>
      {validId ? (
        <QueryState query={submission}>{(data) => <ReviewBody detail={data} />}</QueryState>
      ) : (
        <EmptyState icon="🔍" title={t('notFound.title')} />
      )}
    </div>
  )
}

function ReviewBody({ detail }: { detail: SubmissionDetail }) {
  const { t, i18n } = useTranslation()
  const { download, pending: downloading } = useProtectedDownload()
  const { file_url: fileUrl, original_name: fileName } = detail

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{detail.task_title}</h1>
        <p className="text-slate-600">
          {detail.subject_title} · {detail.topic_title}
        </p>
      </header>
      <Card className="flex flex-col gap-3 p-5">
        <p className="whitespace-pre-line text-slate-700">{detail.task_description}</p>
        {detail.rubric && (
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700">{t('task.rubric')}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{detail.rubric}</p>
          </div>
        )}
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex-1 font-bold">{detail.student_name}</h2>
          {detail.is_late && <Badge tone="amber">{t('task.late')}</Badge>}
          <span className="text-sm text-slate-500">{new Date(detail.submitted_at).toLocaleString(i18n.language)}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">{t('review.answer')}</p>
          {detail.text ? (
            <p className="mt-1 whitespace-pre-line text-slate-800">{detail.text}</p>
          ) : (
            <p className="mt-1 text-slate-500">{t('review.noText')}</p>
          )}
        </div>
        {fileUrl && fileName && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" loading={downloading} onClick={() => void download(fileUrl, fileName)}>
              {t('task.download')}
            </Button>
            <span className="text-sm text-slate-600">{fileName}</span>
          </div>
        )}
      </Card>
      {detail.status === 'submitted' ? <GradeForm detail={detail} /> : <ReviewOutcome detail={detail} />}
    </>
  )
}

function ReviewOutcome({ detail }: { detail: SubmissionDetail }) {
  const { t } = useTranslation()
  return (
    <Card className="flex flex-col gap-3 p-5">
      {detail.status === 'graded' ? (
        <Badge tone="green">{t('task.statusGraded', { score: detail.score ?? 0, max: detail.max_score })}</Badge>
      ) : (
        <Badge tone="amber">{t('task.statusReturned')}</Badge>
      )}
      {detail.feedback && (
        <div>
          <p className="text-sm font-semibold text-slate-700">{t('task.feedback')}</p>
          <p className="mt-1 whitespace-pre-line text-slate-700">{detail.feedback}</p>
        </div>
      )}
    </Card>
  )
}

function GradeForm({ detail }: { detail: SubmissionDetail }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const grade = useGradeSubmission(detail.id)
  const giveBack = useReturnSubmission(detail.id)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [scoreError, setScoreError] = useState<string>()
  const [feedbackError, setFeedbackError] = useState<string>()
  const failed = grade.isError ? grade.error : giveBack.isError ? giveBack.error : null

  const done = (message: string) => {
    pushToast('success', message)
    void navigate('/teach/review')
  }

  const onGrade = (event: FormEvent) => {
    event.preventDefault()
    setFeedbackError(undefined)
    const value = Number(score)
    if (score.trim() === '' || !Number.isInteger(value) || value < 0 || value > detail.max_score) {
      setScoreError('review.scoreRange')
      return
    }
    setScoreError(undefined)
    giveBack.reset()
    grade.mutate(
      { score: value, feedback: feedback.trim() || null },
      { onSuccess: () => done(t('review.graded')) },
    )
  }

  const onReturn = () => {
    setScoreError(undefined)
    if (!feedback.trim()) {
      setFeedbackError('review.returnNeedsFeedback')
      return
    }
    setFeedbackError(undefined)
    grade.reset()
    giveBack.mutate(feedback.trim(), { onSuccess: () => done(t('review.returned')) })
  }

  return (
    <Card className="p-5">
      <form noValidate className="flex flex-col gap-4" onSubmit={onGrade}>
        <Field id="review-score" label={t('review.score', { max: detail.max_score })} error={scoreError}>
          <Input
            id="review-score"
            type="number"
            min={0}
            max={detail.max_score}
            value={score}
            onChange={(event) => setScore(event.target.value)}
            className="max-w-32"
          />
        </Field>
        <Field id="review-feedback" label={t('review.feedback')} error={feedbackError}>
          <Textarea id="review-feedback" rows={4} value={feedback} onChange={(event) => setFeedback(event.target.value)} />
        </Field>
        {failed !== null && <FormError error={failed} />}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={grade.isPending} disabled={giveBack.isPending}>
            {t('review.grade')}
          </Button>
          <Button variant="secondary" loading={giveBack.isPending} disabled={grade.isPending} onClick={onReturn}>
            {t('review.return')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
