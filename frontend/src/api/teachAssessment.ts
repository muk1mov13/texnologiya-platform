import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { invalidateStudentCaches, teachKeys } from './teach'
import type {
  ActivityIn,
  ActivityTeach,
  GradeIn,
  SubmissionDetail,
  SubmissionQueueItem,
  SubmissionStatus,
  TaskIn,
  TaskOut,
  TopicStats,
} from './types'

export const teachAssessmentKeys = {
  activities: (stepId: number) => ['teach', 'steps', stepId, 'activities'] as const,
  task: (stepId: number) => ['teach', 'steps', stepId, 'task'] as const,
  submissions: ['teach', 'submissions'] as const,
  queue: (status: SubmissionStatus) => ['teach', 'submissions', status] as const,
  submission: (id: number) => ['teach', 'submissions', 'detail', id] as const,
  summary: ['teach', 'summary'] as const,
  stats: (subjectId: number) => ['teach', 'stats', subjectId] as const,
}

/** Bosqich kontenti o'zgardi: muharrir, mavzu va talaba keshlari yangilanadi. */
function useInvalidateStep(topicId: number, stepId: number) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.activities(stepId) })
    void queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.task(stepId) })
    void queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) })
    invalidateStudentCaches(queryClient)
  }
}

// --- faoliyatlar ---------------------------------------------------------------------------

export function useStepActivities(stepId: number) {
  return useQuery({
    queryKey: teachAssessmentKeys.activities(stepId),
    queryFn: ({ signal }) => apiFetch<ActivityTeach[]>(`/api/teach/steps/${stepId}/activities`, { signal }),
  })
}

export function useCreateActivity(topicId: number, stepId: number) {
  const invalidate = useInvalidateStep(topicId, stepId)
  return useMutation({
    mutationFn: (data: ActivityIn) =>
      apiFetch<ActivityTeach>(`/api/teach/steps/${stepId}/activities`, { method: 'POST', json: data }),
    onSuccess: invalidate,
    meta: { silent: true },
  })
}

export function useUpdateActivity(topicId: number, stepId: number) {
  const invalidate = useInvalidateStep(topicId, stepId)
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActivityIn }) =>
      apiFetch<ActivityTeach>(`/api/teach/activities/${id}`, { method: 'PUT', json: data }),
    onSuccess: invalidate,
    meta: { silent: true },
  })
}

export function usePublishActivity(topicId: number, stepId: number) {
  const invalidate = useInvalidateStep(topicId, stepId)
  return useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      apiFetch<ActivityTeach>(`/api/teach/activities/${id}`, {
        method: 'PATCH',
        json: { is_published: published },
      }),
    onSuccess: invalidate,
  })
}

export function useDeleteActivity(topicId: number, stepId: number) {
  const invalidate = useInvalidateStep(topicId, stepId)
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/teach/activities/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useReorderActivities(topicId: number, stepId: number) {
  const invalidate = useInvalidateStep(topicId, stepId)
  return useMutation({
    mutationFn: (ids: number[]) =>
      apiFetch<ActivityTeach[]>(`/api/teach/steps/${stepId}/activities/order`, { method: 'PUT', json: { ids } }),
    onSettled: invalidate,
  })
}

// --- vazifa --------------------------------------------------------------------------------

export function useStepTask(stepId: number) {
  return useQuery({
    queryKey: teachAssessmentKeys.task(stepId),
    queryFn: ({ signal }) => apiFetch<TaskOut | null>(`/api/teach/steps/${stepId}/task`, { signal }),
  })
}

export function useSaveTask(topicId: number, stepId: number) {
  const invalidate = useInvalidateStep(topicId, stepId)
  return useMutation({
    mutationFn: (data: TaskIn) => apiFetch<TaskOut>(`/api/teach/steps/${stepId}/task`, { method: 'PUT', json: data }),
    onSuccess: invalidate,
    meta: { silent: true },
  })
}

export function useDeleteTask(topicId: number, stepId: number) {
  const invalidate = useInvalidateStep(topicId, stepId)
  return useMutation({
    mutationFn: (taskId: number) => apiFetch<void>(`/api/teach/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

// --- tekshirish navbati --------------------------------------------------------------------

export function useSubmissionQueue(status: SubmissionStatus) {
  return useQuery({
    queryKey: teachAssessmentKeys.queue(status),
    queryFn: ({ signal }) =>
      apiFetch<SubmissionQueueItem[]>(`/api/teach/submissions?status=${status}&limit=200`, { signal }),
  })
}

export function useSubmission(id: number) {
  return useQuery({
    queryKey: teachAssessmentKeys.submission(id),
    queryFn: ({ signal }) => apiFetch<SubmissionDetail>(`/api/teach/submissions/${id}`, { signal }),
    enabled: Number.isInteger(id) && id > 0,
  })
}

/** Baholash/qaytarishdan keyin navbat, tafsilot va bosh sahifadagi son yangilanadi. */
function useInvalidateReview() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.submissions })
    void queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.summary })
  }
}

export function useGradeSubmission(id: number) {
  const invalidate = useInvalidateReview()
  return useMutation({
    mutationFn: (data: GradeIn) =>
      apiFetch<SubmissionDetail>(`/api/teach/submissions/${id}/grade`, { method: 'POST', json: data }),
    onSuccess: invalidate,
    meta: { silent: true },
  })
}

export function useReturnSubmission(id: number) {
  const invalidate = useInvalidateReview()
  return useMutation({
    mutationFn: (feedback: string) =>
      apiFetch<SubmissionDetail>(`/api/teach/submissions/${id}/return`, { method: 'POST', json: { feedback } }),
    onSuccess: invalidate,
    meta: { silent: true },
  })
}

export function useTeachSummary() {
  return useQuery({
    queryKey: teachAssessmentKeys.summary,
    queryFn: ({ signal }) => apiFetch<{ pending_submissions: number }>('/api/teach/summary', { signal }),
  })
}

export function useTeachStats(subjectId: number | undefined) {
  return useQuery({
    queryKey: teachAssessmentKeys.stats(subjectId ?? 0),
    queryFn: ({ signal }) => apiFetch<TopicStats[]>(`/api/teach/stats?subject_id=${subjectId}`, { signal }),
    enabled: subjectId !== undefined,
  })
}
