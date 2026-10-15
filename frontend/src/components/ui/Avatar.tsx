import { useId, useState } from 'react'
import { avatarStyle, type AvatarPattern } from '@/lib/avatar'
import { cx } from '@/lib/cx'
import { initials } from '@/lib/initials'

interface AvatarProps {
  user: { id: number; full_name: string; avatar_url: string | null }
  /** O'lcham va radius (masalan, `size-8 rounded-[0.65rem]`). */
  className?: string
}

/**
 * Foydalanuvchi avatari: yuklangan rasm yoki (rasm yo'q / yuklanmasa) ID'ga bog'langan o'ziga xos
 * standart avatar. Bezak — ism yonidagi matnda bor, shuning uchun ekran o'quvchidan yashirin.
 */
export function Avatar({ user, className = 'size-10 rounded-xl' }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const url = user.avatar_url !== failedUrl ? user.avatar_url : null
  return (
    <span aria-hidden="true" className={cx('relative block shrink-0 overflow-hidden', className)}>
      {url ? (
        <img
          src={url}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <DefaultAvatar userId={user.id} text={initials(user.full_name)} />
      )}
    </span>
  )
}

function DefaultAvatar({ userId, text }: { userId: number; text: string }) {
  const id = useId()
  const { palette, pattern, rotate } = avatarStyle(userId)
  return (
    <svg viewBox="0 0 100 100" className="size-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}g)`} />
      <g transform={`rotate(${rotate} 50 50)`} fill="none" stroke="#fff" strokeOpacity="0.22">
        <Pattern kind={pattern} />
      </g>
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fill={palette.ink}
        fontSize={text.length > 1 ? 36 : 42}
        fontWeight={800}
        letterSpacing="-1"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {text}
      </text>
    </svg>
  )
}

function Pattern({ kind }: { kind: AvatarPattern }) {
  switch (kind) {
    case 'orbs':
      return (
        <>
          <circle cx="12" cy="14" r="26" fill="#fff" fillOpacity="0.14" stroke="none" />
          <circle cx="92" cy="88" r="34" fill="#fff" fillOpacity="0.10" stroke="none" />
          <circle cx="86" cy="18" r="9" strokeWidth="3" />
        </>
      )
    case 'waves':
      return (
        <>
          <path d="M-10 30 Q 15 15 40 30 T 90 30 T 140 30" strokeWidth="5" />
          <path d="M-10 78 Q 15 63 40 78 T 90 78 T 140 78" strokeWidth="5" />
        </>
      )
    case 'grid':
      return (
        <>
          {[20, 40, 60, 80].map((x) => (
            <path key={`v${x}`} d={`M${x} -5V105`} strokeWidth="1.5" />
          ))}
          {[20, 40, 60, 80].map((y) => (
            <path key={`h${y}`} d={`M-5 ${y}H105`} strokeWidth="1.5" />
          ))}
        </>
      )
    case 'rays':
      return (
        <>
          {[0, 1, 2, 3, 4].map((n) => (
            <path key={n} d={`M${-20 + n * 28} 110 L${30 + n * 28} -10`} strokeWidth="7" />
          ))}
        </>
      )
  }
}
