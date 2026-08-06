import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ADMIN_INQUIRIES } from '@/mocks/data'
import { cn, formatDate, formatTime } from '@/lib/utils'
import type { Inquiry, InquiryType } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader, DemoNotice } from './AdminLayout'

type Filter = 'ALL' | InquiryType

export default function AdminInquiriesPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<Inquiry[]>(ADMIN_INQUIRIES)
  const [filter, setFilter] = useState<Filter>('ALL')

  const filtered = useMemo(
    () => rows.filter((r) => (filter === 'ALL' ? true : r.type === filter)),
    [rows, filter],
  )

  const toggle = (id: number) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'PENDING' ? 'HANDLED' : 'PENDING' } : r,
      ),
    )

  const filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: t('common.all') },
    { key: 'INTERPRETER', label: t('interpreter.typeInterpreter') },
    { key: 'VIDEO', label: t('interpreter.typeVideo') },
  ]

  return (
    <>
      <AdminPageHeader title={t('admin.inquiries')} />
      <DemoNotice />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
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

      <div className="space-y-3">
        {filtered.map((row) => (
          <article key={row.id} className="surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={row.type === 'INTERPRETER' ? 'brand' : 'neutral'}>
                    {row.type === 'INTERPRETER'
                      ? t('interpreter.typeInterpreter')
                      : t('interpreter.typeVideo')}
                  </Badge>
                  <Badge tone="neutral">{row.locale.toUpperCase()}</Badge>
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
                  {row.status === 'PENDING' ? t('admin.inquiryPending') : t('admin.inquiryHandled')}
                </Badge>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-line rounded-lg bg-ink-950/60 p-4 text-sm leading-relaxed text-ink-200">
              {row.content}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-800 pt-4">
              <Button
                size="sm"
                variant={row.status === 'PENDING' ? 'primary' : 'outline'}
                onClick={() => toggle(row.id)}
              >
                {row.status === 'PENDING' ? t('admin.inquiryHandled') : t('admin.inquiryPending')}
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
    </>
  )
}
