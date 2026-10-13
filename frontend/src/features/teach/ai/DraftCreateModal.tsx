import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useCreateDraft } from '@/api/teachAi'
import type { Difficulty, DraftKind, Material } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Select } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { pushToast } from '@/components/ui/toast-store'
import { COUNT_RANGE, defaultCount } from './draftKinds'
import { draftCreateSchema, type DraftCreateValues } from './schemas'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

interface DraftCreateModalProps {
  open: boolean
  onClose: () => void
  topicId: number
  stepId: number
  kinds: DraftKind[]
  /** Mavzuning `ready` holatidagi ma'ruza/taqdimot materiallari — AI shulardan o'qiydi. */
  materials: Material[]
}

export function DraftCreateModal({ open, onClose, ...rest }: DraftCreateModalProps) {
  const { t } = useTranslation()
  return (
    <Modal open={open} title={t('aiDraft.modalTitle')} onClose={onClose}>
      {open && <DraftCreateForm onClose={onClose} {...rest} />}
    </Modal>
  )
}

function DraftCreateForm({ onClose, topicId, stepId, kinds, materials }: Omit<DraftCreateModalProps, 'open'>) {
  const { t } = useTranslation()
  const create = useCreateDraft(topicId)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DraftCreateValues>({
    resolver: zodResolver(draftCreateSchema),
    defaultValues: {
      kind: kinds[0],
      material_ids: materials.length === 1 ? [materials[0].id] : [],
      count: defaultCount(kinds[0]),
      difficulty: 'medium',
    },
  })
  const kind = useWatch({ control, name: 'kind' })
  const [low, high] = COUNT_RANGE[kind]

  const onSubmit = handleSubmit((values) =>
    create.mutate(
      { ...values, step_id: stepId },
      {
        onSuccess: () => {
          pushToast('info', t('aiDraft.started'))
          onClose()
        },
      },
    ),
  )

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      {create.error && <FormError error={create.error} />}
      {kinds.length > 1 && (
        <Field id="draft-kind" label={t('aiDraft.kind')}>
          <Select
            id="draft-kind"
            {...register('kind', {
              onChange: (event: { target: { value: string } }) =>
                setValue('count', defaultCount(event.target.value as DraftKind)),
            })}
          >
            {kinds.map((item) => (
              <option key={item} value={item}>
                {t(`aiDraft.kinds.${item}`)}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-slate-700">{t('aiDraft.materials')}</legend>
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500">{t('aiDraft.noMaterials')}</p>
        ) : (
          <Controller
            control={control}
            name="material_ids"
            render={({ field }) => (
              <>
                {materials.map((material) => (
                  <Checkbox
                    key={material.id}
                    label={material.title}
                    checked={field.value.includes(material.id)}
                    onChange={(event) =>
                      field.onChange(
                        event.target.checked
                          ? [...field.value, material.id]
                          : field.value.filter((id) => id !== material.id),
                      )
                    }
                  />
                ))}
              </>
            )}
          />
        )}
        {errors.material_ids?.message && (
          <p role="alert" className="text-sm text-red-600">
            {t(errors.material_ids.message)}
          </p>
        )}
      </fieldset>
      {kind !== 'task' && (
        <Field id="draft-count" label={`${t('aiDraft.count')} (${low}–${high})`} error={errors.count?.message}>
          <Input id="draft-count" type="number" min={low} max={high} {...register('count', { valueAsNumber: true })} />
        </Field>
      )}
      <Field id="draft-difficulty" label={t('aiDraft.difficultyLabel')}>
        <Select id="draft-difficulty" {...register('difficulty')}>
          {DIFFICULTIES.map((item) => (
            <option key={item} value={item}>
              {t(`aiDraft.difficulty.${item}`)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={create.isPending} disabled={materials.length === 0}>
          <span aria-hidden="true">✨ </span>
          {t('aiDraft.submit')}
        </Button>
      </div>
    </form>
  )
}
