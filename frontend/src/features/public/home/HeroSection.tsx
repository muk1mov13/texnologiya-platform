import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { homePathFor } from '@/app/paths'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { cx, FOCUS_RING } from '@/lib/cx'
import { EASE_OUT, fadeUp, stagger } from '@/lib/motion'
import { HeroMockup } from './HeroMockup'
import { CTA_PRIMARY, CTA_SECONDARY } from './styles'

const CHIPS: { key: string; icon: IconName }[] = [
  { key: 'steps', icon: 'layers' },
  { key: 'ai', icon: 'sparkles' },
  { key: 'languages', icon: 'globe' },
]

const WORD = {
  hidden: { opacity: 0, y: '0.5em', filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE_OUT } },
}

/** Bosh sahifa "hero" bo'limi: sarlavha so'zma-so'z ochiladi, o'ngda jonli mockup. */
export function HeroSection() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const lead = t('home.hero.title').split(' ')
  const accent = t('home.hero.accent').split(' ')

  return (
    <section className="relative isolate overflow-hidden">
      {/* Fon: suzuvchi gradient bloblar va nozik katak. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-white to-slate-50" />
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="absolute -top-32 -left-24 size-[28rem] animate-blob rounded-full bg-brand-300/40 blur-3xl motion-reduce:animate-none" />
        <div
          className="absolute top-10 right-[-8rem] size-[26rem] animate-blob rounded-full bg-sky-300/30 blur-3xl motion-reduce:animate-none"
          style={{ animationDelay: '-6s' }}
        />
        <div
          className="absolute bottom-[-10rem] left-1/3 size-[22rem] animate-blob rounded-full bg-emerald-200/40 blur-3xl motion-reduce:animate-none"
          style={{ animationDelay: '-12s' }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-24 lg:pb-28">
        <motion.div initial="hidden" animate="show" variants={stagger(0.1)} className="flex flex-col items-start gap-6">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white/70 px-3 py-1 text-sm font-semibold text-brand-800 shadow-sm backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-400 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
            </span>
            {t('home.hero.badge')}
          </motion.span>

          <motion.h1
            variants={stagger(0.05)}
            className="text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-slate-900 sm:text-5xl lg:text-[3.4rem]"
          >
            {lead.map((word, index) => (
              <motion.span key={`l${index}`} variants={WORD} className="mr-[0.25em] inline-block">
                {word}
              </motion.span>
            ))}
            {accent.map((word, index) => (
              <motion.span key={`a${index}`} variants={WORD} className="text-gradient mr-[0.25em] inline-block">
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p variants={fadeUp} className="max-w-xl text-lg leading-relaxed text-slate-600">
            {t('home.hero.subtitle')}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            {user ? (
              <Link to={homePathFor(user)} className={CTA_PRIMARY}>
                {t('home.continue')}
                <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link to="/register" className={CTA_PRIMARY}>
                  {t('home.start')}
                  <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/login" className={CTA_SECONDARY}>
                  {t('nav.login')}
                </Link>
              </>
            )}
          </motion.div>

          <motion.ul variants={fadeUp} className="flex flex-wrap gap-2 pt-2">
            {CHIPS.map((chip) => (
              <li
                key={chip.key}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700 backdrop-blur',
                )}
              >
                <Icon name={chip.icon} className="size-4 text-brand-600" />
                {t(`home.hero.chips.${chip.key}`)}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <HeroMockup />
      </div>

      <a
        href="#features"
        className={cx(
          'absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-semibold text-slate-400 hover:text-brand-700 lg:flex',
          FOCUS_RING,
        )}
      >
        {t('home.hero.scroll')}
        <span className="flex h-8 w-5 justify-center rounded-full border-2 border-current pt-1.5">
          <motion.span
            className="size-1 rounded-full bg-current"
            animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </a>
    </section>
  )
}
