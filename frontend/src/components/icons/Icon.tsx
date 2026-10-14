import type { SVGProps } from 'react'
import { ICON_PATHS, type IconName } from './paths'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
}

/** Bezak ikonka: doim `aria-hidden`, ma'noni yonidagi matn beradi. */
export function Icon({ name, className = 'size-5', ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
