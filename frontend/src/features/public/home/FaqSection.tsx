import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useFaq } from '@/api/cms'
import { Icon } from '@/components/icons/Icon'
import { Reveal } from '@/components/motion/Reveal'
import { FaqAccordion } from '@/components/ui/FaqAccordion'
import { cx, FOCUS_RING } from '@/lib/cx'
import { EYEBROW, SECTION_TITLE } from './styles'

const HOME_FAQ = 6

/** Bosh sahifadagi FAQ: CMS'dagi birinchi 6 savol; ro'yxat bo'sh yoki xato bo'lsa bo'lim chiqmaydi. */
export function FaqSection() {
  const { t } = useTranslation()
  const faq = useFaq()
  const items = faq.data?.slice(0, HOME_FAQ) ?? []
  if (items.length === 0) return null

  return (
    <section id="faq" aria-labelledby="home-faq" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <Reveal className="flex flex-col items-start gap-4 lg:sticky lg:top-28 lg:self-start">
          <span className={EYEBROW}>{t('home.faq.eyebrow')}</span>
          <h2 id="home-faq" className={SECTION_TITLE}>
            {t('home.faq.title')}
          </h2>
          <p className="text-lg text-slate-600">{t('home.faq.subtitle')}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/faq"
              className={cx(
                'group inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-4 py-2.5 font-semibold text-brand-800 hover:bg-brand-100',
                FOCUS_RING,
              )}
            >
              {t('home.faq.all')}
              <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/contact"
              className={cx('inline-flex items-center rounded-xl px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-100', FOCUS_RING)}
            >
              {t('faq.contactLink')}
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <FaqAccordion items={items} />
        </Reveal>
      </div>
    </section>
  )
}
