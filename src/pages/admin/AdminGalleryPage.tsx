import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { AdminGalleryItem } from '@/types'
import { Badge, Photo } from '@/components/ui/primitives'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'

const CATEGORY_LABEL: Record<AdminGalleryItem['category'], string> = {
  PHOTO: '사진',
  VIDEO: '영상',
  INTERPRETER: '통역',
}

export default function AdminGalleryPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getGallery(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const items = data ?? []
  const awaiting = items.filter((i) => !i.consent).length

  const toggleConsent = async (item: AdminGalleryItem) => {
    // 동의를 새로 받는 경우에만 근거를 남깁니다 (기획서 §9 — 언제·어떻게 받았는지).
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
        emptyText="등록된 사진이 없습니다."
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
                          {item.missingLocales.map((l) => l.toUpperCase()).join('/')} 미작성
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
              )
            })}
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}
