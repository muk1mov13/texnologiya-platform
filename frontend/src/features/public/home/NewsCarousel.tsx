import { AnimatePresence, m, type PanInfo, type Variants } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { newsCoverUrl } from '@/api/cms'
import type { NewsCard } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { EASE_OUT } from '@/lib/motion'
import { NewsCoverFallback } from '../NewsCoverFallback'
import { useCarousel } from './useCarousel'

/** Swipe: shuncha pikselga surilsa yoki tez "silkitilsa" slayd almashadi. */
const SWIPE_OFFSET = 80
const SWIPE_VELOCITY = 500

const coverVariants: Variants = {
  enter: { opacity: 0, scale: 1.08 },
  center: {
    opacity: 1,
    scale: 1,
    transition: { opacity: { duration: 0.7, ease: EASE_OUT }, scale: { duration: 1.6, ease: EASE_OUT } },
  },
  exit: { opacity: 0, transition: { duration: 0.7, ease: EASE_OUT } },
}

/** Matn yo'nalish bo'yicha kiradi; blur ikki holatning ustma-ust ko'rinishini yashiradi. */
const textVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 36, filter: 'blur(6px)' }),
  center: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE_OUT },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -24,
    filter: 'blur(6px)',
    transition: { duration: 0.22, ease: EASE_OUT },
  }),
}

const CONTROL = cx(
  'grid size-11 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md',
  'transition-[background-color,scale] duration-150 ease-out hover:bg-white/25 active:scale-95',
  FOCUS_RING,
  'focus-visible:outline-white',
)

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * So'nggi yangiliklar karuseli: katta muqovali slayd (butunligicha `/news/:slug` havolasi),
 * oldingi/keyingi tugmalar, swipe va ostida avtoplay chizig'li ro'yxat (mobilda faqat chiziqlar).
 */
export function NewsCarousel({ items }: { items: NewsCard[] }) {
  const { t, i18n } = useTranslation()
  const { index, direction, paginate, goTo, paused, rootProps } = useCarousel(items.length)
  const dragged = useRef(false)
  const item = items[index]
  const multi = items.length > 1

  // Keyingi muqovani oldindan yuklab qo'yamiz — almashganda rasm "yalt" etib chiqmasin.
  const upcoming = items[(index + 1) % items.length]
  useEffect(() => {
    if (multi && upcoming?.has_cover) new Image().src = newsCoverUrl(upcoming)
  }, [multi, upcoming])

  if (!item) return null

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_OFFSET || Math.abs(info.velocity.x) > SWIPE_VELOCITY) {
      paginate(info.offset.x < 0 ? 1 : -1)
    }
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={t('home.latestNews')} {...rootProps}>
      <m.div
        className="relative isolate aspect-[4/5] cursor-grab overflow-hidden rounded-3xl bg-slate-900 shadow-soft select-none active:cursor-grabbing sm:aspect-[16/9] lg:aspect-[21/9]"
        drag={multi ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.16}
        onPointerDown={() => (dragged.current = false)}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={onDragEnd}
        // Surilgandan keyin qo'yib yuborish havolani ochib yubormasin.
        onClickCapture={(e) => {
          if (dragged.current) e.preventDefault()
        }}
      >
        <Link
          to={`/news/${item.slug}`}
          draggable={false}
          className="group absolute inset-0 block rounded-3xl focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-white/80"
        >
          <AnimatePresence initial={false}>
            <m.div
              key={item.id}
              variants={coverVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              {item.has_cover ? (
                <img
                  src={newsCoverUrl(item)}
                  alt=""
                  draggable={false}
                  className="size-full object-cover"
                />
              ) : (
                <NewsCoverFallback className="items-start pt-20 sm:items-center sm:justify-end sm:pt-0 sm:pr-16" />
              )}
            </m.div>
          </AnimatePresence>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent sm:bg-gradient-to-tr sm:via-slate-950/30"
          />
          <div aria-live={paused ? 'polite' : 'off'} className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:max-w-3xl lg:p-12">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <m.div
                key={item.id}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col items-start gap-3 sm:gap-4"
              >
                {item.published_at && (
                  <time
                    dateTime={item.published_at}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md"
                  >
                    <Icon name="clock" className="size-3.5" strokeWidth={2.2} />
                    {formatDate(item.published_at, i18n.language)}
                  </time>
                )}
                <h3 className="text-2xl leading-tight font-extrabold tracking-tight text-balance text-white sm:text-4xl lg:text-[2.6rem]">
                  {item.title}
                </h3>
                {item.excerpt && (
                  <p className="hidden max-w-2xl leading-relaxed text-pretty text-white/80 sm:line-clamp-2">
                    {item.excerpt}
                  </p>
                )}
                <span className="mt-1 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-soft transition-[scale] duration-150 ease-out group-active:scale-[0.97]">
                  {t('news.read')}
                  <Icon
                    name="arrowRight"
                    className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </span>
              </m.div>
            </AnimatePresence>
          </div>
        </Link>

        {multi && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-5 left-5 rounded-full bg-slate-950/40 px-3 py-1 text-xs font-bold tracking-wider text-white tabular-nums ring-1 ring-white/15 backdrop-blur-md sm:top-6 sm:left-6"
            >
              {pad2(index + 1)} <span className="text-white/50">/ {pad2(items.length)}</span>
            </span>
            <div className="absolute top-4 right-4 flex gap-2 sm:top-5 sm:right-5">
              <button type="button" aria-label={t('home.newsPrev')} onClick={() => paginate(-1)} className={CONTROL}>
                <Icon name="arrowLeft" className="size-5" />
              </button>
              <button type="button" aria-label={t('home.newsNext')} onClick={() => paginate(1)} className={CONTROL}>
                <Icon name="arrowRight" className="size-5" />
              </button>
            </div>
          </>
        )}
      </m.div>

      {multi && (
        <ol
          className="mt-4 flex gap-2 md:mt-6 md:grid md:gap-6"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((news, i) => {
            const active = i === index
            return (
              <li key={news.id} className="flex-1">
                <button
                  type="button"
                  aria-label={news.title}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => goTo(i)}
                  className={cx('group block w-full rounded-lg py-3 text-left md:py-0', FOCUS_RING)}
                >
                  <span className="block h-1 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className={cx(
                        'block h-full origin-left rounded-full bg-brand-600',
                        active ? 'animate-progress motion-reduce:animate-none' : 'scale-x-0',
                      )}
                      style={active ? { animationPlayState: paused ? 'paused' : 'running' } : undefined}
                      onAnimationEnd={active ? () => paginate(1) : undefined}
                    />
                  </span>
                  <span className="mt-4 hidden md:block">
                    {news.published_at && (
                      <span className="block text-xs font-semibold text-slate-500">
                        {formatDate(news.published_at, i18n.language)}
                      </span>
                    )}
                    <span
                      className={cx(
                        'mt-1 line-clamp-2 leading-snug font-bold text-balance transition-colors duration-200',
                        active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800',
                      )}
                    >
                      {news.title}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
