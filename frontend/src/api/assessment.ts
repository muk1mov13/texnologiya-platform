import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { announceRewards } from '@/lib/rewards'
import { apiFetch } from './client'
import { studentKeys } from './student'
import type { AttemptAnswer, AttemptDetail, AttemptResult, Dashboard, SubjectResults, SubmitResult } from './types'

export const assessmentKeys = {
  dashboard: ['me', 'dashboard'] as const,
  results: ['me', 'results'] as const,
  attempt: (id: number) => ['me', 'attempts', id] as const,
}

/** Mukofot yoki progress o'zgarganda talaba tomonidagi keshlar yangilanadi. */
function useInvalidateProgress(topicId: number) {
  const queryClient = useQueryClient()
  return (stepId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: studentKeys.topic(topicId) }),
      queryClient.invalidateQueries({ queryKey: studentKeys.step(stepId) }),
      queryClient.invalidateQueries({ queryKey: studentKeys.subjects }),
      queryClient.invalidateQueries({ queryKey: studentKeys.continue }),
      queryClient.invalidateQueries({ queryKey: assessmentKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: assessmentKeys.results }),
    ])
}

export function useSubmitAttempt(topicId: number, stepId: number) {
  const invalidate = useInvalidateProgress(topicId)
  return useMutation({
    mutationFn: ({ activityId, answers }: { activityId: number; answers: AttemptAnswer[] }) =>
      apiFetch<AttemptResult>(`/api/activities/${activityId}/attempts`, { method: 'POST', json: { answers } }),
    onSuccess: (result) => {
      announceRewards(result.rewards)
      return invalidate(stepId)
    },
  })
}

export function useSubmitTask(topicId: number, stepId: number) {
  const invalidate = useInvalidateProgress(topicId)
  return useMutation({
    mutationFn: ({ taskId, text, file }: { taskId: number; text: string; file: File | null }) => {
      const body = new FormData()
      if (text.trim()) body.append('text', text)
      if (file) body.append('file', file)
      return apiFetch<SubmitResult>(`/api/tasks/${taskId}/submission`, { method: 'PUT', body })
    },
    onSuccess: (result) => {
      announceRewards(result.rewards)
      return invalidate(stepId)
    },
    meta: { silent: true },
  })
}

export function useDashboard() {
  return useQuery({
    queryKey: assessmentKeys.dashboard,
    queryFn: ({ signal }) => apiFetch<Dashboard>('/api/me/dashboard', { signal }),
  })
}

export function useResults() {
  return useQuery({
    queryKey: assessmentKeys.results,
    queryFn: ({ signal }) => apiFetch<SubjectResults[]>('/api/me/results', { signal }),
  })
}

export function useAttemptDetail(attemptId: number) {
  return useQuery({
    queryKey: assessmentKeys.attempt(attemptId),
    queryFn: ({ signal }) => apiFetch<AttemptDetail>(`/api/me/attempts/${attemptId}`, { signal }),
    enabled: Number.isInteger(attemptId) && attemptId > 0,
  })
}
