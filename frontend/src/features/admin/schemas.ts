import { z } from 'zod'

export const subjectSchema = z.object({
  title: z.string().trim().min(2, { error: 'validation.titleMin' }).max(200, { error: 'validation.tooLong' }),
  slug: z
    .string()
    .trim()
    .max(220, { error: 'validation.tooLong' })
    .refine((value) => value === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), { error: 'validation.slug' }),
  description: z.string().max(5000, { error: 'validation.tooLong' }),
  order: z
    .number({ error: 'validation.order' })
    .int({ error: 'validation.order' })
    .min(0, { error: 'validation.order' })
    .max(2147483647, { error: 'validation.order' }),
  is_published: z.boolean(),
})

export type SubjectValues = z.infer<typeof subjectSchema>
