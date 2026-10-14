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
