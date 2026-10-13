import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useFieldArray, useForm, type FieldError, type UseFormRegisterReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/client'
import { useCreateActivity, useUpdateActivity } from '@/api/teachAssessment'
import type { ActivityIn, ActivityTeach, ActivityType, CrosswordItemOut, QuizItemOut, YesNoItemOut } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import type { ActivitySaver } from './saver'
import {
  crosswordSchema,
  quizSchema,
  yesnoSchema,
  type CrosswordValues,
  type QuizValues,
  type YesNoValues,
} from './schemas'

/** Boshlang'ich qiymatlar: mavjud faoliyat (`id` bilan) yoki AI qoralamasi (`id` siz). */
type ActivityInitial = Pick<ActivityTeach, 'title' | 'items'> & { id?: number }

interface ActivityEditorProps {
  topicId: number
  stepId: number
  type: ActivityType
  initial?: ActivityInitial
  /** Berilsa, faoliyat API'si o'rniga shu orqali saqlanadi (masalan, AI qoralamasi). */
  saver?: ActivitySaver
  onDone: () => void
}

/** Faoliyat muharriri: yangi faoliyat yaratadi yoki mavjudini butunligicha almashtiradi. */
export function ActivityEditor(props: ActivityEditorProps) {
  if (props.type === 'quiz') return <QuizEditor {...props} />
  if (props.type === 'yesno') return <YesNoEditor {...props} />
  return <CrosswordEditor {...props} />
}

type EditorProps = Omit<ActivityEditorProps, 'type'>

/**
 * Yaratish yoki yangilash — `initial.id` bor-yo'qligiga qarab; muvaffaqiyatda `onDone`.
 * Tashqi `saver` berilsa, u ishlatiladi (hook'lar baribir chaqiriladi — hook tartibi o'zgarmasin).
 */
function useSaveActivity({ topicId, stepId, initial, saver, onDone }: EditorProps): ActivitySaver {
  const create = useCreateActivity(topicId, stepId)
  const update = useUpdateActivity(topicId, stepId)
  const existingId = initial?.id
  const mutation = existingId !== undefined ? update : create
  const save = (data: ActivityIn, onError?: (error: unknown) => void) => {
    const options = { onSuccess: onDone, onError }
    if (existingId !== undefined) update.mutate({ id: existingId, data }, options)
    else create.mutate(data, options)
  }
  const own = { save, pending: mutation.isPending, error: mutation.isError ? mutation.error : null }
  return saver ?? own
}

const blankQuiz = (): QuizValues['items'][number] => ({
  text: '',
  options: ['', '', '', ''],
  correct_index: 0,
  explanation: '',
})

function QuizEditor(props: EditorProps) {
  const { t } = useTranslation()
  const { initial, onDone } = props
  const { save, pending, error } = useSaveActivity(props)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: initial?.title ?? '',
      items: initial
        ? (initial.items as QuizItemOut[]).map((item) => ({
            text: item.text,
            options: [...item.options],
            correct_index: item.correct_index,
            explanation: item.explanation ?? '',
          }))
        : [blankQuiz()],
    },
  })
  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' })
  const prefix = `activity-${initial?.id ?? 'new'}`

  const onSubmit = handleSubmit((values) => {
    const items = values.items.map((item) => ({ ...item, explanation: item.explanation || null }))
    save({ type: 'quiz', title: values.title, items })
  })

  return (
    <EditorShell
      prefix={prefix}
      titleField={register('title')}
      titleError={errors.title}
      itemsError={errors.items?.root?.message ?? errors.items?.message}
      pending={pending}
      error={error}
      onSubmit={onSubmit}
      onCancel={onDone}
      addLabel={t('activityEditor.addItem')}
      onAdd={() => append(blankQuiz())}
    >
      {fields.map((field, index) => {
        const itemErrors = errors.items?.[index]
        return (
          <ItemCard key={field.id} index={index} count={fields.length} onMove={move} onRemove={() => remove(index)}>
            <Field id={`${prefix}-${index}-text`} label={t('activityEditor.question')} error={itemErrors?.text?.message}>
              <Textarea id={`${prefix}-${index}-text`} rows={2} {...register(`items.${index}.text`)} />
            </Field>
            <Controller
              control={control}
              name={`items.${index}.correct_index`}
              render={({ field: correct }) => (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-semibold text-slate-700">{t('activityEditor.options')}</legend>
                  {[0, 1, 2, 3].map((k) => {
                    const optionError = itemErrors?.options?.[k]?.message
                    return (
                      <div key={k} className="flex items-start gap-2">
                        <input
                          type="radio"
                          name={correct.name}
                          checked={correct.value === k}
                          onChange={() => correct.onChange(k)}
                          aria-label={t('activityEditor.correctOption', { n: k + 1 })}
                          className="mt-3 size-4 shrink-0 accent-brand-500"
                        />
                        <div className="flex-1">
                          <Input
                            aria-label={t('activityEditor.option', { n: k + 1 })}
                            aria-invalid={Boolean(optionError)}
                            placeholder={t('activityEditor.option', { n: k + 1 })}
                            {...register(`items.${index}.options.${k}`)}
                          />
                          {optionError && (
                            <p role="alert" className="mt-1 text-sm text-red-600">
                              {t(optionError)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-xs text-slate-500">{t('activityEditor.correctHint')}</p>
                </fieldset>
              )}
            />
            <Field
              id={`${prefix}-${index}-explanation`}
              label={t('activityEditor.explanation')}
              error={itemErrors?.explanation?.message}
            >
              <Input id={`${prefix}-${index}-explanation`} {...register(`items.${index}.explanation`)} />
            </Field>
          </ItemCard>
        )
      })}
    </EditorShell>
  )
}

const blankYesNo = (): YesNoValues['items'][number] => ({ statement: '', answer: true, explanation: '' })

function YesNoEditor(props: EditorProps) {
  const { t } = useTranslation()
  const { initial, onDone } = props
  const { save, pending, error } = useSaveActivity(props)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<YesNoValues>({
    resolver: zodResolver(yesnoSchema),
    defaultValues: {
      title: initial?.title ?? '',
      items: initial
        ? (initial.items as YesNoItemOut[]).map((item) => ({
            statement: item.statement,
            answer: item.answer,
            explanation: item.explanation ?? '',
          }))
        : [blankYesNo()],
    },
  })
  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' })
  const prefix = `activity-${initial?.id ?? 'new'}`

  const onSubmit = handleSubmit((values) => {
    const items = values.items.map((item) => ({ ...item, explanation: item.explanation || null }))
    save({ type: 'yesno', title: values.title, items })
  })

  return (
    <EditorShell
      prefix={prefix}
      titleField={register('title')}
      titleError={errors.title}
      itemsError={errors.items?.root?.message ?? errors.items?.message}
      pending={pending}
      error={error}
      onSubmit={onSubmit}
      onCancel={onDone}
      addLabel={t('activityEditor.addItem')}
      onAdd={() => append(blankYesNo())}
    >
      {fields.map((field, index) => {
        const itemErrors = errors.items?.[index]
        return (
          <ItemCard key={field.id} index={index} count={fields.length} onMove={move} onRemove={() => remove(index)}>
            <Field
              id={`${prefix}-${index}-statement`}
              label={t('activityEditor.statement')}
              error={itemErrors?.statement?.message}
            >
              <Textarea id={`${prefix}-${index}-statement`} rows={2} {...register(`items.${index}.statement`)} />
            </Field>
            <Controller
              control={control}
              name={`items.${index}.answer`}
              render={({ field: answer }) => (
                <Field id={`${prefix}-${index}-answer`} label={t('activityEditor.answerIs')}>
                  <Select
                    id={`${prefix}-${index}-answer`}
                    name={answer.name}
                    value={String(answer.value)}
                    onChange={(event) => answer.onChange(event.target.value === 'true')}
                    onBlur={answer.onBlur}
                  >
                    <option value="true">{t('activity.yes')}</option>
                    <option value="false">{t('activity.no')}</option>
                  </Select>
                </Field>
              )}
            />
            <Field
              id={`${prefix}-${index}-explanation`}
              label={t('activityEditor.explanation')}
              error={itemErrors?.explanation?.message}
            >
              <Input id={`${prefix}-${index}-explanation`} {...register(`items.${index}.explanation`)} />
            </Field>
          </ItemCard>
        )
      })}
    </EditorShell>
  )
}

const blankWord = (): CrosswordValues['items'][number] => ({ word: '', clue: '' })

function CrosswordEditor(props: EditorProps) {
  const { t } = useTranslation()
  const { initial, onDone } = props
  const { save, pending, error } = useSaveActivity(props)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CrosswordValues>({
    resolver: zodResolver(crosswordSchema),
    defaultValues: {
      title: initial?.title ?? '',
      items: initial
        ? (initial.items as CrosswordItemOut[]).map((item) => ({ word: item.word, clue: item.clue }))
        : [blankWord(), blankWord(), blankWord()],
    },
  })
  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' })
  const prefix = `activity-${initial?.id ?? 'new'}`

  const onSubmit = handleSubmit((values) => {
    // Backend xatosidagi so'z(lar) mos maydonda ham belgilanadi.
    const markWords = (apiError: unknown) => {
      if (!(apiError instanceof ApiError)) return
      const { words, word } = apiError.details
      const bad = new Set<string>(Array.isArray(words) ? words.map(String) : typeof word === 'string' ? [word] : [])
      const message =
        apiError.code === 'CROSSWORD_UNPLACEABLE' ? 'activityEditor.unplaceable' : 'activityEditor.invalidWord'
      values.items.forEach((item, index) => {
        if (bad.has(item.word)) setError(`items.${index}.word`, { message })
      })
    }
    save({ type: 'crossword', title: values.title, items: values.items }, markWords)
  })

  return (
    <EditorShell
      prefix={prefix}
      titleField={register('title')}
      titleError={errors.title}
      itemsError={errors.items?.root?.message ?? errors.items?.message}
      pending={pending}
      error={error}
      onSubmit={onSubmit}
      onCancel={onDone}
      addLabel={t('activityEditor.addWord')}
      onAdd={() => append(blankWord())}
    >
      {fields.map((field, index) => {
        const itemErrors = errors.items?.[index]
        return (
          <ItemCard key={field.id} index={index} count={fields.length} onMove={move} onRemove={() => remove(index)}>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Field id={`${prefix}-${index}-word`} label={t('activityEditor.word')} error={itemErrors?.word?.message}>
                <Input id={`${prefix}-${index}-word`} {...register(`items.${index}.word`)} />
              </Field>
              <Field id={`${prefix}-${index}-clue`} label={t('activityEditor.clue')} error={itemErrors?.clue?.message}>
                <Input id={`${prefix}-${index}-clue`} {...register(`items.${index}.clue`)} />
              </Field>
            </div>
          </ItemCard>
        )
      })}
    </EditorShell>
  )
}

interface EditorShellProps {
  prefix: string
  titleField: UseFormRegisterReturn
  titleError?: FieldError
  itemsError?: string
  pending: boolean
  error: unknown
  onSubmit: () => void
  onCancel: () => void
  addLabel: string
  onAdd: () => void
  children: ReactNode
}

/** Uchala muharrir uchun umumiy qism: nom, elementlar ro'yxati, xato va tugmalar. */
function EditorShell({
  prefix,
  titleField,
  titleError,
  itemsError,
  pending,
  error,
  onSubmit,
  onCancel,
  addLabel,
  onAdd,
  children,
}: EditorShellProps) {
  const { t } = useTranslation()
  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Field id={`${prefix}-title`} label={t('activityEditor.title')} error={titleError?.message}>
        <Input id={`${prefix}-title`} {...titleField} />
      </Field>
      <ol className="flex flex-col gap-3">{children}</ol>
      {itemsError && (
        <p role="alert" className="text-sm text-red-600">
          {t(itemsError)}
        </p>
      )}
      <div>
        <Button variant="secondary" size="sm" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      {error !== null && <FormError error={error} />}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {t('common.save')}
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}

interface ItemCardProps {
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onRemove: () => void
  children: ReactNode
}

function ItemCard({ index, count, onMove, onRemove, children }: ItemCardProps) {
  const { t } = useTranslation()
  const label = t('activityEditor.itemLabel', { n: index + 1 })
  return (
    <li aria-label={label} className="flex flex-col gap-3 rounded-xl border-2 border-slate-100 bg-white p-3">
      <div className="flex items-center gap-1">
        <span className="flex-1 text-sm font-semibold text-slate-500">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={index === 0}
          aria-label={t('activityEditor.moveUp')}
          onClick={() => onMove(index, index - 1)}
        >
          ↑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={index === count - 1}
          aria-label={t('activityEditor.moveDown')}
          onClick={() => onMove(index, index + 1)}
        >
          ↓
        </Button>
        <Button variant="ghost" size="sm" aria-label={t('activityEditor.removeItem')} onClick={onRemove}>
          ✕
        </Button>
      </div>
      {children}
    </li>
  )
}
