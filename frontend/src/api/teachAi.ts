import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { invalidateStudentCaches, teachKeys } from './teach'
import { teachAssessmentKeys } from './teachAssessment'
import type { AiDraft, AiReport, DraftCreateIn } from './types'

export const teachAiKeys = {
  drafts: (topicId: number) => ['teach', 'ai', 'drafts', topicId] as const,
  reports: (subjectId: number) => ['teach', 'ai', 'reports', subjectId] as const,
}

const POLL_MS = 3000

/** Mavzu qoralamalari; `generating` bor ekan har 3 soniyada yangilanadi. AI o'chiq bo'lsa so'ralmaydi. */
export function useDrafts(topicId: number, enabled = true) {
  return useQuery({
    queryKey: teachAiKeys.drafts(topicId),
    queryFn: ({ signal }) => apiFetch<AiDraft[]>(`/api/teach/ai/drafts?topic_id=${topicId}`, { signal }),
    enabled,
    refetchInterval: (query) =>
      query.state.data?.some((draft) => draft.status === 'generating') ? POLL_MS : false,
  })
}

function useInvalidateDrafts(topicId: number) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: teachAiKeys.drafts(topicId) })
}

export function useCreateDraft(topicId: number) {
  const invalidate = useInvalidateDrafts(topicId)
  return useMutation({
    mutationFn: (data: DraftCreateIn) => apiFetch<AiDraft>('/api/teach/ai/drafts', { method: 'POST', json: data }),
    onSuccess: invalidate,
    meta: { silent: true },
  })
}

export function useUpdateDraft(topicId: number) {
  const invalidate = useInvalidateDrafts(topicId)
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      apiFetch<AiDraft>(`/api/teach/ai/drafts/${id}`, { method: 'PUT', json: { payload } }),
    onSuccess: invalidate,
    meta: { silent: true },
  })
}

/** Tasdiqlash haqiqiy faoliyat/glossariy/vazifa yaratadi — muharrir va talaba keshlari ham yangilanadi. */
export function useApproveDraft(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<AiDraft>(`/api/teach/ai/drafts/${id}/approve`, { method: 'POST' }),
    onSuccess: (draft) => {
      void queryClient.invalidateQueries({ queryKey: teachAiKeys.drafts(topicId) })
      void queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) })
      void queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.activities(draft.step_id) })
      void queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.task(draft.step_id) })
      invalidateStudentCaches(queryClient)
    },
  })
}

export function useRejectDraft(topicId: number) {
  const invalidate = useInvalidateDrafts(topicId)
  return useMutation({
    mutationFn: (id: number) => apiFetch<AiDraft>(`/api/teach/ai/drafts/${id}/reject`, { method: 'POST' }),
    onSuccess: invalidate,
  })
}

export function useAiCheck(submissionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/teach/submissions/${submissionId}/ai-check`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.submission(submissionId) }),
  })
}

export function useAiReports(subjectId: number, enabled: boolean) {
  return useQuery({
    queryKey: teachAiKeys.reports(subjectId),
    queryFn: ({ signal }) => apiFetch<AiReport[]>(`/api/teach/ai/reports?subject_id=${subjectId}`, { signal }),
    enabled,
  })
}
