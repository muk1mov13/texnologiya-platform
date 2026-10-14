import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteDocument, useDeleteFolder, useSwapFolders } from '@/api/adminCms'
import { documentFileUrl, useFolderTree } from '@/api/library'
import type { FolderNode, LibraryDocument, LibrarySection } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { formatSize } from '@/lib/format'
import {
  AddDocumentModal,
  EditDocumentModal,
  FolderModal,
  type FolderOption,
  type FolderTarget,
} from './LibraryModals'

const SECTIONS: LibrarySection[] = ['metodik', 'huquqiy']

type Pending =
  | { kind: 'folder'; id: number; title: string }
  | { kind: 'document'; id: number; title: string }

/** Ko'chirish ro'yxati uchun daraxt tekislanadi (chuqurlik chiziqcha bilan). */
function flatten(nodes: FolderNode[], depth = 0): FolderOption[] {
  return nodes.flatMap((node) => [
    { id: node.id, label: `${'— '.repeat(depth)}${node.title}` },
    ...flatten(node.children, depth + 1),
  ])
}

const nextOrder = (siblings: FolderNode[]) => siblings.reduce((max, node) => Math.max(max, node.order + 1), 0)

interface TreeActions {
  onFolder: (target: FolderTarget) => void
  onAddDocument: (folderId: number) => void
  onEditDocument: (document: LibraryDocument) => void
  onDelete: (pending: Pending) => void
  /** Ko'rinish tartibida: `upper` yuqoridagi, `lower` pastdagi qo'shni. */
  onSwap: (upper: FolderNode, lower: FolderNode) => void
  swapping: boolean
}

function DocumentItem({ document, actions }: { document: LibraryDocument; actions: TreeActions }) {
  const { t, i18n } = useTranslation()
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50">
      <span aria-hidden="true">📄</span>
      <a
        href={documentFileUrl(document.id)}
        download={document.original_name}
        className="min-w-0 flex-1 break-words hover:text-brand-700 hover:underline"
      >
        {document.title}
      </a>
      <span className="text-xs text-slate-500">{formatSize(document.size, i18n.language)}</span>
      <span className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => actions.onEditDocument(document)}>
          {t('common.edit')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => actions.onDelete({ kind: 'document', id: document.id, title: document.title })}
        >
          {t('common.delete')}
        </Button>
      </span>
    </li>
  )
}

function FolderItem({
  folder,
  siblings,
  index,
  actions,
}: {
  folder: FolderNode
  siblings: FolderNode[]
  index: number
  actions: TreeActions
}) {
  const { t } = useTranslation()
  const prev = siblings[index - 1]
  const next = siblings[index + 1]
  return (
    <li className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-2 py-1.5">
        <span aria-hidden="true">📁</span>
        <span className="min-w-0 flex-1 font-semibold break-words">{folder.title}</span>
        <span className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('adminLibrary.moveUp', { title: folder.title })}
            disabled={!prev || actions.swapping}
            onClick={() => prev && actions.onSwap(prev, folder)}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('adminLibrary.moveDown', { title: folder.title })}
            disabled={!next || actions.swapping}
            onClick={() => next && actions.onSwap(folder, next)}
          >
            ↓
          </Button>
          <Button variant="ghost" size="sm" onClick={() => actions.onAddDocument(folder.id)}>
            + {t('adminLibrary.document')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              actions.onFolder({
                mode: 'create',
                section: folder.section,
                parentId: folder.id,
                order: nextOrder(folder.children),
              })
            }
          >
            + {t('adminLibrary.subfolder')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onFolder({ mode: 'rename', id: folder.id, title: folder.title })}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onDelete({ kind: 'folder', id: folder.id, title: folder.title })}
          >
            {t('common.delete')}
          </Button>
        </span>
      </div>
      {(folder.children.length > 0 || folder.documents.length > 0) && (
        <ul className="ml-3 flex flex-col gap-1 border-l-2 border-slate-100 pl-3">
          {folder.children.map((child, childIndex) => (
            <FolderItem
              key={child.id}
              folder={child}
              siblings={folder.children}
              index={childIndex}
              actions={actions}
            />
          ))}
          {folder.documents.map((document) => (
            <DocumentItem key={document.id} document={document} actions={actions} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** Sahifa darajasida hujjat tahriri ko'chirish uchun bo'lim papkalari ro'yxatini ham oladi. */
type SectionActions = Omit<TreeActions, 'onEditDocument'> & {
  onEditDocument: (document: LibraryDocument, folders: FolderOption[]) => void
}

function SectionTree({ section, actions }: { section: LibrarySection; actions: SectionActions }) {
  const { t } = useTranslation()
  const query = useFolderTree(section)
  return (
    <QueryState query={query}>
      {(folders) => {
        const options = flatten(folders)
        const treeActions: TreeActions = {
          ...actions,
          onEditDocument: (document) => actions.onEditDocument(document, options),
        }
        return (
          <div className="flex flex-col gap-4">
            <Button
              className="self-start"
              onClick={() =>
                actions.onFolder({ mode: 'create', section, parentId: null, order: nextOrder(folders) })
              }
            >
              + {t('adminLibrary.newFolder')}
            </Button>
            {folders.length === 0 ? (
              <EmptyState icon="📂" title={t('library.empty')} />
            ) : (
              <ul className="flex flex-col gap-2 rounded-2xl border-2 border-slate-100 bg-white p-3">
                {folders.map((folder, index) => (
                  <FolderItem key={folder.id} folder={folder} siblings={folders} index={index} actions={treeActions} />
                ))}
              </ul>
            )}
          </div>
        )
      }}
    </QueryState>
  )
}

export function AdminLibraryPage() {
  const { t } = useTranslation()
  const [section, setSection] = useState<LibrarySection>('metodik')
  const [folderTarget, setFolderTarget] = useState<FolderTarget | null>(null)
  const [addTo, setAddTo] = useState<number | null>(null)
  const [editing, setEditing] = useState<{ document: LibraryDocument; folders: FolderOption[] } | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const swap = useSwapFolders()
  const deleteFolder = useDeleteFolder()
  const deleteDocument = useDeleteDocument()
  const deleting = deleteFolder.isPending || deleteDocument.isPending

  function confirmDelete() {
    if (!pending) return
    const mutation = pending.kind === 'folder' ? deleteFolder : deleteDocument
    // `FOLDER_NOT_EMPTY` (409) umumiy toast bilan ko'rsatiladi.
    mutation.mutate(pending.id, { onSettled: () => setPending(null) })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t('adminLibrary.title')}</h1>
        <p className="text-slate-600">{t('adminLibrary.subtitle')}</p>
      </div>
      <div>
        <Tabs
          label={t('adminLibrary.title')}
          value={section}
          onChange={setSection}
          items={SECTIONS.map((id) => ({ id, label: t(`library.tabs.${id}`) }))}
        />
        <TabPanel id={section}>
          <SectionTree
            key={section}
            section={section}
            actions={{
              onFolder: setFolderTarget,
              onAddDocument: setAddTo,
              onEditDocument: (document, folders) => setEditing({ document, folders }),
              onDelete: setPending,
              onSwap: (upper, lower) => swap.mutate([upper, lower]),
              swapping: swap.isPending,
            }}
          />
        </TabPanel>
      </div>
      <FolderModal target={folderTarget} onClose={() => setFolderTarget(null)} />
      <AddDocumentModal folderId={addTo} onClose={() => setAddTo(null)} />
      <EditDocumentModal
        document={editing?.document ?? null}
        folders={editing?.folders ?? []}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={pending !== null}
        title={t(pending?.kind === 'folder' ? 'adminLibrary.deleteFolderTitle' : 'adminLibrary.deleteDocumentTitle')}
        text={t(pending?.kind === 'folder' ? 'adminLibrary.deleteFolderText' : 'adminLibrary.deleteDocumentText', {
          title: pending?.title ?? '',
        })}
        confirmLabel={t('common.delete')}
        pending={deleting}
        onCancel={() => setPending(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
