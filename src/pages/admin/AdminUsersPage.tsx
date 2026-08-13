import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { formatDate, formatTime } from '@/lib/utils'
import { useAdminAuth } from '@/store/adminAuth'
import type { AdminUser, AdminUserCreatePayload } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'
import { AdminModal, Field } from './AdminModal'

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  SUPER_ADMIN: '최고 관리자',
  MANAGER: '매니저',
}

export default function AdminUsersPage() {
  const { role, username } = useAdminAuth()
  const isSuper = role === 'SUPER_ADMIN'

  // MANAGER 는 목록 API 자체가 403 입니다. 호출조차 하지 않습니다.
  const { data, loading, error, reload } = useAsync(
    () => (isSuper ? adminApi.getAdminUsers() : Promise.resolve([])),
    [isSuper],
  )

  const [creating, setCreating] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const users = data ?? []

  const disable = async (user: AdminUser) => {
    if (
      !window.confirm(
        `"${user.displayName}" 계정을 비활성화할까요?\n로그인할 수 없게 되며, 진행 중인 세션도 끊깁니다.`,
      )
    )
      return

    setBusyId(user.id)
    setActionError(null)
    try {
      await adminApi.disableAdminUser(user.id)
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
        title="관리자 계정"
        desc={
          isSuper
            ? '계정 추가와 비활성화는 최고 관리자만 할 수 있습니다.'
            : '본인 비밀번호만 변경할 수 있습니다. 계정 관리는 최고 관리자에게 요청하세요.'
        }
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setChangingPassword(true)}>
              내 비밀번호 변경
            </Button>
            {isSuper && (
              <Button size="sm" onClick={() => setCreating(true)}>
                + 계정 추가
              </Button>
            )}
          </div>
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

      {!isSuper ? (
        <div className="surface px-6 py-14 text-center text-sm text-ink-500">
          계정 목록은 최고 관리자만 볼 수 있습니다.
        </div>
      ) : (
        <AsyncBoundary
          loading={loading}
          error={error}
          empty={!loading && users.length === 0}
          emptyText="등록된 계정이 없습니다."
          onRetry={reload}
        >
          {users.length > 0 && (
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-ink-800 text-[11px] uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">아이디</th>
                    <th className="px-5 py-4 font-semibold">이름</th>
                    <th className="px-5 py-4 font-semibold">권한</th>
                    <th className="px-5 py-4 font-semibold">마지막 로그인</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {users.map((user) => {
                    const isMe = user.username === username
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-ink-800/40">
                        <td className="px-5 py-4 font-mono text-xs text-ink-300">
                          {user.username}
                          {isMe && <span className="ml-2 text-[10px] text-brand-400">(나)</span>}
                        </td>
                        <td className="px-5 py-4 font-semibold text-white">{user.displayName}</td>
                        <td className="px-5 py-4">
                          <Badge tone={user.role === 'SUPER_ADMIN' ? 'brand' : 'neutral'}>
                            {ROLE_LABEL[user.role]}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-ink-400">
                          {user.lastLoginAt ? (
                            <>
                              {formatDate(user.lastLoginAt, 'ko')}{' '}
                              <span className="text-ink-600">
                                {formatTime(user.lastLoginAt)}
                              </span>
                            </>
                          ) : (
                            <span className="text-ink-600">기록 없음</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {/* 서버도 막지만(CANNOT_DISABLE_SELF) 눌러볼 이유가 없으니 감춥니다. */}
                          {!isMe && (
                            <button
                              type="button"
                              disabled={busyId === user.id}
                              onClick={() => void disable(user)}
                              className="text-xs text-ink-500 hover:text-red-400"
                            >
                              비활성화
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AsyncBoundary>
      )}

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            reload()
          }}
        />
      )}

      {changingPassword && <PasswordModal onClose={() => setChangingPassword(false)} />}
    </>
  )
}

// =====================================================================

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState<AdminUserCreatePayload>({
    username: '',
    password: '',
    displayName: '',
    role: 'MANAGER',
  })

  const set = <K extends keyof AdminUserCreatePayload>(k: K, v: AdminUserCreatePayload[K]) =>
    setForm({ ...form, [k]: v })

  return (
    <AdminModal
      title="관리자 계정 추가"
      submitLabel="계정 만들기"
      onClose={onClose}
      onSubmit={async () => {
        await adminApi.createAdminUser(form)
        onCreated()
      }}
    >
      <Field label="아이디" hint="영문 소문자·숫자와 . _ - 만 사용할 수 있습니다 (4~50자).">
        <input
          className="field font-mono text-xs"
          autoComplete="off"
          value={form.username}
          onChange={(e) => set('username', e.target.value)}
        />
      </Field>

      <Field label="이름" hint="화면에 표시되는 이름입니다.">
        <input
          className="field"
          value={form.displayName}
          onChange={(e) => set('displayName', e.target.value)}
        />
      </Field>

      <Field
        label="비밀번호"
        hint="10자 이상. 이 값은 다시 볼 수 없으니 만든 뒤 본인에게 전달하세요."
      >
        <input
          className="field"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
        />
      </Field>

      <Field
        label="권한"
        hint="최고 관리자는 계정 관리와 상품 삭제까지 할 수 있습니다. 평소 운영은 매니저로 충분합니다."
      >
        <select
          className="field"
          value={form.role}
          onChange={(e) => set('role', e.target.value as AdminUser['role'])}
        >
          <option value="MANAGER">매니저</option>
          <option value="SUPER_ADMIN">최고 관리자</option>
        </select>
      </Field>
    </AdminModal>
  )
}

// =====================================================================

function PasswordModal({ onClose }: { onClose: () => void }) {
  const { logout } = useAdminAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  return (
    <AdminModal
      title="비밀번호 변경"
      submitLabel="변경하기"
      onClose={onClose}
      onSubmit={async () => {
        // 서버는 확인란을 받지 않습니다. 오타로 잠기는 걸 막는 건 화면 몫입니다.
        if (newPassword !== confirm) {
          throw new Error('새 비밀번호가 서로 다릅니다.')
        }
        await adminApi.changeMyPassword({ currentPassword, newPassword })

        // 서버가 비밀번호 변경 시 모든 리프레시 토큰을 폐기합니다.
        // 그대로 두면 30분 뒤 재발급이 실패하며 알 수 없는 이유로 튕깁니다.
        // 지금 명시적으로 로그아웃시키는 편이 덜 혼란스럽습니다.
        window.alert('비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해주세요.')
        await logout()
      }}
    >
      <Field label="현재 비밀번호">
        <input
          className="field"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </Field>

      <Field label="새 비밀번호" hint="10자 이상. 현재 비밀번호와 달라야 합니다.">
        <input
          className="field"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Field>

      <Field label="새 비밀번호 확인">
        <input
          className="field"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>

      <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-[11px] leading-relaxed text-amber-200/80">
        변경하면 지금 로그인된 모든 기기에서 로그아웃됩니다. 새 비밀번호로 다시 로그인해주세요.
      </p>
    </AdminModal>
  )
}
