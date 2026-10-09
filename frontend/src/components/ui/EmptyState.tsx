import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  text?: string
  action?: ReactNode
}

export function EmptyState({ icon = '📭', title, text, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      {text && <p className="max-w-md text-slate-600">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
