import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, api } from '@/lib/api'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { cn, formatDate, formatPrice, formatTime } from '@/lib/utils'
import { calcTotal, formatProductPrice } from '@/lib/price'
import type { Booking, Product } from '@/types'
import Calendar from '@/components/booking/Calendar'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Badge, PageHeader, Photo, Spinner } from '@/components/ui/primitives'

type Step = 1 | 2 | 3 | 4

interface FormState {
  name: string
  phone: string
  email: string
  memo: string
  privacyAgreed: boolean
  website: string // honeypot
}

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  email: '',
  memo: '',
  privacyAgreed: false,
  website: '',
}

export default function BookingPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const lp = useLocalePath()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>(1)
  const [productId, setProductId] = useState<number | null>(null)
  const [dateKey, setDateKey] = useState<string | null>(null)
  const [startAt, setStartAt] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [result, setResult] = useState<Booking | null>(null)
  /** optionId → 수량. 0 이거나 없으면 미선택입니다. */
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({})

  const { data: products } = useQuery({
    queryKey: ['products', locale],
    queryFn: () => api.getProducts(locale),
  })

  // /shooting 에서 "이 상품 예약"으로 들어오면 1단계를 건너뜁니다.
  useEffect(() => {
    const fromQuery = Number(searchParams.get('product'))
    if (fromQuery && products?.some((p) => p.id === fromQuery)) {
      setProductId(fromQuery)
      setSelectedOptions({})
      setStep(2)
    }
  }, [searchParams, products])

  const product: Product | undefined = products?.find((p) => p.id === productId)

  const { data: dailySlots, isFetching: slotsLoading } = useQuery({
    queryKey: ['slots', productId, dateKey, locale],
    queryFn: () => api.getDailySlots(productId!, dateKey!, locale),
    enabled: !!productId && !!dateKey,
  })

  const createBooking = useMutation({
    mutationFn: () =>
      api.createBooking(
        {
          productId: productId!,
          startAt: startAt!,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          memo: form.memo.trim() || undefined,
          privacyAgreed: form.privacyAgreed,
          options: Object.entries(selectedOptions)
            .filter(([, qty]) => qty > 0)
            .map(([optionId, quantity]) => ({ optionId: Number(optionId), quantity })),
          website: form.website,
        },
        locale,
      ),
    onSuccess: (booking) => {
      setResult(booking)
      setStep(4)
    },
    onError: (error) => {
      // 백엔드가 동시성 방어로 막은 경우(B001) — 다른 사람이 먼저 잡은 슬롯입니다.
      // 화면에 남아 있는 슬롯 목록이 이미 낡았으므로 새로 받아오고 시간 선택으로 되돌립니다.
      if (error instanceof ApiError && error.code === 'B001') {
        void queryClient.invalidateQueries({ queryKey: ['slots', productId, dateKey, locale] })
        setStartAt(null)
        setStep(2)
      }
    },
  })

  const submitErrorMessage = (() => {
    const error = createBooking.error
    if (!error) return null
    if (error instanceof ApiError) {
      return error.code === 'B001' ? t('booking.errorSlotTaken') : error.message
    }
    return t('common.error')
  })()

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = t('booking.errorName')
    if (!form.phone.trim()) next.phone = t('booking.errorPhone')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = t('booking.errorEmail')
    if (!form.privacyAgreed) next.privacyAgreed = t('booking.errorPrivacy')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    createBooking.mutate()
  }

  const steps = [
    { n: 1 as Step, label: t('booking.stepProduct') },
    { n: 2 as Step, label: t('booking.stepDate') },
    { n: 3 as Step, label: t('booking.stepInfo') },
    { n: 4 as Step, label: t('booking.stepDone') },
  ]

  return (
    <>
      <PageHeader eyebrow={t('booking.subtitle')} title={t('booking.title')} />

      <div className="container-mh py-12 sm:py-16">
        {/* ===== 스텝 인디케이터 ===== */}
        <ol className="mb-12 flex flex-wrap items-center gap-x-3 gap-y-3">
          {steps.map((s, i) => (
            <li key={s.n} className="flex items-center gap-3">
              <button
                type="button"
                disabled={s.n >= step || step === 4}
                onClick={() => setStep(s.n)}
                className={cn(
                  'flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                  s.n === step && 'border-brand-600 bg-brand-600 text-white',
                  s.n < step && 'border-ink-700 text-ink-300 hover:border-brand-500',
                  s.n > step && 'border-ink-800 text-ink-600',
                )}
              >
                <span className="font-display">0{s.n}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && <span className="text-ink-700">—</span>}
            </li>
          ))}
        </ol>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          {/* ================= 좌측 : 단계별 본문 ================= */}
          <div className="min-w-0">
            {/* ---- STEP 1 : 상품 선택 ---- */}
            {step === 1 && (
              <section className="animate-fade-up">
                <h2 className="heading-md text-white">{t('booking.selectProduct')}</h2>
                <div className="mt-7 space-y-4">
                  {!products ? (
                    <div className="flex justify-center py-16">
                      <Spinner />
                    </div>
                  ) : (
                    products.filter((p) => p.bookable).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProductId(p.id)
                          // 이전 상품의 옵션이 남으면 서버가 INVALID_OPTION 으로 거부합니다.
                          setSelectedOptions({})
                          setStep(2)
                        }}
                        className={cn(
                          'surface surface-hover flex w-full items-center gap-5 overflow-hidden p-4 text-left sm:p-5',
                          productId === p.id && 'border-brand-600',
                        )}
                      >
                        <Photo seed={p.id * 4} className="h-20 w-20 shrink-0 rounded-lg sm:h-24 sm:w-24" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-lg tracking-tightest text-white">
                              {p.name}
                            </h3>
                            <Badge tone="brand">
                              {t('common.minutes', { count: p.durationMin })}
                            </Badge>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-sm text-ink-400">{p.description}</p>
                        </div>
                        <div className="hidden shrink-0 text-right sm:block">
                          <div className="font-display text-lg tracking-tightest text-white">
                            {formatPrice(p.price, locale)}
                          </div>
                          <div className="mt-1 text-xs text-brand-400">→</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* ---- STEP 2 : 날짜 + 시간 ---- */}
            {step === 2 && (
              <section className="animate-fade-up space-y-8">
                {/* 동시성 충돌로 3단계에서 되돌아온 경우 이유를 알려줍니다 */}
                {submitErrorMessage && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    {submitErrorMessage}
                  </p>
                )}
                <div>
                  <h2 className="heading-md text-white">{t('booking.selectDate')}</h2>
                  <div className="mt-6">
                    <Calendar
                      value={dateKey}
                      onChange={(key) => {
                        setDateKey(key)
                        setStartAt(null)
                      }}
                    />
                  </div>
                </div>

                {dateKey && (
                  <div>
                    <h2 className="heading-md text-white">{t('booking.selectTime')}</h2>
                    <p className="mt-2 text-sm text-ink-400">{formatDate(dateKey, locale)}</p>

                    <div className="surface mt-5 p-5 sm:p-7">
                      {slotsLoading ? (
                        <div className="flex justify-center py-10">
                          <Spinner />
                        </div>
                      ) : !dailySlots?.open ? (
                        <p className="py-10 text-center text-sm text-ink-400">
                          {t('booking.closedDay')}
                        </p>
                      ) : dailySlots.slots.length === 0 ? (
                        <p className="py-10 text-center text-sm text-ink-400">
                          {t('booking.noSlots')}
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
                          {dailySlots.slots.map((slot) => {
                            const selected = slot.startAt === startAt
                            return (
                              <button
                                key={slot.startAt}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setStartAt(slot.startAt)}
                                className={cn(
                                  'rounded-lg border py-3 text-sm font-bold transition-all',
                                  !slot.available &&
                                    'cursor-not-allowed border-ink-800 bg-ink-900/40 text-ink-700',
                                  slot.available &&
                                    !selected &&
                                    'border-ink-700 text-ink-100 hover:border-brand-500 hover:text-white',
                                  selected && 'border-brand-500 bg-brand-600 text-white',
                                )}
                              >
                                {formatTime(slot.startAt)}
                                {!slot.available && (
                                  <span className="mt-0.5 block text-[10px] font-normal">
                                    {t('booking.slotTaken')}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button size="lg" disabled={!startAt} onClick={() => setStep(3)}>
                        {t('common.next')}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ---- STEP 3 : 정보 입력 ---- */}
            {step === 3 && (
              <section className="animate-fade-up">
                {/* ---- 추가 옵션 ---- */}
                {(product?.options?.length ?? 0) > 0 && (
                  <div className="mb-8">
                    <h2 className="heading-md text-white">{t('booking.optionsTitle')}</h2>
                    <p className="mt-2 text-sm text-ink-400">{t('booking.optionsHint')}</p>

                    <div className="surface mt-5 divide-y divide-ink-800">
                      {product!.options!.map((option) => {
                        const qty = selectedOptions[option.id] ?? 0
                        return (
                          <div
                            key={option.id}
                            className="flex flex-wrap items-center justify-between gap-4 p-5"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white">{option.name}</div>
                              <div className="mt-1 text-xs text-ink-500">
                                + {formatPrice(option.price, locale)}
                                {option.maxQuantity > 1 && ` · ${t('shooting.optionEach')}`}
                              </div>
                            </div>

                            {option.maxQuantity === 1 ? (
                              <label className="flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-brand-600"
                                  checked={qty > 0}
                                  onChange={(e) =>
                                    setSelectedOptions((prev) => ({
                                      ...prev,
                                      [option.id]: e.target.checked ? 1 : 0,
                                    }))
                                  }
                                />
                                <span className="text-sm text-ink-300">{t('common.confirm')}</span>
                              </label>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  aria-label="-"
                                  disabled={qty <= 0}
                                  onClick={() =>
                                    setSelectedOptions((prev) => ({
                                      ...prev,
                                      [option.id]: Math.max(0, qty - 1),
                                    }))
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-200 disabled:opacity-30"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center font-display text-lg text-white">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  aria-label="+"
                                  disabled={qty >= option.maxQuantity}
                                  onClick={() =>
                                    setSelectedOptions((prev) => ({
                                      ...prev,
                                      [option.id]: Math.min(option.maxQuantity, qty + 1),
                                    }))
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-200 disabled:opacity-30"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <h2 className="heading-md text-white">{t('booking.formTitle')}</h2>

                <form onSubmit={submit} className="surface mt-6 space-y-6 p-6 sm:p-8" noValidate>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="name">
                        {t('booking.name')} <span className="text-brand-500">*</span>
                      </label>
                      <input
                        id="name"
                        className="field"
                        placeholder={t('booking.namePlaceholder')}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                      {errors.name && <p className="mt-2 text-xs text-red-400">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="label" htmlFor="phone">
                        {t('booking.phone')} <span className="text-brand-500">*</span>
                      </label>
                      <input
                        id="phone"
                        className="field"
                        placeholder={t('booking.phonePlaceholder')}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                      {errors.phone && <p className="mt-2 text-xs text-red-400">{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="email">
                      {t('booking.email')} <span className="text-brand-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="field"
                      placeholder={t('booking.emailPlaceholder')}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="memo">
                      {t('booking.memo')}{' '}
                      <span className="text-ink-500">({t('common.optional')})</span>
                    </label>
                    <textarea
                      id="memo"
                      rows={4}
                      className="field resize-none"
                      placeholder={t('booking.memoPlaceholder')}
                      value={form.memo}
                      onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    />
                  </div>

                  {/* honeypot — 사람에게는 보이지 않습니다 (스팸 방지, 기획서 §9) */}
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
                        {t('booking.privacy')} <span className="text-brand-500">*</span>
                      </span>
                    </label>
                    <p className="mt-3 pl-7 text-xs leading-relaxed text-ink-500">
                      {t('booking.privacyDetail')}{' '}
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

                  {submitErrorMessage && (
                    <p
                      role="alert"
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                    >
                      {submitErrorMessage}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-between gap-3 border-t border-ink-800 pt-6">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                      ← {t('common.prev')}
                    </Button>
                    <Button type="submit" size="lg" disabled={createBooking.isPending}>
                      {createBooking.isPending ? t('booking.submitting') : t('booking.submit')}
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {/* ---- STEP 4 : 완료 ---- */}
            {step === 4 && result && (
              <section className="animate-fade-up">
                <div className="surface border-brand-700/50 bg-brand-950/20 p-8 text-center sm:p-14">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-3xl text-white">
                    ✓
                  </div>
                  <h2 className="heading-md mt-7 text-white">{t('booking.doneTitle')}</h2>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-300">
                    {t('booking.doneDesc')}
                  </p>

                  <div className="mx-auto mt-9 max-w-sm rounded-xl border border-ink-700 bg-ink-950 p-6">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
                      {t('booking.bookingCode')}
                    </div>
                    <div className="mt-2 font-display text-2xl tracking-tightest text-brand-400">
                      {result.bookingCode}
                    </div>
                    <dl className="mt-6 space-y-2.5 border-t border-ink-800 pt-5 text-left text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-500">{t('admin.product')}</dt>
                        <dd className="text-ink-100">{result.productName}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-500">{t('admin.datetime')}</dt>
                        <dd className="text-right text-ink-100">
                          {formatDate(result.startAt, locale)}
                          <br />
                          {formatTime(result.startAt)} – {formatTime(result.endAt)}
                        </dd>
                      </div>
                      {result.options.length > 0 &&
                        result.options.map((o) => (
                          <div key={o.name} className="flex justify-between gap-4">
                            <dt className="text-ink-500">
                              {o.name}
                              {o.quantity > 1 && ` ×${o.quantity}`}
                            </dt>
                            <dd className="text-ink-100">+ {formatPrice(o.amount, locale)}</dd>
                          </div>
                        ))}
                      <div className="flex justify-between gap-4 border-t border-ink-800 pt-3">
                        <dt className="text-ink-500">{t('booking.totalPrice')}</dt>
                        <dd className="font-display text-base text-white">
                          {formatPrice(result.totalPrice, locale)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-500">{t('admin.status')}</dt>
                        <dd>
                          <Badge tone="warning">{t('admin.statusRequested')}</Badge>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-9 flex flex-wrap justify-center gap-3">
                    <ButtonLink to={lp('/')} variant="outline">
                      {t('booking.backHome')}
                    </ButtonLink>
                    <ButtonLink to={lp('/gallery')}>{t('nav.gallery')}</ButtonLink>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ================= 우측 : 요약 ================= */}
          {step !== 4 && (
            <aside className="surface sticky top-24 p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">
                {t('booking.summary')}
              </h3>

              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-xs text-ink-600">{t('admin.product')}</dt>
                  <dd className="mt-1 font-semibold text-white">
                    {product?.name ?? <span className="text-ink-700">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-600">{t('booking.stepDate')}</dt>
                  <dd className="mt-1 font-semibold text-white">
                    {dateKey ? formatDate(dateKey, locale) : <span className="text-ink-700">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-600">{t('booking.stepTime')}</dt>
                  <dd className="mt-1 font-semibold text-white">
                    {startAt ? (
                      `${formatTime(startAt)} (${t('common.minutes', { count: product?.durationMin ?? 0 })})`
                    ) : (
                      <span className="text-ink-700">—</span>
                    )}
                  </dd>
                </div>
              </dl>

              {product && (
                <div className="mt-6 space-y-2 border-t border-ink-800 pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500">{t('booking.basePrice')}</span>
                    <span className="text-ink-200">{formatProductPrice(product, locale, t)}</span>
                  </div>

                  {(product.options ?? [])
                    .filter((o) => (selectedOptions[o.id] ?? 0) > 0)
                    .map((o) => {
                      const qty = selectedOptions[o.id]
                      return (
                        <div key={o.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate text-ink-500">
                            {o.name}
                            {qty > 1 && ` ×${qty}`}
                          </span>
                          <span className="shrink-0 text-ink-200">
                            + {formatPrice(o.price * qty, locale)}
                          </span>
                        </div>
                      )
                    })}

                  <div className="flex items-end justify-between border-t border-ink-800 pt-4">
                    <span className="text-xs uppercase tracking-wider text-ink-500">
                      {t('booking.totalPrice')}
                    </span>
                    <span className="font-display text-xl tracking-tightest text-white">
                      {formatPrice(calcTotal(product, selectedOptions), locale)}
                    </span>
                  </div>
                </div>
              )}

              <p className="mt-5 text-[11px] leading-relaxed text-ink-600">
                {t('shooting.notice1')}
              </p>
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
