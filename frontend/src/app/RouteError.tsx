import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Marshrut darajasidagi umumiy xato chegarasi (`errorElement`). Render xatosi yoki lazy
 * chunk'ni yuklab bo'lmasa (masalan, tarmoq uzilgan yoki eskirgan build hash'i — `StepContent`
 * ichidagi `import('./PdfViewer')` Suspense orqali) shu yerga tushadi. "Sahifani qayta yuklash"
 * tugmasi butun ilovani qaytadan yuklaydi — eskirgan chunk manifestiga ishonib qolmaydi.
 */
export function RouteError() {
  const { t } = useTranslation()
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <EmptyState
        icon="⚠️"
        title={t('routeError.title')}
        text={t('routeError.text')}
        action={<Button onClick={() => window.location.reload()}>{t('routeError.reload')}</Button>}
      />
    </main>
  )
}
