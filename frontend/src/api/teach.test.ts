import type { TopicEditor } from './types'
import { hasProcessing } from './teach'

function topicWith(statuses: Array<'processing' | 'ready' | 'failed'>): TopicEditor {
  return {
    id: 1,
    subject_id: 1,
    title: 'Mavzu',
    summary: '',
    order: 1,
    is_published: false,
    glossary: [],
    literature: [],
    steps: [
      {
        id: 10,
        kind: 'lecture',
        order: 2,
        materials: statuses.map((status, index) => ({
          id: index + 1,
          step_id: 10,
          title: `M${index}`,
          original_name: 'a.pptx',
          page_count: null,
          status,
          error: null,
        })),
      },
    ],
  }
}

test("processing material bo'lsa polling yoqiladi", () => {
  expect(hasProcessing(topicWith(['ready', 'processing']))).toBe(true)
})

test("hamma material tayyor yoki xato bo'lsa polling o'chadi", () => {
  expect(hasProcessing(topicWith(['ready', 'failed']))).toBe(false)
  expect(hasProcessing(undefined)).toBe(false)
})
