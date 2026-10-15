import { useTranslation } from 'react-i18next'
import { cx } from '@/lib/cx'
import { passwordScore, STRENGTH_LEVELS } from '@/lib/passwordStrength'

const BAR_COLORS = ['bg-red-400', 'bg-amber-400', 'bg-brand-400', 'bg-emerald-500'] as const
const TEXT_COLORS = ['text-red-600', 'text-amber-700', 'text-brand-700', 'text-emerald-700'] as const

/** Parol kuchi ko'rsatkichi: 4 segment va qisqa yozuv. Parol bo'sh bo'lsa ko'rinmaydi. */
export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation()
  const score = passwordScore(password)
  if (score === 0) return null
  const level = score - 1
  return (
    <div className="-mt-1 flex items-center gap-3">
      <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1.5">
        {STRENGTH_LEVELS.map((name, index) => (
          <span
            key={name}
            className={cx(
              'h-1.5 rounded-full transition-colors duration-300',
              index <= level ? BAR_COLORS[level] : 'bg-slate-200',
            )}
          />
        ))}
      </div>
      <p aria-live="polite" className={cx('text-xs font-semibold', TEXT_COLORS[level])}>
        {t(`auth.strength.${STRENGTH_LEVELS[level]}`)}
      </p>
    </div>
  )
}
