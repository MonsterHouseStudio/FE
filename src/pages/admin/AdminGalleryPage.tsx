import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { AdminGalleryItem, GalleryCategory, GallerySavePayload } from '@/types'
import { Badge, Photo } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'
import { AdminModal, Field } from './AdminModal'
import { ImageUploader } from './ImageUploader'

const CATEGORY_LABEL: Record<GalleryCategory, string> = {
  PHOTO: '사진',
  VIDEO: '영상',
  INTERPRETER: '통역',
}

function emptyItem(sortOrder: number): GallerySavePayload {
  return {
    category: 'PHOTO',
    imageKey: '',
    thumbKey: '',
    ratio: 'portrait',
    takenAt: null,
    // ★ 기본값은 반드시 false 입니다.
    //   기본이 true 면 동의를 안 받은 사진이 업로드 즉시 공개됩니다 (기획서 §9).
    consent: false,
    consentNote: '',
    sortOrder,
    translations: [],
  }
}

function toPayload(item: AdminGalleryItem): GallerySavePayload {
  return {
    category: item.category,
    imageKey: item.imageKey,
    thumbKey: item.thumbKey ?? item.imageKey,
    ratio: item.ratio,
    takenAt: item.takenAt,
    consent: item.consent,
    consentNote: item.consentNote ?? '',
    sortOrder: item.sortOrder,
    translations: item.translations,
  }
}

export default function AdminGalleryPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getGallery(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    id: number | null
    form: GallerySavePayload
    previewUrl: string | null
  } | null>(null)

  const items = data ?? []
  const awaiting = items.filter((i) => !i.consent).length

  const toggleConsent = async (item: AdminGalleryItem) => {
    let note = item.consentNote ?? ''
    if (!item.consent) {
      const input = window.prompt('동의 근거를 남겨주세요 (예: 2026-08-01 카톡 동의)', note)
      if (input === null) return
      note = input
    }
    setBusyId(item.id)
    setActionError(null)
    try {
      await adminApi.setGalleryConsent(item.id, !item.consent, note)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '처리에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (item: AdminGalleryItem) => {
    if (!window.confirm('이 사진을 삭제할까요? 되돌릴 수 없습니다.')) return
    setBusyId(item.id)
    setActionError(null)
    try {
      await adminApi.deleteGalleryItem(item.id)
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
        title={t('admin.gallery')}
        desc="게시 동의를 받은 사진만 공개 갤러리에 나갑니다. 동의 전에는 관리자만 볼 수 있습니다."
        action={
          <Button
            size="sm"
            onClick={() =>
              setEditing({ id: null, form: emptyItem(items.length), previewUrl: null })
            }
          >
            + 사진 업로드
          </Button>
        }
      />

      {awaiting > 0 && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/90">
          동의 대기 {awaiting}건 — 동의 없이 공개하면 초상권 문제가 됩니다.
        </p>
      )}

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
        empty={!loading && items.length === 0}
        emptyText="등록된 사진이 없습니다. 오른쪽 위 버튼으로 첫 사진을 올려보세요."
        onRetry={reload}
      >
        {items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => {
              const caption =
                item.translations.find((tr) => tr.locale === 'KO')?.caption ??
                item.translations[0]?.caption ??
                ''

              return (
                <div key={item.id} className="surface overflow-hidden">
                  <div className="relative">
                    <Photo
                      src={item.thumbUrl ?? item.imageUrl}
                      seed={item.id}
                      alt={caption}
                      className="aspect-square w-full"
                    />
                    {!item.consent && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <span className="rounded-full border border-red-500/50 px-3 py-1 text-[11px] font-bold text-red-300">
                          {t('admin.consentHidden')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="neutral">{CATEGORY_LABEL[item.category]}</Badge>
                      {item.missingLocales.length > 0 && (
                        <Badge tone="warning">
                          {item.missingLocales.join('/')} 미작성
                        </Badge>
                      )}
                    </div>

                    <p className="mt-2.5 line-clamp-2 text-xs leading-snug text-ink-300">
                      {caption || <span className="text-ink-600">설명 없음</span>}
                    </p>
                    {item.takenAt && (
                      <p className="mt-2 text-[11px] text-ink-600">
                        {formatDate(item.takenAt, 'ko')}
                      </p>
                    )}
                    {item.consent && item.consentNote && (
                      <p className="mt-1 text-[11px] text-ink-600">근거: {item.consentNote}</p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-ink-800 pt-3">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.consent}
                          disabled={busyId === item.id}
                          onChange={() => void toggleConsent(item)}
                          className="h-3.5 w-3.5 accent-brand-600"
                        />
                        <span className="text-[11px] text-ink-400">{t('admin.consent')}</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              id: item.id,
                              form: toPayload(item),
                              previewUrl: item.thumbUrl ?? item.imageUrl,
                            })
                          }
                          className="text-[11px] text-ink-400 hover:text-white"
                        >
                          {t('admin.actionEdit')}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void remove(item)}
                          className="text-[11px] text-ink-600 hover:text-red-400"
                        >
                          {t('admin.actionDelete')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </AsyncBoundary>

      {editing && (
        <GalleryForm
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

function GalleryForm({
  state,
  onChange,
  onClose,
  onSaved,
}: {
  state: { id: number | null; form: GallerySavePayload; previewUrl: string | null }
  onChange: (next: Partial<{ form: GallerySavePayload; previewUrl: string | null }>) => void
  onClose: () => void
  onSaved: () => void
}) {
  const { id, form, previewUrl } = state
  const set = <K extends keyof GallerySavePayload>(k: K, v: GallerySavePayload[K]) =>
    onChange({ form: { ...form, [k]: v } })

  const caption = (locale: 'KO' | 'JA') =>
    form.translations.find((tr) => tr.locale === locale)?.caption ?? ''

  const setCaption = (locale: 'KO' | 'JA', value: string) => {
    const rest = form.translations.filter((tr) => tr.locale !== locale)
    // 빈 캡션은 번역 자체를 넣지 않습니다.
    // 빈 문자열로 넣으면 "번역이 있다"고 판단되어 미작성 배지가 사라집니다.
    onChange({
      form: {
        ...form,
        translations: value.trim() ? [...rest, { locale, caption: value }] : rest,
      },
    })
  }

  const submit = async () => {
    if (!form.imageKey) throw new Error('이미지를 먼저 업로드해주세요.')
    if (id === null) await adminApi.createGalleryItem(form)
    else await adminApi.updateGalleryItem(id, form)
    onSaved()
  }

  return (
    <AdminModal
      title={id === null ? '사진 업로드' : '사진 수정'}
      onClose={onClose}
      onSubmit={submit}
      wide
    >
      <ImageUploader
        directory="gallery"
        value={previewUrl}
        label="사진"
        onUploaded={(img) =>
          onChange({
            // 서버가 만든 key 를 저장합니다. URL 이 아니라 key 여야
            // 나중에 CDN 도메인이 바뀌어도 데이터가 안 깨집니다.
            form: {
              ...form,
              imageKey: img.mediumKey,
              thumbKey: img.thumbKey,
              ratio: img.ratio,
            },
            previewUrl: img.thumbUrl,
          })
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="분류">
          <select
            className="field"
            value={form.category}
            onChange={(e) => set('category', e.target.value as GalleryCategory)}
          >
            {(Object.keys(CATEGORY_LABEL) as GalleryCategory[]).map((k) => (
              <option key={k} value={k}>
                {CATEGORY_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="촬영일">
          <input
            className="field"
            type="date"
            value={form.takenAt ?? ''}
            onChange={(e) => set('takenAt', e.target.value || null)}
          />
        </Field>
        <Field label="정렬 순서" hint="작을수록 먼저">
          <input
            className="field"
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value))}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="설명 (한국어)">
          <input
            className="field"
            value={caption('KO')}
            onChange={(e) => setCaption('KO', e.target.value)}
          />
        </Field>
        <Field label="설명 (日本語)" hint="비워두면 '미작성'으로 표시됩니다.">
          <input
            className="field"
            value={caption('JA')}
            onChange={(e) => setCaption('JA', e.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-600"
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
          />
          <span className="text-sm font-semibold text-amber-100">
            모델에게 게시 동의를 받았습니다
          </span>
        </label>
        <p className="mt-2 text-[11px] leading-relaxed text-amber-200/70">
          체크하지 않으면 공개 갤러리에 나가지 않습니다. 동의 없이 공개하면 초상권 문제가 됩니다.
        </p>
        {form.consent && (
          <input
            className="field mt-3"
            placeholder="동의 근거 (예: 2026-08-01 카톡 동의)"
            value={form.consentNote}
            onChange={(e) => set('consentNote', e.target.value)}
          />
        )}
      </div>
    </AdminModal>
  )
}
