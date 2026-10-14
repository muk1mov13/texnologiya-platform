import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function setMeta(attr: 'name' | 'property', key: string, content: string | null): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (content === null) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function apply(title: string, description: string, image: string | null): void {
  document.title = title
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:url', window.location.href)
  setMeta('property', 'og:image', image ? new URL(image, window.location.origin).href : null)
}

/**
 * Ochiq sahifa sarlavhasi, description va OG teglari (prerender yo'q — qidiruv tizimlari JS
 * bajarib o'qiydi). `title` yo'q bo'lsa (ma'lumot yuklanmoqda) hech narsa o'zgarmaydi;
 * sahifadan chiqilganda sayt sukut qiymatlariga qaytadi.
 */
export function usePageMeta(title: string | undefined, description?: string, image?: string): void {
  const { t, i18n } = useTranslation()
  const siteTitle = t('meta.siteTitle')
  const siteDescription = t('meta.description')

  useEffect(() => {
    if (title === undefined) return
    apply(title ? `${title} — ${t('app.name')}` : siteTitle, description || siteDescription, image ?? null)
    return () => apply(siteTitle, siteDescription, null)
  }, [title, description, image, siteTitle, siteDescription, t, i18n.language])
}
