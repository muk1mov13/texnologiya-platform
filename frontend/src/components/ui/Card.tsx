import type { ComponentProps } from 'react'
import { cx } from '@/lib/cx'

export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cx('rounded-2xl border-2 border-slate-100 bg-white p-5', className)} {...rest} />
}
