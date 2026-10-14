import { z } from 'zod'

export const topicSchema = z.object({
  title: z.string().trim().min(2, { error: 'validation.titleMin' }).max(200, { error: 'validation.tooLong' }),
  summary: z.string().max(5000, { error: 'validation.tooLong' }),
  is_published: z.boolean(),
})

export type TopicValues = z.infer<typeof topicSchema>

export const glossarySchema = z.object({
  term: z.string().trim().min(1, { error: 'validation.required' }).max(200, { error: 'validation.tooLong' }),
  definition: z.string().trim().min(1, { error: 'validation.required' }).max(5000, { error: 'validation.tooLong' }),
})

export type GlossaryValues = z.infer<typeof glossarySchema>

export const literatureSchema = z.object({
  title: z.string().trim().min(1, { error: 'validation.required' }).max(300, { error: 'validation.tooLong' }),
  author: z.string().trim().max(200, { error: 'validation.tooLong' }),
  year: z
    .string()
    .trim()
    .refine((value) => value === '' || (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= 2100), {
      error: 'validation.year',
    }),
  url: z
    .string()
    .trim()
    .max(500, { error: 'validation.tooLong' })
    .refine((value) => value === '' || /^https?:\/\/\S+$/.test(value), { error: 'validation.url' }),
})

export type LiteratureValues = z.infer<typeof literatureSchema>

// Uzunliklar backend `CategoryForm` / `LongTitleForm` / `author` bilan bir xil.
export const bookUploadSchema = z.object({
  category: z.string().trim().min(1, { error: 'validation.required' }).max(100, { error: 'validation.tooLong' }),
  title: z.string().trim().min(1, { error: 'validation.required' }).max(300, { error: 'validation.tooLong' }),
  author: z.string().trim().max(200, { error: 'validation.tooLong' }),
})

export type BookUploadValues = z.infer<typeof bookUploadSchema>
