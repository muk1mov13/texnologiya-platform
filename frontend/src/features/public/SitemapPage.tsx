import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useNewsPage } from '@/api/cms'
import { homePathFor, LIBRARY_TABS } from '@/app/paths'
import { QueryState } from '@/components/ui/QueryState'
import { formatDate } from '@/lib/format'
import { usePageMeta } from '@/lib/usePageMeta'

/** Sayt xaritasida ko'rsatiladigan oxirgi yangiliklar soni. */
const LATEST_NEWS = 10

const link = 'font-medium text-brand-700 hover:underline'

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}

/** Odamlar uchun sayt xaritasi: barcha ochiq sahifalar bir joyda (qidiruv tizimlari uchun — `sitemap.xml`). */
export function SitemapPage() {
  const { t, i18n } = useTranslation()
  const user = useCurrentUser()
  const news = useNewsPage(1, LATEST_NEWS)
  usePageMeta(t('sitemap.title'), t('sitemap.description'))

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{t('sitemap.title')}</h1>
        <p className="text-slate-600">{t('sitemap.description')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Group title={t('sitemap.main')}>
          <li>
            <Link to="/" className={link}>
              {t('sitemap.home')}
            </Link>
          </li>
          <li>
            <Link to="/about" className={link}>
              {t('nav.about')}
            </Link>
          </li>
          <li>
            <Link to="/faq" className={link}>
              {t('nav.faq')}
            </Link>
          </li>
          <li>
            <Link to="/contact" className={link}>
              {t('nav.contact')}
            </Link>
          </li>
        </Group>

        <Group title={t('nav.library')}>
          <li>
            <Link to="/library" className={link}>
              {t('sitemap.libraryAll')}
            </Link>
          </li>
          {LIBRARY_TABS.map((tab) => (
            <li key={tab}>
              <Link to={`/library?tab=${tab}`} className={link}>
                {t(`library.tabs.${tab}`)}
              </Link>
            </li>
          ))}
        </Group>

        <Group title={t('footer.platform')}>
          {user ? (
            <li>
              <Link to={homePathFor(user)} className={link}>
                {t('nav.cabinet')}
              </Link>
            </li>
          ) : (
            <>
              <li>
                <Link to="/login" className={link}>
                  {t('nav.login')}
                </Link>
              </li>
              <li>
                <Link to="/register" className={link}>
                  {t('nav.register')}
                </Link>
              </li>
            </>
          )}
        </Group>

        <Group title={t('nav.news')}>
          <li>
            <Link to="/news" className={link}>
              {t('sitemap.newsAll')}
            </Link>
          </li>
          <QueryState query={news}>
            {(data) =>
              data.items.length === 0 ? (
                <li className="text-sm text-slate-500">{t('sitemap.noNews')}</li>
              ) : (
                data.items.map((item) => (
                  <li key={item.id} className="flex flex-col">
                    <Link to={`/news/${item.slug}`} className={link}>
                      {item.title}
                    </Link>
                    {item.published_at && (
                      <span className="text-xs text-slate-500">
                        {formatDate(item.published_at, i18n.language)}
                      </span>
                    )}
                  </li>
                ))
              )
            }
          </QueryState>
        </Group>
      </div>
    </div>
  )
}
