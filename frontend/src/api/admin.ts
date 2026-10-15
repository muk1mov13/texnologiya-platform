import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { invalidateStudentCaches } from './teach'
import type {
  AdminUserUpdateIn,
  SubjectAdmin,
  SubjectCreate,
  SubjectUpdate,
  TempPasswordOut,
  User,
  UserStatus,
} from './types'

export type UserFilter = UserStatus | 'all'

export const adminKeys = {
  usersRoot: ['admin', 'users'] as const,
  users: (status: UserFilter, q: string) => ['admin', 'users', status, q] as const,
  subjects: ['admin', 'subjects'] as const,
}

export function useAdminUsers(status: UserFilter, q: string) {
  const params = new URLSearchParams({ limit: '200' })
  if (status !== 'all') params.set('status', status)
  if (q) params.set('q', q)
  return useQuery({
    queryKey: adminKeys.users(status, q),
    queryFn: ({ signal }) => apiFetch<User[]>(`/api/admin/users?${params.toString()}`, { signal }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminUserUpdateIn }) =>
      apiFetch<User>(`/api/admin/users/${id}`, { method: 'PATCH', json: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.usersRoot }),
  })
}

export function useTempPassword() {
  return useMutation({
    mutationFn: (id: number) => apiFetch<TempPasswordOut>(`/api/admin/users/${id}/temp-password`, { method: 'POST' }),
  })
}

export function useAdminSubjects() {
  return useQuery({
    queryKey: adminKeys.subjects,
    queryFn: ({ signal }) => apiFetch<SubjectAdmin[]>('/api/admin/subjects', { signal }),
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubjectCreate) => apiFetch<SubjectAdmin>('/api/admin/subjects', { method: 'POST', json: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.subjects }),
    meta: { silent: true },
  })
}

/** `silent`: xato forma ichida ko'rsatiladigan joylarda (tahrirlash modali) umumiy toast chiqmaydi. */
export function useUpdateSubject({ silent = false }: { silent?: boolean } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubjectUpdate }) =>
      apiFetch<SubjectAdmin>(`/api/admin/subjects/${id}`, { method: 'PATCH', json: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.subjects }),
    meta: { silent },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/subjects/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.subjects }),
  })
}

/** O'quv dasturi (PDF/DOC/DOCX); DOC/DOCX server so'rov ichida PDF'ga o'giradi. */
export function useUploadSyllabus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const body = new FormData()
      body.append('file', file)
      return apiFetch<SubjectAdmin>(`/api/admin/subjects/${id}/syllabus`, { method: 'PUT', body })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.subjects })
      invalidateStudentCaches(queryClient)
    },
  })
}

export function useDeleteSyllabus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<SubjectAdmin>(`/api/admin/subjects/${id}/syllabus`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.subjects })
      invalidateStudentCaches(queryClient)
    },
  })
}
