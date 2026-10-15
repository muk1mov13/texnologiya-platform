import type { ReactNode } from 'react'

/** Ro'yxat ustidagi asboblar qatori: chapda filtrlar, o'ngda qidiruv (telefonda ustma-ust). */
export function Toolbar({ start, end }: { start?: ReactNode; end?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {start && <div className="min-w-0 overflow-x-auto">{start}</div>}
      {end && <div className="w-full sm:w-auto sm:min-w-72">{end}</div>}
    </div>
  )
}
