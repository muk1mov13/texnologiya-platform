import { z } from 'zod'

const title = (max: number) =>
  z.string().trim().min(1, { error: 'validation.required' }).max(max, { error: 'validation.tooLong' })

export const folderSchema = z.object({ title: title(200) })
export type FolderValues = z.infer<typeof folderSchema>

export const documentSchema = z.object({ title: title(300), folder_id: z.number().int() })
export type DocumentValues = z.infer<typeof documentSchema>

export const bookEditSchema = z.object({
  title: title(300),
  author: z.string().trim().max(200, { error: 'validation.tooLong' }),
  category: title(100),
})
export type BookEditValues = z.infer<typeof bookEditSchema>

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Uzunliklar backend `NewsIn` bilan bir xil; bo'sh slug — sarlavhadan avtomatik.
export const newsSchema = z.object({
  title: title(300),
  slug: z
    .string()
    .trim()
    .max(220, { error: 'validation.tooLong' })
    .refine((value) => value === '' || SLUG_RE.test(value), { error: 'validation.slug' }),
  body: z.string().max(50000, { error: 'validation.tooLong' }),
  /** `datetime-local` qiymati; bo'sh — qoralama. */
  published_at: z.string(),
})
export type NewsValues = z.infer<typeof newsSchema>

export const faqSchema = z.object({
  question: title(500),
  answer: title(5000),
  is_published: z.boolean(),
})
export type FaqValues = z.infer<typeof faqSchema>
