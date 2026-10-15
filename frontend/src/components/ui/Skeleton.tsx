import { cx } from '@/lib/cx'

/** Yuklanish o'rnidagi kulrang shakl — sahifa tuzilishini oldindan ko'rsatadi (ekran o'quvchidan yashirin). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx('animate-pulse rounded-xl bg-slate-200/70 motion-reduce:animate-none', className)} />
  )
}
