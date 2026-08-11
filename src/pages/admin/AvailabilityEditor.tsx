import { useState } from 'react'
import { adminApi } from '@/lib/api'
import type { Availability, AvailabilityOverride, OverrideType, Weekday } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminModal, Field } from './AdminModal'

const DAY_ORDER: { key: Weekday; label: string }[] = [
  { key: 'MONDAY', label: '월' },
  { key: 'TUESDAY', label: '화' },
  { key: 'WEDNESDAY', label: '수' },
  { key: 'THURSDAY', label: '목' },
  { key: 'FRIDAY', label: '금' },
  { key: 'SATURDAY', label: '토' },
  { key: 'SUNDAY', label: '일' },
]

/**
 * 요일별 기본 영업시간 편집.
 *
 * ⚠ 서버는 요일 하나씩 받습니다(단건 upsert). 그래서 7번 호출합니다.
 *   바뀐 요일만 골라 보내면 호출이 줄지만, 전부 보내도 7건이라
 *   "저장했는데 일부만 반영"되는 혼란을 피하는 쪽을 택했습니다.
 */
export function WeeklyHoursModal({
  week,
  onClose,
  onSaved,
}: {
  week: Availability[]
  onClose: () => void
  onSaved: () => void
}) {
  const [rows, setRows] = useState(() =>
    DAY_ORDER.map(({ key }) => {
      const found = week.find((w) => w.dayOfWeek === key)
      return {
        dayOfWeek: key,
        openTime: found?.openTime ?? '10:00',
        closeTime: found?.closeTime ?? '20:00',
        active: found?.active ?? true,
      }
    }),
  )

  const set = (i: number, patch: Partial<(typeof rows)[number]>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const submit = async () => {
    for (const r of rows) {
      if (r.active && r.closeTime <= r.openTime) {
        throw new Error(
          `${DAY_ORDER.find((d) => d.key === r.dayOfWeek)?.label}요일: 마감이 오픈보다 빠릅니다.`,
        )
      }
    }
    // 순차로 보냅니다. 동시에 보내면 어느 요일에서 실패했는지 알기 어렵습니다.
    for (const r of rows) {
      await adminApi.saveAvailability(r)
    }
    onSaved()
  }

  return (
    <AdminModal title="요일별 영업시간" onClose={onClose} onSubmit={submit} wide>
      <p className="text-[11px] leading-relaxed text-ink-500">
        휴무로 바꾸면 그 요일에는 예약 슬롯이 아예 생성되지 않습니다. 이미 잡힌 예약은 그대로
        남으니 따로 확인해주세요.
      </p>

      <ul className="divide-y divide-ink-800 rounded-lg border border-ink-800">
        {rows.map((r, i) => (
          <li key={r.dayOfWeek} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="w-6 shrink-0 text-sm font-bold text-white">
              {DAY_ORDER[i].label}
            </span>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={r.active}
                onChange={(e) => set(i, { active: e.target.checked })}
              />
              <span className="text-xs text-ink-400">영업</span>
            </label>

            <div className="ml-auto flex items-center gap-2">
              <input
                type="time"
                step={1800}
                disabled={!r.active}
                className="field h-9 w-28 text-xs disabled:opacity-40"
                value={r.openTime}
                onChange={(e) => set(i, { openTime: e.target.value })}
              />
              <span className="text-ink-600">–</span>
              <input
                type="time"
                step={1800}
                disabled={!r.active}
                className="field h-9 w-28 text-xs disabled:opacity-40"
                value={r.closeTime}
                onChange={(e) => set(i, { closeTime: e.target.value })}
              />
            </div>
          </li>
        ))}
      </ul>
    </AdminModal>
  )
}

// =====================================================================

/**
 * 특정 날짜 예외 — 요일 기본값을 덮어씁니다.
 * 명절 휴무나 대회 당일 단축 영업처럼 "이번 한 번만" 다른 경우에 씁니다.
 */
export function OverrideModal({
  date,
  existing,
  onClose,
  onSaved,
}: {
  date: string
  existing: AvailabilityOverride | null
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<OverrideType>(existing?.type ?? 'HOLIDAY')
  const [openTime, setOpenTime] = useState(existing?.openTime ?? '10:00')
  const [closeTime, setCloseTime] = useState(existing?.closeTime ?? '20:00')
  const [memo, setMemo] = useState(existing?.memo ?? '')
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async () => {
    if (!existing || !window.confirm('이 예외를 삭제하고 요일 기본값으로 되돌릴까요?')) return
    setRemoving(true)
    setError(null)
    try {
      await adminApi.deleteOverride(existing.id)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.')
      setRemoving(false)
    }
  }

  const submit = async () => {
    if (type === 'SPECIAL' && closeTime <= openTime) {
      throw new Error('마감이 오픈보다 빠릅니다.')
    }
    await adminApi.saveOverride({
      date,
      type,
      // 휴무면 시간이 의미 없으므로 보내지 않습니다.
      openTime: type === 'SPECIAL' ? openTime : null,
      closeTime: type === 'SPECIAL' ? closeTime : null,
      memo,
    })
    onSaved()
  }

  return (
    <AdminModal title={`${date} 영업 예외`} onClose={onClose} onSubmit={submit}>
      <Field label="유형">
        <select
          className="field"
          value={type}
          onChange={(e) => setType(e.target.value as OverrideType)}
        >
          <option value="HOLIDAY">휴무 — 이 날은 예약을 받지 않습니다</option>
          <option value="SPECIAL">특별 영업 — 시간을 따로 지정합니다</option>
        </select>
      </Field>

      {type === 'SPECIAL' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="오픈">
            <input
              className="field"
              type="time"
              step={1800}
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
            />
          </Field>
          <Field label="마감">
            <input
              className="field"
              type="time"
              step={1800}
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
            />
          </Field>
        </div>
      )}

      <Field label="메모" hint="예: 설 연휴, 대회 서포트">
        <input className="field" value={memo} onChange={(e) => setMemo(e.target.value)} />
      </Field>

      {existing && (
        <div className="border-t border-ink-800 pt-4">
          <Button size="sm" variant="ghost" disabled={removing} onClick={() => void remove()}>
            예외 삭제 (요일 기본값으로 되돌리기)
          </Button>
          {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
        </div>
      )}
    </AdminModal>
  )
}

/** 달력 셀에 붙는 예외 표시 */
export function OverrideBadge({ override }: { override: AvailabilityOverride }) {
  return override.type === 'HOLIDAY' ? (
    <Badge tone="danger">휴무</Badge>
  ) : (
    <Badge tone="brand">
      {override.openTime}–{override.closeTime}
    </Badge>
  )
}
