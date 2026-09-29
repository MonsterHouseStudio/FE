import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import type { AdminHomeStat, HomeStatSavePayload } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from '@/components/admin/AsyncBoundary'
import { AdminModal, BilingualField, Field } from '@/components/admin/AdminModal'
import { ImageUploader } from '@/components/admin/ImageUploader'

function emptyStat(sortOrder: number): HomeStatSavePayload {
  return {
    valueNumber: null,
    suffix: '+',
    valueText: '',
    labelKo: '',
    labelJa: '',
    descKo: '',
    descJa: '',
    photoKey: '',
    active: true,
    sortOrder,
  }
}

function toPayload(s: AdminHomeStat): HomeStatSavePayload {
  return {
    valueNumber: s.valueNumber,
    suffix: s.suffix ?? '',
    valueText: s.valueText ?? '',
    labelKo: s.labelKo ?? '',
    labelJa: s.labelJa ?? '',
    descKo: s.descKo ?? '',
    descJa: s.descJa ?? '',
    photoKey: s.photoKey ?? '',
    active: s.active,
    sortOrder: s.sortOrder,
  }
}

export default function AdminHomeStatsPage() {
  const { data, loading, error, reload } = useAsync(() => adminApi.getHomeStats(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    id: number | null
    form: HomeStatSavePayload
    previewUrl: string | null
  } | null>(null)

  const stats = data ?? []

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
    <>
      <AdminPageHeader
        title="홈 통계"
        desc="홈 '숫자로 보는' 풀스크린 패널. 숫자를 넣으면 스크롤 시 카운트업, 비우고 텍스트를 넣으면 그대로 표시됩니다."
        action={
          <Button size="sm" onClick={() => setEditing({ id: null, form: emptyStat(stats.length), previewUrl: null })}>
            + 추가
          </Button>
        }
      />

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {actionError}
        </p>
      )}

      <AsyncBoundary
        loading={loading}
        error={error}
        empty={!loading && stats.length === 0}
        emptyText="등록된 통계가 없습니다."
        onRetry={reload}
      >
        {stats.length > 0 && (
          <div className="space-y-3">
            {stats.map((s) => (
              <div
                key={s.id}
                className={'surface flex flex-wrap items-center gap-5 p-5 ' + (s.active ? '' : 'opacity-55')}
              >
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-ink-800 bg-ink-900">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-ink-600">사진 없음</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-2xl tracking-tightest text-white">
                      {s.valueNumber != null ? `${s.valueNumber}${s.suffix ?? ''}` : s.valueText}
                    </span>
                    <span className="text-sm text-ink-300">{s.labelKo}</span>
                    {!s.active && <Badge tone="warning">비활성</Badge>}
                  </div>
                  {s.descKo && <p className="mt-1 line-clamp-1 text-xs text-ink-500">{s.descKo}</p>}
                  <p className="mt-1 text-[11px] text-ink-600">JA: {s.labelJa || '—'} · 순서 {s.sortOrder}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing({ id: s.id, form: toPayload(s), previewUrl: s.photoUrl })}
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === s.id}
                    onClick={() => void run(s.id, () => adminApi.setHomeStatActive(s.id, !s.active))}
                  >
                    {s.active ? '비활성화' : '활성화'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === s.id}
                    onClick={() => {
                      if (!window.confirm('이 통계를 삭제할까요?')) return
                      void run(s.id, () => adminApi.deleteHomeStat(s.id))
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
        <StatForm
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

function StatForm({
  state,
  onChange,
  onClose,
  onSaved,
}: {
  state: { id: number | null; form: HomeStatSavePayload; previewUrl: string | null }
  onChange: (next: Partial<{ form: HomeStatSavePayload; previewUrl: string | null }>) => void
  onClose: () => void
  onSaved: () => void
}) {
  const { id, form, previewUrl } = state
  const set = <K extends keyof HomeStatSavePayload>(k: K, v: HomeStatSavePayload[K]) =>
    onChange({ form: { ...form, [k]: v } })

  const submit = async () => {
    const hasNumber = form.valueNumber != null && !Number.isNaN(form.valueNumber)
    const hasText = form.valueText.trim().length > 0
    if (!hasNumber && !hasText) {
      throw new Error('숫자(카운트업) 또는 텍스트 값 중 하나는 입력해주세요.')
    }
    if (!form.labelKo.trim()) throw new Error('라벨(한국어)을 입력해주세요.')

    const payload: HomeStatSavePayload = { ...form, valueNumber: hasNumber ? form.valueNumber : null }
    if (id === null) await adminApi.createHomeStat(payload)
    else await adminApi.updateHomeStat(id, payload)
    onSaved()
  }

  return (
    <AdminModal title={id === null ? '통계 추가' : '통계 수정'} onClose={onClose} onSubmit={submit} wide>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="숫자 (카운트업)" hint="비우면 아래 텍스트를 그대로 표시">
          <input
            className="field"
            type="number"
            min={0}
            value={form.valueNumber ?? ''}
            placeholder="480"
            onChange={(e) => set('valueNumber', e.target.value === '' ? null : Number(e.target.value))}
          />
        </Field>
        <Field label="기호 (suffix)" hint="예: +">
          <input className="field" value={form.suffix} placeholder="+" onChange={(e) => set('suffix', e.target.value)} />
        </Field>
        <Field label="텍스트 값" hint="숫자 대신 표시 (예: KR · JP)">
          <input className="field" value={form.valueText} placeholder="KR · JP" onChange={(e) => set('valueText', e.target.value)} />
        </Field>
      </div>

      <BilingualField
        label="라벨"
        ko={form.labelKo}
        ja={form.labelJa}
        onKo={(v) => set('labelKo', v)}
        onJa={(v) => set('labelJa', v)}
        placeholder="예: 누적 촬영"
      />

      <BilingualField
        label="설명문 (큰 문구 밑 작은 글)"
        textarea
        ko={form.descKo}
        ja={form.descJa}
        onKo={(v) => set('descKo', v)}
        onJa={(v) => set('descJa', v)}
      />

      <ImageUploader
        directory="home-stat"
        label="배경 사진 (없으면 브랜드 그라디언트)"
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
            <span className="text-sm text-ink-200">홈에 노출</span>
          </label>
        </Field>
      </div>
    </AdminModal>
  )
}
