import { useTranslation } from 'react-i18next'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { daysUntil, formatDate } from '@/lib/utils'
import type { AdminCompetition } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'

/** 한국어 번역이 없으면 아무 번역이나 씁니다 — 관리자 화면은 비어 보이는 게 최악입니다. */
function pick(row: AdminCompetition) {
  return row.translations.find((tr) => tr.locale === 'KO') ?? row.translations[0]
}

export default function AdminSchedulePage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getCompetitions(), [])

  const rows = [...(data ?? [])].sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <>
      <AdminPageHeader
        title={t('admin.schedule')}
        desc={data ? `전체 ${data.length}건` : undefined}
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        empty={!loading && rows.length === 0}
        emptyText="등록된 대회 일정이 없습니다."
        onRetry={reload}
      >
        {rows.length > 0 && (
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-ink-800 text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">{t('schedule.country')}</th>
                  <th className="px-5 py-4 font-semibold">{t('schedule.title')}</th>
                  <th className="px-5 py-4 font-semibold">{t('admin.datetime')}</th>
                  <th className="px-5 py-4 font-semibold">{t('schedule.place')}</th>
                  <th className="px-5 py-4 font-semibold">공개</th>
                  <th className="px-5 py-4 font-semibold">JA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {rows.map((row) => {
                  const d = daysUntil(row.startDate)
                  const tr = pick(row)
                  const translated = !row.missingLocales.includes('JA')

                  return (
                    <tr key={row.id} className="transition-colors hover:bg-ink-800/40">
                      <td className="px-5 py-4">
                        <Badge tone={row.country === 'KR' ? 'brand' : 'neutral'}>
                          {row.country === 'KR' ? t('schedule.korea') : t('schedule.japan')}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{tr?.name ?? '—'}</div>
                        {tr?.host && <div className="mt-0.5 text-xs text-ink-500">{tr.host}</div>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-ink-200">
                        {formatDate(row.startDate, 'ko')}
                        <span className={`ml-2 text-xs ${d < 0 ? 'text-ink-600' : 'text-brand-400'}`}>
                          {d < 0
                            ? t('schedule.ended')
                            : d === 0
                              ? t('schedule.ddayToday')
                              : `D-${d}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-ink-300">{tr?.place ?? '—'}</td>
                      <td className="px-5 py-4">
                        <Badge tone={row.published ? 'success' : 'neutral'}>
                          {row.published ? '공개' : '비공개'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={translated ? 'success' : 'warning'}>
                          {translated ? t('admin.translated') : t('admin.jaMissing')}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}
