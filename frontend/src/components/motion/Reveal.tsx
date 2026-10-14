import { motion, type HTMLMotionProps } from 'motion/react'
import { fadeUp, VIEWPORT_ONCE, withDelay } from '@/lib/motion'

interface RevealProps extends HTMLMotionProps<'div'> {
  /** Paydo bo'lishdan oldingi kechikish (soniya). */
  delay?: number
}

/**
 * Ekranga kirganda pastdan yumshoq paydo bo'ladigan o'ram. Bolalari `hidden`/`show` variantli
 * bo'lsa, ular ham shu holatni meros oladi (stagger uchun).
 */
export function Reveal({ delay = 0, variants = fadeUp, ...rest }: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT_ONCE}
      variants={delay ? withDelay(variants, delay) : variants}
      {...rest}
    />
  )
}
