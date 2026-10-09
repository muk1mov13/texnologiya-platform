export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  kind: ToastKind
  text: string
}

const TOAST_MS = 5000
let items: ToastItem[] = []
let nextId = 1
const subscribers = new Set<() => void>()

function emit(): void {
  subscribers.forEach((notify) => notify())
}

export function pushToast(kind: ToastKind, text: string): void {
  const id = nextId++
  items = [...items, { id, kind, text }]
  emit()
  setTimeout(() => dismissToast(id), TOAST_MS)
}

export function dismissToast(id: number): void {
  items = items.filter((item) => item.id !== id)
  emit()
}

export function clearToasts(): void {
  items = []
  emit()
}

export function subscribeToasts(callback: () => void): () => void {
  subscribers.add(callback)
  return () => {
    subscribers.delete(callback)
  }
}

export function getToasts(): ToastItem[] {
  return items
}
