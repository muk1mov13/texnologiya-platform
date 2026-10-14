import { cx, FOCUS_RING } from '@/lib/cx'

/** Bosh sahifadagi katta CTA tugmalari (hero, yakuniy CTA). */
export const CTA_PRIMARY = cx(
  'group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 px-6 py-3.5 text-base font-bold text-white',
  'shadow-glow transition duration-300 hover:-translate-y-0.5 hover:brightness-110',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  FOCUS_RING,
)

export const CTA_SECONDARY = cx(
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3.5 text-base font-bold text-slate-800',
  'shadow-soft backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-800',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  FOCUS_RING,
)

/** Bo'lim sarlavhasi ustidagi kichik yorliq ("eyebrow"). */
export const EYEBROW =
  'inline-flex items-center gap-2 rounded-full bg-brand-100/70 px-3 py-1 text-xs font-bold tracking-wider text-brand-800 uppercase'

export const SECTION_TITLE = 'text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl'

/** To'q (`brand-950`) fondagi bo'limlar uchun yorliq va sarlavha. */
export const EYEBROW_DARK =
  'inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wider text-brand-200 uppercase ring-1 ring-white/15'

export const SECTION_TITLE_DARK = 'text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl'
