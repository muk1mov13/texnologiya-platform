import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { cx, FOCUS_RING } from '@/lib/cx'

interface IconActionProps {
  icon: IconName
  /** Tugma nomi: `aria-label` va hover'dagi `title`. */
  label: string
  onClick: () => void
  disabled?: boolean
  /** Almashtiriladigan tugma holati (`aria-pressed`). */
  pressed?: boolean
}

/** Ro'yxat va daraxtlardagi ixcham ikonka-tugma (tartib, tahrirlash, o'chirish). */
export function IconAction({ icon, label, onClick, disabled, pressed }: IconActionProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        'grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-brand-700 hover:shadow-soft',
        pressed && 'bg-brand-50 text-brand-700',
        'disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none',
        FOCUS_RING,
      )}
    >
      <Icon name={icon} className="size-4" />
    </button>
  )
}
