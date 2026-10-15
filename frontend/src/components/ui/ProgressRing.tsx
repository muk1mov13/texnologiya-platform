import { useId } from 'react'
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
  // Har bir halqaning gradienti alohida ID bilan — sahifada bir nechta halqa bo'lsa to'qnashmasin.
  const gradientId = useId()
  const stroke = size >= 48 ? 6 : 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? Math.max(0, Math.min(completed / total, 1)) : 0
  const done = total > 0 && ratio === 1
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
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-400)" />
          <stop offset="100%" stopColor="var(--color-brand-700)" />
        </linearGradient>
      </defs>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill={done ? 'var(--color-brand-50)' : 'none'}
        stroke="var(--color-slate-200)"
        strokeOpacity={0.7}
        strokeWidth={stroke}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
      />
      {done ? (
        // Tugatilgan: raqam o'rniga belgi (24×24 ikonka markazga moslab kichraytiriladi).
        <path
          d="M5 12l5 5 9-10"
          fill="none"
          stroke="var(--color-brand-700)"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={`translate(${center - size * 0.2} ${center - size * 0.2}) scale(${(size * 0.4) / 24})`}
        />
      ) : (
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-slate-700 text-xs font-bold tabular-nums"
        >
          {completed}/{total}
        </text>
      )}
    </svg>
  )
}
