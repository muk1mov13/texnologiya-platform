import { Link } from 'react-router'
import { MicroscopeMark } from '@/components/icons/MicroscopeMark'
import { cx, FOCUS_RING } from '@/lib/cx'

interface BrandLogoProps {
  /** `dark` — to'q fonda (footer, admin paneli): yozuv va belgi och rangda. */
  tone?: 'light' | 'dark'
  /** Logo qayerga olib boradi (standart — bosh sahifa). */
  to?: string
  className?: string
}

/** Loyiha logotipi: "EDU [mikroskop]". Ochiq sayt, talaba va admin panellarida bir xil. */
export function BrandLogo({ tone = 'light', to = '/', className }: BrandLogoProps) {
  const dark = tone === 'dark'
  const word = cx(
    'text-[1.5rem] leading-none font-bold tracking-[0.06em]',
    dark ? 'text-brand-300' : 'text-brand-600',
  )
  return (
    <Link
      to={to}
      aria-label="EDU"
      className={cx('group inline-flex items-center gap-1 rounded-xl', FOCUS_RING, className)}
    >
      <span className={word}>EDU</span>
      <MicroscopeMark
        className={cx(
          'h-9 w-auto shrink-0 origin-bottom transition-transform duration-300 group-hover:-rotate-6 motion-reduce:transition-none',
          dark ? 'text-brand-100' : 'text-[#3f5f4f]',
        )}
      />
    </Link>
  )
}
