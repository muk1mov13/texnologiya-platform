import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { cx } from '@/lib/cx'
import { EASE_OUT } from '@/lib/motion'

/** Mavzu bosqichlari platformadagi tartibda (`StepKind`). */
const STEPS = ['review', 'lecture', 'presentation', 'practice', 'task', 'glossary', 'literature'] as const
/** Mockupda nechta bosqich "bajarilgan" ko'rinadi. */
const DONE = 5
const STEP_DELAY = 0.18
const START = 0.6

interface FloatingCardProps {
  icon: IconName
  label: string
  className: string
  delay: number
}

function FloatingCard({ icon, label, className, delay }: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: EASE_OUT }}
      className={cx('absolute', className)}
    >
      <div
        className="flex animate-float items-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-3 py-2 text-sm font-bold text-slate-800 shadow-soft backdrop-blur-md motion-reduce:animate-none"
        style={{ animationDelay: `${delay}s` }}
      >
        <span className="grid size-7 place-items-center rounded-lg bg-brand-100 text-brand-700">
          <Icon name={icon} className="size-4" />
        </span>
        {label}
      </div>
    </motion.div>
  )
}

/**
 * Hero o'ng tomonidagi bezak: mavzu kartasi, bosqichlar ketma-ket bajariladi, progress o'sadi.
 * Faqat ko'rgazma — ekran o'quvchidan yashirilgan.
 */
export function HeroMockup() {
  const { t } = useTranslation()
  const ratio = DONE / STEPS.length

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none lg:mx-0">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-300/40 via-sky-200/30 to-transparent blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.2 }}
        className="relative rounded-3xl border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur-xl sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">
              {t('home.hero.mock.subject')}
            </span>
            <span className="text-base font-extrabold text-slate-900">{t('home.hero.mock.topic')}</span>
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">
            {DONE}/{STEPS.length}
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full origin-left rounded-full bg-gradient-to-r from-brand-400 to-brand-700"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: ratio }}
            transition={{ delay: START, duration: STEP_DELAY * DONE + 0.4, ease: EASE_OUT }}
          />
        </div>

        <ol className="mt-4 flex flex-col gap-1.5">
          {STEPS.map((step, index) => {
            const done = index < DONE
            const current = index === DONE
            return (
              <motion.li
                key={step}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.06, duration: 0.5, ease: EASE_OUT }}
                className={cx(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold',
                  current ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-200' : 'text-slate-600',
                )}
              >
                <span className="relative grid size-6 shrink-0 place-items-center rounded-full border-2 border-slate-200 bg-white">
                  {done && (
                    <motion.span
                      className="absolute inset-[-2px] grid place-items-center rounded-full bg-brand-600 text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: START + index * STEP_DELAY, type: 'spring', stiffness: 500, damping: 22 }}
                    >
                      <Icon name="check" className="size-3.5" strokeWidth={3} />
                    </motion.span>
                  )}
                  {current && <span className="size-2 animate-pulse rounded-full bg-brand-500" />}
                </span>
                <span className="flex-1">{t(`steps.${step}`)}</span>
                <span className="text-xs font-medium text-slate-400 tabular-nums">{index + 1}</span>
              </motion.li>
            )
          })}
        </ol>
      </motion.div>

      <FloatingCard icon="trophy" label={t('home.hero.mock.xp')} className="-top-5 -right-2 sm:-right-8" delay={START + DONE * STEP_DELAY} />
      <FloatingCard icon="sparkles" label={t('home.hero.mock.ai')} className="-bottom-6 -left-2 sm:-left-10" delay={1.6} />
      <FloatingCard icon="shield" label={t('home.hero.mock.badge')} className="top-1/2 -right-3 hidden sm:block sm:-right-14" delay={2} />
    </div>
  )
}
