import { motion, useScroll, useSpring } from 'motion/react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Reveal } from '@/components/motion/Reveal'
import { fadeUp, stagger, VIEWPORT_ONCE } from '@/lib/motion'
import { EYEBROW, SECTION_TITLE } from './styles'

const STEPS: { key: string; icon: IconName }[] = [
  { key: 'register', icon: 'user' },
  { key: 'approve', icon: 'shield' },
  { key: 'choose', icon: 'layers' },
  { key: 'learn', icon: 'trophy' },
]

/**
 * "Platforma qanday ishlaydi": 4 qadam. Ularni bog'lovchi chiziq bo'lim scroll qilinganda
 * to'ladi (katta ekranda gorizontal, telefonda vertikal).
 */
export function HowItWorksSection() {
  const { t } = useTranslation()
  const listRef = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 85%', 'end 55%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <section id="how-it-works" aria-labelledby="home-how" className="relative scroll-mt-24 overflow-hidden bg-white py-20 sm:py-28">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className={EYEBROW}>{t('home.how.eyebrow')}</span>
          <h2 id="home-how" className={SECTION_TITLE}>
            {t('home.how.title')}
          </h2>
          <p className="text-lg text-slate-600">{t('home.how.subtitle')}</p>
        </Reveal>

        <motion.ol
          ref={listRef}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          variants={stagger(0.12)}
          className="relative grid gap-10 lg:grid-cols-4 lg:gap-6"
        >
          {/* Bog'lovchi chiziq: kulrang asos ustida scroll bilan to'ladigan gradient. */}
          <div aria-hidden="true" className="absolute top-7 bottom-7 left-7 w-0.5 bg-slate-200 lg:hidden">
            <motion.div style={{ scaleY: progress }} className="size-full origin-top bg-gradient-to-b from-brand-400 to-brand-700" />
          </div>
          <div aria-hidden="true" className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-0.5 bg-slate-200 lg:block">
            <motion.div style={{ scaleX: progress }} className="size-full origin-left bg-gradient-to-r from-brand-400 to-brand-700" />
          </div>

          {STEPS.map((step, index) => (
            <motion.li
              key={step.key}
              variants={fadeUp}
              className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
            >
              <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow ring-4 ring-white">
                <Icon name={step.icon} className="size-6" />
                <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-white text-xs font-extrabold text-brand-800 shadow-soft ring-1 ring-brand-100">
                  {index + 1}
                </span>
              </span>
              <div className="flex flex-col gap-2 pt-1 lg:mt-6 lg:px-2">
                <h3 className="text-lg font-bold text-slate-900">{t(`home.how.steps.${step.key}.title`)}</h3>
                <p className="leading-relaxed text-slate-600">{t(`home.how.steps.${step.key}.text`)}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
