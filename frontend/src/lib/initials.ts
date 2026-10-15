/** Ismdan avatar uchun 1–2 bosh harf ("Ali Valiyev" → "AV"). */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const letters = parts.length === 1 ? [parts[0][0]] : [parts[0][0], parts[parts.length - 1][0]]
  return letters.join('').toLocaleUpperCase()
}
