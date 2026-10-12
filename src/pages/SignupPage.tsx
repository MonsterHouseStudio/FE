import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useLocalePath } from '@/hooks/useLocale'
import { useMemberAuth } from '@/store/memberAuth'
import { formatKoreanPhone } from '@/lib/utils'
import { PageHeader, Section } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const { t } = useTranslation()
  const lp = useLocalePath()
  const navigate = useNavigate()
  const signup = useMemberAuth((s) => s.signup)

  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 8) {
      setError(t('member.passwordRule'))
      return
    }
    setPending(true)
    try {
      await signup({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        phone: form.phone.trim(),
      })
      navigate(lp('/mypage'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('member.signupFail'))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="SIGN UP" title={t('member.signup')} />
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
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              {t('member.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="field"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
            <p className="mt-1.5 text-[11px] text-ink-500">{t('member.passwordRule')}</p>
          </div>
          <div>
            <label className="label" htmlFor="name">
              {t('member.name')}
            </label>
            <input
              id="name"
              className="field"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              {t('member.phone')}
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={13}
              className="field"
              value={form.phone}
              onChange={(e) => set('phone', formatKoreanPhone(e.target.value))}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? '…' : t('member.signupCta')}
          </Button>

          <p className="text-center text-sm text-ink-400">
            {t('member.haveAccount')}{' '}
            <Link to={lp('/login')} className="font-bold text-brand-500 hover:underline">
              {t('member.loginCta')}
            </Link>
          </p>
        </form>
      </Section>
    </>
  )
}
