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

  if (token) return <Navigate to="/admin" replace />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    login(username.trim())
    navigate('/admin', { replace: true })
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

          <Button type="submit" size="lg" className="w-full">
            {t('admin.loginCta')}
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
