import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, isMockMode, ApiError } from '@/lib/api'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { formatDate, formatPrice } from '@/lib/utils'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Badge } from '@/components/ui/primitives'
import type { Booking, DailySlots } from '@/types'

/**
 * 고객용 예약 조회 · 취소 · 변경.
 *
 * <p>로그인이 없는 서비스라 **예약번호 + 이메일** 두 가지를 맞춰야 조회됩니다.
 * 예약번호만으로 남의 예약이 열리면 안 되므로 이메일이 사실상 비밀번호 역할을 합니다.
 * 검증은 서버가 합니다 — 여기서는 두 값을 그대로 넘길 뿐입니다.
 */
export default function MyBookingPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const lp = useLocalePath()

  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const mock = isMockMode()

  /** 완료·취소된 예약은 손댈 수 없습니다. 서버도 막지만 화면에서 미리 알려줍니다. */
  const changeable =
    booking !== null && booking.status !== 'CANCELED' && booking.status !== 'COMPLETED'

  const run = async (fn: () => Promise<Booking>, done?: string) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      setBooking(await fn())
      if (done) setNotice(done)
    } catch (err) {
      // 서버가 준 메시지를 그대로 보여줍니다. 조회 실패는 문구를 따로 씁니다 —
      // "찾을 수 없음" 을 원문 그대로 노출하면 예약 유무가 새어나갈 수 있습니다.
      setError(err instanceof ApiError ? err.message : t('myBooking.notFound'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-mh py-16 sm:py-24">
      <p className="eyebrow">{t('nav.booking')}</p>
      <h1 className="heading-lg mt-4 text-white">{t('myBooking.title')}</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-400">
        {t('myBooking.subtitle')}
      </p>

      {mock && (
        <p className="surface mt-8 border-brand-700/60 bg-brand-950/40 p-4 text-sm text-brand-200">
          {t('myBooking.mockNotice')}
        </p>
      )}

      {!booking ? (
        <form
          className="surface mt-8 max-w-lg space-y-5 p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault()
            if (mock) return
            void run(() => api.findBooking(code.trim(), email.trim(), locale))
          }}
        >
          <div>
            <label className="label" htmlFor="code">
              {t('myBooking.codeLabel')}
            </label>
            <input
              id="code"
              className="field"
              value={code}
              required
              autoComplete="off"
              placeholder={t('myBooking.codePlaceholder')}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="label" htmlFor="email">
              {t('myBooking.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              className="field"
              value={email}
              required
              autoComplete="email"
              placeholder={t('myBooking.emailPlaceholder')}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={busy || mock} size="lg" className="w-full">
            {busy ? t('myBooking.looking') : t('myBooking.lookup')}
          </Button>
        </form>
      ) : (
        <BookingDetail
          booking={booking}
          changeable={changeable}
          busy={busy}
          error={error}
          notice={notice}
          onCancel={(reason) =>
            run(
              () => api.cancelBooking(booking.bookingCode, { email: email.trim(), reason }, locale),
              t('myBooking.cancelDone'),
            )
          }
          onReschedule={(startAt) =>
            run(
              () =>
                api.rescheduleBooking(booking.bookingCode, { email: email.trim(), startAt }, locale),
              t('myBooking.rescheduleDone'),
            )
          }
          onReset={() => {
            setBooking(null)
            setError(null)
            setNotice(null)
          }}
        />
      )}

      <div className="mt-10">
        <ButtonLink to={lp('/shooting/booking')} variant="outline" size="sm">
          {t('booking.title')}
        </ButtonLink>
      </div>
    </div>
  )
}

/** 서버의 상태값 -> i18n 키. 화면에 원문(REQUESTED)이 그대로 나가지 않게 합니다. */
const STATUS_KEY: Record<Booking['status'], string> = {
  REQUESTED: 'admin.statusRequested',
  CONFIRMED: 'admin.statusConfirmed',
  COMPLETED: 'admin.statusCompleted',
  CANCELED: 'admin.statusCanceled',
}

function BookingDetail({
  booking,
  changeable,
  busy,
  error,
  notice,
  onCancel,
  onReschedule,
  onReset,
}: {
  booking: Booking
  changeable: boolean
  busy: boolean
  error: string | null
  notice: string | null
  onCancel: (reason?: string) => void
  onReschedule: (startAt: string) => void
  onReset: () => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()

  const [reason, setReason] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<DailySlots | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  const tone =
    booking.status === 'CANCELED' ? 'neutral' : booking.status === 'COMPLETED' ? 'neutral' : 'brand'

  return (
    <div className="mt-8 max-w-2xl space-y-6">
      {notice && (
        <p className="surface border-brand-700/60 bg-brand-950/40 p-4 text-sm text-brand-200">
          {notice}
        </p>
      )}
      {error && <p className="surface border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">{error}</p>}

      <div className="surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-xl tracking-tightest text-white">
            {booking.bookingCode}
          </span>
          <Badge tone={tone}>{t(STATUS_KEY[booking.status])}</Badge>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <Row label={t('myBooking.product')} value={booking.productName} />
          <Row
            label={t('myBooking.when')}
            value={`${formatDate(booking.startAt, locale)} · ${booking.startAt.slice(11, 16)}~${booking.endAt.slice(11, 16)}`}
          />
          <Row label={t('myBooking.reserver')} value={`${booking.name} · ${booking.maskedEmail}`} />
          <Row label={t('myBooking.amount')} value={formatPrice(booking.totalPrice, locale)} />
          {booking.memo && <Row label={t('myBooking.memo')} value={booking.memo} />}
        </dl>
      </div>

      {!changeable ? (
        <p className="text-sm text-ink-500">{t('myBooking.closedForChange')}</p>
      ) : (
        <>
          {/* ---- 날짜·시간 변경 ---- */}
          <div className="surface p-6 sm:p-8">
            <h2 className="font-display text-lg tracking-tightest text-white">
              {t('myBooking.rescheduleTitle')}
            </h2>
            <p className="mt-2 text-xs text-ink-500">{t('myBooking.rescheduleNote')}</p>

            {booking.productId === undefined ? (
              // 서버가 productId 를 아직 안 내려주는 버전. 가능 시간을 물어볼 수 없으므로
              // 억지로 입력받지 않고 안내만 합니다 — 아무 시간이나 받으면 대부분 거절당합니다.
              <p className="mt-5 text-sm text-ink-500">{t('myBooking.rescheduleUnavailable')}</p>
            ) : (
              <>
                <label className="label mt-5" htmlFor="newdate">
                  {t('myBooking.rescheduleDate')}
                </label>
                <input
                  id="newdate"
                  type="date"
                  className="field"
                  value={date}
                  onChange={(e) => {
                    const d = e.target.value
                    setDate(d)
                    setSlots(null)
                    if (!d) return
                    setLoadingSlots(true)
                    // 변경 가능한 시간은 서버가 정합니다 — 영업시간·휴무·찬 슬롯 모두 서버 판단입니다.
                    void api
                      .getDailySlots(booking.productId as number, d, locale)
                      .then(setSlots)
                      .catch(() => setSlots(null))
                      .finally(() => setLoadingSlots(false))
                  }}
                />
              </>
            )}

            {loadingSlots && <p className="mt-4 text-sm text-ink-500">{t('common.loading')}</p>}

            {slots && !slots.open && (
              <p className="mt-4 text-sm text-ink-500">{t('booking.closedDay')}</p>
            )}

            {slots?.open && (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.slots.map((s) => (
                  <button
                    key={s.startAt}
                    type="button"
                    disabled={!s.available || busy}
                    onClick={() => onReschedule(s.startAt)}
                    className="rounded-lg border border-ink-700 px-2 py-2 text-xs font-semibold text-ink-200 transition-colors enabled:hover:border-brand-500 enabled:hover:bg-brand-600 enabled:hover:text-white disabled:cursor-not-allowed disabled:text-ink-600"
                  >
                    {s.startAt.slice(11, 16)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- 취소 ---- */}
          <div className="surface p-6 sm:p-8">
            <h2 className="font-display text-lg tracking-tightest text-white">
              {t('myBooking.cancelTitle')}
            </h2>

            <label className="label mt-5" htmlFor="reason">
              {t('myBooking.cancelReason')}
            </label>
            <input
              id="reason"
              className="field"
              value={reason}
              maxLength={300}
              placeholder={t('myBooking.cancelReasonPlaceholder')}
              onChange={(e) => setReason(e.target.value)}
            />

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="mt-5"
              onClick={() => {
                // 되돌릴 수 없는 동작이라 한 번 더 묻습니다.
                if (window.confirm(t('myBooking.cancelConfirm'))) {
                  onCancel(reason.trim() || undefined)
                }
              }}
            >
              {t('myBooking.cancelSubmit')}
            </Button>
          </div>
        </>
      )}

      <button type="button" onClick={onReset} className="text-xs text-ink-400 hover:text-white">
        ← {t('myBooking.another')}
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-ink-800 pb-3 last:border-0">
      <dt className="w-28 shrink-0 text-ink-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-ink-100">{value}</dd>
    </div>
  )
}
