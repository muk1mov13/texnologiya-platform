import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { canRetry } from '@/api/errors'
import { useMaterialPdf } from '@/api/student'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageSpinner } from '@/components/ui/Spinner'

// Worker `<Document>` chiziladigan modulning o'zida sozlanishi shart (react-pdf 11).
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

export function PdfViewer({ url, title }: { url: string; title: string }) {
  const { t } = useTranslation()
  const pdf = useMaterialPdf(url)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>()
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // react-pdf (Document.js, parameters.data) ArrayBuffer/TypedArray'ni pdf.js'ga uzatishdan
  // oldin o'zi nusxalaydi (`.slice(0)`) — keshdagi bufer shu sababli bu yerda qayta nusxalanmaydi.
  const file = useMemo(() => (pdf.data ? { data: pdf.data } : null), [pdf.data])

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="font-semibold tracking-tight text-slate-900">{title}</figcaption>
      <div ref={containerRef} className="min-h-40 overflow-hidden rounded-2xl bg-slate-100 shadow-soft ring-1 ring-slate-200/70">
        {!file ? (
          // Fon qayta so'rovi muvaffaqiyatsiz bo'lsa ham, avval yuklangan fayl (`file`) bo'lsa,
          // u ko'rsatilishda davom etadi — xato holati faqat ma'lumot umuman yo'q bo'lsa chiqadi.
          pdf.isError ? (
            <ErrorState error={pdf.error} onRetry={canRetry(pdf.error) ? () => void pdf.refetch() : undefined} />
          ) : (
            <PageSpinner />
          )
        ) : (
          <Document
            file={file}
            suspense={false}
            loading={<PageSpinner />}
            error={
              <p role="alert" className="p-6 text-center text-red-700">
                {t('player.pdfError')}
              </p>
            }
            externalLinkTarget="_blank"
            externalLinkRel="noopener noreferrer"
            onItemClick={({ pageNumber }) => setPage(pageNumber)}
            onLoadSuccess={({ numPages: total }) => {
              setNumPages(total)
              setPage(1)
            }}
          >
            <Page pageNumber={page} width={width} loading={<PageSpinner />} />
          </Document>
        )}
      </div>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            aria-label={t('player.prevPage')}
          >
            ←
          </Button>
          {/* `aria-label` oddiy `<span>`ga nom berolmaydi, va live region matn o'zgarishini
              e'lon qiladi (labelni emas) — shuning uchun ko'rinadigan qisqa matn `aria-hidden`
              bilan yashirilib, ekran o'quvchi uchun to'liq matn alohida `sr-only` span'da beriladi. */}
          <span aria-live="polite" className="text-sm font-semibold">
            <span aria-hidden="true">{t('player.pageOf', { page, total: numPages })}</span>
            <span className="sr-only">{t('player.pageOfLabel', { page, total: numPages })}</span>
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= numPages}
            onClick={() => setPage((current) => current + 1)}
            aria-label={t('player.nextPage')}
          >
            →
          </Button>
        </div>
      )}
    </figure>
  )
}
