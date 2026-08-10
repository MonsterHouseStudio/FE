import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAdminAuth } from '@/store/adminAuth'
import { detectLocale } from '@/i18n'
import { Button } from '@/components/ui/Button'
import LogoMark from '@/components/layout/Logo'

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token, login } = useAdminAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (token) return <Navigate to="/admin" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || pending) return

    setError(null)
    setPending(true)
    try {
      await login(username.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      // 서버가 아이디/비밀번호를 구분해서 알려주지 않습니다 (계정 존재 여부 노출 방지).
      // 잠금 상태(A004)처럼 안내가 필요한 경우는 서버 메시지를 그대로 씁니다.
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-ink-950 to-black px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-12 w-12 text-brand-600" />
          <h1 className="font-display text-xl tracking-tightest text-white">
            MONSTER HOUSE {t('admin.title')}
          </h1>
        </div>

        <form onSubmit={submit} className="surface mt-9 space-y-5 p-7">
          <div>
            <label className="label" htmlFor="username">
              {t('admin.username')}
            </label>
            <input
              id="username"
              className="field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              {t('admin.password')}
            </label>
            <input
              id="password"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-300"
            >
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? '로그인 중…' : t('admin.loginCta')}
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-ink-600">
            {t('admin.loginHint')}
          </p>
        </form>

        <div className="mt-6 text-center">
          <Link to={`/${detectLocale()}`} className="text-xs text-ink-500 hover:text-brand-400">
            ← {t('admin.backToSite')}
          </Link>
        </div>
      </div>
    </div>
  )
}
