import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'
import { formatProductPrice } from '@/lib/price'
import type { InquiryType } from '@/types'
import { Button, ButtonAnchor } from '@/components/ui/Button'
import { PageHeader, Section } from '@/components/ui/primitives'

const LINE_URL = import.meta.env.VITE_LINE_ADD_FRIEND_URL ?? 'https://line.me'

interface FormState {
  type: InquiryType
  name: string
  contact: string
  email: string
  content: string
  privacyAgreed: boolean
  website: string
}

const EMPTY: FormState = {
  type: 'INTERPRETER',
  name: '',
  contact: '',
  email: '',
  content: '',
  privacyAgreed: false,
  website: '',
}

export default function InterpreterPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const lp = useLocalePath()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [done, setDone] = useState(false)

  // 통역 요금은 관리자가 상품으로 관리합니다(type = INTERPRETER, bookable = false).
  // 화면에 하드코딩하면 가격이 바뀔 때마다 배포해야 합니다.
  const { data: products } = useQuery({
    queryKey: ['products', locale],
    queryFn: () => api.getProducts(locale),
  })
  const interpreterPlans = (products ?? []).filter((p) => p.type === 'INTERPRETER')

  const mutation = useMutation({
    mutationFn: () =>
      api.createInquiry(
        {
          type: form.type,
          name: form.name.trim(),
          contact: form.contact.trim(),
          email: form.email.trim(),
          content: form.content.trim(),
          privacyAgreed: form.privacyAgreed,
          website: form.website,
        },
        locale,
      ),
    onSuccess: () => setDone(true),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = t('booking.errorName')
    if (!form.contact.trim()) next.contact = t('booking.errorPhone')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = t('booking.errorEmail')
    if (!form.content.trim()) next.content = t('common.required')
    if (!form.privacyAgreed) next.privacyAgreed = t('booking.errorPrivacy')
    setErrors(next)
    if (Object.keys(next).length > 0) return
    mutation.mutate()
  }

  return (
    <>
      <PageHeader
        eyebrow={t('interpreter.subtitle')}
        title={t('interpreter.title')}
        desc={t('interpreter.desc')}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* ===== 신청 폼 ===== */}
          <div className="min-w-0">
            {done ? (
              <div className="surface border-brand-700/50 bg-brand-950/20 p-9 text-center sm:p-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-3xl text-white">
                  ✓
                </div>
                <h2 className="heading-md mt-7 text-white">{t('interpreter.doneTitle')}</h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-300">
                  {t('interpreter.doneDesc')}
                </p>
                <div className="mt-8">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForm(EMPTY)
                      setDone(false)
                    }}
                  >
                    {t('interpreter.again')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="heading-md text-white">{t('interpreter.formTitle')}</h2>

                <form onSubmit={submit} className="surface mt-6 space-y-6 p-6 sm:p-8" noValidate>
                  {/* 문의 유형 */}
                  <div>
                    <span className="label">{t('interpreter.type')}</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          { key: 'INTERPRETER', label: t('interpreter.typeInterpreter') },
                          { key: 'VIDEO', label: t('interpreter.typeVideo') },
                        ] as { key: InquiryType; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setForm({ ...form, type: opt.key })}
                          className={cn(
                            'rounded-lg border px-5 py-4 text-sm font-semibold transition-colors',
                            form.type === opt.key
                              ? 'border-brand-500 bg-brand-600/15 text-white'
                              : 'border-ink-700 text-ink-300 hover:border-ink-500',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="i-name">
                        {t('interpreter.name')} <span className="text-brand-500">*</span>
                      </label>
                      <input
                        id="i-name"
                        className="field"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                      {errors.name && <p className="mt-2 text-xs text-red-400">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="i-contact">
                        {t('interpreter.contact')} <span className="text-brand-500">*</span>
                      </label>
                      <input
                        id="i-contact"
                        className="field"
                        value={form.contact}
                        onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      />
                      {errors.contact && (
                        <p className="mt-2 text-xs text-red-400">{errors.contact}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="i-email">
                      {t('interpreter.email')} <span className="text-brand-500">*</span>
                    </label>
                    <input
                      id="i-email"
                      type="email"
                      className="field"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="i-content">
                      {t('interpreter.content')} <span className="text-brand-500">*</span>
                    </label>
                    <textarea
                      id="i-content"
                      rows={6}
                      className="field resize-none"
                      placeholder={t('interpreter.contentPlaceholder')}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                    />
                    {errors.content && <p className="mt-2 text-xs text-red-400">{errors.content}</p>}
                  </div>

                  {/* honeypot */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />

                  <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                        checked={form.privacyAgreed}
                        onChange={(e) => setForm({ ...form, privacyAgreed: e.target.checked })}
                      />
                      <span className="text-sm text-ink-200">
                        {t('interpreter.privacy')} <span className="text-brand-500">*</span>
                      </span>
                    </label>
                    <p className="mt-3 pl-7 text-xs text-ink-500">
                      <Link
                        to={lp('/privacy')}
                        className="text-brand-400 underline underline-offset-2"
                      >
                        {t('booking.privacyLink')}
                      </Link>
                    </p>
                    {errors.privacyAgreed && (
                      <p className="mt-2 pl-7 text-xs text-red-400">{errors.privacyAgreed}</p>
                    )}
                  </div>

                  <div className="border-t border-ink-800 pt-6">
                    <Button type="submit" size="lg" disabled={mutation.isPending}>
                      {mutation.isPending ? t('interpreter.submitting') : t('interpreter.submit')}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* ===== 요금표 + LINE 안내 ===== */}
          <aside className="space-y-4">
            {interpreterPlans.length > 0 && (
              <div className="surface p-7">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">
                  {t('interpreter.priceTitle')}
                </h3>
                <ul className="mt-5 space-y-5">
                  {interpreterPlans.map((plan) => (
                    <li key={plan.id} className="border-b border-ink-800 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-bold text-white">{plan.name}</span>
                        <span className="shrink-0 font-display text-base tracking-tightest text-brand-300">
                          {formatProductPrice(plan, locale, t)}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="mt-2 text-xs leading-relaxed text-ink-400">
                          {plan.description}
                        </p>
                      )}
                      {plan.includes.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {plan.includes.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-xs text-ink-400">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-600" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-ink-800 pt-4 text-[11px] leading-relaxed text-ink-600">
                  {t('shooting.venueNotice')}
                </p>
              </div>
            )}

            <div className="surface border-[#06C755]/30 bg-[#06C755]/5 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#06C755] font-display text-sm text-white">
                LINE
              </div>
              <h3 className="mt-5 font-display text-lg tracking-tightest text-white">
                {t('interpreter.lineTitle')}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-300">
                {t('interpreter.lineDesc')}
              </p>
              <div className="mt-6">
                <ButtonAnchor
                  href={LINE_URL}
                  className="w-full border-[#06C755] bg-[#06C755] hover:bg-[#05b34c]"
                >
                  {t('interpreter.lineCta')}
                </ButtonAnchor>
              </div>
            </div>

            <div className="surface p-7">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">
                {t('footer.contact')}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-ink-300">
                <li>
                  <span className="block text-[11px] uppercase tracking-wider text-ink-600">
                    {t('footer.email')}
                  </span>
                  contact@monsterhouse.example
                </li>
                <li>
                  <span className="block text-[11px] uppercase tracking-wider text-ink-600">
                    {t('about.hours')}
                  </span>
                  {t('about.hoursValue')}
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  )
}
