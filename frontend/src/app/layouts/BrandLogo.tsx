import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { cx, FOCUS_RING } from '@/lib/cx'

interface BrandLogoProps {
  /** `dark` — to'q fonda (footer): nom oq rangda. */
  tone?: 'light' | 'dark'
  className?: string
}

/** Ochiq sayt logotipi: gradient belgi va platforma nomi, bosh sahifaga olib boradi. */
export function BrandLogo({ tone = 'light', className }: BrandLogoProps) {
  const { t } = useTranslation()
  return (
    <Link to="/" className={cx('group inline-flex items-center gap-2.5 rounded-xl', FOCUS_RING, className)}>
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 text-lg font-black text-white shadow-glow transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 motion-reduce:transition-none"
      >
        T
      </span>
      <span
        className={cx(
          'text-lg font-extrabold tracking-tight',
          tone === 'dark' ? 'text-white' : 'text-slate-900',
        )}
      >
        {t('app.name')}
      </span>
    </Link>
  )
}
