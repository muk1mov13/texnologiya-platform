import { useTranslation } from 'react-i18next'
import { documentFileUrl, useFolderTree } from '@/api/library'
import type { FolderNode, LibraryDocument, LibrarySection } from '@/api/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatSize } from '@/lib/format'

function countDocuments(folder: FolderNode): number {
  return folder.documents.length + folder.children.reduce((sum, child) => sum + countDocuments(child), 0)
}

function DocumentRow({ document }: { document: LibraryDocument }) {
  const { t, i18n } = useTranslation()
  const ext = document.original_name.split('.').pop()?.toUpperCase() ?? ''
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 hover:bg-slate-50">
      <span aria-hidden="true">📄</span>
      <span className="min-w-0 flex-1 break-words">{document.title}</span>
      <span className="text-xs text-slate-500">
        {ext} · {formatSize(document.size, i18n.language)}
      </span>
      <a
        href={documentFileUrl(document.id)}
        download={document.original_name}
        className={cx('rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50', FOCUS_RING)}
      >
        {t('library.download')}
        <span className="sr-only">: {document.title}</span>
      </a>
    </li>
  )
}

function FolderBranch({ folder, depth }: { folder: FolderNode; depth: number }) {
  const { t } = useTranslation()
  const total = countDocuments(folder)
  return (
    <li>
      <details open={depth === 0} className="group">
        <summary
          className={cx(
            'flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 font-semibold hover:bg-slate-50 [&::-webkit-details-marker]:hidden',
            FOCUS_RING,
          )}
        >
          <span aria-hidden="true" className="text-xs text-slate-400 transition group-open:rotate-90 motion-reduce:transition-none">
            ▶
          </span>
          <span aria-hidden="true">📁</span>
          <span className="min-w-0 flex-1 break-words">{folder.title}</span>
          <span className="shrink-0 text-xs font-normal text-slate-500">{t('library.docCount', { count: total })}</span>
        </summary>
        <ul className="ml-4 border-l-2 border-slate-100 pl-2">
          {folder.children.map((child) => (
            <FolderBranch key={child.id} folder={child} depth={depth + 1} />
          ))}
          {folder.documents.map((document) => (
            <DocumentRow key={document.id} document={document} />
          ))}
          {total === 0 && <li className="px-3 py-2 text-sm text-slate-500">{t('library.emptyFolder')}</li>}
        </ul>
      </details>
    </li>
  )
}

/** Bo'lim papkalari daraxti: `<details>` — klaviatura va ekran o'quvchilari bilan o'z-o'zidan ishlaydi. */
export function FolderTree({ section }: { section: LibrarySection }) {
  const { t } = useTranslation()
  const query = useFolderTree(section)
  return (
    <QueryState query={query}>
      {(folders) =>
        folders.length === 0 ? (
          <EmptyState icon="📂" title={t('library.empty')} />
        ) : (
          <ul className="flex flex-col gap-1 rounded-2xl border-2 border-slate-100 bg-white p-2">
            {folders.map((folder) => (
              <FolderBranch key={folder.id} folder={folder} depth={0} />
            ))}
          </ul>
        )
      }
    </QueryState>
  )
}
