import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { homePathFor } from '@/app/paths'
import { Icon } from '@/components/icons/Icon'
import { cx } from '@/lib/cx'
import { fadeUp, scaleIn, stagger, VIEWPORT_ONCE } from '@/lib/motion'

const WHITE_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

/** Yakuniy chaqiriq: "Ta'limingizni yangi bosqichga olib chiqmoqchimisiz?" — gradient panel. */
export function CtaSection() {
  const { t } = useTranslation()
  const user = useCurrentUser()

  return (
    <section aria-labelledby="home-cta" className="px-4 py-20 sm:py-24">
      <m.div
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={scaleIn}
        className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-800 to-brand-950 px-6 py-16 text-center text-white shadow-glow sm:px-12 sm:py-20"
      >
        {/* Bezaklar: bloblar, katak va ustidan o'tadigan yaltiroq chiziq. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-20 size-80 animate-blob rounded-full bg-brand-400/40 blur-3xl motion-reduce:animate-none" />
          <div
            className="absolute -right-16 -bottom-28 size-96 animate-blob rounded-full bg-sky-400/25 blur-3xl motion-reduce:animate-none"
            style={{ animationDelay: '-9s' }}
          />
          <div className="absolute inset-0 bg-grid opacity-25 invert [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
          <div className="absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/15 to-transparent motion-reduce:hidden" />
        </div>

        <m.div variants={stagger(0.1, 0.15)} className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <m.span
            variants={fadeUp}
            className="grid size-14 place-items-center rounded-2xl bg-white/10 text-brand-100 ring-1 ring-white/20 backdrop-blur"
          >
            <Icon name="sparkles" className="size-7" />
          </m.span>
          <m.h2
            variants={fadeUp}
            id="home-cta"
            className="text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            {t('home.cta.title')}
          </m.h2>
          <m.p variants={fadeUp} className="text-lg text-balance text-brand-100">
            {t('home.cta.text')}
          </m.p>
          <m.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to={user ? homePathFor(user) : '/register'}
              className={cx(
                'group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-base font-bold text-brand-900 shadow-lg',
                'transition duration-300 hover:-translate-y-0.5 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                WHITE_FOCUS,
              )}
            >
              {t(user ? 'home.continue' : 'home.start')}
              <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/contact"
              className={cx(
                'inline-flex items-center rounded-2xl border border-white/30 bg-white/5 px-7 py-3.5 text-base font-bold text-white backdrop-blur',
                'transition duration-300 hover:bg-white/15',
                WHITE_FOCUS,
              )}
            >
              {t('home.cta.contact')}
            </Link>
          </m.div>
        </m.div>
      </m.div>
    </section>
  )
}
