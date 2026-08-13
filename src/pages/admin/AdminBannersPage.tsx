import { useRef, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import type { AdminBanner, BannerMediaType, BannerSavePayload } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'
import { AdminModal, BilingualField, Field } from './AdminModal'
import { ImageUploader } from './ImageUploader'

function emptyBanner(sortOrder: number): BannerSavePayload {
  return {
    mediaType: 'IMAGE',
    mediaKey: '',
    posterKey: '',
    headlineKo: '',
    headlineJa: '',
    subtextKo: '',
    subtextJa: '',
    active: true,
    sortOrder,
  }
}

function toPayload(b: AdminBanner): BannerSavePayload {
  return {
    mediaType: b.mediaType,
    mediaKey: b.mediaKey,
    posterKey: b.posterKey ?? '',
    headlineKo: b.headlineKo ?? '',
    headlineJa: b.headlineJa ?? '',
    subtextKo: b.subtextKo ?? '',
    subtextJa: b.subtextJa ?? '',
    active: b.active,
    sortOrder: b.sortOrder,
  }
}

export default function AdminBannersPage() {
  const { data, loading, error, reload } = useAsync(() => adminApi.getBanners(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    id: number | null
    form: BannerSavePayload
    mediaUrl: string | null
    posterUrl: string | null
  } | null>(null)

  const banners = data ?? []

  const run = async (id: number, fn: () => Promise<unknown>) => {
    setBusyId(id)
    setActionError(null)
    try {
      await fn()
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '처리에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = (b: AdminBanner) => {
    if (!window.confirm('이 배너를 삭제할까요? 되돌릴 수 없습니다.')) return
    void run(b.id, () => adminApi.deleteBanner(b.id))
  }

  return (
    <>
      <AdminPageHeader
        title="홈 배너"
        desc="첫 화면 배경입니다. 등록된 배너가 없으면 기본 디자인이 표시됩니다."
        action={
          <Button
            size="sm"
            onClick={() =>
              setEditing({
                id: null,
                form: emptyBanner(banners.length),
                mediaUrl: null,
                posterUrl: null,
              })
            }
          >
            + 배너 추가
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
        empty={!loading && banners.length === 0}
        emptyText="등록된 배너가 없습니다. 오른쪽 위 버튼으로 첫 배너를 만들어보세요."
        onRetry={reload}
      >
        {banners.length > 0 && (
          <div className="space-y-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className={
                  'surface flex flex-wrap items-center gap-5 p-5 ' + (b.active ? '' : 'opacity-55')
                }
              >
                {/* 미리보기 — 영상은 소리 없이 반복 재생해 실제 화면과 같게 보여줍니다 */}
                <div className="h-24 w-40 shrink-0 overflow-hidden rounded-lg border border-ink-800 bg-ink-900">
                  {b.mediaType === 'VIDEO' ? (
                    <video
                      src={b.mediaUrl}
                      poster={b.posterUrl ?? undefined}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img src={b.mediaUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={b.mediaType === 'VIDEO' ? 'brand' : 'neutral'}>
                      {b.mediaType === 'VIDEO' ? '영상' : '이미지'}
                    </Badge>
                    {!b.active && <Badge tone="warning">비공개</Badge>}
                    {b.mediaType === 'VIDEO' && !b.posterKey && (
                      <Badge tone="danger">포스터 없음</Badge>
                    )}
                    {!b.headlineJa && b.headlineKo && <Badge tone="warning">일본어 미작성</Badge>}
                  </div>

                  <p className="mt-2 font-semibold text-white">
                    {b.headlineKo || <span className="text-ink-600">문구 없음 (기본값 사용)</span>}
                  </p>
                  {b.subtextKo && (
                    <p className="mt-1 line-clamp-1 text-xs text-ink-400">{b.subtextKo}</p>
                  )}
                  <p className="mt-1 font-mono text-[11px] text-ink-600">순서 {b.sortOrder}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditing({
                        id: b.id,
                        form: toPayload(b),
                        mediaUrl: b.mediaUrl,
                        posterUrl: b.posterUrl,
                      })
                    }
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === b.id}
                    onClick={() => void run(b.id, () => adminApi.setBannerActive(b.id, !b.active))}
                  >
                    {b.active ? '숨기기' : '공개'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === b.id}
                    onClick={() => remove(b)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncBoundary>

      {editing && (
        <BannerForm
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

function BannerForm({
  state,
  onChange,
  onClose,
  onSaved,
}: {
  state: {
    id: number | null
    form: BannerSavePayload
    mediaUrl: string | null
    posterUrl: string | null
  }
  onChange: (
    next: Partial<{ form: BannerSavePayload; mediaUrl: string | null; posterUrl: string | null }>,
  ) => void
  onClose: () => void
  onSaved: () => void
}) {
  const { id, form, mediaUrl, posterUrl } = state
  const set = <K extends keyof BannerSavePayload>(k: K, v: BannerSavePayload[K]) =>
    onChange({ form: { ...form, [k]: v } })

  const submit = async () => {
    if (!form.mediaKey) {
      throw new Error(
        form.mediaType === 'VIDEO'
          ? '배경 영상을 먼저 올려주세요.'
          : '배경 이미지를 먼저 올려주세요.',
      )
    }
    // 서버도 막지만(N004), 저장 버튼을 누른 뒤 실패하는 것보다 미리 알리는 편이 낫습니다.
    if (form.mediaType === 'VIDEO' && !form.posterKey) {
      throw new Error('영상 배너는 포스터 이미지가 필요합니다.')
    }

    if (id === null) await adminApi.createBanner(form)
    else await adminApi.updateBanner(id, form)
    onSaved()
  }

  return (
    <AdminModal
      title={id === null ? '배너 추가' : '배너 수정'}
      onClose={onClose}
      onSubmit={submit}
      wide
    >
      <Field label="배경 종류">
        <select
          className="field"
          value={form.mediaType}
          onChange={(e) => {
            const next = e.target.value as BannerMediaType
            // 종류를 바꾸면 기존 파일은 쓸 수 없습니다. 비워서 다시 올리게 합니다.
            onChange({
              form: { ...form, mediaType: next, mediaKey: '', posterKey: '' },
              mediaUrl: null,
              posterUrl: null,
            })
          }}
        >
          <option value="IMAGE">이미지</option>
          <option value="VIDEO">영상 (MP4)</option>
        </select>
      </Field>

      {form.mediaType === 'IMAGE' ? (
        <ImageUploader
          directory="banner"
          label="배경 이미지"
          value={mediaUrl}
          onUploaded={(img) =>
            onChange({
              form: { ...form, mediaKey: img.mediumKey },
              mediaUrl: img.mediumUrl,
            })
          }
        />
      ) : (
        <>
          <VideoUploader
            value={mediaUrl}
            posterUrl={posterUrl}
            onUploaded={(key, url) => onChange({ form: { ...form, mediaKey: key }, mediaUrl: url })}
          />

          <ImageUploader
            directory="banner"
            label="포스터 이미지 (필수)"
            value={posterUrl}
            onUploaded={(img) =>
              onChange({
                form: { ...form, posterKey: img.mediumKey },
                posterUrl: img.mediumUrl,
              })
            }
          />
          <p className="-mt-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-[11px] leading-relaxed text-amber-200/80">
            아이폰은 절전·데이터 절약 모드에서 배경 영상을 재생하지 않습니다. 그때 이 이미지가
            대신 보입니다. 없으면 첫 화면이 검게 나옵니다.
          </p>
        </>
      )}

      <BilingualField
        label="큰 문구"
        ko={form.headlineKo}
        ja={form.headlineJa}
        onKo={(v) => set('headlineKo', v)}
        onJa={(v) => set('headlineJa', v)}
        placeholder="비워두면 기본 문구가 표시됩니다"
      />

      <BilingualField
        label="작은 문구"
        textarea
        ko={form.subtextKo}
        ja={form.subtextJa}
        onKo={(v) => set('subtextKo', v)}
        onJa={(v) => set('subtextJa', v)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="정렬 순서" hint="작을수록 먼저. 지금은 첫 번째 배너만 표시됩니다.">
          <input
            className="field"
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value))}
          />
        </Field>
        <Field label="공개 여부">
          <label className="mt-1 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={form.active}
              onChange={(e) => set('active', e.target.checked)}
            />
            <span className="text-sm text-ink-200">첫 화면에 표시</span>
          </label>
        </Field>
      </div>
    </AdminModal>
  )
}

// =====================================================================

/**
 * MP4 업로더.
 *
 * ImageUploader 와 분리한 이유: 검증 규칙·안내 문구·미리보기가 전부 다릅니다.
 * 특히 "압축해서 올려달라"는 안내가 중요합니다 — 서버가 인코딩하지 않으므로
 * 원본 그대로 손님에게 전송됩니다.
 */
function VideoUploader({
  value,
  posterUrl,
  onUploaded,
}: {
  value: string | null
  posterUrl: string | null
  onUploaded: (key: string, url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [sizeMb, setSizeMb] = useState<number | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return

    if (file.type !== 'video/mp4') {
      setError('MP4 파일만 올릴 수 있습니다. (.mov 는 MP4 로 변환해주세요)')
      return
    }
    // 서버도 20MB 에서 막지만, 큰 파일을 다 올린 뒤 거절당하면 시간이 아깝습니다.
    if (file.size > 20 * 1024 * 1024) {
      setError(
        `영상이 ${(file.size / 1024 / 1024).toFixed(1)}MB 입니다. 20MB 이하로 압축해주세요.`,
      )
      return
    }

    setBusy(true)
    setError(null)
    setPreview(URL.createObjectURL(file))
    setSizeMb(file.size / 1024 / 1024)

    try {
      const uploaded = await adminApi.uploadVideo(file)
      onUploaded(uploaded.key, uploaded.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
      setPreview(null)
      setSizeMb(null)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const shown = preview ?? value

  return (
    <div>
      <label className="label">배경 영상 (MP4)</label>

      <div className="flex items-start gap-4">
        <div className="relative h-28 w-48 shrink-0 overflow-hidden rounded-lg border border-ink-700 bg-ink-900">
          {shown ? (
            <video
              src={shown}
              poster={posterUrl ?? undefined}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-ink-600">
              없음
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[11px] text-white">
              업로드 중…
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4"
            disabled={busy}
            onChange={(e) => void pick(e.target.files?.[0])}
            className="block w-full text-xs text-ink-400 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-brand-500"
          />

          <div className="mt-2 space-y-1 text-[11px] leading-relaxed text-ink-500">
            <p>
              <b className="text-ink-300">10초 안팎 · 20MB 이하</b>로 준비해주세요. 소리는 나가지
              않습니다.
            </p>
            <p>
              서버에서 화질을 줄이지 않고 <b className="text-ink-300">그대로 손님에게 전송</b>
              됩니다. 파일이 크면 첫 화면이 늦게 뜨고 모바일 데이터도 많이 씁니다.
            </p>
          </div>

          {sizeMb !== null && !error && (
            <p className="mt-1 text-[11px] text-emerald-400">{sizeMb.toFixed(1)}MB 업로드됨</p>
          )}
          {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  )
}
