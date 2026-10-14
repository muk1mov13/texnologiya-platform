import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Book, BookPage, FolderNode, LibrarySection } from './types'

export interface BookFilters {
  category: string
  q: string
  page: number
}

export const BOOKS_PAGE_SIZE = 12

export const libraryKeys = {
  foldersRoot: ['library', 'folders'] as const,
  folders: (section: LibrarySection) => ['library', 'folders', section] as const,
  booksRoot: ['library', 'books'] as const,
  books: (filters: BookFilters) => ['library', 'books', filters] as const,
  categories: ['library', 'books', 'categories'] as const,
  myBooks: ['teach', 'books'] as const,
}

// Fayl va muqovalar ochiq: oddiy <a href>/<img src> bilan yuklanadi (token kerak emas).
export const documentFileUrl = (id: number) => `/api/library/documents/${id}/file`
export const bookFileUrl = (id: number) => `/api/library/books/${id}/file`
/** URL o'zgarmaydi, shuning uchun muqova almashganda kesh `?v=` bilan yangilanadi. */
export const bookCoverUrl = (book: Pick<Book, 'id' | 'created_at'>, version?: string) =>
  `/api/library/books/${book.id}/cover?v=${encodeURIComponent(version ?? book.created_at)}`

export function useFolderTree(section: LibrarySection) {
  return useQuery({
    queryKey: libraryKeys.folders(section),
    queryFn: ({ signal }) => apiFetch<FolderNode[]>(`/api/library/folders?section=${section}`, { signal }),
  })
}

export function useBooks(filters: BookFilters) {
  const params = new URLSearchParams({ page: String(filters.page), size: String(BOOKS_PAGE_SIZE) })
  if (filters.category) params.set('category', filters.category)
  if (filters.q) params.set('q', filters.q)
  return useQuery({
    queryKey: libraryKeys.books(filters),
    queryFn: ({ signal }) => apiFetch<BookPage>(`/api/library/books?${params.toString()}`, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useBookCategories() {
  return useQuery({
    queryKey: libraryKeys.categories,
    queryFn: ({ signal }) => apiFetch<string[]>('/api/library/books/categories', { signal }),
  })
}

// --- o'qituvchi: o'z kitoblari ------------------------------------------------------------

export interface BookUploadInput {
  category: string
  title: string
  author: string
  file: File
  cover: File | null
}

export function useMyBooks() {
  return useQuery({
    queryKey: libraryKeys.myBooks,
    queryFn: ({ signal }) => apiFetch<Book[]>('/api/teach/books', { signal }),
  })
}

export function useUploadBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BookUploadInput) => {
      const body = new FormData()
      body.append('category', input.category)
      body.append('title', input.title)
      body.append('author', input.author)
      body.append('file', input.file)
      if (input.cover) body.append('cover', input.cover)
      return apiFetch<Book>('/api/teach/books', { method: 'POST', body })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: libraryKeys.myBooks })
      // Admin yuklagan kitob darhol tasdiqlangan — katalog va admin ro'yxati ham yangilanadi.
      void queryClient.invalidateQueries({ queryKey: libraryKeys.booksRoot })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'books'] })
    },
    meta: { silent: true },
  })
}

export function useDeleteMyBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/teach/books/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: libraryKeys.myBooks })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'books'] })
    },
  })
}
