import { useTranslation } from 'react-i18next'

interface ProgressRingProps {
  completed: number
  total: number
  size?: number
  /** Qiymat yonidagi matnda allaqachon yozilgan bo'lsa — halqa ekran o'quvchidan yashiriladi. */
  decorative?: boolean
}

export function ProgressRing({ completed, total, size = 56, decorative = false }: ProgressRingProps) {
  const { t } = useTranslation()
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? Math.max(0, Math.min(completed / total, 1)) : 0
  const center = size / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': t('common.progress', { completed, total }) })}
      className="shrink-0"
    >
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-brand-100)" strokeWidth={stroke} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--color-brand-500)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-slate-700 text-xs font-bold"
      >
        {completed}/{total}
      </text>
    </svg>
  )
}
