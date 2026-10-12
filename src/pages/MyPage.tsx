import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { memberApi } from '@/lib/api'
import { useMemberAuth } from '@/store/memberAuth'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { formatDateTime, formatPrice } from '@/lib/utils'
import type { Booking } from '@/types'
import { Badge, EmptyBlock, LoadingBlock, PageHeader, Section } from '@/components/ui/primitives'
import { Button, ButtonLink } from '@/components/ui/Button'

const STATUS_KEY: Record<Booking['status'], string> = {
  REQUESTED: 'admin.statusRequested',
  CONFIRMED: 'admin.statusConfirmed',
  COMPLETED: 'admin.statusCompleted',
  CANCELED: 'admin.statusCanceled',
}

export default function MyPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const lp = useLocalePath()
  const navigate = useNavigate()
  const member = useMemberAuth((s) => s.member)
  const token = useMemberAuth((s) => s.token)
  const logout = useMemberAuth((s) => s.logout)

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', locale, token],
    queryFn: () => memberApi.getMyBookings(locale),
    enabled: !!token,
  })

  if (!token) return <Navigate to={lp('/login')} replace />

  const bookings = data ?? []

  return (
    <>
      <PageHeader eyebrow="MY PAGE" title={t('member.mypage')} />
      <Section>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-ink-800 pb-6">
          <div>
            <p className="font-display text-xl tracking-tight text-ink-50">
              {member?.name} {t('member.welcome')}
            </p>
            <p className="mt-1 text-sm text-ink-400">{member?.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout()
              navigate(lp('/'))
            }}
          >
            {t('member.logout')}
          </Button>
        </div>

        <h2 className="mb-5 font-display text-lg tracking-tight text-ink-50">
          {t('member.myBookings')}
        </h2>

        {isLoading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : bookings.length === 0 ? (
          <div className="space-y-5">
            <EmptyBlock label={t('member.noBookings')} />
            <div className="text-center">
              <ButtonLink to={lp('/shooting/booking')} size="sm">
                {t('member.goBooking')}
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.bookingCode} className="surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        b.status === 'CANCELED' || b.status === 'COMPLETED' ? 'neutral' : 'brand'
                      }
                    >
                      {t(STATUS_KEY[b.status])}
                    </Badge>
                    <span className="text-xs text-ink-500">{b.bookingCode}</span>
                  </div>
                  <span className="font-display text-lg tracking-tightest text-ink-50">
                    {formatPrice(b.totalPrice, locale)}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg tracking-tightest text-ink-50">
                  {b.productName}
                </h3>
                <p className="mt-1.5 text-sm text-ink-300">{formatDateTime(b.startAt, locale)}</p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-ink-600">
          {t('member.lookupHint')}{' '}
          <Link to={lp('/shooting/booking/lookup')} className="text-brand-500 hover:underline">
            {t('myBooking.title')}
          </Link>
        </p>
      </Section>
    </>
  )
}
