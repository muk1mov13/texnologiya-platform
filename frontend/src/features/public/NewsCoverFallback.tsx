import { Icon } from '@/components/icons/Icon'
import { cx } from '@/lib/cx'

/** Muqovasiz yangilik uchun bezak: brand gradient, katak naqsh va ikonka. */
export function NewsCoverFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'relative flex size-full items-center justify-center overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900',
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid invert" />
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-brand-300/30 blur-2xl" />
      <span className="relative grid size-16 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
        <Icon name="news" className="size-8" />
      </span>
    </div>
  )
}
