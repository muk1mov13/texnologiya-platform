import { cx } from '@/lib/cx'

/** `NavLink` klassi: yuqori menyu va mobil menyu uchun umumiy. */
export const navClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap',
    isActive ? 'bg-brand-100 text-brand-900' : 'text-slate-600 hover:bg-slate-100',
  )
