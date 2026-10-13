import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActivityView, AttemptAnswer } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { cx, FOCUS_RING } from '@/lib/cx'

interface ChoicePlayerProps {
  activity: ActivityView
  pending: boolean
  onSubmit: (answers: AttemptAnswer[]) => void
}

/** Test (savollar bitta-bitta) va ha/yo'q (bayonotlar ro'yxati) faoliyatlarini yechish. */
export function ChoicePlayer({ activity, pending, onSubmit }: ChoicePlayerProps) {
  const { t } = useTranslation()
  const [answers, setAnswers] = useState<AttemptAnswer[]>(() => activity.items.map(() => null))
  const [index, setIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const unanswered = answers.filter((answer) => answer === null).length

  function setAnswer(position: number, value: AttemptAnswer) {
    setAnswers((previous) => previous.map((answer, k) => (k === position ? value : answer)))
  }

  function finish() {
    if (unanswered > 0) setConfirming(true)
    else onSubmit(answers)
  }

  const finishButton = (
    <Button loading={pending} onClick={finish}>
      {t('activity.finish')}
    </Button>
  )

  return (
    <div className="flex flex-col gap-4">
      {activity.type === 'quiz' ? (
        <QuizQuestion
          activity={activity}
          index={index}
          answer={answers[index]}
          onAnswer={(value) => setAnswer(index, value)}
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {activity.items.map((item, position) =>
            'statement' in item ? (
              <li
                key={position}
                className="flex flex-col gap-2 rounded-xl border-2 border-slate-100 bg-white p-4 sm:flex-row sm:items-center"
              >
                <p className="flex-1">{item.statement}</p>
                <div className="flex gap-2" role="group" aria-label={item.statement}>
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      aria-pressed={answers[position] === value}
                      onClick={() => setAnswer(position, value)}
                      className={cx(
                        'rounded-xl border-2 px-4 py-1.5 text-sm font-semibold',
                        FOCUS_RING,
                        answers[position] === value
                          ? 'border-brand-700 bg-brand-100 text-brand-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {value ? t('activity.yes') : t('activity.no')}
                    </button>
                  ))}
                </div>
              </li>
            ) : null,
          )}
        </ol>
      )}

      {activity.type === 'quiz' ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            ← {t('activity.prev')}
          </Button>
          {index < activity.items.length - 1 ? (
            <Button variant="secondary" onClick={() => setIndex(index + 1)}>
              {t('activity.next')} →
            </Button>
          ) : (
            finishButton
          )}
        </div>
      ) : (
        <div>{finishButton}</div>
      )}

      <ConfirmDialog
        open={confirming}
        title={t('activity.unansweredTitle')}
        text={t('activity.unansweredText', { count: unanswered })}
        confirmLabel={t('activity.finish')}
        pending={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          onSubmit(answers)
        }}
      />
    </div>
  )
}

interface QuizQuestionProps {
  activity: ActivityView
  index: number
  answer: AttemptAnswer
  onAnswer: (value: number) => void
}

function QuizQuestion({ activity, index, answer, onAnswer }: QuizQuestionProps) {
  const { t } = useTranslation()
  const item = activity.items[index]
  if (!item || !('options' in item)) return null
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-semibold text-slate-600">
        {t('activity.questionOf', { n: index + 1, total: activity.items.length })}
      </legend>
      <p className="text-lg font-semibold">{item.text}</p>
      {item.options.map((option, k) => (
        <label
          key={k}
          className={cx(
            'flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3',
            answer === k ? 'border-brand-700 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50',
          )}
        >
          <input
            type="radio"
            name={`quiz-${activity.id}-${index}`}
            checked={answer === k}
            onChange={() => onAnswer(k)}
            className="size-4 accent-brand-700"
          />
          {option}
        </label>
      ))}
    </fieldset>
  )
}
