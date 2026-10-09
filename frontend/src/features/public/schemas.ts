import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email({ error: 'validation.email' }),
  password: z.string().min(1, { error: 'validation.required' }),
})

export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, { error: 'validation.nameMin' })
      .max(150, { error: 'validation.tooLong' }),
    email: z.email({ error: 'validation.email' }),
    phone: z.string().trim().max(32, { error: 'validation.tooLong' }),
    password: z.string().min(8, { error: 'validation.passwordMin' }).max(128, { error: 'validation.tooLong' }),
    password_confirm: z.string(),
  })
  .refine((values) => values.password === values.password_confirm, {
    error: 'validation.passwordMismatch',
    path: ['password_confirm'],
  })

export type RegisterValues = z.infer<typeof registerSchema>
