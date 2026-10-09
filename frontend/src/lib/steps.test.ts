import { isStepKind, SELF_COMPLETE_KINDS, STEP_KINDS } from './steps'

test('7 ta bosqich backend tartibida', () => {
  expect(STEP_KINDS).toEqual(['review', 'lecture', 'presentation', 'practice', 'task', 'glossary', 'literature'])
})

test("isStepKind faqat ma'lum turlarni qabul qiladi", () => {
  expect(isStepKind('lecture')).toBe(true)
  expect(isStepKind('exam')).toBe(false)
  expect(isStepKind(undefined)).toBe(false)
})

test('review/practice/task "Tugatdim" bilan yakunlanmaydi', () => {
  expect(SELF_COMPLETE_KINDS.has('review')).toBe(false)
  expect(SELF_COMPLETE_KINDS.has('glossary')).toBe(true)
})
