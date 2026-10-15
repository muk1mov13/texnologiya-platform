import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { cx } from '@/lib/cx'
import { fadeUp, stagger } from '@/lib/motion'
import { EYEBROW_DARK } from './home/styles'

const PERKS: { key: string; icon: IconName }[] = [
  { key: 'steps', icon: 'layers' },
  { key: 'ai', icon: 'sparkles' },
  { key: 'xp', icon: 'trophy' },
]

/** Kirish/ro'yxatdan o'tish/tasdiq kutish sahifasining chap to'q paneli (faqat `lg+`). */
export function AuthAside({ variant }: { variant: 'login' | 'register' | 'pending' }) {
  const { t } = useTranslation()
  return (
    <div className="relative isolate hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 p-10 text-white lg:flex lg:flex-col xl:p-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-20 size-80 animate-blob rounded-full bg-brand-400/35 blur-3xl motion-reduce:animate-none" />
        <div
          className="absolute -right-24 -bottom-24 size-96 animate-blob rounded-full bg-sky-400/20 blur-3xl motion-reduce:animate-none"
          style={{ animationDelay: '-9s' }}
        />
        <div className="absolute inset-0 bg-grid opacity-20 invert [mask-image:radial-gradient(ellipse_at_top_left,black_25%,transparent_70%)]" />
      </div>

      <m.div initial="hidden" animate="show" variants={stagger(0.1, 0.15)} className="flex flex-1 flex-col">
        <m.span variants={fadeUp} className={cx(EYEBROW_DARK, 'self-start')}>
          <Icon name="sparkles" className="size-3.5" />
          {t('auth.aside.eyebrow')}
        </m.span>
        <m.h2
          variants={fadeUp}
          className="mt-6 text-3xl leading-tight font-extrabold tracking-tight text-balance xl:text-4xl"
        >
          {t(`auth.aside.${variant}Title`)}
        </m.h2>
        <m.p variants={fadeUp} className="mt-4 max-w-sm text-base leading-relaxed text-brand-100/80">
          {t(`auth.aside.${variant}Text`)}
        </m.p>

        <m.ul variants={stagger(0.08)} className="mt-10 flex flex-col gap-5">
          {PERKS.map((perk) => (
            <m.li key={perk.key} variants={fadeUp} className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-200 ring-1 ring-white/15 backdrop-blur">
                <Icon name={perk.icon} className="size-5" />
              </span>
              <span>
                <span className="block font-bold">{t(`auth.aside.perks.${perk.key}.title`)}</span>
                <span className="block text-sm text-brand-100/70">{t(`auth.aside.perks.${perk.key}.text`)}</span>
              </span>
            </m.li>
          ))}
        </m.ul>

        <m.p variants={fadeUp} className="mt-auto pt-10 text-xs font-medium text-brand-100/60">
          {t('auth.aside.institute')}
        </m.p>
      </m.div>
    </div>
  )
}
