import { cx, FOCUS_RING } from '@/lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const PRESS = 'active:translate-y-[3px] active:shadow-none motion-reduce:active:translate-y-0'

// brand-700: oq matn bilan WCAG AA kontrastini ta'minlaydi (brand-500 ~2.5:1 edi, yetarli emas).
const VARIANTS: Record<ButtonVariant, string> = {
  primary: cx('border-2 border-transparent bg-brand-700 text-white shadow-press hover:bg-brand-900', PRESS),
  secondary: cx(
    'border-2 border-slate-200 bg-white text-slate-800 shadow-press-slate hover:bg-slate-50',
    PRESS,
  ),
  danger: cx('border-2 border-transparent bg-red-500 text-white shadow-press-danger hover:bg-red-600', PRESS),
  ghost: 'text-brand-700 hover:bg-brand-50',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
}

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition',
    'motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-60',
    FOCUS_RING,
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
