/** Fayl hajmi joriy tilda: "850 KB", "1,2 MB" / "1,2 МБ". */
export function formatSize(bytes: number, lang: string): string {
  const [value, unit] =
    bytes >= 1024 * 1024 ? [bytes / (1024 * 1024), 'megabyte'] : [Math.max(bytes / 1024, 1), 'kilobyte']
  return new Intl.NumberFormat(lang, { style: 'unit', unit, maximumFractionDigits: 1 }).format(value)
}

// Ba'zi brauzerlar (ICU qisqartirilgan build'lar) `uz` uchun oy nomlarini bilmaydi va "2026 M10 14"
// qaytaradi — o'zbekcha sana shu ro'yxat bilan qo'lda yig'iladi.
const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
]

function uzDate(date: Date): string {
  return `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

function time(date: Date, lang: string): string {
  return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** Sana joriy tilda ("14-oktabr, 2026" / "14 октября 2026 г."). */
export function formatDate(iso: string, lang: string): string {
  const date = new Date(iso)
  if (lang === 'uz') return uzDate(date)
  return date.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Sana va vaqt joriy tilda ("14-oktabr, 2026, 14:48" / "14 октября 2026 г., 14:48"). */
export function formatDateTime(iso: string, lang: string): string {
  const date = new Date(iso)
  if (lang === 'uz') return `${uzDate(date)}, ${time(date, lang)}`
  return `${formatDate(iso, lang)}, ${time(date, lang)}`
}
