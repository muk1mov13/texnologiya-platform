import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/lib/cx'

/** Bitta kartadagi qatorlar ro'yxati (qatorlar orasida nozik chiziq). */
export function DataList({ className, ...rest }: ComponentProps<'ul'>) {
  return (
    <ul
      className={cx(
        'divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70',
        className,
      )}
      {...rest}
    />
  )
}

interface ListRowProps extends Omit<ComponentProps<'li'>, 'title'> {
  /** Chapdagi belgi: Avatar, ikonka yoki muqova. */
  leading?: ReactNode
  title: ReactNode
  /** Sarlavha ostidagi ikkinchi qator. */
  meta?: ReactNode
  /** Holat belgilari (badge). */
  badges?: ReactNode
  /** O'ng tomondagi tugmalar. */
  actions?: ReactNode
  /** Qo'shimcha tarkib (sarlavha ostida). */
  extra?: ReactNode
}

/** `DataList` qatori: telefonda ustma-ust, kengroq ekranda bir qatorda. */
export function ListRow({ leading, title, meta, badges, actions, extra, className, ...rest }: ListRowProps) {
  return (
    <li
      className={cx(
        'flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-slate-50/70 motion-reduce:transition-none sm:px-6',
        className,
      )}
      {...rest}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-48 flex-1">
        <div className="font-semibold break-words text-slate-900">{title}</div>
        {meta && <div className="mt-0.5 text-sm break-words text-slate-500">{meta}</div>}
        {extra}
      </div>
      {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </li>
  )
}
