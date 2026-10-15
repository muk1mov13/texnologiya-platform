import { useSearchParams } from 'react-router'
import type { TeachSubject } from '@/api/types'

/**
 * Ochiq fan manzilda (`?subject=<id>`) saqlanadi: bir vaqtda bittasi ochiq. Fan bitta bo'lsa,
 * u doim ochiq. Qaytish havolalari (`/teach?subject=..`) shu fanni ochiq holda qaytaradi.
 */
export function useOpenSubject(subjects: TeachSubject[]): [number | null, (id: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const fromUrl = subjects.find((subject) => String(subject.id) === searchParams.get('subject'))?.id
  const openId = fromUrl ?? (subjects.length === 1 ? subjects[0].id : null)

  function toggle(id: number) {
    setSearchParams(openId === id ? {} : { subject: String(id) }, { replace: true })
  }

  return [openId, toggle]
}
