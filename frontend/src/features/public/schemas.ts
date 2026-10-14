import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email({ error: 'validation.email' }),
  password: z.string().min(1, { error: 'validation.required' }).max(128, { error: 'validation.tooLong' }),
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

// Uzunliklar backend `ContactIn` bilan bir xil.
export const contactSchema = z.object({
  name: z.string().trim().min(1, { error: 'validation.required' }).max(150, { error: 'validation.tooLong' }),
  contact: z.string().trim().min(3, { error: 'validation.required' }).max(150, { error: 'validation.tooLong' }),
  message: z.string().trim().min(1, { error: 'validation.required' }).max(5000, { error: 'validation.tooLong' }),
  website: z.string().max(200),
})

export type ContactValues = z.infer<typeof contactSchema>
