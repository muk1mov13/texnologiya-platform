import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { error: 'validation.nameMin' })
    .max(150, { error: 'validation.tooLong' }),
  phone: z.string().trim().max(32, { error: 'validation.tooLong' }),
})

export type ProfileValues = z.infer<typeof profileSchema>

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, { error: 'validation.required' }),
    new_password: z
      .string()
      .min(8, { error: 'validation.passwordMin' })
      .max(128, { error: 'validation.tooLong' }),
    confirm: z.string(),
  })
  .refine((values) => values.new_password === values.confirm, {
    error: 'validation.passwordMismatch',
    path: ['confirm'],
  })

export type PasswordValues = z.infer<typeof passwordSchema>
