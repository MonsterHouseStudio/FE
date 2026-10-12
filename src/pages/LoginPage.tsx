import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useLocalePath } from '@/hooks/useLocale'
import { useMemberAuth } from '@/store/memberAuth'
import { PageHeader, Section } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const { t } = useTranslation()
  const lp = useLocalePath()
  const navigate = useNavigate()
  const login = useMemberAuth((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email.trim(), password)
      navigate(lp('/mypage'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('member.loginFail'))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="LOGIN" title={t('member.login')} />
      <Section>
        <form onSubmit={submit} className="mx-auto max-w-md space-y-5">
          <div>
            <label className="label" htmlFor="email">
              {t('member.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              {t('member.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? '…' : t('member.loginCta')}
          </Button>

          <p className="text-center text-sm text-ink-400">
            {t('member.noAccount')}{' '}
            <Link to={lp('/signup')} className="font-bold text-brand-500 hover:underline">
              {t('member.signupCta')}
            </Link>
          </p>
        </form>
      </Section>
    </>
  )
}
