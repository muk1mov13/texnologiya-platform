import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiKeys } from './ai'
import { apiFetch } from './client'
import { supportKeys } from './support'
import type {
  AiSettingsUpdate,
  AiSettingsView,
  AiUsageStats,
  ReindexIn,
  SupportMessage,
  SupportSessionsPage,
} from './types'

export const adminAiKeys = {
  settings: ['admin', 'ai', 'settings'] as const,
  usage: (days: number) => ['admin', 'ai', 'usage', days] as const,
  supportSessions: (page: number) => ['admin', 'ai', 'support', 'page', page] as const,
  supportSession: (key: string) => ['admin', 'ai', 'support', 'session', key] as const,
  support: ['admin', 'ai', 'support'] as const,
}

export function useSupportSessions(page: number) {
  return useQuery({
    queryKey: adminAiKeys.supportSessions(page),
    queryFn: ({ signal }) =>
      apiFetch<SupportSessionsPage>(`/api/admin/ai/support?page=${page}`, { signal }),
    placeholderData: (previous) => previous,
  })
}

export function useSupportSession(key: string | null) {
  return useQuery({
    queryKey: adminAiKeys.supportSession(key ?? ''),
    queryFn: ({ signal }) => apiFetch<SupportMessage[]>(`/api/admin/ai/support/${key}`, { signal }),
    enabled: key !== null,
  })
}

export function useDeleteSupportSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => apiFetch<void>(`/api/admin/ai/support/${key}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminAiKeys.support }),
  })
}

export function useAiSettings() {
  return useQuery({
    queryKey: adminAiKeys.settings,
    queryFn: ({ signal }) => apiFetch<AiSettingsView>('/api/admin/ai/settings', { signal }),
  })
}

export function useUpdateAiSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AiSettingsUpdate) =>
      apiFetch<AiSettingsView>('/api/admin/ai/settings', { method: 'PATCH', json: data }),
    onSuccess: (data) => {
      queryClient.setQueryData(adminAiKeys.settings, data)
      void queryClient.invalidateQueries({ queryKey: aiKeys.usage })
      void queryClient.invalidateQueries({ queryKey: supportKeys.status })
    },
    meta: { silent: true },
  })
}

export function useAiUsageStats(days: number) {
  return useQuery({
    queryKey: adminAiKeys.usage(days),
    queryFn: ({ signal }) => apiFetch<AiUsageStats>(`/api/admin/ai/usage?days=${days}`, { signal }),
  })
}

export function useReindex() {
  return useMutation({
    mutationFn: (data: ReindexIn) =>
      apiFetch<{ queued: boolean }>('/api/admin/ai/reindex', { method: 'POST', json: data }),
  })
}
