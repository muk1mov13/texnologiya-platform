import type { ComponentProps } from 'react'
import { cx } from '@/lib/cx'

/** Asosiy sirt: yumshoq soya va nozik halqa (ochiq sayt bilan bir xil "premium" uslub). */
export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cx('rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-200/70', className)} {...rest} />
}
