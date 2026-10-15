import { cx, FOCUS_RING } from '@/lib/cx'

/** Asosiy "premium" sirt (karta, panel) — `Card` bilan bir xil. */
export const SURFACE = 'rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70'

/** Bosiladigan sirt (havola-karta): hover'da ko'tariladi va halqa brand rangga o'tadi. */
export const SURFACE_LINK = cx(
  SURFACE,
  'transition duration-300 hover:-translate-y-0.5 hover:shadow-glow-sm hover:ring-brand-200',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  FOCUS_RING,
)

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
