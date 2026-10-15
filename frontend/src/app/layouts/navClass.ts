import { cx } from '@/lib/cx'

/** `NavLink` klassi: yuqori menyu va mobil menyu uchun umumiy. */
export const navClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap',
    isActive ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200/70' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  )

/** Ilova yuqori menyusidagi tab: faol fon (`m.span layoutId`) ichida suriladi, shuning uchun bu yerda fon yo'q. */
export const appNavClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'relative inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors',
    'motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700',
    isActive ? 'text-brand-800' : 'text-slate-600 hover:text-slate-900',
  )
