import { useSyncExternalStore } from 'react'

/** `matchMedia` bo'lmagan muhitda (jsdom, juda eski brauzer) — `null`, hook `false` qaytaradi. */
function mediaList(query: string): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null
}

/** CSS media query holati; o'zgarganda qayta chiziladi. SSR/test'da `false`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = mediaList(query)
      list?.addEventListener('change', onChange)
      return () => list?.removeEventListener('change', onChange)
    },
    () => mediaList(query)?.matches ?? false,
    () => false,
  )
}
