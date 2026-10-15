import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteDocument, useDeleteFolder, useSwapFolders } from '@/api/adminCms'
import { documentFileUrl, useFolderTree } from '@/api/library'
import type { FolderNode, LibraryDocument, LibrarySection } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatSize } from '@/lib/format'
import { PageHeader } from '../ui/PageHeader'
import { Panel } from '../ui/Panel'
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

/** Daraxtdagi ixcham ikonka-tugma: nomi `aria-label` va hover'da `title`. */
function IconAction({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: IconName
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-brand-700 hover:shadow-soft',
        'disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none',
        FOCUS_RING,
      )}
    >
      <Icon name={icon} className="size-4" />
    </button>
  )
}

function DocumentItem({ document, actions }: { document: LibraryDocument; actions: TreeActions }) {
  const { t, i18n } = useTranslation()
  return (
    <li className="group flex flex-wrap items-center gap-3 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-slate-50 motion-reduce:transition-none">
      <Icon name="pdf" className="size-4 shrink-0 text-slate-400" />
      <a
        href={documentFileUrl(document.id)}
        download={document.original_name}
        className={cx('min-w-0 flex-1 rounded text-sm break-words text-slate-700 hover:text-brand-700 hover:underline', FOCUS_RING)}
      >
        {document.title}
      </a>
      <span className="text-xs text-slate-400 tabular-nums">{formatSize(document.size, i18n.language)}</span>
      <span className="flex gap-0.5">
        <IconAction
          icon="pencil"
          label={`${t('common.edit')}: ${document.title}`}
          onClick={() => actions.onEditDocument(document)}
        />
        <IconAction
          icon="trash"
          label={`${t('common.delete')}: ${document.title}`}
          onClick={() => actions.onDelete({ kind: 'document', id: document.id, title: document.title })}
        />
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
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 py-1.5 pr-1.5 pl-3 ring-1 ring-slate-200/60">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-brand-600 shadow-soft ring-1 ring-slate-200/70"
        >
          <Icon name="folder" className="size-4" />
        </span>
        <span className="min-w-0 flex-1 font-semibold break-words text-slate-900">{folder.title}</span>
        <span className="flex flex-wrap items-center gap-0.5">
          <IconAction
            icon="arrowUp"
            label={t('adminLibrary.moveUp', { title: folder.title })}
            disabled={!prev || actions.swapping}
            onClick={() => prev && actions.onSwap(prev, folder)}
          />
          <IconAction
            icon="arrowDown"
            label={t('adminLibrary.moveDown', { title: folder.title })}
            disabled={!next || actions.swapping}
            onClick={() => next && actions.onSwap(folder, next)}
          />
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />
          <Button variant="ghost" size="sm" onClick={() => actions.onAddDocument(folder.id)}>
            <Icon name="plus" className="size-4" />
            {t('adminLibrary.document')}
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
            <Icon name="plus" className="size-4" />
            {t('adminLibrary.subfolder')}
          </Button>
          <IconAction
            icon="pencil"
            label={`${t('common.edit')}: ${folder.title}`}
            onClick={() => actions.onFolder({ mode: 'rename', id: folder.id, title: folder.title })}
          />
          <IconAction
            icon="trash"
            label={`${t('common.delete')}: ${folder.title}`}
            onClick={() => actions.onDelete({ kind: 'folder', id: folder.id, title: folder.title })}
          />
        </span>
      </div>
      {(folder.children.length > 0 || folder.documents.length > 0) && (
        <ul className="ml-[1.6rem] flex flex-col gap-1 border-l border-dashed border-slate-200 py-1 pl-3">
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
              <Icon name="plus" className="size-4" />
              {t('adminLibrary.newFolder')}
            </Button>
            {folders.length === 0 ? (
              <EmptyState icon="folder" title={t('library.empty')} />
            ) : (
              <Panel>
                <ul className="flex flex-col gap-2">
                  {folders.map((folder, index) => (
                    <FolderItem key={folder.id} folder={folder} siblings={folders} index={index} actions={treeActions} />
                  ))}
                </ul>
              </Panel>
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
      <PageHeader
        icon="folder"
        eyebrow={t('navGroups.site')}
        title={t('adminLibrary.title')}
        subtitle={t('adminLibrary.subtitle')}
      />
      <div>
        <Tabs
          variant="pill"
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
