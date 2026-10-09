import { useTranslation } from 'react-i18next'
import { cx } from '@/lib/cx'

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-10' } as const

interface SpinnerProps {
  size?: keyof typeof SIZES
  /** Tugma ichida: ekran o'quvchiga e'lon qilinmaydi, tugma nomini buzmaydi. */
  decorative?: boolean
}

export function Spinner({ size = 'md', decorative = false }: SpinnerProps) {
  const { t } = useTranslation()
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { role: 'status', 'aria-label': t('common.loading') }
  return (
    <svg
      className={cx(SIZES[size], 'animate-spin motion-reduce:animate-none')}
      viewBox="0 0 24 24"
      fill="none"
      {...a11y}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-16 text-brand-500">
      <Spinner size="lg" />
    </div>
  )
}
