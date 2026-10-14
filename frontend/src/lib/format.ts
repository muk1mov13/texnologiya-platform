/** Fayl hajmi joriy tilda: "850 KB", "1,2 MB" / "1,2 МБ". */
export function formatSize(bytes: number, lang: string): string {
  const [value, unit] =
    bytes >= 1024 * 1024 ? [bytes / (1024 * 1024), 'megabyte'] : [Math.max(bytes / 1024, 1), 'kilobyte']
  return new Intl.NumberFormat(lang, { style: 'unit', unit, maximumFractionDigits: 1 }).format(value)
}

/** Sana joriy tilda ("14-oktabr, 2026" / "14 октября 2026 г."). */
export function formatDate(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })
}
