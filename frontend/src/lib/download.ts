import { useState } from 'react'
import { apiBuffer } from '@/api/client'
import { errorText } from '@/api/errors'
import { pushToast } from '@/components/ui/toast-store'

/** Himoyalangan faylni Bearer token bilan yuklab, brauzerda saqlaydi. */
export async function downloadProtected(url: string, filename: string): Promise<void> {
  const buffer = await apiBuffer(url)
  const href = URL.createObjectURL(new Blob([buffer]))
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
  URL.revokeObjectURL(href)
}

/** `downloadProtected` + yuklanish holati; xato bo'lsa toast chiqaradi. */
export function useProtectedDownload() {
  const [pending, setPending] = useState(false)
  const download = async (url: string, filename: string) => {
    setPending(true)
    try {
      await downloadProtected(url, filename)
    } catch (error) {
      pushToast('error', errorText(error))
    } finally {
      setPending(false)
    }
  }
  return { download, pending }
}
