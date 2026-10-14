import ReactMarkdown, { type Components } from 'react-markdown'
import { cx } from '@/lib/cx'

// Tashqi havolalar yangi oynada; `urlTransform` (standart) `javascript:` kabi sxemalarni tozalaydi.
const COMPONENTS: Components = {
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//.test(href)
    return (
      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  },
}

/** Admin yozgan markdown: xom HTML chizilmaydi (`skipHtml`). Uslub `index.css` dagi `.md`. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cx('md', className)}>
      <ReactMarkdown skipHtml components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
