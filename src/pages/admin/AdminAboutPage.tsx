import { useEffect, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import type {
  AboutIntroSavePayload,
  AboutVideoSavePayload,
  AdminAboutVideo,
  AdminCrew,
  CrewSavePayload,
} from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from '@/components/admin/AsyncBoundary'
import { AdminModal, BilingualField, Field } from '@/components/admin/AdminModal'
import { ImageUploader } from '@/components/admin/ImageUploader'

/** 소개 페이지 관리 — 인트로(싱글턴) + 크루 + 최신 영상. */
export default function AdminAboutPage() {
  return (
    <>
      <AdminPageHeader
        title="소개 관리"
        desc="소개 페이지의 메인 배너·크루·최신 영상을 등록/수정/삭제합니다."
      />
      <IntroSection />
      <div className="mt-12">
        <CrewSection />
      </div>
      <div className="mt-12">
        <VideoSection />
      </div>
    </>
  )
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-ink-800 pb-2">
      <h2 className="font-display text-lg tracking-tight text-white">{children}</h2>
      {action}
    </div>
  )
}

// =====================================================================
// 1) 인트로 (메인 배너) — 싱글턴
// =====================================================================

function IntroSection() {
  const { data, loading, error, reload } = useAsync(() => adminApi.getAboutIntro(), [])
  const [form, setForm] = useState<AboutIntroSavePayload | null>(null)
  const [preview, setPreview] = useState<{ p1: string | null; p2: string | null; p3: string | null }>({
    p1: null,
    p2: null,
    p3: null,
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setForm({
      titleKo: data.titleKo ?? '',
      titleJa: data.titleJa ?? '',
      descKo: data.descKo ?? '',
      descJa: data.descJa ?? '',
      photo1Key: data.photo1Key ?? '',
      photo2Key: data.photo2Key ?? '',
      photo3Key: data.photo3Key ?? '',
    })
    setPreview({ p1: data.photo1Url, p2: data.photo2Url, p3: data.photo3Url })
  }, [data])

  const set = <K extends keyof AboutIntroSavePayload>(k: K, v: AboutIntroSavePayload[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f))

  const save = async () => {
    if (!form) return
    setSaving(true)
    setMsg(null)
    try {
      await adminApi.saveAboutIntro(form)
      setMsg('저장되었습니다.')
      reload()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <SectionTitle>메인 배너 (인트로)</SectionTitle>
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {form && (
          <div className="surface space-y-5 p-6">
            <BilingualField
              label="제목"
              ko={form.titleKo}
              ja={form.titleJa}
              onKo={(v) => set('titleKo', v)}
              onJa={(v) => set('titleJa', v)}
              placeholder="예: 우리는 무대 뒤를 찍습니다"
            />
            <BilingualField
              label="설명"
              textarea
              ko={form.descKo}
              ja={form.descJa}
              onKo={(v) => set('descKo', v)}
              onJa={(v) => set('descJa', v)}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <ImageUploader
                directory="about-intro"
                label="사진 1 (세로)"
                value={preview.p1}
                onUploaded={(img) => {
                  set('photo1Key', img.mediumKey)
                  setPreview((p) => ({ ...p, p1: img.thumbUrl }))
                }}
              />
              <ImageUploader
                directory="about-intro"
                label="사진 2"
                value={preview.p2}
                onUploaded={(img) => {
                  set('photo2Key', img.mediumKey)
                  setPreview((p) => ({ ...p, p2: img.thumbUrl }))
                }}
              />
              <ImageUploader
                directory="about-intro"
                label="사진 3"
                value={preview.p3}
                onUploaded={(img) => {
                  set('photo3Key', img.mediumKey)
                  setPreview((p) => ({ ...p, p3: img.thumbUrl }))
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                {saving ? '저장 중…' : '인트로 저장'}
              </Button>
              {msg && <span className="text-xs text-ink-400">{msg}</span>}
            </div>
          </div>
        )}
      </AsyncBoundary>
    </section>
  )
}

// =====================================================================
// 2) 크루
// =====================================================================

function emptyCrew(sortOrder: number): CrewSavePayload {
  return {
    nameKo: '',
    nameJa: '',
    roleKo: '',
    roleJa: '',
    bioKo: '',
    bioJa: '',
    photoKey: '',
    active: true,
    sortOrder,
  }
}

function crewToPayload(c: AdminCrew): CrewSavePayload {
  return {
    nameKo: c.nameKo ?? '',
    nameJa: c.nameJa ?? '',
    roleKo: c.roleKo ?? '',
    roleJa: c.roleJa ?? '',
    bioKo: c.bioKo ?? '',
    bioJa: c.bioJa ?? '',
    photoKey: c.photoKey ?? '',
    active: c.active,
    sortOrder: c.sortOrder,
  }
}

function CrewSection() {
  const { data, loading, error, reload } = useAsync(() => adminApi.getCrew(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    id: number | null
    form: CrewSavePayload
    previewUrl: string | null
  } | null>(null)

  const crew = data ?? []

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

  return (
    <section>
      <SectionTitle
        action={
          <Button size="sm" onClick={() => setEditing({ id: null, form: emptyCrew(crew.length), previewUrl: null })}>
            + 크루 추가
          </Button>
        }
      >
        크루
      </SectionTitle>

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {actionError}
        </p>
      )}

      <AsyncBoundary
        loading={loading}
        error={error}
        empty={!loading && crew.length === 0}
        emptyText="등록된 크루가 없습니다."
        onRetry={reload}
      >
        {crew.length > 0 && (
          <div className="space-y-3">
            {crew.map((c) => (
              <div
                key={c.id}
                className={'surface flex flex-wrap items-center gap-5 p-5 ' + (c.active ? '' : 'opacity-55')}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-ink-800 bg-ink-900">
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-ink-600">없음</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base tracking-tight text-white">{c.nameKo}</span>
                    <span className="text-xs uppercase tracking-[0.15em] text-brand-400">{c.roleKo}</span>
                    {!c.active && <Badge tone="warning">비활성</Badge>}
                  </div>
                  {c.bioKo && <p className="mt-1 line-clamp-1 text-xs text-ink-500">{c.bioKo}</p>}
                  <p className="mt-1 text-[11px] text-ink-600">JA: {c.nameJa || '—'} · 순서 {c.sortOrder}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing({ id: c.id, form: crewToPayload(c), previewUrl: c.photoUrl })}>
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === c.id}
                    onClick={() => void run(c.id, () => adminApi.setCrewActive(c.id, !c.active))}
                  >
                    {c.active ? '비활성화' : '활성화'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === c.id}
                    onClick={() => {
                      if (!window.confirm('이 크루를 삭제할까요?')) return
                      void run(c.id, () => adminApi.deleteCrew(c.id))
                    }}
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
        <CrewForm
          state={editing}
          onChange={(next) => setEditing({ ...editing, ...next })}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </section>
  )
}

function CrewForm({
  state,
  onChange,
  onClose,
  onSaved,
}: {
  state: { id: number | null; form: CrewSavePayload; previewUrl: string | null }
  onChange: (next: Partial<{ form: CrewSavePayload; previewUrl: string | null }>) => void
  onClose: () => void
  onSaved: () => void
}) {
  const { id, form, previewUrl } = state
  const set = <K extends keyof CrewSavePayload>(k: K, v: CrewSavePayload[K]) =>
    onChange({ form: { ...form, [k]: v } })

  const submit = async () => {
    if (!form.nameKo.trim()) throw new Error('이름(한국어)을 입력해주세요.')
    if (id === null) await adminApi.createCrew(form)
    else await adminApi.updateCrew(id, form)
    onSaved()
  }

  return (
    <AdminModal title={id === null ? '크루 추가' : '크루 수정'} onClose={onClose} onSubmit={submit} wide>
      <BilingualField
        label="이름"
        ko={form.nameKo}
        ja={form.nameJa}
        onKo={(v) => set('nameKo', v)}
        onJa={(v) => set('nameJa', v)}
        placeholder="예: 정재윤"
      />
      <BilingualField
        label="역할"
        ko={form.roleKo}
        ja={form.roleJa}
        onKo={(v) => set('roleKo', v)}
        onJa={(v) => set('roleJa', v)}
        placeholder="예: 디렉터 · 촬영"
      />
      <BilingualField
        label="소개"
        textarea
        ko={form.bioKo}
        ja={form.bioJa}
        onKo={(v) => set('bioKo', v)}
        onJa={(v) => set('bioJa', v)}
      />
      <ImageUploader
        directory="crew"
        label="프로필 사진"
        value={previewUrl}
        onUploaded={(img) => onChange({ form: { ...form, photoKey: img.mediumKey }, previewUrl: img.thumbUrl })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="정렬 순서" hint="작을수록 먼저">
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
            <span className="text-sm text-ink-200">소개 페이지에 노출</span>
          </label>
        </Field>
      </div>
    </AdminModal>
  )
}

// =====================================================================
// 3) 최신 영상 (유튜브)
// =====================================================================

function emptyVideo(sortOrder: number): AboutVideoSavePayload {
  return {
    youtubeUrl: '',
    titleKo: '',
    titleJa: '',
    thumbnailKey: '',
    active: true,
    sortOrder,
  }
}

function videoToPayload(v: AdminAboutVideo): AboutVideoSavePayload {
  return {
    youtubeUrl: v.youtubeUrl,
    titleKo: v.titleKo ?? '',
    titleJa: v.titleJa ?? '',
    thumbnailKey: v.thumbnailKey ?? '',
    active: v.active,
    sortOrder: v.sortOrder,
  }
}

function VideoSection() {
  const { data, loading, error, reload } = useAsync(() => adminApi.getAboutVideos(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    id: number | null
    form: AboutVideoSavePayload
    previewUrl: string | null
  } | null>(null)

  const videos = data ?? []

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

  return (
    <section>
      <SectionTitle
        action={
          <Button size="sm" onClick={() => setEditing({ id: null, form: emptyVideo(videos.length), previewUrl: null })}>
            + 영상 추가
          </Button>
        }
      >
        최신 영상 (유튜브)
      </SectionTitle>

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {actionError}
        </p>
      )}

      <AsyncBoundary
        loading={loading}
        error={error}
        empty={!loading && videos.length === 0}
        emptyText="등록된 영상이 없습니다."
        onRetry={reload}
      >
        {videos.length > 0 && (
          <div className="space-y-3">
            {videos.map((v) => (
              <div
                key={v.id}
                className={'surface flex flex-wrap items-center gap-5 p-5 ' + (v.active ? '' : 'opacity-55')}
              >
                <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-ink-800 bg-ink-900">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-ink-600">썸네일 없음</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{v.titleKo || '(제목 없음)'}</span>
                    {!v.active && <Badge tone="warning">비활성</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-1 text-[11px] text-ink-600">{v.youtubeUrl}</p>
                  <p className="mt-1 text-[11px] text-ink-600">JA: {v.titleJa || '—'} · 순서 {v.sortOrder}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing({ id: v.id, form: videoToPayload(v), previewUrl: v.thumbnailUrl })}>
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === v.id}
                    onClick={() => void run(v.id, () => adminApi.setAboutVideoActive(v.id, !v.active))}
                  >
                    {v.active ? '비활성화' : '활성화'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === v.id}
                    onClick={() => {
                      if (!window.confirm('이 영상을 삭제할까요?')) return
                      void run(v.id, () => adminApi.deleteAboutVideo(v.id))
                    }}
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
        <VideoForm
          state={editing}
          onChange={(next) => setEditing({ ...editing, ...next })}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </section>
  )
}

function VideoForm({
  state,
  onChange,
  onClose,
  onSaved,
}: {
  state: { id: number | null; form: AboutVideoSavePayload; previewUrl: string | null }
  onChange: (next: Partial<{ form: AboutVideoSavePayload; previewUrl: string | null }>) => void
  onClose: () => void
  onSaved: () => void
}) {
  const { id, form, previewUrl } = state
  const set = <K extends keyof AboutVideoSavePayload>(k: K, v: AboutVideoSavePayload[K]) =>
    onChange({ form: { ...form, [k]: v } })

  const submit = async () => {
    if (!form.youtubeUrl.trim()) throw new Error('유튜브 URL을 입력해주세요.')
    if (id === null) await adminApi.createAboutVideo(form)
    else await adminApi.updateAboutVideo(id, form)
    onSaved()
  }

  return (
    <AdminModal title={id === null ? '영상 추가' : '영상 수정'} onClose={onClose} onSubmit={submit} wide>
      <Field label="유튜브 URL" hint="영상 링크 (예: https://youtu.be/xxxx)">
        <input
          className="field"
          value={form.youtubeUrl}
          placeholder="https://www.youtube.com/watch?v=..."
          onChange={(e) => set('youtubeUrl', e.target.value)}
        />
      </Field>
      <BilingualField
        label="제목"
        ko={form.titleKo}
        ja={form.titleJa}
        onKo={(v) => set('titleKo', v)}
        onJa={(v) => set('titleJa', v)}
        placeholder="예: 대회 당일 아침"
      />
      <ImageUploader
        directory="about-video"
        label="썸네일 (없으면 링크만 노출)"
        value={previewUrl}
        onUploaded={(img) => onChange({ form: { ...form, thumbnailKey: img.mediumKey }, previewUrl: img.thumbUrl })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="정렬 순서" hint="작을수록 먼저">
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
            <span className="text-sm text-ink-200">소개 페이지에 노출</span>
          </label>
        </Field>
      </div>
    </AdminModal>
  )
}
