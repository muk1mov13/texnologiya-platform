import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { EYEBROW } from '@/components/ui/styles'
import { cx } from '@/lib/cx'
import { fadeUp, stagger } from '@/lib/motion'

interface PageHeroProps {
  eyebrow: string
  icon: IconName
  title: string
  subtitle?: string
  /** O'ng ustun (desktop) yoki pastki qism (telefon): statistika, tezkor havolalar va h.k. */
  aside?: ReactNode
  /** Sarlavha ostidagi qo'shimcha element (masalan, bo'lim tanlovi). */
  children?: ReactNode
  className?: string
}

/**
 * Ochiq ichki sahifalar sarlavha bloki: bosh sahifa hero'sining kichik nusxasi —
 * yumshoq gradient, nozik katak va xira bloblar ustida yorliq, katta sarlavha va izoh.
 */
export function PageHero({ eyebrow, icon, title, subtitle, aside, children, className }: PageHeroProps) {
  return (
    <section
      className={cx(
        'relative isolate overflow-hidden rounded-[2rem] bg-white px-6 py-10 ring-1 ring-brand-100 sm:px-10 sm:py-14',
        className,
      )}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-sky-50/60" />
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top_left,black_25%,transparent_70%)]" />
        <div className="absolute -top-24 -right-16 size-80 animate-blob rounded-full bg-brand-200/50 blur-3xl motion-reduce:animate-none" />
        <div
          className="absolute -bottom-28 left-1/4 size-72 animate-blob rounded-full bg-sky-200/40 blur-3xl motion-reduce:animate-none"
          style={{ animationDelay: '-9s' }}
        />
      </div>

      <div className={cx('grid gap-10', aside != null &&'lg:grid-cols-[1.4fr_1fr] lg:items-end')}>
        <m.div initial="hidden" animate="show" variants={stagger(0.08)} className="flex min-w-0 flex-col items-start gap-4">
          <m.span variants={fadeUp} className={EYEBROW}>
            <Icon name={icon} className="size-3.5" strokeWidth={2.2} />
            {eyebrow}
          </m.span>
          <m.h1
            variants={fadeUp}
            className="text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-slate-900 sm:text-5xl"
          >
            {title}
          </m.h1>
          {subtitle && (
            <m.p variants={fadeUp} className="max-w-2xl text-lg leading-relaxed text-pretty text-slate-600">
              {subtitle}
            </m.p>
          )}
          {children && (
            <m.div variants={fadeUp} className="w-full pt-2">
              {children}
            </m.div>
          )}
        </m.div>
        {aside && (
          <m.div initial="hidden" animate="show" variants={fadeUp} className="min-w-0">
            {aside}
          </m.div>
        )}
      </div>
    </section>
  )
}
