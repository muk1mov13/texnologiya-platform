import type { KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { StepKind } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { cx } from '@/lib/cx'
import { STEP_ICON_NAMES, STEP_KINDS } from '@/lib/steps'

interface StepNavProps {
  value: StepKind
  onChange: (kind: StepKind) => void
  /** Bosqichdagi elementlar soni; `null` — noma'lum (faoliyatlar alohida so'rovda). */
  countOf: (kind: StepKind) => number | null
}

const NEXT_KEYS = new Set(['ArrowDown', 'ArrowRight'])
const PREV_KEYS = new Set(['ArrowUp', 'ArrowLeft'])

/**
 * Mavzu bosqichlari menyusi (`role=tablist`): katta ekranda chapdagi vertikal ro'yxat, kichik
 * ekranda gorizontal suriladigan qator. Panel `panel-<kind>` id bilan sahifada chiziladi.
 */
export function StepNav({ value, onChange, countOf }: StepNavProps) {
  const { t } = useTranslation()

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const offset = NEXT_KEYS.has(event.key) ? 1 : PREV_KEYS.has(event.key) ? -1 : 0
    if (offset === 0) return
    event.preventDefault()
    const index = STEP_KINDS.indexOf(value)
    const next = STEP_KINDS[(index + offset + STEP_KINDS.length) % STEP_KINDS.length]
    onChange(next)
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={t('teach.stepsLabel')}
      onKeyDown={onKeyDown}
      className={cx(
        'flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-soft ring-1 ring-slate-200/70',
        'lg:sticky lg:top-6 lg:flex-col lg:overflow-visible lg:p-2',
      )}
    >
      {STEP_KINDS.map((kind, index) => {
        const selected = kind === value
        const count = countOf(kind)
        return (
          <button
            key={kind}
            type="button"
            role="tab"
            id={`tab-${kind}`}
            data-tab={kind}
            aria-selected={selected}
            aria-controls={`panel-${kind}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(kind)}
            className={cx(
              'group flex shrink-0 items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-semibold whitespace-nowrap',
              'transition-colors motion-reduce:transition-none',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700',
              selected ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                'grid size-8 shrink-0 place-items-center rounded-lg ring-1 transition-colors motion-reduce:transition-none',
                selected
                  ? 'bg-white text-brand-700 shadow-soft ring-brand-200'
                  : 'bg-slate-50 text-slate-500 ring-slate-200/70 group-hover:text-slate-700',
              )}
            >
              <Icon name={STEP_ICON_NAMES[kind]} className="size-4" />
            </span>
            <span className="flex-1">
              <span className="mr-1.5 text-xs font-medium text-slate-400 tabular-nums">{index + 1}</span>
              {t(`steps.${kind}`)}
            </span>
            {count !== null && count > 0 && (
              <span
                className={cx(
                  'rounded-md px-1.5 text-xs tabular-nums',
                  selected ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600',
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
