import { z } from 'zod'

// Cheklovlar backend `app/assessment/schemas.py` bilan bir xil.
const text = (max: number) =>
  z.string().trim().min(1, { error: 'validation.required' }).max(max, { error: 'validation.tooLong' })
const optional = z.string().trim().max(2000, { error: 'validation.tooLong' })

export const quizSchema = z.object({
  title: text(200),
  items: z
    .array(
      z.object({
        text: text(1000),
        options: z.array(text(300)).length(4),
        correct_index: z.number().int().min(0).max(3),
        explanation: optional,
      }),
    )
    .min(1, { error: 'activityEditor.needItems' })
    .max(50, { error: 'activityEditor.tooManyItems' }),
})

export const yesnoSchema = z.object({
  title: text(200),
  items: z
    .array(z.object({ statement: text(1000), answer: z.boolean(), explanation: optional }))
    .min(1, { error: 'activityEditor.needItems' })
    .max(50, { error: 'activityEditor.tooManyItems' }),
})

export const crosswordSchema = z.object({
  title: text(200),
  items: z
    .array(z.object({ word: text(60), clue: text(300) }))
    .min(3, { error: 'activityEditor.needWords' })
    .max(20, { error: 'activityEditor.tooManyWords' }),
})

export type QuizValues = z.infer<typeof quizSchema>
export type YesNoValues = z.infer<typeof yesnoSchema>
export type CrosswordValues = z.infer<typeof crosswordSchema>
