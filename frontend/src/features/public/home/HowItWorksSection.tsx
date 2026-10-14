import { m, useScroll, useSpring } from 'motion/react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Reveal } from '@/components/motion/Reveal'
import { fadeUp, stagger, VIEWPORT_ONCE } from '@/lib/motion'
import { EYEBROW_DARK, SECTION_TITLE_DARK } from './styles'

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
    <section id="how-it-works" aria-labelledby="home-how" className="relative scroll-mt-24 isolate overflow-hidden bg-brand-950 py-20 text-brand-50 sm:py-28">
      {/* Bezak: footer bilan bir xil nur, xira katak va chegaralardagi yorug' chiziqlar. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand-700/35 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-10 invert [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300/40 to-transparent" />
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className={EYEBROW_DARK}>{t('home.how.eyebrow')}</span>
          <h2 id="home-how" className={SECTION_TITLE_DARK}>
            {t('home.how.title')}
          </h2>
          <p className="text-lg text-brand-100/75">{t('home.how.subtitle')}</p>
        </Reveal>

        <m.ol
          ref={listRef}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          variants={stagger(0.12)}
          className="relative grid gap-10 lg:grid-cols-4 lg:gap-6"
        >
          {/* Bog'lovchi chiziq: kulrang asos ustida scroll bilan to'ladigan gradient. */}
          <div aria-hidden="true" className="absolute top-7 bottom-7 left-7 w-0.5 bg-white/15 lg:hidden">
            <m.div style={{ scaleY: progress }} className="size-full origin-top bg-gradient-to-b from-brand-300 to-brand-500" />
          </div>
          <div aria-hidden="true" className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-0.5 bg-white/15 lg:block">
            <m.div style={{ scaleX: progress }} className="size-full origin-left bg-gradient-to-r from-brand-300 to-brand-500" />
          </div>

          {STEPS.map((step, index) => (
            <m.li
              key={step.key}
              variants={fadeUp}
              className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
            >
              <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow ring-4 ring-brand-950">
                <Icon name={step.icon} className="size-6" />
                <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-white text-xs font-extrabold text-brand-800 shadow-soft ring-1 ring-brand-100">
                  {index + 1}
                </span>
              </span>
              <div className="flex flex-col gap-2 pt-1 lg:mt-6 lg:px-2">
                <h3 className="text-lg font-bold text-white">{t(`home.how.steps.${step.key}.title`)}</h3>
                <p className="leading-relaxed text-brand-100/75">{t(`home.how.steps.${step.key}.text`)}</p>
              </div>
            </m.li>
          ))}
        </m.ol>
      </div>
    </section>
  )
}
