export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  kind: ToastKind
  text: string
}

const DEFAULT_MS = 5000
const ERROR_MS = 10000
let items: ToastItem[] = []
let nextId = 1
const subscribers = new Set<() => void>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit(): void {
  subscribers.forEach((notify) => notify())
}

export function pushToast(kind: ToastKind, text: string): void {
  const id = nextId++
  items = [...items, { id, kind, text }]
  emit()
  const ms = kind === 'error' ? ERROR_MS : DEFAULT_MS
  timers.set(id, setTimeout(() => dismissToast(id), ms))
}

export function dismissToast(id: number): void {
  if (!items.some((item) => item.id === id)) return
  items = items.filter((item) => item.id !== id)
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  emit()
}

export function clearToasts(): void {
  items = []
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
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
