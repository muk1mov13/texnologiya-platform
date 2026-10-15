import { cx, FOCUS_RING } from '@/lib/cx'

// Radiusni `cx` bilan ustidan yozib bo'lmaydi (ikki `rounded-*` klassi to'qnashadi), shuning
// uchun katta (`rounded-3xl`) va kichik (`rounded-2xl`) sirtlar alohida konstantalar.
const SURFACE_BASE = 'bg-white shadow-soft ring-1 ring-slate-200/70'
const LIFT = cx(
  'transition duration-300 hover:-translate-y-0.5 hover:shadow-glow-sm hover:ring-brand-200',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  FOCUS_RING,
)

/** Asosiy "premium" sirt (karta, panel) — `Card` bilan bir xil. */
export const SURFACE = cx('rounded-3xl', SURFACE_BASE)

/** Ichki/ro'yxat elementlari uchun kichikroq radiusli sirt. */
export const SURFACE_SM = cx('rounded-2xl', SURFACE_BASE)

/** Bosiladigan sirt (havola-karta): hover'da ko'tariladi va halqa brand rangga o'tadi. */
export const SURFACE_LINK = cx(SURFACE, LIFT)

export const SURFACE_LINK_SM = cx(SURFACE_SM, LIFT)

/** Sahifa sarlavhasi (ilova ichida). */
export const PAGE_TITLE = 'text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-3xl'

/** Bo'lim sarlavhasi (ilova ichida). */
export const SECTION_HEADING = 'text-lg font-bold tracking-tight text-slate-900'

/** Sarlavha ustidagi kichik yorliq ("eyebrow"). */
export const EYEBROW =
  'inline-flex items-center gap-2 rounded-full bg-brand-100/70 px-3 py-1 text-xs font-bold tracking-wider text-brand-800 uppercase'

/** Sahifa tepasidagi "orqaga" havolasi (chip ko'rinishida). */
export const BACK_LINK = cx(
  'inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-600',
  'shadow-soft ring-1 ring-slate-200/70 transition hover:text-brand-800 hover:ring-brand-200 motion-reduce:transition-none',
  FOCUS_RING,
)
