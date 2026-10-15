import { cx, FOCUS_RING } from '@/lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

// Bosilganda yengil "cho'kish" (transform — layout siljimaydi).
const PRESS = 'active:scale-[0.98] motion-reduce:active:scale-100'

// brand-700→brand-800 gradient: oq matn bilan WCAG AA kontrasti (brand-500 ~2.5:1 edi, yetarli emas).
const VARIANTS: Record<ButtonVariant, string> = {
  primary: cx(
    'bg-gradient-to-b from-brand-700 to-brand-800 text-white shadow-glow-sm',
    'hover:-translate-y-px hover:brightness-110 motion-reduce:hover:translate-y-0',
    PRESS,
  ),
  secondary: cx(
    'bg-white text-slate-800 shadow-soft ring-1 ring-slate-200 hover:text-brand-800 hover:ring-brand-300',
    PRESS,
  ),
  danger: cx('bg-red-600 text-white shadow-sm hover:bg-red-700', PRESS),
  ghost: 'text-brand-700 hover:bg-brand-50',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-3 text-base',
}

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200',
    'motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-60',
    FOCUS_RING,
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
