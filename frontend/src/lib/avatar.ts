/**
 * Standart (rasmsiz) avatar: foydalanuvchi ID'sidan deterministik tanlangan rang juftligi va naqsh —
 * har bir talabaning avatari o'ziga xos bo'ladi va har safar bir xil chiziladi.
 */

/** Gradient juftliklari (yuqori-chap → past-o'ng) va bosh harf rangi. */
export const AVATAR_PALETTES = [
  { from: '#14b8a6', to: '#0f766e', ink: '#ffffff' },
  { from: '#38bdf8', to: '#1d4ed8', ink: '#ffffff' },
  { from: '#a78bfa', to: '#6d28d9', ink: '#ffffff' },
  { from: '#fb7185', to: '#be123c', ink: '#ffffff' },
  { from: '#fbbf24', to: '#c2410c', ink: '#ffffff' },
  { from: '#34d399', to: '#047857', ink: '#ffffff' },
  { from: '#f472b6', to: '#9d174d', ink: '#ffffff' },
  { from: '#22d3ee', to: '#0e7490', ink: '#ffffff' },
  { from: '#818cf8', to: '#3730a3', ink: '#ffffff' },
  { from: '#a3e635', to: '#3f6212', ink: '#ffffff' },
] as const

export const AVATAR_PATTERNS = ['orbs', 'waves', 'grid', 'rays'] as const
export type AvatarPattern = (typeof AVATAR_PATTERNS)[number]

/** Kichik, barqaror hash (FNV-1a) — ID ketma-ket bo'lsa ham ranglar aralashib ketadi. */
function hash(value: number): number {
  let h = 0x811c9dc5
  for (const char of String(value)) {
    h ^= char.charCodeAt(0)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function avatarStyle(userId: number) {
  const h = hash(userId)
  return {
    palette: AVATAR_PALETTES[h % AVATAR_PALETTES.length],
    pattern: AVATAR_PATTERNS[Math.floor(h / AVATAR_PALETTES.length) % AVATAR_PATTERNS.length],
    // Naqsh burilishi (0–270°) — bir xil naqshli avatarlar ham farq qilsin.
    rotate: (Math.floor(h / 97) % 4) * 90,
  }
}
