import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { cn, formatDate, formatTime } from '@/lib/utils'
import type { AdminInquiry, InquiryStatus } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'

type Filter = 'ALL' | InquiryStatus

export default function AdminInquiriesPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const filter = (params.get('status') as Filter) || 'ALL'
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data, loading, error: loadError, reload } = useAsync(
    () => adminApi.getInquiries({ status: filter === 'ALL' ? '' : filter, size: 50 }),
    [filter],
  )

  const rows = data?.content ?? []

  const toggle = async (row: AdminInquiry) => {
    setBusyId(row.id)
    setError(null)
    try {
      if (row.status === 'PENDING') {
        const memo = window.prompt('처리 메모 (선택)') ?? ''
        await adminApi.handleInquiry(row.id, memo)
      } else {
        await adminApi.reopenInquiry(row.id)
      }
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: t('common.all') },
    { key: 'PENDING', label: t('admin.inquiryPending') },
    { key: 'HANDLED', label: t('admin.inquiryHandled') },
  ]

  return (
    <>
      <AdminPageHeader
        title={t('admin.inquiries')}
        desc={data ? `전체 ${data.totalElements}건` : undefined}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => (f.key === 'ALL' ? setParams({}) : setParams({ status: f.key }))}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-bold transition-colors',
              filter === f.key
                ? 'border-brand-500 bg-brand-600 text-white'
                : 'border-ink-800 text-ink-400 hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300"
        >
          {error}
        </p>
      )}

      <AsyncBoundary
        loading={loading}
        error={loadError}
        empty={!loading && rows.length === 0}
        emptyText="조건에 맞는 문의가 없습니다."
        onRetry={reload}
      >
        {rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row) => (
              <article key={row.id} className="surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={row.type === 'INTERPRETER' ? 'brand' : 'neutral'}>
                        {row.type === 'INTERPRETER'
                          ? t('interpreter.typeInterpreter')
                          : t('interpreter.typeVideo')}
                      </Badge>
                      <Badge tone="neutral">{row.locale}</Badge>
                      <span className="text-sm font-semibold text-white">{row.name}</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-500">
                      {row.contact} · {row.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-600">
                      {formatDate(row.createdAt, 'ko')} {formatTime(row.createdAt)}
                    </span>
                    <Badge tone={row.status === 'PENDING' ? 'warning' : 'success'}>
                      {row.status === 'PENDING'
                        ? t('admin.inquiryPending')
                        : t('admin.inquiryHandled')}
                    </Badge>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line rounded-lg bg-ink-950/60 p-4 text-sm leading-relaxed text-ink-200">
                  {row.content}
                </p>

                {row.status === 'HANDLED' && (
                  <p className="mt-3 text-xs text-ink-500">
                    {row.handledAt && `${formatDate(row.handledAt, 'ko')} 처리`}
                    {row.handledBy && ` · ${row.handledBy}`}
                    {row.adminMemo && (
                      <span className="mt-1 block text-ink-400">메모: {row.adminMemo}</span>
                    )}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-800 pt-4">
                  <Button
                    size="sm"
                    variant={row.status === 'PENDING' ? 'primary' : 'outline'}
                    disabled={busyId === row.id}
                    onClick={() => void toggle(row)}
                  >
                    {row.status === 'PENDING'
                      ? t('admin.inquiryHandled')
                      : t('admin.inquiryPending')}
                  </Button>
                  <a
                    href={`mailto:${row.email}`}
                    className="inline-flex items-center rounded-full border border-ink-700 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-ink-300 transition-colors hover:border-brand-500 hover:text-white"
                  >
                    {t('footer.email')}
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}
