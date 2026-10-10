import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { studentKeys } from './student'
import type {
  GlossaryIn,
  GlossaryTerm,
  LiteratureIn,
  LiteratureItem,
  Material,
  TeachSubject,
  TeachTopicBrief,
  TopicCreate,
  TopicEditor,
  TopicUpdate,
} from './types'

export const teachKeys = {
  subjects: ['teach', 'subjects'] as const,
  topic: (id: number) => ['teach', 'topics', id] as const,
}

// Talaba tomoni keshlari prefiks bo'yicha: `studentKeys.subjects` === ['subjects'] (shuning
// o'zi fan tafsiloti `studentKeys.subject(slug)` === ['subjects', slug] uchun ham prefiks
// bo'ladi). `studentKeys` mavzular uchun umumiy prefiks bermaydi — faqat `topic(id)` va
// `step(id)` bor — shuning uchun bu yerda adabiy prefiks qo'lda yoziladi.
const STUDENT_TOPICS_PREFIX = ['topics'] as const
// Bosqich kontenti (materiallar, glossariy, adabiyotlar) `studentKeys.step(id)` keshida turadi.
const STUDENT_STEPS_PREFIX = ['steps'] as const

/** O'qituvchi tomonidagi o'zgarish talaba ko'radigan ro'yxat, mavzu va bosqichlarga ham ta'sir qiladi. */
function invalidateStudentCaches(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: studentKeys.subjects })
  void queryClient.invalidateQueries({ queryKey: STUDENT_TOPICS_PREFIX })
  void queryClient.invalidateQueries({ queryKey: STUDENT_STEPS_PREFIX })
}

const POLL_MS = 2000

/** Konvertatsiya qilinayotgan material bo'lsa, muharrir holatni so'rab turadi. */
export function hasProcessing(topic: TopicEditor | undefined): boolean {
  return Boolean(topic?.steps.some((step) => step.materials.some((m) => m.status === 'processing')))
}

export function useTeachSubjects() {
  return useQuery({
    queryKey: teachKeys.subjects,
    queryFn: ({ signal }) => apiFetch<TeachSubject[]>('/api/teach/subjects', { signal }),
  })
}

export function useEditorTopic(topicId: number) {
  return useQuery({
    queryKey: teachKeys.topic(topicId),
    queryFn: ({ signal }) => apiFetch<TopicEditor>(`/api/teach/topics/${topicId}`, { signal }),
    enabled: Number.isInteger(topicId) && topicId > 0,
    // So'rov xato bilan tugasa, keyingi muvaffaqiyatli urinishgacha cheksiz pollinguchun sabab
    // yo'q — faqat status 'error' bo'lmaganda va hali `processing` material bo'lsa so'raladi.
    refetchInterval: (query) =>
      query.state.status === 'error' ? false : hasProcessing(query.state.data) ? POLL_MS : false,
  })
}

export function useCreateTopic(subjectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TopicCreate) =>
      apiFetch<TopicEditor>(`/api/teach/subjects/${subjectId}/topics`, { method: 'POST', json: data }),
    onSuccess: (topic) => {
      // Muharrir keshi darhol to'ldiriladi — `invalidateQueries`ni kutmasdan (fire-and-forget),
      // aks holda chaqiruvchi tomondagi navigatsiya (masalan, yangi muharrirga o'tish) kechikadi.
      queryClient.setQueryData(teachKeys.topic(topic.id), topic)
      void queryClient.invalidateQueries({ queryKey: teachKeys.subjects })
      invalidateStudentCaches(queryClient)
    },
  })
}

export function useReorderTopics(subjectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (topicIds: number[]) =>
      apiFetch<TeachTopicBrief[]>(`/api/teach/subjects/${subjectId}/topics/order`, {
        method: 'PUT',
        json: { topic_ids: topicIds },
      }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: teachKeys.subjects })
      invalidateStudentCaches(queryClient)
    },
  })
}

export function useUpdateTopic(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TopicUpdate) =>
      apiFetch<TopicEditor>(`/api/teach/topics/${topicId}`, { method: 'PATCH', json: data }),
    onSuccess: (topic) => {
      queryClient.setQueryData(teachKeys.topic(topic.id), topic)
      void queryClient.invalidateQueries({ queryKey: teachKeys.subjects })
      invalidateStudentCaches(queryClient)
    },
  })
}

export function useDeleteTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (topicId: number) => apiFetch<void>(`/api/teach/topics/${topicId}`, { method: 'DELETE' }),
    onSuccess: (_data, topicId) => {
      // O'chirilgan mavzu muharriri keshda qolib ketmasin — keyinroq shu ID bilan yangi
      // mavzu yaratilsa, eski ma'lumot ko'rsatilib qolishi mumkin edi.
      queryClient.removeQueries({ queryKey: teachKeys.topic(topicId) })
      void queryClient.invalidateQueries({ queryKey: teachKeys.subjects })
      invalidateStudentCaches(queryClient)
    },
  })
}

export interface UploadInput {
  stepId: number
  title: string
  file: File
}

export function useUploadMaterial(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stepId, title, file }: UploadInput) => {
      const body = new FormData()
      body.append('title', title)
      body.append('file', file)
      return apiFetch<Material>(`/api/teach/steps/${stepId}/materials`, { method: 'POST', body })
    },
    onSuccess: () => {
      // Material talaba ko'radigan bosqich kontenti va progressiga (has_content) ta'sir qiladi.
      invalidateStudentCaches(queryClient)
      return queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) })
    },
    meta: { silent: true },
  })
}

export function useDeleteMaterial(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (materialId: number) =>
      apiFetch<void>(`/api/teach/materials/${materialId}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Material talaba ko'radigan bosqich kontenti va progressiga (has_content) ta'sir qiladi.
      invalidateStudentCaches(queryClient)
      return queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) })
    },
  })
}

export function useRetryMaterial(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (materialId: number) =>
      apiFetch<Material>(`/api/teach/materials/${materialId}/retry`, { method: 'POST' }),
    onSuccess: () => {
      // Material talaba ko'radigan bosqich kontenti va progressiga (has_content) ta'sir qiladi.
      invalidateStudentCaches(queryClient)
      return queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) })
    },
  })
}

/** Glossariy va adabiyotlar uchun bir xil CRUD: `/api/teach/topics/{id}/{resource}[/{itemId}]`. */
function useTopicItemMutations<TIn, TOut>(topicId: number, resource: 'glossary' | 'literature') {
  const queryClient = useQueryClient()
  const base = `/api/teach/topics/${topicId}/${resource}`
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) })
    // Glossariy/adabiyot talaba ko'radigan mavzu kontentining qismi — talaba keshi ham
    // yangilanishi kerak.
    invalidateStudentCaches(queryClient)
  }
  const add = useMutation({
    mutationFn: (data: TIn) => apiFetch<TOut>(base, { method: 'POST', json: data }),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TIn> }) =>
      apiFetch<TOut>(`${base}/${id}`, { method: 'PATCH', json: data }),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`${base}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
  return { add, update, remove }
}

export function useGlossaryMutations(topicId: number) {
  return useTopicItemMutations<GlossaryIn, GlossaryTerm>(topicId, 'glossary')
}

export function useLiteratureMutations(topicId: number) {
  return useTopicItemMutations<LiteratureIn, LiteratureItem>(topicId, 'literature')
}
