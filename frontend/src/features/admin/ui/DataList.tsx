import type { ComponentProps, ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { cx } from '@/lib/cx'

/**
 * Bitta kartadagi qatorlar ro'yxati (qatorlar orasida nozik chiziq). `flat` — soyasiz, `Panel`
 * ichida ishlatish uchun (karta ichida karta bo'lmasin).
 */
export function DataList({ className, flat = false, ...rest }: ComponentProps<'ul'> & { flat?: boolean }) {
  return (
    <ul
      className={cx(
        'divide-y divide-slate-100 overflow-hidden bg-white ring-1 ring-slate-200/70',
        flat ? 'rounded-2xl' : 'rounded-3xl shadow-soft',
        className,
      )}
      {...rest}
    />
  )
}

type RowIconTone = 'brand' | 'slate' | 'amber' | 'rose' | 'green'

const ROW_ICON_TONES: Record<RowIconTone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200/70',
  slate: 'bg-slate-50 text-slate-500 ring-slate-200/70',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200/70',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
}

/** `ListRow.leading` uchun ikonka plitkasi. */
export function RowIcon({ icon, tone = 'slate' }: { icon: IconName; tone?: RowIconTone }) {
  return (
    <span aria-hidden="true" className={cx('grid size-10 place-items-center rounded-xl ring-1', ROW_ICON_TONES[tone])}>
      <Icon name={icon} className="size-5" />
    </span>
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
  /** Qator ostidagi to'liq kenglikdagi tarkib (masalan, ko'rib chiqish). */
  below?: ReactNode
}

/** `DataList` qatori: telefonda ustma-ust, kengroq ekranda bir qatorda. */
export function ListRow({ leading, title, meta, badges, actions, extra, below, className, ...rest }: ListRowProps) {
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
      {below && <div className="basis-full">{below}</div>}
    </li>
  )
}
