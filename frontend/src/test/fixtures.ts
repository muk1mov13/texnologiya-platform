import type { StepContent, SubjectCard, SubjectDetail, TopicDetail } from '@/api/types'

export const subjectCards: SubjectCard[] = [
  {
    id: 1,
    title: "Kasb ta'limi metodikasi",
    slug: 'kasb-talimi-metodikasi',
    description: 'Metodika asoslari',
    cover: null,
    topic_count: 2,
    progress: { completed: 1, total: 3 },
  },
]

export const subjectDetail: SubjectDetail = {
  id: 1,
  title: "Kasb ta'limi metodikasi",
  slug: 'kasb-talimi-metodikasi',
  description: 'Metodika asoslari',
  cover: null,
  topics: [
    { id: 10, title: 'Kasb tanlash asoslari', summary: '', order: 1, progress: { completed: 1, total: 2 } },
    { id: 11, title: 'Mehnat xavfsizligi', summary: '', order: 2, progress: { completed: 0, total: 0 } },
  ],
}

export function topicDetail(overrides: Partial<TopicDetail> = {}): TopicDetail {
  return {
    id: 10,
    title: 'Kasb tanlash asoslari',
    summary: '',
    subject: { id: 1, title: "Kasb ta'limi metodikasi", slug: 'kasb-talimi-metodikasi' },
    progress: { completed: 1, total: 2 },
    steps: [
      { id: 100, kind: 'review', order: 1, has_content: false, status: null },
      { id: 101, kind: 'lecture', order: 2, has_content: true, status: 'completed' },
      { id: 102, kind: 'presentation', order: 3, has_content: false, status: null },
      { id: 103, kind: 'practice', order: 4, has_content: false, status: null },
      { id: 104, kind: 'task', order: 5, has_content: false, status: null },
      { id: 105, kind: 'glossary', order: 6, has_content: true, status: null },
      { id: 106, kind: 'literature', order: 7, has_content: false, status: null },
    ],
    ...overrides,
  }
}

export function stepContent(overrides: Partial<StepContent> = {}): StepContent {
  return {
    id: 101,
    topic_id: 10,
    kind: 'lecture',
    order: 2,
    has_content: true,
    status: 'completed',
    materials: [{ id: 500, title: "Kirish ma'ruzasi", page_count: 3, file_url: '/api/materials/500/file' }],
    glossary: [],
    literature: [],
    ...overrides,
  }
}
