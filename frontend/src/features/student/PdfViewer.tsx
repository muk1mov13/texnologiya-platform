import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
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

  // pdf.js uzatilgan buferni "detach" qiladi — keshdagi bufer buzilmasligi uchun nusxa beriladi.
  const file = useMemo(() => (pdf.data ? { data: new Uint8Array(pdf.data.slice(0)) } : null), [pdf.data])

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="font-semibold">{title}</figcaption>
      <div ref={containerRef} className="min-h-40 overflow-hidden rounded-xl border-2 border-slate-100 bg-slate-100">
        {pdf.isError ? (
          <ErrorState error={pdf.error} onRetry={() => void pdf.refetch()} />
        ) : file ? (
          <Document
            file={file}
            suspense={false}
            loading={<PageSpinner />}
            error={<p className="p-6 text-center text-red-700">{t('player.pdfError')}</p>}
            onLoadSuccess={({ numPages: total }) => {
              setNumPages(total)
              setPage(1)
            }}
          >
            <Page pageNumber={page} width={width} loading={<PageSpinner />} />
          </Document>
        ) : (
          <PageSpinner />
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
          <span className="text-sm font-semibold" aria-live="polite">
            {t('player.pageOf', { page, total: numPages })}
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
