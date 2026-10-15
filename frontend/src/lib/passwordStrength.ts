export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

/**
 * Parol kuchini 0–4 ball bilan baholaydi (faqat ko'rsatish uchun, validatsiya `registerSchema` da):
 * uzunlik ≥ 8, harf va raqam, katta va kichik harf, maxsus belgi.
 */
export function passwordScore(password: string): number {
  if (!password) return 0
  const checks = [
    password.length >= 8,
    /\p{L}/u.test(password) && /\d/.test(password),
    /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password),
    /[^\p{L}\d]/u.test(password),
  ]
  return Math.max(1, checks.filter(Boolean).length)
}

export const STRENGTH_LEVELS: readonly StrengthLevel[] = ['weak', 'fair', 'good', 'strong']
