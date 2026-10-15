import { Link } from 'react-router'
import { cx, FOCUS_RING } from '@/lib/cx'

interface BrandLogoProps {
  /** `dark` — to'q fonda (footer): yozuv va belgi och rangda. */
  tone?: 'light' | 'dark'
  className?: string
}

/** "EDU 🔬" logotipidagi mikroskop belgisi (chiziqli, `currentColor`). */
function MicroscopeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <g transform="rotate(-32 18 13)">
        <rect x="15" y="1.5" width="6" height="3.5" rx="1" />
        <rect x="14" y="5" width="8" height="13" rx="1.5" />
        <path d="M16 18v3.5h4V18" />
      </g>
      <path d="M13.5 16.5C5.5 19 5 31 13 32.5" />
      <path d="M13 32.5h7.5M17 28.5h13" />
      <path d="M9 37.5h14" />
      <path d="M14.5 32.5v5" />
    </svg>
  )
}

/** Ochiq sayt logotipi: "EDU [mikroskop]", bosh sahifaga olib boradi. */
export function BrandLogo({ tone = 'light', className }: BrandLogoProps) {
  const dark = tone === 'dark'
  const word = cx(
    'text-[1.5rem] leading-none font-bold tracking-[0.06em]',
    dark ? 'text-brand-300' : 'text-brand-600',
  )
  return (
    <Link
      to="/"
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
