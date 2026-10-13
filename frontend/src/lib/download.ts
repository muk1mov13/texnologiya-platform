import { apiBuffer } from '@/api/client'

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
