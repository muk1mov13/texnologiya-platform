import type { ActivityIn, TaskIn } from '@/api/types'

/** Muharrir qayerga saqlashini tashqaridan berish (masalan, AI qoralamasiga). */
export interface ActivitySaver {
  save: (data: ActivityIn, onError?: (error: unknown) => void) => void
  pending: boolean
  error: unknown
}

export interface TaskSaver {
  save: (data: TaskIn) => void
  pending: boolean
  error: unknown
}
