import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiKeys } from './ai'
import { apiFetch } from './client'
import type { AiSettingsUpdate, AiSettingsView, AiUsageStats, ReindexIn } from './types'

export const adminAiKeys = {
  settings: ['admin', 'ai', 'settings'] as const,
  usage: (days: number) => ['admin', 'ai', 'usage', days] as const,
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
