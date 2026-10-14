import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { cmsKeys } from './cms'
import { libraryKeys } from './library'
import type {
  BookAdmin,
  BookUpdate,
  ContactMessage,
  DocumentUpdate,
  FaqIn,
  FaqItem,
  FaqUpdate,
  FolderAdmin,
  FolderIn,
  FolderUpdate,
  LibraryDocument,
  NewsAdmin,
  NewsIn,
  NewsUpdate,
  SiteSettings,
  SiteUpdate,
} from './types'

export type BookStatus = 'pending' | 'approved'

export const adminCmsKeys = {
  booksRoot: ['admin', 'books'] as const,
  books: (status: BookStatus) => ['admin', 'books', status] as const,
  newsRoot: ['admin', 'news'] as const,
  news: (id: number) => ['admin', 'news', id] as const,
  faq: ['admin', 'faq'] as const,
  messagesRoot: ['admin', 'messages'] as const,
  messages: (unread: boolean) => ['admin', 'messages', unread] as const,
  site: ['admin', 'site'] as const,
}

// Himoyalangan (admin) fayllar: `useProtectedDownload` / `apiBuffer` bilan olinadi.
export const adminBookFileUrl = (id: number) => `/api/admin/books/${id}/file`
export const adminNewsCoverUrl = (id: number) => `/api/admin/news/${id}/cover`

type Ordered = { id: number; order: number }

/** Ikki qo'shni element o'rni almashadi; `order` teng bo'lsa birinchisi bittaga oshiriladi. */
function swappedOrders(a: Ordered, b: Ordered): [number, number] {
  return a.order === b.order ? [a.order + 1, b.order] : [b.order, a.order]
}

// --- kutubxona: papkalar va hujjatlar -----------------------------------------------------
// Admin ochiq daraxtni (`useFolderTree`) ishlatadi, shuning uchun o'zgarishlar shu keshni yangilaydi.

function invalidateFolders(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: libraryKeys.foldersRoot })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FolderIn) => apiFetch<FolderAdmin>('/api/admin/library/folders', { method: 'POST', json: data }),
    onSuccess: () => invalidateFolders(queryClient),
    meta: { silent: true },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FolderUpdate }) =>
      apiFetch<FolderAdmin>(`/api/admin/library/folders/${id}`, { method: 'PATCH', json: data }),
    onSuccess: () => invalidateFolders(queryClient),
    meta: { silent: true },
  })
}

export function useSwapFolders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ([a, b]: [Ordered, Ordered]) => {
      const [orderA, orderB] = swappedOrders(a, b)
      await apiFetch(`/api/admin/library/folders/${a.id}`, { method: 'PATCH', json: { order: orderA } })
      await apiFetch(`/api/admin/library/folders/${b.id}`, { method: 'PATCH', json: { order: orderB } })
    },
    onSettled: () => invalidateFolders(queryClient),
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/library/folders/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateFolders(queryClient),
  })
}

export function useAddDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ folderId, title, file }: { folderId: number; title: string; file: File }) => {
      const body = new FormData()
      body.append('title', title)
      body.append('file', file)
      return apiFetch<LibraryDocument>(`/api/admin/library/folders/${folderId}/documents`, { method: 'POST', body })
    },
    onSuccess: () => invalidateFolders(queryClient),
    meta: { silent: true },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DocumentUpdate }) =>
      apiFetch<LibraryDocument>(`/api/admin/library/documents/${id}`, { method: 'PATCH', json: data }),
    onSuccess: () => invalidateFolders(queryClient),
    meta: { silent: true },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/library/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateFolders(queryClient),
  })
}

// --- kitoblar --------------------------------------------------------------------------------

function invalidateBooks(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminCmsKeys.booksRoot })
  void queryClient.invalidateQueries({ queryKey: libraryKeys.booksRoot })
  void queryClient.invalidateQueries({ queryKey: libraryKeys.myBooks })
}

export function useAdminBooks(status: BookStatus) {
  return useQuery({
    queryKey: adminCmsKeys.books(status),
    queryFn: ({ signal }) => apiFetch<BookAdmin[]>(`/api/admin/books?status=${status}`, { signal }),
  })
}

/** `silent`: tahrir modalida xato forma ichida; tasdiqlash tugmasida — umumiy toast. */
export function useUpdateBook({ silent = false }: { silent?: boolean } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BookUpdate }) =>
      apiFetch<BookAdmin>(`/api/admin/books/${id}`, { method: 'PATCH', json: data }),
    onSuccess: () => invalidateBooks(queryClient),
    meta: { silent },
  })
}

export function useReplaceBookCover() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cover }: { id: number; cover: File }) => {
      const body = new FormData()
      body.append('cover', cover)
      return apiFetch<BookAdmin>(`/api/admin/books/${id}/cover`, { method: 'PUT', body })
    },
    onSuccess: () => invalidateBooks(queryClient),
    meta: { silent: true },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/books/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateBooks(queryClient),
  })
}

// --- yangiliklar -----------------------------------------------------------------------------

function invalidateNews(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminCmsKeys.newsRoot })
  void queryClient.invalidateQueries({ queryKey: cmsKeys.newsRoot })
}

export function useAdminNewsList() {
  return useQuery({
    queryKey: adminCmsKeys.newsRoot,
    queryFn: ({ signal }) => apiFetch<NewsAdmin[]>('/api/admin/news', { signal }),
  })
}

export function useAdminNews(id: number | null) {
  return useQuery({
    queryKey: adminCmsKeys.news(id ?? 0),
    queryFn: ({ signal }) => apiFetch<NewsAdmin>(`/api/admin/news/${id}`, { signal }),
    enabled: id !== null,
  })
}

export function useCreateNews() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NewsIn) => apiFetch<NewsAdmin>('/api/admin/news', { method: 'POST', json: data }),
    onSuccess: () => invalidateNews(queryClient),
    meta: { silent: true },
  })
}

export function useUpdateNews() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: NewsUpdate }) =>
      apiFetch<NewsAdmin>(`/api/admin/news/${id}`, { method: 'PATCH', json: data }),
    onSuccess: () => invalidateNews(queryClient),
    meta: { silent: true },
  })
}

export function useSetNewsCover() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cover }: { id: number; cover: File }) => {
      const body = new FormData()
      body.append('cover', cover)
      return apiFetch<NewsAdmin>(`/api/admin/news/${id}/cover`, { method: 'PUT', body })
    },
    onSuccess: () => invalidateNews(queryClient),
  })
}

export function useDeleteNews() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/news/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateNews(queryClient),
  })
}

// --- FAQ -------------------------------------------------------------------------------------

function invalidateFaq(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminCmsKeys.faq })
  void queryClient.invalidateQueries({ queryKey: cmsKeys.faq })
}

export function useAdminFaq() {
  return useQuery({
    queryKey: adminCmsKeys.faq,
    queryFn: ({ signal }) => apiFetch<FaqItem[]>('/api/admin/faq', { signal }),
  })
}

export function useCreateFaq() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FaqIn) => apiFetch<FaqItem>('/api/admin/faq', { method: 'POST', json: data }),
    onSuccess: () => invalidateFaq(queryClient),
    meta: { silent: true },
  })
}

/** `silent`: tahrir modalida xato forma ichida; nashr checkbox'ida — umumiy toast. */
export function useUpdateFaq({ silent = false }: { silent?: boolean } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FaqUpdate }) =>
      apiFetch<FaqItem>(`/api/admin/faq/${id}`, { method: 'PATCH', json: data }),
    onSuccess: () => invalidateFaq(queryClient),
    meta: { silent },
  })
}

export function useSwapFaq() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ([a, b]: [Ordered, Ordered]) => {
      const [orderA, orderB] = swappedOrders(a, b)
      await apiFetch(`/api/admin/faq/${a.id}`, { method: 'PATCH', json: { order: orderA } })
      await apiFetch(`/api/admin/faq/${b.id}`, { method: 'PATCH', json: { order: orderB } })
    },
    onSettled: () => invalidateFaq(queryClient),
  })
}

export function useDeleteFaq() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/faq/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateFaq(queryClient),
  })
}

// --- xabarlar --------------------------------------------------------------------------------

export function useMessages(unread: boolean) {
  return useQuery({
    queryKey: adminCmsKeys.messages(unread),
    queryFn: ({ signal }) => apiFetch<ContactMessage[]>(`/api/admin/messages?unread=${unread}`, { signal }),
  })
}

export function useUpdateMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_read }: { id: number; is_read: boolean }) =>
      apiFetch<ContactMessage>(`/api/admin/messages/${id}`, { method: 'PATCH', json: { is_read } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCmsKeys.messagesRoot }),
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/messages/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCmsKeys.messagesRoot }),
  })
}

// --- sayt sozlamalari ------------------------------------------------------------------------

export function useAdminSite() {
  return useQuery({
    queryKey: adminCmsKeys.site,
    queryFn: ({ signal }) => apiFetch<SiteSettings>('/api/admin/site', { signal }),
  })
}

export function useUpdateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SiteUpdate) => apiFetch<SiteSettings>('/api/admin/site', { method: 'PUT', json: data }),
    onSuccess: (site) => {
      queryClient.setQueryData(adminCmsKeys.site, site)
      queryClient.setQueryData(cmsKeys.site, site)
    },
    meta: { silent: true },
  })
}
