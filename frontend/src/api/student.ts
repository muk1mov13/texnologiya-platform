import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pushToast } from '@/components/ui/toast-store'
import { i18n } from '@/i18n'
import { apiBuffer, apiFetch } from './client'
import type { ContinueTarget, StepBrief, StepContent, SubjectCard, SubjectDetail, TopicDetail } from './types'

export const studentKeys = {
  subjects: ['subjects'] as const,
  subject: (slug: string) => ['subjects', slug] as const,
  topic: (id: number) => ['topics', id] as const,
  step: (id: number) => ['steps', id] as const,
  continue: ['me', 'continue'] as const,
  pdf: (fileUrl: string) => ['pdf', fileUrl] as const,
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

/** `stepId` undefined bo'lsa so'rov yuborilmaydi. */
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
    // staleTime: 0 — GET /api/steps/{id} oxirgi ochilgan bosqichni (resume.continue_target)
    // belgilaydi, shuning uchun bu natija har safar sahifaga qaytilganda yangilanishi kerak,
    // aks holda karta eski (allaqachon ko'rilgan) bosqichga ishora qilib qolishi mumkin.
    staleTime: 0,
  })
}

export function useCompleteStep(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stepId: number) => apiFetch<StepBrief>(`/api/steps/${stepId}/complete`, { method: 'POST' }),
    onSuccess: (step) => {
      // Natija darhol keshga yoziladi: refetch muvaffaqiyatsiz bo'lsa ham (masalan, tarmoq
      // uzilsa), "Tugatdim" tugmasi server allaqachon yakunlagan bosqichni qayta ko'rsatmaydi.
      queryClient.setQueryData<StepContent>(studentKeys.step(step.id), (old) =>
        old ? { ...old, status: step.status } : old,
      )
      queryClient.setQueryData<TopicDetail>(studentKeys.topic(topicId), (old) => {
        if (!old) return old
        const previous = old.steps.find((s) => s.id === step.id)
        const steps = old.steps.map((s) => (s.id === step.id ? { ...s, status: step.status } : s))
        // Progress halqasi: faqat bosqich ENDI tugatilgan bo'lsa (avval tugatilmagan bo'lsa)
        // hisoblagich oshiriladi — refetch kutilayotganda ham sidebar/halqa izchil ko'rsatadi.
        const progress =
          previous?.status !== 'completed' && step.status === 'completed'
            ? { ...old.progress, completed: Math.min(old.progress.completed + 1, old.progress.total) }
            : old.progress
        return { ...old, steps, progress }
      })
      // Toast shu yerda (hook darajasida) chiqariladi: komponent darhol unmount bo'lsa ham
      // (masalan, "Tugatdim" ketidan tezda "Keyingi →" bosilsa), chaqiruvga xos onSuccess
      // callback'i o'tkazib yuborilishi mumkin, ammo hook darajasidagi bu handler har doim ishlaydi.
      pushToast('success', i18n.t('player.completedToast'))
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: studentKeys.topic(topicId) }),
        queryClient.invalidateQueries({ queryKey: studentKeys.step(step.id) }),
        // ['subjects'] prefiks bo'yicha qisman moslashtiriladi (exact: false, sukut bo'yicha),
        // shuning uchun bu bitta chaqiruv ro'yxatni (studentKeys.subjects) HAM fan tafsilotini
        // (studentKeys.subject(slug) === ['subjects', slug]) invalidatsiya qiladi.
        queryClient.invalidateQueries({ queryKey: studentKeys.subjects }),
        queryClient.invalidateQueries({ queryKey: studentKeys.continue }),
      ])
    },
  })
}

/** Himoyalangan PDF Bearer token bilan yuklanadi (refresh mantiqi ham shu yerda ishlaydi). */
export function useMaterialPdf(fileUrl: string) {
  return useQuery({
    queryKey: studentKeys.pdf(fileUrl),
    queryFn: ({ signal }) => apiBuffer(fileUrl, signal),
    staleTime: Infinity,
    gcTime: 60_000,
  })
}
