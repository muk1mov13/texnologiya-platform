import type { Transition, Variants } from 'motion/react'

/** Ochiq sayt animatsiyalari uchun umumiy egri chiziq (yumshoq "ease-out-expo"). */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 32 }

/** `whileInView`: element ekranga bir marta kirganda ishlaydi. */
export const VIEWPORT_ONCE = { once: true, margin: '0px 0px -80px 0px' } as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE_OUT } },
}

/** `show` holatiga kechikish qo'shadi (variantdagi `transition` prop'dagidan ustun turadi). */
export function withDelay(variants: Variants, delay: number): Variants {
  const show = variants.show
  if (!show || typeof show === 'function') return variants
  return { ...variants, show: { ...show, transition: { ...show.transition, delay } } }
}

/** Bolalarini ketma-ket ochadigan ota variant. */
export function stagger(step = 0.08, delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: step, delayChildren: delay } },
  }
}
