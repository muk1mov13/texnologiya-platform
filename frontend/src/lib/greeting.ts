export type GreetingKey = 'morning' | 'day' | 'evening' | 'night'

/** Kun vaqtiga qarab salomlashuv kaliti (`student.greeting.*`). */
export function greetingKey(date: Date): GreetingKey {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'day'
  if (hour >= 18 && hour < 23) return 'evening'
  return 'night'
}
