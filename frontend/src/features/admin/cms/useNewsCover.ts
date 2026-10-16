import { useEffect, useState } from 'react'
import { adminNewsCoverUrl } from '@/api/adminCms'
import { apiBuffer } from '@/api/client'
import type { NewsAdmin } from '@/api/types'

/** Qoralama muqovasi ochiq endpoint'dan kelmaydi — admin endpoint'idan blob URL bilan ko'rsatiladi. */
export function useNewsCover(news: NewsAdmin): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!news.has_cover) return
    const controller = new AbortController()
    let objectUrl: string | null = null
    apiBuffer(adminNewsCoverUrl(news.id), controller.signal)
      .then((buffer) => {
        objectUrl = URL.createObjectURL(new Blob([buffer]))
        setUrl(objectUrl)
      })
      .catch(() => setUrl(null))
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [news.id, news.has_cover, news.updated_at])
  return news.has_cover ? url : null
}
