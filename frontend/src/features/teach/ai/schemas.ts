import { z } from 'zod'
import { COUNT_RANGE, MAX_DRAFT_MATERIALS } from './draftKinds'

export const draftCreateSchema = z
  .object({
    kind: z.enum(['quiz', 'yesno', 'crossword', 'glossary', 'task']),
    material_ids: z
      .array(z.number())
      .min(1, { error: 'aiDraft.pickMaterial' })
      .max(MAX_DRAFT_MATERIALS, { error: 'aiDraft.tooManyMaterials' }),
    count: z.number({ error: 'aiDraft.countRange' }).int({ error: 'aiDraft.countRange' }),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })
  .superRefine((value, ctx) => {
    const [low, high] = COUNT_RANGE[value.kind]
    if (value.count < low || value.count > high) {
      ctx.addIssue({ code: 'custom', path: ['count'], message: 'aiDraft.countRange' })
    }
  })

export type DraftCreateValues = z.infer<typeof draftCreateSchema>
