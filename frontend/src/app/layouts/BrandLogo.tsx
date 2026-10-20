import { useTranslation } from 'react-i18next'
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

/** Loyiha logotipi: "BIO [mikroskop] AKADEMIYA". Ochiq sayt, talaba va admin panellarida bir xil. */
export function BrandLogo({ tone = 'light', to = '/', className }: BrandLogoProps) {
  const { t } = useTranslation()
  const dark = tone === 'dark'
  const word = cx(
    'text-[1.1rem] leading-none font-bold tracking-[0.06em] sm:text-[1.25rem]',
    dark ? 'text-brand-300' : 'text-brand-600',
  )
  return (
    <Link
      to={to}
      aria-label={t('app.name')}
      className={cx('group inline-flex items-center gap-0.5 rounded-xl', FOCUS_RING, className)}
    >
      <span aria-hidden="true" className={word}>
        BIO
      </span>
      <MicroscopeMark
        className={cx(
          'h-7 w-auto shrink-0 origin-bottom transition-transform duration-300 group-hover:-rotate-6 motion-reduce:transition-none sm:h-8',
          dark ? 'text-brand-100' : 'text-[#3f5f4f]',
        )}
      />
      <span aria-hidden="true" className={word}>
        AKADEMIYA
      </span>
    </Link>
  )
}
