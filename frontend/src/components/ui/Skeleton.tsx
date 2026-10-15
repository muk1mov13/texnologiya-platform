import { cx } from '@/lib/cx'

/** Yuklanish o'rnidagi kulrang shakl — sahifa tuzilishini oldindan ko'rsatadi (ekran o'quvchidan yashirin). */
export function Skeleton({ className }: { className?: string }) {
  // Radius berilgan bo'lsa standart `rounded-xl` qo'shilmaydi (ikki `rounded-*` to'qnashmasin).
  const radius = className?.includes('rounded') ? null : 'rounded-xl'
  return (
    <div aria-hidden="true" className={cx('animate-pulse bg-slate-200/70 motion-reduce:animate-none', radius, className)} />
  )
}
