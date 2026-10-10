import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </Card>
      {footer && <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>}
    </div>
  )
}
