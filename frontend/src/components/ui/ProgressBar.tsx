import { cx } from '@/lib/cx'

interface ProgressBarProps {
  /** 0..1 oralig'idagi ulush (chegaradan chiqsa qirqiladi). */
  value: number
  /** Ekran o'quvchi uchun nom; berilmasa chiziq bezak hisoblanadi (qiymat yonidagi matnda bor). */
  label?: string
  className?: string
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const ratio = Number.isFinite(value) ? Math.max(0, Math.min(value, 1)) : 0
  const percent = Math.round(ratio * 100)
  return (
    <div
      {...(label
        ? { role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': percent }
        : { 'aria-hidden': true })}
      className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-200/70', className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-700 transition-[width] duration-700 motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
