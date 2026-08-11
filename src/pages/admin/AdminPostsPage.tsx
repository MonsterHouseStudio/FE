import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type {
  AdminPost,
  PostCategory,
  PostSavePayload,
  PostTranslation,
  ServerLocale,
} from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'
import { AdminModal, Field } from './AdminModal'
import { ImageUploader } from './ImageUploader'

const CATEGORY_LABEL: Record<PostCategory, string> = {
  MEDIA: '미디어',
  NOTICE: '공지',
}

/** 제목에서 slug 후보를 만듭니다. 한글은 slug 규칙(영소문자·숫자·하이픈)에 못 들어갑니다. */
function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 120)
}

function emptyPost(): PostSavePayload {
  return {
    slug: '',
    category: 'MEDIA',
    thumbnailKey: '',
    published: false,
    translations: [],
  }
}

function toPayload(p: AdminPost): PostSavePayload {
  return {
    slug: p.slug,
    category: p.category,
    thumbnailKey: p.thumbnailKey ?? '',
    published: p.published,
    translations: p.translations,
  }
}

export default function AdminPostsPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getPosts(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    id: number | null
    form: PostSavePayload
    previewUrl: string | null
  } | null>(null)

  const posts = data ?? []

  const remove = async (post: AdminPost) => {
    const title = post.translations.find((x) => x.locale === 'KO')?.title ?? post.slug
    if (!window.confirm(`"${title}" 글을 삭제할까요? 되돌릴 수 없습니다.`)) return
    setBusyId(post.id)
    setActionError(null)
    try {
      await adminApi.deletePost(post.id)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="미디어 글"
        desc={data ? `전체 ${data.length}건 · 비공개 글은 사이트에 노출되지 않습니다` : undefined}
        action={
          <Button
            size="sm"
            onClick={() => setEditing({ id: null, form: emptyPost(), previewUrl: null })}
          >
            + {t('admin.actionAdd')}
          </Button>
        }
      />

      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300"
        >
          {actionError}
        </p>
      )}

      <AsyncBoundary
        loading={loading}
        error={error}
        empty={!loading && posts.length === 0}
        emptyText="작성된 글이 없습니다."
        onRetry={reload}
      >
        {posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((post) => {
              const ko = post.translations.find((x) => x.locale === 'KO')
              const translated = !post.missingLocales.includes('JA')

              return (
                <div
                  key={post.id}
                  className={
                    'surface flex flex-wrap items-center gap-5 p-5 ' +
                    (post.published ? '' : 'opacity-60')
                  }
                >
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-ink-800 bg-ink-900">
                    {post.thumbnailUrl ? (
                      <img src={post.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-ink-600">
                        없음
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-white">
                        {ko?.title ?? post.translations[0]?.title ?? post.slug}
                      </h2>
                      <Badge tone="neutral">{CATEGORY_LABEL[post.category]}</Badge>
                      <Badge tone={post.published ? 'success' : 'warning'}>
                        {post.published ? '공개' : '비공개'}
                      </Badge>
                      <Badge tone={translated ? 'success' : 'warning'}>
                        {translated ? t('admin.translated') : t('admin.jaMissing')}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-ink-600">/{post.slug}</p>
                    {ko?.excerpt && (
                      <p className="mt-1 line-clamp-1 text-xs text-ink-400">{ko.excerpt}</p>
                    )}
                    <p className="mt-1 text-[11px] text-ink-600">
                      {post.publishedAt ? formatDate(post.publishedAt, 'ko') : '미발행'} · 조회{' '}
                      {post.viewCount}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditing({
                          id: post.id,
                          form: toPayload(post),
                          previewUrl: post.thumbnailUrl,
                        })
                      }
                    >
                      {t('admin.actionEdit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === post.id}
                      onClick={() => void remove(post)}
                    >
                      {t('admin.actionDelete')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </AsyncBoundary>

      {editing && (
        <PostForm
          state={editing}
          onChange={(next) => setEditing({ ...editing, ...next })}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}

// =====================================================================

const BLANK: Omit<PostTranslation, 'locale'> = { series: '', title: '', excerpt: '', body: '' }

function PostForm({
  state,
  onChange,
  onClose,
  onSaved,
}: {
  state: { id: number | null; form: PostSavePayload; previewUrl: string | null }
  onChange: (next: Partial<{ form: PostSavePayload; previewUrl: string | null }>) => void
  onClose: () => void
  onSaved: () => void
}) {
  const { id, form, previewUrl } = state
  const [tab, setTab] = useState<ServerLocale>('KO')

  const set = <K extends keyof PostSavePayload>(k: K, v: PostSavePayload[K]) =>
    onChange({ form: { ...form, [k]: v } })

  const tr = (locale: ServerLocale): Omit<PostTranslation, 'locale'> =>
    form.translations.find((x) => x.locale === locale) ?? BLANK

  const setTr = (
    locale: ServerLocale,
    field: keyof Omit<PostTranslation, 'locale'>,
    value: string,
  ) => {
    const next = { ...tr(locale), [field]: value }
    const rest = form.translations.filter((x) => x.locale !== locale)

    // 서버가 title 과 body 를 @NotBlank 로 막습니다.
    // 둘 다 비면 그 언어 번역을 통째로 빼야 400 이 나지 않습니다.
    const keep = next.title.trim() || next.body.trim()
    onChange({
      form: {
        ...form,
        translations: keep ? [...rest, { locale, ...next } as PostTranslation] : rest,
      },
    })
  }

  const submit = async () => {
    if (form.translations.length === 0) throw new Error('최소 한 언어의 제목과 본문을 입력해주세요.')

    for (const t of form.translations) {
      if (!t.title.trim() || !t.body.trim()) {
        throw new Error(
          `${t.locale === 'KO' ? '한국어' : '일본어'}: 제목과 본문을 모두 입력하거나, 둘 다 비워주세요.`,
        )
      }
    }
    if (id === null) await adminApi.createPost(form)
    else await adminApi.updatePost(id, form)
    onSaved()
  }

  const current = tr(tab)

  return (
    <AdminModal
      title={id === null ? '글 작성' : '글 수정'}
      onClose={onClose}
      onSubmit={submit}
      wide
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="분류">
          <select
            className="field"
            value={form.category}
            onChange={(e) => set('category', e.target.value as PostCategory)}
          >
            {(Object.keys(CATEGORY_LABEL) as PostCategory[]).map((k) => (
              <option key={k} value={k}>
                {CATEGORY_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="주소 (slug)" hint="영문 소문자·숫자·하이픈만">
          <input
            className="field font-mono text-xs"
            value={form.slug}
            placeholder="crew-growth-01"
            onChange={(e) => set('slug', e.target.value)}
          />
        </Field>
        <Field label="공개 여부">
          <label className="mt-1 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={form.published}
              onChange={(e) => set('published', e.target.checked)}
            />
            <span className="text-sm text-ink-200">사이트에 노출</span>
          </label>
        </Field>
      </div>

      <ImageUploader
        directory="post"
        label="썸네일"
        value={previewUrl}
        onUploaded={(img) =>
          onChange({
            form: { ...form, thumbnailKey: img.mediumKey },
            previewUrl: img.thumbUrl,
          })
        }
      />

      {/* 본문이 길어 두 언어를 나란히 두면 좁아집니다. 탭으로 전환합니다. */}
      <div className="border-t border-ink-800 pt-5">
        <div className="mb-4 flex gap-2">
          {(['KO', 'JA'] as ServerLocale[]).map((locale) => {
            const filled = form.translations.some((x) => x.locale === locale)
            return (
              <button
                key={locale}
                type="button"
                onClick={() => setTab(locale)}
                className={
                  'rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ' +
                  (tab === locale
                    ? 'border-brand-500 bg-brand-600 text-white'
                    : 'border-ink-800 text-ink-400 hover:text-white')
                }
              >
                {locale === 'KO' ? '한국어' : '日本語'}
                <span className={'ml-1.5 ' + (filled ? 'text-emerald-300' : 'text-ink-600')}>
                  {filled ? '●' : '○'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          <Field label="시리즈" hint="예: 크루 성장기 (선택)">
            <input
              className="field"
              value={current.series ?? ''}
              onChange={(e) => setTr(tab, 'series', e.target.value)}
            />
          </Field>

          <Field label="제목">
            <input
              className="field"
              value={current.title}
              onChange={(e) => {
                setTr(tab, 'title', e.target.value)
                // 새 글이고 한국어 제목이면 slug 후보를 채워줍니다.
                // 한글은 slug 규칙에 못 들어가므로 비워둔 채로 두고 직접 쓰게 합니다.
                if (id === null && tab === 'KO' && !form.slug) {
                  const candidate = slugify(e.target.value)
                  if (candidate) set('slug', candidate)
                }
              }}
            />
          </Field>

          <Field label="요약" hint="목록에 보이는 한두 줄">
            <textarea
              className="field"
              rows={2}
              value={current.excerpt ?? ''}
              onChange={(e) => setTr(tab, 'excerpt', e.target.value)}
            />
          </Field>

          <Field label="본문">
            <textarea
              className="field font-mono text-xs leading-relaxed"
              rows={12}
              value={current.body}
              onChange={(e) => setTr(tab, 'body', e.target.value)}
            />
          </Field>
        </div>
      </div>
    </AdminModal>
  )
}
