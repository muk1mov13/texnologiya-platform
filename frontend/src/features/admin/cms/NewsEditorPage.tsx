import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import {
  adminNewsCoverUrl,
  useAdminNews,
  useCreateNews,
  useDeleteNews,
  useSetNewsCover,
  useUpdateNews,
} from '@/api/adminCms'
import { ApiError, apiBuffer } from '@/api/client'
import type { NewsAdmin } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-classes'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Markdown } from '@/components/ui/Markdown'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { BACK_LINK } from '@/components/ui/styles'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { pushToast } from '@/components/ui/toast-store'
import { fromLocalInput, toLocalInput } from '@/lib/datetime'
import { FILE_INPUT_CLASS, IMAGE_ACCEPT } from '@/lib/files'
import { formatDateTime } from '@/lib/format'
import { Panel } from '../ui/Panel'
import { NEWS_STATUS_TONE, newsStatus } from './newsStatus'
import { newsSchema, type NewsValues } from './schemas'

type Mode = 'edit' | 'preview'

export function NewsEditorPage() {
  const { t } = useTranslation()
  const { newsId = 'new' } = useParams()
  const id = newsId === 'new' ? null : Number(newsId)
  const query = useAdminNews(id)

  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/news" className={BACK_LINK}>
        <Icon name="arrowLeft" className="size-4" />
        {t('adminNews.title')}
      </Link>
      {id === null ? (
        <NewsForm key="new" news={null} />
      ) : (
        <QueryState query={query} loading={<EditorSkeleton />}>
          {(news) => <NewsForm key={news.id} news={news} />}
        </QueryState>
      )}
    </div>
  )
}

function NewsForm({ news }: { news: NewsAdmin | null }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateNews()
  const update = useUpdateNews()
  const remove = useDeleteNews()
  const mutation = news ? update : create
  const [mode, setMode] = useState<Mode>('edit')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<NewsValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: news?.title ?? '',
      slug: news?.slug ?? '',
      body: news?.body ?? '',
      published_at: toLocalInput(news?.published_at ?? null),
    },
  })
  const body = useWatch({ control, name: 'body' })
  const slugTaken = mutation.error instanceof ApiError && mutation.error.code === 'NEWS_SLUG_TAKEN'

  /** `publishedAt`: `undefined` — formadagi qiymat; aks holda shu qiymat (hozir / `null`). */
  function save(values: NewsValues, publishedAt?: string | null) {
    const published_at = publishedAt !== undefined ? publishedAt : fromLocalInput(values.published_at)
    const onError = (error: unknown) => {
      if (error instanceof ApiError && error.code === 'NEWS_SLUG_TAKEN') {
        setError('slug', { message: 'errors.NEWS_SLUG_TAKEN' })
      }
    }
    if (news) {
      update.mutate(
        // Bo'sh slug yuborilmaydi (`null` — o'zgartirmaslik); `published_at: null` — nashrdan olish.
        { id: news.id, data: { title: values.title, slug: values.slug || null, body: values.body, published_at } },
        { onSuccess: () => pushToast('success', t('adminNews.saved')), onError },
      )
    } else {
      create.mutate(
        { title: values.title, slug: values.slug || null, body: values.body, published_at },
        {
          onSuccess: (created) => {
            pushToast('success', t('adminNews.saved'))
            // Muqova faqat saqlangan yangilikka qo'shiladi — tahrir sahifasiga o'tiladi.
            void navigate(`/admin/news/${created.id}`, { replace: true })
          },
          onError,
        },
      )
    }
  }

  const status = news ? newsStatus(news) : 'draft'

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => save(values))}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-[1.9rem]">
            {t(news ? 'adminNews.editTitle' : 'adminNews.new')}
          </h1>
          <Badge dot tone={NEWS_STATUS_TONE[status]}>
            {t(`adminNews.status.${status}`)}
          </Badge>
        </div>
        {mutation.error && !slugTaken && <FormError error={mutation.error} />}
        <Panel>
          <div className="flex flex-col gap-4">
            <Field id="news-title" label={t('adminNews.titleLabel')} error={errors.title?.message}>
              <Input id="news-title" maxLength={300} className="text-lg font-semibold" {...register('title')} />
            </Field>
            <Field id="news-slug" label={t('adminNews.slugLabel')} hint={t('adminNews.slugHint')} error={errors.slug?.message}>
              <Input id="news-slug" maxLength={220} className="font-mono text-sm" {...register('slug')} />
            </Field>
          </div>
        </Panel>
        <Panel
          title={t('adminNews.bodyLabel')}
          actions={
            <Tabs
              variant="pill"
              label={t('adminNews.bodyLabel')}
              value={mode}
              onChange={setMode}
              items={[
                { id: 'edit', label: t('adminNews.write') },
                { id: 'preview', label: t('adminNews.preview') },
              ]}
            />
          }
        >
          <TabPanel id={mode}>
            {mode === 'edit' ? (
              <Field id="news-body" label={t('adminNews.bodyLabel')} hint={t('adminNews.bodyHint')} error={errors.body?.message}>
                <Textarea id="news-body" rows={18} className="font-mono text-sm leading-relaxed" {...register('body')} />
              </Field>
            ) : body.trim() ? (
              <Markdown className="min-h-64">{body}</Markdown>
            ) : (
              <p className="py-10 text-center text-slate-500">{t('adminNews.previewEmpty')}</p>
            )}
          </TabPanel>
        </Panel>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        <Panel title={t('adminNews.publishTitle')}>
          <div className="flex flex-col gap-4">
            <Field
              id="news-published"
              label={t('adminNews.publishedAt')}
              hint={t('adminNews.publishedAtHint')}
              error={errors.published_at?.message}
            >
              <Input id="news-published" type="datetime-local" {...register('published_at')} />
            </Field>
            <div className="flex flex-col gap-2">
              <Button type="submit" loading={mutation.isPending}>
                {t('common.save')}
              </Button>
              {status !== 'published' && (
                <Button
                  variant="secondary"
                  disabled={mutation.isPending}
                  onClick={handleSubmit((values) => save(values, new Date().toISOString()))}
                >
                  <Icon name="send" className="size-4" />
                  {t('adminNews.publishNow')}
                </Button>
              )}
              {news && status !== 'draft' && (
                <Button variant="secondary" disabled={mutation.isPending} onClick={handleSubmit((values) => save(values, null))}>
                  <Icon name="eyeOff" className="size-4" />
                  {t('adminNews.unpublish')}
                </Button>
              )}
              {news && status === 'published' && (
                <Link to={`/news/${news.slug}`} target="_blank" className={buttonClasses('ghost', 'md')}>
                  {t('adminNews.view')}
                  <Icon name="externalLink" className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </Panel>
        {news && (
          <>
            <CoverCard news={news} />
            <Panel>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm tabular-nums">
                <dt className="text-slate-500">{t('adminNews.viewsLabel')}</dt>
                <dd className="text-right font-semibold text-slate-800">{news.views}</dd>
                <dt className="text-slate-500">{t('adminNews.createdAt')}</dt>
                <dd className="text-right text-slate-700">{formatDateTime(news.created_at, i18n.language)}</dd>
                <dt className="text-slate-500">{t('adminNews.updatedAt')}</dt>
                <dd className="text-right text-slate-700">{formatDateTime(news.updated_at, i18n.language)}</dd>
              </dl>
              <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" className="size-4" />
                {t('adminNews.delete')}
              </Button>
            </Panel>
            <ConfirmDialog
              open={confirmDelete}
              title={t('adminNews.deleteTitle')}
              text={t('adminNews.deleteText', { title: news.title })}
              confirmLabel={t('common.delete')}
              pending={remove.isPending}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() =>
                remove.mutate(news.id, {
                  onSuccess: () => void navigate('/admin/news', { replace: true }),
                  onSettled: () => setConfirmDelete(false),
                })
              }
            />
          </>
        )}
      </aside>
    </form>
  )
}

function EditorSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  )
}

/** Qoralama muqovasi ochiq endpoint'dan kelmaydi — admin endpoint'idan blob URL bilan ko'rsatiladi. */
function useCoverPreview(news: NewsAdmin): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!news.has_cover) return
    const controller = new AbortController()
    let objectUrl: string | null = null
    apiBuffer(adminNewsCoverUrl(news.id), controller.signal)
      .then((buffer) => {
        objectUrl = URL.createObjectURL(new Blob([buffer]))
        setUrl(objectUrl)
      })
      .catch(() => setUrl(null))
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [news.id, news.has_cover, news.updated_at])
  return news.has_cover ? url : null
}

function CoverCard({ news }: { news: NewsAdmin }) {
  const { t } = useTranslation()
  const setCover = useSetNewsCover()
  const preview = useCoverPreview(news)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Panel title={t('adminNews.cover')}>
      <div className="flex flex-col gap-3">
        {preview ? (
          <img src={preview} alt="" className="aspect-[16/9] w-full rounded-2xl object-cover ring-1 ring-slate-900/5" />
        ) : (
          <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 text-sm text-slate-500 border-2 border-dashed border-slate-200">
            <Icon name="camera" className="size-6 text-slate-400" />
            {t(news.has_cover ? 'common.loading' : 'adminNews.noCover')}
          </div>
        )}
        <Field id="news-cover" label={t(news.has_cover ? 'adminBooks.replaceCover' : 'adminBooks.addCover')} hint={t('myBooks.coverHint')}>
          <Input
            ref={inputRef}
            id="news-cover"
            type="file"
            accept={IMAGE_ACCEPT}
            className={FILE_INPUT_CLASS}
            disabled={setCover.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              setCover.mutate(
                { id: news.id, cover: file },
                {
                  onSuccess: () => pushToast('success', t('adminNews.coverSaved')),
                  onSettled: () => {
                    if (inputRef.current) inputRef.current.value = ''
                  },
                },
              )
            }}
          />
        </Field>
      </div>
    </Panel>
  )
}
