import { errorText } from '@/api/errors'

export function FormError({ error }: { error: unknown }) {
  return (
    <div role="alert" className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
      {errorText(error)}
    </div>
  )
}
