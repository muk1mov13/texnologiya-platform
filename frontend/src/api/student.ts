import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiBuffer, apiFetch } from './client'
import type { ContinueTarget, StepBrief, StepContent, SubjectCard, SubjectDetail, TopicDetail } from './types'

export const studentKeys = {
  subjects: ['subjects'] as const,
  subject: (slug: string) => ['subjects', slug] as const,
  topic: (id: number) => ['topics', id] as const,
  step: (id: number) => ['steps', id] as const,
  continue: ['me', 'continue'] as const,
}

export function useSubjects() {
  return useQuery({
    queryKey: studentKeys.subjects,
    queryFn: ({ signal }) => apiFetch<SubjectCard[]>('/api/subjects', { signal }),
  })
}

export function useSubject(slug: string) {
  return useQuery({
    queryKey: studentKeys.subject(slug),
    queryFn: ({ signal }) => apiFetch<SubjectDetail>(`/api/subjects/${encodeURIComponent(slug)}`, { signal }),
    enabled: slug !== '',
  })
}

export function useTopic(topicId: number) {
  return useQuery({
    queryKey: studentKeys.topic(topicId),
    queryFn: ({ signal }) => apiFetch<TopicDetail>(`/api/topics/${topicId}`, { signal }),
    enabled: Number.isInteger(topicId) && topicId > 0,
  })
}

/** `stepId` undefined bo'lsa so'rov yuborilmaydi (kontenti yo'q bosqich). */
export function useStep(stepId: number | undefined) {
  return useQuery({
    queryKey: studentKeys.step(stepId ?? 0),
    queryFn: ({ signal }) => apiFetch<StepContent>(`/api/steps/${stepId}`, { signal }),
    enabled: stepId !== undefined,
  })
}

export function useContinue() {
  return useQuery({
    queryKey: studentKeys.continue,
    queryFn: ({ signal }) => apiFetch<ContinueTarget | null>('/api/me/continue', { signal }),
  })
}

export function useCompleteStep(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stepId: number) => apiFetch<StepBrief>(`/api/steps/${stepId}/complete`, { method: 'POST' }),
    onSuccess: (step) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: studentKeys.topic(topicId) }),
        queryClient.invalidateQueries({ queryKey: studentKeys.step(step.id) }),
        queryClient.invalidateQueries({ queryKey: studentKeys.subjects }),
        queryClient.invalidateQueries({ queryKey: studentKeys.continue }),
      ]),
  })
}

/** Himoyalangan PDF Bearer token bilan yuklanadi (refresh mantiqi ham shu yerda ishlaydi). */
export function useMaterialPdf(fileUrl: string) {
  return useQuery({
    queryKey: ['pdf', fileUrl],
    queryFn: ({ signal }) => apiBuffer(fileUrl, signal),
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  })
}
