import { useTranslation } from 'react-i18next'
import { documentFileUrl, useFolderTree } from '@/api/library'
import type { FolderNode, LibraryDocument, LibrarySection } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { SURFACE } from '@/components/ui/styles'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatSize } from '@/lib/format'

function countDocuments(folder: FolderNode): number {
  return folder.documents.length + folder.children.reduce((sum, child) => sum + countDocuments(child), 0)
}

function DocumentRow({ document }: { document: LibraryDocument }) {
  const { t, i18n } = useTranslation()
  const ext = document.original_name.split('.').pop()?.toUpperCase() ?? ''
  return (
    <li className="group/doc flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-brand-50/60 motion-reduce:transition-none sm:px-3">
      <span
        aria-hidden="true"
        className="grid h-10 w-9 shrink-0 place-items-center rounded-md bg-white text-[0.625rem] font-extrabold tracking-wide text-brand-800 shadow-soft ring-1 ring-slate-200/80"
      >
        {ext.slice(0, 4)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium break-words text-slate-800">{document.title}</span>
        <span className="text-xs text-slate-500 tabular-nums">{formatSize(document.size, i18n.language)}</span>
      </span>
      <a
        href={documentFileUrl(document.id)}
        download={document.original_name}
        className={cx(
          'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 transition',
          'hover:bg-brand-700 hover:text-white hover:ring-brand-700 active:scale-[0.97] motion-reduce:transition-none',
          FOCUS_RING,
        )}
      >
        <Icon name="download" className="size-4" />
        <span className="hidden sm:inline">{t('library.download')}</span>
        <span className="sr-only">: {document.title}</span>
      </a>
    </li>
  )
}

function FolderBranch({ folder, depth }: { folder: FolderNode; depth: number }) {
  const { t } = useTranslation()
  const total = countDocuments(folder)
  const root = depth === 0
  return (
    <li className={cx(root && SURFACE)}>
      <details open={root} className="group">
        <summary
          className={cx(
            'flex cursor-pointer list-none items-center gap-3 rounded-2xl transition-colors hover:bg-slate-50 motion-reduce:transition-none [&::-webkit-details-marker]:hidden',
            root ? 'p-4 sm:p-5' : 'px-2 py-2 sm:px-3',
            FOCUS_RING,
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              'grid shrink-0 place-items-center rounded-xl',
              root ? 'size-11 bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-sm' : 'size-9 bg-brand-50 text-brand-700',
            )}
          >
            <Icon name="folder" className={root ? 'size-5' : 'size-4'} />
          </span>
          <span className={cx('min-w-0 flex-1 break-words', root ? 'text-lg font-bold tracking-tight' : 'font-semibold')}>
            {folder.title}
          </span>
          <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">
            {t('library.docCount', { count: total })}
          </span>
          <Icon
            name="chevronDown"
            className="size-4 shrink-0 -rotate-90 text-slate-400 transition-transform duration-300 group-open:rotate-0 motion-reduce:transition-none"
          />
        </summary>
        <ul className={cx('flex flex-col gap-0.5', root ? 'border-t border-slate-100 px-2 pt-2 pb-3 sm:px-3' : 'ml-6 border-l-2 border-brand-100 pl-2')}>
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

function TreeSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className={cx(SURFACE, 'flex items-center gap-3 p-5')}>
          <Skeleton className="size-11" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  )
}

/** Bo'lim papkalari daraxti: `<details>` — klaviatura va ekran o'quvchilari bilan o'z-o'zidan ishlaydi. */
export function FolderTree({ section }: { section: LibrarySection }) {
  const { t } = useTranslation()
  const query = useFolderTree(section)
  return (
    <QueryState query={query} loading={<TreeSkeleton />}>
      {(folders) =>
        folders.length === 0 ? (
          <EmptyState icon="folder" title={t('library.empty')} />
        ) : (
          <ul className="flex flex-col gap-4">
            {folders.map((folder) => (
              <FolderBranch key={folder.id} folder={folder} depth={0} />
            ))}
          </ul>
        )
      }
    </QueryState>
  )
}
