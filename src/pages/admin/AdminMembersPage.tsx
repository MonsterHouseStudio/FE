import { useState } from 'react'
import { useLocale } from '@/hooks/useLocale'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils'
import type { AdminMember, Booking } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from '@/components/admin/AsyncBoundary'

const STATUS_KO: Record<Booking['status'], string> = {
  REQUESTED: '접수',
  CONFIRMED: '확정',
  COMPLETED: '완료',
  CANCELED: '취소',
}

export default function AdminMembersPage() {
  const { data, loading, error, reload } = useAsync(() => adminApi.getMembers(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<AdminMember | null>(null)

  const members = data ?? []

  const remove = async (m: AdminMember) => {
    if (!window.confirm(`"${m.email}" 회원을 삭제할까요?\n(예약 내역은 이메일로 남아 있어 삭제되지 않습니다.)`))
      return
    setBusyId(m.id)
    setActionError(null)
    try {
      await adminApi.deleteMember(m.id)
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
        title="회원 관리"
        desc={data ? `전체 ${data.length}명` : '고객 회원(이메일·비밀번호) 목록'}
      />

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {actionError}
        </p>
      )}

      <AsyncBoundary
        loading={loading}
        error={error}
        empty={!loading && members.length === 0}
        emptyText="가입한 회원이 없습니다."
        onRetry={reload}
      >
        {members.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-ink-800 text-left text-[11px] uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-3 font-semibold">이메일</th>
                  <th className="px-4 py-3 font-semibold">이름</th>
                  <th className="px-4 py-3 font-semibold">연락처</th>
                  <th className="px-4 py-3 font-semibold">가입일</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3 text-ink-100">{m.email}</td>
                    <td className="px-4 py-3 text-ink-200">{m.name}</td>
                    <td className="px-4 py-3 text-ink-300">{m.phone}</td>
                    <td className="px-4 py-3 text-ink-400">{formatDate(m.createdAt, 'ko')}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setViewing(m)}>
                          예약 보기
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === m.id}
                          onClick={() => void remove(m)}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsyncBoundary>

      {viewing && <BookingsModal member={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}

function BookingsModal({ member, onClose }: { member: AdminMember; onClose: () => void }) {
  const locale = useLocale()
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getMemberBookings(member.id),
    [member.id],
  )
  const bookings = data ?? []

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="surface my-8 w-full max-w-2xl p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl tracking-tightest text-ink-50">{member.name} 님의 예약</h2>
            <p className="mt-1 text-sm text-ink-400">{member.email}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>

        <div className="mt-6">
          <AsyncBoundary
            loading={loading}
            error={error}
            empty={!loading && bookings.length === 0}
            emptyText="이 회원의 예약 내역이 없습니다."
            onRetry={reload}
          >
            {bookings.length > 0 && (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.bookingCode} className="rounded-lg border border-ink-800 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={
                            b.status === 'CANCELED' || b.status === 'COMPLETED' ? 'neutral' : 'brand'
                          }
                        >
                          {STATUS_KO[b.status]}
                        </Badge>
                        <span className="text-xs text-ink-500">{b.bookingCode}</span>
                      </div>
                      <span className="font-display text-base tracking-tightest text-ink-50">
                        {formatPrice(b.totalPrice, locale)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-ink-100">{b.productName}</div>
                    <div className="mt-0.5 text-xs text-ink-400">{formatDateTime(b.startAt, locale)}</div>
                  </div>
                ))}
              </div>
            )}
          </AsyncBoundary>
        </div>
      </div>
    </div>
  )
}
