import { type FocusEvent, type KeyboardEvent, type PointerEvent, useCallback, useEffect, useState } from 'react'

/**
 * Karusel holati: faol slayd, o'tish yo'nalishi (`1` oldinga, `-1` orqaga) va avtoplay pauzasi.
 * Pauza: sichqoncha ustida, klaviatura fokusi ichida yoki tab yashirin bo'lsa. Vaqtni hook
 * o'lchamaydi — uni progress chizig'ining CSS animatsiyasi beradi (`onAnimationEnd` → `next`).
 */
export function useCarousel(count: number) {
  const [[index, direction], setState] = useState<[number, number]>([0, 1])
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(() => document.hidden)

  useEffect(() => {
    const onChange = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  const paginate = useCallback(
    (delta: number) => setState(([i]) => [(i + delta + count) % count, delta]),
    [count],
  )
  const goTo = useCallback(
    (next: number) => setState((prev) => (next === prev[0] ? prev : [next, next > prev[0] ? 1 : -1])),
    [],
  )

  const rootProps = {
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setHovered(true)
    },
    onPointerLeave: () => setHovered(false),
    // Sichqoncha bosganda qolgan fokus pauza qilmaydi — faqat klaviatura fokusi.
    onFocus: (e: FocusEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches(':focus-visible')) setFocused(true)
    },
    onBlur: (e: FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') paginate(-1)
      else if (e.key === 'ArrowRight') paginate(1)
    },
  }

  return {
    index: count > 0 ? index % count : 0,
    direction,
    paginate,
    goTo,
    paused: hovered || focused || hidden,
    rootProps,
  }
}
