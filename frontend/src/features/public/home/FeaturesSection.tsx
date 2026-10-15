import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Reveal } from '@/components/motion/Reveal'
import { cx } from '@/lib/cx'
import { stagger, VIEWPORT_ONCE } from '@/lib/motion'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { EYEBROW, SECTION_TITLE } from './styles'

const STEPS = ['review', 'lecture', 'presentation', 'practice', 'task', 'glossary', 'literature'] as const

interface Feature {
  key: string
  icon: IconName
  /** Bento to'ridagi kenglik (4 ustunli grid, `lg` dan). */
  span: string
}

const FEATURES: Feature[] = [
  { key: 'steps', icon: 'layers', span: 'lg:col-span-2' },
  { key: 'player', icon: 'pdf', span: '' },
  { key: 'activities', icon: 'quiz', span: '' },
  { key: 'xp', icon: 'trophy', span: '' },
  { key: 'tutor', icon: 'sparkles', span: 'lg:col-span-2' },
  { key: 'library', icon: 'book', span: '' },
]

function FeatureExtra({ featureKey }: { featureKey: string }) {
  const { t } = useTranslation()
  if (featureKey === 'steps') {
    return (
      <ul aria-hidden="true" className="mt-5 flex flex-wrap gap-1.5">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1 text-xs font-semibold text-brand-800"
          >
            {index + 1}. {t(`steps.${step}`)}
          </li>
        ))}
      </ul>
    )
  }
  if (featureKey === 'tutor') {
    return (
      <div aria-hidden="true" className="mt-5 flex flex-col gap-2 text-sm">
        <span className="self-end rounded-2xl rounded-br-md bg-slate-100 px-3 py-2 text-slate-700">
          {t('home.features.tutor.ask')}
        </span>
        <span className="max-w-[85%] rounded-2xl rounded-bl-md bg-gradient-to-br from-brand-600 to-brand-800 px-3 py-2 text-white">
          {t('home.features.tutor.answer')}
        </span>
      </div>
    )
  }
  return null
}

/** "Platforma xususiyatlari": bento grid, kartalar ketma-ket paydo bo'ladi. */
export function FeaturesSection() {
  const { t } = useTranslation()
  return (
    <section id="features" aria-labelledby="home-features" className="relative scroll-mt-24 bg-brand-50/60 py-20 sm:py-28">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-100 to-transparent" />
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className={EYEBROW}>{t('home.featuresSection.eyebrow')}</span>
          <h2 id="home-features" className={SECTION_TITLE}>
            {t('home.featuresSection.title')}
          </h2>
          <p className="text-lg text-slate-600">{t('home.featuresSection.subtitle')}</p>
        </Reveal>

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          variants={stagger(0.08)}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((feature) => (
            <SpotlightCard key={feature.key} className={cx(feature.span)}>
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-brand-200/60 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transition-none">
                <Icon name={feature.icon} className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{t(`home.features.${feature.key}.title`)}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{t(`home.features.${feature.key}.text`)}</p>
              <FeatureExtra featureKey={feature.key} />
            </SpotlightCard>
          ))}
        </m.div>
      </div>
    </section>
  )
}
