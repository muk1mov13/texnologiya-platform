import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { ContactIn, FaqItem, NewsCard, NewsDetail, NewsPage, SiteSettings } from './types'

export const NEWS_PAGE_SIZE = 12

export const cmsKeys = {
  newsRoot: ['news'] as const,
  newsPage: (page: number, size: number) => ['news', 'page', page, size] as const,
  news: (slug: string) => ['news', 'detail', slug] as const,
  faq: ['faq'] as const,
  site: ['site'] as const,
}

/** Ochiq muqova faqat nashr qilingan yangilik uchun; `?v=` — muqova almashsa kesh yangilanadi. */
export const newsCoverUrl = (news: Pick<NewsCard, 'id' | 'published_at'>, version?: string) =>
  `/api/news/${news.id}/cover?v=${encodeURIComponent(version ?? news.published_at ?? '')}`

export function useNewsPage(page: number, size = NEWS_PAGE_SIZE) {
  return useQuery({
    queryKey: cmsKeys.newsPage(page, size),
    queryFn: ({ signal }) => apiFetch<NewsPage>(`/api/news?page=${page}&size=${size}`, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useNews(slug: string) {
  return useQuery({
    queryKey: cmsKeys.news(slug),
    queryFn: ({ signal }) => apiFetch<NewsDetail>(`/api/news/${encodeURIComponent(slug)}`, { signal }),
    // Har so'rov `views` ni oshiradi — oynaga qaytish kabi fon qayta so'rovlari hisobni buzmasin.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export function useFaq() {
  return useQuery({
    queryKey: cmsKeys.faq,
    queryFn: ({ signal }) => apiFetch<FaqItem[]>('/api/faq', { signal }),
  })
}

export function useSite() {
  return useQuery({
    queryKey: cmsKeys.site,
    queryFn: ({ signal }) => apiFetch<SiteSettings>('/api/site', { signal }),
    staleTime: 5 * 60_000,
  })
}

export function useSendContact() {
  return useMutation({
    mutationFn: (data: ContactIn) => apiFetch<void>('/api/contact', { method: 'POST', json: data, auth: false }),
    meta: { silent: true },
  })
}
